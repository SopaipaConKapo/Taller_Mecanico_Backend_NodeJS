import { Module } from '@nestjs/common';
import { RepuestosService } from './repuestos.service';
import { RepuestosController } from './repuestos.controller';

@Module({
  providers: [RepuestosService],
  controllers: [RepuestosController]
})
export class RepuestosModule {}
