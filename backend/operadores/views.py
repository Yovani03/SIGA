from rest_framework import viewsets
from .models import Operador, AsignacionHorario
from .serializers import OperadorSerializer, AsignacionHorarioSerializer

class OperadorViewSet(viewsets.ModelViewSet):
    queryset = Operador.objects.all()
    serializer_class = OperadorSerializer

class AsignacionHorarioViewSet(viewsets.ModelViewSet):
    queryset = AsignacionHorario.objects.all()
    serializer_class = AsignacionHorarioSerializer
