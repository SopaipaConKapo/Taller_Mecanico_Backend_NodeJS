import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiculosService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    vin: string;
    marca: string;
    modelo: string;
    motor?: string;
    ano: number;
    cliente_id: number;
  }) {
    return this.prisma.vehiculo.create({ data });
  }

  async findAll() {
    return this.prisma.vehiculo.findMany({ include: { cliente: true } });
  }

  async findOne(id: number) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id },
      include: { cliente: true, ordenes_trabajo: true },
    });
    if (!vehiculo) throw new NotFoundException(`Vehículo ${id} no encontrado`);
    return vehiculo;
  }
}
