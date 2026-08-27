import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WorkshopServiceModule } from './workshop-service.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkshopServiceModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors();
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
