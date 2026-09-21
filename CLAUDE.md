# このリポジトリの きまり

pikaring の ツール群（tap-on-kotoba / tap-on-neko / reach-on-sanma / all-in-texas /
ride-on-qc / eat-on-gpx / rock-on-mj / cat-on-escape）は、**見た目も 作りも そろえる**方針です。
新しいページや 節を つくるときは、**先にある ページを 見て 同じ形に 合わせてください**。
迷ったら tap-on-neko と reach-on-sanma が 基準です。

## 紹介ページ（`/index.html`）に かならず 入れるもの

| もの | 形 |
| --- | --- |
| デザイン | `assets/site.css`（4サイト共通。アクセント色だけ 変える） |
| 節の ならび | `hero` → `specs` → `goods`（本・グッズ）→ 中身の節 → `faq` → `cta` → `family` → `footer` |
| ポータルへの リンク | `family` の節に 1つだけ（`https://pikaring.github.io/portal/`） |
| アクセスカウンター | フッターに `<span class="counter">累計アクセス <b id="counter-value">―</b> 回</span>` と GAS を 呼ぶ script |
| アソシエイトの 表示 | フッターに `<span class="disclosure">…</span>` |
| フッター | `GitHub` / `README` / `MIT License · pikaring · 依存ライブラリなし` |
| OG | `og:title` / `og:description` / `og:url` / `og:image`（`assets/icon.png`） |

## 本・グッズ（Amazonアソシエイト）

- カードは `<div class="good" data-asin="ASIN">`、リンクは `https://www.amazon.co.jp/dp/ASIN?tag=redcomet-22`
  （`target="_blank" rel="sponsored noopener"`、文言は「Amazonで見る ↗」）
- 表紙画像と価格は `assets/goods.json` から 後づけ。`tools/fetch_goods.py` が Creators API で 取り、
  `.github/workflows/goods.yml` が 毎日 3:00 JST に 更新する
- Secrets：`CREATORS_CLIENT_ID` / `CREATORS_CLIENT_SECRET`（未登録でも ワークフローは 失敗しない）
- ASIN が わからない ときは 当てずっぽうで 書かない。Creators API の `searchItems` で 実在を 確かめる
- 紙の本が プレミアム価格の ときは Kindle版を 選ぶ

## アプリ（`/app/`）

- 前作 tap-on-neko の 配色・大きなボタン・モーダル・ひらがなの 分かち書きに そろえる
- 画像は 読みこめた ときだけ 使い、だめなら 代わりの 表示で 遊べるようにする
- アイコンは `tools/make_icons.py` が ゲームの 猫の顔から つくる

## GitHub Pages

Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)`
