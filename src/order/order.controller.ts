import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ImportOrderDto } from './dto/import-order.dto';

@Controller('import-orders')
export class OrdersController {
  private readonly QUEUE = process.env.ORDERS_QUEUE || 'orders_import_queue';

  constructor(private readonly rabbit: RabbitMQService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED) // fast response
  async importOrder(@Body() dto: ImportOrderDto) {
    // Basic validation happens via DTOs + class-validator in Nest pipeline
    // Publish to queue for asynchronous processing
    await this.rabbit.publish(this.QUEUE, {
      receivedAt: new Date().toISOString(),
      payload: dto,
    });

    return { success: true, accepted: true };
  }
}



// import { Body, Controller, Post } from '@nestjs/common';
// import { OrdersService } from './order.service';
// import { ImportOrderDto } from './dto/import-order.dto';

// @Controller('import-orders')
// export class OrdersController {
//   constructor(private readonly ordersService: OrdersService) {}

//   @Post()
//   async importOrder(@Body() dto: ImportOrderDto) {
//     const order = await this.ordersService.importOrder(dto);
//     return {
//       success: true,
//       data: order,
//     };
//   }
// }
