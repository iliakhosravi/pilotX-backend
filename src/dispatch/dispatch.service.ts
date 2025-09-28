import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { DispatchGateway } from './dispatch.gateway';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);
  private readonly DRIVERS_LOCATION_KEY = 'drivers:locations';
  private readonly DRIVER_AVAILABLE_KEY_PREFIX = 'driver:'; // driver:{id}:available
  private readonly DRIVER_LOCK_TTL_MS = 30_000; // lock TTL while waiting for accept
  private readonly ACCEPT_TIMEOUT_MS = 20_000; // how long to wait for driver to accept

  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    private readonly gateway: DispatchGateway,
  ) {}

  /**
   * Find nearest available driver and assign the job.
   * Returns assignedDriverId or null.
   */
  async matchAndAssign(order: {
    orderId: string;
    pickupLat: number;
    pickupLng: number;
    radiusMeters?: number;
  }): Promise<{ driverId: string | null; reason?: string }> {
    const radius = order.radiusMeters || 5000; // default 5km

    // 1. Query Redis GEO for nearest drivers (with distances)
    // Cast the result to the expected type to resolve TypeScript errors.
    const raw = (await this.redis.sendCommand('GEORADIUS', [
      this.DRIVERS_LOCATION_KEY,
      order.pickupLng.toString(),
      order.pickupLat.toString(),
      radius.toString(),
      'm',
      'WITHDIST',
      'ASC',
      'COUNT',
      '20',
    ])) as string[][];

    if (!raw || raw.length === 0) {
      return { driverId: null, reason: 'no-drivers-in-radius' };
    }

    // raw: array of [member, dist] items
    for (const item of raw) {
      // TypeScript now knows `item` is a string array.
      const driverId = item[0];
      const distanceMeters = parseFloat(item[1]);

      // 2. Check availability flag (fast key)
      const available = await this.redis.get(`driver:${driverId}:available`);
      if (!available) continue; // driver not available

      // 3. Try to atomically claim a driver lock using SET with NX and PX
      // This is the correct syntax for a SET command with multiple options.
      const lockKey = `driver:${driverId}:lock`;
      const lockAcquired = await this.redis.set(
        lockKey,
        order.orderId,
        'PX',
        this.DRIVER_LOCK_TTL_MS,
        'NX'
      );

      if (!lockAcquired) {
        // Someone else is racing for this driver
        continue;
      }

      // 4. We have tentatively claimed the driver — send job via WebSocket
      const job = {
        jobId: `job:${order.orderId}`,
        orderId: order.orderId,
        pickup: { lat: order.pickupLat, lng: order.pickupLng },
        assignedAt: Date.now(),
        distanceMeters,
      };

      const pushed = this.gateway.sendJobToDriver(driverId, job);
      if (!pushed) {
        // Driver not connected — release lock and continue
        await this.redis.del(lockKey);
        continue;
      }

      // 5. Wait for accept/decline
      const acceptKey = `driver:${driverId}:accept:${order.orderId}`;

      const accepted = await this.waitForDriverResponse(acceptKey, this.ACCEPT_TIMEOUT_MS);

      if (accepted === 'accepted') {
        // Finalize assignment
        await this.redis.set(`driver:${driverId}:assignedJob`, order.orderId);
        await this.redis.del(`driver:${driverId}:available`);
        await this.redis.del(lockKey);
        return { driverId };
      } else {
        // Driver declined or timeout: cleanup and continue with the next candidate
        await this.redis.del(lockKey);
        await this.redis.del(acceptKey);
        continue;
      }
    }

    // No driver could be assigned
    return { driverId: null, reason: 'no-claimable-drivers' };
  }

  private async waitForDriverResponse(key: string, timeoutMs: number): Promise<'accepted' | 'declined' | 'timeout'> {
    const interval = 250;
    const maxTries = Math.ceil(timeoutMs / interval);
    for (let i = 0; i < maxTries; i++) {
      const val = await this.redis.get(key);
      if (val === 'accepted') return 'accepted';
      if (val === 'declined') return 'declined';
      await new Promise((r) => setTimeout(r, interval));
    }
    return 'timeout';
  }
}