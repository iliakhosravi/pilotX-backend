import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private conn: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);

  private readonly url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  
  constructor() {}

  async onModuleInit() {
    try {
      this.conn = await amqp.connect(this.url);
      this.channel = await this.conn.createChannel();
      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error.message);
      // Don't throw to allow the app to start without RabbitMQ
    }
  }

  async publish(queue: string, payload: any) {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not ready, skipping publish');
      return;
    }
    await this.channel.assertQueue(queue, { durable: true });
    const buf = Buffer.from(JSON.stringify(payload));
    // persistent messages
    this.channel.sendToQueue(queue, buf, { persistent: true });
  }

  async consume(queue: string, onMessage: (msg: amqp.ConsumeMessage) => Promise<void>) {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not ready, skipping consume setup');
      return;
    }
    await this.channel.assertQueue(queue, { durable: true });
    // prefetch recommended for fairness; consumer-side batching handled separately
    await this.channel.prefetch(100);
    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        await onMessage(msg);
        // manual ack inside onMessage (or we can ack here)
      } catch (err) {
        this.logger.error('Error processing message', err);
        // reject & requeue or dead-letter depending on strategy
        this.channel.nack(msg, false, false); // avoid requeueing indefinitely
      }
    }, { noAck: false });
  }

  ack(msg: amqp.ConsumeMessage) {
    if (this.channel) {
      this.channel.ack(msg);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.conn?.close();
    } catch { /* ignore */ }
  }
}
