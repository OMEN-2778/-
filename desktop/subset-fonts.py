"""Cuts the game's three fonts down to the characters it actually uses.

Reads fonts/chars.txt (build.js keeps it up to date), writes small woff2 files
plus fonts/fonts.json for build.js to embed. Runs offline from fonts/src/.
Usage: python subset-fonts.py
"""
import json
import os

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, 'fonts')
SRC = os.path.join(FONTS, 'src')

# family name used in CSS, source file, weight, variable-font instance (if any)
JOBS = [
    ('Press Start 2P', 'PressStart2P-Regular.ttf', 400, None),
    ('ZCOOL QingKe HuangYou', 'ZCOOLQingKeHuangYou-Regular.ttf', 400, None),
    ('Noto Sans SC', 'NotoSansSC-VF.ttf', 500, 500),
    ('Noto Sans SC', 'NotoSansSC-VF.ttf', 700, 700),
]


def main():
    with open(os.path.join(FONTS, 'chars.txt'), encoding='utf-8') as f:
        text = f.read()
    # always keep printable ASCII so numbers and labels render in every font
    text += ''.join(chr(c) for c in range(32, 127))
    for name in os.listdir(FONTS):
        if name.endswith('.woff2'):
            os.remove(os.path.join(FONTS, name))
    manifest, total = [], 0
    for family, src, weight, wght in JOBS:
        font = TTFont(os.path.join(SRC, src))
        if wght is not None:
            font = instancer.instantiateVariableFont(font, {'wght': wght})
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        sub = subset.Subsetter(opts)
        sub.populate(text=text)
        sub.subset(font)
        out = f"{src.split('-')[0].lower()}-{weight}.woff2"
        font.flavor = 'woff2'
        font.save(os.path.join(FONTS, out))
        size = os.path.getsize(os.path.join(FONTS, out))
        total += size
        manifest.append({'family': family, 'weight': str(weight), 'file': out})
        print(f'{family} {weight} -> {out} ({size // 1024} KB)')
    with open(os.path.join(FONTS, 'fonts.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f'{len(manifest)} files, {total // 1024} KB total')


if __name__ == '__main__':
    main()
