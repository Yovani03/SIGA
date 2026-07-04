# script_fix_blocks.py
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from combustibles.models import CargaCombustible, BloqueCargaCombustible
from collections import defaultdict
from django.db.models.functions import TruncMinute

# Get all special loads
cargas = CargaCombustible.objects.filter(es_especial=True)

# Group them by the minute they were originally registered
groups = defaultdict(list)
for carga in cargas:
    # Truncate to minute to group loads saved in the same batch
    minute_str = carga.fecha_registro.strftime('%Y-%m-%d %H:%M')
    groups[minute_str].append(carga)

print(f"Encontrados {len(groups)} grupos (lotes originales) basados en la fecha_registro de las cargas.")

for minute_str, grupo_cargas in groups.items():
    if not grupo_cargas:
        continue
    
    # Take the block of the first load as the main block
    main_block = grupo_cargas[0].bloque
    if not main_block:
        # Should not happen since migration ran, but just in case
        main_block = BloqueCargaCombustible.objects.create(fecha=grupo_cargas[0].fecha, es_especial=True)
    
    # Update main block's fecha_registro to match the original batch time
    # We must use update() because auto_now_add prevents modifying it via save() easily
    BloqueCargaCombustible.objects.filter(id=main_block.id).update(fecha_registro=grupo_cargas[0].fecha_registro)

    total_litros = 0
    total_monto = 0

    blocks_to_delete = set()
    for carga in grupo_cargas:
        if carga.bloque and carga.bloque.id != main_block.id:
            blocks_to_delete.add(carga.bloque.id)
        
        carga.bloque = main_block
        carga.save()
        
        total_litros += carga.litros if carga.litros else 0
        total_monto += carga.monto_total if carga.monto_total else 0

    main_block.total_litros = total_litros
    main_block.total_monto = total_monto
    main_block.save(update_fields=['total_litros', 'total_monto'])

    # Clean up empty blocks
    for b_id in blocks_to_delete:
        b = BloqueCargaCombustible.objects.filter(id=b_id).first()
        if b and b.cargas.count() == 0:
            b.delete()

print("Arreglo completado.")
