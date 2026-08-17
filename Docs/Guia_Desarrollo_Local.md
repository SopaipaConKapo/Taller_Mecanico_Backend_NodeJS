# Guía de Desarrollo Local

Esta guía está destinada a los desarrolladores que deseen descargar el código fuente, modificar el comportamiento de los microservicios, o agregar nuevas funcionalidades al Taller Mecánico.

## 🛠️ Requisitos Previos

Para trabajar en este proyecto en tu entorno local (Windows/Mac/Linux), necesitas tener instalados:

1. **Node.js** (Versión 18 o superior)
2. **NPM** (Viene integrado con Node.js)
3. **Docker y Docker Compose** (Para levantar las bases de datos y RabbitMQ localmente)
4. **Git**

---

## 🚀 Instalación y Configuración Paso a Paso

### 1. Clonar el repositorio
```bash
git clone https://github.com/SopaipaConKapo/Taller_Mecanico_Backend_NodeJS.git
cd Taller_Mecanico_Backend_NodeJS
```

### 2. Levantar la Infraestructura Base (Docker)
Antes de correr el código de Node, necesitamos que las bases de datos (PostgreSQL) y RabbitMQ estén activas.
```bash
docker compose up -d db_taller db_inventario db_auth rabbitmq
```
> Nota: Omitimos el contenedor `cloudflared` ya que en desarrollo local no necesitamos exponer los puertos a internet.

### 3. Instalar Dependencias
Como es un monorepo administrado por NestJS, instalaremos las dependencias en la raíz del proyecto.
```bash
npm install
```

### 4. Sincronizar Prisma (Bases de Datos)
Cada microservicio tiene su propia base de datos y esquema de Prisma. Debemos generar los clientes y sincronizar las tablas.

**Para el API Gateway (Base de datos Auth):**
```bash
cd apps/api-gateway
npx prisma generate
npx prisma db push
cd ../..
```

**Para Inventory Service:**
```bash
cd apps/inventory-service
npx prisma generate
npx prisma db push
cd ../..
```

**Para Workshop Service:**
```bash
cd apps/workshop-service
npx prisma generate
npx prisma db push
cd ../..
```

---

## 🏃 Arrancando los Servicios

Para arrancar la API completa en modo desarrollo (con recarga en vivo `watch`), debes abrir múltiples terminales y arrancar cada servicio de forma individual:

**Terminal 1 (API Gateway - Puerto 3000):**
```bash
npm run start:dev api-gateway
```

**Terminal 2 (Inventory Service - Puerto 3001):**
```bash
npm run start:dev inventory-service
```

**Terminal 3 (Workshop Service - Puerto 3002):**
```bash
npm run start:dev workshop-service
```

**Terminal 4 (Notification Service - Puerto 3003):**
```bash
npm run start:dev notification-service
```

---

## 🧩 Flujo de Git (GitFlow)

Si vas a agregar nuevas funcionalidades, sigue la metodología GitFlow:

1. Nunca trabajes directamente en `main`.
2. Posiciónate en la rama `develop`: `git checkout develop`.
3. Crea una rama para tu nueva característica: `git checkout -b feature/nueva-funcion`.
4. Cuando termines, realiza los commits en español siguiendo el estándar (ej. `feat: agregar nueva funcion`).
5. Haz un "Pull Request" hacia la rama `develop`.
6. `main` se reserva únicamente para lanzar versiones oficiales al servidor de producción (VirtualBox).
