import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { OrdenesTrabajoService } from './ordenes-trabajo.service';

@Controller('ordenes-trabajo')
export class OrdenesTrabajoController {
  constructor(private readonly ordenesService: OrdenesTrabajoService) {}

  @Post()
  create(@Body() createDto: { vehiculo_id: number; mecanico_id?: string }) {
    return this.ordenesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.ordenesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordenesService.findOne(+id);
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body('estado') estado: 'EN_DIAGNOSTICO' | 'ESPERANDO_REPUESTOS' | 'EN_REPARACION' | 'LISTO_PARA_RETIRO' | 'ENTREGADO' | 'CANCELADO',
  ) {
    return this.ordenesService.updateEstado(+id, estado);
  }

  @Post(':id/repuestos')
  addRepuesto(
    @Param('id') id: string,
    @Body() data: { repuesto_id_inventario?: number; origen: 'TALLER' | 'CLIENTE'; precio_venta?: number },
  ) {
    return this.ordenesService.addRepuesto(+id, data);
  }
}
