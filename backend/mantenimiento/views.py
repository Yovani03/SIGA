from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import InventarioRefacciones, OrdenTrabajo, MantenimientoPreventivo, Taller
from .serializers import InventarioRefaccionesSerializer, OrdenTrabajoSerializer, MantenimientoPreventivoSerializer, TallerSerializer
from facturacion.models import Factura, Ticket

class InventarioRefaccionesViewSet(viewsets.ModelViewSet):
    queryset = InventarioRefacciones.objects.all()
    serializer_class = InventarioRefaccionesSerializer

class TallerViewSet(viewsets.ModelViewSet):
    queryset = Taller.objects.all()
    serializer_class = TallerSerializer

class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    queryset = OrdenTrabajo.objects.all()
    serializer_class = OrdenTrabajoSerializer

    def perform_create(self, serializer):
        orden = serializer.save()
        orden.unidad.estado = 'en_mantenimiento'
        orden.unidad.save()

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        orden = self.get_object()
        ticket_ids = request.data.get('tickets', [])
        
        # Verify tickets exist and belong to the same unit
        tickets = Ticket.objects.filter(id__in=ticket_ids)
        if len(tickets) != len(ticket_ids):
            return Response({'error': 'Uno o más tickets no existen.'}, status=status.HTTP_400_BAD_REQUEST)
        
        for t in tickets:
            if t.unidad != orden.unidad:
                return Response({'error': f'El ticket {t.folio_interno} no pertenece a la unidad {orden.unidad.numero_economico}.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update OrdenTrabajo
        total_cost = sum(t.monto for t in tickets)
        orden.costo_total = total_cost
        orden.estatus = 'completado'
        orden.save()
        orden.tickets.set(tickets)

        # Update Unidad
        orden.unidad.estado = 'operativa'
        if orden.tipo == 'preventivo':
            from django.utils import timezone
            orden.unidad.ultimo_kilometraje_mantenimiento = orden.unidad.ultimo_kilometraje
            orden.unidad.fecha_ultimo_mantenimiento = timezone.now().date()
        orden.unidad.save()

        return Response({'status': 'Orden de trabajo completada y tickets asociados.'})

class MantenimientoPreventivoViewSet(viewsets.ModelViewSet):
    queryset = MantenimientoPreventivo.objects.all()
    serializer_class = MantenimientoPreventivoSerializer
