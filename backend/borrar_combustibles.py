import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from combustibles.models import CargaCombustible, BloqueCargaCombustible
from facturacion.models import Factura, Producto

def run():
    print("Iniciando borrado de registros de combustible...")
    
    # 1. Borrar Bloques y Cargas
    cargas_count, _ = CargaCombustible.objects.all().delete()
    bloques_count, _ = BloqueCargaCombustible.objects.all().delete()
    
    print(f"- Se eliminaron {cargas_count} Cargas de Combustible.")
    print(f"- Se eliminaron {bloques_count} Bloques de Carga.")
    
    # 2. Borrar Facturas asociadas a combustible
    # Las que se generaron automáticamente empiezan con FUEL-
    facturas_auto_count, _ = Factura.objects.filter(folio__startswith='FUEL-').delete()
    print(f"- Se eliminaron {facturas_auto_count} Facturas generadas automáticamente (FUEL-...).")
    
    # Las creadas manualmente o que tienen producto de categoría Combustible
    facturas_manual_count, _ = Factura.objects.filter(categoria='Combustible').delete()
    print(f"- Se eliminaron {facturas_manual_count} Facturas con categoría directa 'Combustible'.")
    
    facturas_prod_count, _ = Factura.objects.filter(producto__categoria='Combustible').delete()
    print(f"- Se eliminaron {facturas_prod_count} Facturas con producto de categoría 'Combustible'.")

    print("¡Limpieza de combustibles completada exitosamente! Puedes iniciar desde 0.")

if __name__ == '__main__':
    run()
