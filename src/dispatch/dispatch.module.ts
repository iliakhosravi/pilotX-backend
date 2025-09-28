import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DispatchGateway } from './dispatch.gateway';
import { DispatchController } from './dispatch.controller';
import { RedisModule } from '../redis/redis.module';
import { DriversController } from '../drivers/drivers.controller';
import { DriversJobsController } from '../drivers/drivers.jobs.controller';

@Module({
  imports: [RedisModule],
  providers: [DispatchService, DispatchGateway],
  controllers: [DispatchController, DriversController, DriversJobsController],
})
export class DispatchModule {}
