from django.db import models
from vehiculos.models import UnidadTractocamion

class Factura(models.Model):
    fecha = models.DateField(verbose_name="Fecha de Factura")
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto")
    folio = models.CharField(max_length=50, unique=True, verbose_name="Folio de Factura")
    unidad = models.ForeignKey(
        UnidadTractocamion, 
        on_delete=models.CASCADE, 
        related_name='facturas',
        verbose_name="Unidad"
    )
    archivo_escaneado = models.FileField(upload_to='facturas/%Y/%m/', verbose_name="Documento Escaneado")
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.folio} - {self.unidad}"
