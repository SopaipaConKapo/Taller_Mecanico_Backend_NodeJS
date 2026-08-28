# Build stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copiamos archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma

# Instalamos dependencias de compilación
RUN npm ci

# Copiamos código fuente
COPY . .

# Generamos clientes prisma
RUN npx prisma generate --schema=apps/workshop-service/prisma/schema.prisma
RUN npx prisma generate --schema=apps/inventory-service/prisma/schema.prisma

# Compilamos la app pasada por ARG
ARG APP_NAME
RUN npm run build ${APP_NAME}

# Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Solo copiamos el package.json de producción y el dist
COPY package*.json ./
RUN npm ci --only=production

# Copiamos prisma client generado desde el stage de build
COPY --from=build /usr/src/app/node_modules/@prisma /usr/src/app/node_modules/@prisma
COPY --from=build /usr/src/app/node_modules/.prisma /usr/src/app/node_modules/.prisma

ARG APP_NAME
COPY --from=build /usr/src/app/dist/apps/${APP_NAME} ./dist

# Variables de entorno por defecto
ENV NODE_ENV=production

# Iniciamos
CMD ["node", "dist/main.js"]
