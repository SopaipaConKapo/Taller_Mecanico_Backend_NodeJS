import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdenesTrabajoService {
  constructor(private prisma: PrismaService) {}

  async create(data: { vehiculo_id: number; mecanico_id?: string }) {
    return this.prisma.ordenTrabajo.create({
      data: {
        vehiculo_id: data.vehiculo_id,
        mecanico_id: data.mecanico_id,
        estado: 'CREADA',
      },
    });
  }

  async findAll() {
    return this.prisma.ordenTrabajo.findMany({
      include: { vehiculo: true, servicios: true, repuestos: true },
    });
  }

  async findOne(id: number) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id },
      include: { vehiculo: true, servicios: true, repuestos: true },
    });
    if (!orden) throw new NotFoundException(`Orden ${id} no encontrada`);
    return orden;
  }

  async updateEstado(id: number, estado: 'EN_DIAGNOSTICO' | 'ESPERANDO_REPUESTOS' | 'EN_REPARACION' | 'LISTO_PARA_RETIRO' | 'ENTREGADO' | 'CANCELADO') {
    const orden = await this.prisma.ordenTrabajo.update({
      where: { id },
      data: { estado },
    });

    // TODO: Publish RabbitMQ event if estado is 'LISTO_PARA_RETIRO' to notify via WhatsApp
    
    return orden;
  }

  async addRepuesto(ordenId: number, data: { repuesto_id_inventario?: number; origen: 'TALLER' | 'CLIENTE'; precio_venta?: number }) {
    // Facturación Mixta Logic
    const precio = data.origen === 'CLIENTE' ? 0 : data.precio_venta || 0;

    const repuesto = await this.prisma.ordenTrabajoRepuesto.create({
      data: {
        orden_id: ordenId,
        repuesto_id_inventario: data.repuesto_id_inventario,
        origen: data.origen,
        precio_venta: precio,
        estado_abastecimiento: 'EN_STOCK',
      },
    });

    // TODO: If origen is TALLER, emit RabbitMQ event to discount stock in inventory-service
    
    return repuesto;
  }
}
