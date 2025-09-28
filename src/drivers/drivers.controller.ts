import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import Redis from 'ioredis';
import { IsNumber, IsBoolean } from 'class-validator';

class UpdateLocationDto {
  @ApiProperty({ description: 'Driver latitude', example: 37.7749 })
  @IsNumber() lat: number;
  
  @ApiProperty({ description: 'Driver longitude', example: -122.4194 })
  @IsNumber() lng: number;
}

class UpdateAvailabilityDto {
  @ApiProperty({ description: 'Driver availability status', example: true })
  @IsBoolean() available: boolean;
}

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  @Patch('location')
  @ApiOperation({ 
    summary: 'Update driver location',
    description: 'Updates the geographical location of the authenticated driver for dispatch matching'
  })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Location updated successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async updateLocation(
    @Req() req: Request & { user: { driverId: string } },
    @Body() body: UpdateLocationDto
  ) {
    const driverId = req.user.driverId;
    // Use Redis GEOADD to store driver location (key: drivers:locations)
    await this.redis.geoadd('drivers:locations', body.lng, body.lat, driverId);
    // Also set a TTL'd key marking last-seen timestamp (optional)
    await this.redis.hset(`driver:${driverId}`, 'lat', body.lat.toString(), 'lng', body.lng.toString());
    await this.redis.expire(`driver:${driverId}`, 60); // expire if driver goes offline
    return { ok: true };
  }

  @Patch('availability')
  @ApiOperation({ 
    summary: 'Update driver availability',
    description: 'Sets whether the authenticated driver is available to accept new orders'
  })
  @ApiBody({ type: UpdateAvailabilityDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Availability updated successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async updateAvailability(
    @Req() req: Request & { user: { driverId: string } },
    @Body() body: UpdateAvailabilityDto
  ) {
    const driverId = req.user.driverId;
    // available: set "driver:{id}:available" to '1' or '0'
    if (body.available) {
      await this.redis.set(`driver:${driverId}:available`, '1');
    } else {
      await this.redis.del(`driver:${driverId}:available`);
    }
    // Optionally set timestamp
    await this.redis.hset(`driver:${driverId}`, 'availableAt', Date.now().toString());
    return { ok: true };
  }
}


// Driver apps should call /drivers/location frequently (throttled), update availability when they go on/off shift or accept a job.
// Authentication required - driver ID comes from JWT token for security.
// We use Redis GEO (drivers:locations) for fast radius queries.