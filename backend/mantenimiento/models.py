from django.db import models
from vehiculos.models import UnidadTractocamion

class Taller(models.Model):
    ESPECIALIDAD_CHOICES = [
        ('Motores Diesel', 'Motores Diesel'),
        ('Frenos y Suspensión', 'Frenos y Suspensión'),
        ('Transmisiones', 'Transmisiones'),
        ('Eléctrico', 'Eléctrico / Electrónico'),
        ('Llantas', 'Llantas'),
        ('Carrocería', 'Carrocería y Pintura'),
        ('Mantenimiento General', 'Mantenimiento General'),
        ('Hidráulico', 'Hidráulico'),
    ]
    nombre = models.CharField(max_length=200)
    direccion = models.TextField()
    telefono = models.CharField(max_length=20, blank=True, null=True)
    especialidad = models.CharField(max_length=255, blank=True, null=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    url_mapa = models.URLField(max_length=500, blank=True, null=True)
    rfc = models.CharField(max_length=13, blank=True, null=True, verbose_name="RFC")
    razon_social = models.CharField(max_length=255, blank=True, null=True, verbose_name="Razón Social / Nombre Emisor")

    def __str__(self):
        return self.nombre


class InventarioRefacciones(models.Model):
    nombre = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True)
    cantidad = models.IntegerField(default=0)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.nombre

class OrdenTrabajo(models.Model):
    STATUS_CHOICES = [
        ('en proceso', 'En Proceso'),
        ('en espera', 'En Espera'),
        ('completado', 'Completado'),
    ]
    TIPO_CHOICES = [
        ('preventivo', 'Preventivo'),
        ('correctivo', 'Correctivo'),
    ]
    MOTIVO_ESPERA_CHOICES = [
        ('falta_refaccion', 'Falta de pieza/refacción'),
        ('taller_lleno', 'Sin espacio en taller'),
        ('falta_presupuesto', 'Aprobación de presupuesto'),
        ('otro', 'Otro motivo'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='correctivo')
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, related_name='ordenes_trabajo')
    folio = models.CharField(max_length=50, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField()
    estatus = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en proceso')
    motivo_espera = models.CharField(max_length=50, choices=MOTIVO_ESPERA_CHOICES, blank=True, null=True)
    refacciones = models.ManyToManyField(InventarioRefacciones, blank=True)
    costo_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    archivo_escaneado = models.FileField(upload_to='mantenimiento/facturas/', blank=True, null=True)
    facturas = models.ManyToManyField('facturacion.Factura', blank=True, related_name='ordenes_trabajo')
    tickets = models.ManyToManyField('facturacion.Ticket', blank=True, related_name='ordenes_trabajo')
    taller = models.ForeignKey(Taller, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_trabajo')

    def save(self, *args, **kwargs):
        if not self.folio:
            last_orden = OrdenTrabajo.objects.filter(folio__startswith='REP-').order_by('id').last()
            if last_orden:
                try:
                    last_num = int(last_orden.folio.split('-')[1])
                    self.folio = f"REP-{last_num + 1:04d}"
                except (ValueError, IndexError):
                    self.folio = f"REP-{OrdenTrabajo.objects.count() + 1:04d}"
            else:
                self.folio = "REP-0001"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"OT-{self.id} ({self.unidad})"

class MantenimientoPreventivo(models.Model):
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, related_name='mantenimientos_preventivos')
    fecha_programada = models.DateField()
    descripcion = models.TextField()
    completado = models.BooleanField(default=False)

    def __str__(self):
        return f"Preventivo - {self.unidad} - {self.fecha_programada}"
