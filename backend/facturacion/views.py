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

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer

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
        serializer = self.get_serializer(factura)
        return Response(serializer.data, status=200)

