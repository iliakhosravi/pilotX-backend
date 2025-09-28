import { JobsService } from './jobs.service';
import { JobStatus } from './entities/job.entity';

// // Test for Jobs Service (Q4)

const jobModelMock = {
  findOne: jest.fn(),
  find: jest.fn(),
  updateOne: jest.fn(),
};
const redisMock: any = {
  del: jest.fn(),
  set: jest.fn(),
};
const gatewayMock: any = {
  sendJobToDriver: jest.fn(),
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(() => {
    service = new JobsService(jobModelMock as any, redisMock, gatewayMock);
    jest.clearAllMocks();
  });

  it('should throw if job not found on respond', async () => {
    jobModelMock.findOne.mockResolvedValue(null);
    await expect(service.respondToJob('D1', 'job1', true)).rejects.toThrow();
  });

  it('should accept job if ASSIGNED', async () => {
    jobModelMock.findOne.mockResolvedValue({ jobId: 'job1', status: JobStatus.ASSIGNED, save: jest.fn() });
    const res = await service.respondToJob('D1', 'job1', true);
    expect(res.accepted).toBe(true);
  });

  it('should decline job if ASSIGNED', async () => {
    jobModelMock.findOne.mockResolvedValue({ jobId: 'job1', status: JobStatus.ASSIGNED, save: jest.fn() });
    const res = await service.respondToJob('D1', 'job1', false);
    expect(res.accepted).toBe(false);
  });
});
