import { NestFactory } from '@nestjs/core';
import { WorkshopServiceModule } from './workshop-service.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkshopServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
