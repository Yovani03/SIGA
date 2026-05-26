from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Perfil

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        try:
            token['rol'] = user.perfil.rol
        except Perfil.DoesNotExist:
            token['rol'] = 'capturista' # Default fallback
        
        return token

class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'rol')

    def get_rol(self, obj):
        try:
            return obj.perfil.rol
        except Perfil.DoesNotExist:
            return 'capturista'

class UserManagementSerializer(serializers.ModelSerializer):
    rol = serializers.ChoiceField(choices=Perfil.ROLES_CHOICES, write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'is_active', 'rol')

    def to_representation(self, instance):
        repr = super().to_representation(instance)
        try:
            repr['rol'] = instance.perfil.rol
        except Perfil.DoesNotExist:
            repr['rol'] = 'capturista'
        return repr

    def create(self, validated_data):
        rol = validated_data.pop('rol', 'capturista')
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        
        # El perfil se crea por la señal en models.py, lo actualizamos:
        perfil, created = Perfil.objects.get_or_create(user=user)
        perfil.rol = rol
        perfil.save()
        return user

    def update(self, instance, validated_data):
        rol = validated_data.pop('rol', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()

        if rol:
            perfil, created = Perfil.objects.get_or_create(user=instance)
            perfil.rol = rol
            perfil.save()

        return instance
