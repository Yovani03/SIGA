import os
import django

os.environ['DATABASE_URL'] = 'postgresql://postgres:admin_secure_password@localhost:5432/autotran_db'
os.environ['DATABASE_SSL_REQUIRE'] = 'False'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import VehiculoVariado

def run():
    v = VehiculoVariado.objects.filter(numero_economico='H-104').first()
    if v:
        print(f"H-104 fecha_ultima_carga: {v.fecha_ultima_carga}")
        print(f"H-104 ultimo_kilometraje: {v.ultimo_kilometraje}")
    else:
        print("H-104 not found")

if __name__ == '__main__':
    run()
