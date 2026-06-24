import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.models import CargaCombustible
from vehiculos.models import VehiculoVariado

def inspect():
    variados_cargas = CargaCombustible.objects.filter(unidad_variada__isnull=False)
    print(f"Cargas con unidad_variada: {variados_cargas.count()}")
    for c in variados_cargas:
        print(f"Carga ID {c.id}: Variado={c.unidad_variada.numero_economico}, Fecha={c.fecha}, km={c.kilometraje}")

if __name__ == '__main__':
    inspect()
