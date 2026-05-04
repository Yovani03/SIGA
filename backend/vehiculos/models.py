from django.db import models

class UnidadTractocamion(models.Model):
    placas = models.CharField(max_length=20, unique=True)
    numero_economico = models.CharField(max_length=50, unique=True)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    anio = models.IntegerField(blank=True, null=True)
    numero_vin = models.CharField(max_length=100, unique=True, blank=True, null=True)
    imagen = models.ImageField(upload_to='vehiculos/unidades/', blank=True, null=True)

    def __str__(self):
        return f"{self.numero_economico} - {self.placas}"

class RemolqueCaja(models.Model):
    placas = models.CharField(max_length=20, unique=True)
    numero_economico = models.CharField(max_length=50, unique=True)
    tipo = models.CharField(max_length=100, blank=True, null=True) # E.g., Refrigerado, Seco

    def __str__(self):
        return self.numero_economico
