import openpyxl
from openpyxl.drawing.image import Image as OpenpyxlImage
from PIL import Image, ImageDraw, ImageFont
import os

def create_watermark(text):
    # Create an image with transparent background
    img = Image.new('RGBA', (800, 600), (255, 255, 255, 0))
    
    # Try to load Arial, fallback to default if not found
    try:
        font = ImageFont.truetype("arial.ttf", 80)
    except IOError:
        font = ImageFont.load_default()
        
    # Create text image for rotation
    txt = Image.new('RGBA', (600, 200), (255, 255, 255, 0))
    d = ImageDraw.Draw(txt)
    d.text((10, 10), text, font=font, fill=(255, 0, 0, 80)) # Light red, high transparency
    
    # Rotate text
    txt = txt.rotate(45, expand=1)
    
    # Paste into main image
    img.paste(txt, (100, 100), txt)
    
    img_path = "temp_watermark.png"
    img.save(img_path)
    return img_path

def apply_watermark():
    wb = openpyxl.Workbook()
    sheet = wb.active
    
    for i in range(1, 20):
        for j in range(1, 10):
            sheet.cell(row=i, column=j, value=f"Dato {i},{j}")
            
    img_path = create_watermark("COPIA 1")
    xl_img = OpenpyxlImage(img_path)
    # xl_img.anchor = 'C5'
    sheet.add_image(xl_img, 'C5')
    
    wb.save("test_watermark.xlsx")
    print("Done")

if __name__ == "__main__":
    apply_watermark()
