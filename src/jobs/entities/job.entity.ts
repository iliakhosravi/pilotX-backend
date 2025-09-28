import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum JobStatus {
  ASSIGNED = 'assigned',   // pushed to driver, awaiting accept
  ACCEPTED = 'accepted',   // driver accepted
  PICKED_UP = 'picked_up',
  DELIVERED = 'delivered',
  DECLINED = 'declined',   // this driver declined
  CANCELED = 'canceled',
}

@Schema({ timestamps: true })
export class Job extends Document {
  @Prop({ required: true, unique: true })
  jobId: string; // e.g., "job:ORDER123"

  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ index: true })
  driverId?: string; // assigned driver (if assigned)

  @Prop({ enum: JobStatus, required: true, index: true })
  status: JobStatus;

  @Prop({ type: Object })
  pickup?: { lat: number; lng: number; address?: string };

  @Prop({ type: Object })
  dropoff?: { lat: number; lng: number; address?: string };

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ orderId: 1 });
