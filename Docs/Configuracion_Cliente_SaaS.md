# Guía de Despliegue para Nuevos Clientes (Single-Tenant SaaS)

Esta guía documenta cómo configurar e instalar una "Instancia Dedicada" del Sistema Integral de Taller Mecánico para cada nuevo cliente comercial. 

Al utilizar el modelo **Single-Tenant**, aseguramos que los datos del Cliente A nunca se mezclen con los del Cliente B, brindando máxima seguridad y permitiendo cobrar infraestructuras independientes.

---

## 1. Infraestructura Requerida por Cliente

Para cada taller mecánico nuevo al que le vendas el sistema, necesitarás levantar los siguientes recursos (preferiblemente contenerizados con Docker):

*   **1 Servidor RabbitMQ:** (O un Virtual Host en un servidor compartido).
*   **2 Bases de datos PostgreSQL independientes:**
    *   `db_taller_clienteXYZ`: Para el manejo de órdenes, clientes y vehículos.
    *   `db_inventory_clienteXYZ`: Para la gestión privada de inventario.
*   **3 Contenedores Node.js:**
    *   API Gateway (Expuesto a internet, con SSL).
    *   Workshop Service (Oculto).
    *   Inventory Service (Oculto).

---

## 2. Configuración de Variables de Entorno (.env)

El secreto del aislamiento está en los archivos `.env` de cada microservicio. Cuando instales el sistema para "Taller Los Pepes", debes configurar sus credenciales así:

### `apps/workshop-service/.env`
```env
# Conexión exclusiva a la DB del Taller Los Pepes
DATABASE_URL="postgresql://user:pass@localhost:5432/db_taller_pepes?schema=public"

# Conexión al RabbitMQ 
RABBITMQ_URL="amqp://user:pass@localhost:5672"

# Secreto JWT único para este cliente
JWT_SECRET="secreto_super_seguro_pepes_999"
```

### `apps/inventory-service/.env`
```env
# Conexión exclusiva a la DB de Inventario de Los Pepes
DATABASE_URL="postgresql://user:pass@localhost:5432/db_inventory_pepes?schema=public"

# Conexión al RabbitMQ 
RABBITMQ_URL="amqp://user:pass@localhost:5672"
```

### `apps/api-gateway/.env`
```env
JWT_SECRET="secreto_super_seguro_pepes_999"
```

---

## 3. Pasos de Instalación Inicial

Cuando levantes los servicios para un cliente nuevo, siempre debes ejecutar los comandos de inicialización de base de datos desde la raíz del proyecto para crear las tablas vacías:

```bash
# 1. Crear tablas para el taller
npx dotenv -e apps/workshop-service/.env -- npx prisma db push --schema=apps/workshop-service/prisma/schema.prisma

# 2. Crear tablas para el inventario
npx dotenv -e apps/inventory-service/.env -- npx prisma db push --schema=apps/inventory-service/prisma/schema.prisma
```

---

## 4. Personalizaciones Adicionales (WhatsApp)

Si el cliente pagó por el módulo de **Notificaciones Automáticas por WhatsApp**, debes configurar las credenciales de la API de Meta en el `notification-service`.

En el archivo `apps/notification-service/.env` (por crear), deberás añadir:
```env
META_WHATSAPP_TOKEN="token_del_cliente"
META_WHATSAPP_PHONE_ID="id_del_telefono_del_cliente"
```
*Nota: Actualmente el sistema simula el envío a través de los logs. La integración final requerirá conectarse mediante HTTP a la API oficial de Meta Graph.*
