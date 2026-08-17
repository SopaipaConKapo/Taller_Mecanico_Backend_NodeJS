import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class FacturacionService {
  private readonly logger = new Logger(FacturacionService.name);
  private notificationClient: ClientProxy;

  constructor(private prisma: PrismaService) {
    this.notificationClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672'],
        queue: 'notifications_queue',
        queueOptions: { durable: true },
      },
    });
  }

  async generarPagoPOS(ordenId: number, metodoPago: any) {
    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id: ordenId },
      include: { servicios: true, repuestos: true },
    });

    if (!orden) throw new NotFoundException('Orden no encontrada');

    // Calcular monto total simulado
    let total = 0;
    orden.servicios.forEach((s) => (total += Number(s.precio_cobrado)));
    orden.repuestos.forEach((r) => (total += Number(r.precio_venta)));

    const externalRef = `POS-ORD-${ordenId}-${Date.now()}`;

    // Crear Factura Pendiente
    const factura = await this.prisma.factura.create({
      data: {
        orden_id: ordenId,
        monto_total: total,
        metodo_pago: metodoPago,
        estado: 'PENDIENTE',
        external_reference: externalRef,
      },
    });

    // Simular llamada a API de MercadoPago / Transbank para despertar la máquina
    this.logger.log(`Activando POS físico para cobrar $${total} (Ref: ${externalRef})`);

    return { message: 'Máquina POS activada', factura };
  }

  async handleWebhookPago(externalReference: string, status: string) {
    this.logger.log(`Recibido Webhook Pago: ${externalReference} - Estado: ${status}`);

    const factura = await this.prisma.factura.findUnique({
      where: { external_reference: externalReference },
      include: { orden_trabajo: { include: { vehiculo: { include: { cliente: true } } } } },
    });

    if (!factura) {
      this.logger.error('Factura no encontrada para este Webhook');
      return;
    }

    if (status === 'approved') {
      await this.prisma.factura.update({
        where: { id: factura.id },
        data: { estado: 'PAGADA' },
      });

      await this.prisma.ordenTrabajo.update({
        where: { id: factura.orden_id },
        data: { estado: 'LISTO_PARA_RETIRO' },
      });

      // Notificar por RabbitMQ para WhatsApp
      const clientePhone = factura.orden_trabajo.vehiculo.cliente.telefono;
      if (clientePhone) {
        this.notificationClient.emit('estado_vehiculo_actualizado', {
          vehiculoId: factura.orden_trabajo.vehiculo.id,
          estado: 'Pagado y Listo para Retiro',
          clienteTelefono: clientePhone,
        });
      }
    }
    return { success: true };
  }
}
