import { Module, Global, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () => {
        const logger = new Logger('RedisModule');
        try {
          const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: 3,
            lazyConnect: true,

          });
          
          redis.on('error', (err) => {
            logger.error('Redis connection error:', err.message);
          });
          
          redis.on('connect', () => {
            logger.log('Connected to Redis');
          });
          
          return redis;
        } catch (error) {
          logger.error('Failed to initialize Redis:', error.message);
          // Return a mock Redis client that does nothing
          return {
            get: () => Promise.resolve(null),
            set: () => Promise.resolve('OK'),
            del: () => Promise.resolve(1),
            exists: () => Promise.resolve(0),
            expire: () => Promise.resolve(1),
          };
        }
      },
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
