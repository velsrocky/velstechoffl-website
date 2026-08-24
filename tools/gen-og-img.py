from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
bg = (11, 15, 20)
accent = (76, 194, 255)
white = (230, 237, 243)
gray = (154, 167, 180)

img = Image.new("RGB", (W, H), bg)
draw = ImageDraw.Draw(img)

for y in range(0, H, 3):
    row_bright = 11 + int((y / H) * 6)
    for x in range(0, W, 3):
        px = (row_bright, row_bright + 2, row_bright + 4)
        draw.point((x, y), fill=px)

rect = (80, 80, 80 + 60, 80 + 60)
draw.rounded_rectangle(rect, radius=14, fill=accent)

draw.rectangle((160, 80 + 16, 400, 80 + 18), fill=accent)
draw.rectangle((160, 80 + 26, 300, 80 + 28), fill=gray)

draw.rectangle((160, 80 + 52, 450, 80 + 54), fill=gray)
draw.rectangle((160, 80 + 62, 350, 80 + 64), fill=gray)

try:
    font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 42)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
except:
    font_large = ImageFont.load_default()
    font_small = font_large

draw.text((80, 260), "Modern tech,", fill=white, font=font_large)
draw.text((80, 310), "built simple.", fill=accent, font=font_large)

draw.text((80, 380), "AI · Hardware · OS · Networking · Security · Programming", fill=gray, font=font_small)

out = os.path.join(os.path.dirname(__file__), "..", "og-image.png")
img.save(out, "PNG")
print(f"OG image saved: {out}")