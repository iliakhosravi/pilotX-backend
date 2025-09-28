import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ImportOrderDto } from './dto/import-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  async importOrder(dto: ImportOrderDto): Promise<Order> {
    // Idempotency check (orderId + storeType)
    const existing = await this.orderModel.findOne({
      orderId: dto.orderId,
      storeType: dto.storeType,
    });

    if (existing) {
      throw new ConflictException('Order already exists (idempotency check).');
    }

    const newOrder = new this.orderModel(dto);
    return newOrder.save();
  }
}
