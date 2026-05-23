import os
import django
import sys
import openpyxl

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from vehiculos.models import RemolqueCaja

def run():
    file_path = 'c:/Autrotransportes/Veiculos/cajas.xlsx'
    if not os.path.exists(file_path):
        print(f"Error: El archivo {file_path} no existe.")
        return
        
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active
    
    # Headers expected: ['Nº ECONÓMICO', 'TIPO DE UNIDAD', 'MODELO', 'PLACAS', 'Nº DE SERIE']
    rows = list(ws.iter_rows())
    header = [cell.value for cell in rows[0]]
    print("Cabeceras detectadas:", header)
    
    creados = 0
    actualizados = 0
    
    for row in rows[1:]:
        values = [cell.value for cell in row]
        if not values or not values[0]:
            continue
            
        num_eco = str(values[0]).strip()
        tipo = str(values[1]).strip() if values[1] else None
        
        try:
            modelo = int(float(values[2])) if values[2] is not None else None
        except ValueError:
            modelo = None
            
        placas = str(values[3]).strip() if values[3] else None
        serie = str(values[4]).strip() if values[4] else None
        
        obj, created = RemolqueCaja.objects.get_or_create(
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
            print(f"[NUEVO] Caja {num_eco} registrada.")
        else:
            obj.placas = placas
            obj.tipo = tipo
            obj.modelo = modelo
            obj.numero_serie = serie
            obj.save()
            actualizados += 1
            print(f"[ACTUALIZADO] Caja {num_eco} actualizada.")
            
    print(f"\nProceso finalizado. Cajas creadas: {creados}, actualizadas: {actualizados}.")

if __name__ == '__main__':
    run()
