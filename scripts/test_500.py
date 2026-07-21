import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SIGA.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
import json

c = Client()
user = User.objects.first()
c.force_login(user)

payload = {
  "proveedor": 1,
  "taller": None,
  "resico_aplicado": False,
  "total_facturas": 2,
  "subtotal": 2,
  "facturas_detalle": [
    {
       "folio_factura": "TEST1",
       "fecha_emision": "2026-07-20",
       "importe": 1,
       "estado": "Aceptada"
    }
  ]
}

response = c.post('/api/contra-recibos/', json.dumps(payload), content_type='application/json')
print("Status code:", response.status_code)
if response.status_code == 500:
    print(response.content.decode('utf-8')[:1500])
