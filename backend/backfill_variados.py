import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import VehiculoVariado
from combustibles.models import CargaCombustible

def backfill():
    variados = VehiculoVariado.objects.all()
    count = 0
    for v in variados:
        ultima_carga = CargaCombustible.objects.filter(unidad_variada=v, ignorar_kilometraje=False).order_by('-fecha', '-fecha_registro').first()
        if ultima_carga:
            v.fecha_ultima_carga = ultima_carga.fecha
            if ultima_carga.kilometraje:
                v.ultimo_kilometraje = ultima_carga.kilometraje
            if ultima_carga.rendimiento:
                v.ultimo_rendimiento = ultima_carga.rendimiento
            v.save()
            count += 1
            print(f"Updated {v.numero_economico}: fecha={v.fecha_ultima_carga}, km={v.ultimo_kilometraje}")
            
    print(f"Total Variados updated: {count}")

if __name__ == '__main__':
    backfill()
