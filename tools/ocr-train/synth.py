"""
Generazione sintetica di celle sudoku (32x32) per l'addestramento del
classificatore di cifre.

Classi: 0 = cella vuota, 1..9 = cifra.

Ogni campione simula una cella ritagliata da una griglia raddrizzata:
sfondo con illuminazione non uniforme, linee di griglia sui bordi (con
disallineamento), cifra renderizzata con un font di sistema, rotazione,
sfocatura, rumore, compressione JPEG e riduzione a 32x32 (media d'area).

La normalizzazione finale (`normalize`) DEVE restare identica a quella
TypeScript in `libs/logic/src/lib/ocr/digit-preprocess.ts`.
"""
import io
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CELL = 32
MIN_RANGE = 0.25

FONT_DIRS = [r'C:\Windows\Fonts']
EXCLUDE = (
    'symbol', 'wingding', 'webding', 'marlett', 'mtextra', 'holomdl2',
    'segmdl2', 'segoeicons', 'segoefluent', 'emoji', 'bssym', 'refspcl',
    'outlook', 'msgothic', 'mingliu', 'simsun', 'msjh', 'msyh', 'yugoth',
    'malgun', 'gadugi', 'ebrima', 'mvboli', 'javatext', 'ntailu', 'phagspa',
    'taile', 'himalaya', 'mmrtext', 'monbaiti', 'sylfaen', 'leelaw', 'nirmala',
    'seguiemj', 'seguisym', 'seguihis', 'msuighu', 'msyi', 'l_10646',
    # font troppo decorativi (cifre poco realistiche per uno schema stampato)
    'chiller', 'curlz', 'jokerman', 'oldengl', 'rage', 'playbill', 'gigi',
    'ravie', 'snap_', 'itcblkad', 'kunstler', 'parchm', 'vivaldi', 'vladimir',
    'brushsci', 'freescpt', 'frscript', 'harlowsi', 'mistral', 'palscri',
    'scriptbl', 'itcedscr', 'magnetob', 'stencil', 'showg', 'juice', 'forte',
    'bradhitc', 'pristina', 'ftltlt', 'maturasc', 'lcallig', 'goudysto',
    'colonna', 'engr', 'hatten', 'infroman', 'onyx', 'niageng', 'niagsol',
    'papyrus', 'bauhs93', 'imprisha', 'castelar', 'algerian', 'alger.',
    'bernhc', 'gabriola', 'latinwd', 'mod20', 'tempsitc', 'viner', 'felixti',
)


def _glyph_signature(font, ch):
    img = Image.new('L', (64, 64), 0)
    d = ImageDraw.Draw(img)
    d.text((32, 32), ch, fill=255, font=font, anchor='mm')
    return np.asarray(img, dtype=np.uint8)


def load_fonts():
    """Font di sistema che rendono correttamente le cifre 1..9."""
    fonts = []
    for folder in FONT_DIRS:
        for name in sorted(os.listdir(folder)):
            low = name.lower()
            if not low.endswith(('.ttf', '.otf', '.ttc')):
                continue
            if any(x in low for x in EXCLUDE):
                continue
            path = os.path.join(folder, name)
            try:
                f = ImageFont.truetype(path, 48)
                sigs = [_glyph_signature(f, str(d)) for d in range(1, 10)]
                notdef = _glyph_signature(f, '\ue000')
            except Exception:
                continue
            if any(s.sum() < 255 * 20 for s in sigs):
                continue
            # tutte diverse tra loro e dal glifo "mancante"
            flat = [s.tobytes() for s in sigs]
            if len(set(flat)) < 9 or notdef.tobytes() in flat:
                continue
            fonts.append(path)
    return fonts


def normalize(gray):
    """gray: float32 [0..1] (1 = bianco) → inchiostro normalizzato [0..1]."""
    ink = 1.0 - gray
    bg = float(np.median(ink))
    rng = max(float(ink.max()) - bg, MIN_RANGE)
    return np.clip((ink - bg) / rng, 0.0, 1.0).astype(np.float32)


def _draw_grid_lines(d, s, ink):
    """Linee di griglia sui bordi, con spessore e disallineamento casuali."""
    for side in range(4):
        if random.random() < 0.25:
            continue
        thick = random.choice([1, 1, 2, 2, 3, 4, 5, 6]) * s / 64
        thick = max(1, int(round(thick)))
        off = random.uniform(-0.04, 0.12) * s  # >0 = linea dentro la cella
        slope = random.uniform(-0.04, 0.04) * s
        a = off
        b = off + slope
        if side == 0:
            d.line([(0, a), (s, b)], fill=ink, width=thick)
        elif side == 1:
            d.line([(0, s - a), (s, s - b)], fill=ink, width=thick)
        elif side == 2:
            d.line([(a, 0), (b, s)], fill=ink, width=thick)
        else:
            d.line([(s - a, 0), (s - b, s)], fill=ink, width=thick)


def _draw_neighbor_fragment(d, s, fonts, ink):
    """Frammento di una cifra vicina che sborda (warp impreciso)."""
    font = ImageFont.truetype(random.choice(fonts), int(s * random.uniform(0.5, 0.8)))
    ch = str(random.randint(1, 9))
    side = random.randint(0, 3)
    c = s / 2
    far = s * random.uniform(0.85, 1.05)
    x, y = {0: (c, c - far), 1: (c, c + far), 2: (c - far, c), 3: (c + far, c)}[side]
    d.text((x, y), ch, fill=ink, font=font, anchor='mm')


def _render_digit(s, digit, font_path):
    """Cifra su layer trasparente (maschera L) già ruotata/scalata."""
    size = int(s * random.uniform(0.42, 0.82))
    font = ImageFont.truetype(font_path, max(8, size))
    big = s * 2
    layer = Image.new('L', (big, big), 0)
    d = ImageDraw.Draw(layer)
    stroke = random.choice([0, 0, 0, 0, 1]) if size > 24 else 0
    d.text((big / 2, big / 2), str(digit), fill=255, font=font, anchor='mm',
           stroke_width=stroke, stroke_fill=255)
    # rotazione + shear leggero (prospettiva residua)
    angle = random.uniform(-7, 7)
    layer = layer.rotate(angle, resample=Image.BILINEAR)
    sh = random.uniform(-0.12, 0.12)
    sy = random.uniform(0.9, 1.1)
    layer = layer.transform(
        layer.size, Image.AFFINE,
        (1, sh, -sh * big / 2, 0, sy, (1 - sy) * big / 2),
        resample=Image.BILINEAR)
    # erosione/dilatazione (spessore tratto)
    r = random.random()
    if r < 0.15:
        layer = layer.filter(ImageFilter.MaxFilter(3))
    elif r < 0.25 and size > 30:
        layer = layer.filter(ImageFilter.MinFilter(3))
    # ritaglio centrato con jitter
    jx = random.uniform(-0.1, 0.1) * s
    jy = random.uniform(-0.1, 0.1) * s
    left = int(big / 2 - s / 2 - jx)
    top = int(big / 2 - s / 2 - jy)
    return layer.crop((left, top, left + s, top + s))


def make_sample(label, fonts):
    s = random.randint(40, 110)

    # sfondo: carta con gradiente di illuminazione
    bg = random.uniform(0.55, 1.0)
    gx, gy = random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15)
    yy, xx = np.mgrid[0:s, 0:s] / s - 0.5
    base = np.clip(bg + gx * xx + gy * yy, 0, 1)
    img = Image.fromarray((base * 255).astype(np.uint8), 'L')
    d = ImageDraw.Draw(img)

    ink_level = random.uniform(0.0, min(0.45, bg - 0.25))
    ink = int(ink_level * 255)

    if random.random() < 0.85:
        _draw_grid_lines(d, s, ink)
    if random.random() < 0.12:
        _draw_neighbor_fragment(d, s, fonts, ink)

    if label > 0:
        mask = _render_digit(s, label, random.choice(fonts))
        digit_ink = Image.new('L', (s, s), ink)
        img.paste(digit_ink, (0, 0), mask)
    elif random.random() < 0.15:
        # macchioline / sporco
        for _ in range(random.randint(1, 4)):
            x, y = random.uniform(0.2, 0.8) * s, random.uniform(0.2, 0.8) * s
            r = random.uniform(0.3, 1.2) * s / 40
            d.ellipse([x - r, y - r, x + r, y + r], fill=int(random.uniform(ink, 200)))

    # sfocatura
    if random.random() < 0.6:
        img = img.filter(ImageFilter.GaussianBlur(random.uniform(0.2, 1.6) * s / 64))

    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr += np.random.normal(0, random.uniform(0, 0.05), arr.shape)
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'L')

    # compressione jpeg
    if random.random() < 0.5:
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=random.randint(25, 90))
        buf.seek(0)
        img = Image.open(buf).convert('L')

    img = img.resize((CELL, CELL), Image.BOX)
    gray = np.asarray(img, dtype=np.float32) / 255.0
    return normalize(gray)
