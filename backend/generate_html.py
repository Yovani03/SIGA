import openpyxl

def excel_to_html(wb):
    ws = wb.active
    html = '<table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 10px; text-align: center;">\n'
    
    merged_cells = ws.merged_cells.ranges
    skip_cells = set()
    
    for row in ws.iter_rows():
        html += '  <tr>\n'
        for cell in row:
            if cell.coordinate in skip_cells:
                continue
                
            colspan = 1
            rowspan = 1
            for merged in merged_cells:
                if cell.coordinate == merged.start_cell.coordinate:
                    colspan = merged.max_col - merged.min_col + 1
                    rowspan = merged.max_row - merged.min_row + 1
                    
                    for r in range(merged.min_row, merged.max_row + 1):
                        for c in range(merged.min_col, merged.max_col + 1):
                            if not (r == merged.min_row and c == merged.min_col):
                                skip_cells.add(ws.cell(row=r, column=c).coordinate)
                    break
                    
            val = cell.value if cell.value is not None else ''
            
            bg_color = ''
            if cell.fill and cell.fill.start_color and hasattr(cell.fill.start_color, 'rgb') and type(cell.fill.start_color.rgb) == str:
                rgb = cell.fill.start_color.rgb
                if rgb != '00000000':
                    bg_color = f'background-color: #{rgb[2:]};'
                    
            font_weight = 'bold' if cell.font and cell.font.bold else 'normal'
            
            html += f'    <td colspan="{colspan}" rowspan="{rowspan}" style="{bg_color} font-weight: {font_weight}; padding: 2px;">{val}</td>\n'
        html += '  </tr>\n'
    html += '</table>'
    return html

wb = openpyxl.load_workbook(r'C:\Autrotransportes\backend\logistica\plantillas\FORMATO CEDIS Y TRANSPORTES FINAL.xlsx')
html = excel_to_html(wb)
with open('c:/Autrotransportes/backend/logistica/templates/bitacora_base.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML generated')
