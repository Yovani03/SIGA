with open(r'c:\Autrotransportes\backend\logistica\templates\bitacora_base.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('"Calibri"', "'Calibri'")
html = html.replace('"Arial"', "'Arial'")
html = html.replace('Nº ECONOMICO: D-052', 'Nº ECONOMICO: {{ numero_economico }}')
html = html.replace('NÂ° ECONOMICO: D-052', 'Nº ECONOMICO: {{ numero_economico }}') # In case of bad encoding
html = html.replace('PLACAS: XC-4355-C', 'PLACAS: {{ placas }}')
html = html.replace('SEMANA: 26 de jun al 2 de jul', 'SEMANA: {{ semana }}')
html = html.replace('FOLIO: 001', 'FOLIO: {{ folio|stringformat:"03d" }}')

with open(r'c:\Autrotransportes\backend\logistica\templates\bitacora_base.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Fixed HTML')
