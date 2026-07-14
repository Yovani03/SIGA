from rest_framework import serializers
from .models import PrecioCombustible, CargaCombustible, BloqueCargaCombustible
from vehiculos.models import UnidadTractocamion

class PrecioCombustibleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrecioCombustible
        fields = '__all__'

class CargaCombustibleSerializer(serializers.ModelSerializer):
    unidad_detalle = serializers.SerializerMethodField()
    unidad = serializers.PrimaryKeyRelatedField(queryset=UnidadTractocamion.objects.all(), required=False, allow_null=True)
    precio_unitario = serializers.FloatField(required=False)
    monto_total = serializers.FloatField(required=False)
    litros = serializers.FloatField()
    fecha = serializers.DateField(required=False)
    
    class Meta:
        model = CargaCombustible
        fields = '__all__'

    def get_unidad_detalle(self, obj):
        if obj.unidad:
            return obj.unidad.numero_economico
        if obj.unidad_variada:
            return obj.unidad_variada.numero_economico
        return 'Desconocido'

class BloqueCargaCombustibleSerializer(serializers.ModelSerializer):
    cargas = CargaCombustibleSerializer(many=True, read_only=True)

    class Meta:
        model = BloqueCargaCombustible
        fields = '__all__'

class BulkCargaCombustibleSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    precio_magna = serializers.FloatField(required=False, default=0)
    precio_premium = serializers.FloatField(required=False, default=0)
    precio_diesel = serializers.FloatField(required=False, default=0)
    precio_electrico = serializers.FloatField(required=False, default=0)
    precio_gas_lp = serializers.FloatField(required=False, default=0)
    cargas = CargaCombustibleSerializer(many=True)

    def create(self, validated_data):
        fecha = validated_data['fecha']
        # Update or create price for the day
        precio_obj, _ = PrecioCombustible.objects.update_or_create(
            fecha=fecha,
            defaults={
                'precio_magna': validated_data['precio_magna'],
                'precio_premium': validated_data['precio_premium'],
                'precio_diesel': validated_data['precio_diesel'],
                'precio_electrico': validated_data.get('precio_electrico', 0),
                'precio_gas_lp': validated_data.get('precio_gas_lp', 0),
            }
        )
        
        # Create the block
        bloque = BloqueCargaCombustible.objects.create(fecha=fecha)

        cargas_data = validated_data['cargas']
        cargas_created = []
        for carga_data in cargas_data:
            carga_data['fecha'] = fecha
            carga_data['bloque'] = bloque
            # Ensure price matches the type
            tipo = carga_data['tipo_combustible']
            if tipo == 'magna':
                carga_data['precio_unitario'] = precio_obj.precio_magna
            elif tipo == 'premium':
                carga_data['precio_unitario'] = precio_obj.precio_premium
            elif tipo == 'diesel':
                carga_data['precio_unitario'] = precio_obj.precio_diesel
            elif tipo == 'electrico':
                carga_data['precio_unitario'] = precio_obj.precio_electrico
            elif tipo == 'gas_lp':
                carga_data['precio_unitario'] = precio_obj.precio_gas_lp
            else:
                carga_data['precio_unitario'] = 0
                
            carga = CargaCombustible.objects.create(**carga_data)
            cargas_created.append(carga)
            
        bloque.update_totals()
            
        return {'fecha': fecha, 'bloque_id': bloque.id, 'cargas': cargas_created}

from .models import EvidenciaGas

class EvidenciaGasSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvidenciaGas
        fields = '__all__'
