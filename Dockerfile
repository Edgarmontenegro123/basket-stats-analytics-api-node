# 1. Imagen base de Node.js (actualizada a 22-alpine para paridad con el entorno)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Imagen de producción ligera
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]