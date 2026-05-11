from django.db import models

class Operador(models.Model):
    ESTATUS_CHOICES = [
        ('patio', 'En Patio'),
        ('viaje', 'En Viaje'),
    ]
    
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    tipo_licencia = models.CharField(max_length=50)
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='patio')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

    class Meta:
        verbose_name = 'Operador'
        verbose_name_plural = 'Operadores'

class AsignacionHorario(models.Model):
    HORARIO_CHOICES = [
        ('07:00 AM - 16:30 PM', '07:00 AM - 16:30 PM'),
        ('08:00 AM - 17:30 PM', '08:00 AM - 17:30 PM'),
        ('09:00 AM - 18:30 PM', '09:00 AM - 18:30 PM'),
        ('06:30 AM - 03:30 PM', '06:30 AM - 03:30 PM'),
    ]
    operador = models.ForeignKey(Operador, on_delete=models.CASCADE, related_name='horarios')
    unidad = models.ForeignKey('vehiculos.UnidadTractocamion', on_delete=models.CASCADE, null=True, blank=True)
    tienda = models.CharField(max_length=200, null=True, blank=True)
    horario = models.CharField(max_length=50, choices=HORARIO_CHOICES)
    fecha = models.DateField()
    es_personal = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.operador} - {self.horario} ({self.fecha})"

    class Meta:
        verbose_name = 'Asignación de Horario'
        verbose_name_plural = 'Asignaciones de Horarios'
