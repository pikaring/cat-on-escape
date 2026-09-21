# -*- coding: utf-8 -*-
"""
生成AIが出した「猫の顔」の画像を、ゲームで使える形に整える。

・白ベタ／市松模様の背景を、外周から判定して透過にする
  （目のハイライトのように、まわりを囲まれた白は残す）
・顔のまわりを切りつめてから、正方形の中央にそろえて余白をつける
・512×512ピクセルのPNGとして書き出す

つかいかた:
    python3 tools/make_face.py 出力先ディレクトリ 入力1.jpg:出力名1 入力2.png:出力名2 ...
例:
    python3 tools/make_face.py app/images kuro.jpg:face-kuro chashiro.jpg:face-chashiro

必要なもの: pillow, numpy （pip install pillow numpy）
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

SIZE = 512        # 書き出す1枚の大きさ（px）
FILL = 0.94       # 顔が1枚のなかで占める割合（のこりが余白）
TOLERANCE = 26    # 背景とみなす色の近さ（大きいほど よく抜けるが、猫も削れる）


def background_alpha(path):
    """外周とつながっている背景色の画素だけを透明にした RGBA を返す。"""
    img = Image.open(path).convert('RGB')
    rgb = np.asarray(img).astype(np.int16)
    h, w, _ = rgb.shape

    # 背景の色は画像の外周から採る（白ベタとはかぎらないため）
    ring = np.concatenate([
        rgb[:2].reshape(-1, 3), rgb[-2:].reshape(-1, 3),
        rgb[:, :2].reshape(-1, 3), rgb[:, -2:].reshape(-1, 3)])
    keys, counts = np.unique(ring // 8, axis=0, return_counts=True)
    bg_colors = [k * 8 + 4 for k, c in zip(keys, counts) if c > len(ring) * 0.05]
    if not bg_colors:                      # 外周が一色にまとまらないときは白とみなす
        bg_colors = [np.array([255, 255, 255])]

    near_bg = np.zeros((h, w), bool)
    for color in bg_colors:
        near_bg |= (np.abs(rgb - color).max(axis=2) <= TOLERANCE)

    # 外周から届く背景だけを塗りつぶす（目のハイライトなど、囲まれた白は残す）
    reached = np.zeros((h, w), bool)
    queue = deque()

    def seed(y, x):
        if near_bg[y, x] and not reached[y, x]:
            reached[y, x] = True
            queue.append((y, x))

    for y in range(h):
        seed(y, 0)
        seed(y, w - 1)
    for x in range(w):
        seed(0, x)
        seed(h - 1, x)

    while queue:
        y, x = queue.popleft()
        if y > 0:     seed(y - 1, x)
        if y < h - 1: seed(y + 1, x)
        if x > 0:     seed(y, x - 1)
        if x < w - 1: seed(y, x + 1)

    alpha = np.where(reached, 0, 255).astype(np.uint8)
    out = Image.fromarray(np.dstack([np.asarray(img), alpha]), 'RGBA')

    # 背景の色がにじんだ ふちを 1px 削ってから ぼかし、ギザギザと白いふちを目立たなくする
    a = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    out.putalpha(a)
    return out


def square(img):
    """中身を切りつめて、正方形の中央に FILL の割合でおさめる。"""
    box = img.getbbox()                    # 透明でないところの わく
    if box:
        img = img.crop(box)
    side = int(max(img.size) / FILL)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    out_dir = sys.argv[1].rstrip('/')
    for item in sys.argv[2:]:
        src, _, name = item.partition(':')
        if not name:
            print(f'× {item}: 「入力ファイル:出力名」の形で指定してください')
            return 1
        dst = f'{out_dir}/{name}.png'
        square(background_alpha(src)).save(dst)
        print(f'○ {src} → {dst}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
