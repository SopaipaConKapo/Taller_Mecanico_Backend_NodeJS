import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateUsuarioDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  @IsIn(['ADMIN', 'MECANICO', 'USUARIO'])
  rol?: string;
}
