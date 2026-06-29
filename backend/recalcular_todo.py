import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import UnidadTractocamion, VehiculoVariado
from combustibles.models import CargaCombustible

def recalcular_todo():
    print("Iniciando recálculo de rendimientos para todas las unidades...")
    
    # Recalcular Tractocamiones
    unidades = UnidadTractocamion.objects.all()
    for unidad in unidades:
        cargas = list(CargaCombustible.objects.filter(unidad=unidad, ignorar_kilometraje=False).order_by('fecha', 'fecha_registro'))
        if not cargas:
            continue
            
        ultimo_km_previo = None
        for carga in cargas:
            nuevo_rendimiento = None
            if ultimo_km_previo is not None and carga.kilometraje is not None:
                distancia = carga.kilometraje - ultimo_km_previo
                if distancia > 0 and carga.litros and float(carga.litros) > 0:
                    nuevo_rendimiento = round(float(distancia) / float(carga.litros), 2)
            
            rendimiento_actual = float(carga.rendimiento) if carga.rendimiento is not None else None
            if rendimiento_actual != nuevo_rendimiento:
                CargaCombustible.objects.filter(id=carga.id).update(rendimiento=nuevo_rendimiento)
                
            if carga.kilometraje is not None:
                ultimo_km_previo = carga.kilometraje
                
        ultima_carga = cargas[-1]
        ultima_carga.refresh_from_db()
        
        unidad.fecha_ultima_carga = ultima_carga.fecha
        if ultima_carga.kilometraje is not None:
            unidad.ultimo_kilometraje = ultima_carga.kilometraje
        unidad.ultimo_rendimiento = ultima_carga.rendimiento
        unidad.save()
        print(f"Unidad {unidad.numero_economico} actualizada. Último rendimiento: {unidad.ultimo_rendimiento}")

    # Recalcular Vehiculos Variados
    variados = VehiculoVariado.objects.all()
    for unidad in variados:
        cargas = list(CargaCombustible.objects.filter(unidad_variada=unidad, ignorar_kilometraje=False).order_by('fecha', 'fecha_registro'))
        if not cargas:
            continue
            
        ultimo_km_previo = None
        for carga in cargas:
            nuevo_rendimiento = None
            if ultimo_km_previo is not None and carga.kilometraje is not None:
                distancia = carga.kilometraje - ultimo_km_previo
                if distancia > 0 and carga.litros and float(carga.litros) > 0:
                    nuevo_rendimiento = round(float(distancia) / float(carga.litros), 2)
            
            rendimiento_actual = float(carga.rendimiento) if carga.rendimiento is not None else None
            if rendimiento_actual != nuevo_rendimiento:
                CargaCombustible.objects.filter(id=carga.id).update(rendimiento=nuevo_rendimiento)
                
            if carga.kilometraje is not None:
                ultimo_km_previo = carga.kilometraje
                
        ultima_carga = cargas[-1]
        ultima_carga.refresh_from_db()
        
        unidad.fecha_ultima_carga = ultima_carga.fecha
        if ultima_carga.kilometraje is not None:
            unidad.ultimo_kilometraje = ultima_carga.kilometraje
        unidad.ultimo_rendimiento = ultima_carga.rendimiento
        unidad.save()
        print(f"Vehículo Variado {unidad.numero_economico} actualizado. Último rendimiento: {unidad.ultimo_rendimiento}")

    print("Recálculo finalizado exitosamente.")

if __name__ == '__main__':
    recalcular_todo()
