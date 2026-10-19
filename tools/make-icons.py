# Draws the app icons: a brass magnifying glass on the night colour of the game.
#   .venv-images/Scripts/python.exe tools/make-icons.py
from pathlib import Path
from PIL import Image, ImageDraw

BG = (16, 27, 35)
BRASS = (211, 182, 126)
RING = (142, 203, 209)
out = Path(__file__).resolve().parent.parent / 'public' / 'icons'


def icon(size):
    s = size * 4  # drawn large, then reduced for smooth edges
    im = Image.new('RGB', (s, s), BG)
    d = ImageDraw.Draw(im)
    w = s * 0.022
    d.ellipse([s * 0.06, s * 0.06, s * 0.94, s * 0.94], outline=RING, width=round(w))
    # The lens and its handle, a little up and to the left of the centre.
    cx, cy, r = s * 0.44, s * 0.44, s * 0.2
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=BRASS, width=round(s * 0.055))
    a = 0.7071
    x0, y0 = cx + r * a + s * 0.01, cy + r * a + s * 0.01
    d.line([x0, y0, s * 0.72, s * 0.72], fill=BRASS, width=round(s * 0.085))
    end = s * 0.0425
    d.ellipse([s * 0.72 - end, s * 0.72 - end, s * 0.72 + end, s * 0.72 + end], fill=BRASS)
    return im.resize((size, size), Image.LANCZOS)


for size in (192, 512):
    icon(size).save(out / f'icon-{size}.png', optimize=True)
print('ok')
