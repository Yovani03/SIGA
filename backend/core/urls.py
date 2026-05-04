from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from facturacion.views import FacturaViewSet
from vehiculos.views import UnidadViewSet
from mantenimiento.views import (
    InventarioRefaccionesViewSet, 
    OrdenTrabajoViewSet, 
    MantenimientoPreventivoViewSet
)

router = routers.DefaultRouter()
router.register(r'facturas', FacturaViewSet)
router.register(r'vehiculos', UnidadViewSet)
router.register(r'refacciones', InventarioRefaccionesViewSet)
router.register(r'ordenes-trabajo', OrdenTrabajoViewSet)
router.register(r'preventivos', MantenimientoPreventivoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]

# Servir archivos estáticos y media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
