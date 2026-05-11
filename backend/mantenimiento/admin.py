from django.contrib import admin
from .models import InventarioRefacciones, OrdenTrabajo, MantenimientoPreventivo, Taller

@admin.register(Taller)
class TallerAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'especialidad', 'telefono', 'direccion')
    search_fields = ('nombre', 'especialidad')


@admin.register(InventarioRefacciones)
class InventarioRefaccionesAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'sku', 'cantidad', 'precio_unitario')
    search_fields = ('nombre', 'sku')

@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = ('id', 'unidad', 'fecha_creacion', 'estatus')
    list_filter = ('estatus',)
    search_fields = ('unidad__numero_economico', 'descripcion')

@admin.register(MantenimientoPreventivo)
class MantenimientoPreventivoAdmin(admin.ModelAdmin):
    list_display = ('unidad', 'fecha_programada', 'completado')
    list_filter = ('completado',)
    search_fields = ('unidad__numero_economico',)
