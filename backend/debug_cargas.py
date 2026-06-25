import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.models import CargaCombustible

def debug():
    cargas = CargaCombustible.objects.order_by('-fecha_registro')[:10]
    for c in cargas:
        if c.unidad:
            print(f"Carga {c.id} - Fecha: {c.fecha} - Tracto: {c.unidad.numero_economico}")
        elif c.unidad_variada:
            print(f"Carga {c.id} - Fecha: {c.fecha} - Variado: {c.unidad_variada.numero_economico}")
        else:
            print(f"Carga {c.id} - Fecha: {c.fecha} - SIN UNIDAD")

if __name__ == '__main__':
    debug()
