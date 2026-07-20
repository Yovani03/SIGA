from rest_framework import serializers
from .models import Factura, Producto, Ticket, FacturaDetalleUnidad, TicketDetalleUnidad, SolicitudCambioFactura, ContraRecibo, ContraReciboFactura
from vehiculos.models import UnidadTractocamion
from mantenimiento.models import Taller

class SolicitudCambioFacturaSerializer(serializers.ModelSerializer):
    solicitante_nombre = serializers.ReadOnlyField(source='solicitante.username')
    autorizador_nombre = serializers.ReadOnlyField(source='autorizador.username')
    factura_folio = serializers.ReadOnlyField(source='factura.folio')
    factura_original = serializers.SerializerMethodField()

    class Meta:
        model = SolicitudCambioFactura
        fields = '__all__'
        read_only_fields = ['estado', 'autorizador', 'fecha_solicitud', 'fecha_resolucion']

    def get_factura_original(self, obj):
        serializer = FacturaSerializer(obj.factura, context=self.context)
        return serializer.data

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class TicketDetalleUnidadSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    caja_nombre = serializers.ReadOnlyField(source='caja.numero_economico')
    variado_nombre = serializers.ReadOnlyField(source='variado.numero_economico')
    class Meta:
        model = TicketDetalleUnidad
        fields = ['id', 'unidad', 'unidad_nombre', 'caja', 'caja_nombre', 'variado', 'variado_nombre', 'monto']

class FacturaDetalleUnidadSerializer(serializers.ModelSerializer):
    unidad_nombre = serializers.ReadOnlyField(source='unidad.numero_economico')
    caja_nombre = serializers.ReadOnlyField(source='caja.numero_economico')
    variado_nombre = serializers.ReadOnlyField(source='variado.numero_economico')
    class Meta:
        model = FacturaDetalleUnidad
        fields = ['id', 'unidad', 'unidad_nombre', 'caja', 'caja_nombre', 'variado', 'variado_nombre', 'monto']

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
        cajas_data = validated_data.pop('cajas', [])
        variados_data = validated_data.pop('variados', [])
        
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
        if cajas_data:
            ticket.cajas.set(cajas_data)
        if variados_data:
            ticket.variados.set(variados_data)
        
        for detalle in detalles_data:
            u_raw = detalle.get('unidad')
            c_raw = detalle.get('caja')
            v_raw = detalle.get('variado')
            monto = detalle.get('monto')
            
            u_id = getattr(u_raw, 'id', u_raw)
            c_id = getattr(c_raw, 'id', c_raw)
            v_id = getattr(v_raw, 'id', v_raw)

            if (u_id or c_id or v_id) and monto:
                TicketDetalleUnidad.objects.create(
                    ticket=ticket, 
                    unidad_id=u_id, 
                    caja_id=c_id, 
                    variado_id=v_id, 
                    monto=monto
                )
            
        return ticket

    def update(self, instance, validated_data):
        unidades_data = validated_data.pop('unidades', None)
        cajas_data = validated_data.pop('cajas', None)
        variados_data = validated_data.pop('variados', None)
        
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
        if cajas_data is not None:
            ticket.cajas.set(cajas_data)
        if variados_data is not None:
            ticket.variados.set(variados_data)
            
        if detalles_data is not None:
            instance.detalles_unidades.all().delete()
            for detalle in detalles_data:
                u_raw = detalle.get('unidad')
                c_raw = detalle.get('caja')
                v_raw = detalle.get('variado')
                monto = detalle.get('monto')
                
                u_id = getattr(u_raw, 'id', u_raw)
                c_id = getattr(c_raw, 'id', c_raw)
                v_id = getattr(v_raw, 'id', v_raw)

                if (u_id or c_id or v_id) and monto:
                    TicketDetalleUnidad.objects.create(
                        ticket=ticket, 
                        unidad_id=u_id, 
                        caja_id=c_id, 
                        variado_id=v_id, 
                        monto=monto
                    )
                
        return ticket
    
    def get_unidades_info(self, obj):
        detalles = obj.detalles_unidades.all()
        if detalles.exists():
            info = []
            for d in detalles:
                if d.unidad:
                    info.append(f"{d.unidad.numero_economico} (${d.monto})")
                elif d.caja:
                    info.append(f"{d.caja.numero_economico} (Caja) (${d.monto})")
                elif d.variado:
                    info.append(f"{d.variado.numero_economico} ({d.variado.tipo or 'Variado'}) (${d.monto})")
            return info
        
        info = [u.numero_economico for u in obj.unidades.all()]
        info += [f"{c.numero_economico} (Caja)" for c in obj.cajas.all()]
        info += [f"{v.numero_economico} ({v.tipo or 'Variado'})" for v in obj.variados.all()]
        return info

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
        read_only_fields = []


    def get_unidades_info(self, obj):
        detalles = obj.detalles_unidades.all()
        if detalles.exists():
            info = []
            for d in detalles:
                if d.unidad:
                    info.append(f"{d.unidad.numero_economico} (${d.monto})")
                elif d.caja:
                    info.append(f"{d.caja.numero_economico} (Caja) (${d.monto})")
                elif d.variado:
                    info.append(f"{d.variado.numero_economico} ({d.variado.tipo or 'Variado'}) (${d.monto})")
            return info
        
        info = [u.numero_economico for u in obj.unidades.all()]
        info += [f"{c.numero_economico} (Caja)" for c in obj.cajas.all()]
        info += [f"{v.numero_economico} ({v.tipo or 'Variado'})" for v in obj.variados.all()]
        return info

    def create(self, validated_data):
        unidades_data = validated_data.pop('unidades', [])
        cajas_data = validated_data.pop('cajas', [])
        variados_data = validated_data.pop('variados', [])
        
        detalles_data = validated_data.pop('detalles_unidades', [])
        if not detalles_data:
            raw_detalles = None
            if 'request' in self.context:
                raw_detalles = self.context['request'].data.get('detalles_unidades')
            if not raw_detalles and hasattr(self, 'initial_data'):
                raw_detalles = self.initial_data.get('detalles_unidades')
                
            if raw_detalles:
                import json
                try:
                    detalles_data = json.loads(raw_detalles) if isinstance(raw_detalles, str) else raw_detalles
                except:
                    pass

        factura = super().create(validated_data)
        
        if unidades_data:
            factura.unidades.set(unidades_data)
            if factura.ticket:
                factura.ticket.unidades.set(unidades_data)
        if cajas_data:
            factura.cajas.set(cajas_data)
            if factura.ticket:
                factura.ticket.cajas.set(cajas_data)
        if variados_data:
            factura.variados.set(variados_data)
            if factura.ticket:
                factura.ticket.variados.set(variados_data)
        
        for detalle in detalles_data:
            u_raw = detalle.get('unidad')
            c_raw = detalle.get('caja')
            v_raw = detalle.get('variado')
            monto = detalle.get('monto')
            
            u_id = getattr(u_raw, 'id', u_raw)
            c_id = getattr(c_raw, 'id', c_raw)
            v_id = getattr(v_raw, 'id', v_raw)

            if (u_id or c_id or v_id) and monto:
                FacturaDetalleUnidad.objects.create(
                    factura=factura, 
                    unidad_id=u_id, 
                    caja_id=c_id, 
                    variado_id=v_id, 
                    monto=monto
                )
                if factura.ticket:
                    TicketDetalleUnidad.objects.get_or_create(
                        ticket=factura.ticket, 
                        unidad_id=u_id,
                        caja_id=c_id,
                        variado_id=v_id,
                        defaults={'monto': monto}
                    )
                
        return factura

    def update(self, instance, validated_data):
        unidades_data = validated_data.pop('unidades', None)
        cajas_data = validated_data.pop('cajas', None)
        variados_data = validated_data.pop('variados', None)
        
        detalles_data = validated_data.pop('detalles_unidades', None)
        if detalles_data is None:
            raw_detalles = None
            if 'request' in self.context:
                raw_detalles = self.context['request'].data.get('detalles_unidades')
            if not raw_detalles and hasattr(self, 'initial_data'):
                raw_detalles = self.initial_data.get('detalles_unidades')
                
            if raw_detalles:
                import json
                try:
                    detalles_data = json.loads(raw_detalles) if isinstance(raw_detalles, str) else raw_detalles
                except:
                    pass

        factura = super().update(instance, validated_data)
        
        if unidades_data is not None:
            factura.unidades.set(unidades_data)
            if factura.ticket:
                factura.ticket.unidades.set(unidades_data)
        if cajas_data is not None:
            factura.cajas.set(cajas_data)
            if factura.ticket:
                factura.ticket.cajas.set(cajas_data)
        if variados_data is not None:
            factura.variados.set(variados_data)
            if factura.ticket:
                factura.ticket.variados.set(variados_data)
        
        if detalles_data is not None:
            instance.detalles_unidades.all().delete()
            for detalle in detalles_data:
                u_raw = detalle.get('unidad')
                c_raw = detalle.get('caja')
                v_raw = detalle.get('variado')
                monto = detalle.get('monto')
                
                u_id = getattr(u_raw, 'id', u_raw)
                c_id = getattr(c_raw, 'id', c_raw)
                v_id = getattr(v_raw, 'id', v_raw)

                if (u_id or c_id or v_id) and monto:
                    FacturaDetalleUnidad.objects.create(
                        factura=factura, 
                        unidad_id=u_id, 
                        caja_id=c_id, 
                        variado_id=v_id, 
                        monto=monto
                    )
                    if factura.ticket:
                        TicketDetalleUnidad.objects.update_or_create(
                            ticket=factura.ticket,
                            unidad_id=u_id,
                            caja_id=c_id,
                            variado_id=v_id,
                            defaults={'monto': monto}
                        )
                    
        return factura

class ContraReciboFacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContraReciboFactura
        fields = '__all__'

class ContraReciboSerializer(serializers.ModelSerializer):
    facturas_detalle = ContraReciboFacturaSerializer(many=True, required=False)
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    taller_nombre = serializers.ReadOnlyField(source='taller.nombre')
    capturista_nombre = serializers.ReadOnlyField(source='capturista.username')

    class Meta:
        model = ContraRecibo
        fields = '__all__'

    def create(self, validated_data):
        facturas_data = validated_data.pop('facturas_detalle', [])
        
        # Generar folio autoincremental
        last_cr = ContraRecibo.objects.order_by('-id').first()
        if last_cr and last_cr.folio.startswith('CR-'):
            try:
                next_num = int(last_cr.folio.split('-')[1]) + 1
            except:
                next_num = 1
        else:
            next_num = 1
            
        validated_data['folio'] = f'CR-{next_num:04d}'
        
        # Guardamos el contra recibo
        contra_recibo = ContraRecibo.objects.create(**validated_data)
        
        # Guardamos las facturas asociadas
        for factura_data in facturas_data:
            ContraReciboFactura.objects.create(contra_recibo=contra_recibo, **factura_data)
            
        return contra_recibo

