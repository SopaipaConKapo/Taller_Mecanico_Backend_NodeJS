# 📚 Documentación Técnica: API y Bases de Datos

Este documento detalla los esquemas de bases de datos, entidades, relaciones y el contrato de la API (Endpoints, Requests, Responses y Roles) de la arquitectura de microservicios del Taller Mecánico.

---

## 💾 1. Arquitectura de Bases de Datos (Prisma ORM)

El sistema utiliza bases de datos aisladas por servicio. A continuación se presentan los modelos entidad-relación implementados en PostgreSQL.

### 📦 1.1. Base de Datos: `db_inventario` (Inventory Service)

Gestiona todo lo referente a stock, trazabilidad de piezas y reposiciones.

#### **Entidad: `Repuesto`**
Entidad central del catálogo físico del taller.
*   `id` (Int, PK)
*   `nombre` (String)
*   `codigo_oem` (String, Unique) - *Código del fabricante original.*
*   `precio_costo` (Decimal)
*   `precio_venta` (Decimal)
*   `stock` (Int) - *Cantidad física actual.*
*   `is_active` (Boolean) - *Indicador para el Soft Delete (borrado lógico).*
*   **Relaciones:** `1:N` con `CodigoAlternativo`, `1:N` con `CompatibilidadVehiculo`, `1:N` con `MovimientoInventario`.

#### **Entidad: `CodigoAlternativo`**
Códigos de otras marcas compatibles con el repuesto original.
*   `id` (Int, PK)
*   `codigo_fabricante_externo` (String)
*   `repuesto_id` (Int, FK)

#### **Entidad: `CompatibilidadVehiculo`**
Mapeo para validación técnica ("Anti-Errores").
*   `id` (Int, PK)
*   `marca` (String)
*   `modelo` (String)
*   `rango_anios` (String)
*   `repuesto_id` (Int, FK)

#### **Entidad: `MovimientoInventario`**
Historial inmutable de trazabilidad de stock.
*   `id` (Int, PK)
*   `tipo` (Enum: `ENTRADA`, `SALIDA`, `AJUSTE`)
*   `cantidad` (Int)
*   `referencia_orden_id` (Int, Nullable) - *Conecta lógicamente con una orden en `db_taller`.*
*   `repuesto_id` (Int, FK)
*   `createdAt` (DateTime)

#### **Entidad: `SolicitudAbastecimiento`**
Bandeja de requerimientos para compras (Backorders).
*   `id` (Int, PK)
*   `referencia_orden_id` (Int, Nullable)
*   `vin_vehiculo` (String, Nullable)
*   `descripcion_pieza` (String)
*   `urgencia` (Enum: `BAJA`, `MEDIA`, `ALTA`, `CRITICA`)
*   `estado` (Enum: `PENDIENTE`, `EN_PROCESO`, `COMPLETADA`, `CANCELADA`)

---

### 🔧 1.2. Base de Datos: `db_taller` (Workshop Service)

Gestiona la operatividad del taller, clientes y facturación.

#### **Entidad: `Cliente`**
*   `id` (Int, PK)
*   `nombre` (String)
*   `telefono` (String, Nullable) - *Usado para notificaciones WhatsApp.*
*   `auth_id` (String, Unique, Nullable) - *Para vincular con el proveedor de autenticación JWT.*
*   **Relaciones:** `1:N` con `Vehiculo`.

#### **Entidad: `Vehiculo`**
*   `id` (Int, PK)
*   `vin` (String, Unique)
*   `marca` (String)
*   `modelo` (String)
*   `ano` (Int)
*   `cliente_id` (Int, FK)
*   **Relaciones:** `1:N` con `OrdenTrabajo`.

#### **Entidad: `OrdenTrabajo`**
Corazón de la operación del mecánico.
*   `id` (Int, PK)
*   `estado` (Enum: `CREADA`, `EN_DIAGNOSTICO`, `ESPERANDO_REPUESTOS`, `EN_REPARACION`, `LISTO_PARA_RETIRO`, `ENTREGADO`, `CANCELADO`)
*   `fecha_ingreso` (DateTime)
*   `mecanico_id` (String, Nullable) - *Vinculado por el token JWT.*
*   `vehiculo_id` (Int, FK)
*   **Relaciones:** `1:N` con `OrdenTrabajoServicio`, `1:N` con `OrdenTrabajoRepuesto`.

#### **Entidad: `OrdenTrabajoRepuesto`** (Lógica Facturación Mixta)
*   `id` (Int, PK)
*   `repuesto_id_inventario` (Int, Nullable) - *Si es de origen TALLER, se conecta lógicamente con `db_inventario`.*
*   `origen` (Enum: `TALLER`, `CLIENTE`) - *Define si se factura o no.*
*   `estado_abastecimiento` (Enum: `EN_STOCK`, `PENDIENTE_BACKORDER`, `RECIBIDO`)
*   `precio_venta` (Decimal) - *Dinámico, es 0 si el origen es `CLIENTE`.*
*   `orden_id` (Int, FK)

#### **Entidades Auxiliares (Catálogo)**
*   `CatalogoServicio` (Gestión de mano de obra y servicios).
*   `ServicioCombo` (Tabla intermedia para crear combos de servicios).
*   `OrdenTrabajoServicio` (Instancia de un servicio aplicado a una orden con precio dinámico).

---

## 🌐 2. Endpoints (Contrato de API)

Todas las rutas pasan a través del **API Gateway**. El acceso requiere cabecera de autenticación:
`Authorization: Bearer <JWT_TOKEN>`

### 📦 2.1. Gestión de Inventarios (Microservicio: `inventory-service`)

#### `POST /repuestos`
*   **Descripción:** Crea un nuevo repuesto en el catálogo.
*   **Roles Permitidos:** `ADMIN`
*   **Request Body:**
    ```json
    {
      "nombre": "Filtro de Aceite",
      "codigo_oem": "FL-500S",
      "precio_costo": 5.50,
      "precio_venta": 12.00,
      "stock": 50
    }
    ```
*   **Response (201 Created):** Objeto del repuesto creado.

#### `GET /repuestos`
*   **Descripción:** Retorna todos los repuestos **activos** (ignora los eliminados por Soft Delete).
*   **Roles Permitidos:** `ADMIN`, `MECANICO`
*   **Response (200 OK):** Array de objetos repuesto.

#### `GET /repuestos/:id`
*   **Descripción:** Retorna el detalle de un repuesto activo específico.
*   **Roles Permitidos:** `ADMIN`, `MECANICO`
*   **Response (200 OK):** Objeto repuesto. Error (404) si está inactivo.

#### `PATCH /repuestos/:id`
*   **Descripción:** Actualiza parcialmente los datos de un repuesto.
*   **Roles Permitidos:** `ADMIN`
*   **Request Body:** Cualquier campo válido (ej. `precio_venta`).
*   **Response (200 OK):** Objeto repuesto actualizado.

#### `DELETE /repuestos/:id` (Soft Delete)
*   **Descripción:** Aplica un borrado lógico marcando `is_active = false`. No elimina el registro real de PostgreSQL.
*   **Roles Permitidos:** `ADMIN`
*   **Response (200 OK):** Objeto repuesto con `is_active: false`.

#### `POST /repuestos/:id/stock`
*   **Descripción:** Realiza un movimiento de inventario afectando la cantidad física.
*   **Roles Permitidos:** `ADMIN`, `MECANICO` (Los mecánicos solo hacen SALIDAS).
*   **Request Body:**
    ```json
    {
      "cantidad": 2,
      "tipoMovimiento": "SALIDA", // "ENTRADA" | "SALIDA" | "AJUSTE"
      "referenciaOrdenId": 105 // Opcional
    }
    ```
*   **Response (201 Created):** Objeto con el movimiento ejecutado e historial asociado. Dispara evento RabbitMQ de "Alerta Stock Bajo" si el umbral se rompe.

---

### 🔧 2.2. Gestión de Taller (Microservicio: `workshop-service`)

#### `POST /ordenes-trabajo`
*   **Descripción:** Inicializa una orden de trabajo para un vehículo que ingresa.
*   **Roles Permitidos:** `ADMIN`
*   **Request Body:**
    ```json
    {
      "vehiculo_id": 10,
      "mecanico_id": "auth-uuid-456" // Opcional, para asignar
    }
    ```
*   **Response (201 Created):** Orden con estado inicial `CREADA`.

#### `PATCH /ordenes-trabajo/:id/estado`
*   **Descripción:** Permite a un mecánico o gerente mover el estatus de un vehículo.
*   **Roles Permitidos:** `ADMIN`, `MECANICO`
*   **Request Body:**
    ```json
    {
      "estado": "EN_REPARACION" 
    }
    ```
*   **Response (200 OK):** Orden actualizada.
*   *Nota Arquitectura:* Cambiar el estado a `LISTO_PARA_RETIRO` emitirá un evento RabbitMQ capturado por el Notification Service.

#### `POST /ordenes-trabajo/:id/repuestos`
*   **Descripción:** Añade insumos o repuestos a una orden en curso, aplicando la lógica de *Facturación Mixta*.
*   **Roles Permitidos:** `ADMIN`, `MECANICO`
*   **Request Body (Escenario A: Repuesto del Taller):**
    ```json
    {
      "repuesto_id_inventario": 5,
      "origen": "TALLER",
      "precio_venta": 15.00
    }
    ```
*   **Request Body (Escenario B: Cliente trae el repuesto):**
    ```json
    {
      "repuesto_id_inventario": null,
      "origen": "CLIENTE"
    }
    ```
*   **Impacto / Lógica:**
    *   Si el origen es `CLIENTE`, el Backend automáticamente fuerza el precio de ese repuesto a `$0` en la orden, y omite afectar el stock del inventario.

---

### 📲 2.3. Eventos Asíncronos Internos (RabbitMQ)

El **Notification Service** escucha los siguientes eventos internamente (no expuestos como endpoints REST públicos):

#### Canal: `estado_vehiculo_actualizado`
*   **Payload Emisor:** `{ vehiculoId: number, estado: string, clienteTelefono: string }`
*   **Acción del Microservicio:** Simula la ejecución de un webhook o envío POST hacia la **WhatsApp Cloud API** notificando al cliente el cambio de estado de su auto.

#### Canal: `alerta_stock_bajo`
*   **Payload Emisor:** `{ repuestoNombre: string, stockActual: number }`
*   **Acción del Microservicio:** Envía un evento crítico de alerta (simulación de Dashboard Webhook o Email) a los gerentes (`ADMIN`) indicando necesidad inminente de abastecimiento.
