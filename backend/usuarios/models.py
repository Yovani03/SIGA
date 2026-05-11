from django.db import models
from django.contrib.auth.models import User

class Perfil(models.Model):
    ROLES_CHOICES = (
        ('admin', 'Administrador'),
        ('capturista', 'Capturista'),
        ('jefe_logistica', 'Jefe de Logística'),
        ('monitoreo', 'Monitoreo'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES, default='capturista')

    def __str__(self):
        return f"{self.user.username} - {self.get_rol_display()}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if not hasattr(instance, 'perfil'):
        Perfil.objects.create(user=instance)
    instance.perfil.save()
