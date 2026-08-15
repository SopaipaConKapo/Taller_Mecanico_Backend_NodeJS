import { Module } from '@nestjs/common';
import { WorkshopServiceController } from './workshop-service.controller';
import { WorkshopServiceService } from './workshop-service.service';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { OrdenesTrabajoModule } from './ordenes-trabajo/ordenes-trabajo.module';

@Module({
  imports: [VehiculosModule, OrdenesTrabajoModule],
  controllers: [WorkshopServiceController],
  providers: [WorkshopServiceService],
})
export class WorkshopServiceModule {}
