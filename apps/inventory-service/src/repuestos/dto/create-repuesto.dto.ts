import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateRepuestoDto {
  @IsString()
  nombre: string;

  @IsString()
  codigo_oem: string;

  @IsNumber()
  precio_costo: number;

  @IsNumber()
  precio_venta: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
