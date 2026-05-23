# Etapa 1: Compilación de la aplicación React + Vite
FROM node:20-alpine AS build

WORKDIR /app

# Instalar pnpm de forma global
RUN npm install -g pnpm

# Copiar archivos de definición de dependencias
COPY package*.json pnpm-lock.yaml .npmrc* ./

# Instalar todas las dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código del frontend y realizar la compilación
COPY . .
RUN pnpm run build

# Etapa 2: Servidor Nginx de producción
FROM nginx:1.25-alpine

# Copiar los archivos compilados de la etapa anterior a Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx para enrutamiento y proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto por defecto de HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
