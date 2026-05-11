from django.db import models

class Proveedor(models.Model):
    CATEGORIAS = [
        ('Refacciones', 'Refacciones'),
        ('Mantenimiento', 'Mantenimiento'),
        ('Llantas', 'Llantas'),
        ('Combustible', 'Combustible'),
        ('Seguros', 'Seguros'),
        ('Servicios Generales', 'Servicios Generales'),
        ('Otros', 'Otros'),
    ]

    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=50, choices=CATEGORIAS)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    sitio_web = models.URLField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} - {self.categoria}"
