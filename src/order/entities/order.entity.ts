import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  storeType: string;

  @Prop()
  customerName: string;

  @Prop()
  customerEmail: string;

  @Prop()
  totalAmount: number;

  @Prop()
  currency: string;

  @Prop({ type: [{ sku: String, name: String, quantity: Number, price: Number }] })
  items: Record<string, any>[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// ensure compound unique index for idempotency at DB level
OrderSchema.index({ orderId: 1, storeType: 1 }, { unique: true });
