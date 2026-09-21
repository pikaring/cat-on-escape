# -*- coding: utf-8 -*-
"""
ゲームの猫の顔から、アプリのアイコン一式をつくる。

・濃い緑の角丸の上に 猫の顔を おき、左に 右へ走る いきおいの 線を 3本 入れる
・app/images/icon-32 / 180 / 192 / 512.png と、紹介ページ用の
  assets/icon.png（512px）・assets/favicon.png（64px）を 書き出す

つかいかた:
    python3 tools/make_icons.py [猫の顔のPNG]
例:
    python3 tools/make_icons.py app/images/face-chashiro.png

必要なもの: pillow （pip install pillow）
"""
import os
import sys

from PIL import Image, ImageDraw

BASE = 1024                    # 下ごしらえの 大きさ（ここから 縮小する）
BG = (47, 93, 58, 255)         # --c-header と おなじ みどり
LINE = (255, 227, 110, 255)    # --c-accent と おなじ きいろ
FACE = 0.64                    # 顔が アイコンに 占める わりあい
SHIFT = 0.055                  # まんなかより すこし 右へ（左の 線の ぶん）
OUT = [
    ('app/images/icon-512.png', 512),
    ('app/images/icon-192.png', 192),
    ('app/images/icon-180.png', 180),
    ('app/images/icon-32.png', 32),
    ('assets/icon.png', 512),
    ('assets/favicon.png', 64),
]


def build(face_path):
    icon = Image.new('RGBA', (BASE, BASE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)
    draw.rounded_rectangle([0, 0, BASE - 1, BASE - 1], radius=int(BASE * 0.19), fill=BG)

    # 右へ 走る いきおいの 線（左はしに 3本）
    w = int(BASE * 0.028)
    for y, length in ((0.37, 0.10), (0.50, 0.07), (0.63, 0.10)):
        y0 = int(BASE * y)
        draw.rounded_rectangle(
            [int(BASE * 0.07), y0 - w // 2, int(BASE * (0.07 + length)), y0 + w // 2],
            radius=w // 2, fill=LINE)

    face = Image.open(face_path).convert('RGBA')
    size = int(BASE * FACE)
    face = face.resize((size, size), Image.LANCZOS)
    icon.alpha_composite(face, (int((BASE - size) / 2 + BASE * SHIFT), (BASE - size) // 2))
    return icon


def main():
    face_path = sys.argv[1] if len(sys.argv) > 1 else 'app/images/face-chashiro.png'
    if not os.path.exists(face_path):
        print(f'× {face_path} が ありません')
        return 1
    icon = build(face_path)
    for path, size in OUT:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        icon.resize((size, size), Image.LANCZOS).save(path)
        print(f'○ {path} ({size}px)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
