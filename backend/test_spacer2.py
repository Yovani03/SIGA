from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter

class SpacerToBottom(Flowable):
    def __init__(self, bottom_margin):
        Flowable.__init__(self)
        self.bottom_margin = bottom_margin
        
    def wrap(self, availWidth, availHeight):
        height = availHeight - self.bottom_margin
        if height < 0:
            height = 0
        self.width = availWidth
        self.height = height
        return (self.width, self.height)
        
    def draw(self):
        pass

doc = SimpleDocTemplate("test_pdf2.pdf", pagesize=letter)
styles = getSampleStyleSheet()
elements = []

elements.append(Paragraph("Hello World", styles['Normal']))

# Add enough content to almost fill the page
for i in range(40):
    elements.append(Paragraph(f"Line {i}", styles['Normal']))

# Signature block
sig = [
    SpacerToBottom(100),
    Paragraph("Signature 1", styles['Normal']),
    Paragraph("Signature 2", styles['Normal'])
]
elements.append(KeepTogether(sig))

doc.build(elements)
print("PDF built")
