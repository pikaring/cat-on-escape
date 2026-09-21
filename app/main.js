/* ねこを にがせ（Cat on Escape）
 *
 * ルール
 *   - となりあう ねこの かおを ドラッグ（または タップ2かい）で いれかえる
 *   - たてか よこに おなじ ねこが MIN_MATCH ひき そろうと、画面の 右へ はしって にげる
 *   - ITEM_MIN ひき いじょう そろえると、その場に「どうぐ」が のこる
 *       よこに4  → ねこじゃらし（よこ）：よこ一れつを にがす
 *       たてに4  → ねこじゃらし（たて）：たて一れつを にがす
 *       5ひき以上 → けいとだま：まわり3×3を にがす
 *       たてよこが交わる → すず：ななめクロスを にがす
 *   - どうぐは、となりの ねこが にげると いっしょに はたらく（どうぐ同士で つながる）
 *   - あいた ところには 上から あたらしい ねこが ふってくる（れんさ あり）
 *
 * ねこの 絵の さしかえ
 *   CAT_TYPES の image に 画像の パスを いれるだけ。よみこめた ときだけ 画像に なり、
 *   よみこめない ときは style.css の .cat__body--<key>（ざんていの くろ丸・しろ丸）の ままで あそべる。
 *   絵は「顔だけ」の 正方形。3×3の スプライトシートを つかう ときは sheet: true を つける。
 */
(() => {
  'use strict';

  const COLS = 7;
  const ROWS = 8;
  const MIN_MATCH = 3;      // そろうと にげる かず
  const ITEM_MIN = 4;       // どうぐが のこる そろい かず
  // どうぐが はたらく きっかけ。'adjacent' = となりの ねこが にげたら／'included' = どうぐ自身が そろったら
  const ITEM_TRIGGER = 'adjacent';

  const SWAP_MS = 170;      // style.css の --swap-ms と そろえる
  const FALL_MS = 260;      // style.css の --fall-ms と そろえる
  const RUN_MS = 900;       // style.css の --run-ms と そろえる（右へ はしりぬける ながさ）
  const RUN_STAGGER = 45;   // ぎょうれつに なって はしりだす ずれ
  const BLAST_MS = 420;     // どうぐが はたらく ときの ひかり（style.css の --blast-ms）
  const ESCAPE_HOLD = 230;  // はしりだしてから ばんを つめるまで

  const BEST_KEY = 'catonescape.best';
  const KIND_KEY = 'catonescape.kinds';

  /** ねこの しゅるい。image に 'images/face-kuro.png' のような パスを いれると 画像に なる。 */
  const CAT_TYPES = [
    { key: 'kuro',      name: 'くろねこ', image: 'images/face-kuro.png' },
    { key: 'chashiro',  name: 'ちゃしろ', image: 'images/face-chashiro.png' },
    { key: 'kijitora',  name: 'キジトラ', image: 'images/face-kijitora.png' },
    { key: 'hachiware', name: 'ハチワレ', image: 'images/face-hachiware.png' },
    { key: 'mike',      name: 'みけねこ', image: 'images/face-mike.png' },
    { key: 'shiro',     name: 'しろねこ', image: 'images/face-shiro.png' },
  ];

  /** どうぐ。icon は 絵が できるまでの ざんてい（image に パスを いれると 画像に なる）。 */
  const ITEMS = {
    row:   { name: 'ねこじゃらし（よこ）', icon: '🪶', what: 'よこ一れつ',  image: 'images/tool-row.png' },
    col:   { name: 'ねこじゃらし（たて）', icon: '🪶', what: 'たて一れつ',  image: 'images/tool-col.png' },
    bomb:  { name: 'けいとだま',           icon: '🧶', what: 'まわり3×3',  image: 'images/tool-bomb.png' },
    cross: { name: 'すず',                 icon: '🔔', what: 'ななめクロス', image: 'images/tool-cross.png' },
  };

  const boardEl    = document.getElementById('board');
  const areaEl     = document.getElementById('boardArea');
  const runwayEl   = document.getElementById('runway');
  const scoreEl    = document.getElementById('score');
  const bestEl     = document.getElementById('best');
  const movesEl    = document.getElementById('moves');
  const messageEl  = document.getElementById('message');
  const bignewsEl  = document.getElementById('bignews');
  const bignewsTxt = document.getElementById('bignewsText');
  const kindSubEl  = document.getElementById('kindSub');
  const kindModal  = document.getElementById('kindModal');
  const kindChoice = document.getElementById('kindChoices');
  const resetBtn   = document.getElementById('btnReset');
  const kindBtn    = document.getElementById('btnKind');
  const closeBtn   = document.getElementById('btnCloseKind');

  /** grid[r][c] = tile | null */
  let grid = [];
  let cell = 56;
  let typeCount = 4;
  let score = 0;
  let moves = 0;
  let best = 0;
  let busy = true;
  let selected = null;
  let uid = 0;
  let bignewsTimer = 0;
  let lastSwap = [];        // 直前に いれかえた 2マス（どうぐを どこに のこすか の めやす）

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (n) => Math.floor(Math.random() * n);
  const key = (r, c) => r * COLS + c;
  const rowOf = (k) => Math.floor(k / COLS);
  const colOf = (k) => k % COLS;
  const tileAtKey = (k) => grid[rowOf(k)][colOf(k)];

  /* ---------------- 画像の よみこみ（よみこめない ときは 丸の まま） ---------------- */

  function loadImages() {
    CAT_TYPES.forEach((def, type) => {
      def.ready = false;
      if (!def.image) return;
      const img = new Image();
      img.onload = () => {
        def.ready = true;
        eachTile((tile) => { if (tile.type === type) paint(tile); });
      };
      img.src = def.image;
    });
    Object.values(ITEMS).forEach((def) => {
      def.ready = false;
      if (!def.image) return;
      const img = new Image();
      img.onload = () => {
        def.ready = true;
        eachTile((tile) => { if (tile.item) paint(tile); });
      };
      img.src = def.image;
    });
  }

  /* ---------------- レイアウト ---------------- */

  function layout() {
    const availW = (areaEl.clientWidth || 360) - 20;
    const availH = (areaEl.clientHeight || 420) - 20;
    cell = Math.max(30, Math.min(78, Math.floor(Math.min(availW / COLS, availH / ROWS))));

    boardEl.style.setProperty('--cell', cell + 'px');
    boardEl.style.width = COLS * cell + 'px';
    boardEl.style.height = ROWS * cell + 'px';

    eachTile((tile) => moveTo(tile, tile.r, tile.c, true));
  }

  function eachTile(fn) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r] && grid[r][c]) fn(grid[r][c]);
      }
    }
  }

  /* ---------------- ねこ（タイル） ---------------- */

  function createTile(type) {
    const el = document.createElement('div');
    el.className = 'cat';
    const body = document.createElement('div');
    body.className = 'cat__body';
    el.appendChild(body);
    boardEl.appendChild(el);

    const tile = { id: ++uid, type, item: null, el, body, badge: null, r: 0, c: 0 };
    paint(tile);
    return tile;
  }

  /** ねこの みためを つける（丸、または 顔の 画像） */
  function dressBody(body, type) {
    const def = CAT_TYPES[type];
    body.className = 'cat__body cat__body--' + def.key;
    if (def.image && def.ready) {
      body.classList.add('cat__body--image');
      if (def.sheet) body.classList.add('cat__body--sheet');
      body.style.backgroundImage = 'url("' + def.image + '")';
    } else {
      body.style.backgroundImage = '';
    }
  }

  function paint(tile) {
    dressBody(tile.body, tile.type);
    tile.el.classList.toggle('cat--item', !!tile.item);

    if (tile.item) {
      const def = ITEMS[tile.item];
      if (!tile.badge) {
        tile.badge = document.createElement('span');
        tile.el.appendChild(tile.badge);
      }
      tile.badge.className = 'cat__tool cat__tool--' + tile.item;
      if (def.image && def.ready) {
        tile.badge.textContent = '';
        tile.badge.classList.add('cat__tool--image');
        tile.badge.style.backgroundImage = 'url("' + def.image + '")';
      } else {
        tile.badge.textContent = def.icon;
        tile.badge.style.backgroundImage = '';
      }
      tile.el.setAttribute('aria-label', CAT_TYPES[tile.type].name + '（' + def.name + '）');
    } else {
      if (tile.badge) { tile.badge.remove(); tile.badge = null; }
      tile.el.setAttribute('aria-label', CAT_TYPES[tile.type].name);
    }
  }

  function moveTo(tile, r, c, instant) {
    tile.r = r;
    tile.c = c;
    const transform = 'translate3d(' + (c * cell) + 'px,' + (r * cell) + 'px,0)';
    if (instant) {
      tile.el.style.transition = 'none';
      tile.el.style.transform = transform;
      void tile.el.offsetWidth; // さいびょうがを はさんで アニメを きる
      tile.el.style.transition = '';
    } else {
      tile.el.style.transform = transform;
    }
  }

  /* ---------------- ばんめんの はんてい ---------------- */

  function typeGrid() {
    return grid.map((row) => row.map((tile) => (tile ? tile.type : -1)));
  }

  /** たて・よこに MIN_MATCH いじょう つながった ならびを かえす */
  function findRuns(tg) {
    const runs = [];

    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        const type = tg[r][c];
        let end = c + 1;
        if (type >= 0) {
          while (end < COLS && tg[r][end] === type) end++;
          if (end - c >= MIN_MATCH) runs.push({ dir: 'h', r, c, len: end - c });
        }
        c = Math.max(end, c + 1);
      }
    }

    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        const type = tg[r][c];
        let end = r + 1;
        if (type >= 0) {
          while (end < ROWS && tg[end][c] === type) end++;
          if (end - r >= MIN_MATCH) runs.push({ dir: 'v', r, c, len: end - r });
        }
        r = Math.max(end, r + 1);
      }
    }

    return runs;
  }

  function runCells(run) {
    const cells = [];
    for (let i = 0; i < run.len; i++) {
      cells.push(run.dir === 'h' ? key(run.r, run.c + i) : key(run.r + i, run.c));
    }
    return cells;
  }

  /** つながった ならびを ひとかたまりに まとめる（L字・T字を 見つけるため） */
  function groupRuns(runs) {
    const owner = new Map();   // マス → かたまりの ばんごう
    const groups = [];

    runs.forEach((run) => {
      const cells = runCells(run);
      const hit = [...new Set(cells.map((k) => owner.get(k)).filter((g) => g !== undefined))];
      let gi;
      if (!hit.length) {
        gi = groups.length;
        groups.push({ cells: new Set(), runs: [] });
      } else {
        gi = hit[0];
        // すでに ある かたまり同士が つながったら ひとつに する
        hit.slice(1).forEach((other) => {
          groups[other].cells.forEach((k) => { groups[gi].cells.add(k); owner.set(k, gi); });
          groups[gi].runs.push(...groups[other].runs);
          groups[other].cells.clear();
          groups[other].runs.length = 0;
        });
      }
      groups[gi].runs.push(run);
      cells.forEach((k) => { groups[gi].cells.add(k); owner.set(k, gi); });
    });

    return groups.filter((g) => g.cells.size);
  }

  /** かたまりから、のこす どうぐの しゅるいと ばしょを きめる */
  function itemFor(group) {
    const hRuns = group.runs.filter((run) => run.dir === 'h');
    const vRuns = group.runs.filter((run) => run.dir === 'v');
    const maxLen = Math.max(...group.runs.map((run) => run.len));

    // たてと よこが 交わっている（L字・T字）
    const crossing = [];
    hRuns.forEach((h) => {
      const hc = runCells(h);
      vRuns.forEach((v) => {
        const vc = new Set(runCells(v));
        hc.forEach((k) => { if (vc.has(k)) crossing.push(k); });
      });
    });

    let kind = null;
    let where = null;
    if (crossing.length) {
      kind = 'cross';
      where = crossing;
    } else if (maxLen >= 5) {
      kind = 'bomb';
      where = [...group.cells];
    } else if (maxLen >= ITEM_MIN) {
      const long = group.runs.find((run) => run.len === maxLen);
      kind = long.dir === 'h' ? 'row' : 'col';
      where = runCells(long);
    }
    if (!kind) return null;

    // プレイヤーが うごかした マスを 優先して どうぐを のこす（ねらった場所に できる）
    const preferred = where.filter((k) => lastSwap.includes(k));
    const pool = preferred.length ? preferred : where;
    const free = pool.filter((k) => tileAtKey(k) && !tileAtKey(k).item);
    const at = (free.length ? free : pool)[Math.floor((free.length ? free.length : pool.length) / 2)];
    return { kind, at };
  }

  /** どうぐが にがす マス */
  function itemCells(tile) {
    const cells = [];
    if (tile.item === 'row') {
      for (let c = 0; c < COLS; c++) cells.push(key(tile.r, c));
    } else if (tile.item === 'col') {
      for (let r = 0; r < ROWS; r++) cells.push(key(r, tile.c));
    } else if (tile.item === 'bomb') {
      for (let r = tile.r - 1; r <= tile.r + 1; r++) {
        for (let c = tile.c - 1; c <= tile.c + 1; c++) {
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells.push(key(r, c));
        }
      }
    } else if (tile.item === 'cross') {
      for (let d = -Math.max(ROWS, COLS); d <= Math.max(ROWS, COLS); d++) {
        [[tile.r + d, tile.c + d], [tile.r + d, tile.c - d]].forEach(([r, c]) => {
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells.push(key(r, c));
        });
      }
    }
    return cells;
  }

  /** にげる マスを きめる。となりの ねこが にげる どうぐも いっしょに はたらく。 */
  function spreadEscape(startCells, keepCells) {
    const escaping = new Set(startCells);
    const queue = [...startCells];
    const used = [];           // はたらいた どうぐ（ひかりの ために おぼえる）
    const fired = new Set();

    while (queue.length) {
      const k = queue.pop();
      const r = rowOf(k), c = colOf(k);
      // にげる マス そのもの（と、'adjacent' なら その となり4マス）に どうぐが あれば はたらく
      const around = ITEM_TRIGGER === 'adjacent'
        ? [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
        : [[r, c]];

      around.forEach(([nr, nc]) => {
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
        const tile = grid[nr][nc];
        if (!tile || !tile.item || fired.has(tile.id)) return;
        if (keepCells.has(key(nr, nc))) return;      // いま できたばかりの どうぐは はたらかない

        fired.add(tile.id);
        used.push({ kind: tile.item, r: nr, c: nc });
        escaping.add(key(nr, nc));
        itemCells(tile).forEach((ck) => {
          if (keepCells.has(ck) || escaping.has(ck)) return;
          escaping.add(ck);
          queue.push(ck);
        });
      });
    }

    keepCells.forEach((k) => escaping.delete(k));
    return { escaping, used };
  }

  /** 1てでも そろえられる いれかえが のこっているか */
  function hasMove(tg) {
    const swapCheck = (r1, c1, r2, c2) => {
      const tmp = tg[r1][c1];
      tg[r1][c1] = tg[r2][c2];
      tg[r2][c2] = tmp;
      const ok = findRuns(tg).length > 0;
      tg[r2][c2] = tg[r1][c1];
      tg[r1][c1] = tmp;
      return ok;
    };
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c + 1 < COLS && swapCheck(r, c, r, c + 1)) return true;
        if (r + 1 < ROWS && swapCheck(r, c, r + 1, c)) return true;
      }
    }
    return false;
  }

  /** おいても すぐには そろわない しゅるいを えらぶ */
  function safeType(types, r, c) {
    const pool = [];
    for (let t = 0; t < typeCount; t++) {
      let run = 1;
      for (let k = 1; k < MIN_MATCH && c - k >= 0 && types[r][c - k] === t; k++) run++;
      if (run >= MIN_MATCH) continue;
      run = 1;
      for (let k = 1; k < MIN_MATCH && r - k >= 0 && types[r - k][c] === t; k++) run++;
      if (run >= MIN_MATCH) continue;
      pool.push(t);
    }
    return pool.length ? pool[rand(pool.length)] : rand(typeCount);
  }

  function makeTypes() {
    let types = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      types = [];
      for (let r = 0; r < ROWS; r++) {
        types.push([]);
        for (let c = 0; c < COLS; c++) types[r].push(safeType(types, r, c));
      }
      if (findRuns(types).length === 0 && hasMove(types)) break;
    }
    return types;
  }

  /* ---------------- ゲームの すすみ ---------------- */

  function newGame() {
    busy = true;
    selected = null;
    score = 0;
    moves = 0;
    lastSwap = [];
    boardEl.innerHTML = '';
    runwayEl.innerHTML = '';

    const types = makeTypes();
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      grid.push([]);
      for (let c = 0; c < COLS; c++) {
        const tile = createTile(types[r][c]);
        grid[r].push(tile);
        moveTo(tile, r, c, true);
      }
    }

    layout();
    updateHud();
    say('ねこを すべらせて 3びき そろえるニャ！');
    busy = false;
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    movesEl.textContent = 'てすう ' + moves;
    if (score > best) {
      best = score;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) { /* ほぞん できなくても つづける */ }
    }
    bestEl.textContent = 'さいこう ' + best;
  }

  function say(text) {
    messageEl.textContent = text;
  }

  function bignews(text) {
    bignewsTxt.textContent = text;
    bignewsEl.hidden = false;
    clearTimeout(bignewsTimer);
    bignewsTimer = setTimeout(() => { bignewsEl.hidden = true; }, 900);
  }

  /** どうぐが はたらいた ところを ひからせる */
  function blast(kind, r, c) {
    const make = (styles) => {
      const el = document.createElement('div');
      el.className = 'blast';
      Object.assign(el.style, styles);
      boardEl.appendChild(el);
      setTimeout(() => el.remove(), BLAST_MS + 60);
    };
    const px = (n) => n + 'px';

    if (kind === 'row') {
      make({ left: '0', top: px(r * cell), width: px(COLS * cell), height: px(cell) });
    } else if (kind === 'col') {
      make({ left: px(c * cell), top: '0', width: px(cell), height: px(ROWS * cell) });
    } else if (kind === 'bomb') {
      make({ left: px((c - 1) * cell), top: px((r - 1) * cell), width: px(3 * cell), height: px(3 * cell), borderRadius: px(cell / 2) });
    } else if (kind === 'cross') {
      const long = (COLS + ROWS) * cell;
      [45, -45].forEach((deg) => make({
        left: px(c * cell + cell / 2 - long / 2),
        top: px(r * cell + cell / 2 - cell / 2),
        width: px(long),
        height: px(cell),
        transform: 'rotate(' + deg + 'deg)',
      }));
    }
  }

  /** にげる ねこを 画面の 右へ はしらせる */
  function escapeRight(tiles) {
    const vw = window.innerWidth;
    const ordered = tiles.slice().sort((a, b) => (b.c - a.c) || (a.r - b.r));

    ordered.forEach((tile, i) => {
      const rect = tile.el.getBoundingClientRect();
      const runner = document.createElement('div');
      runner.className = 'runner';
      runner.style.left = rect.left + 'px';
      runner.style.top = rect.top + 'px';
      runner.style.width = rect.width + 'px';
      runner.style.height = rect.height + 'px';
      runner.style.setProperty('--run', Math.round(vw - rect.left + rect.width) + 'px');
      runner.style.animationDelay = (i * RUN_STAGGER) + 'ms';

      const body = document.createElement('div');
      dressBody(body, tile.type);
      runner.appendChild(body);

      runwayEl.appendChild(runner);
      setTimeout(() => runner.remove(), RUN_MS + i * RUN_STAGGER + 150);
    });
  }

  /** ねこを 下に つめて、あいた ぶんを 上から ふらせる */
  function collapseAndRefill() {
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        const tile = grid[r][c];
        if (!tile) continue;
        if (write !== r) {
          grid[write][c] = tile;
          grid[r][c] = null;
          moveTo(tile, write, c, false);
        }
        write--;
      }
      const missing = write + 1;
      for (let r = write; r >= 0; r--) {
        const tile = createTile(rand(typeCount));
        grid[r][c] = tile;
        moveTo(tile, r - missing, c, true); // ばんの 上（画面の そと）から
        const target = r;
        requestAnimationFrame(() => moveTo(tile, target, c, false));
      }
    }
  }

  /** そろい → どうぐ → にげる → おちる を れんさが とまるまで くりかえす */
  async function resolveBoard() {
    let chain = 0;

    for (;;) {
      const runs = findRuns(typeGrid());
      if (!runs.length) break;
      chain++;

      const groups = groupRuns(runs);
      const matched = new Set();
      const newItems = [];
      groups.forEach((group) => {
        group.cells.forEach((k) => matched.add(k));
        const item = itemFor(group);
        if (item) newItems.push(item);
      });

      const keepCells = new Set(newItems.map((item) => item.at));
      const { escaping, used } = spreadEscape([...matched], keepCells);

      // どうぐの ひかり → ねこが はしる
      used.forEach((u) => blast(u.kind, u.r, u.c));

      const tiles = [...escaping].map((k) => tileAtKey(k)).filter(Boolean);
      score += (tiles.length * 10 + newItems.length * 50) * chain;
      updateHud();

      if (used.length) {
        const what = [...new Set(used.map((u) => ITEMS[u.kind].what))].join('と');
        say(what + 'が にげた！');
      } else if (newItems.length) {
        say(ITEMS[newItems[0].kind].name + 'を てにいれた！');
      } else {
        say(tiles.length + 'ひき 右へ にげていった！');
      }
      if (chain >= 2) bignews(chain + 'れんさ！');

      if (used.length) await sleep(BLAST_MS * 0.5);

      escapeRight(tiles);
      tiles.forEach((tile) => {
        grid[tile.r][tile.c] = null;
        tile.el.remove();
      });

      // のこした マスを どうぐに する
      newItems.forEach((item) => {
        const tile = tileAtKey(item.at);
        if (!tile) return;
        tile.item = item.kind;
        paint(tile);
        tile.el.animate(
          [{ transform: tile.el.style.transform + ' scale(1)' },
           { transform: tile.el.style.transform + ' scale(1.25)' },
           { transform: tile.el.style.transform + ' scale(1)' }],
          { duration: 320, easing: 'ease-out' }
        );
      });

      await sleep(ESCAPE_HOLD);
      collapseAndRefill();
      await sleep(FALL_MS + 60);
    }

    if (chain >= 2) say(chain + 'れんさ！ すごいニャ');
    else if (chain === 1 && !messageEl.textContent.includes('てにいれた')) say('にげられたニャ〜');

    if (!hasMove(typeGrid())) await reshuffle();
  }

  /** てづまりに なったら ならびなおす */
  async function reshuffle() {
    say('うごかせる てが ないので ならびなおすニャ');
    const tiles = [];
    eachTile((tile) => tiles.push(tile));

    for (let attempt = 0; attempt < 80; attempt++) {
      const types = tiles.map((tile) => tile.type);
      for (let i = types.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        const tmp = types[i]; types[i] = types[j]; types[j] = tmp;
      }
      const candidate = [];
      for (let r = 0; r < ROWS; r++) candidate.push(types.slice(r * COLS, (r + 1) * COLS));
      if (findRuns(candidate).length === 0 && hasMove(candidate)) {
        tiles.forEach((tile, i) => {
          tile.type = types[i];
          paint(tile);
        });
        break;
      }
    }

    eachTile((tile) => {
      tile.el.animate(
        [{ transform: tile.el.style.transform + ' scale(1)' },
         { transform: tile.el.style.transform + ' scale(.8)' },
         { transform: tile.el.style.transform + ' scale(1)' }],
        { duration: 320, easing: 'ease-in-out' }
      );
    });
    await sleep(340);
  }

  /* ---------------- そうさ ---------------- */

  function selectTile(tile) {
    if (selected) selected.el.classList.remove('is-selected');
    selected = tile || null;
    if (selected) selected.el.classList.add('is-selected');
  }

  function isNeighbor(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  async function trySwap(a, b) {
    if (busy || !a || !b || !isNeighbor(a, b)) return;
    busy = true;
    selectTile(null);

    swapTiles(a, b);
    await sleep(SWAP_MS);

    if (findRuns(typeGrid()).length) {
      lastSwap = [key(a.r, a.c), key(b.r, b.c)];
      moves++;
      updateHud();
      await resolveBoard();
      lastSwap = [];
    } else {
      swapTiles(a, b);
      a.el.classList.add('is-nope');
      b.el.classList.add('is-nope');
      say('そろわないから もどったニャ');
      await sleep(Math.max(SWAP_MS, 240));
      a.el.classList.remove('is-nope');
      b.el.classList.remove('is-nope');
    }

    busy = false;
  }

  function swapTiles(a, b) {
    const ar = a.r, ac = a.c, br = b.r, bc = b.c;
    grid[ar][ac] = b;
    grid[br][bc] = a;
    a.el.classList.add('is-swapping');
    b.el.classList.add('is-swapping');
    setTimeout(() => {
      a.el.classList.remove('is-swapping');
      b.el.classList.remove('is-swapping');
    }, SWAP_MS + 20);
    moveTo(a, br, bc, false);
    moveTo(b, ar, ac, false);
  }

  function cellAt(clientX, clientY) {
    const rect = boardEl.getBoundingClientRect();
    const c = Math.floor((clientX - rect.left - boardEl.clientLeft) / cell);
    const r = Math.floor((clientY - rect.top - boardEl.clientTop) / cell);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return grid[r][c];
  }

  /** ドラッグの むきから いれかえ先を きめる。みじかすぎる ときは null。 */
  function swipeTarget(tile, dx, dy) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.4) return null;
    let r = tile.r;
    let c = tile.c;
    if (Math.abs(dx) > Math.abs(dy)) c += dx > 0 ? 1 : -1;
    else r += dy > 0 ? 1 : -1;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return grid[r][c];
  }

  let drag = null;

  boardEl.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // 文字えらびや ネイティブの ドラッグが はじまると イベントが とぎれる ため
    if (busy) return;
    const tile = cellAt(e.clientX, e.clientY);
    if (!tile) return;
    drag = { tile, x: e.clientX, y: e.clientY, moved: false };
    try { boardEl.setPointerCapture(e.pointerId); } catch (err) { /* とれなくても そうさは つづく */ }
  });

  boardEl.addEventListener('pointermove', (e) => {
    if (!drag || drag.moved || busy) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.4) return;
    drag.moved = true; // ばんの そとむきでも タップあつかいには しない
    const target = swipeTarget(drag.tile, dx, dy);
    if (target) trySwap(drag.tile, target);
  });

  boardEl.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const started = drag;
    drag = null;
    if (started.moved || busy) return;

    // はやい フリックで pointermove が ほとんど とどかなかった ときも ここで ひろう
    const flick = swipeTarget(started.tile, e.clientX - started.x, e.clientY - started.y);
    if (flick) { trySwap(started.tile, flick); return; }

    const tile = cellAt(e.clientX, e.clientY);
    if (!tile) { selectTile(null); return; }
    if (!selected) { selectTile(tile); return; }
    if (selected === tile) { selectTile(null); return; }
    if (isNeighbor(selected, tile)) trySwap(selected, tile);
    else selectTile(tile);
  });

  boardEl.addEventListener('pointercancel', () => { drag = null; });
  boardEl.addEventListener('dragstart', (e) => e.preventDefault());
  boardEl.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------------- ねこの かずを えらぶ がめん ---------------- */

  function buildKindChoices() {
    kindChoice.innerHTML = '';
    [{ n: 4, sub: 'やさしい' }, { n: 5, sub: 'ふつう' }, { n: 6, sub: 'むずかしい' }].forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-choice' + (item.n === typeCount ? ' is-current' : '');

      const sample = document.createElement('span');
      sample.className = 'cat-choice__sample';
      for (let i = 0; i < item.n; i++) {
        const dot = document.createElement('span');
        dressBody(dot, i);
        sample.appendChild(dot);
      }

      const name = document.createElement('span');
      name.textContent = item.n + 'しゅるい';

      const sub = document.createElement('span');
      sub.className = 'cat-choice__sub';
      sub.textContent = item.sub;

      if (item.n === typeCount) {
        const mark = document.createElement('span');
        mark.className = 'cat-choice__mark';
        mark.textContent = '✔';
        btn.appendChild(mark);
      }

      btn.append(sample, name, sub);
      btn.addEventListener('click', () => {
        typeCount = item.n;
        try { localStorage.setItem(KIND_KEY, String(typeCount)); } catch (e) { /* つづける */ }
        kindSubEl.textContent = typeCount + 'しゅるい';
        kindModal.hidden = true;
        newGame();
      });
      kindChoice.appendChild(btn);
    });
  }

  kindBtn.addEventListener('click', () => {
    buildKindChoices();
    kindModal.hidden = false;
  });
  closeBtn.addEventListener('click', () => { kindModal.hidden = true; });
  kindModal.addEventListener('click', (e) => { if (e.target === kindModal) kindModal.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') kindModal.hidden = true; });

  resetBtn.addEventListener('click', newGame);
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);

  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { best = 0; }
  try {
    const saved = Number(localStorage.getItem(KIND_KEY));
    typeCount = [4, 5, 6].includes(saved) ? saved : 5;
  } catch (e) { typeCount = 5; }
  kindSubEl.textContent = typeCount + 'しゅるい';

  loadImages();
  newGame();
})();
