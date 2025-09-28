import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { DriverJobRespondDto } from 'src/jobs/dto/driver-job-respond.dto';
import { UpdateJobStatusDto } from 'src/jobs/dto/update-job-status.dto';
import { JobStatus } from 'src/jobs/entities/job.entity';
import { JobsService } from 'src/jobs/jobs.service';

class AcceptDeclineDto {
  accept: boolean;
}

@Controller('drivers/:id/jobs')
export class DriversJobsController {
  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    private readonly jobs: JobsService,
  ) {}

  @Post(':orderId/respond')
  async respondToJob(
    @Param('id') driverId: string,
    @Param('orderId') orderId: string,
    @Body() body: AcceptDeclineDto,
  ) {
    const acceptKey = `driver:${driverId}:accept:${orderId}`;
    if (body.accept) {
      await this.redis.set(acceptKey, 'accepted', 'EX', 30); // expire after some time
      return { ok: true, accepted: true };
    } else {
      await this.redis.set(acceptKey, 'declined', 'EX', 30);
      return { ok: true, accepted: false };
    }
  }

  // GET /drivers/:id/jobs?status=accepted
  @Get()
  async listMyJobs(@Param('id') driverId: string, @Query('status') status?: JobStatus) {
    const jobs = await this.jobs.getDriverJobs(driverId, status as JobStatus);
    return { data: jobs };
  }

  // POST /drivers/:id/jobs/:jobId/respond { accept: true|false }
  @Post(':jobId/respond')
  async respond(
    @Param('id') driverId: string,
    @Param('jobId') jobId: string,
    @Body() body: DriverJobRespondDto,
  ) {
    return this.jobs.respondToJob(driverId, jobId, body.accept);
  }

  // PATCH /drivers/:id/jobs/:jobId/status { status: 'picked_up' | 'delivered' | ... }
  @Patch(':jobId/status')
  async updateStatus(
    @Param('id') driverId: string,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    const job = await this.jobs.updateDriverJobStatus(driverId, jobId, dto.status);
    return { data: job };
  }
}
