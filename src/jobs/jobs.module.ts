import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './entities/job.entity';
import { JobsService } from './jobs.service';
import { RedisModule } from '../redis/redis.module';
import { DispatchGateway } from '../dispatch/dispatch.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    RedisModule,
  ],
  providers: [JobsService, DispatchGateway],
  exports: [JobsService],
})
export class JobsModule {}
