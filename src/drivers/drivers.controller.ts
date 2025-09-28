import { Body, Controller, Param, Patch } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { IsNumber, IsBoolean } from 'class-validator';

class UpdateLocationDto {
  @IsNumber() lat: number;
  @IsNumber() lng: number;
}

class UpdateAvailabilityDto {
  @IsBoolean() available: boolean;
}

@Controller('drivers')
export class DriversController {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  // Drivers call this frequently (every few seconds)
  @Patch(':id/location')
  async updateLocation(@Param('id') driverId: string, @Body() body: UpdateLocationDto) {
    // Use Redis GEOADD to store driver location (key: drivers:locations)
    await this.redis.geoadd('drivers:locations', body.lng, body.lat, driverId);
    // Also set a TTL'd key marking last-seen timestamp (optional)
    await this.redis.hset(`driver:${driverId}`, 'lat', body.lat.toString(), 'lng', body.lng.toString());
    await this.redis.expire(`driver:${driverId}`, 60); // expire if driver goes offline
    return { ok: true };
  }

  @Patch(':id/availability')
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