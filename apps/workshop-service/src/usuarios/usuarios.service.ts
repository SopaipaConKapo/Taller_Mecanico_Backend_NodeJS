import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const usuarios = await this.prisma.usuario.findMany({
      select: { id: true, email: true, nombre: true, rol: true, createdAt: true }
    });
    return usuarios;
  }

  async create(createDto: CreateUsuarioDto) {
    const exists = await this.prisma.usuario.findUnique({ where: { email: createDto.email } });
    if (exists) {
      throw new BadRequestException('El usuario ya existe');
    }
    const hashedPassword = await bcrypt.hash(createDto.password, 10);
    const user = await this.prisma.usuario.create({
      data: {
        email: createDto.email,
        password: hashedPassword,
        nombre: createDto.nombre,
        rol: createDto.rol || 'USUARIO'
      }
    });
    const { password, ...result } = user;
    return result;
  }

  async updateRole(id: number, rol: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updated = await this.prisma.usuario.update({
      where: { id },
      data: { rol }
    });
    const { password, ...result } = updated;
    return result;
  }

  async delete(id: number) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.usuario.delete({ where: { id } });
    return { message: 'Usuario eliminado correctamente' };
  }
}
