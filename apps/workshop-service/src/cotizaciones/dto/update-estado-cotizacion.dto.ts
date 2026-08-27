import { IsIn } from 'class-validator';

export class UpdateEstadoCotizacionDto {
  @IsIn(['PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA'])
  estado: 'PENDIENTE_APROBACION' | 'APROBADA' | 'RECHAZADA';
}
