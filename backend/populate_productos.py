import os
import django
import sys

sys.path.append('c:/Autrotransportes/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from facturacion.models import Producto

productos_iniciales = [
    {'nombre': 'Diésel', 'categoria': 'Combustible', 'descripcion': 'Carga regular de diésel para unidades'},
    {'nombre': 'Gasolina', 'categoria': 'Combustible', 'descripcion': 'Carga de gasolina'},
    {'nombre': 'Cambio de Aceite y Filtros', 'categoria': 'Mantenimiento', 'descripcion': 'Servicio preventivo básico'},
    {'nombre': 'Afinación Mayor', 'categoria': 'Mantenimiento', 'descripcion': 'Servicio de afinación completa del motor'},
    {'nombre': 'Lavado de Unidad', 'categoria': 'Mantenimiento', 'descripcion': 'Lavado interior y exterior'},
    {'nombre': 'Llantas Nuevas (Eje Direccional)', 'categoria': 'Llantas', 'descripcion': 'Compra de llantas para eje delantero'},
    {'nombre': 'Llantas Nuevas (Tracción)', 'categoria': 'Llantas', 'descripcion': 'Compra de llantas para ejes traseros'},
    {'nombre': 'Renovado / Vulcanizado', 'categoria': 'Llantas', 'descripcion': 'Servicio de reparación de llantas'},
    {'nombre': 'Peajes / Casetas', 'categoria': 'Operativo', 'descripcion': 'Pago de cuotas en autopistas'},
    {'nombre': 'Viáticos de Operador', 'categoria': 'Operativo', 'descripcion': 'Gastos de alimentación y hospedaje en ruta'},
    {'nombre': 'Maniobras / Carga y Descarga', 'categoria': 'Operativo', 'descripcion': 'Pago a maniobristas'},
    {'nombre': 'Filtros y Bandas', 'categoria': 'Refacciones', 'descripcion': 'Refacciones de desgaste común'},
    {'nombre': 'Balatas y Tambores', 'categoria': 'Refacciones', 'descripcion': 'Componentes del sistema de frenos'},
    {'nombre': 'Acumuladores (Baterías)', 'categoria': 'Refacciones', 'descripcion': 'Cambio de baterías'},
    {'nombre': 'Trámites, Placas y Permisos', 'categoria': 'Administrativo', 'descripcion': 'Pago de derechos gubernamentales'},
    {'nombre': 'Póliza de Seguro', 'categoria': 'Administrativo', 'descripcion': 'Pago de prima de seguros'},
]

creados = 0
for p in productos_iniciales:
    obj, created = Producto.objects.get_or_create(nombre=p['nombre'], defaults={
        'categoria': p['categoria'],
        'descripcion': p['descripcion']
    })
    if created:
        creados += 1

print(f"Se crearon {creados} productos/categorías exitosamente.")
