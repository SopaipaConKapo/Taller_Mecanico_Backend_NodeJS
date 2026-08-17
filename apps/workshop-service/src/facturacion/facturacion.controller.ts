import { Controller, Post, Body, Param } from '@nestjs/common';
import { FacturacionService } from './facturacion.service';

@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  // Endpoint para que el mecánico active el cobro
  @Post('orden/:id/cobrar')
  cobrarOrden(@Param('id') ordenId: string, @Body('metodo_pago') metodoPago: any) {
    return this.facturacionService.generarPagoPOS(Number(ordenId), metodoPago);
  }

  // Webhook público para recibir confirmación de Transbank / MercadoPago
  @Post('webhook/pago')
  handleWebhook(@Body() payload: any) {
    // Dependiendo del proveedor, el payload varía. Simularemos un formato estándar:
    const reference = payload?.external_reference;
    const status = payload?.status; // ej. 'approved'
    
    if (reference && status) {
      return this.facturacionService.handleWebhookPago(reference, status);
    }
    return { error: 'Invalid Payload' };
  }
}
