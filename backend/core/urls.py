from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from facturacion.views import FacturaViewSet, ProductoViewSet, TicketViewSet, SolicitudCambioFacturaViewSet, ContraReciboViewSet
from vehiculos.views import UnidadViewSet, RemolqueCajaViewSet, VehiculoVariadoViewSet
from mantenimiento.views import (
    InventarioRefaccionesViewSet, 
    OrdenTrabajoViewSet, 
    MantenimientoPreventivoViewSet,
    TallerViewSet
)
from proveedores.views import ProveedorViewSet
from operadores.views import OperadorViewSet, AsignacionHorarioViewSet
from logistica.views import ViajeViewSet, ConfiguracionBonoViewSet, BitacoraViewSet
from combustibles.views import PrecioCombustibleViewSet, CargaCombustibleViewSet, BloqueCargaCombustibleViewSet, EvidenciaGasViewSet


router = routers.DefaultRouter()
router.register(r'facturas', FacturaViewSet)
router.register(r'contra-recibos', ContraReciboViewSet)
router.register(r'solicitudes-cambio', SolicitudCambioFacturaViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'vehiculos', UnidadViewSet)
router.register(r'cajas', RemolqueCajaViewSet)
router.register(r'variados', VehiculoVariadoViewSet)
router.register(r'refacciones', InventarioRefaccionesViewSet)
router.register(r'ordenes-trabajo', OrdenTrabajoViewSet)
router.register(r'preventivos', MantenimientoPreventivoViewSet)
router.register(r'talleres', TallerViewSet)
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'operadores', OperadorViewSet)
router.register(r'asignaciones-horarios', AsignacionHorarioViewSet)
router.register(r'viajes', ViajeViewSet)
router.register(r'configuracion-bonos', ConfiguracionBonoViewSet)
router.register(r'bitacoras', BitacoraViewSet)
router.register(r'precios-combustible', PrecioCombustibleViewSet)
router.register(r'cargas-combustible', CargaCombustibleViewSet)
router.register(r'bloques', BloqueCargaCombustibleViewSet)
router.register(r'evidencias-gas', EvidenciaGasViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('usuarios.urls')),
    path('api/', include(router.urls)),
]

# Servir archivos estáticos y media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
