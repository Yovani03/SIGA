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
    total_litros = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_monto = models.DecimalField(max_digits=12, decimal_places=2, default=0)

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
    litros = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Litros Cargados")
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

        # Calculate monto_total if not provided
        if not self.monto_total and self.litros and self.precio_unitario:
            self.monto_total = self.litros * self.precio_unitario
        
        # Rendimiento calculation logic
        if not self.ignorar_kilometraje and self.kilometraje and self.litros and (self.unidad or self.unidad_variada):
            # Get previous load to calculate distance
            if self.unidad:
                ultima_carga = CargaCombustible.objects.filter(
                    unidad=self.unidad, 
                    fecha__lte=self.fecha,
                    ignorar_kilometraje=False
                ).exclude(id=self.id).order_by('-fecha', '-fecha_registro').first()
            else:
                ultima_carga = CargaCombustible.objects.filter(
                    unidad_variada=self.unidad_variada, 
                    fecha__lte=self.fecha,
                    ignorar_kilometraje=False
                ).exclude(id=self.id).order_by('-fecha', '-fecha_registro').first()
            
            if ultima_carga and ultima_carga.kilometraje is not None and self.kilometraje is not None:
                distancia = self.kilometraje - ultima_carga.kilometraje
                if distancia > 0:
                    self.rendimiento = distancia / self.litros
        
        super().save(*args, **kwargs)
        
        # Update unit's info
        if self.unidad:
            self.unidad.fecha_ultima_carga = self.fecha
            
            if not self.ignorar_kilometraje and self.kilometraje is not None:
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

            if self.rendimiento is not None:
                self.unidad.ultimo_rendimiento = self.rendimiento
                
            self.unidad.save()
            
        elif self.unidad_variada:
            self.unidad_variada.fecha_ultima_carga = self.fecha
            
            if not self.ignorar_kilometraje and self.kilometraje is not None:
                self.unidad_variada.ultimo_kilometraje = self.kilometraje
                
            if self.rendimiento is not None:
                self.unidad_variada.ultimo_rendimiento = self.rendimiento
                
            self.unidad_variada.save()



    def __str__(self):
        num_eco = self.unidad.numero_economico if self.unidad else (self.unidad_variada.numero_economico if self.unidad_variada else 'UNK')
        return f"{num_eco} - {self.fecha} - {self.litros}L"
