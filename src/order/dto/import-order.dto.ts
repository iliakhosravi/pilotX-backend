import { IsString, IsNumber, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StoreType {
  SHOPIFY = 'shopify',
  WOOCOMMERCE = 'woocommerce',
}

class ItemDto {
  @ApiProperty({ description: 'Product SKU', example: 'PROD-001' })
  @IsString() sku: string;
  
  @ApiProperty({ description: 'Product name', example: 'Premium Coffee Beans' })
  @IsString() name: string;
  
  @ApiProperty({ description: 'Quantity ordered', example: 2 })
  @IsNumber() quantity: number;
  
  @ApiProperty({ description: 'Unit price', example: 15.99 })
  @IsNumber() price: number;
}

export class ImportOrderDto {
  @ApiProperty({ description: 'Unique order identifier from the e-commerce platform', example: 'ORDER-12345' })
  @IsString() orderId: string;
  
  @ApiProperty({ enum: StoreType, description: 'Type of e-commerce platform', example: StoreType.SHOPIFY })
  @IsEnum(StoreType) storeType: StoreType;
  
  @ApiProperty({ description: 'Customer full name', example: 'John Doe' })
  @IsString() customerName: string;
  
  @ApiProperty({ description: 'Customer email address', example: 'john.doe@example.com' })
  @IsString() customerEmail: string;
  
  @ApiProperty({ description: 'Total order amount', example: 31.98 })
  @IsNumber() totalAmount: number;
  
  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString() currency: string;

  @ApiPropertyOptional({ 
    type: [ItemDto], 
    description: 'List of items in the order',
    example: [{ sku: 'PROD-001', name: 'Premium Coffee Beans', quantity: 2, price: 15.99 }]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items?: ItemDto[];
}



// import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

// export enum StoreType {
//   SHOPIFY = 'shopify',
//   WOOCOMMERCE = 'woocommerce',
// }

// export class ImportOrderDto {
//   @IsString()
//   orderId: string;

//   @IsEnum(StoreType)
//   storeType: StoreType;

//   @IsString()
//   customerName: string;

//   @IsString()
//   customerEmail: string;

//   @IsNumber()
//   totalAmount: number;

//   @IsString()
//   currency: string;

//   @IsOptional()
//   items?: Array<{ sku: string; name: string; quantity: number; price: number }>;
// }
