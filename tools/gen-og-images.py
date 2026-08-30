#!/usr/bin/env python3
"""Generate a unique 1200x630 OG image per article.

Reads ../articles.js and writes one PNG per article into ../og/<slug>.png,
matching the site's dark theme and accent color. Also regenerates the generic
og-image.png used by non-article pages.

Usage:  python3 tools/gen-og-images.py
"""

from PIL import Image, ImageDraw, ImageFont
import json
import os
import re
import sys

W, H = 1200, 630
BG = (11, 15, 20)
ACCENT = (76, 194, 255)
WHITE = (230, 237, 243)
GRAY = (154, 167, 180)

ROOT = os.path.join(os.path.dirname(__file__), "..")
OG_DIR = os.path.join(ROOT, "og")
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def load_articles():
    # Dump ARTICLES to JSON via node (articles.js is a CommonJS module).
    import subprocess
    out = subprocess.run(
        ["node", "-e", "console.log(JSON.stringify(require('./articles.js')))"],
        cwd=ROOT, capture_output=True, text=True,
    )
    if out.returncode != 0:
        sys.exit("node failed to load articles.js: " + out.stderr)
    return json.loads(out.stdout)


def draw_background(draw):
    for y in range(0, H, 3):
        row_bright = 11 + int((y / H) * 6)
        for x in range(0, W, 3):
            draw.point((x, y), fill=(row_bright, row_bright + 2, row_bright + 4))


def draw_brand(draw, font_small):
    # logo mark
    draw.rounded_rectangle((80, H - 100, 80 + 40, H - 60), radius=10, fill=ACCENT)
    draw.line((92, H - 90, 100, H - 70), fill=BG, width=5)
    draw.line((100, H - 70, 108, H - 90), fill=BG, width=5)
    draw.text((132, H - 90), "VELSTECH", fill=GRAY, font=font_small)


def wrap_title(title, font, max_width, draw):
    words = title.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=font) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def gen_article_image(article):
    slug = article["url"].replace(".html", "")
    out = os.path.join(OG_DIR, slug + ".png")

    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_background(draw)

    font_cat = ImageFont.truetype(FONT_BOLD, 28)
    font_title = ImageFont.truetype(FONT_BOLD, 46)
    font_small = ImageFont.truetype(FONT_REG, 24)

    # category pill
    cat = article.get("category", "VelsTech")
    cat_w = draw.textlength(cat, font=font_cat)
    draw.rounded_rectangle((80, 80, 80 + cat_w + 40, 80 + 48), radius=24, fill=ACCENT)
    draw.text((80 + 20, 80 + 10), cat, fill=BG, font=font_cat)

    # title
    lines = wrap_title(article["title"], font_title, W - 160, draw)
    lines = lines[:4]
    y = 170
    for i, line in enumerate(lines):
        fill = WHITE if i == 0 else (WHITE if i < len(lines) - 1 else GRAY)
        if len(lines) == 1:
            fill = WHITE
        draw.text((80, y), line, fill=fill, font=font_title)
        y += 58
    if len(lines) == 4:
        draw.text((80, y), "...", fill=ACCENT, font=font_title)

    draw_brand(draw, font_small)

    img.save(out, "PNG")
    print(f"  {slug}.png")
    return out


def gen_generic():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_background(draw)

    font_large = ImageFont.truetype(FONT_BOLD, 42)
    font_small = ImageFont.truetype(FONT_REG, 22)

    draw.rounded_rectangle((80, 80, 140, 140), radius=14, fill=ACCENT)
    draw.line((98, 104, 112, 120), fill=BG, width=6)
    draw.line((112, 120, 124, 104), fill=BG, width=6)

    draw.text((80, 260), "Modern tech,", fill=WHITE, font=font_large)
    draw.text((80, 310), "built simple.", fill=ACCENT, font=font_large)
    draw.text((80, 380), "AI · Hardware · OS · Networking · Security · Programming", fill=GRAY, font=font_small)

    out = os.path.join(ROOT, "og-image.png")
    img.save(out, "PNG")
    print(f"  og-image.png (generic)")


def main():
    os.makedirs(OG_DIR, exist_ok=True)
    articles = load_articles()
    print(f"Generating {len(articles)} article OG images into og/")
    for a in articles:
        gen_article_image(a)
    print("Generating generic OG image")
    gen_generic()
    print("Done.")


if __name__ == "__main__":
    main()
