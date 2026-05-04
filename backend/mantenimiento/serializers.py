from rest_framework import serializers
from .models import InventarioRefacciones, OrdenTrabajo, MantenimientoPreventivo

class InventarioRefaccionesSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventarioRefacciones
        fields = '__all__'

class OrdenTrabajoSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    
    class Meta:
        model = OrdenTrabajo
        fields = '__all__'

class MantenimientoPreventivoSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    
    class Meta:
        model = MantenimientoPreventivo
        fields = '__all__'
