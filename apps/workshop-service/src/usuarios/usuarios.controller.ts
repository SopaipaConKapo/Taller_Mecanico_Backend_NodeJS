import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Controller('usuarios')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Post()
  create(@Body() createDto: CreateUsuarioDto) {
    return this.usuariosService.create(createDto);
  }

  @Patch(':id/rol')
  updateRole(@Param('id') id: string, @Body('rol') rol: string) {
    return this.usuariosService.updateRole(+id, rol);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usuariosService.delete(+id);
  }
}
