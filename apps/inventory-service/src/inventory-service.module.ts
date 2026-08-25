import { Module } from '@nestjs/common';
import { InventoryServiceController } from './inventory-service.controller';
import { InventoryServiceService } from './inventory-service.service';
import { RepuestosModule } from './repuestos/repuestos.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [RepuestosModule, PrismaModule],
  controllers: [InventoryServiceController],
  providers: [InventoryServiceService],
})
export class InventoryServiceModule {}
