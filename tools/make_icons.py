# -*- coding: utf-8 -*-
"""
ナオと フミの 顔と、タイトルロゴ「猫が消えた街」から、アプリの アイコン一式を つくる。

・夕やけ色の 角丸の 上に、ロゴ（上）と ナオ・フミの 顔（下）を ならべる
・小さい アイコン（64px 以下）は ロゴの 文字が つぶれるので、ふたりの 顔だけに する
・app/images/icon-32 / 180 / 192 / 512.png と、紹介ページ用の
  assets/icon.png（512px）・assets/favicon.png（64px）を 書き出す

つかいかた:
    python3 tools/make_icons.py [ナオの立ち絵] [フミの立ち絵] [ロゴ]
例（なにも わたさなければ これ）:
    python3 tools/make_icons.py app/images/story/nao-happy.png app/images/story/fumi-happy.png assets/logo-icon.png

assets/logo-icon.png は タイトル画面の ロゴ（app/images/story/logo.png）の「〜cat on escape〜」の 帯を
大きく した アイコン専用の ロゴ（アイコンは 小さいので 帯の 文字を タイトルの はばまで 広げて ある）。

必要なもの: pillow, numpy （pip install pillow numpy）
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

BASE = 1024                    # 下ごしらえの 大きさ（ここから 縮小する）
SKY_TOP = (255, 164, 64)       # 夕やけ（タイトルの 絵と おなじ 色あい）
SKY_BOTTOM = (255, 214, 102)
RIM = (23, 58, 34)             # ロゴの ふちと おなじ こい みどり
HEAD = 0.74                    # 立ち絵の うち つかう 上の わりあい（顔と えり もと）
SMALL = 64                     # これ いかの 大きさは 顔だけの 図がら
OUT = [
    ('app/images/icon-512.png', 512),
    ('app/images/icon-192.png', 192),
    ('app/images/icon-180.png', 180),
    ('app/images/icon-32.png', 32),
    ('assets/icon.png', 512),
    ('assets/favicon.png', 64),
]


def head_of(path):
    """立ち絵の 上の ほう（顔と かみ）を 切りだす"""
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im)[:, :, 3]
    ys, _ = np.nonzero(a > 20)
    top, bottom = ys.min(), ys.max()
    cut = top + int((bottom - top) * HEAD)
    cols = np.nonzero(a[top:cut].max(axis=0) > 20)[0]
    return im.crop((cols.min(), top, cols.max() + 1, cut))


def rounded(size, inset=0):
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([inset, inset, size - 1 - inset, size - 1 - inset],
                                           radius=int(size * 0.19), fill=255)
    return mask


def sky():
    grad = np.linspace(0, 1, BASE)[:, None]
    rgb = np.array(SKY_TOP) * (1 - grad) + np.array(SKY_BOTTOM) * grad        # (BASE, 3)
    img = np.repeat(rgb[:, None, :], BASE, axis=1).astype(np.uint8)
    return Image.fromarray(img, 'RGB').convert('RGBA')


def place_heads(canvas, nao, fumi, box_top, box_bottom, width_ratio):
    """ナオ（左・小がら）と フミ（右・大がら）の 顔を、下に そろえて ならべる"""
    fumi_h = box_bottom - box_top
    nao_h = int(fumi_h * 0.86)                  # ナオは すこし 小さく（背の ちがい）
    fumi = fumi.resize((int(fumi.width * fumi_h / fumi.height), fumi_h), Image.LANCZOS)
    nao = nao.resize((int(nao.width * nao_h / nao.height), nao_h), Image.LANCZOS)
    overlap = int(fumi.width * 0.16)            # すこし 重ねて なかよく
    total = nao.width + fumi.width - overlap
    scale = min(1.0, BASE * width_ratio / total)
    if scale < 1:
        fumi = fumi.resize((int(fumi.width * scale), int(fumi.height * scale)), Image.LANCZOS)
        nao = nao.resize((int(nao.width * scale), int(nao.height * scale)), Image.LANCZOS)
        overlap = int(overlap * scale)
        total = nao.width + fumi.width - overlap
    x0 = (BASE - total) // 2
    canvas.alpha_composite(fumi, (x0 + nao.width - overlap, box_bottom - fumi.height))
    canvas.alpha_composite(nao, (x0, box_bottom - nao.height))


def build(nao_path, fumi_path, logo_path, small):
    canvas = sky()
    nao, fumi = head_of(nao_path), head_of(fumi_path)
    if small:
        place_heads(canvas, nao, fumi, int(BASE * 0.06), BASE, 1.04)
    else:
        place_heads(canvas, nao, fumi, int(BASE * 0.34), BASE, 0.92)
        logo = Image.open(logo_path).convert('RGBA')
        w = int(BASE * 0.88)
        logo = logo.resize((w, int(logo.height * w / logo.width)), Image.LANCZOS)
        canvas.alpha_composite(logo, ((BASE - w) // 2, int(BASE * 0.07)))
    # ふちに こい みどりの わく（ロゴの ふちと おなじ 色）。わくの そとは 角丸で 切る
    ImageDraw.Draw(canvas).rounded_rectangle([0, 0, BASE - 1, BASE - 1], radius=int(BASE * 0.19),
                                             outline=RIM + (255,), width=int(BASE * 0.035))
    out = Image.new('RGBA', (BASE, BASE), (0, 0, 0, 0))
    out.paste(canvas, (0, 0), rounded(BASE))
    return out


def main():
    args = sys.argv[1:]
    nao = args[0] if len(args) > 0 else 'app/images/story/nao-happy.png'
    fumi = args[1] if len(args) > 1 else 'app/images/story/fumi-happy.png'
    logo = args[2] if len(args) > 2 else 'assets/logo-icon.png'
    for p in (nao, fumi, logo):
        if not os.path.exists(p):
            print(f'× {p} が ありません')
            return 1
    big = build(nao, fumi, logo, small=False)
    small = build(nao, fumi, logo, small=True)
    for path, size in OUT:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        (small if size <= SMALL else big).resize((size, size), Image.LANCZOS).save(path, optimize=True)
        print(f'○ {path} ({size}px)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
