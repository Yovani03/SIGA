import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import VehiculoVariado
from combustibles.models import CargaCombustible

def debug():
    variados = VehiculoVariado.objects.filter(numero_economico__icontains='H-104')
    for v in variados:
        print(f"Variado {v.id}: {v.numero_economico}")
        cargas = CargaCombustible.objects.filter(unidad_variada=v)
        print(f"  Cargas: {cargas.count()}")

if __name__ == '__main__':
    debug()
