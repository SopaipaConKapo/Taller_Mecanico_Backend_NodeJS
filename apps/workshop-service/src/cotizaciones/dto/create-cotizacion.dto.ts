import { IsNumber, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CotizacionServicioDto {
  @IsNumber()
  servicio_id: number;

  @IsNumber()
  precio_estimado: number;
}

class CotizacionRepuestoDto {
  @IsOptional()
  @IsNumber()
  repuesto_id_inventario?: number;

  @IsOptional()
  @IsString()
  nombre_repuesto?: string;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precio_estimado: number;
}

export class CreateCotizacionDto {
  @IsNumber()
  orden_id: number;

  @IsOptional()
  @IsNumber()
  validez_dias?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CotizacionServicioDto)
  servicios: CotizacionServicioDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CotizacionRepuestoDto)
  repuestos: CotizacionRepuestoDto[];
}
