import os
import django

os.environ['DATABASE_URL'] = 'postgresql://postgres:admin_secure_password@localhost:5432/autotran_db'
os.environ['DATABASE_SSL_REQUIRE'] = 'False'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.models import CargaCombustible

def run():
    print(f"Cargas Count: {CargaCombustible.objects.count()}")
    for c in CargaCombustible.objects.order_by('-id')[:5]:
        print(f"ID: {c.id}, Tracto: {c.unidad_id}, Variado: {c.unidad_variada_id}")

if __name__ == '__main__':
    run()
