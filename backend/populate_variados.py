import os
import django
import sys
import openpyxl

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import VehiculoVariado

def run():
    file_path = 'c:/Autrotransportes/Veiculos/variados.xlsx'
    if not os.path.exists(file_path):
        print(f"Error: El archivo {file_path} no existe.")
        return
        
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active
    
    rows = list(ws.iter_rows())
    header = [cell.value for cell in rows[0]]
    print("Cabeceras detectadas:", header)
    
    creados = 0
    actualizados = 0
    
    used_numbers = {}
    
    for row in rows[1:]:
        values = [cell.value for cell in row]
        if not values or not values[0]:
            continue
            
        num_eco_raw = str(values[0]).strip()
        
        # De-duplicate economic numbers
        if num_eco_raw in used_numbers:
            used_numbers[num_eco_raw] += 1
            num_eco = f"{num_eco_raw}-{chr(64 + used_numbers[num_eco_raw])}" # E.g., H-114-B
            print(f"[DUPLICADO] Se renombra {num_eco_raw} a {num_eco}")
        else:
            used_numbers[num_eco_raw] = 1
            num_eco = num_eco_raw
            
        tipo = str(values[1]).strip() if values[1] else None
        
        # modelo is a CharField, so convert to string. If float (e.g., 2015.0), format it nicely as integer string.
        modelo_val = values[2]
        if modelo_val is not None:
            if isinstance(modelo_val, float) and modelo_val.is_integer():
                modelo = str(int(modelo_val))
            else:
                modelo = str(modelo_val).strip()
        else:
            modelo = None
            
        placas_val = values[3]
        if placas_val is not None:
            if isinstance(placas_val, float) and placas_val.is_integer():
                placas = str(int(placas_val))
            else:
                placas = str(placas_val).strip()
        else:
            placas = None
            
        # serial number can be float or string too
        serie_val = values[4]
        if serie_val is not None:
            if isinstance(serie_val, float) and serie_val.is_integer():
                serie = str(int(serie_val))
            else:
                serie = str(serie_val).strip()
        else:
            serie = None
            
        obj, created = VehiculoVariado.objects.get_or_create(
            numero_economico=num_eco,
            defaults={
                'placas': placas,
                'tipo': tipo,
                'modelo': modelo,
                'numero_serie': serie
            }
        )
        
        if created:
            creados += 1
            print(f"[NUEVO] Vehículo Variado {num_eco} registrado.")
        else:
            obj.placas = placas
            obj.tipo = tipo
            obj.modelo = modelo
            obj.numero_serie = serie
            obj.save()
            actualizados += 1
            print(f"[ACTUALIZADO] Vehículo Variado {num_eco} actualizado.")
            
    print(f"\nProceso finalizado. Vehículos Variados creados: {creados}, actualizados: {actualizados}.")

if __name__ == '__main__':
    run()
