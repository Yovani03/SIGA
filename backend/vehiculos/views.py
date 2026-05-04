from rest_framework import viewsets
from .models import UnidadTractocamion
from .serializers import UnidadSerializer

class UnidadViewSet(viewsets.ModelViewSet):
    queryset = UnidadTractocamion.objects.all()
    serializer_class = UnidadSerializer
