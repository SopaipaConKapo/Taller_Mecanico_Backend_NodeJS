import { Controller, Get } from '@nestjs/common';
import { WorkshopServiceService } from './workshop-service.service';

@Controller()
export class WorkshopServiceController {
  constructor(private readonly workshopServiceService: WorkshopServiceService) {}

  @Get()
  getHello(): string {
    return this.workshopServiceService.getHello();
  }
}
