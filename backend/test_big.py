import openpyxl
from openpyxl.drawing.image import Image as OpenpyxlImage
from PIL import Image, ImageDraw, ImageFont
import os
from tempfile import NamedTemporaryFile

def test():
    wb = openpyxl.Workbook()
    sheet = wb.active
    
    img = Image.new('RGBA', (1200, 1000), (255, 255, 255, 0))
    try:
        font = ImageFont.truetype("arial.ttf", 160)
    except IOError:
        font = ImageFont.load_default()
        
    txt = Image.new('RGBA', (1000, 300), (255, 255, 255, 0))
    d = ImageDraw.Draw(txt)
    d.text((10, 10), "COPIA 1", font=font, fill=(0, 0, 0, 150))
    
    txt = txt.rotate(35, expand=1)
    img.paste(txt, (100, 200), txt)
    
    with NamedTemporaryFile(delete=False, suffix='.png') as tmp_img:
        img.save(tmp_img.name)
        tmp_img_path = tmp_img.name
        
    xl_img = OpenpyxlImage(tmp_img_path)
    sheet.add_image(xl_img, 'D10')
    
    wb.save("test_watermark_big.xlsx")
    os.unlink(tmp_img_path)

if __name__ == "__main__":
    test()
