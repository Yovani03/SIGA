from django.contrib import admin
from .models import Proveedor

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'telefono', 'email')
    search_fields = ('nombre', 'categoria')
    list_filter = ('categoria',)
