import { Test, TestingModule } from '@nestjs/testing';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';

describe('DispatchController', () => {
  let controller: DispatchController;
  let dispatchService: DispatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatchController],
      providers: [
        {
          provide: DispatchService,
          useValue: {
            matchAndAssign: jest.fn().mockResolvedValue({ driverId: 'driver1', assigned: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<DispatchController>(DispatchController);
    dispatchService = module.get<DispatchService>(DispatchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
