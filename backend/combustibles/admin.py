from django.contrib import admin
from .models import PrecioCombustible, CargaCombustible

@admin.register(PrecioCombustible)
class PrecioCombustibleAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'precio_magna', 'precio_premium', 'precio_diesel')
    list_filter = ('fecha',)

@admin.register(CargaCombustible)
class CargaCombustibleAdmin(admin.ModelAdmin):
    list_display = ('unidad', 'fecha', 'tipo_combustible', 'litros', 'monto_total', 'rendimiento')
    list_filter = ('fecha', 'tipo_combustible', 'unidad')
    search_fields = ('unidad__numero_economico', 'unidad__placas')
