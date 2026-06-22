from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
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

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer

    def perform_create(self, serializer):
        factura = serializer.save()
        user = self.request.user if self.request.user.is_authenticated else None
        
        monto = factura.monto if hasattr(factura, 'monto') else 'N/A'
        
        HistorialAccion.objects.create(
            user=user,
            accion="Alta de Factura",
            detalles=f"Se ha dado de alta la factura con folio {factura.folio}."
        )

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
                cambios_propuestos=cambios
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
        solicitud = self.get_object()
        if solicitud.estado != 'Pendiente':
            return Response({'detail': 'Solo se pueden aprobar solicitudes pendientes.'}, status=400)
            
        # Copiar los cambios propuestos
        cambios = solicitud.cambios_propuestos.copy()

        # Limpiar datos corruptos de solicitudes antiguas si las hay
        if 'archivo_escaneado' in cambios:
            del cambios['archivo_escaneado']
        for k in ['unidades', 'cajas', 'variados']:
            if k in cambios and isinstance(cambios[k], list):
                cambios[k] = [v for v in cambios[k] if v and v != 'null']
        for k, v in list(cambios.items()):
            if v == 'null' or v == 'undefined' or v == '':
                cambios[k] = None

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

