import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';

@ApiTags('dispatch')
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatch: DispatchService) {}

  @Post('assign')
  @ApiOperation({ 
    summary: 'Assign driver to order',
    description: 'Finds the nearest available driver and assigns them to the order'
  })
  @ApiBody({ 
    type: CreateDispatchDto,
    description: 'Order dispatch information including pickup location'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Driver assignment result',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            assigned: { type: 'boolean', example: true },
            driverId: { type: 'string', example: 'driver123' }
          }
        },
        {
          type: 'object',
          properties: {
            assigned: { type: 'boolean', example: false },
            reason: { type: 'string', example: 'No drivers available in radius' }
          }
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid dispatch data' 
  })
  async assign(@Body() dto: CreateDispatchDto) {
    const res = await this.dispatch.matchAndAssign({
      orderId: dto.orderId,
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      radiusMeters: dto.radiusMeters,
    });

    if (res.driverId) {
      return { assigned: true, driverId: res.driverId };
    } else {
      return { assigned: false, reason: res.reason };
    }
  }
}
