from rest_framework import serializers
from .models import Factura, Producto, Ticket, FacturaDetalleUnidad, TicketDetalleUnidad
from vehiculos.models import UnidadTractocamion
from mantenimiento.models import Taller

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class TicketDetalleUnidadSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    class Meta:
        model = TicketDetalleUnidad
        fields = ['id', 'unidad', 'unidad_nombre', 'monto']

class FacturaDetalleUnidadSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    class Meta:
        model = FacturaDetalleUnidad
        fields = ['id', 'unidad', 'unidad_nombre', 'monto']

class TicketSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    caja_numero_economico = serializers.ReadOnlyField(source='caja.numero_economico')
    variado_numero_economico = serializers.ReadOnlyField(source='variado.numero_economico')
    unidades_info = serializers.SerializerMethodField()
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    taller_nombre = serializers.ReadOnlyField(source='taller.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    detalles_unidades = TicketDetalleUnidadSerializer(many=True, required=False)

    class Meta:
        model = Ticket
        fields = '__all__'

    def create(self, validated_data):
        unidades_data = validated_data.pop('unidades', [])
        
        # Manejar detalles_unidades que puede venir como string JSON en MultipartFormData
        detalles_data = validated_data.pop('detalles_unidades', [])
        if not detalles_data:
            raw_detalles = self.context['request'].data.get('detalles_unidades')
            if raw_detalles:
                import json
                try:
                    detalles_data = json.loads(raw_detalles)
                except:
                    pass

        ticket = super().create(validated_data)
        if unidades_data:
            ticket.unidades.set(unidades_data)
        
        for detalle in detalles_data:
            # Asegurarse de que el ID de unidad sea entero si viene de JSON
            u_id = detalle.get('unidad')
            monto = detalle.get('monto')
            if u_id and monto:
                TicketDetalleUnidad.objects.create(ticket=ticket, unidad_id=u_id, monto=monto)
            
        return ticket

    def update(self, instance, validated_data):
        unidades_data = validated_data.pop('unidades', None)
        
        detalles_data = validated_data.pop('detalles_unidades', None)
        if detalles_data is None:
            raw_detalles = self.context['request'].data.get('detalles_unidades')
            if raw_detalles:
                import json
                try:
                    detalles_data = json.loads(raw_detalles)
                except:
                    pass

        ticket = super().update(instance, validated_data)
        
        if unidades_data is not None:
            ticket.unidades.set(unidades_data)
            
        if detalles_data is not None:
            instance.detalles_unidades.all().delete()
            for detalle in detalles_data:
                u_id = detalle.get('unidad')
                monto = detalle.get('monto')
                if u_id and monto:
                    TicketDetalleUnidad.objects.create(ticket=ticket, unidad_id=u_id, monto=monto)
                
        return ticket
    
    def get_unidades_info(self, obj):
        # Prefer breakdown info if available
        detalles = obj.detalles_unidades.all()
        if detalles.exists():
            return [f"{d.unidad.numero_economico} (${d.monto})" for d in detalles]
        return [u.numero_economico for u in obj.unidades.all()]

class FacturaSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    caja_numero_economico = serializers.ReadOnlyField(source='caja.numero_economico')
    variado_numero_economico = serializers.ReadOnlyField(source='variado.numero_economico')
    unidades_info = serializers.SerializerMethodField()
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    producto_categoria = serializers.ReadOnlyField(source='producto.categoria')
    taller_nombre = serializers.ReadOnlyField(source='taller.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    ticket_folio_interno = serializers.ReadOnlyField(source='ticket.folio_interno')
    detalles_unidades = FacturaDetalleUnidadSerializer(many=True, required=False)

    class Meta:
        model = Factura
        fields = '__all__'

    def get_unidades_info(self, obj):
        detalles = obj.detalles_unidades.all()
        if detalles.exists():
            return [f"{d.unidad.numero_economico} (${d.monto})" for d in detalles]
        return [u.numero_economico for u in obj.unidades.all()]

    def create(self, validated_data):
        unidades_data = validated_data.pop('unidades', [])
        
        detalles_data = validated_data.pop('detalles_unidades', [])
        if not detalles_data:
            raw_detalles = self.context['request'].data.get('detalles_unidades')
            if raw_detalles:
                import json
                try:
                    detalles_data = json.loads(raw_detalles)
                except:
                    pass

        factura = super().create(validated_data)
        
        if unidades_data:
            factura.unidades.set(unidades_data)
            if factura.ticket:
                factura.ticket.unidades.set(unidades_data)
        
        for detalle in detalles_data:
            u_id = detalle.get('unidad')
            monto = detalle.get('monto')
            if u_id and monto:
                FacturaDetalleUnidad.objects.create(factura=factura, unidad_id=u_id, monto=monto)
                if factura.ticket:
                    TicketDetalleUnidad.objects.get_or_create(
                        ticket=factura.ticket, 
                        unidad_id=u_id,
                        defaults={'monto': monto}
                    )
                
        return factura

    def update(self, instance, validated_data):
        unidades_data = validated_data.pop('unidades', None)
        
        detalles_data = validated_data.pop('detalles_unidades', None)
        if detalles_data is None:
            raw_detalles = self.context['request'].data.get('detalles_unidades')
            if raw_detalles:
                import json
                try:
                    detalles_data = json.loads(raw_detalles)
                except:
                    pass

        factura = super().update(instance, validated_data)
        
        if unidades_data is not None:
            factura.unidades.set(unidades_data)
            if factura.ticket:
                factura.ticket.unidades.set(unidades_data)
        
        if detalles_data is not None:
            instance.detalles_unidades.all().delete()
            for detalle in detalles_data:
                u_id = detalle.get('unidad')
                monto = detalle.get('monto')
                if u_id and monto:
                    FacturaDetalleUnidad.objects.create(factura=factura, unidad_id=u_id, monto=monto)
                    if factura.ticket:
                        TicketDetalleUnidad.objects.update_or_create(
                            ticket=factura.ticket,
                            unidad_id=u_id,
                            defaults={'monto': monto}
                        )
                    
        return factura
