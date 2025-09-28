import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './order.controller';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let rabbitMQService: RabbitMQService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: RabbitMQService,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
            consume: jest.fn().mockResolvedValue(undefined),
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
