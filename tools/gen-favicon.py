#!/usr/bin/env python3
"""Generate vibrant VelsTech favicon set (gradient V on dark rounded square)."""
from PIL import Image, ImageDraw, ImageFilter

S = 64
TOP = (76, 194, 255)    # #4cc2ff blue
BOT = (167, 139, 250)   # #a78bfa purple
BG = (19, 27, 36)       # #131b24 dark navy

def build_master():
    base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=14, fill=BG + (255,))

    # diagonal gradient (blue -> purple)
    grad = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / (S - 1)
        c = tuple(int(TOP[i] + (BOT[i] - TOP[i]) * t) for i in range(3))
        gd.line([(0, y), (S, y)], fill=c + (255,))

    # V shape mask
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    md.line([(20, 20), (32, 44), (44, 20)], fill=255, width=7, joint="curve")

    # soft glow behind the V
    glow_mask = mask.filter(ImageFilter.GaussianBlur(2.5))
    glow = Image.new("RGBA", (S, S), (90, 185, 255, 190))
    base.paste(glow, (0, 0), glow_mask)

    # gradient V
    base.paste(grad, (0, 0), mask)

    # dots at the tips
    d = ImageDraw.Draw(base)
    d.ellipse([20 - 3.2, 18 - 3.2, 20 + 3.2, 18 + 3.2], fill=TOP + (255,))
    d.ellipse([44 - 3.2, 18 - 3.2, 44 + 3.2, 18 + 3.2], fill=TOP + (255,))
    d.ellipse([32 - 3.2, 47 - 3.2, 32 + 3.2, 47 + 3.2], fill=(127, 212, 255, 255))

    return base

def main():
    master = build_master()
    master.save("favicon-master.png")

    master.resize((16, 16), Image.LANCZOS).save("favicon-16x16.png")
    master.resize((32, 32), Image.LANCZOS).save("favicon-32x32.png")
    master.resize((48, 48), Image.LANCZOS).save("favicon-48x48.png")
    master.save("favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

    # apple touch icon: no transparency, solid dark square
    at = Image.new("RGBA", (180, 180), BG + (255,))
    at.alpha_composite(master.resize((180, 180), Image.LANCZOS))
    at.convert("RGB").save("apple-touch-icon.png")

    print("Generated: favicon-master.png, favicon-16x16.png, favicon-32x32.png, favicon-48x48.png, favicon.ico, apple-touch-icon.png")

if __name__ == "__main__":
    main()
