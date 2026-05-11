from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViajeViewSet, ConfiguracionBonoViewSet

router = DefaultRouter()
router.register(r'viajes', ViajeViewSet, basename='viajes')
router.register(r'configuracion-bonos', ConfiguracionBonoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
