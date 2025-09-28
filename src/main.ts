import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Pilot X Backend API')
    .setDescription('API for Pilot X delivery dispatch system')
    .setVersion('1.0')
    .addTag('orders', 'Order management and import operations')
    .addTag('dispatch', 'Driver dispatch and assignment operations')
    .addTag('drivers', 'Driver location and availability management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
