import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.serializers import BulkCargaCombustibleSerializer

payload = {
    'fecha': '2026-06-24',
    'precio_magna': 0,
    'precio_premium': 0,
    'precio_diesel': 25.50,
    'precio_electrico': 0,
    'precio_gas_lp': 0,
    'cargas': [
        {
            'tipo_combustible': 'diesel',
            'litros': 100,
            'kilometraje': 1000,
            'unidad': None,
            'unidad_variada': 1,
            'ignorar_kilometraje': False,
            'km_equivocado': False,
            'is_variado': True,
            'numero_economico': 'H-104',
            'placas': '123'
        }
    ]
}

serializer = BulkCargaCombustibleSerializer(data=payload)
if serializer.is_valid():
    print("Valid!")
else:
    print("Errors:")
    print(serializer.errors)
