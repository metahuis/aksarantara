#!/usr/bin/env python3
"""
generate_lontara_dataset.py
───────────────────────────
Generates synthetic (image, romanized_text) pairs for Lontara script OCR training.

Sources:
  - All 138 syllables (23 consonants × 6 vowel forms) rendered from Lontara.ttf
  - Random 2–4 syllable sequences that simulate real word shapes
  - Multiple font sizes + augmentations per base image

Output:
  data/lontara_synthetic/
    images/          ← PNG crops
    metadata.jsonl   ← { image_path, text, script, type }

Usage:
  pip install pillow numpy
  python scripts/generate_lontara_dataset.py
  python scripts/generate_lontara_dataset.py --count 8000 --aug 10
"""

import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# ── Lontara Bugis Unicode character table ────────────────────────────────────
# Source: LONTARA_CHART in src/app/api/ai/lontara-ocr/route.js
# (glyph codepoint, consonant root without inherent 'a')
CONSONANTS = [
    ('ᨀ', 'k'),    # ᨀ ka
    ('ᨁ', 'g'),    # ᨁ ga
    ('ᨂ', 'ng'),   # ᨂ nga
    ('ᨃ', 'ngk'),  # ᨃ ngka
    ('ᨄ', 'p'),    # ᨄ pa
    ('ᨅ', 'b'),    # ᨅ ba
    ('ᨆ', 'm'),    # ᨆ ma
    ('ᨇ', 'mp'),   # ᨇ mpa
    ('ᨈ', 't'),    # ᨈ ta
    ('ᨉ', 'd'),    # ᨉ da
    ('ᨊ', 'n'),    # ᨊ na
    ('ᨋ', 'nr'),   # ᨋ nra
    ('ᨌ', 'c'),    # ᨌ ca
    ('ᨍ', 'j'),    # ᨍ ja
    ('ᨎ', 'ny'),   # ᨎ nya
    ('ᨏ', 'nc'),   # ᨏ nca
    ('ᨐ', 'y'),    # ᨐ ya
    ('ᨑ', 'r'),    # ᨑ ra
    ('ᨒ', 'l'),    # ᨒ la
    ('ᨓ', 'w'),    # ᨓ wa
    ('ᨔ', 's'),    # ᨔ sa
    ('ᨕ', ''),     # ᨕ a (independent vowel — root is empty)
    ('ᨖ', 'h'),    # ᨖ ha
]

# (diacritic codepoint or '', vowel romanization)
VOWELS = [
    ('',       'a'),    # inherent — no diacritic
    ('ᨗ', 'i'),    # ᨗ +i  (above)
    ('ᨘ', 'u'),    # ᨘ +u  (below)
    ('ᨙ', 'e'),    # ᨙ +é  (after)
    ('ᨚ', 'o'),    # ᨚ +o  (after+below)
    ('ᨛ', "e'"),   # ᨛ +e' pepet (before)
]

WORD_SEP = '᨞'  # ᨞ pattala — word separator (not rendered in training images)

# All 138 (glyph_string, romanization) syllable pairs
SYLLABLES = []
for glyph, root in CONSONANTS:
    for diac, vowel in VOWELS:
        script  = glyph + diac
        # Independent vowel (root='') renders just the vowel sound
        roman   = (root + vowel) if root else vowel
        SYLLABLES.append((script, roman))

# ── Visual styles (background, foreground) ──────────────────────────────────
STYLES = [
    {'bg': (255, 255, 255), 'fg': (10,  10,  10)},   # clean white
    {'bg': (255, 249, 230), 'fg': (20,  10,   5)},   # aged paper
    {'bg': (245, 230, 200), 'fg': (30,  15,   5)},   # old parchment
    {'bg': (240, 240, 235), 'fg': (50,  45,  40)},   # faded document
    {'bg': (255, 255, 255), 'fg': (80,  70,  60)},   # light ink
    {'bg': (250, 245, 220), 'fg': (15,  10,   8)},   # warm cream
]

# Font sizes to train across — covers small manuscript text to large typeset
FONT_SIZES = [48, 64, 80, 96]

# ── Augmentation helpers ─────────────────────────────────────────────────────
def _add_noise(img: Image.Image, strength: float = 0.03) -> Image.Image:
    arr   = np.array(img).astype(np.float32)
    noise = np.random.normal(0, strength * 255, arr.shape)
    return Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8))

def _paper_grain(img: Image.Image) -> Image.Image:
    arr   = np.array(img).astype(np.float32)
    grain = np.random.uniform(-10, 10, arr.shape[:2])
    for c in range(arr.shape[2]):
        arr[:, :, c] = np.clip(arr[:, :, c] + grain, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def augment(img: Image.Image, level: str = 'medium') -> Image.Image:
    """
    level='none'   — return as-is (clean reference)
    level='light'  — mild rotation + light noise only
    level='medium' — full augmentation suite
    level='heavy'  — manuscript-like degradation
    """
    if level == 'none':
        return img

    fill = img.getpixel((0, 0))

    # Rotation
    if random.random() < 0.65:
        max_angle = {'light': 5, 'medium': 12, 'heavy': 18}[level]
        img = img.rotate(random.uniform(-max_angle, max_angle),
                         expand=True, fillcolor=fill)

    # Gaussian blur (simulates out-of-focus / ink spread)
    if random.random() < 0.4:
        radius = random.uniform(0.2, {'light': 0.8, 'medium': 1.5, 'heavy': 2.5}[level])
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))

    # Pixel noise
    if random.random() < 0.55:
        img = _add_noise(img, random.uniform(0.01, {'light': 0.03, 'medium': 0.05, 'heavy': 0.08}[level]))

    # Paper grain (medium+ only)
    if level in ('medium', 'heavy') and random.random() < 0.35:
        img = _paper_grain(img)

    # Contrast reduction (simulates faded ink)
    if random.random() < 0.4:
        lo = {'light': 0.8, 'medium': 0.6, 'heavy': 0.4}[level]
        img = ImageEnhance.Contrast(img).enhance(random.uniform(lo, 1.0))

    # Brightness variation
    if random.random() < 0.35:
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.8, 1.2))

    # Sharpness reduction (heavy only — ink absorbed into paper)
    if level == 'heavy' and random.random() < 0.4:
        img = ImageEnhance.Sharpness(img).enhance(random.uniform(0.3, 0.7))

    return img

# ── Rendering ────────────────────────────────────────────────────────────────
def render(text: str, font: ImageFont.FreeTypeFont,
           style: dict, padding: int = 24) -> Image.Image:
    """Render Lontara Unicode text onto a background canvas."""
    dummy = Image.new('RGB', (1, 1))
    draw  = ImageDraw.Draw(dummy)
    bbox  = draw.textbbox((0, 0), text, font=font)

    w = max(bbox[2] - bbox[0] + padding * 2, 80)
    h = max(bbox[3] - bbox[1] + padding * 2, 80)

    img  = Image.new('RGB', (w, h), style['bg'])
    draw = ImageDraw.Draw(img)
    x    = (w - (bbox[2] - bbox[0])) // 2 - bbox[0]
    y    = (h - (bbox[3] - bbox[1])) // 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=style['fg'])
    return img

# ── Dataset generation ────────────────────────────────────────────────────────
def generate(font_path: str, out_dir: str, target: int, aug_per_base: int):
    font_path = Path(font_path)
    if not font_path.exists():
        print(f"ERROR: font not found at {font_path}", file=sys.stderr)
        sys.exit(1)

    out   = Path(out_dir)
    imgs  = out / 'images'
    imgs.mkdir(parents=True, exist_ok=True)

    fonts   = [ImageFont.truetype(str(font_path), s) for s in FONT_SIZES]
    records = []
    idx     = 0

    # ── Phase 1: All 138 syllables × font sizes × augmentations ──────────────
    aug_levels = ['none', 'light', 'light', 'medium', 'medium', 'medium', 'heavy', 'heavy']
    # Trim to aug_per_base
    levels = (aug_levels * ((aug_per_base // len(aug_levels)) + 1))[:aug_per_base]

    total_syl = len(SYLLABLES) * len(fonts) * aug_per_base
    print(f"Phase 1 — syllable crops: {total_syl:,}")

    for script_text, roman in SYLLABLES:
        for font in fonts:
            for level in levels:
                style = random.choice(STYLES)
                img   = render(script_text, font, style)
                img   = augment(img, level)
                fname = f'syl_{idx:06d}.png'
                img.save(imgs / fname)
                records.append({
                    'image_path': f'images/{fname}',
                    'text':   roman,
                    'script': script_text,
                    'type':   'syllable',
                    'aug':    level,
                })
                idx += 1

    # ── Phase 2: Multi-syllable sequences (2–4 syllables) ────────────────────
    n_seq = max(0, target - idx)
    print(f"Phase 2 — sequences:      {n_seq:,}")

    for _ in range(n_seq):
        length     = random.randint(2, 4)
        chosen     = random.choices(SYLLABLES, k=length)
        script_seq = ''.join(s for s, _ in chosen)
        roman_seq  = ''.join(r for _, r in chosen)
        font       = random.choice(fonts)
        style      = random.choice(STYLES)
        level      = random.choice(['light', 'medium', 'medium', 'heavy'])
        img        = render(script_seq, font, style)
        img        = augment(img, level)
        fname      = f'seq_{idx:06d}.png'
        img.save(imgs / fname)
        records.append({
            'image_path': f'images/{fname}',
            'text':   roman_seq,
            'script': script_seq,
            'type':   'sequence',
            'aug':    level,
        })
        idx += 1

    # ── Write metadata.jsonl ──────────────────────────────────────────────────
    meta = out / 'metadata.jsonl'
    with open(meta, 'w', encoding='utf-8') as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')

    # ── Summary ───────────────────────────────────────────────────────────────
    syl_count = sum(1 for r in records if r['type'] == 'syllable')
    seq_count = sum(1 for r in records if r['type'] == 'sequence')
    print(f"\n✓ Done")
    print(f"  Syllable crops : {syl_count:,}")
    print(f"  Sequences      : {seq_count:,}")
    print(f"  Total images   : {idx:,}")
    print(f"  Metadata       : {meta}")
    print(f"  Output dir     : {out}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate synthetic Lontara OCR training data')
    parser.add_argument('--font',  default='public/font/lontara/Lontara.ttf',
                        help='Path to Lontara.ttf')
    parser.add_argument('--out',   default='data/lontara_synthetic',
                        help='Output directory')
    parser.add_argument('--count', type=int, default=6000,
                        help='Target total image count (default 6000)')
    parser.add_argument('--aug',   type=int, default=8,
                        help='Augmentation variants per syllable×size (default 8)')
    args = parser.parse_args()

    generate(args.font, args.out, args.count, args.aug)
