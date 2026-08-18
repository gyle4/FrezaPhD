from pathlib import Path
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw

URL = "https://gyle4.github.io/FrezaPhD/"
OUT = Path(__file__).resolve().parents[1] / "assets"
QR_PNG = OUT / "qr-frezaphd.png"
QR_SVG = OUT / "qr-frezaphd.svg"

qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_H, box_size=24, border=4)
qr.add_data(URL)
qr.make(fit=True)
matrix = qr.get_matrix()
count = len(matrix)

paper = "#eef7f3"
emerald = "#071f17"
green = "#32d68b"
gold = "#d7b567"

# PNG: quiet zone is already included in get_matrix(). A small central badge is
# safe with H-level correction and leaves all three finder patterns untouched.
size = count * 24
image = Image.new("RGB", (size, size), paper)
draw = ImageDraw.Draw(image)
for y, row in enumerate(matrix):
    for x, cell in enumerate(row):
        if cell:
            draw.rectangle((x * 24, y * 24, (x + 1) * 24, (y + 1) * 24), fill=emerald)

badge = int(7.0 * 24)
cx = cy = size // 2
box = (cx - badge // 2, cy - badge // 2, cx + badge // 2, cy + badge // 2)
draw.rounded_rectangle(box, radius=30, fill=emerald, outline=gold, width=7)

# Compact cutter symbol: cylindrical body and three diagonal PCD rows.
body = (cx - 42, cy - 65, cx + 42, cy + 65)
draw.rounded_rectangle(body, radius=15, fill="#173c30", outline=green, width=5)
for offset in (-40, 0, 40):
    draw.polygon(((cx - 32, cy + offset + 6), (cx + 28, cy + offset - 12),
                  (cx + 34, cy + offset + 5), (cx - 26, cy + offset + 23)), fill=paper)
draw.ellipse((cx - 42, cy - 75, cx + 42, cy - 51), fill="#234f40", outline=green, width=4)
draw.ellipse((cx - 13, cy - 67, cx + 13, cy - 59), fill=emerald)
image.save(QR_PNG, optimize=True)

module = 20
art = count * module
paths = []
for y, row in enumerate(matrix):
    for x, cell in enumerate(row):
        if cell:
            paths.append(f"M{x*module} {y*module}h{module}v{module}h-{module}z")
b = 7.0 * module
bx = art / 2 - b / 2
by = art / 2 - b / 2
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {art} {art}" role="img" aria-label="QR-код FrezaPhD">
<rect width="{art}" height="{art}" fill="{paper}"/>
<path d="{' '.join(paths)}" fill="{emerald}"/>
<rect x="{bx}" y="{by}" width="{b}" height="{b}" rx="24" fill="{emerald}" stroke="{gold}" stroke-width="6"/>
<g transform="translate({art/2} {art/2}) rotate(-10)">
  <rect x="-34" y="-55" width="68" height="110" rx="13" fill="#173c30" stroke="{green}" stroke-width="4"/>
  <path d="M-27-38L23-52 28-38-22-24zM-27-7L23-21 28-7-22 7zM-27 24L23 10 28 24-22 38z" fill="{paper}"/>
  <ellipse cx="0" cy="-55" rx="34" ry="11" fill="#234f40" stroke="{green}" stroke-width="4"/>
  <ellipse cx="0" cy="-55" rx="11" ry="4" fill="{emerald}"/>
</g></svg>'''
QR_SVG.write_text(svg, encoding="utf-8")
print(f"Created {QR_PNG.name} and {QR_SVG.name}: {count}x{count} modules, H correction")
