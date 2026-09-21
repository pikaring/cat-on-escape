# 画像素材の生成プロンプト（Gemini 用）

> 猫の顔6種と どうぐ4種は生成ずみです（`app/images/`）。描き直すときに、この手順をそのまま使えます。

このゲームで使う猫の絵は **「顔だけ」の正方形アイコン** です。
全身像だとマスの中で顔が小さくなってしまうため、顔がフレームいっぱいに入る構図にします。

**1匹ずつ作るより、5匹を1枚のグリッドにまとめて作らせるほうが画風がそろいます。**
同じ画像の中なら、線の太さ・顔の大きさ・塗りの調子が自然に統一されるためです。
切り分けは `tools/make_face.py` が自動でやります。

## 作るもの

| ファイル | 中身 | サイズ |
| --- | --- | --- |
| `app/images/face-kuro.png` ほか6枚 | 猫の顔（くろ・ちゃしろ・キジトラ・ハチワレ・みけ・しろ） | 512×512px |
| `app/images/tool-row.png` ほか4枚 | どうぐ（ねこじゃらし よこ／たて・けいとだま・すず） | 512×512px |
| `app/images/icon-*.png` | アプリのアイコン | 512 / 192 / 180 / 32px |

---

## 1. 猫の顔5種を、1枚のグリッドで作る

```
かわいい猫の「顔だけ」のアイコンを5種類、3列×2行のグリッドに並べた1枚の画像として
つくってください。パズルゲームの駒に使います。

【並べかた（厳守）】
・3列×2行の6マス。左上から右へ 1匹ずつ、6マスすべてに置く
・順番は 1:くろねこ 2:ちゃしろ 3:キジトラ 4:ハチワレ 5:しろねこ 6:みけねこ
・マスとマスのあいだは、はっきり あけて（画像の幅の5%以上）、猫どうしが くっつかない
・グリッドの枠線・区切り線・番号・文字・ロゴは一切描かない
・背景は白一色のベタ塗り（グラデーション・模様・市松模様は使わない）

【1匹ぶんの構図（いちばん大事）】
・猫の顔が正面をまっすぐ向いている（向きの指定がある猫だけ、その向きにする）
・耳の先から下あごまでが、そのマスの高さの85%を占めるくらい大きく入れる
・首から下（体・前足・しっぽ）は描かない。顔と耳だけ
・5匹とも顔の大きさ・輪郭線の太さ・目の大きさをそろえる（毛色と表情だけを変える）
・影は落とさない

【画風】
・フラットなベタ塗りのアニメ・絵本調。影やグラデーションは最小限
・輪郭線はこい茶色の太い線。小さく表示してもはっきり見える太さ
・目は大きく黒目がち。高コントラストで、遠目でも毛色のちがいがすぐ分かる
・写実的ではない、かわいらしいマスコット的なデザイン
・ひげは短く3本ずつ、線は細めでよい

【5匹の描き分け】（毛色だけでなく、表情・向き・耳でも見分けられるようにする）
1. くろねこ：まっ黒の毛（輪郭より内側はすこし明るい墨色）。目を細めた自信顔。正面、両耳ぴん
2. ちゃしろ：クリームホワイトにオレンジ茶色の模様、口元は白。右目をつぶってウインクし、
   口を開けて笑う。顔をすこし右にかたむける
3. キジトラ：茶色がかった灰色にこげ茶の細いしま（おでこに縦じま3本）、口元はクリーム色。
   ねむそうな半目で大きなあくび。顔をすこし左に向ける
4. ハチワレ：おでこから鼻すじが白く、頭の両側は黒、口元とあごは白。目をまんまるに見ひらいた
   びっくり顔。正面のまま首を右にかしげる
5. みけねこ：白地に黒とオレンジのぶちが左右非対称（右耳まわりは黒、左耳まわりはオレンジ）。
   ぺろっと舌を出し、左耳の先が前に折れている
6. しろねこ：白い顔で、片耳がオレンジ、もう片耳がグレー。口を閉じた おだやかな ほほえみ。正面

【サイズ】
・1536×1024ピクセル（1マスが正方形になる大きさ）
```

### なぜグリッドか

- 1枚の中で描かれるので、**線の太さ・顔の大きさ・塗りの調子がそろう**
- 5回に分けて作ると、同じ指示でも別人の絵のようにばらつく
- 切り出しは自動（次章）なので、手間は増えません

### うまくいかないときの言い直し

- 猫どうしがくっつく → 「マスとマスのあいだを もっと広くあけてください。猫どうしが 触れないように」
- 顔が小さい → 「それぞれのマスで、耳の先が上から5%、あごが下から10%に来るくらいまで顔を大きく」
- 体が入る → 「首から下は描かないでください。顔と耳だけです」
- 大きさがバラバラ → 「5匹の顔の大きさと輪郭線の太さを、1ピクセル単位でそろえてください」
- 背景が白でない → 「背景は純白 #FFFFFF の一色に。影も模様も入れないでください」

---

## 2. 切り出して、ゲームに入れる

```
pip install pillow numpy                 # 最初の1回だけ

# グリッド1枚を、左上から右へ の順に5枚へ切り分ける
python3 tools/make_face.py app/images grid.jpg:face-kuro,face-chashiro,face-kijitora,face-hachiware,face-shiro,face-mike
```

`tools/make_face.py` がやること:

1. 白ベタ（や市松模様）の背景を、外周から判定して透過にする（目のハイライトなど囲まれた白は残す）
2. すきまを見つけて1匹ずつに切り分ける（ひげが顔から離れていても、同じマスのものは一緒に切り出す）
3. 顔のまわりを切りつめ、正方形の中央にそろえて512×512pxのPNGにする

- 3列×2行でも、2列×3行でも、横一列でも自動で判定します。名前は**左上から右へ**の順に並べてください。
- 1匹ずつ作った場合は、これまでどおり `python3 tools/make_face.py app/images kuro.jpg:face-kuro` で1枚ずつ渡せます。
- 分けられないと言われたら、マスのすきまを広くして作り直すのが早いです。
- 白が抜けきらない／猫まで削れるときは、スクリプト冒頭の `TOLERANCE`（既定26）を上下させます。
- 絵のまわりに**かざり枠**が描かれてしまったときは、枠の内側だけを自動で切り出します（毛糸のボールがそうでした）。
- 顔の大きさを変えたいときは `FILL`（既定0.94。1枚のなかで顔が占める割合）を調整します。

差し替え先は `app/main.js` 冒頭の `CAT_TYPES` です。

```js
const CAT_TYPES = [
  { key: 'kuro',      name: 'くろねこ', image: 'images/face-kuro.png' },
  { key: 'chashiro',  name: 'ちゃしろ', image: 'images/face-chashiro.png' },
  { key: 'kijitora',  name: 'キジトラ', image: 'images/face-kijitora.png' },
  { key: 'hachiware', name: 'ハチワレ', image: 'images/face-hachiware.png' },
  { key: 'mike',      name: 'みけねこ', image: 'images/face-mike.png' },
  { key: 'shiro',     name: 'しろねこ', image: 'images/face-shiro.png' },
];
```

画像は読み込めたときだけ使われるので、**1種類ずつ順に差し替えて確認**できます。
パスを間違えても、その種類だけ暫定の丸のままで遊べます。

---

## 3. どうぐ4種（`app/images/tool-*.png`）

4匹以上そろえると手に入る どうぐ です。**生成ずみ**（`app/images/tool-*.png`）。
作り直すときは、**2列×2行のグリッドで1枚**にまとめると画風がそろいます。

```
猫のゲームで使う「どうぐ」のアイコンを4種類、2列×2行のグリッドに並べた1枚の画像として
つくってください。

【並べかた（厳守）】
・2列×2行の4マス。左上から右へ、1:ねこじゃらし（横向き） 2:ねこじゃらし（縦向き）
  3:毛糸のボール 4:首輪の鈴
・マスとマスのあいだは、はっきり あける（画像の幅の5%以上）
・グリッドの枠線・区切り線・文字は描かない。背景は白一色のベタ塗り

【画風（猫のイラストと統一）】
・フラットなベタ塗りのアニメ・絵本調、影やグラデーションは最小限
・輪郭線はこい茶色の太い線。小さく表示してもはっきり見える太さ
・4つとも同じ大きさ・同じ線の太さ。写実的でない、かわいい形

【4つのどうぐ】
1. ねこじゃらし（横向き）：木の棒の先に黄色い羽根。棒が横に寝ていて、羽根が右にある
2. ねこじゃらし（縦向き）：同じねこじゃらしを、棒が縦で羽根が上に来る向きにしたもの
3. 毛糸のボール：オレンジ色。毛糸の端が少し垂れている
4. 首輪の鈴：金色で、まんなかに横のすじが1本

【サイズ】
・1024×1024ピクセル
```

切り出しは猫と同じです。

```
python3 tools/make_face.py app/images tools.jpg:tool-row,tool-col,tool-bomb,tool-cross
```

`app/main.js` の `ITEMS` の `image` にパスを書くと、絵文字から差し替わります。

```js
const ITEMS = {
  row:   { name: 'ねこじゃらし（よこ）', icon: '🪶', what: 'よこ一れつ',  image: 'images/tool-row.png' },
  col:   { name: 'ねこじゃらし（たて）', icon: '🪶', what: 'たて一れつ',  image: 'images/tool-col.png' },
  bomb:  { name: 'けいとだま',           icon: '🧶', what: 'まわり3×3',  image: 'images/tool-bomb.png' },
  cross: { name: 'すず',                 icon: '🔔', what: 'ななめクロス', image: 'images/tool-cross.png' },
};
```

---

## 4. アイコン（あとまわしで可）

いまのアイコンは `assets/icon.svg` から書き出した仮のものです。猫の絵ができたら同じ画風で作り直します。

```
スマートフォンのアプリアイコンを1枚つくってください。

・正方形。背景は濃い緑（#2f5d3a）のベタ塗り
・中央に、添付した猫の顔（同じ画風・同じ線の太さ）を大きく配置する
・猫の左側に、右へ走っている勢いを表す黄色（#ffe36e）の短い横線を3本入れる
・文字・ロゴ・枠線は入れない
・1024×1024ピクセル
```

必要なサイズは `icon-32.png` / `icon-180.png` / `icon-192.png` / `icon-512.png`、
紹介ページ用に `assets/icon.png`（512px）と `assets/favicon.png`（64px）。

---

## 5. 英語版プロンプト（日本語でうまく出ないとき）

```
A single image containing a 3x2 grid of 5 cute cat FACE icons for a puzzle game.

Layout (strict):
- 3 columns x 2 rows; fill left-to-right, top row 3 cats, second row 2 cats, bottom-right cell EMPTY
- Order: 1 black cat, 2 orange-and-white cat, 3 grey-brown tabby, 4 tuxedo cat with white blaze, 5 calico
- Leave a clear gap between cells (at least 5% of the image width); cats must not touch
- No grid lines, no numbers, no text, no logo
- Plain pure white background (#FFFFFF), no gradient, no checkerboard

Each cell:
- Face only, seen from the front (unless a specific head tilt is listed below)
- From ear tips to chin spans about 85% of the cell height
- Do NOT draw the body, paws or tail
- All five faces share the same size, outline thickness and eye size

Style: flat vector cartoon, children's picture-book style, thick dark-brown outline readable at 64px,
large expressive eyes, minimal shading, kawaii mascot design, three short whiskers per side.

The five cats (tell them apart by expression and head tilt, not only by fur):
1. Black cat - solid black, slightly lighter inside the outline; confident narrowed eyes; facing front, ears up
2. Orange-and-white - cream base with orange-brown patches, white muzzle; winking right eye, open smiling mouth; head tilted slightly right
3. Grey-brown tabby - dark brown stripes, three forehead stripes, cream muzzle; sleepy half-closed eyes, big yawn; facing slightly left
4. Tuxedo - white blaze from forehead down the nose, black on both sides, white muzzle and chin; wide round surprised eyes; head tilted right
5. Calico - white base with asymmetric black and orange patches (black around the right ear, orange around the left); tongue out, left ear folded forward

Size: 1536x1024 pixels.
```
