import { Module } from '@nestjs/common';
import { WorkshopServiceController } from './workshop-service.controller';
import { WorkshopServiceService } from './workshop-service.service';

@Module({
  imports: [],
  controllers: [WorkshopServiceController],
  providers: [WorkshopServiceService],
})
export class WorkshopServiceModule {}
