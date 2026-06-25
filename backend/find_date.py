import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import UnidadTractocamion, VehiculoVariado

def find():
    for t in UnidadTractocamion.objects.all():
        if t.fecha_ultima_carga:
            print(f"Tracto {t.numero_economico}: {t.fecha_ultima_carga}")
    for v in VehiculoVariado.objects.all():
        if v.fecha_ultima_carga:
            print(f"Variado {v.numero_economico}: {v.fecha_ultima_carga}")

if __name__ == '__main__':
    find()
