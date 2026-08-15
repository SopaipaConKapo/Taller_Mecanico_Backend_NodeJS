import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationServiceService } from './notification-service.service';

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationService: NotificationServiceService) {}

  @EventPattern('estado_vehiculo_actualizado')
  async handleEstadoVehiculo(@Payload() data: { vehiculoId: number, estado: string, clienteTelefono: string }) {
    console.log(`RabbitMQ Event Received: estado_vehiculo_actualizado`, data);
    // Lógica para enviar WhatsApp al cliente
    await this.notificationService.sendWhatsApp(
      data.clienteTelefono,
      `Hola! El estado de tu vehículo ha cambiado a: ${data.estado}.`
    );
  }

  @EventPattern('alerta_stock_bajo')
  async handleAlertaStock(@Payload() data: { repuestoNombre: string, stockActual: number }) {
    console.log(`RabbitMQ Event Received: alerta_stock_bajo`, data);
    // Notificación interna al administrador
    await this.notificationService.notifyAdmin(
      `Alerta de Inventario: El repuesto ${data.repuestoNombre} tiene stock bajo (${data.stockActual}).`
    );
  }
}
