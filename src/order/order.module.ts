import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './order.controller';
import { OrdersService } from './order.service';
import { Order, OrderSchema } from './entities/order.entity';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { OrdersWorker } from './orders.worker';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
  controllers: [OrdersController],
  providers: [RabbitMQService, OrdersWorker],
})
export class OrderModule {}
