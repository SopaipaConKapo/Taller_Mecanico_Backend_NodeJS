import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WorkshopServiceController } from './workshop-service.controller';
import { WorkshopServiceService } from './workshop-service.service';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { OrdenesTrabajoModule } from './ordenes-trabajo/ordenes-trabajo.module';
import { PrismaModule } from './prisma/prisma.module';
import { FacturacionModule } from './facturacion/facturacion.module';
import { ClientesModule } from './clientes/clientes.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    PrismaModule,
    OrdenesTrabajoModule,
    VehiculosModule,
    FacturacionModule,
    ClientesModule,
    CotizacionesModule,
    AuthModule,
    UsuariosModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'notifications_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'inventory_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [WorkshopServiceController],
  providers: [WorkshopServiceService],
})
export class WorkshopServiceModule {}
