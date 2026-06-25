from rest_framework import serializers
from .models import Viaje, ConfiguracionBono, Bitacora
from operadores.serializers import OperadorSerializer
from vehiculos.serializers import UnidadSerializer

class ViajeSerializer(serializers.ModelSerializer):
    operador_detalle = OperadorSerializer(source='operador', read_only=True)
    vehiculo_detalle = UnidadSerializer(source='vehiculo', read_only=True)
    ayudante_detalle = OperadorSerializer(source='ayudante', read_only=True)

    class Meta:
        model = Viaje
        fields = '__all__'

class ConfiguracionBonoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionBono
        fields = '__all__'

class BitacoraSerializer(serializers.ModelSerializer):
    vehiculo_detalle = UnidadSerializer(source='vehiculo', read_only=True)

    class Meta:
        model = Bitacora
        fields = '__all__'
