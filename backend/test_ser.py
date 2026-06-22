import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from facturacion.serializers import FacturaSerializer
from facturacion.models import Factura

f = Factura.objects.create(folio="TEST4", monto=100, fecha="2026-06-22")

cambios = {
    'archivo_escaneado': 'null'
}

ser = FacturaSerializer(f, data=cambios, partial=True)
print('VALID:', ser.is_valid())
print('ERRORS:', ser.errors)
