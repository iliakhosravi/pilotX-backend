import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Redis from 'ioredis';
import { Job, JobStatus } from './entities/job.entity';
import { DispatchGateway } from '../dispatch/dispatch.gateway';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<Job>,
    @Inject('REDIS') private readonly redis: Redis,
    private readonly gateway: DispatchGateway,
  ) {}

  // Fetch jobs for a driver (assigned/accepted/active)
  async getDriverJobs(driverId: string, status?: JobStatus) {
    const query: any = { driverId };
    if (status) query.status = status;
    // active statuses by default
    const defaultStatuses = [JobStatus.ASSIGNED, JobStatus.ACCEPTED, JobStatus.PICKED_UP];
    return this.jobModel.find(status ? query : { ...query, status: { $in: defaultStatuses } }).lean();
  }

  // Called by dispatch when assigning (or lazily on accept)
  async ensureJobExists(job: {
    jobId: string;
    orderId: string;
    driverId?: string;
    status?: JobStatus;
    pickup?: { lat: number; lng: number; address?: string };
    dropoff?: { lat: number; lng: number; address?: string };
    meta?: Record<string, any>;
  }) {
    await this.jobModel.updateOne(
      { jobId: job.jobId },
      {
        $setOnInsert: {
          jobId: job.jobId,
          orderId: job.orderId,
          status: job.status ?? JobStatus.ASSIGNED,
          pickup: job.pickup,
          dropoff: job.dropoff,
          meta: job.meta ?? {},
          driverId: job.driverId,
        },
      },
      { upsert: true },
    );
  }

  // Accept / Decline from driver
  async respondToJob(driverId: string, jobId: string, accept: boolean) {
    const job = await this.jobModel.findOne({ jobId });
    if (!job) throw new NotFoundException('Job not found');

    // Only ASSIGNED can be accepted/declined
    if (job.status !== JobStatus.ASSIGNED) {
      throw new BadRequestException(`Job is not in assignable state (current: ${job.status})`);
    }

    if (accept) {
      // lock already taken in dispatch; just persist result
      job.status = JobStatus.ACCEPTED;
      job.driverId = driverId;
      await job.save();

      // Mark driver unavailable (prevent double assignment) and clear any temp accept key
      await this.redis.del(`driver:${driverId}:available`);
      await this.redis.del(`driver:${driverId}:accept:${job.orderId}`);
      await this.redis.del(`driver:${driverId}:lock`);

      // notify (socket)
      this.gateway.sendJobToDriver(driverId, {
        type: 'job_update',
        jobId: job.jobId,
        status: job.status,
      });

      return { accepted: true };
    } else {
      // mark declined for this driver; optionally keep record that this driver declined
      job.status = JobStatus.DECLINED;
      job.driverId = driverId;
      await job.save();

      // free driver lock if any
      await this.redis.del(`driver:${driverId}:lock`);
      await this.redis.set(`driver:${driverId}:available`, '1');

      this.gateway.sendJobToDriver(driverId, {
        type: 'job_update',
        jobId: job.jobId,
        status: job.status,
      });

      return { accepted: false };
    }
  }

  // Update job state with allowed transitions
  async updateDriverJobStatus(driverId: string, jobId: string, next: JobStatus) {
    const job = await this.jobModel.findOne({ jobId, driverId });
    if (!job) throw new NotFoundException('Job not found for driver');

    const allowed = this.isAllowedTransition(job.status, next);
    if (!allowed) throw new BadRequestException(`Invalid transition ${job.status} -> ${next}`);

    job.status = next;
    await job.save();

    // Finalization: when delivered, free driver availability
    if (next === JobStatus.DELIVERED) {
      await this.redis.set(`driver:${driverId}:available`, '1');
      await this.redis.del(`driver:${driverId}:assignedJob`);
    }

    this.gateway.sendJobToDriver(driverId, {
      type: 'job_update',
      jobId: job.jobId,
      status: job.status,
    });

    return job.toObject();
  }

  private isAllowedTransition(current: JobStatus, next: JobStatus) {
    const graph: Record<JobStatus, JobStatus[]> = {
      [JobStatus.ASSIGNED]: [JobStatus.ACCEPTED, JobStatus.DECLINED, JobStatus.CANCELED],
      [JobStatus.ACCEPTED]: [JobStatus.PICKED_UP, JobStatus.CANCELED],
      [JobStatus.PICKED_UP]: [JobStatus.DELIVERED, JobStatus.CANCELED],
      [JobStatus.DELIVERED]: [],
      [JobStatus.DECLINED]: [],
      [JobStatus.CANCELED]: [],
    };
    return graph[current]?.includes(next);
  }
}
