import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import VehiculoVariado, UnidadTractocamion
from combustibles.models import CargaCombustible

def debug():
    # Check Tractocamion
    tractos = UnidadTractocamion.objects.filter(numero_economico__icontains='H-104')
    for t in tractos:
        print(f"Tracto {t.id}: {t.numero_economico}")
        cargas = CargaCombustible.objects.filter(unidad=t)
        print(f"  Cargas: {cargas.count()}")

    # Check Variado
    variados = VehiculoVariado.objects.filter(numero_economico__icontains='H-104')
    for v in variados:
        print(f"Variado {v.id}: {v.numero_economico}")
        cargas = CargaCombustible.objects.filter(unidad_variada=v)
        print(f"  Cargas: {cargas.count()}")

    # Are there any Cargas that might belong to H-104 but are disconnected?
    cargas_h104 = CargaCombustible.objects.filter(unidad_detalle__icontains='H-104')
    print(f"Cargas con unidad_detalle H-104: {cargas_h104.count()}")

if __name__ == '__main__':
    debug()
