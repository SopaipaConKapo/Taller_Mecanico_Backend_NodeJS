# 🛠️ Sistema de Gestión Integral para Taller Mecánico (ERP + CRM)
**Documento de Arquitectura y Especificaciones Funcionales**

## 1. Visión General del Proyecto
Plataforma multiplataforma para la gestión operativa, financiera y de clientes de un taller mecánico automotriz. El sistema descentraliza la administración a través de una arquitectura de microservicios, permitiendo control de inventario preciso, validación técnica de piezas (OEM), gestión de backorders, facturación automatizada y comunicación en tiempo real con clientes vía WhatsApp.

## 2. Stack Tecnológico
*   **Backend:** Node.js con NestJS (Arquitectura de Microservicios).
*   **Base de Datos:** PostgreSQL (Bases de datos aisladas por servicio) con Prisma ORM.
*   **Frontend Web (Administración/Gerencia):** React.js + Tailwind CSS.
*   **Frontend Móvil (Mecánicos/Clientes):** React Native.
*   **Comunicación Asíncrona:** RabbitMQ o Kafka (Message Broker).
*   **Integraciones Externas:** API de WhatsApp Cloud (Meta), API de Catálogos Automotrices (TecDoc/Epicor para OEM).
*   **Infraestructura:** Docker (Contenedores), API Gateway.

---

## 3. Arquitectura de Microservicios

El backend está dividido en dominios aislados para garantizar escalabilidad. La comunicación síncrona se hace vía HTTP/REST interno, y la asíncrona mediante eventos (RabbitMQ).

### A. API Gateway
*   **Función:** Único punto de entrada público. Maneja el enrutamiento, validación de tokens JWT (Autenticación RBAC) y Rate Limiting.

### B. Servicio de Taller (Workshop Service)
*   **Base de Datos:** `db_taller`
*   **Dominio:** Clientes, Vehículos, Órdenes de Trabajo, Catálogo de Servicios (Combos), Registro de DTC.
*   **Eventos que Emite:** `OrdenCreada`, `RepuestosUtilizados`, `RepuestoRequeridoBackorder`, `VehiculoListoParaRetiro`.

### C. Servicio de Inventario (Inventory Service)
*   **Base de Datos:** `db_inventario`
*   **Dominio:** Catálogo de Repuestos, Códigos OEM, Proveedores, Órdenes de Compra, Stock, Solicitudes de Abastecimiento.
*   **Lógica Especial:** Implementa "Soft Delete" absoluto en el CRUD. Nunca se borran registros, solo se cambia el estado `is_active = false`.

### D. Servicio de Notificaciones (Notification Service)
*   **Dominio:** Comunicación por WhatsApp (Cloud API) y correos.
*   **Lógica:** Escucha eventos del Broker (ej. `VehiculoListoParaRetiro`, `RepuestoBackorderRecibido`) y dispara plantillas de mensajes. Maneja webhooks entrantes para el bot de auto-atención.

---

## 4. Roles de Usuario y Permisos (RBAC)

1.  **Gerente / Administrativo (Web):**
    *   *Acceso:* Total al sistema financiero, inventario y solicitudes de compras.
    *   *Funciones:* Aprobar órdenes de compra, lectura de costos/márgenes, gestionar proveedores, crear combos de servicios, facturación final.
2.  **Mecánico (App Móvil):**
    *   *Acceso:* Limitado a las tareas asignadas y consultas de compatibilidad técnica.
    *   *Funciones:* Cambiar estado de las tareas, escanear/verificar repuestos, solicitar repuestos faltantes (backorder). NO ve costos de compra.
3.  **Cliente (App Móvil / WhatsApp):**
    *   *Acceso:* Solo lectura de sus propios activos.
    *   *Funciones:* Ver bitácora del vehículo, agendar citas, aprobar presupuestos mixtos, recibir notificaciones de estado.

---

## 5. Funcionalidades Críticas (Business Logic)

### 5.1. Manejo de Repuestos Externos y Facturación Mixta
En la Orden de Trabajo, los repuestos tienen una bandera de origen (`origen: 'TALLER' | 'CLIENTE'`).
*   **Evaluación Individual:** Un servicio (ej. Cambio de aceite) puede tener insumos mixtos (el cliente trae el aceite, el taller pone el filtro).
*   **Impacto:** Los ítems 'TALLER' descuentan stock y suman al total. Los ítems 'CLIENTE' no afectan stock, cuestan $0, requieren descripción manual y añaden cláusula de exención de garantía en el PDF.

### 5.2. Verificación de Códigos OEM (Anti-Errores)
1. Mecánico escanea código de barras del repuesto en la app móvil.
2. Se compara el `codigo_oem` contra la tabla de compatibilidad del `VIN/Modelo` del vehículo.
3. El sistema aprueba (Match verde) o bloquea (Alerta roja Incompatible) antes de la instalación.

### 5.3. Catálogo de Servicios y Paquetes (Combos)
*   **Desacoplamiento:** Se pueden predefinir servicios (ej. Alineación y Balanceo). Al añadirlos a una orden, sus valores (precio, descripción) se copian y pueden ser modificados para esa orden específica sin alterar el catálogo base.
*   **Insumos Dinámicos:** Los combos sugieren repuestos (ej. litros de aceite) consultando dinámicamente al inventario según el modelo del vehículo ingresado.

### 5.4. Gestión de Backorders (Repuestos Pendientes)
*   Si un mecánico requiere una pieza sin stock, la añade a la "Lista de Pendientes".
*   La Orden de Trabajo pasa a `ESPERANDO_REPUESTOS` y se emite un evento asíncrono para crear un requerimiento en la Bandeja de Compras del Gerente (Servicio de Inventario).
*   Al recibir el repuesto, eventos en cadena notifican al mecánico y envían un WhatsApp al cliente para agendar el regreso del vehículo.

### 5.5. Automatización de Compras y Notificaciones
*   Lectura futura de PDFs de facturas (RPA) para precargar stock.
*   Bot de WhatsApp para auto-atención (consultas de estado) y recordatorios preventivos de mantenimiento por kilometraje.

---

## 6. Modelo de Base de Datos Base (Tablas Core)

**Servicio Taller (`db_taller`):**
*   `clientes` (id, nombre, teléfono, auth_id)
*   `vehiculos` (id, cliente_id, vin, marca, modelo, motor, año)
*   `catalogo_servicios` (id, nombre, precio_base, is_combo)
*   `servicios_combo` (id_combo, id_servicio_hijo)
*   `ordenes_trabajo` (id, vehiculo_id, mecanico_id, estado, fecha_ingreso)
*   `orden_trabajo_servicios` (id, orden_id, servicio_id, precio_cobrado, descripcion_final)
*   `orden_trabajo_repuestos` (id, orden_id, repuesto_id_inventario [null si es externo], origen [enum], estado_abastecimiento [enum], precio_venta)

**Servicio Inventario (`db_inventario`):**
*   `repuestos` (id, nombre, codigo_oem, precio_costo, precio_venta, stock, is_active)
*   `codigos_alternativos` (id, repuesto_id, codigo_fabricante_externo)
*   `compatibilidad_vehiculos` (repuesto_id, marca, modelo, rango_anios)
*   `solicitudes_abastecimiento` (id, referencia_orden_id, vin_vehiculo, descripcion_pieza, urgencia, estado)
*   `movimientos_inventario` (id, repuesto_id, tipo, cantidad, referencia_orden_id)

---

## 7. Instrucciones de Implementación para el Agente (Roadmap)

> **Nota para el Agente de IA:** Al comenzar a programar este proyecto, sigue este orden estricto de implementación:

1.  **Fase 1: Infraestructura Base.** Crea el archivo `docker-compose.yml` con 3 bases de datos PostgreSQL aisladas, RabbitMQ y los contenedores Node.js vacíos.
2.  **Fase 2: Gateway & Auth.** Implementa el API Gateway y el middleware JWT para validación de Roles (Admin, Mecanico, Cliente).
3.  **Fase 3: CRUD de Inventario y Catálogo.** Desarrolla el backend de Inventario (con Soft Delete) y el CRUD del Catálogo de Servicios y Combos en el Servicio de Taller.
4.  **Fase 4: Flujos de Trabajo (Órdenes).** Crea la lógica de las Órdenes de Trabajo soportando facturación mixta (repuestos Taller/Cliente) y modificación dinámica de precios.
5.  **Fase 5: Flujo OEM y Backorders.** Construye la verificación de compatibilidad OEM y la lógica de publicación/escucha de eventos RabbitMQ para la bandeja de repuestos solicitados.
6.  **Fase 6: WhatsApp.** Levanta el webhook en el Servicio de Notificaciones.
7.  **Fase 7: Frontends.** Inicializa las interfaces en React (Dashboard Admin) y React Native (App Mecánicos/Clientes).