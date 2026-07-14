from django.db import models
from vehiculos.models import UnidadTractocamion, VehiculoVariado
from facturacion.models import Factura, Producto

class PrecioCombustible(models.Model):
    fecha = models.DateField(unique=True, verbose_name="Fecha")
    precio_magna = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Magna")
    precio_premium = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Premium")
    precio_diesel = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Diesel")
    precio_electrico = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Eléctrico")
    precio_gas_lp = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Gas LP")

    class Meta:
        verbose_name = "Precio de Combustible"
        verbose_name_plural = "Precios de Combustible"
        ordering = ['-fecha']

    def __str__(self):
        return f"Precios al {self.fecha}"

class BloqueCargaCombustible(models.Model):
    fecha = models.DateField(verbose_name="Fecha de Registro")
    fecha_registro = models.DateTimeField(auto_now_add=True)
    total_litros = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    total_monto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    es_especial = models.BooleanField(default=False, verbose_name="¿Es Bloque Especial?")

    class Meta:
        verbose_name = "Bloque de Carga"
        verbose_name_plural = "Bloques de Cargas"
        ordering = ['-fecha_registro']

    def __str__(self):
        return f"Bloque {self.fecha} - {self.total_monto} MXN"

    def update_totals(self):
        cargas = self.cargas.all()
        self.total_litros = sum(c.litros for c in cargas if c.litros)
        self.total_monto = sum(c.monto_total for c in cargas if c.monto_total)
        self.save(update_fields=['total_litros', 'total_monto'])

class CargaCombustible(models.Model):
    TIPO_CHOICES = [
        ('magna', 'Magna'),
        ('premium', 'Premium'),
        ('diesel', 'Diesel'),
        ('electrico', 'Eléctrico'),
        ('gas_lp', 'Gas LP'),
    ]
    bloque = models.ForeignKey(BloqueCargaCombustible, on_delete=models.CASCADE, related_name='cargas', null=True, blank=True)
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, related_name='cargas_combustible', null=True, blank=True)
    unidad_variada = models.ForeignKey(VehiculoVariado, on_delete=models.CASCADE, related_name='cargas_combustible', null=True, blank=True)
    fecha = models.DateField(verbose_name="Fecha de Carga")
    tipo_combustible = models.CharField(max_length=20, choices=TIPO_CHOICES)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio por Litro")
    litros = models.DecimalField(max_digits=10, decimal_places=3, verbose_name="Litros Cargados")
    monto_total = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto Total")
    kilometraje = models.IntegerField(null=True, blank=True, verbose_name="Kilometraje")
    ignorar_kilometraje = models.BooleanField(default=False, verbose_name="Ignorar Kilometraje")
    rendimiento = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Rendimiento (km/l)")
    es_especial = models.BooleanField(default=False, verbose_name="¿Es Carga Especial?")
    km_equivocado = models.BooleanField(default=False, verbose_name="¿Kilometraje Equivocado?")
    
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Carga de Combustible"
        verbose_name_plural = "Cargas de Combustible"
        ordering = ['-fecha', '-fecha_registro']

    def save(self, *args, **kwargs):
        if self.km_equivocado and self.unidad:
            self.kilometraje = self.unidad.ultimo_kilometraje

        # Siempre recalculamos el monto_total basado en los litros y el precio unitario
        if self.litros and self.precio_unitario:
            self.monto_total = self.litros * self.precio_unitario
        
        # Guardamos la carga sin calcular rendimiento para luego recalcular toda la cadena
        super().save(*args, **kwargs)
        
        unidad_actual = self.unidad or self.unidad_variada
        
        if unidad_actual:
            # Traemos TODAS las cargas de la unidad para recalcular en orden cronológico
            if self.unidad:
                cargas = list(CargaCombustible.objects.filter(unidad=self.unidad, ignorar_kilometraje=False).order_by('fecha', 'fecha_registro'))
            else:
                cargas = list(CargaCombustible.objects.filter(unidad_variada=self.unidad_variada, ignorar_kilometraje=False).order_by('fecha', 'fecha_registro'))

            ultimo_km_previo = None

            # Recorremos cronológicamente para recalcular
            for carga in cargas:
                nuevo_rendimiento = None
                if ultimo_km_previo is not None and carga.kilometraje is not None:
                    distancia = carga.kilometraje - ultimo_km_previo
                    if distancia > 0 and carga.litros and float(carga.litros) > 0:
                        nuevo_rendimiento = round(float(distancia) / float(carga.litros), 2)
                
                rendimiento_actual = float(carga.rendimiento) if carga.rendimiento is not None else None
                
                # Actualizar si hubo cambio real
                if rendimiento_actual != nuevo_rendimiento:
                    # Usamos update para no disparar recursividad con .save()
                    CargaCombustible.objects.filter(id=carga.id).update(rendimiento=nuevo_rendimiento)
                    if carga.id == self.id:
                        self.rendimiento = nuevo_rendimiento
                
                # Actualizar el km previo para la siguiente iteración
                if carga.kilometraje is not None:
                    ultimo_km_previo = carga.kilometraje

            # Finalmente, actualizar la información del vehículo tomando la última carga registrada (cronológicamente)
            if cargas:
                ultima_carga = cargas[-1]
                # Necesitamos refrescar ultima_carga de la DB si su rendimiento fue actualizado y no es self
                if ultima_carga.id != self.id:
                    ultima_carga.refresh_from_db()
                elif ultima_carga.id == self.id:
                    ultima_carga.rendimiento = self.rendimiento

                unidad_actual.fecha_ultima_carga = ultima_carga.fecha
                if ultima_carga.kilometraje is not None:
                    unidad_actual.ultimo_kilometraje = ultima_carga.kilometraje
                
                # Actualizar siempre al rendimiento cronológico más reciente, evitando null
                unidad_actual.ultimo_rendimiento = ultima_carga.rendimiento if ultima_carga.rendimiento is not None else 0
                
                # Lógicas específicas de UnidadTractocamion
                if self.unidad:
                    if getattr(unidad_actual, 'ultimo_kilometraje_mantenimiento', None) == 0 and cargas[0].kilometraje is not None:
                        unidad_actual.ultimo_kilometraje_mantenimiento = cargas[0].kilometraje
                    
                    if not getattr(unidad_actual, 'fecha_ultimo_mantenimiento', True):
                        unidad_actual.fecha_ultimo_mantenimiento = cargas[0].fecha
                
                unidad_actual.save()



    def __str__(self):
        num_eco = self.unidad.numero_economico if self.unidad else (self.unidad_variada.numero_economico if self.unidad_variada else 'UNK')
        return f"{num_eco} - {self.fecha} - {self.litros}L"

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=CargaCombustible)
def update_bloque_totals_on_save(sender, instance, **kwargs):
    if instance.bloque:
        instance.bloque.update_totals()

@receiver(post_delete, sender=CargaCombustible)
def update_bloque_totals_on_delete(sender, instance, **kwargs):
    if instance.bloque:
        instance.bloque.update_totals()

class EvidenciaGas(models.Model):
    folio_factura = models.CharField(max_length=100, verbose_name="Folio de Factura")
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    archivo_escaneado = models.FileField(upload_to='evidencia_gas/%Y/%m/', verbose_name="Documento Escaneado", null=True, blank=True)
    fecha = models.DateField(verbose_name="Fecha de Carga")
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Evidencia de Gas"
        verbose_name_plural = "Evidencias de Gas"
        ordering = ['-fecha', '-fecha_registro']

    def __str__(self):
        return f"Evidencia {self.folio_factura} - {self.monto} MXN"
