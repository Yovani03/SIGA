# Generated manually

from django.db import migrations
from django.utils import timezone
from collections import defaultdict
import datetime

def migrate_orphan_loads(apps, schema_editor):
    CargaCombustible = apps.get_model('combustibles', 'CargaCombustible')
    BloqueCargaCombustible = apps.get_model('combustibles', 'BloqueCargaCombustible')

    # Get all special loads without a block
    orphan_loads = CargaCombustible.objects.filter(es_especial=True, bloque__isnull=True)
    if not orphan_loads.exists():
        return

    # Group by date of the load (or just group them all into one block for simplicity)
    # Let's create one block per day based on their fecha
    groups = defaultdict(list)
    for carga in orphan_loads:
        groups[carga.fecha].append(carga)

    for fecha, cargas in groups.items():
        bloque = BloqueCargaCombustible.objects.create(
            fecha=fecha,
            es_especial=True
        )
        total_litros = 0
        total_monto = 0
        for carga in cargas:
            carga.bloque = bloque
            carga.save()
            total_litros += carga.litros if carga.litros else 0
            total_monto += carga.monto_total if carga.monto_total else 0
        
        bloque.total_litros = total_litros
        bloque.total_monto = total_monto
        bloque.save(update_fields=['total_litros', 'total_monto'])


class Migration(migrations.Migration):

    dependencies = [
        ('combustibles', '0012_bloquecargacombustible_es_especial'),
    ]

    operations = [
        migrations.RunPython(migrate_orphan_loads),
    ]
