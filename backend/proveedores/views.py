from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django.db.models import Sum
from .models import Proveedor
from .serializers import ProveedorSerializer
from facturacion.models import Factura

class ProveedorViewSet(viewsets.ModelViewSet):
    serializer_class = ProveedorSerializer
    filter_backends = [SearchFilter]
    search_fields = ['nombre', 'categoria', 'telefono', 'email']

    def get_queryset(self):
        queryset = Proveedor.objects.all().order_by('-fecha_registro')
        categoria = self.request.query_params.get('categoria', None)
        if categoria is not None:
            queryset = queryset.filter(categoria=categoria)
        return queryset

    @action(detail=True, methods=['get'], url_path='reporte_gastos')
    def reporte_gastos(self, request, pk=None):
        proveedor = self.get_object()
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Se requieren fecha_inicio y fecha_fin'}, status=400)

        facturas = Factura.objects.filter(
            proveedor=proveedor,
            fecha__range=[fecha_inicio, fecha_fin],
            cancelado=False
        ).order_by('fecha')

        desglose = []
        gran_total = 0

        for f in facturas:
            monto_val = float(f.monto)
            desglose.append({
                'folio': f.folio,
                'fecha': f.fecha,
                'monto': monto_val,
                'descripcion': f.descripcion,
                'categoria': f.categoria
            })
            gran_total += monto_val

        return Response({
            'proveedor': {
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'rfc': proveedor.rfc
            },
            'rango_fechas': f"{fecha_inicio} al {fecha_fin}",
            'resumen': {
                'gran_total': gran_total,
                'total_facturas': len(desglose)
            },
            'desglose': desglose
        })
