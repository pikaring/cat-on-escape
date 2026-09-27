# -*- coding: utf-8 -*-
"""
生成AIが出した「立ち絵」（上半身）の画像を、ストーリー画面で使える形に整える。

make_face.py（顔アイコン用）との ちがい:
・体は 絵の 下の はしで 切れている ので、白い 背景は 上と 左右の ふちからだけ たどって 抜く
  （下の ふちから たどると、ブレザーや カーディガンまで 背景と まちがえて 抜けてしまう）
・体の 下はしは 正方形の 下に そろえたまま、左右の まんなかに 置く（セリフ窓の 上に 立たせるため）
・グリッドに 区切り線が 描かれていても よい。線を 見つけて、マスごとに 切り分ける

つかいかた:
    python3 tools/make_sprite.py 出力先ディレクトリ 入力:列数x行数:出力名[,出力名...] ...

例（2列×2行に 表情4つ。左上から右へ の順に 名前を 書く）:
    python3 tools/make_sprite.py app/images/story nao.jpg:2x2:nao-normal,nao-happy,nao-surprised,nao-serious

必要なもの: pillow, numpy （pip install pillow numpy）
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

SIZE = 512        # 書き出す1枚の大きさ（px）
WHITE = 232       # これより 明るい（R・G・B すべて）画素を 背景の 白と みなす
LINE = 90         # これより 暗い 画素が 列（行）の 8割を こえたら 区切り線と みなす
TOP_MARGIN = 0.03 # 頭の上に あける 余白（1枚の 高さに 対する 割合）


def split_cells(img, cols, rows):
    """区切り線が あれば それに そって、なければ 等分で マスに 切る。"""
    a = np.asarray(img).astype(int)
    h, w, _ = a.shape
    dark = a.max(axis=2) < LINE

    def cuts(profile, n, parts):
        edges = [0]
        for k in range(1, parts):
            center = n * k // parts
            lo, hi = center - n // 20, center + n // 20
            hits = [i for i in range(lo, hi) if profile[i] > 0.8]
            if hits:
                edges += [min(hits), max(hits) + 1]
            else:
                edges += [center, center]
        edges.append(n)
        return [(edges[i], edges[i + 1]) for i in range(0, len(edges), 2)]

    xs = cuts(dark.mean(axis=0), w, cols)
    ys = cuts(dark.mean(axis=1), h, rows)
    pad = max(3, w // 200)    # 線の にじみを よける
    cells = []
    for y0, y1 in ys:
        for x0, x1 in xs:
            cells.append(img.crop((x0 + pad, y0 + pad, x1 - pad, y1 - pad)))
    return cells


def cut_out(cell):
    """上と 左右の ふちから つながる 白を 透明に する。"""
    a = np.asarray(cell.convert('RGB')).astype(int)
    h, w, _ = a.shape
    white = a.min(axis=2) >= WHITE
    bg = np.zeros((h, w), bool)
    queue = deque()
    seeds = [(0, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    for y, x in seeds:
        if white[y, x] and not bg[y, x]:
            bg[y, x] = True
            queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                queue.append((ny, nx))

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # ふちの 1画素は、白っぽさに あわせて すこし 透かす（ギザギザを やわらげる）
    near = np.zeros_like(bg)
    near[1:] |= bg[:-1]; near[:-1] |= bg[1:]; near[:, 1:] |= bg[:, :-1]; near[:, :-1] |= bg[:, 1:]
    edge = near & ~bg
    light = a.min(axis=2)
    alpha[edge] = np.clip((255 - light[edge]) * 255 // max(1, 255 - 150), 60, 255).astype(np.uint8)

    rgba = np.dstack([a.astype(np.uint8), alpha])
    return Image.fromarray(rgba, 'RGBA')


def to_square(sprite):
    """中身を 切りつめ、下はしを そろえて 正方形の 下・まんなかに 置く。"""
    a = np.asarray(sprite)[:, :, 3]
    ys, xs = np.where(a > 0)
    box = (xs.min(), ys.min(), xs.max() + 1, sprite.height)   # 下は 切らない（体の 切れ目）
    body = sprite.crop(box)
    side = max(body.width, int(body.height * (1 + TOP_MARGIN)))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(body, ((side - body.width) // 2, side - body.height))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    out_dir = argv[0]
    os.makedirs(out_dir, exist_ok=True)
    for spec in argv[1:]:
        path, grid, names = spec.rsplit(':', 2)
        cols, rows = (int(n) for n in grid.lower().split('x'))
        names = names.split(',')
        img = Image.open(path).convert('RGB')
        cells = split_cells(img, cols, rows)
        for name, cell in zip(names, cells):
            if not name:
                continue
            dest = os.path.join(out_dir, name + '.png')
            to_square(cut_out(cell)).save(dest, optimize=True)
            print('○', path, '→', dest)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
