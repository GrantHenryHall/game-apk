/* Critter Arena 4 — the Sunshine Region: towns, routes, interiors, people, trainers and items.
 * Maps are rows of tile characters (see worldart.js): . grass  , tall grass  : path  s sand  ~ water
 * = bridge  f flowers  L ledge  T/P/A trees  b bush  r rock  F fence  n sign  c/C cave  k crystal
 * y/Q sky walkway/clouds  w floor  W wall  D exit mat  K counter  B books  S shelf  p plant  t table
 * M machine  O pc  Z sofa  H bed  V tv  u rug  g/G gym floor  X statue. Buildings sit on top as objects. */
(function (root) {
  var CA = root.CA, SP = CA.SPECIES;

  // ---- items -----------------------------------------------------------------------------------
  CA.ITEMS = {
    capsule: { name: 'Capsule', price: 200, ball: 1, desc: 'A standard capture capsule. Throw it at a weakened wild critter.' },
    great: { name: 'Great Capsule', price: 600, ball: 1.6, desc: 'A sturdier capsule with better odds of a catch.' },
    ultra: { name: 'Ultra Capsule', price: 1200, ball: 2.2, desc: 'The best capsule money can buy.' },
    candy: { name: 'Rare Candy', price: 1500, desc: 'A sweet treat that raises one critter by a level.' },
    repel: { name: 'Repel', price: 350, steps: 100, desc: 'Keeps wild critters out of your way for 100 steps.' }
  };
  CA.BALLS = ['capsule', 'great', 'ultra'];

  // ---- how people look ----------------------------------------------------------------------------
  CA.LOOKS = {
    youngster: { skin: '#ffd2a6', hair: '#3a2a1e', style: 'short', cap: '#3d8bff', shirt: '#ffcf3a', pants: '#3b6cc9', pack: null },
    lass: { skin: '#ffe0bd', hair: '#ff8a5b', style: 'long', cap: null, shirt: '#ff9ad0', pants: '#5b49c9', pack: null },
    bug: { skin: '#f2c193', hair: '#3a2a1e', style: 'short', cap: '#f2d27a', capStyle: 'straw', band: '#45c25a', shirt: '#9be36b', pants: '#7a4f2a', pack: null },
    camper: { skin: '#e8a679', hair: '#6b3d1f', style: 'spiky', cap: '#45c25a', shirt: '#d9773e', pants: '#4a3f30', pack: '#5aa36a' },
    picnicker: { skin: '#ffd6b0', hair: '#6b3d1f', style: 'twin', cap: null, shirt: '#7ad65a', pants: '#ffcf3a', pack: null },
    hiker: { skin: '#c98d62', hair: '#3a3a3a', style: 'short', cap: '#b05a3a', capStyle: 'beanie', shirt: '#9c8460', pants: '#4a3f30', pack: '#d9773e' },
    swimmer: { skin: '#f5c59c', hair: '#3a2a1e', style: 'short', cap: '#3aa2ff', capStyle: 'beanie', shirt: '#3aa2ff', pants: '#1a5fb0', pack: null },
    swimmerf: { skin: '#ffe0bd', hair: '#ffd23f', style: 'long', cap: null, shirt: '#ff4d5e', pants: '#ff4d5e', pack: null },
    fisher: { skin: '#e8a679', hair: '#8a8a8a', style: 'short', cap: '#ffd23f', shirt: '#5c8dff', pants: '#4a3f30', pack: null },
    sailor: { skin: '#f2c193', hair: '#3a2a1e', style: 'short', cap: '#ffffff', shirt: '#ffffff', pants: '#1d4fb0', pack: null },
    psychic: { skin: '#f7d9c4', hair: '#a45cff', style: 'long', cap: null, shirt: '#5a3fb0', pants: '#2b1f33', pack: null },
    psychicm: { skin: '#f0c9a5', hair: '#2b1f33', style: 'spiky', cap: null, shirt: '#a45cff', pants: '#2b1f33', pack: null },
    ace: { skin: '#ffd2a6', hair: '#2b1f33', style: 'spiky', cap: null, shirt: '#ff4d5e', pants: '#2b3a66', pack: null },
    acef: { skin: '#ffe3c8', hair: '#3d8bff', style: 'long', cap: null, shirt: '#ffffff', pants: '#3d8bff', pack: null },
    twins: { skin: '#ffd6b0', hair: '#ff5fa2', style: 'twin', cap: null, shirt: '#ff9ad0', pants: '#5b49c9', pack: null },
    worker: { skin: '#c98d62', hair: '#3a2a1e', style: 'short', cap: '#ffd23f', shirt: '#ff8a3d', pants: '#4a4f59', pack: null },
    engineer: { skin: '#f2c193', hair: '#ffd21f', style: 'spiky', cap: null, shirt: '#ffe14a', pants: '#1f2a66', glasses: true, pack: null },
    gardener: { skin: '#ffe0bd', hair: '#3f9a4a', style: 'bun', cap: '#f2d27a', capStyle: 'straw', band: '#ff9ad0', shirt: '#9be36b', pants: '#7a4f2a', pack: null },
    beauty: { skin: '#ffe3c8', hair: '#ffd23f', style: 'long', cap: null, shirt: '#a45cff', pants: '#ff9ad0', pack: null },
    blackbelt: { skin: '#c98d62', hair: '#2b1f33', style: 'short', cap: null, shirt: '#ffffff', pants: '#ffffff', pack: null },
    rocker: { skin: '#f2c193', hair: '#2b1f33', style: 'spiky', cap: null, shirt: '#2b2b33', pants: '#4a4f59', glasses: true, pack: null },
    nurse: { skin: '#ffe0bd', hair: '#ff8ab0', style: 'bun', cap: '#ffffff', capStyle: 'nurse', shirt: '#ffffff', pants: '#ff9ad0', pack: null },
    clerk: { skin: '#f2c193', hair: '#3a2a1e', style: 'short', cap: '#4f8dff', shirt: '#4f8dff', pants: '#2b3a66', pack: null },
    mom: { skin: '#ffe0bd', hair: '#6b3d1f', style: 'bun', cap: null, shirt: '#ff9ad0', pants: '#5b49c9', pack: null },
    oldman: { skin: '#f2c193', hair: '#dfe6ef', style: 'short', cap: null, shirt: '#8a7a6a', pants: '#4a3f30', pack: null },
    granny: { skin: '#ffe0bd', hair: '#dfe6ef', style: 'bun', cap: null, shirt: '#b98ad9', pants: '#6a5a8a', pack: null },
    girl: { skin: '#ffd6b0', hair: '#e8c060', style: 'twin', cap: null, shirt: '#ffcf3a', pants: '#ff6a5e', pack: null },
    boy: { skin: '#e8a679', hair: '#3a2a1e', style: 'spiky', cap: '#ff4d5e', shirt: '#45c25a', pants: '#3b6cc9', pack: null },
    guard: { skin: '#f2c193', hair: '#3a2a1e', style: 'short', cap: '#1d4fb0', shirt: '#3d6fb0', pants: '#2b3a66', pack: null },
    scientist: { skin: '#f0c9a5', hair: '#3a3a3a', style: 'short', cap: null, shirt: '#ffffff', pants: '#3a7f8a', glasses: true, pack: null }
  };
  function lk(look) { var o = {}; for (var k in look) o[k] = look[k]; o.pack = null; return o; }

  // ---- trainers ------------------------------------------------------------------------------------
  var CLS = {
    YOUNGSTER: { look: 'youngster', base: 16 }, LASS: { look: 'lass', base: 16 }, 'BUG CATCHER': { look: 'bug', base: 12 },
    CAMPER: { look: 'camper', base: 20 }, PICNICKER: { look: 'picnicker', base: 20 }, HIKER: { look: 'hiker', base: 32 },
    SWIMMER: { look: 'swimmer', base: 18 }, FISHER: { look: 'fisher', base: 30 }, SAILOR: { look: 'sailor', base: 30 },
    PSYCHIC: { look: 'psychic', base: 30 }, MEDIUM: { look: 'psychicm', base: 30 }, 'ACE TRAINER': { look: 'ace', base: 55 },
    TWINS: { look: 'twins', base: 30 }, WORKER: { look: 'worker', base: 30 }, ENGINEER: { look: 'engineer', base: 40 },
    GARDENER: { look: 'gardener', base: 30 }, BEAUTY: { look: 'beauty', base: 40 }, BLACKBELT: { look: 'blackbelt', base: 35 },
    ROCKER: { look: 'rocker', base: 35 }, HOTHEAD: { look: 'ace', base: 30 }
  };
  // id, class, name, position, facing (0 down 1 left 2 right 3 up), sight, team, level, lines
  function tr(id, cls, name, x, y, dir, sight, team, lv, say, lose, look) {
    var C = CLS[cls];
    return { id: id, kind: 'trainer', cls: cls, name: name, x: x, y: y, dir: dir, sight: sight, team: team, lv: lv,
      look: look ? CA.LOOKS[look] : CA.LOOKS[C.look], say: say, lose: lose, after: [lose],
      money: C.base * lv, skill: Math.min(0.75, 0.08 + lv * 0.024) };
  }

  // ---- gyms -------------------------------------------------------------------------------------------
  var GYMS = {
    pip: { lv: 6, n: 3, roof: '#7fd36b', floorA: '#eef9e6', floorA2: '#e3f4d8', floorB: '#bfe9a8' },
    coral: { lv: 9, n: 4, roof: '#3aa2ff', floorA: '#e6f4ff', floorA2: '#d8ecff', floorB: '#9bd2ff' },
    blaze: { lv: 12, n: 5, roof: '#ff6a2a', floorA: '#fff1e5', floorA2: '#ffe5d0', floorB: '#ffb48a' },
    ivy: { lv: 15, n: 6, roof: '#45c25a', floorA: '#ecfbe5', floorA2: '#ddf5d2', floorB: '#a6ec9c' },
    volt: { lv: 17, n: 6, roof: '#ffc61f', floorA: '#fffbe3', floorA2: '#fff3c6', floorB: '#ffe789' },
    granite: { lv: 19, n: 7, roof: '#b0946a', floorA: '#f5f0e8', floorA2: '#ebe3d6', floorB: '#e2cfa8' },
    mystica: { lv: 21, roof: '#a45cff', floorA: '#f4ecff', floorA2: '#e9ddff', floorB: '#d6b3ff' },
    twins: { lv: 23, roof: '#ff5fa2', floorA: '#fff0f6', floorA2: '#ffe4f0', floorB: '#ffb3d0' }
  };
  CA.GYMS = GYMS;
  function trainerById(id) { for (var i = 0; i < CA.TRAINERS.length; i++) if (CA.TRAINERS[i].id === id) return CA.TRAINERS[i]; return null; }
  function leader(gid, x, y, extra) {
    var T = trainerById(gid), G = GYMS[gid] || {};
    var lvl = extra && extra.lv || G.lv;
    var o = { id: 'L_' + gid, kind: 'trainer', leader: gid, cls: extra && extra.cls || 'LEADER', name: T.name.toUpperCase(), x: x, y: y, dir: 0, sight: 0,
      team: T.deck.slice(0, G.n || 8), lv: lvl, look: lk(T.look), skill: T.skill,
      say: [T.name.toUpperCase() + ': ' + T.intro, 'I am ' + T.name.toUpperCase() + ', the ' + T.title.toUpperCase() + '!'], lose: T.lose, win: T.win,
      after: [T.name.toUpperCase() + ': ' + T.lose, 'Keep going. The next GYM is waiting for you!'], money: lvl * 100 };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  // a gym leader's building and its insides
  function gymB(x, y, gid, trainers) {
    var T = trainerById(gid);
    return { kind: 'gym', x: x, y: y, door: 2, roof: GYMS[gid].roof, badge: T.badge, gym: gid, trainers: trainers };
  }

  // ---- building interiors ------------------------------------------------------------------------------------
  function spawnOf(rows) { for (var y = 0; y < rows.length; y++) { var x = rows[y].indexOf('D'); if (x >= 0) return [x, y]; } return [1, 1]; }
  var INTERIOR = {
    house: function (b) {
      var rows = ['WWWWWWWW', 'WWWWWWWW', 'BBwwwVwp', 'wwwwwwww', 'wwwtwwww', 'wwwwwwww', 'pwwwwwwZ', 'wwwDwwww'];
      return { kind: 'house', rows: rows, npcs: (b.inside && b.inside.npcs) || [], music: 'town' };
    },
    center: function (b, out) {
      var rows = ['WWWWWWWWWWW', 'WWWWWWWWWWW', 'pwwBMwMBwOp', 'wwwKKKKKwww', 'wwwwwwwwwww', 'wZwwwuwwwZw', 'wZwwwuwwwZw', 'wwwwwuwwwww', 'wwwwwDwwwww'];
      var npcs = [{ id: 'nurse', kind: 'nurse', x: 5, y: 2, dir: 0, look: CA.LOOKS.nurse }].concat((b.inside && b.inside.npcs) || []);
      return { kind: 'center', rows: rows, npcs: npcs, music: 'center' };
    },
    mart: function (b, out) {
      var rows = ['WWWWWWWWW', 'WWWWWWWWW', 'SSwwwSSwS', 'SwKwwwwww', 'SSwwwSSwS', 'wwwwwwwww', 'pwwwwwwwp', 'wwwwDwwww'];
      var npcs = [{ id: 'clerk', kind: 'clerk', x: 1, y: 3, dir: 2, look: CA.LOOKS.clerk }].concat((b.inside && b.inside.npcs) || []);
      return { kind: 'mart', rows: rows, npcs: npcs, music: 'center', shop: out.shop || ['capsule', 'repel'] };
    },
    lab: function (b) {
      var rows = ['WWWWWWWWWWW', 'WWWWWWWWWWW', 'MMwwwwwwBBB', 'wwwwwwwwwww', 'wwwwtwtwwww', 'wwwwwwwwwww', 'BBBwwwwwBBB', 'wwwwwwwwwww', 'pwwwwwwwwwp', 'wwwwwDwwwww'];
      var npcs = [{ id: 'prof', kind: 'prof', x: 5, y: 3, dir: 0, look: lk(CA.PROF.look) },
        { id: 'aide1', kind: 'talk', x: 1, y: 7, dir: 2, look: CA.LOOKS.scientist, wander: 1, lines: ['I study how critters change when they EVOLVE in battle.', 'Only critters that have fought hard enough can evolve. Tap the gold badge over them!'] },
        { id: 'aide2', kind: 'talk', x: 9, y: 5, dir: 1, look: CA.LOOKS.scientist, lines: ['Did you know? Every critter has a TYPE.', 'FIRE beats LEAF, LEAF beats STONE, STONE beats SPARK, SPARK beats WATER and WATER beats FIRE!'] }];
      return { kind: 'lab', rows: rows, npcs: npcs, music: 'town' };
    },
    gym: function (b) {
      var gid = b.gym, G = GYMS[gid], T = trainerById(gid);
      var rows = ['WWWWWWWWWWW', 'WWWWWWWWWWW', 'pgggggggggp', 'ggggGGGgggg', 'gggggGggggg', 'gggggGggggg', 'gggggGggggg', 'gggggGggggg', 'pggggGggggp', 'gggggGggggg', 'gggggGggggg', 'gggggGggggg', 'gXgggGgggXg', 'gggggGggggg', 'gggggDggggg'];
      var npcs = [leader(gid, 5, 2)].concat(b.trainers || []);
      return { kind: 'gym', gym: true, rows: rows, npcs: npcs, music: 'gym', env: 'gym', theme: { floorA: G.floorA, floorA2: G.floorA2, floorB: G.floorB, col: G.roof },
        leaderName: T.name.toUpperCase(), leaderId: 'L_' + gid };
    }
  };

  // ---- small helpers for writing maps -------------------------------------------------------------------------
  function put(rows, x, y, str) { var r = rows[y]; rows[y] = r.slice(0, x) + str + r.slice(x + str.length); }
  var SKEL = [
    'TTTTTTTTT::TTTTTTTTT',
    'T........::........T',
    'T........::........T',
    'T........::........T',
    'T........::........T',
    'T........::........T',
    'T....:...::....:...T',
    'T....:::::::::::...T',
    'T........::........T',
    'T........::........T',
    'T........::........T',
    'T........::........T',
    'T........::........T',
    'T..:.....::........T',
    'T..:::::::::::::...T',
    'T........::........T',
    'T........::........T',
    'T........::........T',
    'T........::........T',
    'TTTTTTTTT::TTTTTTTTT'
  ];
  // a gym town: CRITTER CENTER and MART up top, a house and the GYM below
  function town(o) {
    var rows = SKEL.slice();
    (o.deco || []).forEach(function (d) { put(rows, d[0], d[1], d[2]); });
    var b = [
      { kind: 'center', x: 3, y: 3, door: 2, inside: { npcs: o.centerNpcs || [] } },
      { kind: 'mart', x: 14, y: 3, door: 1, inside: { npcs: o.martNpcs || [] } },
      { kind: 'house', x: 2, y: 10, door: 1, roof: o.roof || '#5c8dff', inside: { npcs: o.houseNpcs || [] } },
      gymB(12, 10, o.gym, o.gymTrainers)
    ];
    put(rows, 8, 17, 'n'); put(rows, 17, 14, 'n');
    var T = trainerById(o.gym);
    var signs = [{ x: 8, y: 17, text: o.sign }, { x: 17, y: 14, text: [o.name + ' GYM', 'LEADER: ' + T.name.toUpperCase(), 'The ' + T.title.toUpperCase() + '!'] }].concat(o.signs || []);
    return { name: o.name, rows: rows, music: o.music || 'town', buildings: b, npcs: o.npcs || [], signs: signs, items: o.items || [], conns: o.conns, shop: o.shop, border: o.border };
  }

  // ======================================================================================================
  // THE MAPS
  // ======================================================================================================
  var MAPS = {};

  MAPS.sunny = {
    name: 'SUNNY TOWN', music: 'town', conns: { n: { to: 'r1' } },
    rows: [
      'TTTTTTTTT::TTTTTTTTT',
      'T........::........T',
      'T.f......::......f.T',
      'T........::........T',
      'T........::........T',
      'T........::........T',
      'T..:.....::...:....T',
      'T..::::::::::::....T',
      'T......n.::........T',
      'T..ff....::....ff..T',
      'T........::........T',
      'T........::........T',
      'T.~~~~...::........T',
      'Ts~~~~s..::........T',
      'T.s~~s...::::::::..T',
      'T..ss.....f....f...T',
      'T.f..F.F..b.b......T',
      'TTTTTTTTTTTTTTTTTTTT'
    ],
    buildings: [
      { kind: 'house', x: 2, y: 3, door: 1, roof: '#ff6a5e', inside: { npcs: [
        { id: 'mom', kind: 'mom', x: 5, y: 4, dir: 1, look: CA.LOOKS.mom },
        { id: 'momPet', kind: 'talk', x: 2, y: 5, dir: 2, critter: 'fuzzlets', wander: 1, lines: ['FUZZLETS: Fuzz fuzz! Fuzzzz!'] }] } },
      { kind: 'house', x: 13, y: 3, door: 1, roof: '#5c8dff', inside: { npcs: [
        { id: 'sis', kind: 'talk', x: 4, y: 4, dir: 0, look: CA.LOOKS.girl, lines: function (sv) { return ['Hi ' + sv.name + '! ' + sv.rival + ' left in such a hurry this morning...', 'My sibling is SO competitive. Please go easy on them!']; } }] } },
      { kind: 'lab', x: 11, y: 11, door: 1 }
    ],
    signs: [{ x: 7, y: 8, text: ['SUNNY TOWN', 'Shades of your adventure begin here!'] }],
    npcs: [
      { id: 'st1', kind: 'talk', x: 6, y: 10, dir: 0, look: CA.LOOKS.girl, wander: 2, emotes: ['note'], lines: ['Technology is amazing! A capsule can hold a critter of ANY size!'] },
      { id: 'st2', kind: 'talk', x: 16, y: 9, dir: 1, look: CA.LOOKS.oldman, spin: [0, 1, 3], lines: ['Wild critters hide in TALL GRASS. Walk through it and one might jump out at you!', 'Weaken it first, then throw a CAPSULE. Don\'t knock it out, mind!'] },
      { id: 'stPet', kind: 'talk', x: 14, y: 9, dir: 0, critter: 'sproutle', wander: 2, lines: ['SPROUTLE: Sprou~! It wiggles its leaf at you.'] }
    ],
    items: [{ id: 'i_sunny1', x: 1, y: 16, item: 'capsule', n: 1 }]
  };

  MAPS.r1 = {
    name: 'ROUTE 1', music: 'route', env: 'meadow', wild: 'r1', conns: { s: { to: 'sunny' }, n: { to: 'pebble' } },
    rows: [
      'TTTTTTTTT::TTTTTTTTT',
      'TA.......::......ATT',
      'T..,,,...::...,,,..T',
      'T..,,,...::...,,,..T',
      'T........::........T',
      'TTTTb....::....bTTTT',
      'T........::........T',
      'T.f...,,,::,,,...f.T',
      'T.....,,,::,,,.....T',
      'TLLLLL...::...LLLLLT',
      'T........::........T',
      'T..n.....::........T',
      'T,,,,,.TT::TT.,,,,,T',
      'T,,,,,.TT::TT.,,,,,T',
      'T........::........T',
      'T..b.....::.....b..T',
      'T........::........T',
      'TT,,,,,,,,,,,,,,,,TT',
      'TT,,,,,,,,,,,,,,,,TT',
      'T........::........T',
      'T.A..f...::...f..A.T',
      'T........::........T',
      'TLLLLLLL.::.LLLLLLLT',
      'T........::........T',
      'T.,,,,...::...,,,,.T',
      'T.,,,,...::...,,,,.T',
      'T........::........T',
      'T.f......::......f.T',
      'T........::........T',
      'TTTTTTTTT::TTTTTTTTT'
    ],
    signs: [{ x: 3, y: 11, text: ['ROUTE 1', 'SUNNY TOWN  -  PEBBLE TOWN', 'Ledges are one-way: you can hop DOWN them, but never climb back up!'] }],
    npcs: [
      tr('t_joey', 'YOUNGSTER', 'JOEY', 6, 15, 2, 3, ['fuzzlets'], 4, ['Hey! You\'re a trainer! My FUZZLETS is in the top percentage of FUZZLETS!'], 'My FUZZLETS... in the top percentage...'),
      tr('t_amy', 'LASS', 'AMY', 13, 6, 1, 3, ['buzzlings', 'sproutle'], 3, ['You looked at me, didn\'t you? That means we battle!'], 'Aww, you\'re mean!'),
      { id: 'rival1', kind: 'rival', n: 0, x: 10, y: 1, dir: 0, sight: 3, look360: true, look: lk(CA.RIVAL_LOOK), post: 'rivalLeave', hideIf: 'rival1',
        say: function (sv) { return [sv.rival + ': Hey, ' + sv.name + '! Gramps gave you a critter too, huh?', 'Let\'s see whose critter is better. Battle me!']; } },
      { id: 'r1guy', kind: 'talk', x: 15, y: 19, dir: 1, look: CA.LOOKS.boy, spin: [0, 1, 2], lines: ['See that strip of tall grass? There\'s no way around it!', 'If a wild critter jumps out, you can always RUN AWAY from the pause menu.'] }
    ],
    items: [{ id: 'i_r1a', x: 1, y: 28, item: 'capsule', n: 2 }, { id: 'i_r1b', x: 18, y: 24, item: 'repel', n: 1 }]
  };

  MAPS.pebble = town({
    name: 'PEBBLE TOWN', gym: 'pip', roof: '#ff8a3d', conns: { s: { to: 'r1' }, n: { to: 'r2' } }, shop: ['capsule', 'repel'],
    sign: ['PEBBLE TOWN', 'A small town of round little stones.'],
    deco: [[1, 1, 'ff'], [17, 1, 'ff'], [1, 8, 'r'], [18, 9, 'r'], [7, 11, 'rf'], [11, 8, 'f'], [1, 15, 'ff.r'], [12, 16, 'f..f'], [17, 17, 'bb'], [5, 18, 'r'], [17, 10, 'FF'], [17, 11, 'FF'], [17, 12, 'FF']],
    gymTrainers: [tr('g_leo', 'CAMPER', 'LEO', 2, 9, 2, 3, ['emberpup', 'fuzzlets'], 5, ['PIP is only a rookie, but so am I! Let\'s go!'], 'I\'ve still got lots to learn...'),
      tr('g_may', 'LASS', 'MAY', 8, 6, 1, 3, ['puddlefin', 'buzzlings'], 5, ['Want to get to PIP? You\'ll have to get past me first!'], 'Hmph. Go on then.')],
    npcs: [
      { id: 'pb1', kind: 'talk', x: 6, y: 16, dir: 0, look: CA.LOOKS.youngster, wander: 2, lines: ['PIP the GYM LEADER only just got their first critters.', 'But PIP\'s got EIGHT of them! Bring a few friends of your own.'] },
      { id: 'pb2', kind: 'talk', x: 15, y: 9, dir: 0, look: CA.LOOKS.lass, spin: [0, 1, 2], lines: ['Talk to the nurse at any CRITTER CENTER and she\'ll remember you.', 'If you ever black out, you\'ll wake up at the last one you visited!'] },
      { id: 'pbPet', kind: 'talk', x: 11, y: 9, dir: 0, critter: 'pebblump', emotes: ['zzz'], lines: ['PEBBLUMP is snoozing in the sun... Zzz...'] }
    ],
    houseNpcs: [{ id: 'pbGift', kind: 'gift', x: 4, y: 4, dir: 0, look: CA.LOOKS.granny, gift: 'capsule', n: 3, lines: ['Oh my, a young trainer! Here, take these. My grandson never uses them.'], after: ['Catch lots of critters, dearie! Mixing types makes for a strong team.'] }],
    martNpcs: [{ id: 'pbm', kind: 'talk', x: 6, y: 5, dir: 1, look: CA.LOOKS.camper, lines: ['REPELS keep wild critters away. Handy when you just want to get somewhere!'] }],
    centerNpcs: [{ id: 'pbc', kind: 'talk', x: 8, y: 6, dir: 1, look: CA.LOOKS.boy, lines: ['That PC in the corner lets you swap critters in and out of your team.', 'You can also do it any time from the MENU. Isn\'t technology great?'] }]
  });

  MAPS.r2 = {
    name: 'MUSHROOM WOODS', music: 'forest', env: 'forest', wild: 'r2', border: '#1f7a46', conns: { s: { to: 'pebble' }, n: { to: 'coral' } },
    rows: [
      'PPPPPPPPP::PPPPPPPPP',
      'PP,,,....::....,,,PP',
      'P.,,,....::....,,,.P',
      'P........::........P',
      'P.TT..TT.::.TTTTTTTP',
      'P.TT..TT.::.TTTTTTTP',
      'P..::::::::...,,,,.P',
      'P..:.TTTTTT...,,,,.P',
      'P..:.TTTTTT........P',
      'P..:.....,,,,,.TTT.P',
      'P,,:,,...,,,,,.TTT.P',
      'P,,:,,.........b...P',
      'PTT:TTTT.TTTT.b..b.P',
      'PTT:TTTT.TTTT......P',
      'P..:::::::::::::...P',
      'P.......,,,,..T:...P',
      'P.TTT...,,,,..T:...P',
      'P.TTT..........:TT.P',
      'P..f...TTTTT...:TT.P',
      'P......TTTTT...:...P',
      'P,,,,..........:,,,P',
      'P,,,,..PPP.....:,,,P',
      'PPP....PPP.....:...P',
      'P..............:...P',
      'P..b.....:::::::...P',
      'P..TTT...:......TT.P',
      'P..TTT...:..,,,.TT.P',
      'P....,,,.:..,,,....P',
      'P....,,,.:.........P',
      'P.f......:.......f.P',
      'PP.......:........PP',
      'PPPPPPPPP::PPPPPPPPP'
    ],
    signs: [],
    npcs: [
      tr('t_rick', 'BUG CATCHER', 'RICK', 7, 15, 3, 2, ['buzzlings', 'hexmoth'], 6, ['Hey! Bugs are the best! Let me show you!'], 'Bzzzt... my bugs got squished.'),
      tr('t_doug', 'BUG CATCHER', 'DOUG', 16, 20, 1, 3, ['gloomcap', 'buzzlings'], 7, ['Shhh! You\'ll scare the bugs! ...Oh well, BATTLE!'], 'Huh? I lost?'),
      tr('t_gina', 'PICNICKER', 'GINA', 12, 25, 3, 1, ['sproutle', 'fuzzlets', 'gloomcap'], 7, ['A picnic AND a battle? Today is the best day!'], 'My sandwiches got squashed...'),
      { id: 'r2a', kind: 'talk', x: 5, y: 23, dir: 2, look: CA.LOOKS.scientist, wander: 2, lines: ['GLOOMCAP spores make critters sleepy and slow.', 'Slowed wild critters are a little easier to catch, you know!'] },
      { id: 'r2Pet', kind: 'talk', x: 17, y: 2, dir: 0, critter: 'hexmoth', wander: 1, lines: ['A wild HEXMOTH flutters around, but it doesn\'t seem to want to fight.'] }
    ],
    items: [{ id: 'i_r2a', x: 1, y: 27, item: 'capsule', n: 2 }, { id: 'i_r2b', x: 18, y: 9, item: 'repel', n: 1 }, { id: 'i_r2c', x: 18, y: 26, item: 'great', n: 1 }]
  };

  MAPS.coral = {
    name: 'CORAL HARBOR', music: 'town', sandBase: '#f8e7b4', conns: { s: { to: 'r2' }, n: { to: 'r3' } }, shop: ['capsule', 'repel'],
    rows: [
      'TTTTTTTTT::TTTTTT~~~',
      'T........::.....s~~~',
      'T.f......::.....s~~~',
      'T........::.....s~~~',
      'T........::.....s~~~',
      'T........::.....s~~~',
      'T....:...::.:...s~~~',
      'T....::::::::...s~~~',
      'T........::.....s~~~',
      'T........::.....s~~~',
      'T........::.....s~~~',
      'T........::....ss===',
      'T........::....ss~~~',
      'T........::.....s~~~',
      'T....:::::::::..s~~~',
      'T........::.....s~~~',
      'T.f......::.....s~~~',
      'T........::....ss~~~',
      'T.....n..::....ss~~~',
      'TTTTTTTTT::TTTTTT~~~'
    ],
    buildings: [
      { kind: 'center', x: 3, y: 3, door: 2, inside: { npcs: [{ id: 'coc', kind: 'talk', x: 2, y: 6, dir: 2, look: CA.LOOKS.sailor, lines: ['I sailed in from far away. You know, in other regions critters don\'t follow their trainers around.', 'Something about this sunshine makes them want to walk with you!'] }] } },
      { kind: 'mart', x: 11, y: 3, door: 1 },
      gymB(3, 10, 'coral', [tr('g_ray', 'SWIMMER', 'RAY', 2, 9, 2, 3, ['puddlefin', 'shellbert'], 8, ['CORAL taught me to swim. Now I\'ll teach YOU a lesson!'], 'Glub... washed out.'),
        tr('g_nina', 'SWIMMER', 'NINA', 8, 6, 1, 3, ['voltwing', 'puddlefin'], 8, ['Splash! Watch out for my VOLTWING!'], 'I need to dry off...', 'swimmerf')]),
      { kind: 'house', x: 11, y: 15, door: 1, roof: '#3aa2ff', inside: { npcs: [{ id: 'coGift', kind: 'gift', x: 4, y: 4, dir: 0, look: CA.LOOKS.fisher, gift: 'great', n: 2, lines: ['Ahoy! Catching critters is a lot like fishing.', 'You need the right gear. Take these GREAT CAPSULES!'], after: ['A GREAT CAPSULE has much better odds than a normal one.'] }] } }
    ],
    signs: [{ x: 6, y: 18, text: ['CORAL HARBOR', 'Where the sea sparkles all day long.'] }],
    npcs: [
      { id: 'co1', kind: 'talk', x: 18, y: 11, dir: 2, look: CA.LOOKS.sailor, lines: ['Ahoy! The sea\'s calm today. Perfect weather for SHELLBERTS to sunbathe!'] },
      { id: 'co2', kind: 'talk', x: 16, y: 4, dir: 2, look: CA.LOOKS.fisher, lines: ['I\'ve been fishing all day... Nothing but old boots.'] },
      { id: 'co3', kind: 'talk', x: 12, y: 9, dir: 0, look: CA.LOOKS.girl, wander: 2, lines: ['CORAL, our GYM LEADER, swims laps around the harbor every single morning!', 'WATER critters are strong against FIRE. Remember that!'] },
      { id: 'coPet', kind: 'talk', x: 16, y: 13, dir: 0, critter: 'puddlefin', wander: 1, lines: ['PUDDLEFIN: Pufffff! It blows a bubble at you.'] }
    ]
  };

  MAPS.r3 = {
    name: 'SEASIDE CLIFFS', music: 'route', env: 'beach', wild: 'r3', sandBase: '#f8e7b4', conns: { s: { to: 'coral' }, n: { to: 'ember' } },
    rows: [
      'TTTTTTTTT::TTTTTT~~~',
      'T........::.....s~~~',
      'T.,,,,...::.....s~~~',
      'T.,,,,...::....ss~~~',
      'T........::....s~~~~',
      'Trr......::....s~~~~',
      'T.....LLL::LLLLs~~~~',
      'T........::.....s~~~',
      'T..,,,,,.::.....s~~~',
      'T..,,,,,.::....ss~~~',
      'T........::....s~~~~',
      'TTTT.....::....s~~~~',
      'T...r....::....s~~~~',
      'T.,,,,...::.....s~~~',
      'T.,,,,...::.....s~~~',
      'T........::.....s~~~',
      'TLLLLLL..::..LLLs~~~',
      'T........::.....s~~~',
      'T..r..,,,::,,,..s~~~',
      'T.....,,,::,,,..s~~~',
      'T........::.....s~~~',
      'Tr.......::....ss~~~',
      'T.f..,,,,::.....s~~~',
      'T....,,,,::.....s~~~',
      'T........::.....s~~~',
      'TTT......::....ss~~~',
      'T.,,,....::.....s~~~',
      'T.,,,....::.....s~~~',
      'T........::.....s~~~',
      'TTTTTTTTT::TTTTTT~~~'
    ],
    npcs: [
      tr('t_kim', 'SWIMMER', 'KIM', 17, 9, 1, 3, ['puddlefin', 'lumisprite'], 11, ['The water\'s lovely! But a battle\'s lovelier!'], 'Brr! I\'m getting cold.', 'swimmerf'),
      tr('t_wade', 'FISHER', 'WADE', 15, 13, 1, 5, ['puddlefin', 'shellbert'], 10, ['Hey, you scared the fish away! Battle me!'], 'Bah, another one that got away.'),
      tr('t_duff', 'SAILOR', 'DUFF', 3, 20, 2, 6, ['shellbert', 'rockhorn'], 10, ['Avast! A landlubber! Let\'s see what ye\'ve got!'], 'Shiver me timbers!'),
      { id: 'r3a', kind: 'talk', x: 14, y: 24, dir: 1, look: CA.LOOKS.oldman, spin: [1, 0], lines: ['VOLTWINGS nest on these cliffs. They\'re SPARK type, so they hit WATER critters hard!'] }
    ],
    items: [{ id: 'i_r3a', x: 1, y: 26, item: 'great', n: 1 }, { id: 'i_r3b', x: 2, y: 1, item: 'repel', n: 1 }, { id: 'i_r3c', x: 15, y: 1, item: 'candy', n: 1 }]
  };

  MAPS.ember = town({
    name: 'EMBER CITY', gym: 'blaze', roof: '#ff6a5e', conns: { s: { to: 'r3' }, n: { to: 'r4' } }, shop: ['capsule', 'great', 'repel'],
    sign: ['EMBER CITY', 'The city with a fiery heart.'],
    deco: [[1, 1, 'rr'], [17, 1, 'r.'], [1, 2, 'r'], [11, 8, 'ss'], [1, 8, 'sss'], [6, 10, 'r.r'], [7, 12, 'r'], [1, 15, 'r..s'], [12, 15, 'ssss'], [11, 17, 'r....r'], [17, 10, 'rr'], [17, 12, 'r']],
    gymTrainers: [tr('g_kai', 'HOTHEAD', 'KAI', 2, 9, 2, 3, ['emberpup', 'rockhorn'], 11, ['Feel the heat! BLAZE taught me everything!'], 'I got... extinguished.'),
      tr('g_ash', 'CAMPER', 'ASH', 8, 6, 1, 3, ['emberpup', 'pebblump'], 11, ['Nothing beats a good campfire. Or a good battle!'], 'My fire went out...')],
    npcs: [
      { id: 'em1', kind: 'talk', x: 6, y: 16, dir: 0, look: CA.LOOKS.worker, wander: 2, lines: ['BLAZE is all offence. Bring sturdy WATER critters to cool them down!'] },
      { id: 'em2', kind: 'talk', x: 15, y: 9, dir: 1, look: CA.LOOKS.lass, spin: [1, 0], lines: function (sv) { return ['I saw ' + sv.rival + ' storm off toward the BLOOM TRAIL.', 'They said something about being "way ahead of you"!']; } },
      { id: 'emPet', kind: 'talk', x: 12, y: 16, dir: 0, critter: 'emberpup', wander: 2, lines: ['EMBERPUP: Arf arf! Its tail flickers happily.'] }
    ],
    houseNpcs: [{ id: 'emGift', kind: 'gift', x: 4, y: 4, dir: 0, look: CA.LOOKS.hiker, gift: 'candy', n: 1, lines: ['You\'ve got the look of a real trainer.', 'Here, a RARE CANDY. Give it to a critter from the BAG to make it grow a level!'], after: ['RARE CANDIES are rare, so save them for your favourites.'] }]
  });

  MAPS.r4 = {
    name: 'BLOOM TRAIL', music: 'route', env: 'meadow', wild: 'r4', conns: { s: { to: 'ember' }, n: { to: 'bloom' } },
    rows: [
      'TTTTTTTTT::TTTTTTTTT',
      'Tff......::......ffT',
      'Tf.,,,,..::..,,,,.fT',
      'T..,,,,..::..,,,,..T',
      'T........::........T',
      'TAff....f::f....ffAT',
      'T..fff...::...fff..T',
      'T........::........T',
      'T.,,,,,,,::,,,,,,,.T',
      'T.,,,,,,,::,,,,,,,.T',
      'T........::........T',
      'TTT.ff...::...ff.TTT',
      'T....f...::...f....T',
      'T.b......::......b.T',
      'T..,,,,..::..,,,,..T',
      'T..,,,,..::..,,,,..T',
      'T........::........T',
      'Tff.A....::....A.ffT',
      'T........::........T',
      'TLLLLLLL.::.LLLLLLLT',
      'T........::........T',
      'T.,,,,,,,,,,,,,,,,.T',
      'T.,,,,,,,,,,,,,,,,.T',
      'T........::........T',
      'T.f.f....::....f.f.T',
      'T........::........T',
      'T........::........T',
      'TTTTTTTTT::TTTTTTTTT'
    ],
    npcs: [
      { id: 'rival2', kind: 'rival', n: 1, x: 10, y: 26, dir: 0, sight: 2, look360: true, look: lk(CA.RIVAL_LOOK), post: 'rivalLeave', hideIf: 'rival2',
        say: function (sv) { return [sv.rival + ': Well, well! If it isn\'t ' + sv.name + '!', 'I\'ve already got THREE badges. How many critters have YOU caught?', 'Whatever. Let me show you what a REAL team looks like!']; } },
      tr('t_daisy', 'PICNICKER', 'DAISY', 3, 13, 2, 6, ['sproutle', 'gloomcap', 'buzzlings'], 12, ['Isn\'t this trail just gorgeous? Let\'s battle among the flowers!'], 'Oh! The petals are all scattered...'),
      tr('t_rose', 'LASS', 'ROSE', 15, 7, 1, 5, ['lumisprite', 'sproutle'], 13, ['My critters are pretty AND tough!'], 'At least they\'re still pretty...'),
      tr('t_sam', 'BUG CATCHER', 'SAM', 12, 16, 1, 2, ['buzzlings', 'hexmoth', 'gloomcap'], 13, ['I came here to catch bugs, but I\'ll catch YOU instead!'], 'I should\'ve stuck to bugs...'),
      { id: 'r4Pet', kind: 'talk', x: 6, y: 10, dir: 0, critter: 'buzzlings', wander: 2, lines: ['BUZZLINGS: Bzzz bzz! They buzz in a happy little circle.'] }
    ],
    items: [{ id: 'i_r4a', x: 1, y: 24, item: 'candy', n: 1 }, { id: 'i_r4b', x: 18, y: 12, item: 'great', n: 2 }]
  };

  MAPS.bloom = town({
    name: 'BLOOM CITY', gym: 'ivy', roof: '#ff9ad0', conns: { s: { to: 'r4' }, n: { to: 'r5' } }, shop: ['capsule', 'great', 'repel', 'candy'],
    sign: ['BLOOM CITY', 'Every season is spring here.'],
    deco: [[1, 1, 'ffff'], [15, 1, 'ffff'], [1, 2, 'f'], [18, 2, 'f'], [1, 8, 'fff'], [11, 8, 'ffff'], [16, 8, 'fff'], [6, 10, 'fff'], [6, 11, 'f.f'], [6, 12, 'fff'], [1, 15, 'ffffffff'], [11, 15, 'ffffffff'], [1, 16, 'f'], [18, 16, 'f'], [17, 10, 'ff'], [17, 11, 'ff'], [17, 12, 'ff']],
    gymTrainers: [tr('g_fern', 'GARDENER', 'FERN', 2, 9, 2, 3, ['gloomcap', 'sproutle'], 14, ['Mind the seedlings! And mind my critters!'], 'You trampled my flowerbed...'),
      tr('g_moss', 'GARDENER', 'MOSS', 8, 6, 1, 3, ['sproutle', 'shellbert', 'gloomcap'], 14, ['Patience grows the strongest roots. Hya!'], 'I must grow some more.')],
    npcs: [
      { id: 'bl1', kind: 'talk', x: 7, y: 17, dir: 0, look: CA.LOOKS.beauty, wander: 2, emotes: ['heart'], lines: ['IVY\'s GYM is a greenhouse full of LEAF critters.', 'They heal each other constantly! FIRE critters will burn right through them.'] },
      { id: 'bl2', kind: 'talk', x: 12, y: 9, dir: 0, look: CA.LOOKS.gardener, spin: [0, 1, 2], lines: ['I water these flowers every morning. The critters love napping in them!'] },
      { id: 'blPet', kind: 'talk', x: 15, y: 16, dir: 0, critter: 'sproutle', wander: 2, lines: ['SPROUTLE: Sprouuu! It soaks up the sunshine.'] }
    ],
    houseNpcs: [{ id: 'blGift', kind: 'gift', x: 4, y: 4, dir: 0, look: CA.LOOKS.granny, gift: 'ultra', n: 1, lines: ['My, what a lovely team you have!', 'Take this ULTRA CAPSULE. Save it for something truly special.'], after: ['They say a legend sleeps high above the clouds... Imagine catching THAT!'] }]
  });

  MAPS.r5 = {
    name: 'ROCKY PASS', music: 'route', env: 'rocky', wild: 'r5', conns: { s: { to: 'bloom' }, n: { to: 'volt' } },
    rows: [
      'TTTTTTTTT::TTTTTTTTT',
      'Tr.......::.......rT',
      'T..rr....::....rr..T',
      'T..,,,,..::..,,,,..T',
      'T..,,,,..::..,,,,..T',
      'Trr......::......rrT',
      'T....rLLL::LLLr....T',
      'T.....,,,::,,,.....T',
      'T.r...,,,::,,,...r.T',
      'T........::........T',
      'TT..rr...::...rr..TT',
      'T,,,,....::....,,,,T',
      'T,,,,.r..::..r.,,,,T',
      'T........::........T',
      'TLLLL....::....LLLLT',
      'T....rr..::..rr....T',
      'T.,,,,...::...,,,,.T',
      'T.,,,,...::...,,,,.T',
      'Tr.......::.......rT',
      'T...rrr..::..rrr...T',
      'T........::........T',
      'T,,,,,,,,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,T',
      'T........::........T',
      'T.r..LLLL::LLLL..r.T',
      'T........::........T',
      'T..,,,...::...,,,..T',
      'Tr.,,,...::...,,,.rT',
      'T........::........T',
      'TTTTTTTTT::TTTTTTTTT'
    ],
    npcs: [
      tr('t_bruno', 'HIKER', 'BRUNO', 4, 9, 2, 5, ['pebblump', 'rockhorn'], 15, ['Hahaha! The mountains made me strong! Battle!'], 'Hahaha! You\'re strong too!'),
      tr('t_clay', 'HIKER', 'CLAY', 15, 13, 1, 5, ['rockhorn', 'emberpup'], 15, ['These rocks are my training weights!'], 'I need to lift heavier rocks...'),
      tr('t_ty', 'CAMPER', 'TY', 6, 20, 2, 3, ['zappip', 'fuzzlets', 'emberpup'], 16, ['I\'ve been camping up here for weeks. I\'m ready!'], 'Time to pack up my tent...'),
      { id: 'r5Pet', kind: 'talk', x: 16, y: 25, dir: 0, critter: 'rockhorn', wander: 1, lines: ['A wild ROCKHORN scrapes its horn against a boulder. It seems friendly enough.'] }
    ],
    items: [{ id: 'i_r5a', x: 17, y: 1, item: 'candy', n: 1 }, { id: 'i_r5b', x: 1, y: 13, item: 'great', n: 2 }, { id: 'i_r5c', x: 18, y: 28, item: 'repel', n: 2 }]
  };

  MAPS.volt = town({
    name: 'VOLT CITY', gym: 'volt', roof: '#ffc61f', conns: { s: { to: 'r5' }, n: { to: 'r6' } }, shop: ['capsule', 'great', 'repel', 'candy'],
    sign: ['VOLT CITY', 'Powering the whole region!'],
    deco: [[1, 1, 'FFFF'], [15, 1, 'FFFF'], [1, 8, 'F.F'], [16, 8, 'F.F'], [6, 10, 'b'], [6, 12, 'b'], [1, 15, 'FFFFF'], [12, 15, 'FFFFF'], [1, 17, 'b'], [18, 17, 'b'], [17, 10, 'rr']],
    gymTrainers: [tr('g_watt', 'ENGINEER', 'WATT', 2, 9, 2, 3, ['voltwing', 'zappip'], 16, ['I wired up this whole gym! Let\'s see how you conduct yourself.'], 'Short circuit...'),
      tr('g_amp', 'ROCKER', 'AMP', 8, 6, 1, 3, ['zappip', 'buzzlings', 'voltwing'], 16, ['Turn it up to eleven! ROCK ON!'], 'My amp blew a fuse!')],
    npcs: [
      { id: 'vo1', kind: 'talk', x: 6, y: 16, dir: 0, look: CA.LOOKS.engineer, wander: 2, lines: ['VOLT\'s critters are SO fast. They pounce before you can blink!', 'STONE critters are strong against SPARK. Build a wall!'] },
      { id: 'vo2', kind: 'talk', x: 15, y: 9, dir: 1, look: CA.LOOKS.youngster, spin: [1, 0, 2], lines: ['Did you know you can tap the CROWD meter in battle when it\'s full?', 'Your whole team gets faster for a few seconds!'] },
      { id: 'voPet', kind: 'talk', x: 11, y: 17, dir: 0, critter: 'zappip', wander: 2, lines: ['ZAPPIP: Pip pip! Sparks crackle along its tail.'] }
    ],
    houseNpcs: [{ id: 'voGift', kind: 'gift', x: 4, y: 4, dir: 0, look: CA.LOOKS.scientist, gift: 'candy', n: 2, lines: ['I research critter growth. Here, take two RARE CANDIES for science!'], after: ['A critter that levels up gains about 3% health and power per level.'] }]
  });

  MAPS.r6 = {
    name: 'QUARRY ROAD', music: 'route', env: 'rocky', wild: 'r6', border: '#1f7a46', conns: { s: { to: 'volt' }, n: { to: 'granite' } },
    rows: [
      'PPPPPPPPP::PPPPPPPPP',
      'Pss......::......ssP',
      'Ps.,,,...::...,,,.sP',
      'P..,,,...::...,,,..P',
      'P.r......::......r.P',
      'PP..rr...::...rr..PP',
      'P..sss...::...sss..P',
      'P.,,,,,..::..,,,,,.P',
      'P.,,,,,..::..,,,,,.P',
      'P........::........P',
      'PPP..r...::...r..PPP',
      'P..sssss.::.sssss..P',
      'P..s,,,s.::.s,,,s..P',
      'P..sssss.::.sssss..P',
      'P........::........P',
      'PLLLLL...::...LLLLLP',
      'P........::........P',
      'P.,,,,,,,::,,,,,,,.P',
      'P.,,,,,,,::,,,,,,,.P',
      'P........::........P',
      'Pr..PP...::...PP..rP',
      'P...PP...::...PP...P',
      'P.,,,....::....,,,.P',
      'P.,,,..r.::.r..,,,.P',
      'P........::........P',
      'P........::........P',
      'P.s.s....::....s.s.P',
      'PPPPPPPPP::PPPPPPPPP'
    ],
    npcs: [
      tr('t_gus', 'HIKER', 'GUS', 3, 9, 2, 6, ['pebblump', 'rockhorn', 'emberpup'], 17, ['I dig rocks, and I dig battles!'], 'You\'ve really rocked me...'),
      tr('t_rena', 'ACE TRAINER', 'RENA', 16, 14, 1, 6, ['puddlefin', 'rockhorn', 'lumisprite'], 17, ['I only battle trainers with at least 5 badges. ...You\'ll do.'], 'Impressive. You\'re the real deal.', 'acef'),
      tr('t_bo', 'WORKER', 'BO', 7, 24, 2, 2, ['rockhorn', 'pebblump', 'emberpup'], 18, ['Hard hats on! This is a construction zone!'], 'Break time, I guess.'),
      { id: 'r6a', kind: 'talk', x: 12, y: 2, dir: 0, look: CA.LOOKS.worker, spin: [0, 1], lines: ['GRANITE\'s GYM is just ahead. Those STONE critters barely flinch.', 'LEAF critters will crack them wide open!'] }
    ],
    items: [{ id: 'i_r6a', x: 1, y: 1, item: 'great', n: 2 }, { id: 'i_r6b', x: 18, y: 25, item: 'candy', n: 1 }, { id: 'i_r6c', x: 1, y: 16, item: 'ultra', n: 1 }]
  };

  MAPS.granite = town({
    name: 'GRANITE TOWN', gym: 'granite', roof: '#8a7a6a', border: '#1f7a46', conns: { s: { to: 'r6' }, n: { to: 'r7' } }, shop: ['capsule', 'great', 'ultra', 'repel', 'candy'],
    sign: ['GRANITE TOWN', 'Solid as a rock since forever.'],
    deco: [[0, 0, 'PPPPPPPPP'], [11, 0, 'PPPPPPPPP'], [1, 1, 'rr'], [17, 1, 'rr'], [1, 8, 'r.r'], [16, 8, 'r.r'], [6, 10, 'rr'], [7, 12, 'r'], [1, 15, 'P.r..r'], [12, 15, 'r..r.P'], [1, 17, 'PP'], [17, 17, 'PP'], [17, 11, 'rr'], [0, 19, 'PPPPPPPPP'], [11, 19, 'PPPPPPPPP']],
    gymTrainers: [tr('g_ken', 'BLACKBELT', 'KEN', 2, 9, 2, 3, ['rockhorn', 'brambull'], 18, ['HAI-YAH! My fists are harder than stone!'], 'OOF! You\'ve trained hard.'),
      tr('g_rocky', 'HIKER', 'ROCKY', 8, 6, 1, 3, ['pebblump', 'shellbert'], 18, ['Nothing gets past my wall of rock!'], 'Something got past my wall...')],
    npcs: [
      { id: 'gr1', kind: 'talk', x: 6, y: 16, dir: 0, look: CA.LOOKS.hiker, wander: 2, lines: ['GRANITE calls their team THE IRON WALL.', 'Tanks with huge HP, all taunting at once. Bring heavy hitters!'] },
      { id: 'gr2', kind: 'talk', x: 15, y: 9, dir: 0, look: CA.LOOKS.granny, spin: [0, 1], lines: ['These mountains are full of old stones... and older critters.'] },
      { id: 'grPet', kind: 'talk', x: 11, y: 16, dir: 0, critter: 'pebblump', emotes: ['zzz'], lines: ['PEBBLUMP is fast asleep. It looks very comfortable.'] }
    ],
    houseNpcs: [{ id: 'grGift', kind: 'gift', x: 4, y: 4, dir: 0, look: CA.LOOKS.blackbelt, gift: 'ultra', n: 2, lines: ['A strong trainer deserves strong gear. Take these ULTRA CAPSULES!'], after: ['ULTRA CAPSULES make even tough critters easier to catch.'] }]
  });

  MAPS.r7 = {
    name: 'STARLIT GROVE', music: 'forest', env: 'grove', wild: 'r7', border: '#1f7a46', conns: { s: { to: 'granite' }, n: { to: 'mystic' } },
    rows: [
      'PPPPPPPPP::PPPPPPPPP',
      'P.f.f....::....f.f.P',
      'P..,,,,..::..,,,,..P',
      'P..,,,,..::..,,,,..P',
      'PP.......::.......PP',
      'P..PP.f..::..f.PP..P',
      'P..PP....::....PP..P',
      'P,,,,....::....,,,,P',
      'P,,,,..A.::.A..,,,,P',
      'P........::........P',
      'PPPP.....::.....PPPP',
      'P.ff..,,,::,,,..ff.P',
      'P.....,,,::,,,.....P',
      'P..A....f::f....A..P',
      'P........::........P',
      'P.PPP....::....PPP.P',
      'P.PPP....::....PPP.P',
      'P........::........P',
      'P,,,,,,,,,,,,,,,,,,P',
      'P,,,,,,,,,,,,,,,,,,P',
      'P........::........P',
      'P.f..A...::...A..f.P',
      'P........::........P',
      'PLLLLLL..::..LLLLLLP',
      'P........::........P',
      'P..,,,...::...,,,..P',
      'P..,,,...::...,,,..P',
      'P.f......::......f.P',
      'P........::........P',
      'PPPPPPPPP::PPPPPPPPP'
    ],
    npcs: [
      tr('t_luna', 'PSYCHIC', 'LUNA', 6, 9, 2, 3, ['lumisprite', 'hexmoth'], 19, ['I foresaw this battle... and my victory!'], 'My vision was... cloudy.'),
      tr('t_sol', 'MEDIUM', 'SOL', 13, 14, 1, 3, ['hootini', 'gloomcap'], 19, ['The stars whisper your name. They say: BATTLE.'], 'The stars were wrong tonight.'),
      tr('t_stella', 'BEAUTY', 'STELLA', 6, 24, 2, 3, ['lumisprite', 'hexmoth', 'sproutle'], 20, ['Battling under the stars is sooo romantic!'], 'Hmph. You ruined my hair.'),
      { id: 'r7Pet', kind: 'talk', x: 15, y: 20, dir: 0, critter: 'lumisprite', wander: 2, lines: ['A LUMISPRITE twinkles at you and giggles.'] }
    ],
    items: [{ id: 'i_r7a', x: 18, y: 28, item: 'ultra', n: 1 }, { id: 'i_r7b', x: 1, y: 13, item: 'candy', n: 1 }, { id: 'i_r7c', x: 1, y: 1, item: 'great', n: 2 }]
  };

  MAPS.mystic = town({
    name: 'MYSTIC TOWN', gym: 'mystica', roof: '#a45cff', border: '#1f7a46', conns: { s: { to: 'r7' }, n: { to: 'r8' } }, shop: ['capsule', 'great', 'ultra', 'repel', 'candy'],
    sign: ['MYSTIC TOWN', 'Things here are not what they seem...'],
    deco: [[0, 0, 'PPPPPPPPP'], [11, 0, 'PPPPPPPPP'], [1, 1, 'Pff'], [16, 1, 'ffP'], [1, 8, 'ff'], [17, 8, 'ff'], [6, 10, 'P.P'], [7, 12, 'f'], [1, 15, 'PffP'], [14, 15, 'PffP'], [1, 17, 'f'], [18, 17, 'f'], [17, 10, 'PP'], [0, 19, 'PPPPPPPPP'], [11, 19, 'PPPPPPPPP']],
    gymTrainers: [tr('g_iris', 'MEDIUM', 'IRIS', 2, 9, 2, 3, ['hexmoth', 'gloomcap'], 20, ['The spirits told me you\'d come...'], 'The spirits are laughing at me.'),
      tr('g_orin', 'PSYCHIC', 'ORIN', 8, 6, 1, 3, ['hootini', 'lumisprite'], 20, ['I can read your mind. You\'re thinking about losing!'], 'Your mind was... unreadable.')],
    npcs: [
      { id: 'my1', kind: 'talk', x: 6, y: 16, dir: 0, look: CA.LOOKS.psychic, wander: 2, lines: ['MYSTICA hides SHADECATS behind illusions.', 'They come out of nowhere and pounce on your back line. Keep a brawler close by!'] },
      { id: 'my2', kind: 'talk', x: 15, y: 9, dir: 1, look: CA.LOOKS.oldman, spin: [1, 0], lines: ['MYSTIC critters are strong against other MYSTIC critters... and DRAGONS.', 'Remember that if you ever face a legend!'] },
      { id: 'myPet', kind: 'talk', x: 12, y: 16, dir: 0, critter: 'hootini', wander: 1, lines: ['HOOTINI: Hoo hoo! It tips its starry hat.'] }
    ],
    houseNpcs: [{ id: 'myGift', kind: 'gift', x: 4, y: 4, dir: 0, look: CA.LOOKS.psychicm, gift: 'ultra', n: 2, lines: ['I sensed you would visit. These ULTRA CAPSULES are yours.'], after: ['Your future holds... a very big dragon.'] }]
  });

  MAPS.r8 = {
    name: 'TWIN BRIDGES', music: 'route', env: 'beach', wild: 'r8', sandBase: '#f8e7b4', conns: { s: { to: 'mystic' }, n: { to: 'twin' } },
    rows: [
      'TTTTTTTTT::TTTTTTTTT',
      'T........::........T',
      'T.,,,,...::...,,,,.T',
      'Ts......s::s......sT',
      '~~~~~~~~~==~~~~~~~~~',
      '~~~~~~~~~==~~~~~~~~~',
      '~~~~~~~~~==~~~~~~~~~',
      'ss.......::.......ss',
      's..,,,,..::..,,,,..s',
      's..,,,,..::..,,,,..s',
      'ss.......::.......ss',
      '~~~~~~~~~==~~~~~~~~~',
      '~~~~~~~~~==~~~~~~~~~',
      '~~~~~~~~~==~~~~~~~~~',
      'ss...f...::...f...ss',
      's........::........s',
      's.,,,,,,,::,,,,,,,.s',
      's.,,,,,,,::,,,,,,,.s',
      'ss.......::.......ss',
      '~~~~~~~~~==~~~~~~~~~',
      '~~~~~~~~~==~~~~~~~~~',
      'Ts......s::s......sT',
      'T........::........T',
      'T.,,,,...::...,,,,.T',
      'T.,,,,...::...,,,,.T',
      'T........::........T',
      'T.f......::......f.T',
      'TTTTTTTTT::TTTTTTTTT'
    ],
    npcs: [
      tr('t_twins', 'TWINS', 'MIA & PIA', 4, 15, 2, 5, ['fuzzlets', 'buzzlings', 'fuzzlets'], 21, ['MIA: We\'re twins! PIA: We\'re twins! BOTH: Let\'s battle!'], 'MIA & PIA: Awww...'),
      tr('t_finn', 'FISHER', 'FINN', 3, 10, 2, 6, ['puddlefin', 'shellbert', 'voltwing'], 21, ['I fish off this bridge every day. Today I\'m fishing for a battle!'], 'Hooked and released.'),
      tr('t_ned', 'SAILOR', 'NED', 16, 22, 1, 6, ['shellbert', 'magmaw', 'zappip'], 22, ['Ahoy! Ye won\'t cross these bridges without a fight!'], 'Ye can cross, matey.'),
      tr('t_bea', 'SWIMMER', 'BEA', 11, 12, 1, 1, ['puddlefin', 'voltwing', 'lumisprite'], 22, ['Ooh, a trainer on the bridge! Splash battle!'], 'Splish splash, I lost...', 'swimmerf')
    ],
    items: [{ id: 'i_r8a', x: 1, y: 8, item: 'ultra', n: 1 }, { id: 'i_r8b', x: 18, y: 16, item: 'candy', n: 1 }, { id: 'i_r8c', x: 18, y: 1, item: 'great', n: 3 }]
  };

  MAPS.twin = town({
    name: 'TWIN CITY', gym: 'twins', roof: '#ff5fa2', conns: { s: { to: 'r8' }, n: { to: 'vr' } }, shop: ['capsule', 'great', 'ultra', 'repel', 'candy'],
    sign: ['TWIN CITY', 'Double the fun!'],
    deco: [[10, 0, 'T'], [1, 1, 'f.f'], [16, 1, 'f.f'], [1, 8, 'b.b'], [16, 8, 'b.b'], [6, 10, 'f.f'], [6, 12, 'f.f'], [1, 15, 'f.f.f.f'], [12, 15, 'f.f.f.f'], [17, 10, 'bb']],
    gymTrainers: [tr('g_lil', 'TWINS', 'LIL & LOU', 2, 9, 2, 3, ['fuzzlets', 'zappip'], 22, ['LIL: Two against one! LOU: That\'s not fair! LIL: Who cares!'], 'LIL & LOU: Double defeat...'),
      tr('g_max', 'ACE TRAINER', 'MAX', 8, 6, 1, 3, ['shadecat', 'buzzlings'], 22, ['The twins\' swarms are relentless. Can you even handle me?'], 'You handled me just fine.')],
    npcs: [
      { id: 'vrGuard', kind: 'guard', x: 9, y: 1, dir: 0, look: CA.LOOKS.guard, moveIf: ['vrpass', 8, 1, 2] },
      { id: 'tw1', kind: 'talk', x: 6, y: 16, dir: 0, look: CA.LOOKS.twins, wander: 2, lines: ['KIT & KAT swarm you with tiny critters.', 'SPLASH attacks hit lots of little critters at once!'] },
      { id: 'tw2', kind: 'talk', x: 15, y: 9, dir: 1, look: CA.LOOKS.ace, spin: [1, 0], lines: ['VICTORY ROAD is just north. Only trainers with all 8 BADGES may enter.', 'At the end of it lies the SUNSHINE PLATEAU and the CHAMPION!'] },
      { id: 'twPet', kind: 'talk', x: 12, y: 17, dir: 0, critter: 'fuzzlets', wander: 2, lines: ['FUZZLETS: Fuzz fuzz fuzz! They bounce around your feet.'] }
    ],
    houseNpcs: [{ id: 'twGift', kind: 'gift', x: 4, y: 4, dir: 0, look: CA.LOOKS.ace, gift: 'candy', n: 3, lines: ['Heading for the LEAGUE? You\'ll need every edge you can get. Take these!'], after: ['Good luck at the PLATEAU. The CHAMPION is a legend.'] }]
  });
  // only one gap through the north tree line in Twin City: the guard stands in it
  put(MAPS.twin.rows, 9, 0, ':');

  MAPS.vr = {
    name: 'VICTORY ROAD', music: 'cave', env: 'cave', wild: 'vr', wildTiles: 'c', rate: 0.05, border: '#4a3a30', noClouds: true, ground: 'cave', conns: { s: { to: 'twin' }, n: { to: 'plateau' } },
    rows: [
      'CCCCCCCCCccCCCCCCCCC',
      'CCcccccccccccccccCCC',
      'CccckcccccccccrcccCC',
      'CcccCCCCCcccCCCCcccC',
      'CcccCCCCCcccCCCCcccC',
      'CcccccccccccccccrccC',
      'CCCCcccrcccccccccCCC',
      'CccccccccCCCCcccccCC',
      'CckcccccccCCCccccccC',
      'CcccccCCcccccccCCccC',
      'CCcccCCCcccccccCCccC',
      'CCcccccccckccccccccC',
      'CccccccccccccCCCCccC',
      'CcrcccCCCCcccCCCCccC',
      'CcccccCCCCcccccccccC',
      'CCCccccccccccccrcccC',
      'CcccccccccrccccccCCC',
      'CcccCCCCCcccccccccCC',
      'CckcCCCCCcccCCCcccCC',
      'CccccccccccCCCCccccC',
      'CCccccccrcccccccckcC',
      'CCCCcccccccCCCCccccC',
      'CcccccCCcccCCCCccccC',
      'CcrcccCCccccccccrccC',
      'CccccccccccccccccCCC',
      'CCCcccCCCCccccccccCC',
      'CkccccCCCCccccCCcccC',
      'CcccccccccccccCCcccC',
      'CcccrcccccccccccccCC',
      'CCcccccccccccccccCCC',
      'CCCCCcccccccccCCCCCC',
      'CCCCCCCCCcCCCCCCCCCC'
    ],
    npcs: [
      tr('t_vera', 'ACE TRAINER', 'VERA', 1, 19, 2, 6, ['hootini', 'brambull', 'voltwing'], 24, ['So you have 8 badges. Prove you deserve them!'], 'You deserve them. Go!', 'acef'),
      tr('t_drake', 'ACE TRAINER', 'DRAKE', 18, 11, 1, 7, ['magmaw', 'shadecat', 'pebblump'], 24, ['Only the strongest reach the PLATEAU. Are you one of them?'], 'You might just be.'),
      tr('t_quinn', 'ACE TRAINER', 'QUINN', 9, 5, 0, 4, ['lumisprite', 'rockhorn', 'hexmoth', 'zappip'], 25, ['This is the last test before the LEAGUE. Give it everything!'], 'The CHAMPION is waiting for you.', 'acef')
    ],
    items: [{ id: 'i_vra', x: 3, y: 8, item: 'ultra', n: 2 }, { id: 'i_vrb', x: 16, y: 20, item: 'candy', n: 2 }, { id: 'i_vrc', x: 2, y: 26, item: 'repel', n: 2 }]
  };

  MAPS.plateau = {
    name: 'SUNSHINE PLATEAU', music: 'league', conns: { s: { to: 'vr' } }, shop: ['capsule', 'great', 'ultra', 'repel', 'candy'],
    rows: [
      'TTTTTTTTTTTTTTTTTTTT',
      'T.f......ff......f.T',
      'T..................T',
      'T..................T',
      'T..................T',
      'T..................T',
      'T..................T',
      'T.....:::::::......T',
      'T........::........T',
      'T........::........T',
      'T........::........T',
      'T........::........T',
      'T........::....:...T',
      'T.:::::::::::::::..T',
      'T........::........T',
      'T.f......::......f.T',
      'T........::........T',
      'TTTTTTTTT::TTTTTTTTT'
    ],
    buildings: [
      { kind: 'league', x: 6, y: 2, door: 3, custom: 'league' },
      { kind: 'center', x: 13, y: 9, door: 2, inside: { npcs: [{ id: 'plc', kind: 'clerk', x: 9, y: 4, dir: 1, look: CA.LOOKS.clerk, shop: ['capsule', 'great', 'ultra', 'repel', 'candy'] }] } },
      { kind: 'tower', x: 1, y: 9, door: 1, custom: 'sky', locked: ['The great door is sealed shut.', 'Words are carved into it: ONLY A CHAMPION MAY CLIMB TO THE SKY.'], unlock: 'champion' }
    ],
    signs: [],
    npcs: [
      { id: 'pl1', kind: 'talk', x: 4, y: 14, dir: 0, look: CA.LOOKS.ace, wander: 2, lines: ['The SUNSHINE LEAGUE! The ELITE trainer, your rival and the CHAMPION are waiting inside.', 'There\'s no going back once you face them, so get ready at the CRITTER CENTER first!'] },
      { id: 'pl2', kind: 'talk', x: 6, y: 11, dir: 0, look: CA.LOOKS.oldman, spin: [1, 0], lines: function (sv) { return sv.champion ? ['So you are the new CHAMPION...', 'Then the SKY PILLAR will open for you. A legendary dragon sleeps at the top!'] : ['That tower over there is the SKY PILLAR.', 'Legend says a great dragon sleeps at the top, waiting for a true CHAMPION.']; } }
    ]
  };

  // custom insides
  MAPS.league = {
    name: 'SUNSHINE LEAGUE', music: 'league', kind: 'gym', gym: true, theme: { floorA: '#eef3fa', floorA2: '#e3eaf5', floorB: '#ffe98a', col: '#ffd23f' },
    rows: [
      'WWWWWWW',
      'WWWWWWW',
      'pgGGGgp',
      'ggGGGgg',
      'gggGggg',
      'gggGggg',
      'XgggggX',
      'WWWGWWW',
      'WWWGWWW',
      'gggGggg',
      'gggGggg',
      'pggGggp',
      'gggGggg',
      'WWWGWWW',
      'WWWGWWW',
      'gggGggg',
      'gggGggg',
      'pggGggp',
      'gggGggg',
      'gggGggg',
      'XggGggX',
      'gggGggg',
      'gggDggg'
    ],
    leaderName: 'SUNSHINE LEAGUE', leaderId: 'champ',
    npcs: [
      leader('aurora', 3, 3, { id: 'champ', champ: true, cls: 'CHAMPION', lv: 30, post: 'hof', sight: 3,
        say: ['AURORA: So you made it all the way here.', 'I am AURORA, CHAMPION of the SUNSHINE LEAGUE.', 'Show me everything you have learned on your journey!'], after: ['AURORA: You are the CHAMPION now. Wear it proudly!'] }),
      { id: 'rival3', kind: 'rival', n: 2, x: 3, y: 9, dir: 0, sight: 3, look: lk(CA.RIVAL_LOOK), moveIf: ['rival3', 2, 9, 2],
        say: function (sv) { return [sv.rival + ': ' + sv.name + '! I knew you\'d make it here.', 'I beat the ELITE trainer just before you. Only one of us gets to face the CHAMPION...', 'And it\'s going to be ME!']; },
        after: function (sv) { return [sv.rival + ': ...I can\'t believe it. You really are the best.', 'Go on. Show AURORA what you\'ve got!']; } },
      leader('quartz', 3, 15, { id: 'elite', elite: true, cls: 'ELITE', lv: 26, moveIf: ['elite', 2, 15, 2], sight: 3,
        say: ['DR. QUARTZ: Welcome to the SUNSHINE LEAGUE.', 'I am the ELITE trainer, DR. QUARTZ. My calculations say you will lose.', 'Let us test that hypothesis!'], after: ['DR. QUARTZ: Remarkable. My data was incomplete. Go on ahead.'] })
    ]
  };
  MAPS.sky = {
    name: 'SKY PILLAR', music: 'sky', noClouds: true, border: '#9fd6ff',
    rows: [
      'QQQQQQQQQQQQQ',
      'QQQQQyyyQQQQQ',
      'QQQQyyyyyQQQQ',
      'QQQQyyyyyQQQQ',
      'QQQQQyyyQQQQQ',
      'QQQQQQyQQQQQQ',
      'QQQQQQyQQQQQQ',
      'QQQyyyyyyyQQQ',
      'QQQyQQQQQyQQQ',
      'QQQyQQQQQyQQQ',
      'QQQyyyyyyyQQQ',
      'QQQQQQyQQQQQQ',
      'QQQQQQyQQQQQQ',
      'QQQQQyyyQQQQQ',
      'QQQQQyDyQQQQQ',
      'QQQQQQQQQQQQQ'
    ],
    npcs: [{ id: 'azurion', kind: 'legend', x: 6, y: 2, dir: 0, critter: 'azurion', big: 1.5, hideIf: 'caught_azurion' }]
  };

  // ======================================================================================================
  // lookups
  // ======================================================================================================
  var cache = {};
  CA.WORLD = {
    maps: MAPS, interiors: INTERIOR, gyms: GYMS,
    get: function (id) {
      if (cache[id]) return cache[id];
      var def;
      if (id.indexOf('#') > 0) {
        var parts = id.split('#'), out = MAPS[parts[0]], b = out.buildings[+parts[1]];
        var B = CA.WorldArt.BUILD[b.kind], door = b.door === undefined ? 1 : b.door;
        if (b.custom) { var cm = MAPS[b.custom], o = {}; for (var k in cm) o[k] = cm[k]; def = o; }
        else def = INTERIOR[b.kind](b, out);
        def.exit = { map: parts[0], x: b.x + door, y: b.y + B.h, dir: 0 };
        def.indoor = b.custom !== 'sky';
        def.spawn = spawnOf(def.rows);
        def.townName = out.name;
      } else def = MAPS[id];
      if (!def) throw new Error('no map ' + id);
      cache[id] = def;
      return def;
    },
    scripts: {},
    talk: {},
    trivia: [
      'CRITTER FACT: A FUZZLETS swarm can surround a tank and nibble it to bits!',
      'CRITTER FACT: SHELLBERT\'s shell shrugs off over a quarter of all damage.',
      'CRITTER FACT: HOOTINI can snipe from further away than any other critter.',
      'CRITTER FACT: BRAMBULL\'s thorns hurt anyone who punches it.',
      'CRITTER FACT: SHADECAT is invisible for a moment after it appears.',
      'CRITTER FACT: Critters level up faster when they actually fight!'
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
