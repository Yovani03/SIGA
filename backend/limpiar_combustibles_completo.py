import os
import django

# Configuramos el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.models import CargaCombustible, BloqueCargaCombustible
from vehiculos.models import UnidadTractocamion, VehiculoVariado

def limpiar_todo():
    print("Iniciando limpieza profunda de combustibles y cachés...")
    
    # 1. Borrar todas las cargas
    cargas_count = CargaCombustible.objects.count()
    CargaCombustible.objects.all().delete()
    print(f"Se borraron {cargas_count} registros de CargaCombustible.")
    
    # 2. Borrar todos los bloques
    bloques_count = BloqueCargaCombustible.objects.count()
    BloqueCargaCombustible.objects.all().delete()
    print(f"Se borraron {bloques_count} registros de BloqueCargaCombustible.")
    
    # 3. Limpiar Tractocamiones
    tractos = UnidadTractocamion.objects.all()
    count_tractos = 0
    for tracto in tractos:
        tracto.fecha_ultima_carga = None
        tracto.ultimo_kilometraje = 0
        tracto.ultimo_rendimiento = 0
        tracto.save()
        count_tractos += 1
    print(f"Se reiniciaron valores en {count_tractos} Tractocamiones.")
    
    # 4. Limpiar Vehículos Variados (Montacargas, etc.)
    variados = VehiculoVariado.objects.all()
    count_variados = 0
    for variado in variados:
        variado.fecha_ultima_carga = None
        variado.ultimo_kilometraje = 0
        variado.ultimo_rendimiento = 0
        variado.save()
        count_variados += 1
    print(f"Se reiniciaron valores en {count_variados} Vehículos Variados.")
    
    print("\n¡Limpieza completada! Todas las tarjetas deberían mostrar '---' en fecha y '0' en kilometraje.")

if __name__ == '__main__':
    limpiar_todo()
