from rest_framework import serializers
from .models import Factura, Producto, Ticket
from vehiculos.models import UnidadTractocamion
from mantenimiento.models import Taller

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    unidades_info = serializers.SerializerMethodField()
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    taller_nombre = serializers.ReadOnlyField(source='taller.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')

    class Meta:
        model = Ticket
        fields = '__all__'

    def create(self, validated_data):
        unidades_data = validated_data.pop('unidades', [])
        ticket = super().create(validated_data)
        if unidades_data:
            ticket.unidades.set(unidades_data)
        return ticket

    def update(self, instance, validated_data):
        unidades_data = validated_data.pop('unidades', None)
        ticket = super().update(instance, validated_data)
        if unidades_data is not None:
            ticket.unidades.set(unidades_data)
        return ticket
    
    def get_unidades_info(self, obj):
        return [u.numero_economico for u in obj.unidades.all()]

class FacturaSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    unidades_info = serializers.SerializerMethodField()
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    producto_categoria = serializers.ReadOnlyField(source='producto.categoria')
    taller_nombre = serializers.ReadOnlyField(source='taller.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    ticket_folio_interno = serializers.ReadOnlyField(source='ticket.folio_interno')

    class Meta:
        model = Factura
        fields = '__all__'

    def get_unidades_info(self, obj):
        return [u.numero_economico for u in obj.unidades.all()]

    def create(self, validated_data):
        unidades_data = validated_data.pop('unidades', [])
        factura = super().create(validated_data)
        if unidades_data:
            factura.unidades.set(unidades_data)
            if factura.ticket:
                factura.ticket.unidades.set(unidades_data)
        return factura

    def update(self, instance, validated_data):
        unidades_data = validated_data.pop('unidades', None)
        factura = super().update(instance, validated_data)
        if unidades_data is not None:
            factura.unidades.set(unidades_data)
            if factura.ticket:
                factura.ticket.unidades.set(unidades_data)
        return factura
