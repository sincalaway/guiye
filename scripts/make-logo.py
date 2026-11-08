"""把生成的抠图 logo 去绿边、裁切，并输出各尺寸图标（宣纸底圆角方形）。
用法：python3 scripts/make-logo.py <源png> [--preview out.png]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
src = sys.argv[1]
a = np.array(Image.open(src).convert('RGBA')).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
red = (r > 150) & (r > g + 60) & (r > b + 60)
gray = np.minimum(g, (r + b) / 2)
for i in range(3):
    a[..., i] = np.where(red, a[..., i], gray)
mark = Image.fromarray(a.clip(0, 255).astype('uint8'))
mark = mark.crop(mark.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
w, h = mark.size; s = int(max(w, h) * 1.1)
sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(mark, ((s - w) // 2, (s - h) // 2))
sq = sq.resize((512, 512), Image.LANCZOS)

S = 512
icon = Image.new('RGBA', (S, S), (0, 0, 0, 0)); m = Image.new('L', (S, S), 0)
ImageDraw.Draw(m).rounded_rectangle((0, 0, S - 1, S - 1), radius=112, fill=255)
icon.paste(Image.new('RGBA', (S, S), (250, 247, 238, 255)), (0, 0), m)
pad = 36; icon.alpha_composite(sq.resize((S - 2 * pad, S - 2 * pad), Image.LANCZOS), (pad, pad))

for p in ('apps/web/public/logo.png', 'apps/extension/public/logo.png', 'docs/assets/logo.png'):
    icon.save(ROOT / p)
sq.save(ROOT / 'docs/assets/logo-transparent.png')
for n in (16, 32, 48, 128):
    icon.resize((n, n), Image.LANCZOS).save(ROOT / f'apps/extension/public/icons/icon{n}.png')
icon.resize((180, 180), Image.LANCZOS).save(ROOT / 'apps/web/public/apple-touch-icon.png')

if '--preview' in sys.argv:
    out = sys.argv[sys.argv.index('--preview') + 1]
    c = Image.new('RGBA', (768, 512), (30, 30, 35, 255)); c.alpha_composite(icon)
    for y, n in ((40, 32), (260, 16)):
        c.alpha_composite(icon.resize((n, n), Image.LANCZOS).resize((128, 128), Image.NEAREST), (576, y))
    c.save(out)
