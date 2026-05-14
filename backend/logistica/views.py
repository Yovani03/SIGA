from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Viaje, ConfiguracionBono
from .serializers import ViajeSerializer, ConfiguracionBonoSerializer
from operadores.models import Operador

class ViajeViewSet(viewsets.ModelViewSet):
    queryset = Viaje.objects.all()
    serializer_class = ViajeSerializer

    def perform_create(self, serializer):
        # Si no se proporciona fecha_salida, usar la actual
        fecha_salida = self.request.data.get('fecha_salida')
        if not fecha_salida:
            viaje = serializer.save(fecha_salida=timezone.now())
        else:
            viaje = serializer.save()
            
        # Actualizar estatus del operador
        operador = viaje.operador
        operador.estatus = 'viaje'
        operador.save()
        
        # Actualizar estatus del ayudante si existe
        if viaje.ayudante:
            ayudante = viaje.ayudante
            ayudante.estatus = 'viaje'
            ayudante.save()

    @action(detail=True, methods=['post'])
    def avanzar_estatus(self, request, pk=None):
        viaje = self.get_object()
        if viaje.completado:
            return Response({'error': 'Este viaje ya ha sido completado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # En el nuevo flujo, cualquier avance desde 'en_ruta' significa completar el viaje (llegada a CEDIS)
        viaje.estatus = 'completado'
        viaje.completado = True
        
        # Si se envía fecha_llegada en el body, usarla. Si no, usar la actual.
        fecha_llegada = request.data.get('fecha_llegada')
        if fecha_llegada:
            viaje.fecha_llegada = fecha_llegada
        else:
            viaje.fecha_llegada = timezone.now()
        
        viaje.save()

        # Liberar personal
        operador = viaje.operador
        operador.estatus = 'patio'
        operador.save()
        
        if viaje.ayudante:
            ayudante = viaje.ayudante
            ayudante.estatus = 'patio'
            ayudante.save()
            
        return Response(ViajeSerializer(viaje).data)

    @action(detail=True, methods=['post'])
    def set_ayudante(self, request, pk=None):
        viaje = self.get_object()
        ayudante_id = request.data.get('ayudante_id')
        
        if not ayudante_id:
            return Response({'error': 'ID de ayudante requerido.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            ayudante = Operador.objects.get(id=ayudante_id)
            if ayudante.estatus == 'viaje':
                return Response({'error': 'El ayudante ya est en un viaje.'}, status=status.HTTP_400_BAD_REQUEST)
                
            viaje.ayudante = ayudante
            viaje.save()
            
            # Marcar ayudante como ocupado
            ayudante.estatus = 'viaje'
            ayudante.save()
            
            return Response(ViajeSerializer(viaje).data)
        except Operador.DoesNotExist:
            return Response({'error': 'Operador no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def registrar_llegada(self, request, pk=None):
        viaje = self.get_object()
        viaje.estatus = 'completado'
        viaje.completado = True
        
        fecha_llegada = request.data.get('fecha_llegada')
        if fecha_llegada:
            viaje.fecha_llegada = fecha_llegada
        else:
            viaje.fecha_llegada = timezone.now()
            
        viaje.save()

        operador = viaje.operador
        operador.estatus = 'patio'
        operador.save()
        
        if viaje.ayudante:
            ayudante = viaje.ayudante
            ayudante.estatus = 'patio'
            ayudante.save()

        return Response(ViajeSerializer(viaje).data)

class ConfiguracionBonoViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionBono.objects.all()
    serializer_class = ConfiguracionBonoSerializer
    ordering = ['capacidad']
