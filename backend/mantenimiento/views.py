from rest_framework import viewsets
from .models import InventarioRefacciones, OrdenTrabajo, MantenimientoPreventivo
from .serializers import InventarioRefaccionesSerializer, OrdenTrabajoSerializer, MantenimientoPreventivoSerializer

class InventarioRefaccionesViewSet(viewsets.ModelViewSet):
    queryset = InventarioRefacciones.objects.all()
    serializer_class = InventarioRefaccionesSerializer

class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    queryset = OrdenTrabajo.objects.all()
    serializer_class = OrdenTrabajoSerializer

class MantenimientoPreventivoViewSet(viewsets.ModelViewSet):
    queryset = MantenimientoPreventivo.objects.all()
    serializer_class = MantenimientoPreventivoSerializer
