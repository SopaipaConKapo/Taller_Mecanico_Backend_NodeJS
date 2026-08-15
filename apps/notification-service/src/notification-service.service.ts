import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationServiceService {
  private readonly logger = new Logger(NotificationServiceService.name);

  async sendWhatsApp(phone: string, message: string) {
    this.logger.log(`[WhatsApp API Simulation] Mensaje enviado a ${phone}: "${message}"`);
    // En producción aquí iría la integración con Meta Cloud API
    return { status: 'sent', phone };
  }

  async notifyAdmin(message: string) {
    this.logger.warn(`[Admin Dashboard Alert] ${message}`);
    // En producción aquí iría un webhook al dashboard o un email
    return { status: 'alerted' };
  }
}
