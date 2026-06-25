from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Viaje, ConfiguracionBono, Bitacora
from .serializers import ViajeSerializer, ConfiguracionBonoSerializer, BitacoraSerializer
from operadores.models import Operador
from vehiculos.models import UnidadTractocamion
import openpyxl
import os
import datetime
from django.core.files import File
from django.conf import settings
from tempfile import NamedTemporaryFile

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

class BitacoraViewSet(viewsets.ModelViewSet):
    queryset = Bitacora.objects.all()
    serializer_class = BitacoraSerializer

    @action(detail=False, methods=['post'])
    def generar(self, request):
        vehiculo_id = request.data.get('vehiculo_id')
        fecha_str = request.data.get('fecha_inicio')

        if not vehiculo_id or not fecha_str:
            return Response({'error': 'vehiculo_id y fecha_inicio son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vehiculo = UnidadTractocamion.objects.get(id=vehiculo_id)
        except UnidadTractocamion.DoesNotExist:
            return Response({'error': 'Vehículo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            fecha_inicio = datetime.datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido. Usa YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure fecha_inicio is a Friday
        if fecha_inicio.weekday() != 4: # 4 is Friday
            # Adjust to the most recent Friday or next Friday?
            # Normally the frontend sends the correct Friday. If not, error out or auto-correct.
            return Response({'error': 'La fecha de inicio debe ser un viernes.'}, status=status.HTTP_400_BAD_REQUEST)

        fecha_fin = fecha_inicio + datetime.timedelta(days=6)

        # Generate folio
        last_bitacora = Bitacora.objects.filter(vehiculo=vehiculo).order_by('-folio').first()
        folio = 1 if not last_bitacora else last_bitacora.folio + 1

        # Check if already exists for this date and vehicle
        existing = Bitacora.objects.filter(vehiculo=vehiculo, fecha_inicio=fecha_inicio).first()
        if existing:
            return Response(BitacoraSerializer(existing).data)

        # Excel Manipulation
        template_path = os.path.join(settings.BASE_DIR, '..', 'formato bitacora', 'FORMATO CEDIS Y TRANSPORTES FINAL.xlsx')
        if not os.path.exists(template_path):
            return Response({'error': 'Template de Excel no encontrado.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        wb = openpyxl.load_workbook(template_path)
        sheet = wb.active
        sheet.title = vehiculo.numero_economico or "Bitacora"

        meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
        str_fecha = f"{fecha_inicio.day} de {meses[fecha_inicio.month - 1]} al {fecha_fin.day} de {meses[fecha_fin.month - 1]}"

        # Header formatting
        sheet.cell(row=1, column=1, value=f"AUTOTRANSPORTES COLUMBIA                                                                                 FOLIO: {folio:03d}")
        sheet.cell(row=2, column=1, value=f"UNIDAD: {vehiculo.numero_economico}  |  PLACAS: {vehiculo.placas or 'S/N'}  |  SEMANA: {str_fecha}")
        
        # Optional: format the row 2
        sheet.cell(row=2, column=1).font = openpyxl.styles.Font(bold=True, size=12)

        # Save to temp file
        with NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
            wb.save(tmp.name)
            tmp_path = tmp.name

        # Create record
        bitacora = Bitacora(
            vehiculo=vehiculo,
            folio=folio,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        with open(tmp_path, 'rb') as f:
            file_name = f"Bitacora_U{vehiculo.numero_economico}_Folio{folio}_{fecha_inicio.strftime('%Y%m%d')}.xlsx"
            bitacora.archivo.save(file_name, File(f))
            
        bitacora.save()
        os.unlink(tmp_path)

        return Response(BitacoraSerializer(bitacora).data, status=status.HTTP_201_CREATED)
