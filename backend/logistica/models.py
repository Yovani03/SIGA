from django.db import models
from vehiculos.models import UnidadTractocamion
from operadores.models import Operador

class Viaje(models.Model):
    ESTATUS_CHOICES = [
        ('en_ruta', 'En Ruta'),
        ('completado', 'Completado'),
    ]

    operador = models.ForeignKey(Operador, on_delete=models.CASCADE, related_name='viajes_como_operador')
    vehiculo = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, related_name='viajes')
    ayudante = models.ForeignKey(Operador, on_delete=models.SET_NULL, null=True, blank=True, related_name='viajes_como_ayudante')
    tienda = models.IntegerField(null=True, blank=True, help_text="Número de tienda (10-390), dejar vacío para salida especial")
    destino = models.CharField(max_length=255, null=True, blank=True, help_text="Destino específico para trailers o salidas especiales")
    fecha_salida = models.DateTimeField(null=True, blank=True)
    fecha_llegada = models.DateTimeField(null=True, blank=True)
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='en_ruta')
    completado = models.BooleanField(default=False)
    observaciones = models.TextField(blank=True, null=True)
    bono_sancionado = models.BooleanField(default=False)
    justificacion_sancion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Viaje {self.id} - {self.operador} - Tienda {self.tienda}"

    class Meta:
        verbose_name = 'Viaje'
        verbose_name_plural = 'Viajes'
        ordering = ['-fecha_salida']
class ConfiguracionBono(models.Model):
    capacidad = models.DecimalField(max_digits=4, decimal_places=1, unique=True, verbose_name="Capacidad (Toneladas)")
    monto_base = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Monto Base de Bono")

    def __str__(self):
        return f"{self.capacidad} Ton - ${self.monto_base}"

    class Meta:
        verbose_name = "Configuración de Bono"
        verbose_name_plural = "Configuraciones de Bonos"

class Bitacora(models.Model):
    vehiculo = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, related_name='bitacoras')
    folio = models.IntegerField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    archivo = models.FileField(upload_to='bitacoras/', null=True, blank=True)
    copias_descargadas = models.IntegerField(default=0, help_text="Número de copias descargadas de esta bitácora")

    class Meta:
        verbose_name = 'Bitácora'
        verbose_name_plural = 'Bitácoras'
        ordering = ['-fecha_inicio', '-folio']
        unique_together = ('vehiculo', 'folio')

    def __str__(self):
        return f"Bitácora {self.folio} - Unidad {self.vehiculo.numero_economico} ({self.fecha_inicio} al {self.fecha_fin})"
