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
 *   - どうぐに なった マスは ねこの かおが 消えて、どうぐだけに なる（ねことしては そろわない）
 *   - どうぐは となりの ねこと いれかえると つかえる。
 *     となりの ねこが にげた ときにも いっしょに はたらく（どうぐ同士で つながる）
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
  const KIND_KEY = 'catonescape.kinds';   // ふるい ほぞん（ねこの しゅるい数）からの ひきつぎ用
  const DIFF_KEY = 'catonescape.diff';

  // レベル：にがした ねこの かずが たまると 上がる
  const LEVEL_BASE = 40;    // レベル1→2 に ひつような かず
  const LEVEL_STEP = 15;    // レベルが 上がる ごとに ふえる かず

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

  /** じゃまもの。ねこでは ないので そろわず、おちても こない。
   *  となりで ねこが にげると よわって、たいりょくが 0に なると いなく なる。 */
  const BLOCKERS = {
    dog:  { name: 'いぬ',     icon: '🐶', hp: 2, image: null },
    wolf: { name: 'おおかみ', icon: '🐺', hp: 3, image: null },
  };

  /** むずかしさ。じゃまものは レベルが 上がる ごとに 1つずつ ふえる（max まで）。 */
  const DIFFS = {
    easy:   { name: 'やさしい',   note: 'ねこ4しゅるい・じゃまもの なし', types: 4, max: 0, wolfFrom: 99 },
    normal: { name: 'ふつう',     note: 'ねこ5しゅるい・いぬ さいだい2',  types: 5, max: 2, wolfFrom: 5 },
    hard:   { name: 'むずかしい', note: 'ねこ6しゅるい・じゃまもの さいだい3', types: 6, max: 3, wolfFrom: 3 },
  };

  const boardEl    = document.getElementById('board');
  const areaEl     = document.getElementById('boardArea');
  const runwayEl   = document.getElementById('runway');
  const scoreEl    = document.getElementById('score');
  const bestEl     = document.getElementById('best');
  const messageEl  = document.getElementById('message');
  const bignewsEl  = document.getElementById('bignews');
  const bignewsTxt = document.getElementById('bignewsText');
  const levelEl    = document.getElementById('level');
  const gaugeEl    = document.getElementById('gaugeBar');
  const quotaEl    = document.getElementById('quota');
  const kindSubEl  = document.getElementById('kindSub');
  const kindModal  = document.getElementById('kindModal');
  const kindChoice = document.getElementById('kindChoices');
  const resetBtn   = document.getElementById('btnReset');
  const kindBtn    = document.getElementById('btnKind');
  const closeBtn   = document.getElementById('btnCloseKind');

  /** grid[r][c] = tile | null */
  let grid = [];
  let cell = 56;
  let diffKey = 'normal';
  let typeCount = 5;
  let score = 0;
  let moves = 0;
  let best = 0;
  let level = 1;
  let rescued = 0;          // いまの レベルで にがした ねこの かず
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

    const tile = { id: ++uid, type, item: null, blocker: null, hp: 0, el, body, badge: null, pips: null, r: 0, c: 0 };
    paint(tile);
    return tile;
  }

  /** じゃまもの（いぬ・おおかみ）に する */
  function makeBlocker(tile, kind) {
    tile.item = null;
    tile.blocker = kind;
    tile.hp = BLOCKERS[kind].hp;
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
    tile.el.classList.toggle('cat--blocker', !!tile.blocker);

    if (tile.blocker) {
      const def = BLOCKERS[tile.blocker];
      if (!tile.badge) {
        tile.badge = document.createElement('span');
        tile.el.appendChild(tile.badge);
      }
      tile.badge.className = 'cat__foe cat__foe--' + tile.blocker;
      if (def.image && def.ready) {
        tile.badge.textContent = '';
        tile.badge.classList.add('cat__foe--image');
        tile.badge.style.backgroundImage = 'url("' + def.image + '")';
      } else {
        tile.badge.textContent = def.icon;
        tile.badge.style.backgroundImage = '';
      }
      if (!tile.pips) {
        tile.pips = document.createElement('span');
        tile.pips.className = 'cat__hp';
        tile.el.appendChild(tile.pips);
      }
      tile.pips.innerHTML = '';
      for (let i = 0; i < def.hp; i++) {
        const pip = document.createElement('i');
        if (i < tile.hp) pip.className = 'is-on';
        tile.pips.appendChild(pip);
      }
      tile.el.setAttribute('aria-label', def.name + '（あと' + tile.hp + '）');
      return;
    }

    if (tile.pips) { tile.pips.remove(); tile.pips = null; }

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
      tile.el.setAttribute('aria-label', def.name);
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
    // どうぐ／じゃまものの マスは ねこでは ないので、そろいの はんていから 外す
    return grid.map((row) => row.map((tile) => (tile && !tile.item && !tile.blocker ? tile.type : -1)));
  }

  function anyItem() {
    let found = false;
    eachTile((tile) => { if (tile.item) found = true; });
    return found;
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

    // じゃまものは にげない。にげる マスの となりに いると よわる。
    const hurt = new Set();
    escaping.forEach((k) => {
      const r = rowOf(k), c = colOf(k);
      [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
        const tile = grid[nr][nc];
        if (tile && tile.blocker) hurt.add(key(nr, nc));
      });
    });
    hurt.forEach((k) => escaping.delete(k));

    return { escaping, used, hurt };
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
    level = 1;
    rescued = 0;
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

  /** つぎの レベルまでに にがす かず */
  function levelQuota(n) {
    return LEVEL_BASE + LEVEL_STEP * (n - 1);
  }

  /** にがした ねこを かぞえて、たまったら レベルアップ */
  function addRescued(n) {
    if (!n) return;
    rescued += n;
    while (rescued >= levelQuota(level)) {
      rescued -= levelQuota(level);
      level += 1;
      onLevelUp();
    }
  }

  function onLevelUp() {
    bignews('レベル ' + level + '！');
    const diff = DIFFS[diffKey];
    const placed = addBlockers(1);
    say(placed
      ? 'レベル ' + level + '！ ' + placed + 'が やってきたニャ…'
      : 'レベル ' + level + ' に なったニャ！');
    if (!placed && diff.max === 0) say('レベル ' + level + ' に なったニャ！');
  }

  /** じゃまものを ばんに おく（さいだい数まで）。おいた ものの 名前を かえす。 */
  function addBlockers(count) {
    const diff = DIFFS[diffKey];
    let placed = null;
    for (let i = 0; i < count; i++) {
      let onBoard = 0;
      eachTile((tile) => { if (tile.blocker) onBoard++; });
      if (onBoard >= diff.max) break;

      // ねこ（どうぐでない）マスの なかから、はしに よりすぎない ところを えらぶ
      const spots = [];
      for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = grid[r][c];
          if (tile && !tile.item && !tile.blocker) spots.push(tile);
        }
      }
      if (!spots.length) break;

      const kind = level >= diff.wolfFrom && rand(2) ? 'wolf' : 'dog';
      const target = spots[rand(spots.length)];
      makeBlocker(target, kind);
      target.el.animate(
        [{ transform: target.el.style.transform + ' scale(.3)', opacity: 0 },
         { transform: target.el.style.transform + ' scale(1.2)', opacity: 1 },
         { transform: target.el.style.transform + ' scale(1)', opacity: 1 }],
        { duration: 420, easing: 'ease-out' }
      );
      placed = BLOCKERS[kind].name;
    }
    return placed;
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    levelEl.textContent = 'レベル ' + level;
    const quota = levelQuota(level);
    gaugeEl.style.width = Math.min(100, Math.round(rescued / quota * 100)) + '%';
    quotaEl.textContent = 'あと ' + Math.max(0, quota - rescued) + 'ひき にがすと レベル ' + (level + 1);
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
      if (tile.item) {
        const def = ITEMS[tile.item];
        body.className = 'cat__body cat__body--tool';
        if (def.image && def.ready) {
          body.style.backgroundImage = 'url("' + def.image + '")';
        } else {
          body.textContent = def.icon;
        }
      } else {
        dressBody(body, tile.type);
      }
      runner.appendChild(body);

      runwayEl.appendChild(runner);
      setTimeout(() => runner.remove(), RUN_MS + i * RUN_STAGGER + 150);
    });
  }

  /** ねこを 下に つめて、あいた ぶんを 上から ふらせる。
   *  じゃまものは おちない。その下は ふさがれる ので、ねこは ななめに まわりこんで 入る。
   *  ※ ばんの なかみ（grid）だけを 先に そろえてから、さいごに まとめて うごかす。
   *    とちゅうで 絵の いちを 変えると、あとから 来る うごきと ぶつかって ずれる。 */
  function collapseAndRefill() {
    const spawned = new Array(COLS).fill(0);

    for (let pass = 0; pass < ROWS * 2; pass++) {
      let moved = false;

      for (let r = ROWS - 2; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
          const tile = grid[r][c];
          if (!tile || tile.blocker) continue;          // じゃまものは うごかない
          if (!grid[r + 1][c]) {                        // まっすぐ 下へ
            grid[r + 1][c] = tile;
            grid[r][c] = null;
            moved = true;
          } else if (grid[r + 1][c].blocker) {          // ふさがれて いたら ななめへ まわりこむ
            const dirs = rand(2) ? [-1, 1] : [1, -1];
            for (const d of dirs) {
              const nc = c + d;
              if (nc < 0 || nc >= COLS || grid[r + 1][nc]) continue;
              grid[r + 1][nc] = tile;
              grid[r][c] = null;
              moved = true;
              break;
            }
          }
        }
      }

      // いちばん上が あいていたら、画面の 外から ねこが おりてくる
      for (let c = 0; c < COLS; c++) {
        if (grid[0][c]) continue;
        const tile = createTile(rand(typeCount));
        grid[0][c] = tile;
        spawned[c]++;
        moveTo(tile, -spawned[c], c, true);   // まずは 画面の そとに おく
        moved = true;
      }

      if (!moved) break;
    }

    // じゃまものに かこまれて どこからも 入れない マスには、その場に ねこが やってくる
    const popped = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) continue;
        const tile = createTile(rand(typeCount));
        grid[r][c] = tile;
        moveTo(tile, r, c, true);
        popped.push(tile);
      }
    }

    // さいごに、ぜんぶの ねこを 正しい マスへ うごかす
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = grid[r][c];
        if (tile && (tile.r !== r || tile.c !== c)) moveTo(tile, r, c, false);
      }
    }

    popped.forEach((tile) => {
      tile.el.animate(
        [{ transform: tile.el.style.transform + ' scale(.2)', opacity: 0 },
         { transform: tile.el.style.transform + ' scale(1)', opacity: 1 }],
        { duration: FALL_MS, easing: 'ease-out' }
      );
    });
  }

  /** ひかり → てんすう → ねこが はしる → どうぐを のこす、までを まとめて やる */
  async function runEscape(escaping, used, newItems, chain, hurt) {
    used.forEach((u) => blast(u.kind, u.r, u.c));

    // じゃまものを よわらせる。たいりょくが なくなったら いっしょに にげていく。
    let beaten = 0;
    (hurt || new Set()).forEach((k) => {
      const foe = tileAtKey(k);
      if (!foe || !foe.blocker) return;
      foe.hp -= 1;
      if (foe.hp > 0) {
        paint(foe);
        foe.el.animate(
          [{ transform: foe.el.style.transform + ' translateX(0)' },
           { transform: foe.el.style.transform + ' translateX(-10%)' },
           { transform: foe.el.style.transform + ' translateX(8%)' },
           { transform: foe.el.style.transform + ' translateX(0)' }],
          { duration: 260, easing: 'ease-in-out' }
        );
      } else {
        beaten++;
        escaping.add(k);     // おいはらえた
      }
    });

    const tiles = [...escaping].map((k) => tileAtKey(k)).filter(Boolean);
    const cats = tiles.filter((t) => !t.blocker && !t.item).length;
    score += (tiles.length * 10 + newItems.length * 50 + beaten * 100) * chain;
    addRescued(cats);
    updateHud();

    if (beaten) {
      say(beaten === 1 ? 'じゃまものを おいはらった！' : 'じゃまものを ' + beaten + 'ひき おいはらった！');
    } else if (used.length) {
      const what = [...new Set(used.map((u) => ITEMS[u.kind].what))].join('と');
      say(what + 'が にげた！');
    } else if (newItems.length) {
      say(ITEMS[newItems[0].kind].name + 'に なった！');
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

    // のこした マスを どうぐに する（ねこの かおは 消えて どうぐだけに なる）
    newItems.forEach((item) => {
      const tile = tileAtKey(item.at);
      if (!tile) return;
      tile.item = item.kind;
      paint(tile);
      tile.el.animate(
        [{ transform: tile.el.style.transform + ' scale(1)' },
         { transform: tile.el.style.transform + ' scale(1.3)' },
         { transform: tile.el.style.transform + ' scale(1)' }],
        { duration: 340, easing: 'ease-out' }
      );
    });

    return tiles.length;
  }

  /** どうぐを つかう（となりの ねこと いれかえると はたらく） */
  async function useItem(item, other) {
    busy = true;
    selectTile(null);

    swapTiles(item, other);
    await sleep(SWAP_MS);
    moves++;
    updateHud();

    const { escaping, used, hurt } = spreadEscape([key(item.r, item.c)], new Set());
    await runEscape(escaping, used, [], 1, hurt);
    await sleep(ESCAPE_HOLD);
    collapseAndRefill();
    await sleep(FALL_MS + 60);

    await resolveBoard();   // おちてきた ねこで そろえば れんさ
    busy = false;
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
      const { escaping, used, hurt } = spreadEscape([...matched], keepCells);

      await runEscape(escaping, used, newItems, chain, hurt);
      await sleep(ESCAPE_HOLD);
      collapseAndRefill();
      await sleep(FALL_MS + 60);
    }

    if (chain >= 2) say(chain + 'れんさ！ すごいニャ');
    else if (chain === 1 && !messageEl.textContent.includes('てにいれた')) say('にげられたニャ〜');

    if (!hasMove(typeGrid()) && !anyItem()) await reshuffle();
  }

  /** てづまりに なったら ならびなおす */
  async function reshuffle() {
    say('うごかせる てが ないので ならびなおすニャ');
    const cats = [];
    eachTile((tile) => { if (!tile.item && !tile.blocker) cats.push(tile); });
    if (!cats.length) return;

    for (let attempt = 0; attempt < 80; attempt++) {
      const types = cats.map((tile) => tile.type);
      for (let i = types.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        const tmp = types[i]; types[i] = types[j]; types[j] = tmp;
      }
      // ならべかえた ばんめんを ためす（どうぐ／じゃまものの マスは -1 の まま）
      const candidate = Array.from({ length: ROWS }, () => new Array(COLS).fill(-1));
      cats.forEach((tile, i) => { candidate[tile.r][tile.c] = types[i]; });
      if (findRuns(candidate).length === 0 && hasMove(candidate)) {
        cats.forEach((tile, i) => {
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

    // じゃまものは うごかない。そばで ねこを にがして おいはらう。
    if (a.blocker || b.blocker) {
      const foe = a.blocker ? a : b;
      selectTile(null);
      say(BLOCKERS[foe.blocker].name + 'は うごかないニャ。そばで ねこを にがすニャ！');
      foe.el.classList.add('is-nope');
      setTimeout(() => foe.el.classList.remove('is-nope'), 260);
      return;
    }

    // どうぐは そろえなくても、となりの ねこと いれかえるだけで はたらく
    if (a.item) return useItem(a, b);
    if (b.item) return useItem(b, a);

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
    Object.keys(DIFFS).forEach((dk) => {
      const diff = DIFFS[dk];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-choice' + (dk === diffKey ? ' is-current' : '');

      const sample = document.createElement('span');
      sample.className = 'cat-choice__sample';
      for (let i = 0; i < diff.types; i++) {
        const dot = document.createElement('span');
        dressBody(dot, i);
        sample.appendChild(dot);
      }
      if (diff.max) {
        const foe = document.createElement('span');
        foe.className = 'cat-choice__foe';
        foe.textContent = BLOCKERS[diff.wolfFrom <= 3 ? 'wolf' : 'dog'].icon;
        sample.appendChild(foe);
      }

      const name = document.createElement('span');
      name.textContent = diff.name;

      const sub = document.createElement('span');
      sub.className = 'cat-choice__sub';
      sub.textContent = diff.note;

      if (dk === diffKey) {
        const mark = document.createElement('span');
        mark.className = 'cat-choice__mark';
        mark.textContent = '✔';
        btn.appendChild(mark);
      }

      btn.append(sample, name, sub);
      btn.addEventListener('click', () => {
        setDiff(dk);
        kindModal.hidden = true;
        newGame();
      });
      kindChoice.appendChild(btn);
    });
  }

  function setDiff(dk) {
    diffKey = DIFFS[dk] ? dk : 'normal';
    typeCount = DIFFS[diffKey].types;
    kindSubEl.textContent = DIFFS[diffKey].name;
    try { localStorage.setItem(DIFF_KEY, diffKey); } catch (e) { /* つづける */ }
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
    const saved = localStorage.getItem(DIFF_KEY);
    if (DIFFS[saved]) {
      setDiff(saved);
    } else {
      // ふるい ほぞん（ねこの しゅるい数）から ひきつぐ
      const kinds = Number(localStorage.getItem(KIND_KEY));
      setDiff(kinds === 4 ? 'easy' : (kinds === 6 ? 'hard' : 'normal'));
    }
  } catch (e) { setDiff('normal'); }

  loadImages();
  newGame();
})();
