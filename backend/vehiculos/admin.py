from django.contrib import admin
from .models import UnidadTractocamion, RemolqueCaja

@admin.register(UnidadTractocamion)
class UnidadTractocamionAdmin(admin.ModelAdmin):
    list_display = ('numero_economico', 'placas', 'marca', 'modelo', 'anio')
    search_fields = ('numero_economico', 'placas')

@admin.register(RemolqueCaja)
class RemolqueCajaAdmin(admin.ModelAdmin):
    list_display = ('numero_economico', 'placas', 'tipo')
    search_fields = ('numero_economico', 'placas')
