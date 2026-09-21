# cat-on-escape（ねこを にがせ / Cat on Escape）

ねこの顔をスライドして、タテかヨコに **3匹** そろえる落ちものパズルです。
そろった猫は行列をつくって **画面の右へ走って逃げていきます**。猫を逃がすのが目的のゲームです。
**4匹以上**そろえると、その場に「どうぐ」（ねこじゃらし・けいとだま・すず）が残り、まとめて逃がせます。

バックエンドなし（HTML / CSS / Vanilla JavaScript のみ）。最高得点と設定は LocalStorage に保存します。
見た目と操作感は前作 [tap-on-neko（ねこの ともだち）](https://github.com/pikaring/tap-on-neko) に合わせてあります。

**紹介ページ → https://pikaring.github.io/cat-on-escape/**
**あそぶ → https://pikaring.github.io/cat-on-escape/app/**

## ファイル

紹介ページ（`/`）とゲーム本体（`/app/`）に分かれています。

| ファイル | 役割 |
| --- | --- |
| `index.html` | 紹介ページ。ほかのツールと同じデザイン（`assets/site.css`） |
| `assets/site.css` | 紹介ページの見た目。アクセント色はみどり `#3f8f57` |
| `assets/icon.svg` | アイコンの元データ（仮。猫の絵ができたら差し替え） |
| `assets/icon.png` / `assets/favicon.png` | 紹介ページ・OG画像用 |
| `app/index.html` | ゲームの画面（ヘッダー／ばん／おおきなボタン／モーダル） |
| `app/style.css` | 大きなUI・高コントラスト・アニメーション |
| `app/main.js` | ゲームロジック・そろい判定・落下・連鎖・LocalStorage |
| `app/manifest.json` | ホーム画面に追加したときの設定（PWA） |
| `app/images/face-*.png` | 猫の顔の画像6種（くろねこ・ちゃしろ・キジトラ・ハチワレ・みけねこ・しろねこ） |
| `app/images/tool-*.png` | どうぐの画像4種（ねこじゃらし よこ／たて・けいとだま・すず） |
| `tools/make_face.py` | 生成AIが出した顔の画像を、背景除去＋グリッドの切り分け＋正方形＋512pxに整える |
| `docs/asset-prompts.md` | 猫の顔を画像生成AIで作るときのプロンプト |

## 遊びかた

- 隣り合う猫をドラッグ、またはタップ2回で入れかえます。
- タテかヨコに同じ猫が **3匹** そろうと、猫たちが画面の右へ走って逃げます。
- **4匹以上**そろえると、その場に「どうぐ」が残ります（光った猫が目印）。

| そろえかた | 手に入るどうぐ | はたらき |
| --- | --- | --- |
| ヨコに4匹 | ねこじゃらし（よこ） | よこ一列を逃がす |
| タテに4匹 | ねこじゃらし（たて） | たて一列を逃がす |
| 5匹以上 | けいとだま | まわり3×3を逃がす |
| タテとヨコが交わる（L字・T字） | すず | ななめクロスを逃がす |

- どうぐは、**となりの猫が逃げると一緒にはたらきます**。どうぐが別のどうぐを巻き込むと連鎖します。
- 空いたマスには上から新しい猫が降ってきます。落ちてきた猫がまたそろうと連鎖になり、得点が倍々になります。
- そろわない入れかえは元に戻ります（手数は増えません）。
- 入れかえる手がなくなったら、猫たちが自動で並びなおします。
- 制限時間もゲームオーバーもありません。

得点は `逃げた猫の数 × 10 ＋ 5匹以上そろった分のボーナス` に連鎖数を掛けた値です。
保存キーは `catonescape.best`（最高得点）と `catonescape.kinds`（猫の種類数）。

## 猫の絵の差し替え

5種類とも差し替えずみです（Gemini で生成 → `tools/make_face.py` で背景除去・512px化）。
描き直すときも手順は同じです。

1. 生成した画像を `tools/make_face.py` に通す（背景除去・切り出し・正方形・512px化）。
   5匹を1枚のグリッドで作らせると画風がそろいます。切り分けは自動です。
   ```
   pip install pillow numpy
   # 3列×2行のグリッド1枚を、左上から右へ の順に5枚へ切り分ける
   python3 tools/make_face.py app/images grid.jpg:face-kuro,face-chashiro,face-kijitora,face-hachiware,face-mike
   # 1匹ずつの画像でも これまでどおり
   python3 tools/make_face.py app/images chashiro.jpg:face-chashiro
   ```
2. `app/main.js` 冒頭の `CAT_TYPES` の `image` にパスを書く。

```js
const CAT_TYPES = [
  { key: 'kuro',      name: 'くろねこ', image: 'images/face-kuro.png' },
  { key: 'chashiro',  name: 'ちゃしろ', image: 'images/face-chashiro.png' },
  { key: 'kijitora',  name: 'キジトラ', image: 'images/face-kijitora.png' },
  { key: 'hachiware', name: 'ハチワレ', image: 'images/face-hachiware.png' },
  { key: 'mike',      name: 'みけねこ', image: 'images/face-mike.png' },
];
```

- 画像は読み込みに成功したときだけ使われます。パスを間違えても、その種類だけ暫定の丸で遊べます。
- 1種類ずつ順に差し替えても崩れません。
- 3×3のスプライトシート（前作と同じ形式）を使うときは `sheet: true` を足すと左上のコマだけを表示します。
- どうぐの絵も同じ要領で、`ITEMS` の `image` にパスを書けば絵文字から差し替わります。
- 画像生成AI（Gemini）用のプロンプトは `docs/asset-prompts.md` にあります。5匹の画風をそろえる手順つき。

## 調整できるところ

`app/main.js` の冒頭にまとまっています。

| 定数 | 既定値 | 意味 |
| --- | --- | --- |
| `COLS` / `ROWS` | 7 / 8 | 盤面の列数・行数 |
| `MIN_MATCH` | 3 | 何匹そろったら逃げるか |
| `ITEM_MIN` | 4 | 何匹そろったら どうぐが残るか |
| `ITEM_TRIGGER` | `'adjacent'` | どうぐが働くきっかけ。`'adjacent'`＝となりの猫が逃げたら／`'included'`＝どうぐ自身がそろったら |
| `SWAP_MS` / `FALL_MS` | 170 / 260 | 入れかえ・落下のアニメ時間（ms） |
| `RUN_MS` / `RUN_STAGGER` / `ESCAPE_HOLD` | 900 / 55 / 230 | 右へ走る時間・行列のずれ・盤を詰めはじめるまで（ms） |

`SWAP_MS` / `FALL_MS` / `RUN_MS` は `app/style.css` の `--swap-ms` / `--fall-ms` / `--run-ms` と対になっているので、変えるときは両方そろえてください。

## ライセンス

MIT License
