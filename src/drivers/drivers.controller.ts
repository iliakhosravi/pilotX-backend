import { Body, Controller, Param, Patch } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiProperty } from '@nestjs/swagger';
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
@Controller('drivers')
export class DriversController {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  @Patch(':id/location')
  @ApiOperation({ 
    summary: 'Update driver location',
    description: 'Updates the geographical location of a driver for dispatch matching'
  })
  @ApiParam({ name: 'id', description: 'Driver ID' })
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
  async updateLocation(@Param('id') driverId: string, @Body() body: UpdateLocationDto) {
    // Use Redis GEOADD to store driver location (key: drivers:locations)
    await this.redis.geoadd('drivers:locations', body.lng, body.lat, driverId);
    // Also set a TTL'd key marking last-seen timestamp (optional)
    await this.redis.hset(`driver:${driverId}`, 'lat', body.lat.toString(), 'lng', body.lng.toString());
    await this.redis.expire(`driver:${driverId}`, 60); // expire if driver goes offline
    return { ok: true };
  }

  @Patch(':id/availability')
  @ApiOperation({ 
    summary: 'Update driver availability',
    description: 'Sets whether a driver is available to accept new orders'
  })
  @ApiParam({ name: 'id', description: 'Driver ID' })
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
  async updateAvailability(@Param('id') driverId: string, @Body() body: UpdateAvailabilityDto) {
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


// Driver apps should call /drivers/:id/location frequently (throttled), update availability when they go on/off shift or accept a job.

// We use Redis GEO (drivers:locations) for fast radius queries.