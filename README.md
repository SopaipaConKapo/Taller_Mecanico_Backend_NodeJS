# 🚗 Taller Mecánico - Backend NodeJS (Microservicios)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://rabbitmq.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

Este repositorio contiene la arquitectura de Backend para la gestión integral de un Taller Mecánico. Está construido utilizando **NestJS** bajo un patrón de **Microservicios**, comunicándose mediante eventos en **RabbitMQ** y almacenando datos de manera independiente en **PostgreSQL**.

## 📑 Índice de Documentación

Toda la documentación técnica, arquitectónica y de ciberseguridad se encuentra en la carpeta `/Docs`:

1. [📖 Documentación Técnica y Base de Datos](Docs/Documentacion_Tecnica.md)
2. [🔗 Arquitectura de Integraciones y Webhooks](Docs/Arquitectura_Integraciones.md)
3. [🛡️ Guía de Seguridad y Servidor Local (VPS/VirtualBox)](Docs/Guia_Seguridad_Servidor_Local.md)
4. [💻 Guía de Desarrollo Local](Docs/Guia_Desarrollo_Local.md)

---

## 🏗️ Estructura del Monorepo

El proyecto utiliza el sistema de Workspaces de NestJS. La lógica está separada en aplicaciones independientes dentro de la carpeta `apps/`:

*   **`api-gateway` (Puerto 3000):** El punto de entrada público. Gestiona la Autenticación (JWT), roles de usuario, y enruta peticiones hacia los microservicios.
*   **`inventory-service` (Puerto 3001):** Gestiona el catálogo de repuestos, stock, soft-deletes y valorización.
*   **`workshop-service` (Puerto 3002):** El núcleo del negocio. Administra Vehículos, Órdenes de Trabajo, Facturación, Webhooks de Pagos POS y catálogos de mano de obra.
*   **`notification-service` (Puerto 3003):** Aplicación híbrida. Escucha eventos internos por RabbitMQ (ej. *Stock Bajo*) para alertar, y expone Webhooks HTTP para interactuar con clientes vía WhatsApp utilizando IA (OpenAI).

---

## 🚀 Despliegue Rápido (Producción Local)

Si deseas levantar el servidor completo en tu entorno de producción local (ej. VirtualBox) utilizando Docker y Cloudflare Tunnels:

1. Configura tu token de Cloudflare:
   ```bash
   export CLOUDFLARE_TUNNEL_TOKEN="tu-token-aqui"
   ```
2. Ejecuta el script automatizado:
   ```bash
   bash deploy_local.sh
   ```

---

## 🛡️ Características Principales

*   **Facturación POS:** Integración con máquinas de tarjetas (MercadoPago/Transbank) vía webhooks.
*   **Cotizaciones Inteligentes:** Bot de WhatsApp impulsado por Inteligencia Artificial (OpenAI) para cotizar servicios en tiempo real.
*   **Arquitectura Desacoplada:** Si el servicio de notificaciones se cae, el taller puede seguir operando y cobrando con normalidad.
*   **Seguridad Zero Trust:** Compatible con túneles inversos para no exponer puertos del router doméstico.
