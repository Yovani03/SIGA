from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable
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

doc = SimpleDocTemplate("test_pdf.pdf", pagesize=letter)
styles = getSampleStyleSheet()
elements = []

elements.append(Paragraph("Hello World", styles['Normal']))
elements.append(SpacerToBottom(100))
elements.append(Paragraph("Bottom Text", styles['Normal']))

doc.build(elements)
print("PDF built")
