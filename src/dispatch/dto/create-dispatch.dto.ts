import { IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDispatchDto {
  @ApiProperty({ description: 'Order ID to assign to a driver', example: 'ORDER-12345' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Pickup location latitude', example: 37.7749 })
  @IsNumber()
  pickupLat: number;

  @ApiProperty({ description: 'Pickup location longitude', example: -122.4194 })
  @IsNumber()
  pickupLng: number;

  @ApiPropertyOptional({ 
    description: 'Search radius in meters for finding available drivers', 
    example: 5000,
    default: 5000
  })
  @IsNumber()
  radiusMeters?: number;
}
