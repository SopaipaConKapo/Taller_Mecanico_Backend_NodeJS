import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateEstadoCotizacionDto } from './dto/update-estado-cotizacion.dto';

@Injectable()
export class CotizacionesService {
  constructor(private prisma: PrismaService) {}

  async create(createCotizacionDto: CreateCotizacionDto) {
    // Calcular el monto total
    let monto_total = 0;
    for (const serv of createCotizacionDto.servicios) {
      monto_total += serv.precio_estimado;
    }
    for (const rep of createCotizacionDto.repuestos) {
      monto_total += rep.precio_estimado * rep.cantidad;
    }

    return this.prisma.cotizacion.create({
      data: {
        orden_id: createCotizacionDto.orden_id,
        validez_dias: createCotizacionDto.validez_dias || 7,
        observaciones: createCotizacionDto.observaciones,
        monto_total: monto_total,
        servicios: {
          create: createCotizacionDto.servicios.map(s => ({
            servicio_id: s.servicio_id,
            precio_estimado: s.precio_estimado,
          }))
        },
        repuestos: {
          create: createCotizacionDto.repuestos.map(r => ({
            repuesto_id_inventario: r.repuesto_id_inventario,
            nombre_repuesto: r.nombre_repuesto,
            cantidad: r.cantidad,
            precio_estimado: r.precio_estimado,
          }))
        }
      },
      include: {
        servicios: true,
        repuestos: true,
      }
    });
  }

  async findOne(id: number) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id },
      include: {
        servicios: { include: { servicio: true } },
        repuestos: true,
        orden_trabajo: true,
      }
    });

    if (!cotizacion) {
      throw new NotFoundException(`Cotizacion ${id} no encontrada`);
    }
    return cotizacion;
  }

  async updateEstado(id: number, updateDto: UpdateEstadoCotizacionDto) {
    const cotizacion = await this.prisma.cotizacion.update({
      where: { id },
      data: { estado: updateDto.estado }
    });

    // Si se aprueba, cambiar la orden a ESPERANDO_REPUESTOS o EN_REPARACION
    if (updateDto.estado === 'APROBADA') {
      await this.prisma.ordenTrabajo.update({
        where: { id: cotizacion.orden_id },
        data: { estado: 'ESPERANDO_REPUESTOS' }
      });
      // En una implementación real, aquí se emitiría un evento RabbitMQ para que Inventario procese los repuestos requeridos.
    }

    return cotizacion;
  }
}
