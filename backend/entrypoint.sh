#!/bin/sh

# Esperar a que la base de datos de PostgreSQL esté lista
echo "Esperando a que la base de datos PostgreSQL inicie..."
while ! nc -z db 5432; do
  sleep 0.5
done
echo "Base de datos PostgreSQL iniciada."

# Ejecutar migraciones de la base de datos
echo "Aplicando migraciones..."
python manage.py migrate --noinput

# Recolectar archivos estáticos para que Nginx los sirva
echo "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

# Iniciar servidor Gunicorn en el puerto 8000
echo "Iniciando Gunicorn..."
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000
