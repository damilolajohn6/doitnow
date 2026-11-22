from pathlib import Path
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path('/home/user')
APP = ROOT / 'do-it-now-web'
OUT = APP / 'public' / 'images' / 'designs'
BRAND = APP / 'public' / 'images' / 'brand'
FONTS = APP / 'app' / 'fonts'
ICONS = APP / 'public' / 'icons'
OUT.mkdir(parents=True, exist_ok=True)
BRAND.mkdir(parents=True, exist_ok=True)
FONTS.mkdir(parents=True, exist_ok=True)
ICONS.mkdir(parents=True, exist_ok=True)

assets = {
    'wardrobe-01.webp': ROOT / 'room-1-wardrobe-simple-concept.png',
    'wardrobe-02.webp': ROOT / 'room-4-wardrobe-simple-concept.png',
    'wardrobe-03.webp': ROOT / 'uploads/2b5be27e6c362f0bc631311e70c8ec30.jpg',
    'kitchen-01.webp': ROOT / 'kitchen-without-island-01-ivory-walnut-windows.png',
    'kitchen-02.webp': ROOT / 'kitchen-with-island-01-ivory-walnut-windows.png',
    'kitchen-03.webp': ROOT / 'kitchen-with-island-02-sage-oak-windows.png',
    'kitchen-04.webp': ROOT / 'kitchen-without-island-03-greige-darkwood-windows.png',
    'kitchen-05.webp': ROOT / 'kitchen-without-island-02-sage-oak-windows.png',
    'kitchen-06.webp': ROOT / 'kitchen-with-island-03-greige-darkwood-windows.png',
    'bedroom-tv-01.webp': ROOT / 'catalogue-assets/bedroom-tv-wall-01.jpg',
    'bedroom-tv-02.webp': ROOT / 'catalogue-assets/bedroom-tv-wall-04.jpg',
    'bedroom-tv-03.webp': ROOT / 'uploads/52152979069f2447d91a0f281445293c.jpg',
    'bedroom-01.webp': ROOT / 'uploads/bef4ffe72a6831743bfb571c26d60a82.jpg',
    'bedroom-02.webp': ROOT / 'uploads/9fbd9374ccd4bc9b92e1b0f3cbe45105.jpg',
    'living-01.webp': ROOT / 'catalogue-assets/living-01-warm-minimal.jpg',
    'dining-01.webp': ROOT / 'catalogue-assets/dining-01-warm-oak.jpg',
    'tv-wall-01.webp': ROOT / 'actual-wall-tv-design-01-white-marble-walnut.png',
    'tv-wall-02.webp': ROOT / 'actual-wall-tv-design-03-fluted-walnut-stone.png',
    'tv-wall-03.webp': ROOT / 'actual-wall-tv-design-05-taupe-travertine-oak.png',
    'bathroom-01.webp': ROOT / 'catalogue-assets/bathroom-01-walk-in-shower.jpg',
    'bathroom-02.webp': ROOT / 'catalogue-assets/bathroom-02-compact-vanity.jpg',
    'bathroom-03.webp': ROOT / 'catalogue-assets/bathroom-03-spa-retreat.jpg',
    'staircase-01.webp': ROOT / 'catalogue-assets/staircase-01-floating-timber.jpg',
    'staircase-02.webp': ROOT / 'catalogue-assets/staircase-02-statement-lighting.jpg',
    'office-01.webp': ROOT / 'catalogue-assets/home-office-01-built-in.jpg',
    'entry-01.webp': ROOT / 'catalogue-assets/entryway-01-minimal-console.jpg',
}

for name, source in assets.items():
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert('RGB')
        image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        image.save(OUT / name, 'WEBP', quality=84, method=6)

shutil.copy2(ROOT / 'logo.png', BRAND / 'do-it-now-logo.png')

with Image.open(ROOT / 'logo.png') as opened:
    mark = opened.convert('RGB').crop((0, 0, 900, 900))
    mark = ImageOps.contain(mark, (512, 512), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (512, 512), (247, 243, 235))
    canvas.paste(mark, ((512 - mark.width) // 2, (512 - mark.height) // 2))
    canvas.save(APP / 'app' / 'icon.png', optimize=True)

icon_source = APP / 'app' / 'icon.png'
with Image.open(icon_source) as opened:
    for size in (192, 512):
        opened.convert('RGB').resize((size, size), Image.Resampling.LANCZOS).save(ICONS / f'icon-{size}.png', optimize=True)

# Social-sharing artwork: 1200 × 630 px, generated from the approved brand assets.
og = Image.new('RGB', (1200, 630), (37, 41, 39))
with Image.open(ROOT / 'catalogue-assets/living-01-warm-minimal.jpg') as opened:
    hero = ImageOps.fit(opened.convert('RGB'), (560, 630), Image.Resampling.LANCZOS)
    og.paste(hero, (640, 0))
draw = ImageDraw.Draw(og)
draw.rectangle((624, 0, 640, 630), fill=(154, 107, 63))
draw.rounded_rectangle((48, 42, 420, 150), radius=16, fill=(247, 243, 235))
with Image.open(ROOT / 'logo.png') as opened:
    brand = opened.convert('RGB')
    brand.thumbnail((330, 82), Image.Resampling.LANCZOS)
    og.paste(brand, (68, 55))
font_dir = Path('/usr/share/fonts/truetype/dejavu')
small = ImageFont.truetype(str(font_dir / 'DejaVuSans-Bold.ttf'), 20)
headline = ImageFont.truetype(str(font_dir / 'DejaVuSans-Bold.ttf'), 48)
body = ImageFont.truetype(str(font_dir / 'DejaVuSans.ttf'), 21)
draw.text((50, 192), 'CUSTOM FURNITURE & INTERIORS', font=small, fill=(154, 107, 63))
draw.text((50, 248), 'Furniture that fits.', font=headline, fill=(255, 255, 255))
draw.text((50, 312), 'Interiors that', font=headline, fill=(255, 255, 255))
draw.text((50, 376), 'feel right.', font=headline, fill=(154, 107, 63))
draw.text((50, 480), 'DESIGN. BUILD. DELIVER.', font=small, fill=(216, 210, 200))
draw.text((50, 548), '+234 701 717 6611  ·  gabdidi52@gmail.com', font=body, fill=(247, 243, 235))
og.save(BRAND.parent / 'og-do-it-now.jpg', quality=90, optimize=True)

for filename in ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf']:
    shutil.copy2(Path('/usr/share/fonts/truetype/dejavu') / filename, FONTS / filename)

print(f'Prepared {len(assets)} optimized design images in {OUT}')
print('Prepared brand logo, app icons, Open Graph artwork and local fonts')
