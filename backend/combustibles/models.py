from django.db import models
from vehiculos.models import UnidadTractocamion
from facturacion.models import Factura, Producto

class PrecioCombustible(models.Model):
    fecha = models.DateField(unique=True, verbose_name="Fecha")
    precio_magna = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Magna")
    precio_premium = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Premium")
    precio_diesel = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Diesel")
    precio_electrico = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Eléctrico")

    class Meta:
        verbose_name = "Precio de Combustible"
        verbose_name_plural = "Precios de Combustible"
        ordering = ['-fecha']

    def __str__(self):
        return f"Precios al {self.fecha}"

class CargaCombustible(models.Model):
    TIPO_CHOICES = [
        ('magna', 'Magna'),
        ('premium', 'Premium'),
        ('diesel', 'Diesel'),
        ('electrico', 'Eléctrico'),
    ]
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, related_name='cargas_combustible')
    fecha = models.DateField(verbose_name="Fecha de Carga")
    tipo_combustible = models.CharField(max_length=20, choices=TIPO_CHOICES)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio por Litro")
    litros = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Litros Cargados")
    monto_total = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto Total")
    kilometraje = models.IntegerField(null=True, blank=True, verbose_name="Kilometraje")
    ignorar_kilometraje = models.BooleanField(default=False, verbose_name="Ignorar Kilometraje")
    rendimiento = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Rendimiento (km/l)")
    
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Carga de Combustible"
        verbose_name_plural = "Cargas de Combustible"
        ordering = ['-fecha', '-fecha_registro']

    def save(self, *args, **kwargs):
        # Calculate monto_total if not provided
        if not self.monto_total and self.litros and self.precio_unitario:
            self.monto_total = self.litros * self.precio_unitario
        
        # Rendimiento calculation logic
        if not self.ignorar_kilometraje and self.kilometraje and self.litros:
            # Get previous load to calculate distance
            ultima_carga = CargaCombustible.objects.filter(
                unidad=self.unidad, 
                fecha__lte=self.fecha,
                ignorar_kilometraje=False
            ).exclude(id=self.id).order_by('-fecha', '-fecha_registro').first()
            
            if ultima_carga and ultima_carga.kilometraje:
                distancia = self.kilometraje - ultima_carga.kilometraje
                if distancia > 0:
                    self.rendimiento = distancia / self.litros
        
        super().save(*args, **kwargs)
        
        # Update unit's info
        self.unidad.fecha_ultima_carga = self.fecha
        
        if not self.ignorar_kilometraje and self.kilometraje:
            self.unidad.ultimo_kilometraje = self.kilometraje
            # Si es la primera carga con kilometraje de la unidad, o nunca se ha reiniciado el mantenimiento,
            # tomamos este kilometraje como el punto inicial para empezar a calcular el próximo mantenimiento.
            if self.unidad.ultimo_kilometraje_mantenimiento == 0:
                self.unidad.ultimo_kilometraje_mantenimiento = self.kilometraje
        
        # Para camionetas (o cualquier unidad) que no tenga una fecha de último mantenimiento registrada,
        # inicializamos la fecha del último mantenimiento con la fecha de este primer registro de combustible.
        # Esto permite empezar a calcular el tiempo transcurrido desde este punto de partida real.
        if not self.unidad.fecha_ultimo_mantenimiento:
            self.unidad.fecha_ultimo_mantenimiento = self.fecha

        if self.rendimiento:
            self.unidad.ultimo_rendimiento = self.rendimiento
            
        self.unidad.save()

        # Register as a Factura (expense)
        producto_combustible, _ = Producto.objects.get_or_create(
            nombre="Combustible (Carga Diaria)",
            defaults={'categoria': 'Combustible', 'descripcion': 'Carga de combustible registrada vía módulo diario'}
        )
        
        # Check if already exists to avoid duplicates on updates
        folio_generado = f"FUEL-{self.fecha}-{self.unidad.numero_economico}-{self.id or 'NEW'}"
        if not Factura.objects.filter(folio__startswith=f"FUEL-{self.fecha}-{self.unidad.numero_economico}").exists():
            Factura.objects.create(
                fecha=self.fecha,
                monto=self.monto_total,
                folio=folio_generado,
                unidad=self.unidad,
                producto=producto_combustible
            )

    def __str__(self):
        return f"{self.unidad.numero_economico} - {self.fecha} - {self.litros}L"
