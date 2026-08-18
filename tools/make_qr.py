from pathlib import Path
import base64
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw

URL = "https://gyle4.github.io/FrezaPhD/"
OUT = Path(__file__).resolve().parents[1] / "assets"
QR_PNG = OUT / "qr-frezaphd.png"
QR_SVG = OUT / "qr-frezaphd.svg"
EMBLEM = OUT / "qr-cutter-emblem.png"

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

badge = int(9.0 * 24)
cx = cy = size // 2
box = (cx - badge // 2, cy - badge // 2, cx + badge // 2, cy + badge // 2)
draw.rounded_rectangle(box, radius=34, fill=paper, outline=gold, width=8)
emblem = Image.open(EMBLEM).convert("RGB")
# Crop the generous generated margin while retaining the full paired cutters.
emblem = emblem.crop((125, 190, 1260, 1260))
emblem.thumbnail((badge - 24, badge - 24), Image.Resampling.LANCZOS)
image.paste(emblem, (cx - emblem.width // 2, cy - emblem.height // 2))
draw.rounded_rectangle(box, radius=34, outline=gold, width=8)
image.save(QR_PNG, optimize=True)

module = 20
art = count * module
paths = []
for y, row in enumerate(matrix):
    for x, cell in enumerate(row):
        if cell:
            paths.append(f"M{x*module} {y*module}h{module}v{module}h-{module}z")
b = 9.0 * module
bx = art / 2 - b / 2
by = art / 2 - b / 2
emblem_data = base64.b64encode(EMBLEM.read_bytes()).decode("ascii")
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {art} {art}" role="img" aria-label="QR-код FrezaPhD">
<defs><clipPath id="badge"><rect x="{bx}" y="{by}" width="{b}" height="{b}" rx="24"/></clipPath></defs>
<rect width="{art}" height="{art}" fill="{paper}"/>
<path d="{' '.join(paths)}" fill="{emerald}"/>
<rect x="{bx}" y="{by}" width="{b}" height="{b}" rx="24" fill="{paper}"/>
<image href="data:image/png;base64,{emblem_data}" x="{bx+8}" y="{by+15}" width="{b-16}" height="{b-30}" preserveAspectRatio="xMidYMid meet" clip-path="url(#badge)"/>
<rect x="{bx}" y="{by}" width="{b}" height="{b}" rx="24" fill="none" stroke="{gold}" stroke-width="7"/>
</svg>'''
QR_SVG.write_text(svg, encoding="utf-8")
print(f"Created {QR_PNG.name} and {QR_SVG.name}: {count}x{count} modules, H correction")
