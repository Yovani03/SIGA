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

    @action(detail=False, methods=['get'])
    def km_anterior(self, request):
        unidad_id = request.query_params.get('unidad_id')
        is_variado = request.query_params.get('is_variado', 'false').lower() == 'true'
        fecha = request.query_params.get('fecha')

        if not unidad_id or not fecha:
            return Response({"error": "unidad_id y fecha son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        if is_variado:
            carga = CargaCombustible.objects.filter(
                unidad_variada_id=unidad_id, 
                fecha__lte=fecha, 
                ignorar_kilometraje=False,
                kilometraje__isnull=False
            ).order_by('-fecha', '-fecha_registro').first()
        else:
            carga = CargaCombustible.objects.filter(
                unidad_id=unidad_id, 
                fecha__lte=fecha, 
                ignorar_kilometraje=False,
                kilometraje__isnull=False
            ).order_by('-fecha', '-fecha_registro').first()

        km_anterior = carga.kilometraje if carga else 0
        return Response({"km_anterior": km_anterior})

    @action(detail=False, methods=['get'])
    def totalizador_unidades(self, request):
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        if not fecha_inicio or not fecha_fin:
            return Response({"error": "fecha_inicio y fecha_fin son requeridos"}, status=status.HTTP_400_BAD_REQUEST)
        
        cargas = CargaCombustible.objects.filter(fecha__gte=fecha_inicio, fecha__lte=fecha_fin)
        
        # Agrupar manualmente en Python para combinar Tractocamiones y Vehículos Variados uniformemente
        resultados = {}
        for c in cargas:
            if c.unidad:
                key = f"t-{c.unidad.id}"
                nombre = c.unidad.numero_economico
            elif c.unidad_variada:
                key = f"v-{c.unidad_variada.id}"
                nombre = c.unidad_variada.numero_economico
            else:
                continue
            
            if key not in resultados:
                resultados[key] = {
                    "id_key": key,
                    "unidad_nombre": nombre,
                    "total_litros": 0,
                    "total_monto": 0,
                    "cantidad_cargas": 0
                }
            resultados[key]["total_litros"] += float(c.litros) if c.litros else 0
            resultados[key]["total_monto"] += float(c.monto_total) if c.monto_total else 0
            resultados[key]["cantidad_cargas"] += 1
            
        lista_resultados = list(resultados.values())
        # Ordenar por total_litros descendente
        lista_resultados.sort(key=lambda x: x['total_litros'], reverse=True)
        
        return Response(lista_resultados)

    @action(detail=False, methods=['get'])
    def historial_especiales(self, request):
        limit = int(request.query_params.get('limit', 50))
        bloques = list(BloqueCargaCombustible.objects.filter(es_especial=True).order_by('-fecha_registro')[:limit])
        return Response(BloqueCargaCombustibleSerializer(bloques, many=True).data)

    @action(detail=False, methods=['post'])
    def registro_especial(self, request):
        cargas_data = request.data
        if not isinstance(cargas_data, list) or not cargas_data:
            return Response({"error": "Debe enviar una lista de cargas"}, status=status.HTTP_400_BAD_REQUEST)
        
        import datetime
        bloque = BloqueCargaCombustible.objects.create(
            fecha=datetime.date.today(),
            es_especial=True
        )

        for carga_data in cargas_data:
            carga_data['bloque'] = bloque.id
            serializer = CargaCombustibleSerializer(data=carga_data)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        bloque.update_totals()
        return Response(status=status.HTTP_201_CREATED)
