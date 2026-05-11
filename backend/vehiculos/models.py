from django.db import models
from decimal import Decimal

class UnidadTractocamion(models.Model):
    ESTADO_CHOICES = [
        ('operativa', 'Operativa'),
        ('en_mantenimiento', 'En Mantenimiento'),
    ]
    CAPACIDAD_CHOICES = [
        (Decimal('0.0'), 'Vehículo Ligero (Auto/Camioneta)'),
        (Decimal('1.5'), '1.5 Toneladas'),
        (Decimal('3.5'), '3.5 Toneladas'),
        (Decimal('5.0'), '5 Toneladas'),
        (Decimal('8.0'), '8 Toneladas'),
        (Decimal('10.0'), '10 Toneladas'),
        (Decimal('30.0'), 'Trailer / Full'),
    ]
    FUEL_CHOICES = [
        ('diesel', 'Diesel'),
        ('magna', 'Gasolina Magna'),
        ('premium', 'Gasolina Premium'),
        ('electrico', 'Eléctrico'),
    ]
    tipo_combustible = models.CharField(max_length=20, choices=FUEL_CHOICES, default='diesel', verbose_name="Tipo de Combustible")
    placas = models.CharField(max_length=20, unique=True)
    numero_economico = models.CharField(max_length=50, unique=True)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    anio = models.IntegerField(blank=True, null=True)
    numero_vin = models.CharField(max_length=100, unique=True, blank=True, null=True)
    imagen = models.ImageField(upload_to='vehiculos/unidades/', blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='operativa')
    capacidad = models.DecimalField(max_digits=4, decimal_places=1, choices=CAPACIDAD_CHOICES, default=Decimal('10.0'), verbose_name="Capacidad (Toneladas)")
    ultimo_kilometraje = models.IntegerField(default=0, verbose_name="Último Kilometraje")
    fecha_ultima_carga = models.DateField(null=True, blank=True, verbose_name="Fecha Última Carga")
    ignorar_kilometraje = models.BooleanField(default=False, verbose_name="Ignorar Kilometraje")
    ultimo_rendimiento = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Último Rendimiento")

    def __str__(self):
        return f"{self.numero_economico} - {self.placas}"

class RemolqueCaja(models.Model):
    placas = models.CharField(max_length=20, unique=True)
    numero_economico = models.CharField(max_length=50, unique=True)
    tipo = models.CharField(max_length=100, blank=True, null=True) # E.g., Refrigerado, Seco

    def __str__(self):
        return self.numero_economico
