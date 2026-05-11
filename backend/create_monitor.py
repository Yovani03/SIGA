import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from usuarios.models import Perfil

def create_monitor_user():
    username = 'monitor'
    password = 'password123'
    email = 'monitor@autrotransportes.com'
    
    if not User.objects.filter(username=username).exists():
        user = User.objects.create_user(username=username, email=email, password=password)
        print(f"Usuario '{username}' creado exitosamente.")
        
        # El perfil se crea automáticamente por la señal, pero debemos actualizar el rol
        perfil = user.perfil
        perfil.rol = 'monitoreo'
        perfil.save()
        print(f"Rol '{perfil.rol}' asignado al perfil.")
    else:
        user = User.objects.get(username=username)
        perfil = user.perfil
        perfil.rol = 'monitoreo'
        perfil.save()
        print(f"El usuario '{username}' ya existe. Rol actualizado a 'monitoreo'.")

if __name__ == '__main__':
    create_monitor_user()
