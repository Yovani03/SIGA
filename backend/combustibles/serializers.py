from rest_framework import serializers
from .models import PrecioCombustible, CargaCombustible
from vehiculos.models import UnidadTractocamion

class PrecioCombustibleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrecioCombustible
        fields = '__all__'

class CargaCombustibleSerializer(serializers.ModelSerializer):
    unidad_detalle = serializers.ReadOnlyField(source='unidad.numero_economico')
    precio_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    monto_total = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    fecha = serializers.DateField(required=False)
    
    class Meta:
        model = CargaCombustible
        fields = '__all__'

class BulkCargaCombustibleSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    precio_magna = serializers.DecimalField(max_digits=10, decimal_places=2)
    precio_premium = serializers.DecimalField(max_digits=10, decimal_places=2)
    precio_diesel = serializers.DecimalField(max_digits=10, decimal_places=2)
    precio_electrico = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
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
            }
        )
        
        cargas_data = validated_data['cargas']
        cargas_created = []
        for carga_data in cargas_data:
            carga_data['fecha'] = fecha
            # Ensure price matches the type
            tipo = carga_data['tipo_combustible']
            if tipo == 'magna':
                carga_data['precio_unitario'] = precio_obj.precio_magna
            elif tipo == 'premium':
                carga_data['precio_unitario'] = precio_obj.precio_premium
            elif tipo == 'diesel':
                carga_data['precio_unitario'] = precio_obj.precio_diesel
            else:
                carga_data['precio_unitario'] = precio_obj.precio_electrico
                
            carga = CargaCombustible.objects.create(**carga_data)
            cargas_created.append(carga)
            
        return {'fecha': fecha, 'cargas': cargas_created}
