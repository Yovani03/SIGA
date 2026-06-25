from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViajeViewSet, ConfiguracionBonoViewSet, BitacoraViewSet

router = DefaultRouter()
router.register(r'viajes', ViajeViewSet, basename='viajes')
router.register(r'configuracion-bonos', ConfiguracionBonoViewSet)
router.register(r'bitacoras', BitacoraViewSet, basename='bitacoras')

urlpatterns = [
    path('', include(router.urls)),
]
