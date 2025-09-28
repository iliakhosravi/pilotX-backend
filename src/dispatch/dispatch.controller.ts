import { Body, Controller, Post } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatch: DispatchService) {}

  @Post('assign')
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
