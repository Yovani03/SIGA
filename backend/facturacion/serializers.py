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
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    taller_nombre = serializers.ReadOnlyField(source='taller.nombre')

    class Meta:
        model = Ticket
        fields = '__all__'

class FacturaSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    producto_categoria = serializers.ReadOnlyField(source='producto.categoria')
    taller_nombre = serializers.ReadOnlyField(source='taller.nombre')
    ticket_folio_interno = serializers.ReadOnlyField(source='ticket.folio_interno')

    class Meta:
        model = Factura
        fields = '__all__'
