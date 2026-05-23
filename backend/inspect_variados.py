import openpyxl

def main():
    file_path = 'c:/Autrotransportes/Veiculos/variados.xlsx'
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active
    print("Sheet name:", ws.title)
    
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        print("Empty file")
        return
        
    print("Header columns:")
    print(rows[0])
    
    print("\nFirst 5 rows:")
    for row in rows[1:6]:
        print(row)

if __name__ == '__main__':
    main()
