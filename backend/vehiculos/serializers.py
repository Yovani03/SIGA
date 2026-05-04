from rest_framework import serializers
from .models import UnidadTractocamion

class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadTractocamion
        fields = '__all__'
