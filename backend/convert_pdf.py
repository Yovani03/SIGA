import os
import win32com.client

# Paths
base_dir = r"C:\Autrotransportes\backend\logistica\plantillas"
excel_path = os.path.join(base_dir, "FORMATO CEDIS Y TRANSPORTES FINAL.xlsx")
pdf_path = os.path.join(base_dir, "FORMATO CEDIS Y TRANSPORTES FINAL.pdf")

try:
    # Open Excel
    excel = win32com.client.Dispatch("Excel.Application")
    excel.Visible = False
    
    # Open Workbook
    wb = excel.Workbooks.Open(excel_path)
    ws = wb.ActiveSheet
    
    # Page setup to ensure it fits on one page
    ws.PageSetup.Zoom = False
    ws.PageSetup.FitToPagesWide = 1
    ws.PageSetup.FitToPagesTall = 1
    ws.PageSetup.Orientation = 2 # xlLandscape
    
    # Save as PDF (Type 0 = xlTypePDF)
    wb.ExportAsFixedFormat(0, pdf_path)
    
    wb.Close(False)
    excel.Quit()
    print("Successfully converted Excel to PDF template!")
except Exception as e:
    print(f"Error: {e}")
