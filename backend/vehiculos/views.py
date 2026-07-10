from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import UnidadTractocamion, RemolqueCaja, VehiculoVariado
from .serializers import UnidadSerializer, RemolqueCajaSerializer, VehiculoVariadoSerializer

class RemolqueCajaViewSet(viewsets.ModelViewSet):
    queryset = RemolqueCaja.objects.all()
    serializer_class = RemolqueCajaSerializer

class VehiculoVariadoViewSet(viewsets.ModelViewSet):
    queryset = VehiculoVariado.objects.all()
    serializer_class = VehiculoVariadoSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        fecha = request.query_params.get('fecha')
        
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        if fecha:
            from combustibles.models import CargaCombustible
            for item in data:
                ultima_carga = CargaCombustible.objects.filter(
                    unidad_variada_id=item['id'], 
                    fecha__lt=fecha,
                    kilometraje__isnull=False
                ).order_by('-fecha', '-id').first()
                
                if ultima_carga:
                    item['ultimo_kilometraje'] = ultima_carga.kilometraje
                else:
                    item['ultimo_kilometraje'] = 0

        return Response(data)

class UnidadViewSet(viewsets.ModelViewSet):
    queryset = UnidadTractocamion.objects.all()
    serializer_class = UnidadSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        fecha = request.query_params.get('fecha')
        
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        if fecha:
            from combustibles.models import CargaCombustible
            for item in data:
                ultima_carga = CargaCombustible.objects.filter(
                    unidad_id=item['id'], 
                    fecha__lt=fecha,
                    kilometraje__isnull=False
                ).order_by('-fecha', '-id').first()
                
                if ultima_carga:
                    item['ultimo_kilometraje'] = ultima_carga.kilometraje
                else:
                    item['ultimo_kilometraje'] = 0

        return Response(data)

    @action(detail=True, methods=['get'])
    def reporte_gastos(self, request, pk=None):
        unidad = self.get_object()
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros de fecha'}, status=400)

        # Gasto de Combustible
        from combustibles.models import CargaCombustible
        cargas = CargaCombustible.objects.filter(
            unidad=unidad, 
            fecha__range=[fecha_inicio, fecha_fin]
        ).order_by('fecha')
        
        cargas_data = []
        total_combustible = 0
        for c in cargas:
            cargas_data.append({
                'fecha': c.fecha,
                'litros': c.litros,
                'monto_total': c.monto_total,
                'tipo_combustible': c.tipo_combustible
            })
            total_combustible += (c.monto_total or 0)

        # Gasto de Mantenimiento
        from mantenimiento.models import OrdenTrabajo
        ordenes = OrdenTrabajo.objects.filter(
            unidad=unidad, 
            fecha_creacion__date__range=[fecha_inicio, fecha_fin]
        ).order_by('fecha_creacion')

        ordenes_data = []
        total_mantenimiento = 0
        for o in ordenes:
            ordenes_data.append({
                'fecha': o.fecha_creacion.date(),
                'folio': o.folio,
                'costo_total': o.costo_total,
                'tipo': o.tipo
            })
            total_mantenimiento += (o.costo_total or 0)

        return Response({
            'unidad': {
                'numero_economico': unidad.numero_economico,
                'placas': unidad.placas,
                'marca': unidad.marca,
            },
            'resumen': {
                'total_combustible': total_combustible,
                'total_mantenimiento': total_mantenimiento,
                'gran_total': total_combustible + total_mantenimiento
            },
            'desglose': {
                'combustible': cargas_data,
                'mantenimiento': ordenes_data
            }
        })


    @action(detail=False, methods=['get'])
    def proyeccion_mantenimiento(self, request):
        unidades = self.get_queryset().order_by('numero_economico')
        proyecciones = []
        hoy = timezone.now().date()

        for u in unidades:
            # Reglas de intervalo
            if u.capacidad <= 1.0 and u.tipo_combustible in ['magna', 'premium']:
                tipo_vehiculo = 'Coche Gasolina'
                intervalo_km = 10000
                intervalo_meses = 6
            elif u.capacidad > 1.0 and u.capacidad <= 3.5 and u.tipo_combustible in ['magna', 'premium']:
                tipo_vehiculo = 'Camioneta Gasolina'
                intervalo_km = 10000
                intervalo_meses = 6
            elif u.tipo_combustible == 'diesel':
                tipo_vehiculo = 'Camión Diésel'
                intervalo_km = 20000
                intervalo_meses = 12
            elif u.tipo_combustible == 'electrico':
                tipo_vehiculo = 'Eléctrico'
                intervalo_km = 15000
                intervalo_meses = 12
            else:
                tipo_vehiculo = 'General'
                intervalo_km = 10000
                intervalo_meses = 6

            km_actual = u.ultimo_kilometraje or 0
            km_ultimo = u.ultimo_kilometraje_mantenimiento or 0
            fecha_ultimo = u.fecha_ultimo_mantenimiento
            
            if fecha_ultimo:
                fecha_limite = fecha_ultimo + timedelta(days=intervalo_meses * 30)
                dias_restantes = (fecha_limite - hoy).days
            else:
                fecha_limite = None
                dias_restantes = None
            
            # Determinar estado
            if u.ignorar_kilometraje:
                km_limite = None
                km_restante = None
                
                # Determinar estado únicamente por tiempo transcurrido
                if not fecha_ultimo:
                    estado = 'sin_iniciar'
                elif dias_restantes is not None and dias_restantes <= 0:
                    estado = 'vencido'
                elif dias_restantes is not None and dias_restantes <= 15:
                    estado = 'proximo'
                else:
                    estado = 'ok'
            else:
                km_limite = km_ultimo + intervalo_km
                km_restante = km_limite - km_actual
                
                # Determinar estado por kilometraje o por tiempo
                if not fecha_ultimo:
                    estado = 'sin_iniciar'
                elif km_restante <= 0 or (dias_restantes is not None and dias_restantes <= 0):
                    estado = 'vencido'
                elif km_restante <= 1000 or (dias_restantes is not None and dias_restantes <= 15):
                    estado = 'proximo'
                else:
                    estado = 'ok'
                
            proyecciones.append({
                'id': u.id,
                'numero_economico': u.numero_economico,
                'placas': u.placas,
                'marca': u.marca,
                'modelo': u.modelo,
                'tipo_vehiculo': tipo_vehiculo,
                'intervalo_km': intervalo_km,
                'intervalo_meses': intervalo_meses,
                'km_actual': km_actual,
                'km_ultimo_mantenimiento': km_ultimo,
                'km_restantes': km_restante,
                'fecha_ultimo_mantenimiento': fecha_ultimo,
                'fecha_limite': fecha_limite,
                'dias_restantes': dias_restantes,
                'estado_alerta': estado,
            })
            
        # Sort by urgency (vencido > proximo > ok > sin_iniciar)
        orden = {'vencido': 0, 'proximo': 1, 'ok': 2, 'sin_iniciar': 3}
        proyecciones.sort(key=lambda x: orden.get(x['estado_alerta'], 4))
        
        return Response(proyecciones)

    @action(detail=True, methods=['post'])
    def reset_mantenimiento(self, request, pk=None):
        unidad = self.get_object()
        unidad.ultimo_kilometraje_mantenimiento = unidad.ultimo_kilometraje
        unidad.fecha_ultimo_mantenimiento = timezone.now().date()
        unidad.save()
        return Response({'status': 'ok', 'message': 'Contadores de mantenimiento reiniciados exitosamente'})
