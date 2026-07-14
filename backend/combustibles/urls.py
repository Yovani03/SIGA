from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrecioCombustibleViewSet, CargaCombustibleViewSet, BloqueCargaCombustibleViewSet, EvidenciaGasViewSet

router = DefaultRouter()
router.register(r'precios', PrecioCombustibleViewSet)
router.register(r'cargas', CargaCombustibleViewSet)
router.register(r'bloques', BloqueCargaCombustibleViewSet)
router.register(r'evidencias-gas', EvidenciaGasViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
