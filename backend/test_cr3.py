import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

import json
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import User
from facturacion.views import ContraReciboViewSet

factory = APIRequestFactory()
user = User.objects.first()

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

request = factory.post('/api/contra-recibos/', payload, format='json')
from rest_framework.request import Request
request.user = user

view = ContraReciboViewSet.as_view({'post': 'create'})
try:
    response = view(request)
    print("Status code:", response.status_code)
    if response.status_code >= 400:
        print(response.data)
except Exception as e:
    import traceback
    traceback.print_exc()
