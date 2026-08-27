import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdenesTrabajoService {
    constructor(
      private prisma: PrismaService,
      @Inject('NOTIFICATIONS_SERVICE') private notificationsClient: ClientProxy,
      @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
    ) {}

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
      include: { vehiculo: { include: { cliente: true } }, servicios: true, repuestos: true },
    });
    if (!orden) throw new NotFoundException(`Orden ${id} no encontrada`);
    return orden;
  }

  async updateEstado(id: number, estado: 'EN_DIAGNOSTICO' | 'ESPERANDO_REPUESTOS' | 'EN_REPARACION' | 'LISTO_PARA_RETIRO' | 'ENTREGADO' | 'CANCELADO') {
    const orden = await this.prisma.ordenTrabajo.update({
      where: { id },
      data: { estado },
      include: { vehiculo: { include: { cliente: true } } }
    });

    if (estado === 'LISTO_PARA_RETIRO') {
      const clienteTelefono = orden.vehiculo?.cliente?.telefono || '+56900000000';
      this.notificationsClient.emit('estado_vehiculo_actualizado', {
        vehiculoId: orden.vehiculo_id,
        estado: estado,
        clienteTelefono: clienteTelefono,
      });
    }
    
    return orden;
  }

  async addRepuesto(ordenId: number, data: { repuesto_id_inventario?: number; origen: 'TALLER' | 'CLIENTE'; precio_venta?: number }) {
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

    if (data.origen === 'TALLER' && data.repuesto_id_inventario) {
      this.inventoryClient.emit('repuesto_utilizado_en_taller', {
        repuesto_id: data.repuesto_id_inventario,
        cantidad: 1,
        orden_id: ordenId,
      });
    }
    
    return repuesto;
  }
}
