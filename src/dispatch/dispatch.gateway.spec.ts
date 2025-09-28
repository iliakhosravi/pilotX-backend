import { Test, TestingModule } from '@nestjs/testing';
import { DispatchGateway } from './dispatch.gateway';

describe('DispatchGateway', () => {
  let gateway: DispatchGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DispatchGateway],
    }).compile();

    gateway = module.get<DispatchGateway>(DispatchGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
