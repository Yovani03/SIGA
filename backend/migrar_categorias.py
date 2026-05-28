import os
import sys
import django

# Configurar el entorno de Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from facturacion.models import Ticket, Factura

def migrar():
    print("Iniciando migración de categorías para Tickets y Facturas...")
    
    # 1. Migrar Tickets
    tickets = Ticket.objects.filter(categoria='Mantenimiento y Refacciones')
    tickets_count = tickets.count()
    migrated_tickets = 0
    for t in tickets:
        if t.taller:
            t.categoria = 'Mantenimiento'
        elif t.proveedor:
            t.categoria = t.proveedor.categoria or 'Refacciones'
        else:
            t.categoria = 'Mantenimiento'
        t.save()
        migrated_tickets += 1

    # 2. Migrar Facturas
    facturas = Factura.objects.filter(categoria='Mantenimiento y Refacciones')
    facturas_count = facturas.count()
    migrated_facturas = 0
    for f in facturas:
        if f.taller:
            f.categoria = 'Mantenimiento'
        elif f.proveedor:
            f.categoria = f.proveedor.categoria or 'Refacciones'
        else:
            f.categoria = 'Mantenimiento'
        f.save()
        migrated_facturas += 1

    print(f"Migración completada:")
    print(f"- {migrated_tickets} de {tickets_count} tickets migrados exitosamente.")
    print(f"- {migrated_facturas} de {facturas_count} facturas migradas exitosamente.")

if __name__ == '__main__':
    migrar()
