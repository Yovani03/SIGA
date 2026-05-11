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
