import { Module } from '@nestjs/common';
import { DriversJobsController } from './drivers.jobs.controller';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [DriversJobsController],
})
export class DriversModule {}
