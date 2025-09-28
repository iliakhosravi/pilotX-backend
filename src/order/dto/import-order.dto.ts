import { IsString, IsNumber, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum StoreType {
  SHOPIFY = 'shopify',
  WOOCOMMERCE = 'woocommerce',
}

class ItemDto {
  @IsString() sku: string;
  @IsString() name: string;
  @IsNumber() quantity: number;
  @IsNumber() price: number;
}

export class ImportOrderDto {
  @IsString() orderId: string;
  @IsEnum(StoreType) storeType: StoreType;
  @IsString() customerName: string;
  @IsString() customerEmail: string;
  @IsNumber() totalAmount: number;
  @IsString() currency: string;

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
