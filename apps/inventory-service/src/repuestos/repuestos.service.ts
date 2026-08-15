import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';
import { UpdateRepuestoDto } from './dto/update-repuesto.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RepuestosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRepuestoDto: CreateRepuestoDto) {
    return this.prisma.repuesto.create({
      data: createRepuestoDto,
    });
  }

  async findAll() {
    // Only return active records (Soft Delete implementation)
    return this.prisma.repuesto.findMany({
      where: {
        is_active: true,
      },
    });
  }

  async findOne(id: number) {
    const repuesto = await this.prisma.repuesto.findFirst({
      where: {
        id,
        is_active: true,
      },
    });
    if (!repuesto) {
      throw new NotFoundException(`Repuesto con ID ${id} no encontrado`);
    }
    return repuesto;
  }

  async update(id: number, updateRepuestoDto: UpdateRepuestoDto) {
    // Check if it exists and is active
    await this.findOne(id);
    return this.prisma.repuesto.update({
      where: { id },
      data: updateRepuestoDto,
    });
  }

  async remove(id: number) {
    // Soft Delete: Instead of deleting, set is_active to false
    await this.findOne(id);
    return this.prisma.repuesto.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // Stock Management Logic
  async updateStock(id: number, cantidad: number, tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE', referenciaOrdenId?: number) {
    const repuesto = await this.findOne(id);
    
    let nuevoStock = repuesto.stock;
    if (tipoMovimiento === 'ENTRADA' || tipoMovimiento === 'AJUSTE') {
       nuevoStock += cantidad;
    } else if (tipoMovimiento === 'SALIDA') {
       nuevoStock -= cantidad;
    }

    if (nuevoStock < 0) {
      throw new Error('Stock insuficiente');
    }

    // Run transaction to update stock and register movement
    return this.prisma.$transaction([
      this.prisma.repuesto.update({
        where: { id },
        data: { stock: nuevoStock },
      }),
      this.prisma.movimientoInventario.create({
        data: {
          tipo: tipoMovimiento,
          cantidad,
          referencia_orden_id: referenciaOrdenId,
          repuesto_id: id,
        }
      })
    ]);
  }
}
