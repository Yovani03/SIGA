from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from .models import Factura, Producto, Ticket
from .serializers import FacturaSerializer, ProductoSerializer, TicketSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Retorna tickets que aún no han sido convertidos en factura."""
        tickets = Ticket.objects.filter(convertido_en_factura=False)
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

from usuarios.models import HistorialAccion
from django.db.models import Sum, Count, Q
from core.pagination import CustomPagination

class FacturaViewSet(viewsets.ModelViewSet):
    serializer_class = FacturaSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    pagination_class = CustomPagination
    search_fields = ['folio', 'descripcion', 'taller__nombre', 'proveedor__nombre', 'rfc_emisor', 'razon_social_emisor', 'unidad__numero_economico', 'unidad__placas', 'caja__numero_economico', 'caja__placas', 'variado__numero_economico', 'variado__placas']
    filterset_fields = ['cancelado']
    ordering_fields = ['fecha', 'monto']

    def get_queryset(self):
        queryset = Factura.objects.all().order_by('-fecha')
        
        # Filtrado por rango de fechas
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
            
        # Filtrado por categoría
        categoria = self.request.query_params.get('categoria')
        exclude_categoria = self.request.query_params.get('exclude_categoria')
        if categoria:
            queryset = queryset.filter(categoria=categoria)
        if exclude_categoria:
            queryset = queryset.exclude(categoria=exclude_categoria)
            
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Filtramos facturas canceladas para los totales
        valid_qs = queryset.filter(cancelado=False)
        
        total = valid_qs.aggregate(total_monto=Sum('monto'))['total_monto'] or 0
        count = valid_qs.count()
        unidades = valid_qs.exclude(unidad__isnull=True).values('unidad').distinct().count()
        
        # También podemos agrupar por categoría para la gráfica
        chart_data_raw = valid_qs.values('categoria', 'producto__categoria').annotate(monto_total=Sum('monto'))
        chart_data = {}
        for item in chart_data_raw:
            cat = item['categoria']
            if not cat or cat == 'Otro':
                cat = item['producto__categoria'] or 'Otro'
            chart_data[cat] = chart_data.get(cat, 0) + float(item['monto_total'] or 0)
            
        chart_data_list = [{'name': k, 'value': v} for k, v in chart_data.items()]
        chart_data_list.sort(key=lambda x: x['value'], reverse=True)
        
        return Response({
            'total': float(total),
            'count': count,
            'units': unidades,
            'chart_data': chart_data_list
        })

    def perform_create(self, serializer):
        factura = serializer.save()
        user = self.request.user if self.request.user.is_authenticated else None
        
        monto = factura.monto if hasattr(factura, 'monto') else 'N/A'
        
        HistorialAccion.objects.create(
            user=user,
            accion="Alta de Factura",
            detalles=f"Se ha dado de alta la factura con folio {factura.folio}."
        )

        es_preventivo = self.request.data.get('es_preventivo') == 'true' or self.request.data.get('es_preventivo') is True
        if es_preventivo:
            fecha_servicio = self.request.data.get('fecha_servicio')
            if not fecha_servicio:
                fecha_servicio = factura.fecha

            from django.utils.dateparse import parse_date
            if isinstance(fecha_servicio, str):
                fecha_servicio = parse_date(fecha_servicio)

            # Extraemos las unidades primarias o del arreglo
            unidades_a_reiniciar = set()
            
            unidades_mantenimiento_raw = self.request.data.get('unidades_mantenimiento')
            if unidades_mantenimiento_raw:
                import json
                try:
                    selected_ids = set(json.loads(unidades_mantenimiento_raw))
                    from vehiculos.models import UnidadTractocamion
                    for u in UnidadTractocamion.objects.filter(id__in=selected_ids):
                        unidades_a_reiniciar.add(u)
                except Exception:
                    pass
            
            if not unidades_a_reiniciar:
                if factura.unidad:
                    unidades_a_reiniciar.add(factura.unidad)
                for u in factura.unidades.all():
                    unidades_a_reiniciar.add(u)

            # Las cajas y variados no tienen ultimo_kilometraje_mantenimiento en sus modelos base
            for unidad in unidades_a_reiniciar:
                unidad.ultimo_kilometraje_mantenimiento = unidad.ultimo_kilometraje
                unidad.fecha_ultimo_mantenimiento = fecha_servicio
                unidad.save()

    def update(self, request, *args, **kwargs):
        user = request.user
        try:
            rol = user.perfil.rol
        except:
            rol = 'capturista'

        if rol == 'capturista':
            motivo = request.data.get('motivo_cambio')
            if not motivo:
                return Response({'detail': 'Se requiere un motivo para solicitar el cambio.'}, status=400)
            
            factura = self.get_object()
            from .models import SolicitudCambioFactura
            
            # Preparar los datos a guardar en JSON, parseando listas y excluyendo archivos
            cambios = {}
            import json
            for k in request.data.keys():
                if k == 'motivo_cambio' or k == 'archivo_escaneado': continue
                
                # Filtrar arreglos vacíos o nulos en M2M
                if k in ['unidades', 'cajas', 'variados']:
                    # Remover strings vacíos
                    val_list = request.data.getlist(k)
                    cambios[k] = [v for v in val_list if v and v != 'null']
                elif k == 'detalles_unidades':
                    try:
                        cambios[k] = json.loads(request.data.get(k))
                    except:
                        cambios[k] = request.data.get(k)
                else:
                    val = request.data.get(k)
                    if val == 'null' or val == 'undefined':
                        val = None
                    cambios[k] = val
            
            SolicitudCambioFactura.objects.create(
                factura=factura,
                solicitante=user,
                motivo=motivo,
                cambios_propuestos=cambios,
                nuevo_archivo_escaneado=request.FILES.get('archivo_escaneado')
            )
            
            HistorialAccion.objects.create(
                user=user,
                accion="Solicitud de Cambio en Factura",
                detalles=f"Se ha solicitado un cambio en la factura con folio {factura.folio}. Motivo: {motivo}"
            )
            
            return Response({'detail': 'Solicitud de cambio enviada a revisión.'}, status=202)
        
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['get'], url_path='candidatos')
    def candidatos(self, request, pk=None):
        """Return replacement candidate invoices for the same vehicle (unidad, caja or variado) that are not cancelled."""
        from django.db.models import Q
        factura = self.get_object()
        filters = Q()
        if factura.unidad:
            filters |= Q(unidad=factura.unidad)
        if factura.caja:
            filters |= Q(caja=factura.caja)
        if factura.variado:
            filters |= Q(variado=factura.variado)
        if not filters:
            return Response([])
        candidatos_qs = Factura.objects.filter(filters, cancelado=False).exclude(id=factura.id).distinct()
        serializer = self.get_serializer(candidatos_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        """Cancel a factura with reason and mandatory replacement."""
        factura = self.get_object()
        if factura.cancelado:
            return Response({'detail': 'Factura ya está cancelada.'}, status=400)
        motivo = request.data.get('motivo')
        reemplazo_id = request.data.get('factura_reemplazo_id')
        if not motivo:
            return Response({'detail': 'Se requiere motivo de cancelación.'}, status=400)
        if not reemplazo_id:
            return Response({'detail': 'Se requiere seleccionar una factura de reemplazo.'}, status=400)
        try:
            reemplazo = Factura.objects.get(id=reemplazo_id)
        except Factura.DoesNotExist:
            return Response({'detail': 'Factura de reemplazo no encontrada.'}, status=404)
        factura.cancel(motivo, reemplazo)
        
        user = request.user if request.user.is_authenticated else None
        HistorialAccion.objects.create(
            user=user,
            accion="Cancelación de Factura",
            detalles=f"Se solicitó la cancelación de la factura con folio {factura.folio}. Motivo: {motivo}."
        )
        
        serializer = self.get_serializer(factura)
        return Response(serializer.data, status=200)

from .models import SolicitudCambioFactura
from .serializers import SolicitudCambioFacturaSerializer
from django.utils import timezone

class SolicitudCambioFacturaViewSet(viewsets.ModelViewSet):
    queryset = SolicitudCambioFactura.objects.all()
    serializer_class = SolicitudCambioFacturaSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            rol = user.perfil.rol
        except:
            rol = 'capturista'
            
        if rol == 'capturista':
            return SolicitudCambioFactura.objects.filter(solicitante=user)
        return SolicitudCambioFactura.objects.all()

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        try:
            solicitud = self.get_object()
            if solicitud.estado != 'Pendiente':
                return Response({'detail': 'Solo se pueden aprobar solicitudes pendientes.'}, status=400)
                
            # Manejar posibles strings o None en cambios_propuestos
            cambios_raw = solicitud.cambios_propuestos
            import json
            if isinstance(cambios_raw, str):
                try:
                    cambios = json.loads(cambios_raw)
                except:
                    cambios = {}
            elif isinstance(cambios_raw, dict):
                cambios = cambios_raw.copy()
            else:
                cambios = {}

            # Limpiar datos corruptos de solicitudes antiguas si las hay
            if 'archivo_escaneado' in cambios:
                del cambios['archivo_escaneado']
            for k in ['unidades', 'cajas', 'variados']:
                if k in cambios and isinstance(cambios[k], list):
                    cambios[k] = [v for v in cambios[k] if v and v != 'null']
            for k, v in list(cambios.items()):
                if v == 'null' or v == 'undefined' or v == '':
                    cambios[k] = None

            if solicitud.nuevo_archivo_escaneado:
                solicitud.factura.archivo_escaneado = solicitud.nuevo_archivo_escaneado
                solicitud.factura.save(update_fields=['archivo_escaneado'])

            # Usar FacturaSerializer con partial=True para validar los cambios
            serializer = FacturaSerializer(solicitud.factura, data=cambios, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                solicitud.estado = 'Aprobada'
                solicitud.autorizador = request.user
                solicitud.fecha_resolucion = timezone.now()
                solicitud.save()
                
                HistorialAccion.objects.create(
                    user=request.user,
                    accion="Aprobación de Cambio en Factura",
                    detalles=f"Se aprobó el cambio en la factura folio {solicitud.factura.folio} solicitado por {solicitud.solicitante.username}."
                )
                return Response({'detail': 'Solicitud aprobada y factura actualizada.'})
            return Response(serializer.errors, status=400)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print("ERROR EN APROBAR:", error_trace)
            return Response({'detail': f'Error interno: {str(e)}', 'trace': error_trace}, status=500)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.estado != 'Pendiente':
            return Response({'detail': 'Solo se pueden rechazar solicitudes pendientes.'}, status=400)
            
        solicitud.estado = 'Rechazada'
        solicitud.autorizador = request.user
        solicitud.fecha_resolucion = timezone.now()
        solicitud.save()
        
        HistorialAccion.objects.create(
            user=request.user,
            accion="Rechazo de Cambio en Factura",
            detalles=f"Se rechazó el cambio en la factura folio {solicitud.factura.folio} solicitado por {solicitud.solicitante.username}."
        )
        return Response({'detail': 'Solicitud rechazada.'})

