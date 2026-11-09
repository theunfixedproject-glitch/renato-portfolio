# python3 sheet.py <cartella> <uscita.jpg> [colonne] [larghezza miniatura]
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
files = sorted(f for f in os.listdir(d) if f.endswith(".jpg") or f.endswith(".png"))
th = tw * 16 // 9
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 6), rows * (th + 30)), (40, 40, 48))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(d, f)).convert("RGB").resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * (tw + 6), (i // cols) * (th + 30)
    sheet.paste(im, (x, y + 26))
    dr.text((x + 4, y + 6), f.rsplit(".", 1)[0], fill=(255, 255, 0))
sheet.save(out, quality=88)
print(out, sheet.size)
