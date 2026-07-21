import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SIGA.settings')
django.setup()

from facturacion.models import ContraRecibo
print("ContraRecibos:", list(ContraRecibo.objects.all().values('id', 'folio')))
