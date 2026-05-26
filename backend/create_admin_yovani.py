import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from usuarios.models import Perfil

def create_admin_yovani():
    username = 'Yovani03'
    password = 'Yovs03'
    email = 'yovani03@autrotransportes.com'
    
    if not User.objects.filter(username=username).exists():
        user = User.objects.create_user(username=username, email=email, password=password)
        print(f"Usuario '{username}' creado exitosamente.")
        
        # El perfil se crea automáticamente por la señal, pero debemos actualizar el rol
        perfil = user.perfil
        perfil.rol = 'admin_general'
        perfil.save()
        print(f"Rol '{perfil.rol}' asignado al perfil.")
    else:
        user = User.objects.get(username=username)
        user.set_password(password)
        user.save()
        perfil = user.perfil
        perfil.rol = 'admin_general'
        perfil.save()
        print(f"El usuario '{username}' ya existía. Contraseña y rol actualizados a 'admin_general'.")

if __name__ == '__main__':
    create_admin_yovani()
