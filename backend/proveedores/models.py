from django.db import models

class Proveedor(models.Model):
    CATEGORIAS = [
        ('Mantenimiento', 'Mantenimiento'),
        ('Refacciones', 'Refacciones'),
        ('Administrativo', 'Administrativo'),
        ('Operativo', 'Operativo'),
        ('Llantas', 'Llantas'),
        ('Combustible', 'Combustible'),
        ('Otro', 'Otro'),
    ]

    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=50, choices=CATEGORIAS)
    rfc = models.CharField(max_length=13, blank=True, null=True, verbose_name="RFC")
    razon_social = models.CharField(max_length=255, blank=True, null=True, verbose_name="Razón Social")
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    sitio_web = models.URLField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} - {self.categoria}"
