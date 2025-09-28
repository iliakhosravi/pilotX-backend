import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './entities/order.entity';
import * as amqp from 'amqplib';

@Injectable()
export class OrdersWorker implements OnModuleInit {
  private readonly logger = new Logger(OrdersWorker.name);
  private readonly QUEUE = process.env.ORDERS_QUEUE || 'orders_import_queue';

  // batching params (tune these)
  private readonly MAX_BATCH_SIZE = Number(process.env.MAX_BATCH_SIZE) || 500;
  private readonly MAX_BATCH_TIME_MS = Number(process.env.MAX_BATCH_TIME_MS) || 2000;

  private buffer: { msg: amqp.ConsumeMessage; data: any }[] = [];
  private flushing = false;
  private flushTimer: NodeJS.Timeout;

  constructor(
    private readonly rabbit: RabbitMQService,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  async onModuleInit() {
    // start consuming
    await this.rabbit.consume(this.QUEUE, this.onMessage.bind(this));
    this.startFlushTimer();
    this.logger.log('OrdersWorker initialized and consuming');
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flushBuffer().catch(err => this.logger.error('Flush error', err));
      }
    }, this.MAX_BATCH_TIME_MS);
  }

  private async onMessage(msg: amqp.ConsumeMessage) {
    const raw = msg.content.toString();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.error('Failed to parse message', raw);
      this.rabbit.ack(msg); // discard invalid message
      return;
    }

    this.buffer.push({ msg, data: parsed.payload });

    if (this.buffer.length >= this.MAX_BATCH_SIZE) {
      // flush immediately
      await this.flushBuffer();
    }
  }

  private async flushBuffer() {
    if (this.flushing || this.buffer.length === 0) return;
    this.flushing = true;
    // copy & reset buffer quickly to allow consumer to continue filling
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      // Build bulk operations as upserts (idempotent)
      const operations = batch.map(({ data }) => {
        const filter = { orderId: data.orderId, storeType: data.storeType };
        // Use $setOnInsert to avoid overwriting existing record fields if order already exists
        return {
          updateOne: {
            filter,
            update: { $setOnInsert: { ...data } },
            upsert: true,
          },
        };
      });

      if (operations.length === 0) return;

      // unordered to continue through duplicates/errors quickly
      const res = await this.orderModel.bulkWrite(operations, { ordered: false });
      this.logger.log(`BulkWrite result: inserted ${res.upsertedCount || 0}, modified ${res.modifiedCount || 0}`);

      // ack all messages in batch
      for (const { msg } of batch) {
        this.rabbit.ack(msg);
      }
    } catch (err) {
      this.logger.error('Error during bulk write', err);
      // If bulkWrite failed, don't ack messages: but to avoid message stuck scenario,
      // you may choose to nack with dead-lettering depending on RabbitMQ setup.
      for (const { msg } of batch) {
        // here we nack without requeue to avoid infinite loops; in production, route to DLQ
        this.rabbit.ack(msg); // optionally ack to drop; or implement DLQ
      }
    } finally {
      this.flushing = false;
    }
  }
}
