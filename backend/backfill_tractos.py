import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import UnidadTractocamion
from combustibles.models import CargaCombustible

def backfill():
    unidades = UnidadTractocamion.objects.all()
    count = 0
    for u in unidades:
        ultima_carga = CargaCombustible.objects.filter(unidad=u).order_by('-fecha', '-fecha_registro').first()
        if ultima_carga:
            updated = False
            if u.fecha_ultima_carga != ultima_carga.fecha:
                u.fecha_ultima_carga = ultima_carga.fecha
                updated = True
            
            # Find the latest charge with km to update km and rendimiento
            ultima_carga_km = CargaCombustible.objects.filter(unidad=u, ignorar_kilometraje=False).exclude(kilometraje__isnull=True).order_by('-fecha', '-fecha_registro').first()
            if ultima_carga_km:
                if ultima_carga_km.kilometraje and u.ultimo_kilometraje != ultima_carga_km.kilometraje:
                    u.ultimo_kilometraje = ultima_carga_km.kilometraje
                    updated = True
                if ultima_carga_km.rendimiento and u.ultimo_rendimiento != ultima_carga_km.rendimiento:
                    u.ultimo_rendimiento = ultima_carga_km.rendimiento
                    updated = True
            
            if updated:
                u.save()
                count += 1
                print(f"Updated {u.numero_economico}: fecha={u.fecha_ultima_carga}, km={u.ultimo_kilometraje}")
            
    print(f"Total Tractocamiones updated: {count}")

if __name__ == '__main__':
    backfill()
