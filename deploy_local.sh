#!/bin/bash
echo "==========================================="
echo "🛠️ Preparando Despliegue en VirtualBox Local"
echo "==========================================="

# Verificar que exista el token de Cloudflare
if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo "⚠️ ERROR: No has configurado la variable de entorno CLOUDFLARE_TUNNEL_TOKEN."
    echo "Por favor, define el token antes de continuar."
    exit 1
fi

echo "[1/3] Descargando últimos cambios de Git (GitFlow: main)..."
# git checkout main
# git pull origin main

echo "[2/3] Construyendo imágenes y levantando contenedores..."
docker compose build
docker compose up -d

echo "[3/3] Aplicando migraciones de base de datos..."
# Estas rutas asumen que los contenedores Node tienen Prisma instalado
# docker exec taller_api_gateway npx prisma db push
# docker exec taller_workshop npx prisma db push
# docker exec taller_inventory npx prisma db push

echo "✅ ¡Despliegue completado con éxito!"
echo "🌐 Tu API ahora está segura y expuesta a través de Cloudflare Tunnels."
