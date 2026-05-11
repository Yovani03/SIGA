from rest_framework import serializers
from .models import Operador, AsignacionHorario

class OperadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operador
        fields = '__all__'

class AsignacionHorarioSerializer(serializers.ModelSerializer):
    operador_nombre = serializers.ReadOnlyField(source='operador.nombre')
    operador_apellido = serializers.ReadOnlyField(source='operador.apellido')
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    
    class Meta:
        model = AsignacionHorario
        fields = ['id', 'operador', 'operador_nombre', 'operador_apellido', 'unidad', 'unidad_nombre', 'tienda', 'horario', 'fecha', 'es_personal']
