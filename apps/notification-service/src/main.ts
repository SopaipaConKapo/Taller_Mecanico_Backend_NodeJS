import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672'],
        queue: 'notifications_queue',
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  await app.listen();
  console.log('Notification Service is listening for events...');
}
bootstrap();
