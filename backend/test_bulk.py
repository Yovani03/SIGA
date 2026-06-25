import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.serializers import BulkCargaCombustibleSerializer
from vehiculos.models import VehiculoVariado

def run():
    v = VehiculoVariado.objects.first()
    if not v:
        print("No vehiculo variado found.")
        return

    data = {
        'fecha': '2026-06-24',
        'precio_diesel': '25.50',
        'cargas': [
            {
                'unidad_variada': v.id,
                'tipo_combustible': 'diesel',
                'litros': 100,
                'kilometraje': 1000
            }
        ]
    }
    
    serializer = BulkCargaCombustibleSerializer(data=data)
    if serializer.is_valid():
        print("Valid!", serializer.validated_data)
        serializer.save()
        print("Saved successfully!")
    else:
        print("Errors:", serializer.errors)

if __name__ == '__main__':
    run()
