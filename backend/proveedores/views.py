from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from .models import Proveedor
from .serializers import ProveedorSerializer

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
