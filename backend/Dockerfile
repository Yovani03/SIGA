FROM python:3.12-slim

# Evitar que Python escriba archivos .pyc en disco y vaciar el búfer de salida inmediatamente
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instalar dependencias del sistema requeridas para compilar/ejecutar librerías de PostgreSQL y Pillow
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar los requerimientos de Python y gunicorn
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copiar el resto del código del backend
COPY . .

# Dar permisos de ejecución al script de entrada y normalizar saltos de línea (CRLF a LF)
COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Exponer el puerto de Django/Gunicorn
EXPOSE 8000

# Usar el script entrypoint para el arranque
ENTRYPOINT ["/app/entrypoint.sh"]
