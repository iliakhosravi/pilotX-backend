import { Test, TestingModule } from '@nestjs/testing';
import { DriversController } from './drivers.controller';

describe('DriversController', () => {
  let controller: DriversController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriversController],
      providers: [
        {
          provide: 'REDIS',
          useValue: {
            geoadd: jest.fn().mockResolvedValue(1),
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue(null),
            del: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    controller = module.get<DriversController>(DriversController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
