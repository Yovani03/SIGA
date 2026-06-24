import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.models import CargaCombustible

def debug():
    cargas = CargaCombustible.objects.filter(litros=79)
    print(f"Found {cargas.count()} cargas with 79 litros")
    for c in cargas:
        if c.unidad:
            print(f"Carga ID {c.id}: Tractocamion {c.unidad.numero_economico}, fecha={c.fecha}")
        elif c.unidad_variada:
            print(f"Carga ID {c.id}: Variado {c.unidad_variada.numero_economico}, fecha={c.fecha}")
        else:
            print(f"Carga ID {c.id}: No unit attached!")

if __name__ == '__main__':
    debug()
