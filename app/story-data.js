/* 猫が消えた街 〜cat on escape〜 の 台本（担当①）。形は docs/story-mode.md を 見る。 */
(() => {
  'use strict';

  /** 表情の 表を つくる。faces('nao', ['normal', 'happy']) → { normal: 'images/story/nao-normal.png', … } */
  function faces(key, list) {
    const out = {};
    list.forEach((f) => { out[f] = 'images/story/' + key + '-' + f + '.png'; });
    return out;
  }
  const HERO = ['normal', 'happy', 'surprised', 'serious'];
  const TAKO = ['normal', 'down'];

  window.STORY = {
    title: '猫が消えた街',
    subtitle: '〜cat on escape〜',

    cast: {
      nao:   { name: 'ナオ',     side: 'left',  height: 0.8, faces: faces('nao', HERO) },
      fumi:  { name: 'フミ',     side: 'right', height: 1,   faces: faces('fumi', HERO) },
      tako1: { name: 'タコ一郎', side: 'right', size: 0.75,  faces: faces('tako1', TAKO) },
      tako2: { name: 'タコ二郎', side: 'right', size: 0.75,  faces: faces('tako2', TAKO) },
      tako3: { name: 'タコ三郎', side: 'right', size: 0.75,  faces: faces('tako3', TAKO) },
      tako4: { name: 'タコ四郎', side: 'right', size: 0.75,  faces: faces('tako4', TAKO) },
      tako5: { name: 'タコ五郎', side: 'right', size: 0.75,  faces: faces('tako5', TAKO) },
      tako6: { name: 'タコ六郎', side: 'right', size: 0.75,  faces: faces('tako6', TAKO) },
      tako7: { name: 'タコ七郎', side: 'right', size: 0.75,  faces: faces('tako7', TAKO) },
      daiou: { name: 'タコ大王', side: 'right', height: 1,   faces: faces('daiou', ['normal', 'angry', 'down']) },
      chashiro: { name: 'ちゃしろ', side: 'right', size: 0.55, faces: { normal: 'images/face-chashiro.png' } },
    },

    backgrounds: {
      title:     { image: 'images/story/title.jpg',        color: '#2f5d3a' },
      lair:      { image: 'images/story/bg-lair.jpg',      color: '#1f4d52' },
      road:      { image: 'images/story/bg-road.jpg',      color: '#a8d4e6' },
      shotengai: { image: 'images/story/bg-shotengai.jpg', color: '#f2c37b' },
      roji:      { image: 'images/story/bg-roji.jpg',      color: '#8d8378' },
      park:      { image: 'images/story/bg-park.jpg',      color: '#9cc5a1' },
      river:     { image: 'images/story/bg-river.jpg',     color: '#e07b2a' },
      factory:   { image: 'images/story/bg-factory.jpg',   color: '#6b6259' },
      tunnel:    { image: 'images/story/bg-tunnel.jpg',    color: '#2b3440' },
      base:      { image: 'images/story/bg-base.jpg',      color: '#1f4d52' },
      ending:    { image: 'images/story/ending.jpg',       color: '#ffe36e' },
    },

    stages: [
      { name: 'いつもの 通学路', bg: 'road',      boss: 'tako1' },
      { name: '商店街',          bg: 'shotengai', boss: 'tako2' },
      { name: '路地裏',          bg: 'roji',      boss: 'tako3' },
      { name: '公園',            bg: 'park',      boss: 'tako4' },
      { name: '河川敷',          bg: 'river',     boss: 'tako5' },
      { name: '工場跡',          bg: 'factory',   boss: 'tako6' },
      { name: 'トンネル',        bg: 'tunnel',    boss: 'tako7' },
      { name: '悪の 秘密基地',   bg: 'base',      boss: 'daiou' },
    ],

    scenes: {
      // ───── オープニング：タコ大王の たくらみ ─────
      prologue: [
        { bg: 'lair', left: null, right: null, text: 'ここは 街の はずれ。\nうみの においが ただよう\nひみつの あじと。' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'ふっふっふ…\nついに この日が きたダコ！' },
        { left: 'tako1', who: 'tako1', face: 'normal', text: '大王さま、その あたまの\nみみは なんですタコ？' },
        { who: 'daiou', text: 'よくぞ きいたダコ。\nこれは ネコみみ。 この ひげも\nネコの しるしダコ！' },
        { who: 'daiou', text: 'タコと ネコ。 どちらも\n2文字で「コ」で おわる。\nつまり ほぼ おなじダコ！' },
        { who: 'tako1', text: 'ほぼ… おなじ…？\n（足の かずが\nぜんぜん ちがうタコ）' },
        { who: 'daiou', face: 'angry', text: 'だまるダコ！\n人間は ネコを なでて かわいがる。\nわしも なでられたいダコ！' },
        { who: 'daiou', face: 'normal', text: '街の ネコを みんな\nかくして しまえば、\nわしが ネコの かわりダコ！' },
        { who: 'tako1', text: 'でも どうやって\nネコを あつめるタコ？' },
        { who: 'daiou', text: 'にぼし、イカの ひもの、\nカニかま…\nうみの においで さそうダコ！' },
        { who: 'daiou', text: '一郎から 七郎まで、\n街じゅうに ちらばるダコ！\nネコを のこらず あじとへ！' },
        { left: null, text: 'こうして 街から\n猫が 1ぴき、また 1ぴきと\nきえて いった…' },
      ],

      // ───── 1面 いつもの 通学路 ─────
      stage1: [
        { bg: 'road', left: 'nao', right: 'fumi', text: 'つぎの あさ。\nいつもの 通学路。' },
        { who: 'fumi', face: 'happy', text: 'ナオ、おっはー！\nきょうも ちゃしろに\nあいさつ してこ！' },
        { who: 'nao', face: 'normal', text: 'おはよう、フミ。\nちゃしろは いつも\nあの ブロック塀の 上に…' },
        { who: 'nao', face: 'surprised', text: '…いない。' },
        { who: 'fumi', face: 'surprised', text: 'え、マジ？ ちゃしろ、\n毎朝 ぜったい ここで\nひなたぼっこ してるのに。' },
        { who: 'nao', face: 'serious', text: 'それに へんです。\nほかの 猫も 1ぴきも\n見かけません。' },
        { who: 'fumi', face: 'normal', text: 'てか なんか… にぼしの\nにおい しない？\nおなか すいてきた。' },
        { who: 'nao', text: 'それ、たぶん 手がかりです。\nおなかは あとで。' },
        { right: 'tako1', who: 'tako1', face: 'normal', text: 'ニャ、ニャーん。\nぼくは この 塀の\nネコですタコ。' },
        { who: 'nao', face: 'serious', text: '…語尾が「タコ」です。\nそれに 足が 8本 あります。' },
        { who: 'tako1', text: 'ば、ばれたタコ！\nここの ネコたちは 大王さまの\nために いただいたタコ！' },
        { who: 'fumi', face: 'serious', text: 'ちゃしろを かえして！\nナオ、いくよ！' },
        { who: 'nao', text: '猫の かおを そろえて、\nみんなを にがして\nあげましょう。' },
      ],

      clear1: [
        { bg: 'road', left: 'nao', right: 'tako1:down', who: 'tako1', face: 'down', text: 'う〜ん、ネコたちが\nみんな にげて\nしまったタコ〜！' },
        { who: 'fumi', face: 'happy', text: 'やったじゃん！\nでも ちゃしろは\nいなかったね…' },
        { who: 'tako1', text: 'あの 茶白の 子なら とっくに\n大王さまの ところタコ。\nおぼえてろタコ〜！' },
        { right: 'fumi', who: 'nao', face: 'serious', text: 'にげました。 見てください。\n道に にぼしが 点々と\n落ちています。' },
        { who: 'fumi', face: 'normal', text: 'ほんとだ。\n商店街の ほうに\nつづいてる じゃん。' },
        { who: 'fumi', face: 'happy', text: '…1本 たべて いい？' },
        { who: 'nao', face: 'normal', text: 'だめです。\n証拠です。' },
      ],

      // ───── 2面 商店街 ─────
      stage2: [
        { bg: 'shotengai', left: 'nao', right: 'fumi', text: 'にぼしの 線を たどって、\nふたりは 商店街へ。' },
        { who: 'fumi', face: 'surprised', text: 'うわ、魚の においが\nすっごい する！' },
        { who: 'nao', face: 'normal', text: 'あそこの 魚屋さん、\nきょうは お休みの\nはずです。' },
        { right: 'tako2', who: 'tako2', face: 'normal', text: 'へい らっしゃいタコ！\nきょうは にぼしが\n大安売りタコ〜！' },
        { who: 'nao', face: 'serious', text: 'はちまきを しめた タコが、\n魚屋さんの まねを\nしています。' },
        { who: 'tako2', text: 'ほら ネコちゃんたち、\nいい においタコ？\nこっち おいでタコ〜。' },
        { who: 'fumi', face: 'surprised', text: 'ちょ、猫が めっちゃ\nあつまってるし！\nあと なんか 人も 並んでる。' },
        { who: 'nao', face: 'normal', text: 'ふつうに お客さんが\n来ています。' },
        { who: 'tako2', text: 'まいど ありタコ！\n…じゃなかった。 ネコは\nぜんぶ 大王さまの ものタコ！' },
        { who: 'fumi', face: 'serious', text: 'お店ごっこ してる\nばあいじゃ ないって！' },
        { who: 'nao', face: 'serious', text: 'いきましょう。\n猫たちを 右へ にがします。' },
      ],

      clear2: [
        { bg: 'shotengai', left: 'nao', right: 'tako2:down', who: 'tako2', face: 'down', text: 'ああっ、売りものの\nにぼしも ネコも\nぜんぶ にげたタコ…' },
        { who: 'tako2', text: '大王さまに\nしかられるタコ〜！\nにげろタコ〜！' },
        { who: 'nao', face: 'surprised', text: '…地面に まるい あとが\nならんでいます。' },
        { right: 'fumi', who: 'fumi', face: 'surprised', text: 'なにこれ、水玉もよう？\nかわいい じゃん。' },
        { who: 'nao', face: 'serious', text: '吸盤の 足あとです。\nせまい 路地の おくへ\nつづいています。' },
        { who: 'fumi', face: 'happy', text: 'スタンプラリー みたいで\nちょっと たのしく\nなってきた。' },
      ],

      // ───── 3面 路地裏 ─────
      stage3: [
        { bg: 'roji', left: 'nao', right: 'fumi', text: '吸盤の 足あとを おって、\nうす暗い 路地裏へ。' },
        { who: 'fumi', face: 'normal', text: 'せまっ！ アタシ\nかべに かたが\nこすれるんだけど。' },
        { who: 'nao', face: 'normal', text: 'わたしは よゆうです。' },
        { who: 'fumi', face: 'surprised', text: 'ずるい！' },
        { who: 'nao', face: 'serious', text: 'しっ。 あの ダンボール箱、\nいま うごきました。' },
        { text: 'ダンボール箱には\n大きく「ネコ」と\n書いて ある。' },
        { right: 'tako3', who: 'tako3', face: 'normal', text: 'ここには ネコしか\nいないタコ…。\nタコは いないタコ…。' },
        { who: 'nao', text: '箱から 足が 8本\nでています。' },
        { who: 'tako3', text: 'し、しまったタコ！\nかくれんぼ名人の タコ三郎が\n見つかるとは…！' },
        { who: 'tako3', text: 'でも 箱の 中の\nネコたちは\nわたさないタコ！' },
        { who: 'fumi', face: 'serious', text: 'かくれんぼ なら\nつぎは アタシらが オニね。\nぜんいん 見つけて にがす！' },
      ],

      clear3: [
        { bg: 'roji', left: 'nao', right: 'tako3:down', who: 'tako3', face: 'down', text: '箱が ぜんぶ\nからっぽタコ〜…' },
        { who: 'tako3', text: 'こ、こうなったら\nつぎの かくれがへ\nにげるタコ〜！' },
        { who: 'nao', face: 'normal', text: '…なにか 落として\nいきました。' },
        { right: 'fumi', who: 'fumi', face: 'normal', text: 'イカの ひものと…\n紙きれ？' },
        { who: 'nao', face: 'serious', text: '地図の 切れはしです。\n公園の 池に\nしるしが あります。' },
        { who: 'fumi', face: 'happy', text: 'イカは アタシが\nあずかっとくね。' },
        { who: 'nao', face: 'normal', text: 'あずかるだけ ですよ。' },
      ],

      // ───── 4面 公園 ─────
      stage4: [
        { bg: 'park', left: 'nao', right: 'fumi', text: '地図を たよりに、\nふたりは 公園へ\nやってきた。' },
        { who: 'fumi', face: 'happy', text: '公園 ひさびさ〜！\nすべり台 すべって いい？' },
        { who: 'nao', face: 'normal', text: 'あとで いっしょに\nすべりましょう。' },
        { who: 'nao', face: 'surprised', text: '…ベンチの 前に\nなにか います。' },
        { right: 'tako4', who: 'tako4', face: 'normal', text: 'ピクニック びよりタコ〜。\nカニかまを どうぞタコ。\nネコちゃんも、ハトさんも。' },
        { text: 'ベンチの まわりには 猫と…\nそれ いじょうの ハトが\nあつまって いた。' },
        { who: 'tako4', text: 'ハトは よんで ないタコ！\nつつかないでタコ〜！' },
        { who: 'fumi', face: 'surprised', text: 'ハトに めっちゃ\nモテてる じゃん。\nウケる。' },
        { who: 'nao', face: 'serious', text: 'いまの うちです。\n猫たちを にがしましょう。' },
        { who: 'tako4', text: 'あっ、まつタコ！\nネコは 大王さまへの\nおみやげタコ〜！' },
      ],

      clear4: [
        { bg: 'park', left: 'nao', right: 'tako4:down', who: 'tako4', face: 'down', text: 'ネコは にげたし、\nカニかまは ハトに\nとられたタコ…' },
        { who: 'nao', face: 'serious', text: '大王さまは\nどこに いますか。' },
        { who: 'tako4', text: 'い、いえないタコ！\n…でも 五郎なら 川で\nつりを してるタコ。' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'いっちゃってるし！\nやさしい タコじゃん。' },
        { who: 'tako4', text: 'しまったタコ〜！' },
        { who: 'nao', face: 'serious', text: '川… 河川敷ですね。\nいきましょう。' },
      ],

      // ───── 5面 河川敷 ─────
      stage5: [
        { bg: 'river', left: 'nao', right: 'fumi', text: '夕やけの 河川敷。\n川風が きもちいい。' },
        { who: 'fumi', face: 'normal', text: 'あ、見て。\nつりを してる 人が いる。' },
        { who: 'nao', face: 'serious', text: '人… でしょうか。\n竿を 4本 いっぺんに\nもって います。' },
        { right: 'tako5', who: 'tako5', face: 'normal', text: 'つれるタコ、つれるタコ〜。\nはりの 先には\nとくせい カニかまタコ。' },
        { who: 'nao', text: '魚では なく、\n猫を つって います。' },
        { who: 'tako5', text: 'ぱくっと くいついたら\nかごの 中へ ごあんないタコ。\n大りょうタコ〜！' },
        { who: 'fumi', face: 'surprised', text: 'え、アタシも\nつられそう なんだけど。\nカニかま すき。' },
        { who: 'nao', face: 'normal', text: 'フミ、はりに\n近づかないで ください。' },
        { who: 'tako5', text: 'じゃまする なら\nおまえたちも\nつりあげるタコ！' },
        { who: 'nao', face: 'serious', text: 'かごを あけて、\n猫たちを 川ぞいに\nにがします。' },
      ],

      clear5: [
        { bg: 'river', left: 'nao', right: 'tako5:down', who: 'tako5', face: 'down', text: 'かごが からっぽタコ…\nきょうは ボウズタコ〜。' },
        { who: 'tako5', text: 'もう しらないタコ！\nあとは 工場の 六郎に\nまかせるタコ〜！' },
        { right: null, text: 'タコ五郎は 竿を かついで\n川に とびこんで いった。' },
        { right: 'fumi', who: 'fumi', face: 'serious', text: '工場って、あの\n川の むこうの えんとつ？' },
        { who: 'nao', face: 'serious', text: 'はい。 いまは つかわれて\nいない 工場跡です。\nでも 煙が 出ています。' },
        { who: 'fumi', face: 'surprised', text: 'つかわれて ないのに？\nあやしすぎ でしょ。' },
      ],

      // ───── 6面 工場跡 ─────
      stage6: [
        { bg: 'factory', left: 'nao', right: 'fumi', text: '古い 工場跡。\nガタン、ゴトンと なにかが\nうごく 音が する。' },
        { who: 'nao', face: 'surprised', text: 'ベルトコンベアが\nうごいて います。' },
        { who: 'fumi', face: 'surprised', text: 'のってるの ぜんぶ\nにぼし じゃん！\nにぼしの 川！' },
        { right: 'tako6', who: 'tako6', face: 'normal', text: 'にぼし、ヨシ！\nネコ、ヨシ！\nきょうも 安全 だいいちタコ！' },
        { who: 'nao', face: 'normal', text: 'ヘルメットを かぶった\nタコです。\n指さし確認も しています。' },
        { who: 'tako6', text: 'にぼしで ネコを のせて、\nそのまま 大王さまの\nもとへ はこぶタコ！' },
        { who: 'fumi', face: 'normal', text: '8本の 足で ぜんぶ\n指さし してるから、\nどこも「ヨシ！」じゃん。' },
        { who: 'nao', text: '…たしかに、\nどこも 見て いません。' },
        { who: 'tako6', text: '見てるタコ！\nしつれいタコ！' },
        { who: 'nao', face: 'serious', text: 'コンベアの 猫たちを\nおろして、にがしましょう。' },
      ],

      clear6: [
        { bg: 'factory', left: 'nao', right: 'tako6:down', who: 'tako6', face: 'down', text: 'コンベア 停止タコ…\n本日の さぎょう、\nしゅうりょうタコ…' },
        { who: 'nao', face: 'serious', text: 'この コンベア、\nどこへ つづいて いますか。' },
        { who: 'tako6', text: '…うら山の トンネルタコ。\nでも 七郎が まもってるから\n通れないタコ！' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: '教えてくれて サンキュ！\n安全 だいいちで\nかえりなね。' },
        { who: 'tako6', text: 'ヨ、ヨシ… タコ。' },
      ],

      // ───── 7面 トンネル ─────
      stage7: [
        { bg: 'tunnel', left: 'nao', right: 'fumi', text: 'コンベアの あとを たどり、\nまっくらな トンネルへ。' },
        { who: 'fumi', face: 'surprised', text: 'くらっ！\nナオ、どこ？ いる？' },
        { who: 'nao', face: 'normal', text: 'ここです。\nフミの カーディガンを\nつかんで います。' },
        { who: 'fumi', face: 'happy', text: 'スマホの ライト つけよ。\n…あ、自撮りモード だった。' },
        { who: 'nao', face: 'serious', text: '奥から 声が します。' },
        { right: 'tako7', who: 'tako7', face: 'normal', text: 'ここから さきは\n通さないタコ…\n通さないタコ…（こだま）' },
        { who: 'tako7', text: 'ボクは タコ七郎。\nくらやみで スミを はけば、\nだれも 前が 見えないタコ！' },
        { who: 'nao', face: 'normal', text: 'もともと まっくら なので、\nあまり かわりません。' },
        { who: 'tako7', text: '……ほんとタコ。' },
        { who: 'fumi', face: 'serious', text: 'しかも 奥で 猫の\n声が する！\nぜったい 助けるから！' },
        { who: 'nao', face: 'serious', text: 'いきましょう。\n猫たちを 出口の ほうへ\nにがします。' },
      ],

      clear7: [
        { bg: 'tunnel', left: 'nao', right: 'tako7:down', who: 'tako7', face: 'down', text: 'スミが ぜんぶ\nなくなったタコ…\nまっしろタコ…' },
        { who: 'tako7', text: 'おくの 鉄の とびらが\n大王さまの 秘密基地タコ。\n合言葉は「ニャー」タコ…' },
        { right: 'fumi', who: 'fumi', face: 'surprised', text: '合言葉まで\n教えて くれるんだ。' },
        { who: 'tako7', text: 'ボクたち ほんとは…\nネコを かくすの\nちょっと さみしかったタコ。' },
        { who: 'nao', face: 'serious', text: '…いよいよ ですね。\nちゃしろも きっと\nこの 先です。' },
        { who: 'fumi', face: 'serious', text: 'よし。 いこ、ナオ。' },
      ],

      // ───── 8面 悪の 秘密基地 ─────
      stage8: [
        { bg: 'base', left: 'nao', right: 'fumi', text: '「ニャー」で とびらが ひらいた。\nおくは うみの においで\nいっぱいの 秘密基地。' },
        { who: 'fumi', face: 'surprised', text: 'すご… おりが いっぱい。\n猫が めっちゃ いる！' },
        { who: 'nao', face: 'surprised', text: 'あっ、あの おりの 中…\nちゃしろ です！' },
        { right: 'chashiro', who: 'chashiro', text: 'ニャー！' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'よく 来たダコ、人間ども。\nわしこそ この街の あたらしい\nネコ、タコ大王ダコ！' },
        { who: 'nao', face: 'serious', text: 'ネコみみを つけた\nタコ です。' },
        { who: 'fumi', face: 'normal', text: 'ひげ、マジックで\n描いてる よね？\nちょっと にじんでるし。' },
        { who: 'daiou', face: 'angry', text: 'にじんで ないダコ！\nこれは 天然の\nひげダコ！' },
        { who: 'nao', face: 'normal', text: '汗で 流れて います。' },
        { who: 'daiou', text: 'ええい、うるさいダコ！\nネコは ぜんぶ わしの もの。\n1ぴきも かえさんダコ！' },
        { who: 'fumi', face: 'serious', text: 'ちゃしろも みんなも\nかえして もらうから！' },
        { who: 'nao', face: 'serious', text: '最後です。\nぜんぶの おりから\n猫たちを にがします！' },
      ],

      clear8: [
        { bg: 'base', left: 'nao', right: 'daiou:down', who: 'daiou', face: 'down', text: 'ネコが… ぜんぶ\nにげて しまったダコ…' },
        { text: 'タコ大王の 頭から\nネコみみが ぽろりと 落ちた。' },
        { who: 'daiou', text: 'わしは ただ… ネコみたいに、\n人間に なでて ほしかった\nだけダコ…' },
        { who: 'nao', face: 'normal', text: 'それなら 猫の まねを\nしなくても いいと\n思います。' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'そうそう！ タコの ままでも\n丸くて かわいい じゃん。' },
        { who: 'daiou', text: 'か、かわいい…？\nわしが…？' },
        { who: 'nao', face: 'happy', text: 'はい。 商店街の\n人たちに 会って\nみませんか。' },
      ],

      // ───── エンディング ─────
      ending: [
        { bg: 'ending', left: null, right: null, text: 'それから しばらく たった\nある日の あさ。' },
        { text: '街には 猫たちが もどり、\n塀の 上や 軒下で\nのんびり あくびを している。' },
        { left: 'nao', right: 'fumi', who: 'fumi', face: 'happy', text: 'ナオ、おっはー！\nきのうの 商店街の\nニュース 見た？' },
        { who: 'nao', face: 'happy', text: 'はい。「商店街の マスコット、\nタコちゃん」。\n大人気 だそうです。' },
        { right: 'daiou', who: 'daiou', face: 'normal', text: 'おはようダコ！\nきょうも 商店街を\nよろしく たのむダコ〜！' },
        { who: 'nao', face: 'normal', text: 'ネコみみ、もう\nつけて いないんですね。' },
        { who: 'daiou', text: 'うむ。 わしは タコ。\nタコの ままで\nなでて もらえるダコ。' },
        { who: 'daiou', text: '手下たちも 魚屋さんや\n工場の 見学ツアーで\nはたらいて いるダコ。' },
        { who: 'fumi', face: 'happy', text: '二郎の 魚屋ごっこ、\nほんとに お店に なったんだ。\nウケる。' },
        { who: 'nao', face: 'normal', text: 'ひげは まだ\n描いて いますね。' },
        { who: 'daiou', text: 'これは… おしゃれダコ。' },
        { right: 'fumi', who: 'fumi', face: 'surprised', text: 'あっ！ ナオ、見て！\n塀の 上！' },
        { right: 'chashiro', who: 'chashiro', text: 'ニャ〜ン。' },
        { who: 'nao', face: 'happy', text: 'ちゃしろ。\nおかえりなさい。' },
        { right: 'fumi', who: 'fumi', face: 'happy', text: 'やっぱ 朝は ちゃしろに\nあいさつ しないと\nはじまらない よね！' },
        { who: 'nao', face: 'happy', text: 'はい。\nいってきます、ちゃしろ。' },
        { left: null, right: null, text: 'こうして 街に\nいつもの あさが もどった。\n―― おしまい ――' },
      ],
    },
  };
})();
