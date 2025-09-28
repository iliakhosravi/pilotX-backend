// Test for Orders Service (Q1)

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './order.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './entities/order.entity';
import { ConflictException } from '@nestjs/common';

const mockOrderModel = {
  findOne: jest.fn(),
  save: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: Object.assign(
            jest.fn().mockImplementation((dto) => ({
              ...dto,
              save: mockOrderModel.save,
            })),
            {
              findOne: mockOrderModel.findOne,
            }
          ),
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should insert new order if not exists', async () => {
    mockOrderModel.findOne.mockResolvedValue(null);
    mockOrderModel.save.mockResolvedValue({ orderId: 'O1', storeType: 'shopify' });

    const dto = { orderId: 'O1', storeType: 'shopify', customerName: 'A', customerEmail: 'a@x.com', totalAmount: 10, currency: 'CAD' };
    const result = await service.importOrder(dto as any);
    expect(result.orderId).toBe('O1');
  });

  it('should throw conflict on duplicate', async () => {
    mockOrderModel.findOne.mockResolvedValue({ orderId: 'O1' });
    const dto = { orderId: 'O1', storeType: 'shopify' };
    await expect(service.importOrder(dto as any)).rejects.toThrow(ConflictException);
  });
});
