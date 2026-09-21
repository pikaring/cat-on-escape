# 画像素材の生成プロンプト（Gemini 用）

> 猫の顔5種は生成ずみです（`app/images/face-*.png`）。描き直すときや、
> 種類を増やすときに、この手順をそのまま使えます。

このゲームで使う猫の絵は **「顔だけ」の正方形アイコン** です。
全身像だとマスの中で顔が小さくなってしまうため、顔がフレームいっぱいに入る構図にします。

出力した画像は `app/images/` に置き、`app/main.js` の `CAT_TYPES` にパスを書けば差し替わります。

## 作るもの

| ファイル | 中身 | サイズ |
| --- | --- | --- |
| `app/images/face-kuro.png` | くろねこの顔 | 512×512px（正方形） |
| `app/images/face-chashiro.png` | ちゃしろの顔 | 〃 |
| `app/images/face-kijitora.png` | キジトラの顔 | 〃 |
| `app/images/face-hachiware.png` | ハチワレの顔 | 〃 |
| `app/images/face-mike.png` | みけねこの顔 | 〃 |
| `app/images/icon-512.png` ほか | アプリのアイコン | 512 / 192 / 180 / 32px |

5匹は **同じ画風・同じ顔の大きさ・同じ線の太さ** で揃えるのが肝心です。
盤面に並んだときに毛色のちがいだけで見分けられるようにします。

---

## 1. 1匹目（くろねこ）をつくる

まずこの1枚を納得いくまで作り込みます。ここで決まった画風が5匹ぶんの基準になります。

```
かわいい猫の「顔だけ」のアイコンを1枚つくってください。パズルゲームの駒に使います。

【構図（いちばん大事）】
・正方形の画像。猫の顔が正面をまっすぐ向いている
・耳の先から下あごまでが画像の高さの85%を占めるくらい、顔を大きく入れる
・首から下（体・前足・しっぽ）は描かない。顔と耳だけ
・顔は画像の中央。まわりの余白は5〜10%程度
・背景は白一色のベタ塗り（グラデーション・模様・市松模様は使わない）
・影は落とさない。枠線・文字・ロゴ・透かしは一切入れない

【画風】
・フラットなベタ塗りのアニメ・絵本調。影やグラデーションは最小限
・輪郭線はこい茶色の太い線。小さく表示してもはっきり見える太さ
・目は大きく黒目がち、にっこりした やさしい表情
・高コントラストで、遠目でもシルエットと毛色がすぐ分かるデザイン
・写実的ではない、かわいらしいマスコット的なデザイン
・ひげは短く3本ずつ、線は細めでよい

【この猫の毛色】
・くろねこ：全身まっ黒の毛。黒くつぶれないよう、輪郭より内側はすこし明るい墨色にする
・目は黄色みのある大きな瞳、鼻と口元はうすいグレー

【サイズ】
・1024×1024ピクセルの正方形
```

## 2. 残りの4匹を、1匹目にそろえて出す

**できあがった1枚目を添付したうえで**、次の文を毛色だけ変えて4回送ります。
文章だけで作り直すより、画像を見せて「これと同じ」と伝えるほうが画風がそろいます。

```
添付した猫の顔アイコンと、まったく同じ画風・同じ構図・同じ顔の大きさ・同じ線の太さで、
毛色だけを変えた猫の顔を1枚つくってください。
輪郭線の色と太さ、目の形と大きさ、鼻と口の描きかた、ひげの本数、
顔がフレームに占める割合、白一色の背景は、添付画像とそろえてください。

【毛色】
◯◯
```

`◯◯` にそれぞれを入れます。

| ファイル名 | 毛色・表情・向きの指定 |
| --- | --- |
| `face-chashiro.png` | ちゃしろ：クリームホワイトの地に、オレンジ茶色の模様。頭の上と耳、目のまわりにオレンジ茶色が入り、口元から下あごは白。**顔をすこし右にかたむけ、右目をつぶってウインクし、口を開けてにっこり笑う** |
| `face-kijitora.png` | キジトラ：茶色がかった灰色の地に、こげ茶色の細いしま模様。おでこに縦じまが3本、ほおにも短いしま。口元はうすいクリーム色。**顔をすこし左に向け、ねむそうな半目で、大きなあくびをしている** |
| `face-hachiware.png` | ハチワレ：おでこから鼻すじにかけて白い線が通り、その左右（頭の両側）は黒。口元とあごは白。**正面のまま首を右にかしげ、目をまんまるに見ひらいて びっくりした顔** |
| `face-mike.png` | みけねこ：白い地に、黒とオレンジのぶちが左右で非対称に入る。右耳のまわりは黒、左耳のまわりはオレンジ茶色。**ぺろっと舌を出して、左耳の先が前に折れている** |

1匹目の くろねこ も、描き分けに合わせて **「キリッと目を細めた自信顔、両耳をぴんと立てて正面」** で作り直すと5匹がそろいます。

### 描き分けの考えかた

小さいマスに並ぶので、**毛色だけでは見分けがつきません**。
毛色・表情・顔の向き・耳の形の4つを、猫ごとに変えて「遠目のシルエット」で区別できるようにします。

| 猫 | 毛色 | 表情 | 向き・耳 |
| --- | --- | --- | --- |
| くろねこ | まっ黒 | 目を細めた自信顔 | 正面・両耳ぴん |
| ちゃしろ | オレンジ＋白 | ウインク＋笑い | すこし右向き |
| キジトラ | 茶灰＋しま | あくび・半目 | すこし左向き |
| ハチワレ | 黒＋白い鼻すじ | びっくり顔 | 首を右にかしげる |
| みけねこ | 白＋黒＋オレンジ | 舌を出す | 左耳が折れている |

ただし **顔の大きさ・線の太さ・フレームの占有率は5匹とも同じ**にしてください。
そこがそろっていないと、盤に並べたときガタついて見えます。

## 3. うまくいかないときの言い直し

出たものに合わせて、次の一文を足して出し直します。

- 顔が小さい → 「顔をもっと大きく、耳の先が画像の上から5%、あごが下から10%の位置に来るくらいまで拡大してください」
- 体が入ってしまう → 「首から下は描かないでください。顔と耳だけのアイコンです」
- 斜めを向く → 「顔は正面をまっすぐ向けてください。真正面からの構図です」
- 線が細くて見えない → 「輪郭線をもっと太くしてください。64ピクセルに縮小しても形が分かる太さです」
- 背景が白でない → 「背景は純白 #FFFFFF の一色にしてください。影も模様も入れないでください」
- 5匹の大きさがバラバラ → 添付画像といっしょに「顔の大きさを添付画像と1ピクセル単位でそろえてください」

## 3.5 どうぐの絵 4種（`app/images/tool-*.png`）

4匹以上そろえると手に入る どうぐ です。いまは絵文字（🪶🧶🔔）で表示しています。
絵ができたら `app/main.js` の `ITEMS` の `image` にパスを書くと差し替わります。

ファイル名は `tool-row.png`（よこ一れつ）/ `tool-col.png`（たて一れつ）/
`tool-bomb.png`（まわり3×3）/ `tool-cross.png`（ななめクロス）。
`tool-col.png` は `tool-row.png` を90度回して使ってもかまいません（CSSで回しています）。

```
猫のゲームで使う「どうぐ」のアイコンを1枚つくってください。

【画風（猫のイラストと統一）】
・フラットなベタ塗りのアニメ・絵本調、影やグラデーションは最小限
・輪郭線はこい茶色の太い線。小さく表示してもはっきり見える太さ
・正方形、背景は白一色のベタ塗り。影・文字・枠線は入れない
・512×512ピクセル

【どうぐ】
◯◯
```

| ファイル名 | `◯◯` に入れる指定 | はたらき |
| --- | --- | --- |
| `tool-row.png` | ねこじゃらし。木の棒の先に黄色い羽根。棒が**横向き**で、羽根が右にある | よこ一れつを にがす |
| `tool-col.png` | ねこじゃらし。木の棒の先に黄色い羽根。棒が**縦向き**で、羽根が上にある | たて一れつを にがす |
| `tool-bomb.png` | オレンジ色の毛糸のボール。毛糸の端が少し垂れている | まわり3×3を にがす |
| `tool-cross.png` | 金色の首輪の鈴。まんなかに横のすじが1本 | ななめクロスを にがす |

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

## 5. 出力したあとの手直し

**`tools/make_face.py` に通すだけ**です。背景の除去・切りつめ・正方形化・512pxへの縮小を
まとめてやります（目のハイライトのような、囲まれた白は残します）。

```
pip install pillow numpy          # 最初の1回だけ
python3 tools/make_face.py app/images kuro.jpg:face-kuro chashiro.jpg:face-chashiro
```

- 入力は `入力ファイル:出力名` の形。まとめて何枚でも渡せます。
- 白く抜けきらない／猫まで削れるときは、スクリプト冒頭の `TOLERANCE`（既定26）を上下させます。
- 顔の大きさを変えたいときは `FILL`（既定0.94。1枚のなかで顔が占める割合）を調整します。

そのあと `app/main.js` の `CAT_TYPES` にパスを書きます。

```js
const CAT_TYPES = [
  { key: 'kuro',      name: 'くろねこ', image: 'images/face-kuro.png' },
  { key: 'chashiro',  name: 'ちゃしろ', image: 'images/face-chashiro.png' },
  { key: 'kijitora',  name: 'キジトラ', image: 'images/face-kijitora.png' },
  { key: 'hachiware', name: 'ハチワレ', image: 'images/face-hachiware.png' },
  { key: 'mike',      name: 'みけねこ', image: 'images/face-mike.png' },
];
```

画像は読み込めたときだけ使われるので、**1種類ずつ順に差し替えて確認**できます。
パスを間違えても、その種類だけ暫定の丸のままで遊べます。

## 6. 英語版プロンプト（日本語でうまく出ないとき）

```
A single square icon of a cute cat's FACE ONLY, for a puzzle game tile.

Composition (most important):
- Square image, the cat faces the viewer straight on
- The face fills the frame: from ear tips to chin spans about 85% of the image height
- Do NOT draw the body, paws or tail. Head and ears only
- Face centered, 5-10% margin around it
- Plain pure white background (#FFFFFF), no gradient, no checkerboard, no pattern
- No drop shadow, no border, no text, no logo, no watermark

Style:
- Flat vector cartoon, children's picture-book style, minimal shading
- Thick dark-brown outline, clearly readable when scaled down to 64px
- Large expressive black eyes, gentle smiling expression
- High contrast, simple readable silhouette, kawaii mascot design
- Three short thin whiskers on each side

Fur color:
- Solid black cat; keep the inside slightly lighter than the outline so it does not read as a flat blob
- Yellow-toned eyes, light grey nose and muzzle

Size: 1024x1024 pixels.
```

2匹目以降は、1匹目の画像を添付して次の文を送ります。

```
Using the attached cat face icon as the reference, generate the SAME character style,
SAME composition, SAME face size and SAME line weight, changing ONLY the fur pattern to:
<fur description>
Keep the outline color and thickness, eye shape and size, nose and muzzle,
number of whiskers, the framing, and the plain white background identical to the reference.
```

## 7. 3×3のスプライトシートを使う場合

前作と同じ 3×3（9ポーズ）のシートを使いたいときは、`CAT_TYPES` に `sheet: true` を足すと
9マスのうち左上のコマだけを表示します。プロンプトは前作の `docs/cat-sprite-prompt.md` がそのまま使えます。

```js
{ key: 'kuro', name: 'くろねこ', image: 'images/cat-kuro.png', sheet: true }
```
