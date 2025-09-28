import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './order/order.module';
import { DispatchGateway } from './dispatch/dispatch.gateway';
import { DispatchController } from './dispatch/dispatch.controller';
import { DispatchService } from './dispatch/dispatch.service';
import { DriversModule } from './drivers/drivers.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/piloX'),
    OrderModule, 
    DriversModule, 
    DispatchModule, 
    JobsModule
  ],
  controllers: [AppController, DispatchController],
  providers: [AppService, DispatchGateway, DispatchService],
})
export class AppModule {}
