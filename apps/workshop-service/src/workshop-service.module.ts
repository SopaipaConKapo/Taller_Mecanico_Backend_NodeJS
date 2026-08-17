import { Module } from '@nestjs/common';
import { WorkshopServiceController } from './workshop-service.controller';
import { WorkshopServiceService } from './workshop-service.service';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { OrdenesTrabajoModule } from './ordenes-trabajo/ordenes-trabajo.module';
import { PrismaModule } from './prisma/prisma.module';
import { FacturacionModule } from './facturacion/facturacion.module';

@Module({
  imports: [
    PrismaModule,
    OrdenesTrabajoModule,
    VehiculosModule,
    FacturacionModule,
  ],
  controllers: [WorkshopServiceController],
  providers: [WorkshopServiceService],
})
export class WorkshopServiceModule {}
