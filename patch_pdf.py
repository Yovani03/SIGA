import os
import re

path = r"backend\facturacion\views.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

new_build_copy = """        def build_copy(title_suffix, invoices, is_company_copy=False):
            copy_elements = []
            copy_elements.append(Paragraph("AUTOTRANSPORTES COLUMBIA S.A DE C.V", header_style))
            copy_elements.append(Paragraph("RFC: ACO090825HW4", sub_header_style))
            copy_elements.append(Paragraph("Dirección: Lucero 1B, San Miguel Contla, 90640 San Miguel Contla, Tlax.", sub_header_style))
            copy_elements.append(Spacer(1, 10))
            
            copy_elements.append(Paragraph(f"Contra Recibo: {cr.folio} - {title_suffix}", title_style))
            
            prov_nombre = cr.proveedor.nombre if cr.proveedor else (cr.taller.nombre if cr.taller else 'N/A')
            copy_elements.append(Paragraph(f"<b>Recibido de:</b> {prov_nombre}", info_style))
            fecha_local = cr.fecha_creacion.astimezone() if cr.fecha_creacion else None
            fecha_str = fecha_local.strftime('%d/%m/%Y %H:%M') if fecha_local else ""
            copy_elements.append(Paragraph(f"<b>Fecha:</b> {fecha_str}", info_style))
            copy_elements.append(Paragraph(f"<b>Capturista:</b> {cr.capturista.username if cr.capturista else 'N/A'}", info_style))
            copy_elements.append(Paragraph(f"<b>Aplica RESICO:</b> {'Sí' if cr.resico_aplicado else 'No'}", info_style))
            copy_elements.append(Spacer(1, 15))
            
            if is_company_copy:
                data = [['Folio', 'Fecha', 'Subtotal', 'IVA', 'Total', 'Estado']]
            else:
                data = [['Folio', 'Fecha', 'Subtotal', 'IVA', 'Total', 'Estado', 'Motivo / Obs.']]
            
            sum_subtotal = 0
            sum_iva = 0
            sum_total = 0
            count_copy = 0
            
            for factura in invoices:
                observacion = factura.observacion or ""
                motivo = factura.motivo_rechazo or ""
                texto_rechazo = f"{motivo} - {observacion}" if motivo or observacion else ""
                
                # Desglose matemático:
                # El importe es el TOTAL.
                total_fac = float(factura.importe)
                subtotal_fac = total_fac / 1.16
                iva_fac = total_fac - subtotal_fac
                
                sum_total += total_fac
                sum_subtotal += subtotal_fac
                sum_iva += iva_fac
                count_copy += 1
                
                if is_company_copy:
                    data.append([
                        factura.folio_factura,
                        factura.fecha_emision.strftime('%d/%m/%Y'),
                        f"${subtotal_fac:,.2f}",
                        f"${iva_fac:,.2f}",
                        f"${total_fac:,.2f}",
                        factura.estado
                    ])
                else:
                    data.append([
                        factura.folio_factura,
                        factura.fecha_emision.strftime('%d/%m/%Y'),
                        f"${subtotal_fac:,.2f}",
                        f"${iva_fac:,.2f}",
                        f"${total_fac:,.2f}",
                        factura.estado,
                        texto_rechazo
                    ])
            
            if is_company_copy:
                table = Table(data, colWidths=[1.3*inch, 1.0*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.4*inch])
            else:
                table = Table(data, colWidths=[1.0*inch, 0.8*inch, 1.0*inch, 1.0*inch, 1.0*inch, 0.8*inch, 2.0*inch])
                
            table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1f2937')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 9),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f9fafb')),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#d1d5db')),
                ('FONTSIZE', (0,1), (-1,-1), 8),
                ('WORDWRAP', (0,0), (-1,-1), True),
            ]))
            
            copy_elements.append(table)
            copy_elements.append(Spacer(1, 20))
            
            # Totales
            copy_elements.append(Paragraph(f"<b>Total Facturas:</b> {count_copy}", totals_style))
            copy_elements.append(Paragraph(f"<b>Suma Subtotal:</b> ${sum_subtotal:,.2f}", totals_style))
            copy_elements.append(Paragraph(f"<b>Suma IVA:</b> ${sum_iva:,.2f}", totals_style))
            copy_elements.append(Paragraph(f"<b>Suma Total:</b> ${sum_total:,.2f}", totals_style))
            
            if cr.resico_aplicado:
                resico = sum_subtotal * 0.0125
                gran_total = sum_total - resico
                copy_elements.append(Paragraph(f"<b>Retención RESICO (1.25%):</b> -${resico:,.2f}", totals_style))
                copy_elements.append(Paragraph(f"<b>Gran Total a Pagar:</b> ${gran_total:,.2f}", totals_style))
            
            sig_data = [
                ['_________________________', '_________________________'],
                ['Entregado por (Proveedor)', 'Recibido por (Capturista)']
            ]
            sig_table = Table(sig_data, colWidths=[3.5*inch, 3.5*inch])
            sig_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
                ('FONTSIZE', (0,0), (-1,-1), 10),
                ('TOPPADDING', (0,0), (-1,-1), 15),
            ]))
            
            copy_elements.append(BottomContainer(sig_table))
            
            return copy_elements"""

content = re.sub(
    r"        def build_copy.*?return copy_elements",
    new_build_copy,
    content,
    flags=re.DOTALL
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Replaced build_copy in views.py")
