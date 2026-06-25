import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from facturacion.models import Factura

def find():
    for f in Factura.objects.all():
        if 'D-051' in (f.descripcion or '') or 'H-104' in (f.descripcion or ''):
            print(f"Factura {f.folio}: {f.descripcion}")

if __name__ == '__main__':
    find()
