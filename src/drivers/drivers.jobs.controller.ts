import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { DriverJobRespondDto } from 'src/jobs/dto/driver-job-respond.dto';
import { UpdateJobStatusDto } from 'src/jobs/dto/update-job-status.dto';
import { JobStatus } from 'src/jobs/entities/job.entity';
import { JobsService } from 'src/jobs/jobs.service';

class AcceptDeclineDto {
  accept: boolean;
}

@Controller('drivers/jobs')
@UseGuards(JwtAuthGuard)
export class DriversJobsController {
  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    private readonly jobs: JobsService,
  ) {}

  @Post(':orderId/respond')
  async respondToJob(
    @Req() req: Request & { user: { driverId: string } },
    @Param('orderId') orderId: string,
    @Body() body: AcceptDeclineDto,
  ) {
    const driverId = req.user.driverId;
    const acceptKey = `driver:${driverId}:accept:${orderId}`;
    if (body.accept) {
      await this.redis.set(acceptKey, 'accepted', 'EX', 30); // expire after some time
      return { ok: true, accepted: true };
    } else {
      await this.redis.set(acceptKey, 'declined', 'EX', 30);
      return { ok: true, accepted: false };
    }
  }

  // GET /drivers/jobs?status=accepted
  @Get()
  async listMyJobs(
    @Req() req: Request & { user: { driverId: string } },
    @Query('status') status?: JobStatus
  ) {
    const driverId = req.user.driverId;
    const jobs = await this.jobs.getDriverJobs(driverId, status as JobStatus);
    return { data: jobs };
  }

  // POST /drivers/jobs/:jobId/respond { accept: true|false }
  @Post(':jobId/respond')
  async respond(
    @Req() req: Request & { user: { driverId: string } },
    @Param('jobId') jobId: string,
    @Body() body: DriverJobRespondDto,
  ) {
    const driverId = req.user.driverId;
    return this.jobs.respondToJob(driverId, jobId, body.accept);
  }

  // PATCH /drivers/jobs/:jobId/status { status: 'picked_up' | 'delivered' | ... }
  @Patch(':jobId/status')
  async updateStatus(
    @Req() req: Request & { user: { driverId: string } },
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    const driverId = req.user.driverId;
    const job = await this.jobs.updateDriverJobStatus(driverId, jobId, dto.status);
    return { data: job };
  }
}
