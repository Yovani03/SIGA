import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from mantenimiento.models import Taller

talleres_data = [
    {
        "nombre": "Taller Mecánico El Pato",
        "direccion": "Av. de los Insurgentes Sur 123, Roma Nte., Cuauhtémoc, 06700 Ciudad de México, CDMX",
        "telefono": "55 1234 5678",
        "especialidad": "Mecánica General",
    },
    {
        "nombre": "Servicio Diesel Especializado",
        "direccion": "Calzada Vallejo 456, Industrial Vallejo, Azcapotzalco, 02300 Ciudad de México, CDMX",
        "telefono": "55 8765 4321",
        "especialidad": "Motores Diesel",
    },
    {
        "nombre": "Llantera Las Américas",
        "direccion": "Anillo Perif. 789, San Jerónimo Lídice, La Magdalena Contreras, 10200 Ciudad de México, CDMX",
        "telefono": "55 1122 3344",
        "especialidad": "Llantas y Alineación",
    }
]

for taller in talleres_data:
    Taller.objects.get_or_create(nombre=taller['nombre'], defaults=taller)
    
print("Talleres creados exitosamente.")
