import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ImportOrderDto } from './dto/import-order.dto';

@ApiTags('orders')
@Controller('import-orders')
export class OrdersController {
  private readonly QUEUE = process.env.ORDERS_QUEUE || 'orders_import_queue';

  constructor(private readonly rabbit: RabbitMQService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ 
    summary: 'Import order from e-commerce platform',
    description: 'Accepts order data from various e-commerce platforms and queues it for processing'
  })
  @ApiBody({ 
    type: ImportOrderDto,
    description: 'Order data to import'
  })
  @ApiResponse({ 
    status: 202, 
    description: 'Order accepted and queued for processing',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        accepted: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid order data' 
  })
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
