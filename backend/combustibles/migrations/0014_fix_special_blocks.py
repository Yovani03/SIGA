# Generated manually

from django.db import migrations
from collections import defaultdict
from django.db.models import F

def fix_special_blocks(apps, schema_editor):
    CargaCombustible = apps.get_model('combustibles', 'CargaCombustible')
    BloqueCargaCombustible = apps.get_model('combustibles', 'BloqueCargaCombustible')

    cargas = CargaCombustible.objects.filter(es_especial=True)

    # Agrupar las cargas por el minuto exacto en el que fueron registradas originalmente.
    # Como no podemos usar métodos complejos de timezone fácilmente en SQLite a veces, 
    # lo haremos en memoria.
    groups = defaultdict(list)
    for carga in cargas:
        # truncar al minuto: "YYYY-MM-DD HH:MM"
        minute_str = carga.fecha_registro.strftime('%Y-%m-%d %H:%M')
        groups[minute_str].append(carga)

    for minute_str, grupo_cargas in groups.items():
        if not grupo_cargas:
            continue
        
        main_block = grupo_cargas[0].bloque
        if not main_block:
            continue
            
        # Actualizamos la fecha_registro del bloque principal para que coincida con el lote original
        BloqueCargaCombustible.objects.filter(id=main_block.id).update(fecha_registro=grupo_cargas[0].fecha_registro)

        total_litros = 0
        total_monto = 0
        blocks_to_delete = set()

        for carga in grupo_cargas:
            if carga.bloque_id != main_block.id:
                if carga.bloque_id is not None:
                    blocks_to_delete.add(carga.bloque_id)
                carga.bloque = main_block
                carga.save(update_fields=['bloque'])
            
            total_litros += carga.litros if carga.litros else 0
            total_monto += carga.monto_total if carga.monto_total else 0
            
        BloqueCargaCombustible.objects.filter(id=main_block.id).update(
            total_litros=total_litros,
            total_monto=total_monto
        )

        # Limpiar los bloques que quedaron vacíos
        for b_id in blocks_to_delete:
            b = BloqueCargaCombustible.objects.filter(id=b_id).first()
            if b and b.cargas.count() == 0:
                b.delete()

class Migration(migrations.Migration):

    dependencies = [
        ('combustibles', '0013_migrate_orphan_special_loads'),
    ]

    operations = [
        migrations.RunPython(fix_special_blocks),
    ]
