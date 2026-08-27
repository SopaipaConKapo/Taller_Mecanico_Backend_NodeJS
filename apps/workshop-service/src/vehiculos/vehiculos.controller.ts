import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  create(
    @Body()
    createDto: {
      vin: string;
      marca: string;
      modelo: string;
      motor?: string;
      ano: number;
      cliente_id: number;
    },
  ) {
    return this.vehiculosService.create(createDto);
  }

  @Get()
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiculosService.findOne(+id);
  }
}

