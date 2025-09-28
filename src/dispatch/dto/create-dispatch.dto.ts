import { IsString, IsNumber } from 'class-validator';

export class CreateDispatchDto {
  @IsString()
  orderId: string;

  @IsNumber()
  pickupLat: number;

  @IsNumber()
  pickupLng: number;

  // optional: preferred search radius meters
  @IsNumber()
  radiusMeters?: number;
}
