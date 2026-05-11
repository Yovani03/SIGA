from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import PrecioCombustible, CargaCombustible
from .serializers import PrecioCombustibleSerializer, CargaCombustibleSerializer, BulkCargaCombustibleSerializer

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

class CargaCombustibleViewSet(viewsets.ModelViewSet):
    queryset = CargaCombustible.objects.all()
    serializer_class = CargaCombustibleSerializer

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
        if not unidad_id:
            return Response({"error": "unidad_id requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        cargas = CargaCombustible.objects.filter(unidad_id=unidad_id).order_by('-fecha')
        return Response(CargaCombustibleSerializer(cargas, many=True).data)
    @action(detail=False, methods=['get'])
    def por_dia(self, request):
        fecha = request.query_params.get('fecha')
        if not fecha:
            return Response({"error": "fecha requerida"}, status=status.HTTP_400_BAD_REQUEST)
        
        cargas = CargaCombustible.objects.filter(fecha=fecha).order_by('id')
        return Response(CargaCombustibleSerializer(cargas, many=True).data)
