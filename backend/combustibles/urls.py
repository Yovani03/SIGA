from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrecioCombustibleViewSet, CargaCombustibleViewSet

router = DefaultRouter()
router.register(r'precios', PrecioCombustibleViewSet)
router.register(r'cargas', CargaCombustibleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
