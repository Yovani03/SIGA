from rest_framework import serializers
from .models import Factura
from vehiculos.models import UnidadTractocamion

class FacturaSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')

    class Meta:
        model = Factura
        fields = '__all__'
