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
        viaje = serializer.save()
        # Actualizar estatus del operador
        operador = viaje.operador
        operador.estatus = 'viaje'
        operador.save()

    @action(detail=True, methods=['post'])
    def avanzar_estatus(self, request, pk=None):
        viaje = self.get_object()
        if viaje.completado:
            return Response({'error': 'Este viaje ya ha sido completado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if viaje.estatus == 'en_ruta':
            if viaje.vehiculo.capacidad == 0.0:
                # Salto directo a completado para vehículos ligeros
                viaje.estatus = 'completado'
                viaje.completado = True
                viaje.fecha_llegada = timezone.now()
                
                # Liberar personal
                operador = viaje.operador
                operador.estatus = 'patio'
                operador.save()
                if viaje.ayudante:
                    ayudante = viaje.ayudante
                    ayudante.estatus = 'patio'
                    ayudante.save()
            else:
                viaje.estatus = 'en_tienda'
        elif viaje.estatus == 'en_tienda':
            viaje.estatus = 'regresando'
        elif viaje.estatus == 'regresando':
            viaje.estatus = 'completado'
            viaje.completado = True
            viaje.fecha_llegada = timezone.now()
            
            # Actualizar estatus del operador de vuelta a patio
            operador = viaje.operador
            operador.estatus = 'patio'
            operador.save()

            # Si tiene ayudante, tambi n liberarlo
            if viaje.ayudante:
                ayudante = viaje.ayudante
                ayudante.estatus = 'patio'
                ayudante.save()
        
        viaje.save()
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
        # Mantenemos este mtodo por compatibilidad o para salto directo a completado si fuera necesario
        viaje = self.get_object()
        viaje.estatus = 'completado'
        viaje.completado = True
        viaje.fecha_llegada = timezone.now()
        viaje.save()

        operador = viaje.operador
        operador.estatus = 'patio'
        operador.save()
        
        # Si tiene ayudante, tambin liberarlo
        if viaje.ayudante:
            ayudante = viaje.ayudante
            ayudante.estatus = 'patio'
            ayudante.save()

        return Response(ViajeSerializer(viaje).data)

class ConfiguracionBonoViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionBono.objects.all()
    serializer_class = ConfiguracionBonoSerializer
    ordering = ['capacidad']
