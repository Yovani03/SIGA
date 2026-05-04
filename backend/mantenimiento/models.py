from django.db import models
from vehiculos.models import UnidadTractocamion

class InventarioRefacciones(models.Model):
    nombre = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True)
    cantidad = models.IntegerField(default=0)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.nombre

class OrdenTrabajo(models.Model):
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en proceso', 'En Proceso'),
        ('completado', 'Completado'),
    ]
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, related_name='ordenes_trabajo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField()
    estatus = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendiente')
    refacciones = models.ManyToManyField(InventarioRefacciones, blank=True)

    def __str__(self):
        return f"OT-{self.id} ({self.unidad})"

class MantenimientoPreventivo(models.Model):
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, related_name='mantenimientos_preventivos')
    fecha_programada = models.DateField()
    descripcion = models.TextField()
    completado = models.BooleanField(default=False)

    def __str__(self):
        return f"Preventivo - {self.unidad} - {self.fecha_programada}"
