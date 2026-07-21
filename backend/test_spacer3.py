from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter

class BottomContainer(Flowable):
    def __init__(self, content):
        Flowable.__init__(self)
        self.content = content
        
    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        self.w, self.h = self.content.wrap(availWidth, availHeight)
        
        if self.h > availHeight:
            self.height = self.h
            return (self.width, self.height)
            
        self.height = availHeight
        return (self.width, self.height)
        
    def draw(self):
        self.content.drawOn(self.canv, 0, 0)

doc = SimpleDocTemplate("test_pdf3.pdf", pagesize=letter)
styles = getSampleStyleSheet()
elements = []

elements.append(Paragraph("Hello World", styles['Normal']))

for i in range(40):
    elements.append(Paragraph(f"Line {i}", styles['Normal']))

# Signature block
sig_data = [
    ['_________________________', '_________________________'],
    ['Entregado por (Proveedor)', 'Recibido por (Capturista)']
]
sig_table = Table(sig_data, colWidths=[200, 200])

elements.append(BottomContainer(sig_table))

doc.build(elements)
print("PDF built")
