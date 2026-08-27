import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from '@nestjs/common';
import { EventPattern, Payload, ClientProxy } from '@nestjs/microservices';
import { RepuestosService } from './repuestos.service';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { UpdateRepuestoDto } from './dto/update-repuesto.dto';

@Controller('repuestos')
export class RepuestosController {
  constructor(
    private readonly repuestosService: RepuestosService,
    @Inject('RABBITMQ_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() createRepuestoDto: CreateRepuestoDto) {
    return this.repuestosService.create(createRepuestoDto);
  }

  @Get()
  findAll() {
    return this.repuestosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repuestosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRepuestoDto: UpdateRepuestoDto) {
    return this.repuestosService.update(+id, updateRepuestoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.repuestosService.remove(+id);
  }

  @Post(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body('cantidad') cantidad: number,
    @Body('tipoMovimiento') tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE',
    @Body('referenciaOrdenId') referenciaOrdenId?: number,
  ) {
    return this.repuestosService.updateStock(+id, cantidad, tipoMovimiento, referenciaOrdenId);
  }

  @EventPattern('repuesto_utilizado_en_taller')
  async handleRepuestoUtilizado(@Payload() data: { repuesto_id: number, cantidad: number, orden_id: number }) {
    console.log(`RabbitMQ Event Received: repuesto_utilizado_en_taller`, data);
    try {
      const [repuesto] = await this.repuestosService.updateStock(data.repuesto_id, data.cantidad, 'SALIDA', data.orden_id);
      
      // Emitir alerta si el stock baja a menos de 5
      if (repuesto.stock < 5) {
        this.rabbitClient.emit('alerta_stock_bajo', {
          repuestoNombre: repuesto.nombre,
          stockActual: repuesto.stock,
        });
      }
    } catch (error) {
      console.error('Error descontando stock desde evento RabbitMQ:', error.message);
    }
  }
}
