from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UsuarioSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)

from rest_framework import viewsets
from django.contrib.auth.models import User
from .serializers import UserManagementSerializer
from .permissions import IsAdminGeneral

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdminGeneral]
