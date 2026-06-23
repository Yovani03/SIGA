from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import PrecioCombustible, CargaCombustible, BloqueCargaCombustible
from .serializers import PrecioCombustibleSerializer, CargaCombustibleSerializer, BulkCargaCombustibleSerializer, BloqueCargaCombustibleSerializer
from django.db.models import Q

class PrecioCombustibleViewSet(viewsets.ModelViewSet):
    queryset = PrecioCombustible.objects.all()
    serializer_class = PrecioCombustibleSerializer

    @action(detail=False, methods=['get'])
    def por_fecha(self, request):
        fecha = request.query_params.get('fecha')
        if not fecha:
            return Response({"error": "Fecha requerida"}, status=status.HTTP_400_BAD_REQUEST)
        
        precio = PrecioCombustible.objects.filter(fecha=fecha).first()
        if precio:
            return Response(PrecioCombustibleSerializer(precio).data)
        return Response({"detail": "No hay precios para esta fecha"}, status=status.HTTP_404_NOT_FOUND)

class BloqueCargaCombustibleViewSet(viewsets.ModelViewSet):
    queryset = BloqueCargaCombustible.objects.all()
    serializer_class = BloqueCargaCombustibleSerializer

    @action(detail=False, methods=['get'])
    def por_dia(self, request):
        fecha = request.query_params.get('fecha')
        if not fecha:
            return Response({"error": "fecha requerida"}, status=status.HTTP_400_BAD_REQUEST)
        
        bloques = list(BloqueCargaCombustible.objects.filter(fecha=fecha).order_by('-fecha_registro'))
        data = BloqueCargaCombustibleSerializer(bloques, many=True).data

        cargas_sin_bloque = CargaCombustible.objects.filter(fecha=fecha, bloque__isnull=True).order_by('-fecha_registro')
        if cargas_sin_bloque.exists():
            cargas_data = CargaCombustibleSerializer(cargas_sin_bloque, many=True).data
            total_litros = sum(float(c.litros) for c in cargas_sin_bloque)
            total_monto = sum(float(c.monto_total) for c in cargas_sin_bloque)
            
            synthetic_block = {
                "id": "Especiales",
                "fecha": fecha,
                "fecha_registro": cargas_sin_bloque.first().fecha_registro.isoformat() if cargas_sin_bloque.first().fecha_registro else None,
                "total_litros": total_litros,
                "total_monto": total_monto,
                "cargas": cargas_data
            }
            data.append(synthetic_block)

        return Response(data)

class CargaCombustibleViewSet(viewsets.ModelViewSet):
    queryset = CargaCombustible.objects.all()
    serializer_class = CargaCombustibleSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        instance = self.get_object()
        if instance.bloque:
            instance.bloque.update_totals()
        # Actualizar la factura asociada
        from facturacion.models import Factura
        num_eco = instance.unidad.numero_economico if instance.unidad else (instance.unidad_variada.numero_economico if instance.unidad_variada else 'UNK')
        facturas = Factura.objects.filter(folio__startswith=f"FUEL-{instance.fecha}-{num_eco}")
        for f in facturas:
            f.monto = instance.monto_total
            f.save()
        return response

    @action(detail=False, methods=['post'])
    def registro_diario(self, request):
        serializer = BulkCargaCombustibleSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return Response(status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def historial_unidad(self, request):
        unidad_id = request.query_params.get('unidad_id')
        unidad_variada_id = request.query_params.get('unidad_variada_id')
        
        if not unidad_id and not unidad_variada_id:
            return Response({"error": "unidad_id o unidad_variada_id requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        if unidad_variada_id:
            cargas = CargaCombustible.objects.filter(unidad_variada_id=unidad_variada_id).order_by('-fecha')
        else:
            cargas = CargaCombustible.objects.filter(unidad_id=unidad_id).order_by('-fecha')
            
        return Response(CargaCombustibleSerializer(cargas, many=True).data)
    @action(detail=False, methods=['get'])
    def por_dia(self, request):
        fecha = request.query_params.get('fecha')
        if not fecha:
            return Response({"error": "fecha requerida"}, status=status.HTTP_400_BAD_REQUEST)
        
        cargas = CargaCombustible.objects.filter(fecha=fecha).order_by('id')
        return Response(CargaCombustibleSerializer(cargas, many=True).data)
