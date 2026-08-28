import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, roles: [user.rol] };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol
      }
    };
  }

  async register(email: string, pass: string, nombre: string, rol?: string) {
    const exists = await this.prisma.usuario.findUnique({ where: { email } });
    if (exists) {
      throw new BadRequestException('El usuario ya existe');
    }
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await this.prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rol: rol || 'MECANICO'
      }
    });
    const { password, ...result } = user;
    return result;
  }
}
