from rest_framework import serializers
from .models import UnidadTractocamion, RemolqueCaja

class RemolqueCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RemolqueCaja
        fields = '__all__'

class UnidadSerializer(serializers.ModelSerializer):
    orden_activa = serializers.SerializerMethodField()

    class Meta:
        model = UnidadTractocamion
        fields = '__all__'

    def validate_numero_vin(self, value):
        if value == "":
            return None
        return value

    def get_orden_activa(self, obj):
        # Importamos aquí para evitar importaciones circulares
        from mantenimiento.models import OrdenTrabajo
        # Buscamos una orden que no esté completada
        orden = OrdenTrabajo.objects.filter(unidad=obj).exclude(estatus='completado').last()
        return orden.id if orden else None
