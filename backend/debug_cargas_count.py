import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.models import CargaCombustible

def debug():
    print(f"Total Cargas: {CargaCombustible.objects.count()}")

if __name__ == '__main__':
    debug()
