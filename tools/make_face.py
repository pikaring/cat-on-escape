# -*- coding: utf-8 -*-
"""
生成AIが出した「猫の顔」の画像を、ゲームで使える形に整える。

・白ベタ／市松模様の背景を、外周から判定して透過にする
  （目のハイライトのように、まわりを囲まれた白は残す）
・1枚に何匹か ならんだ グリッド画像なら、すきまを見つけて 1匹ずつに 切り分ける
  （ひげが 顔から はなれていても、同じマスの ものは いっしょに 切り出す）
・顔のまわりを切りつめてから、正方形の中央にそろえて余白をつける
・512×512ピクセルのPNGとして書き出す

つかいかた:
    python3 tools/make_face.py 出力先ディレクトリ 入力:出力名[,出力名...] ...

例（1匹ずつの画像）:
    python3 tools/make_face.py app/images kuro.jpg:face-kuro chashiro.jpg:face-chashiro

例（3列×2行に5匹ならんだ1枚。左上から右へ、の順に名前を書く）:
    python3 tools/make_face.py app/images grid.jpg:face-kuro,face-chashiro,face-kijitora,face-hachiware,face-mike

必要なもの: pillow, numpy （pip install pillow numpy）
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

SIZE = 512        # 書き出す1枚の大きさ（px）
FILL = 0.94       # 顔が1枚のなかで占める割合（のこりが余白）
TOLERANCE = 26    # 背景とみなす色の近さ（大きいほど よく抜けるが、猫も削れる）
MIN_PART = 0.004  # これより小さい かたまりは ゴミとみなす（画像全体に対する面積の割合）


def bg_mask(rgb):
    """画像の外周から背景色を採り、それに近い画素をしるしする。"""
    ring = np.concatenate([
        rgb[:2].reshape(-1, 3), rgb[-2:].reshape(-1, 3),
        rgb[:, :2].reshape(-1, 3), rgb[:, -2:].reshape(-1, 3)])
    keys, counts = np.unique(ring // 8, axis=0, return_counts=True)
    bg_colors = [k * 8 + 4 for k, c in zip(keys, counts) if c > len(ring) * 0.05]
    if not bg_colors:                      # 外周が一色にまとまらないときは白とみなす
        bg_colors = [np.array([255, 255, 255])]

    near_bg = np.zeros(rgb.shape[:2], bool)
    for color in bg_colors:
        near_bg |= (np.abs(rgb - color).max(axis=2) <= TOLERANCE)
    return near_bg


def unframe(img):
    """絵のまわりに かざり枠が 描かれて しまった ときは、枠の 内側だけを 切り出す。
    （枠の 内がわの 白は 外と つながっていないので、そのままでは 抜けない）"""
    rgb = np.asarray(img).astype(np.int16)
    near_bg = bg_mask(rgb)
    h, w = near_bg.shape

    # 中身の ある ところの わく
    ys, xs = np.where(~near_bg)
    if not len(ys):
        return img
    top, bottom, left, right = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    inner = ~near_bg[top:bottom, left:right]
    if inner.shape[0] < 8 or inner.shape[1] < 8:
        return img

    # わくの ふちが ぐるりと うまっていたら 「枠」とみなす
    edge = np.concatenate([inner[0], inner[-1], inner[:, 0], inner[:, -1]])
    if edge.mean() < 0.9:
        return img

    def inside(line):
        """外から 内へ すすみ、背景 → 枠 → 背景 と かわる ところを さがす。"""
        i = 0
        while i < len(line) and line[i] > 0.7:   # 枠の そとの 余白
            i += 1
        while i < len(line) and line[i] <= 0.7:  # 枠そのもの
            i += 1
        return i

    rows_bg = near_bg.mean(axis=1)
    cols_bg = near_bg.mean(axis=0)
    t = inside(rows_bg)
    b = h - inside(rows_bg[::-1])
    l = inside(cols_bg)
    r = w - inside(cols_bg[::-1])
    if b - t < h * 0.3 or r - l < w * 0.3:
        return img
    return img.crop((l, t, r, b))


def background_alpha(path):
    """外周とつながっている背景色の画素だけを透明にした RGBA を返す。"""
    img = unframe(Image.open(path).convert('RGB'))
    rgb = np.asarray(img).astype(np.int16)
    h, w, _ = rgb.shape
    near_bg = bg_mask(rgb)

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


def bands(has_content, min_gap):
    """中身のある ところを、min_gap いじょう あいた すきまで 区切って かえす。"""
    spans, start = [], None
    gap = 0
    for i, on in enumerate(has_content):
        if on:
            if start is None:
                start = i
            elif gap:
                pass
            gap = 0
        else:
            if start is not None:
                gap += 1
                if gap >= min_gap:
                    spans.append((start, i - gap + 1))
                    start = None
                    gap = 0
    if start is not None:
        spans.append((start, len(has_content)))
    return [(a, b) for a, b in spans if b > a]


def split_cells(img, want):
    """1枚に ならんだ 絵を、want 個の マスに 切り分ける（左上から 右へ、の順）。"""
    alpha = np.asarray(img.getchannel('A')) > 12
    h, w = alpha.shape
    if want <= 1:
        return [img]

    # すきまの 広さを だんだん ゆるめながら、ちょうど want 個に 分かれる ところを さがす
    for frac in (0.09, 0.07, 0.055, 0.045, 0.035, 0.028, 0.022, 0.018, 0.014, 0.01):
        rows = bands(alpha.any(axis=1), max(2, int(h * frac)))
        cells = []
        for top, bottom in rows:
            strip = alpha[top:bottom]
            for left, right in bands(strip.any(axis=0), max(2, int(w * frac))):
                cells.append((top, bottom, left, right))
        big = [c for c in cells
               if (c[1] - c[0]) * (c[3] - c[2]) > h * w * MIN_PART]
        if len(big) == want:
            return [img.crop((left, top, right, bottom)) for top, bottom, left, right in big]

    raise SystemExit(f'× {want}個に 分けられませんでした。'
                     'マスの すきまを 広めに して 作りなおすか、1匹ずつ 渡してください。')


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
    os.makedirs(out_dir, exist_ok=True)
    for item in sys.argv[2:]:
        src, _, names = item.partition(':')
        names = [n for n in names.split(',') if n]
        if not names:
            print(f'× {item}: 「入力ファイル:出力名」の形で指定してください')
            return 1
        whole = background_alpha(src)
        for img, name in zip(split_cells(whole, len(names)), names):
            dst = f'{out_dir}/{name}.png'
            square(img).save(dst)
            print(f'○ {src} → {dst}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
