from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.routers import DefaultRouter
from .serializers import CustomTokenObtainPairSerializer
from . import views

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'gestion-usuarios', views.UserViewSet, basename='gestion-usuarios')
router.register(r'historial', views.HistorialAccionViewSet, basename='historial-acciones')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.current_user, name='current_user'),
    path('', include(router.urls)),
]
