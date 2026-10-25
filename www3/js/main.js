/* Critter Arena 3 — app shell: the journey (professor, starter, map, routes, gyms, rival),
 * catching and leveling, collection, tournament, exhibitions, input and the battle loop. */
(function () {
  var CA = window.CA, Art = CA.Art, SP = CA.SPECIES, R = CA.RULES, AU = CA.Audio;
  var $ = function (id) { return document.getElementById(id); };
  var STEP = 1 / 60;

  // ---- persistence (best-effort; the game works without storage) ----------------------
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('ca3.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('ca3.' + k, JSON.stringify(v)); } catch (e) { } }
  };

  var PLAYER_LOOK = { skin: '#ffd2a6', hair: '#3a2a1e', style: 'spiky', cap: '#3d8bff', shirt: '#3d8bff', pants: '#2b3a66', pack: '#ffd23f' };
  var S = {
    screen: 'title', prev: 'title',
    deck: null, beaten: store.get('beaten', []), cups: store.get('cups', 0),
    battle: null, ai: [null, null], trIdx: 0, mode: 'league', cfg: null,
    ui: { drag: null, sel: -1, phase: 'battle', leadT: 0, looks: [PLAYER_LOOK, PLAYER_LOOK], names: ['You', 'Rival'], spectate: false, speed: 1, info: -1 },
    paused: false, endT: 0, resultShown: false, acc: 0, hitstop: 0, slow: 0, introT: 0,
    cup: store.get('cup', null), watch: { a: 4, b: 6 },
    save: store.get('save', null), node: null
  };
  AU.musicOn = store.get('music', true);
  AU.sfxOn = store.get('sfx', true);

  // ---- the save game: your name, rival, critters (with levels), team and progress ----------
  function newSave(name, rival, starter) {
    var o = {};
    o[starter] = { lv: 5, xp: 0 };
    return { name: name, rival: rival, starter: starter, rivalStarter: CA.rivalStarter(starter), owned: o, deck: [starter],
      cleared: ['town'], badges: [], seen: [starter], caught: 1, champion: false };
  }
  function persist() { if (S.save) { S.save.deck = S.deck.filter(Boolean); store.set('save', S.save); } }
  // without a journey save (e.g. trying Watch first), a demo team plays at level 10
  function owned() { return S.save ? Object.keys(S.save.owned) : CA.DEFAULT_DECK.slice(); }
  function levelOf(id) { return S.save && S.save.owned[id] ? S.save.owned[id].lv : 10; }
  function myLevels() { var m = {}; owned().forEach(function (id) { m[id] = levelOf(id); }); return m; }
  function avgLevel() { var d = S.deck.filter(Boolean); return Math.round(d.reduce(function (a, id) { return a + levelOf(id); }, 0) / Math.max(1, d.length)); }
  function seen(id) { if (S.save && S.save.seen.indexOf(id) < 0) S.save.seen.push(id); }
  function validDeck(d) {
    if (!d) return null;
    var f = d.filter(Boolean);
    if (f.length < 1 || f.length > 8) return null;
    var own = owned();
    for (var i = 0; i < f.length; i++) if (!SP[f[i]] || f.indexOf(f[i]) !== i || own.indexOf(f[i]) < 0) return null;
    return f;
  }
  S.deck = (S.save && validDeck(S.save.deck)) || CA.DEFAULT_DECK.slice();

  var gameCv = $('game'), bgCv = $('menubg');
  var renderer = new CA.Renderer(gameCv);
  var live = [];   // animated canvases on the current screen

  // ---- canvas helpers -------------------------------------------------------------------
  function mkCanvas(w, h, cls) {
    var cv = document.createElement('canvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    if (cls) cv.className = cls;
    cv._dpr = dpr; cv._w = w; cv._h = h;
    return cv;
  }
  function ctxOf(cv) { var c = cv.getContext('2d'); c.setTransform(cv._dpr, 0, 0, cv._dpr, 0, 0); return c; }
  function cardCanvas(id, w) {
    var h = w * 1.27, cv = mkCanvas(w, h);
    renderer.drawCard(ctxOf(cv), id, 1, 1, w - 2, h - 2, 0, {});
    return cv;
  }
  function faceCanvas(id, size, bg, evo) {
    var cv = mkCanvas(size, size), c = ctxOf(cv);
    if (bg) { c.fillStyle = bg; c.fillRect(0, 0, size, size); }
    var sp = SP[id], hgt = Art.height(id) * (evo ? 1.25 : 1);
    Art.portrait(c, id, size / 2, size * 0.95 + (sp.fly ? size * 0.12 : 0), size * 0.9 / hgt, 0.3, evo);
    return cv;
  }
  function trainerCanvas(look, w, h) {
    var cv = mkCanvas(w, h), c = ctxOf(cv);
    Art.trainer(c, look, w / 2, h * 0.97, h / 125, false, { t: 0.5 });
    return cv;
  }
  function badgeCanvas(tr, size, earned) {
    var cv = mkCanvas(size, size);
    Art.badge(ctxOf(cv), tr.badge, size / 2, size / 2, size * 0.4, earned);
    return cv;
  }
  function stars(tr) {
    var n = Math.max(1, Math.round(tr.skill * 5));
    return '★★★★★'.slice(0, n) + '<span style="opacity:.3">' + '★★★★★'.slice(n) + '</span>';
  }
  function typeChip(t) { var T = CA.TYPES[t]; return '<span class="chip" style="background:' + T.color + '">' + T.name + '</span>'; }
  function trById(id) { for (var i = 0; i < CA.TRAINERS.length; i++) if (CA.TRAINERS[i].id === id) return CA.TRAINERS[i]; return null; }
  function rewardFrom(id) { for (var i = 0; i < CA.TRAINERS.length; i++) if (CA.TRAINERS[i].reward === id) return CA.TRAINERS[i]; return null; }

  // ---- screens --------------------------------------------------------------------------
  function show(name) {
    if (name !== S.screen) S.prev = S.screen;
    S.screen = name;
    var all = document.querySelectorAll('.screen');
    for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i].id === 'scr-' + name);
    var inBattle = name === 'battle';
    gameCv.style.display = inBattle ? 'block' : 'none';
    bgCv.style.display = inBattle ? 'none' : 'block';
    $('pausebtn').style.display = inBattle ? 'block' : 'none';
    live = [];
    if (name === 'title') buildTitle();
    if (name === 'league') buildLeague();
    if (name === 'team') buildTeam();
    if (name === 'help') buildHelp();
    if (name === 'cup') buildCup();
    if (name === 'watch') buildWatch();
    if (name === 'map') buildMap();
    if (!inBattle) AU.music(name === 'map' || name === 'intro' ? 'town' : 'menu');
    var sc = $('scr-' + name); if (sc) sc.scrollTop = 0;
  }

  function buildTitle() {
    var bc = $('badgecase'); bc.innerHTML = '';
    CA.TRAINERS.forEach(function (tr) { bc.appendChild(badgeCanvas(tr, 24, !!S.save && S.save.badges.indexOf(tr.id) >= 0)); });
    var cnt = document.createElement('span');
    cnt.style.cssText = 'font-weight:900;font-size:12px;align-self:center;margin-left:6px;color:#1d4fb0';
    cnt.textContent = S.save ? owned().length + '/18 caught' + (S.save.champion ? ' · ★ Champion' : '') + (S.cups ? ' · 🏆' + S.cups : '') : 'A new adventure awaits!';
    $('b-journey').textContent = S.save ? 'Continue Journey' : 'Start Journey';
    bc.appendChild(cnt);
    syncToggles();
  }

  function syncToggles() {
    $('b-music').textContent = '♪ Music: ' + (AU.musicOn ? 'On' : 'Off');
    $('b-sfx').textContent = '🔊 Sound: ' + (AU.sfxOn ? 'On' : 'Off');
    $('p-music').textContent = '♪ Music: ' + (AU.musicOn ? 'On' : 'Off');
    $('p-sfx').textContent = '🔊 Sound: ' + (AU.sfxOn ? 'On' : 'Off');
  }

  function unlockedCount() {
    var n = 0;
    while (n < CA.TRAINERS.length && S.beaten.indexOf(CA.TRAINERS[n].id) >= 0) n++;
    return n;
  }

  function buildLeague() {
    var box = $('trainers'); box.innerHTML = '';
    var open = unlockedCount();
    CA.TRAINERS.forEach(function (tr, i) {
      var row = document.createElement('div');
      var beaten = S.beaten.indexOf(tr.id) >= 0, locked = i > open;
      row.className = 'tr' + (locked ? ' locked' : '');
      var face = trainerCanvas(tr.look, 64, 64); face.className = 'face';
      var info = document.createElement('div'); info.className = 'info';
      var prize = tr.reward ? ' · prize: ' + (beaten ? SP[tr.reward].name : '???') : '';
      info.innerHTML = '<div class="nm">' + tr.name + '</div><div class="ti">' + tr.title + ' · <span class="stars">' + stars(tr) + '</span>' + prize + '</div>';
      var team = document.createElement('div'); team.className = 'team';
      tr.deck.forEach(function (id) { team.appendChild(faceCanvas(id, 26)); });
      info.appendChild(team);
      var num = document.createElement('div'); num.className = 'num'; num.textContent = i === 9 ? 'CHAMP' : '#' + (i + 1);
      row.appendChild(num); row.appendChild(face); row.appendChild(info);
      if (locked) { var lk = document.createElement('div'); lk.className = 'lock'; lk.textContent = '🔒'; row.appendChild(lk); }
      else row.appendChild(badgeCanvas(tr, 40, beaten)).className = 'bdg';
      row.onclick = function () {
        AU.init();
        if (locked) { AU.sfx('deny'); return; }
        AU.sfx('tap'); openVs(i, 'league');
      };
      box.appendChild(row);
    });
  }

  // ---- team builder / critterdex ---------------------------------------------------------
  var swapIn = null;
  function buildTeam() {
    var tg = $('teamgrid'); tg.innerHTML = '';
    var cg = $('collgrid'); cg.innerHTML = '';
    var own = owned();
    var cw = Math.min(110, (Math.min(window.innerWidth, 560) - 32 - 24 - 21) / 4);
    for (var i = 0; i < 8; i++) {
      var slot = document.createElement('div');
      var id = S.deck[i];
      slot.className = 'slot' + (id ? '' : ' empty') + (swapIn && id ? ' swap' : '');
      if (id) { slot.appendChild(cardCanvas(id, cw)); slot.appendChild(lvTag(id)); }
      else if (swapIn) slot.className += ' swap';
      (function (idx) {
        slot.onclick = function () {
          AU.init(); AU.sfx('tap');
          if (swapIn) {
            if (S.deck.indexOf(swapIn) < 0) S.deck[idx] = swapIn;
            swapIn = null; saveDeck(); buildTeam(); return;
          }
          if (S.deck[idx]) openSheet(S.deck[idx]);
        };
      })(i);
      tg.appendChild(slot);
    }
    CA.SPECIES_ORDER.forEach(function (id) {
      var slot = document.createElement('div');
      var has = own.indexOf(id) >= 0;
      slot.className = 'slot' + (!has ? ' locked' : S.deck.indexOf(id) >= 0 ? ' inteam' : '');
      slot.appendChild(cardCanvas(id, 80));
      if (has) slot.appendChild(lvTag(id));
      slot.onclick = function () {
        AU.init();
        if (!has) {
          AU.sfx('deny');
          var where = whereFound(id);
          $('teamhint').textContent = S.save && S.save.seen.indexOf(id) >= 0 ? 'Seen it! ' + (where ? 'Catch one in ' + where + '.' : '') : where ? 'Rumoured to live in ' + where + '.' : 'Not yet discovered.';
          $('scr-team').scrollTop = 0;
          return;
        }
        AU.sfx('tap'); swapIn = null; openSheet(id);
      };
      cg.appendChild(slot);
    });
    var full = S.deck.filter(Boolean);
    var avg = full.reduce(function (a, id) { return a + SP[id].cost; }, 0) / Math.max(1, full.length);
    $('teamstat').textContent = full.length + '/8 · avg ☀ ' + avg.toFixed(1) + ' · caught ' + own.length + '/18';
    $('teamhint').textContent = swapIn ? 'Tap a team slot to swap in ' + SP[swapIn].name + '.' :
      full.length < 8 && own.length > full.length ? 'Room for ' + (8 - full.length) + ' more on your team — tap a critter below.' :
      full.length < 8 ? 'Catch wild critters on routes to grow your team.' : 'Tap a critter to see its stats and evolution.';
  }
  function lvTag(id) { var t = document.createElement('span'); t.className = 'lvtag'; t.textContent = 'Lv ' + levelOf(id); return t; }
  function whereFound(id) {
    for (var k in CA.ROUTES) if (CA.ROUTES[k].wild.indexOf(id) >= 0) return CA.ROUTES[k].name;
    return null;
  }
  function saveDeck() { if (validDeck(S.deck)) persist(); }

  function statRow(label, v, max, col, txt) {
    return '<div class="sbar"><span>' + label + '</span><div class="tk"><i style="width:' + Math.min(100, v / max * 100) + '%;background:' + col + '"></i></div><span>' + txt + '</span></div>';
  }
  function matchups(type) {
    var strong = [], weak = [], resist = [], hurt = [];
    Object.keys(CA.TYPES).forEach(function (t) {
      var m = CA.typeMult(type, t), d = CA.typeMult(t, type);
      if (m > 1) strong.push(t); if (m < 1) weak.push(t);
      if (d > 1) hurt.push(t); if (d < 1) resist.push(t);
    });
    function list(a) { return a.length ? a.map(typeChip).join('') : '<span class="muted">—</span>'; }
    return '<div class="matchups"><b>Hits hard vs:</b> ' + list(strong) + '<br><b>Hits weakly vs:</b> ' + list(weak) +
      '<br><b>Takes extra from:</b> ' + list(hurt) + '<br><b>Resists:</b> ' + list(resist) + '</div>';
  }

  function openSheet(id) {
    var sp = SP[id], role = CA.ROLES[sp.role], ev = CA.EVOS[id];
    var body = $('sheet-body');
    var inTeam = S.deck.indexOf(id) >= 0, count = S.deck.filter(Boolean).length;
    var form = { evo: 0 };
    function render() {
      var e = form.evo, k = e ? R.evoDmg : 1, hk = e ? R.evoHp : 1;
      var lm = CA.lvMult(levelOf(id));
      k *= lm; hk *= lm;
      var dps = sp.dmg * k / sp.rate * sp.n;
      var html = '<div class="top"><canvas class="big" id="sheet-cv"></canvas><div>' +
        '<h4>' + (e ? ev.name : sp.name) + (sp.n > 1 ? ' <span class="muted">×' + sp.n + '</span>' : '') + '</h4>' +
        typeChip(sp.type) + '<span class="chip" style="background:' + role.frame + ';color:' + role.ink + '">' + role.name + '</span>' +
        '<div style="margin-top:6px;font-weight:900;font-size:18px">☀ ' + (e ? '+' + CA.evoCost(sp) + ' to evolve' : sp.cost + ' energy') + '</div>' +
        (S.save && S.save.owned[id] ? '<div class="xprow" style="margin:4px 0 0"><b style="font-size:13px">Lv ' + S.save.owned[id].lv + '</b><div class="xpbar"><i style="width:' + Math.round(100 * S.save.owned[id].xp / CA.xpNext(S.save.owned[id].lv)) + '%"></i></div></div>' : '') +
        '<div class="muted" style="margin-top:2px">' + (e ? 'Signature move: ' + ev.move : role.blurb) + '</div></div></div>' +
        '<div class="formtog"><button class="btn small' + (e ? '' : ' on') + '" id="f-base">' + sp.name + '</button><button class="btn small' + (e ? ' on' : '') + '" id="f-evo">⬆ ' + ev.name + '</button></div>' +
        '<div class="desc">' + (e ? ev.desc : sp.desc) + '</div><div class="bars">' +
        statRow('Health', sp.hp * hk * sp.n, 3500, '#4fe36a', Math.round(sp.hp * hk) + (sp.n > 1 ? '×' + sp.n : '')) +
        statRow('Power', dps, 380, '#ff8a3d', Math.round(dps) + '/s') +
        statRow('Range', sp.range, 6.5, '#3d8bff', sp.range < 1 ? 'Melee' : sp.range.toFixed(1)) +
        statRow('Speed', sp.spd, 2.8, '#ffd23f', sp.spd >= 2.2 ? 'Fast' : sp.spd >= 1.4 ? 'Medium' : 'Slow') +
        '</div>' + matchups(sp.type) + '<div class="row" style="margin-top:14px">';
      if (inTeam && count > 1) html += '<button class="btn red" id="sh-rm" style="flex:1">Remove</button>';
      else if (inTeam) html += '';
      else if (count < 8) html += '<button class="btn primary" id="sh-add" style="flex:1">Add to team</button>';
      else html += '<button class="btn blue" id="sh-swap" style="flex:1">Swap in…</button>';
      html += '<button class="btn" id="sh-close" style="flex:1">Close</button></div>';
      body.innerHTML = html;
      var cv = $('sheet-cv'), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = 132 * dpr; cv.height = 132 * dpr;
      var T = CA.TYPES[sp.type];
      live = live.filter(function (l) { return !l.sheet; });
      live.push({
        cv: cv, sheet: true, draw: function (c, t) {
          c.setTransform(dpr, 0, 0, dpr, 0, 0);
          var g = c.createLinearGradient(0, 0, 0, 132); g.addColorStop(0, '#e9f8ff'); g.addColorStop(1, T.light);
          c.fillStyle = g; c.fillRect(0, 0, 132, 132);
          c.fillStyle = 'rgba(40,80,30,0.18)'; Art.helpers.E(c, 66, 120, 36, 9); c.fill();
          var hgt = Art.height(id) * (form.evo ? 1.3 : 1), s = 118 / hgt;
          var ph = t % 4, a = { t: t, mv: 0, walk: 0, atk: ph > 3.2 ? Math.sin((ph - 3.2) / 0.8 * Math.PI) : 0, hurt: 0, blink: (t % 3.3) < 0.12, faint: 0, evo: form.evo };
          Art.creature(c, id, a, 66, 124 + (sp.fly ? 14 : 0), s * (form.evo ? 1.12 : 1), 1);
        }
      });
      $('f-base').onclick = function () { AU.sfx('tap'); form.evo = 0; render(); };
      $('f-evo').onclick = function () { AU.sfx('tap'); form.evo = 1; render(); };
      $('sh-close').onclick = function () { AU.sfx('tap'); close(); };
      if ($('sh-rm')) $('sh-rm').onclick = function () {
        AU.sfx('tap'); var i = S.deck.indexOf(id); S.deck[i] = null;
        S.deck = S.deck.filter(Boolean); while (S.deck.length < 8) S.deck.push(null);
        close(); buildTeam();
      };
      if ($('sh-add')) $('sh-add').onclick = function () {
        AU.sfx('card'); var i = S.deck.indexOf(null); if (i < 0) i = S.deck.length; S.deck[i] = id;
        saveDeck(); close(); buildTeam(); AU.cry(id);
      };
      if ($('sh-swap')) $('sh-swap').onclick = function () { AU.sfx('tap'); swapIn = id; close(); buildTeam(); $('scr-team').scrollTop = 0; };
    }
    function close() { $('sheet').classList.remove('on'); live = live.filter(function (l) { return !l.sheet; }); }
    render();
    $('sheet').classList.add('on');
  }
  $('sheet').onclick = function (e) { if (e.target === $('sheet')) { $('sheet').classList.remove('on'); live = live.filter(function (l) { return !l.sheet; }); } };

  // ---- help -------------------------------------------------------------------------------
  function buildHelp() {
    var hr = $('help-roles'); hr.innerHTML = '';
    Object.keys(CA.ROLES).forEach(function (k) {
      var r = CA.ROLES[k];
      var el = document.createElement('div'); el.className = 'roleln';
      el.innerHTML = '<span class="sw" style="background:' + r.frame + ';color:' + r.ink + '">' + r.name + '</span><span>' + r.blurb + '</span>';
      hr.appendChild(el);
    });
    $('help-cycle').innerHTML = ['fire', 'leaf', 'stone', 'spark', 'water', 'fire'].map(typeChip).join(' › ');
  }

  // ---- VS screen ----------------------------------------------------------------------------
  function openVs(i, mode) {
    S.trIdx = i; S.mode = mode;
    var tr = CA.TRAINERS[i];
    show('vs');
    $('vs-title').textContent = mode === 'quick' ? 'Quick Battle' : mode === 'cup' ? 'Sun Cup' : (i === 9 ? 'Champion' : 'League #' + (i + 1));
    $('vs-bubble').innerHTML = '<b>' + tr.title.toUpperCase() + ' ' + tr.name.toUpperCase() + '</b> wants to battle!<br>“' + tr.intro + '”';
    $('vs-their').textContent = tr.name + '\'s team';
    $('vs-stars').innerHTML = stars(tr);
    var face = $('vs-face'), dpr = Math.min(2, window.devicePixelRatio || 1);
    face.width = 130 * dpr; face.height = 150 * dpr;
    live.push({ cv: face, draw: function (c, t) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, 130, 150);
      c.fillStyle = 'rgba(255,77,94,0.35)'; Art.helpers.E(c, 65, 143, 44, 9); c.fill();
      Art.trainer(c, tr.look, 65, 144, 1.18, false, { t: t });
    } });
    var th = $('vs-theirs'); th.innerHTML = '';
    tr.deck.forEach(function (id) { th.appendChild(faceCanvas(id, 44)); });
    var mine = $('vs-mine'); mine.innerHTML = '';
    var ok = !!validDeck(S.deck);
    S.deck.forEach(function (id) { if (id) mine.appendChild(faceCanvas(id, 44)); });
    var avg = S.deck.filter(Boolean).reduce(function (a, id) { return a + SP[id].cost; }, 0) / 8;
    $('vs-avg').textContent = ok ? 'avg ☀ ' + avg.toFixed(1) : 'Team incomplete!';
    $('vs-go').disabled = !ok;
  }

  // ---- tournament: an 8-team Sun Cup bracket ------------------------------------------------
  function newCup() {
    var ids = CA.TRAINERS.map(function (t) { return t.id; });
    for (var i = ids.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var x = ids[i]; ids[i] = ids[j]; ids[j] = x; }
    var teams = ['you'].concat(ids.slice(0, 7));
    for (i = teams.length - 1; i > 0; i--) { j = (Math.random() * (i + 1)) | 0; x = teams[i]; teams[i] = teams[j]; teams[j] = x; }
    var cup = { teams: teams, rounds: [[], [], []], round: 0, champ: null, out: false };
    for (i = 0; i < 4; i++) cup.rounds[0].push({ a: teams[i * 2], b: teams[i * 2 + 1], w: null, sc: '' });
    return cup;
  }
  function teamName(id) { return id === 'you' ? 'You' : trById(id).name; }
  function teamFace(id, size) { return trainerCanvas(id === 'you' ? PLAYER_LOOK : trById(id).look, size, size); }
  function teamDeck(id) { return id === 'you' ? S.deck.slice() : trById(id).deck.slice(); }

  // run an AI-vs-AI match headlessly
  function simMatch(aId, bId) {
    var A = trById(aId), Bt = trById(bId);
    var b = new CA.Battle({ decks: [A.deck.slice(), Bt.deck.slice()], energyMult: [CA.crowdBonus(A), CA.crowdBonus(Bt)] });
    var ai = [new CA.AI(b, 0, A.skill), new CA.AI(b, 1, Bt.skill)];
    ai.forEach(function (x) { var L = x.pickLead(); b.deploy(x.side, L.hi, L.x, L.y, true); });
    var steps = 0;
    while (!b.over && steps < 30 * 400) { ai[0].update(1 / 30); ai[1].update(1 / 30); b.step(1 / 30); b.events.length = 0; steps++; }
    var w = b.winner === -1 ? (Math.random() < 0.5 ? 0 : 1) : b.winner;
    return { w: w ? bId : aId, sc: b.sides[0].ko + '-' + b.sides[1].ko };
  }
  function cupAdvance() {
    var cup = S.cup;
    var r = cup.rounds[cup.round];
    for (var i = 0; i < r.length; i++) if (!r[i].w) return;
    if (cup.round === 2) { cup.champ = r[0].w; if (cup.champ === 'you') { S.cups++; store.set('cups', S.cups); } return; }
    cup.round++;
    var nr = cup.rounds[cup.round];
    for (i = 0; i < r.length; i += 2) nr.push({ a: r[i].w, b: r[i + 1].w, w: null, sc: '' });
  }
  function cupSimOthers() {
    var r = S.cup.rounds[S.cup.round];
    r.forEach(function (m) { if (!m.w && m.a !== 'you' && m.b !== 'you') { var res = simMatch(m.a, m.b); m.w = res.w; m.sc = res.sc; } });
  }
  function myMatch() {
    var cup = S.cup; if (!cup) return null;
    var r = cup.rounds[cup.round];
    for (var i = 0; i < r.length; i++) if (!r[i].w && (r[i].a === 'you' || r[i].b === 'you')) return r[i];
    return null;
  }
  function buildCup() {
    if (!S.cup || S.cup.champ && S.cup.seen) S.cup = newCup();
    var cup = S.cup;
    store.set('cup', cup);
    var br = $('bracket'); br.innerHTML = '';
    var names = ['Quarter-finals', 'Semi-finals', 'Final'];
    $('cup-round').textContent = cup.champ ? 'Champion crowned!' : names[cup.round];
    $('cup-note').textContent = cup.champ ? '' : cup.out ? 'You were knocked out' : 'Win 3 battles to lift the Sun Cup';
    for (var r = 0; r < 3; r++) {
      var wrap = document.createElement('div'); wrap.className = 'rnd-wrap';
      wrap.innerHTML = '<h4>' + ['QUARTERS', 'SEMIS', 'FINAL'][r] + '</h4>';
      var col = document.createElement('div'); col.className = 'rnd';
      wrap.appendChild(col);
      var ms = cup.rounds[r];
      var count = [4, 2, 1][r];
      for (var i = 0; i < count; i++) {
        var m = ms[i], box = document.createElement('div');
        box.className = 'match' + (m && (m.a === 'you' || m.b === 'you') ? ' mine' : '');
        ['a', 'b'].forEach(function (k) {
          var row = document.createElement('div'); row.className = 'tm';
          if (m) {
            var id = m[k];
            if (m.w) row.className += m.w === id ? ' win' : ' lose';
            if (id === 'you') row.className += ' you';
            row.appendChild(teamFace(id, 22));
            var nm = document.createElement('span'); nm.textContent = teamName(id); row.appendChild(nm);
          } else row.innerHTML = '<span class="muted">—</span>';
          box.appendChild(row);
        });
        if (m && m.w && m.sc) { var sc = document.createElement('div'); sc.className = 'w'; sc.style.cursor = 'default'; sc.textContent = 'KO ' + m.sc; box.appendChild(sc); }
        if (m && !m.w && m.a !== 'you' && m.b !== 'you') {
          var wl = document.createElement('div'); wl.className = 'w'; wl.textContent = '👁 Watch';
          (function (mm) { wl.onclick = function () { AU.init(); AU.sfx('tap'); watchCupMatch(mm); }; })(m);
          box.appendChild(wl);
        }
        col.appendChild(box);
      }
      br.appendChild(wrap);
    }
    var acts = $('cup-actions'); acts.innerHTML = '';
    function btn(label, cls, fn) { var b = document.createElement('button'); b.className = 'btn ' + cls; b.style.flex = '1'; b.textContent = label; b.onclick = function () { AU.init(); AU.sfx('tap'); fn(); }; acts.appendChild(b); }
    if (cup.champ) {
      var tro = document.createElement('div'); tro.className = 'trophy'; tro.style.flex = '1';
      var tc = mkCanvas(90, 90); drawTrophy(ctxOf(tc), 45, 48, cup.champ === 'you');
      tro.appendChild(tc);
      var lab = document.createElement('div'); lab.style.cssText = 'font-weight:900;font-size:16px;text-align:center';
      lab.textContent = cup.champ === 'you' ? 'You won the Sun Cup!' : teamName(cup.champ) + ' won the Sun Cup';
      tro.appendChild(lab); acts.appendChild(tro);
      cup.seen = true; store.set('cup', cup);
      btn('New Cup', 'primary', function () { S.cup = newCup(); buildCup(); });
      return;
    }
    var mm = myMatch();
    if (mm) btn('Play your match', 'primary', function () { var opp = mm.a === 'you' ? mm.b : mm.a; S.cupMatch = mm; openVs(CA.TRAINERS.indexOf(trById(opp)), 'cup'); });
    else {
      btn(cup.out ? 'Simulate to the end' : 'Next round', 'primary', function () {
        do { cupSimOthers(); cupAdvance(); } while (cup.out && !cup.champ);
        store.set('cup', cup); buildCup();
      });
    }
  }
  function drawTrophy(c, x, y, gold) {
    var g = c.createLinearGradient(x - 30, 0, x + 30, 0);
    g.addColorStop(0, gold ? '#ffe36a' : '#dfe6ef'); g.addColorStop(0.5, gold ? '#fff7c2' : '#ffffff'); g.addColorStop(1, gold ? '#e8a800' : '#9aa6b8');
    c.lineWidth = 3; c.strokeStyle = '#2b1f33'; c.fillStyle = g;
    c.beginPath(); c.moveTo(x - 26, y - 34); c.lineTo(x + 26, y - 34); c.quadraticCurveTo(x + 26, y + 2, x, y + 6); c.quadraticCurveTo(x - 26, y + 2, x - 26, y - 34); c.fill(); c.stroke();
    c.beginPath(); c.arc(x - 26, y - 22, 9, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(x + 26, y - 22, 9, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
    c.fillRect(x - 5, y + 5, 10, 14); c.strokeRect(x - 5, y + 5, 10, 14);
    CA.rr(c, x - 18, y + 18, 36, 10, 3); c.fill(); c.stroke();
    Art.star5(c, x, y - 18, 10, 0.45); c.fillStyle = gold ? '#ff8a1f' : '#9aa6b8'; c.fill();
  }

  // ---- watch: exhibition between any two league teams ---------------------------------------
  function buildWatch() {
    ['a', 'b'].forEach(function (k) {
      var box = $('pick-' + k); box.innerHTML = '';
      CA.TRAINERS.forEach(function (tr, i) {
        var el = document.createElement('div');
        el.className = 'pick' + (S.watch[k] === i ? ' ' + k : '');
        el.appendChild(trainerCanvas(tr.look, 56, 56));
        var nm = document.createElement('div'); nm.textContent = tr.name; el.appendChild(nm);
        el.onclick = function () { AU.init(); AU.sfx('tap'); S.watch[k] = i; buildWatch(); };
        box.appendChild(el);
      });
    });
  }
  function watchMatch(ia, ib, cupMatch) {
    var A = CA.TRAINERS[ia], Bt = CA.TRAINERS[ib];
    startBattle({
      decks: [A.deck.slice(), Bt.deck.slice()], looks: [A.look, Bt.look], names: [A.name, Bt.name],
      skills: [A.skill, Bt.skill], emult: [CA.crowdBonus(A), CA.crowdBonus(Bt)], spectate: true, cupMatch: cupMatch || null,
      intro: A.name + ' VS ' + Bt.name + '!'
    });
  }
  function watchCupMatch(m) { S.mode = 'cupwatch'; watchMatch(CA.TRAINERS.indexOf(trById(m.a)), CA.TRAINERS.indexOf(trById(m.b)), m); }

  // ===========================================================================================
  // THE JOURNEY
  // ===========================================================================================
  var RIVAL_LINES = [
    { intro: '{N}! I can\'t wait any longer. Let\'s check out our critters!', lose: 'What?! Unbelievable! I picked the wrong critter!', win: 'Yeah! Am I great or what?' },
    { intro: 'Hey {N}! Still tagging along behind me? Watch and learn!', lose: 'Hmph. Lucky break. Don\'t get used to it!', win: 'Ha! Maybe try catching some better critters?' },
    { intro: '{N}... I\'ve beaten everyone. Only you stand between me and the Champion!', lose: '...I can\'t believe it. You really are the best.', win: 'See ya later, slowcoach! The Champion\'s mine!' }
  ];
  function rivalLine(n, k) { return RIVAL_LINES[n][k].replace('{N}', S.save.name); }

  function nodeIndex(id) { for (var i = 0; i < CA.JOURNEY.length; i++) if (CA.JOURNEY[i].id === id) return i; return -1; }
  function currentIndex() {
    for (var i = 0; i < CA.JOURNEY.length; i++) if (S.save.cleared.indexOf(CA.JOURNEY[i].id) < 0) return i;
    return CA.JOURNEY.length;
  }
  function nodeUnlocked(i) {
    var n = CA.JOURNEY[i];
    if (n.id === 'sky') return !!S.save.champion;
    return i <= currentIndex();
  }
  function nodeName(n) {
    if (n.kind === 'route') return CA.ROUTES[n.route].name;
    if (n.kind === 'gym') { var tr = trById(n.tr); return n.champion ? 'Champion ' + tr.name : n.elite ? 'Elite ' + tr.name : tr.name + '\'s Gym'; }
    if (n.kind === 'rival') return 'Rival ' + S.save.rival;
    return n.name;
  }
  function nodeSub(n) {
    // non-breaking spaces keep "Lv 15" together when a narrow node wraps
    if (n.kind === 'route') { var r = CA.ROUTES[n.route]; return r.legend ? 'A legend sleeps here · Lv\u00a0' + r.lv[0] : 'Wild critters · Lv\u00a0' + r.lv[0] + '–' + r.lv[1]; }
    if (n.kind === 'gym') return trById(n.tr).title + ' · Lv\u00a0' + n.lv;
    if (n.kind === 'rival') return 'Your rival · Lv\u00a0' + CA.RIVAL_TEAMS[n.n].lv;
    return 'Prof. Hazel\'s lab';
  }
  function nodeIcon(n, size) {
    var cv = mkCanvas(size, size), c = ctxOf(cv), m = size / 2;
    if (n.kind === 'town') {
      c.fillStyle = '#8ddd60'; CA.rr(c, 4, size * 0.62, size - 8, size * 0.3, 6); c.fill();
      c.fillStyle = '#fff6e6'; c.fillRect(m - 15, size * 0.38, 30, 22); c.strokeStyle = '#2b1f33'; c.lineWidth = 2; c.strokeRect(m - 15, size * 0.38, 30, 22);
      c.beginPath(); c.moveTo(m - 19, size * 0.4); c.lineTo(m, size * 0.14); c.lineTo(m + 19, size * 0.4); c.closePath(); c.fillStyle = '#ff4d5e'; c.fill(); c.stroke();
      c.fillStyle = '#3d8bff'; c.fillRect(m - 4, size * 0.52, 8, 11);
    } else if (n.kind === 'route') {
      var r = CA.ROUTES[n.route];
      if (r.legend) { Art.portrait(c, 'azurion', m, size * 0.98 + size * 0.1, size * 0.85 / Art.height('azurion'), 0.2); if (!S.save.champion) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#2b1f33'; c.fillRect(0, 0, size, size); } }
      else {
        for (var k = 0; k < 7; k++) {
          var gx = 6 + k * (size - 12) / 6, gh = size * (0.35 + (k % 3) * 0.1);
          c.beginPath(); c.moveTo(gx - 6, size - 6); c.quadraticCurveTo(gx - 2, size - gh, gx, size - gh - 6); c.quadraticCurveTo(gx + 2, size - gh, gx + 6, size - 6); c.closePath();
          c.fillStyle = k % 2 ? r.tint : Art.shade(r.tint, -0.2); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#2b1f33'; c.stroke();
        }
      }
    } else if (n.kind === 'gym') {
      var tr = trById(n.tr);
      Art.badge(c, tr.badge, m, m, size * 0.38, S.save.badges.indexOf(tr.id) >= 0);
    } else if (n.kind === 'rival') {
      Art.trainer(c, CA.RIVAL_LOOK, m, size * 1.25, size / 70, false, { t: 0.5 });
    }
    return cv;
  }

  function buildMap() {
    var box = $('map'); box.innerHTML = '';
    var cur = currentIndex();
    $('map-title').textContent = S.save.name + '\'s Journey';
    $('map-stats').textContent = 'Badges\u00a0' + S.save.badges.length + '/8 · Caught\u00a0' + owned().length + '/18 · Seen\u00a0' + S.save.seen.length;
    var bd = $('map-badges'); bd.innerHTML = '';
    CA.JOURNEY.forEach(function (n, i) {
      if (n.id === 'sky' && !S.save.champion) return;
      var el = document.createElement('div');
      var unlocked = nodeUnlocked(i), cleared = S.save.cleared.indexOf(n.id) >= 0;
      el.className = 'node ' + (i % 2 ? 'r' : 'l') + (unlocked ? '' : ' locked') + (i === cur || (n.id === 'sky' && !cleared) ? ' cur' : '');
      el.appendChild(nodeIcon(n, 50));
      var info = document.createElement('div');
      info.innerHTML = '<div class="nm">' + nodeName(n) + '</div><div class="sub">' + nodeSub(n) + '</div>';
      el.appendChild(info);
      var st = document.createElement('span'); st.className = 'st';
      st.textContent = !unlocked ? '🔒' : cleared ? '✓' : '★';
      el.appendChild(st);
      el.onclick = function () {
        AU.init();
        if (!unlocked) { AU.sfx('deny'); return; }
        AU.sfx('tap');
        if (n.kind === 'town') openLab();
        else if (n.kind === 'route') openRoute(n);
        else openNodeVs(n);
      };
      box.appendChild(el);
    });
    setTimeout(function () {
      var c = box.querySelector('.node.cur');
      if (c) c.scrollIntoView({ block: 'center' });
    }, 30);
  }

  function sheetOpen(html, setup) {
    $('sheet-body').innerHTML = html;
    $('sheet').classList.add('on');
    if (setup) setup();
  }
  function sheetClose() { $('sheet').classList.remove('on'); live = live.filter(function (l) { return !l.sheet; }); }

  function openLab() {
    var own = owned().length, cur = CA.JOURNEY[Math.min(currentIndex(), CA.JOURNEY.length - 1)];
    var tips = [
      'You have caught ' + own + ' of 18 critters. Next stop: ' + nodeName(cur) + '!',
      'Wild critters can only be caught while they are still standing. Weaken them, then throw!',
      'Critters that actually fight earn more XP than the ones waiting on the bench.',
      'Evolving a critter in battle is often cheaper than sending a new one.',
      'Fire beats Leaf, Leaf beats Stone, Stone beats Spark, Spark beats Water, and Water beats Fire!'
    ];
    var tip = tips[(Math.random() * tips.length) | 0];
    sheetOpen('<div class="top"><canvas class="big" id="lab-cv"></canvas><div><h4>Prof. Hazel</h4><div class="muted">Sunny Town lab</div></div></div>' +
      '<div class="quote" style="margin:12px 0;border:2.5px solid var(--ink);border-radius:12px;padding:10px;background:#f3f8ff;font-weight:700">“' + tip + '”</div>' +
      '<div class="row"><button class="btn" id="lab-team" style="flex:1">My Team</button><button class="btn primary" id="lab-close" style="flex:1">Thanks!</button></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn small red" id="lab-reset" style="flex:1">Start a new journey</button></div>', function () {
      var cv = $('lab-cv'), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = 132 * dpr; cv.height = 132 * dpr;
      live.push({ cv: cv, sheet: true, draw: function (c, t) {
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        var g = c.createLinearGradient(0, 0, 0, 132); g.addColorStop(0, '#fff6e6'); g.addColorStop(1, '#ffe0b0');
        c.fillStyle = g; c.fillRect(0, 0, 132, 132);
        Art.trainer(c, CA.PROF.look, 66, 128, 1.0, false, { t: t });
      } });
      $('lab-team').onclick = function () { AU.sfx('tap'); sheetClose(); swapIn = null; show('team'); };
      $('lab-close').onclick = function () { AU.sfx('tap'); sheetClose(); };
      $('lab-reset').onclick = function () {
        AU.sfx('tap');
        if (this.dataset.sure) { sheetClose(); S.save = null; store.set('save', null); S.deck = CA.DEFAULT_DECK.slice(); startIntro(); }
        else { this.dataset.sure = 1; this.textContent = 'Tap again to erase your save'; }
      };
    });
  }

  function openRoute(n) {
    var r = CA.ROUTES[n.route];
    var list = r.wild.map(function (id) {
      var known = S.save.seen.indexOf(id) >= 0, have = !!S.save.owned[id];
      return '<div><canvas data-id="' + id + '" data-known="' + (known ? 1 : 0) + '"></canvas>' + (known ? SP[id].name : '???') + (have ? ' ✓' : '') + '</div>';
    }).join('');
    sheetOpen('<h4>' + r.name + '</h4><div class="muted">' + (r.legend ? 'Something enormous is sleeping at the top...' : 'Tall grass rustles. Wild critters Lv ' + r.lv[0] + '–' + r.lv[1] + ' live here.') + '</div>' +
      '<div class="wildlist">' + list + '</div>' +
      '<div class="muted" style="margin-bottom:10px">Tip: knock its HP into the red, then tap <b>CATCH</b>. Don\'t knock it out!</div>' +
      '<div class="row"><button class="btn" id="rt-close" style="flex:1">Back</button><button class="btn primary" id="rt-go" style="flex:1.5">Walk into the grass!</button></div>', function () {
      var cvs = $('sheet-body').querySelectorAll('canvas[data-id]');
      for (var i = 0; i < cvs.length; i++) {
        var cv = cvs[i], id = cv.dataset.id, dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = 64 * dpr; cv.height = 64 * dpr;
        var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        Art.portrait(c, id, 32, 60 + (SP[id].fly ? 8 : 0), 54 / Art.height(id), 0.3);
        if (cv.dataset.known !== '1') { c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#2b1f33'; c.fillRect(0, 0, 64, 64); }
      }
      $('rt-close').onclick = function () { AU.sfx('tap'); sheetClose(); };
      $('rt-go').onclick = function () {
        AU.sfx('go'); sheetClose();
        if (!validDeck(S.deck)) { show('team'); return; }
        S.node = n; S.mode = 'journey';
        startBattle(wildCfg(n));
      };
    });
  }

  function wildCfg(n) {
    var r = CA.ROUTES[n.route];
    // favour critters you haven't caught yet
    var pool = r.wild.filter(function (id) { return !S.save.owned[id]; });
    var sp = pool.length && Math.random() < 0.65 ? pool[(Math.random() * pool.length) | 0] : r.wild[(Math.random() * r.wild.length) | 0];
    var lv = r.lv[0] + ((Math.random() * (r.lv[1] - r.lv[0] + 1)) | 0);
    var minions = r.legend ? [] : r.wild.filter(function (x) { return x !== sp; });
    return {
      decks: [S.deck.filter(Boolean), [sp]], levels: [myLevels(), {}], looks: [PLAYER_LOOK, null], names: [S.save.name, 'Wild'],
      skills: [null, null], emult: [1, 1], spectate: false, intro: null,
      wild: { sp: sp, level: lv, minions: minions, minionLevel: Math.max(2, lv - 2) }, enemyLv: lv, kind: 'wild'
    };
  }
  function uniformLevels(deck, lv, extra) { var m = {}; deck.forEach(function (id) { m[id] = lv; }); if (extra) for (var k in extra) m[k] = extra[k]; return m; }
  function nodeCfg(n) {
    if (n.kind === 'rival') {
      var RT = CA.RIVAL_TEAMS[n.n], deck = [S.save.rivalStarter].concat(RT.deck);
      var ex = {}; ex[S.save.rivalStarter] = RT.lv + 1;
      return { decks: [S.deck.filter(Boolean), deck], levels: [myLevels(), uniformLevels(deck, RT.lv, ex)], looks: [PLAYER_LOOK, CA.RIVAL_LOOK], names: [S.save.name, S.save.rival],
        skills: [null, RT.skill], emult: [1, 1], spectate: false, intro: rivalLine(n.n, 'intro'), enemyLv: RT.lv, kind: 'rival' };
    }
    var tr = trById(n.tr);
    return { decks: [S.deck.filter(Boolean), tr.deck.slice()], levels: [myLevels(), uniformLevels(tr.deck, n.lv)], looks: [PLAYER_LOOK, tr.look], names: [S.save.name, tr.name],
      skills: [null, tr.skill], emult: [1, 1], spectate: false, intro: (n.champion ? 'Champion ' : n.elite ? 'Elite ' : 'Gym Leader ') + tr.name + ' wants to battle!', enemyLv: n.lv, kind: 'gym' };
  }

  function openNodeVs(n) {
    S.node = n; S.mode = 'journey';
    var cfg = nodeCfg(n);
    show('vs');
    var tr = n.kind === 'gym' ? trById(n.tr) : null;
    $('vs-title').textContent = nodeName(n);
    $('vs-bubble').innerHTML = '<b>' + (tr ? tr.title.toUpperCase() + ' ' + tr.name.toUpperCase() : 'RIVAL ' + S.save.rival.toUpperCase()) + '</b><br>“' + (tr ? tr.intro : rivalLine(n.n, 'intro')) + '”';
    $('vs-their').textContent = cfg.names[1] + '\'s team · Lv ' + cfg.enemyLv;
    $('vs-stars').innerHTML = tr ? stars(tr) : '';
    var face = $('vs-face'), dpr = Math.min(2, window.devicePixelRatio || 1), look = cfg.looks[1];
    face.width = 130 * dpr; face.height = 150 * dpr;
    live.push({ cv: face, draw: function (c, t) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, 130, 150);
      c.fillStyle = 'rgba(255,77,94,0.35)'; Art.helpers.E(c, 65, 143, 44, 9); c.fill();
      Art.trainer(c, look, 65, 144, 1.18, false, { t: t });
    } });
    var th = $('vs-theirs'); th.innerHTML = '';
    cfg.decks[1].forEach(function (id) { th.appendChild(faceCanvas(id, 44)); });
    var mine = $('vs-mine'); mine.innerHTML = '';
    S.deck.forEach(function (id) { if (id) mine.appendChild(faceCanvas(id, 44)); });
    var ok = !!validDeck(S.deck);
    $('vs-avg').textContent = ok ? 'avg Lv ' + avgLevel() : 'Team incomplete!';
    $('vs-go').disabled = !ok;
    S.pendingCfg = cfg;
  }

  // ---- after a journey battle: XP, level-ups, catches, badges ------------------------------------
  function journeyResult(b, cfg) {
    var sv = S.save, win = b.winner === 0, n = S.node, out = { rows: [], caught: null, badge: null, cleared: false, champion: false };
    S.deck.filter(Boolean).forEach(function (id) {
      var o = sv.owned[id]; if (!o) return;
      var recs = b.sides[0].records.filter(function (r) { return r.sp === id; });
      var kills = recs.reduce(function (a, r) { return a + r.kills; }, 0);
      var gain = CA.battleXp(win, cfg.enemyLv, recs.length > 0, kills);
      var row = { id: id, from: o.lv, fromXp: o.xp / CA.xpNext(o.lv), gain: gain };
      o.xp += gain;
      while (o.lv < CA.MAX_LV && o.xp >= CA.xpNext(o.lv)) { o.xp -= CA.xpNext(o.lv); o.lv++; }
      row.to = o.lv; row.toXp = o.xp / CA.xpNext(o.lv);
      out.rows.push(row);
    });
    if (b.endReason === 'caught') {
      var w = cfg.wild, id = w.sp;
      seen(id);
      if (!sv.owned[id]) { sv.owned[id] = { lv: Math.max(2, w.level - 1), xp: 0 }; out.caught = { id: id, isNew: true }; if (S.deck.filter(Boolean).length < 8) { S.deck = S.deck.filter(Boolean); S.deck.push(id); } }
      else { sv.owned[id].xp += 60 + w.level * 10; while (sv.owned[id].lv < CA.MAX_LV && sv.owned[id].xp >= CA.xpNext(sv.owned[id].lv)) { sv.owned[id].xp -= CA.xpNext(sv.owned[id].lv); sv.owned[id].lv++; } out.caught = { id: id, isNew: false }; }
      sv.caught++;
    }
    if (win && n && sv.cleared.indexOf(n.id) < 0) { sv.cleared.push(n.id); out.cleared = true; }
    if (win && n && n.kind === 'gym' && sv.badges.indexOf(n.tr) < 0) { sv.badges.push(n.tr); out.badge = trById(n.tr); }
    if (win && n && n.champion && !sv.champion) { sv.champion = true; out.champion = true; }
    persist();
    return out;
  }

  function xpRowsHtml(rows) {
    return rows.map(function (r, i) {
      return '<div class="xprow"><canvas data-face="' + r.id + '"></canvas><div class="nm">' + SP[r.id].name + '<br><span class="muted">Lv ' + r.to + '</span></div>' +
        '<div class="xpbar"><i id="xpb' + i + '" style="width:' + Math.round((r.to > r.from ? 0 : r.fromXp) * 100) + '%"></i></div>' +
        '<div class="lvup">' + (r.to > r.from ? 'LEVEL UP!' : '+' + r.gain + ' XP') + '</div></div>';
    }).join('');
  }
  function animateXp(rows) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cvs = $('result-card').querySelectorAll('canvas[data-face]');
    for (var i = 0; i < cvs.length; i++) {
      var cv = cvs[i], id = cv.dataset.face; cv.width = 40 * dpr; cv.height = 40 * dpr;
      var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      Art.portrait(c, id, 20, 38 + (SP[id].fly ? 5 : 0), 34 / Art.height(id), 0.3);
    }
    setTimeout(function () {
      var ups = 0;
      rows.forEach(function (r, i) { var el = $('xpb' + i); if (el) el.style.width = Math.round(r.toXp * 100) + '%'; if (r.to > r.from) ups++; });
      if (ups) setTimeout(function () { AU.sfx('levelup'); }, 700);
    }, 350);
  }

  // ---- the professor's introduction -----------------------------------------------------------
  var INTRO = null;
  function introScript(I) {
    return [
      { scene: 'prof', say: 'Hello there! Welcome to the world of CRITTERS!' },
      { scene: 'prof', say: 'My name is HAZEL. People call me the Critter Prof!' },
      { scene: 'critters', say: 'This world is full of creatures called CRITTERS. They are pals, partners... and they all love a good stadium battle!' },
      { scene: 'player', say: 'First, what is your name?', input: 'name' },
      { scene: 'player', say: 'Right! So your name is ' + I.name + '!' },
      { scene: 'rival', say: 'This is my grandkid. They have been your rival since you were babies. ...Erm, what was their name again?', input: 'rival' },
      { scene: 'rival', say: 'That\'s right! I remember now! It\'s ' + I.rival + '!' },
      { scene: 'lab', say: I.name + '! Three critters are waiting in these capsules. Tap one to choose your very first partner!', pick: true },
      { scene: 'lab', say: I.rival + ': Then I\'ll take THIS one!', rival: true },
      { scene: 'player', say: I.name + '! Your very own critter legend is about to unfold! A world of dreams and adventures awaits! Let\'s go!', end: true }
    ];
  }
  function startIntro() {
    INTRO = { step: 0, t: 0, name: 'SUNNY', rival: 'REX', pick: -1, starter: null, cur: null, confirming: false };
    show('intro');
    AU.music('town');
    introGo(0);
  }
  function introGo(i) {
    INTRO.step = i; INTRO.t = 0; INTRO.confirming = false;
    INTRO.cur = introScript(INTRO)[i];
    INTRO.text = INTRO.cur.say;
    $('intro-name').classList.remove('on'); $('intro-yesno').classList.remove('on');
    if (INTRO.cur.rival) setTimeout(function () { AU.cry(CA.rivalStarter(INTRO.starter)); }, 400);
  }
  function introTap(x, y) {
    if (!INTRO) return;
    var I = INTRO, cur = I.cur, full = I.t * 40 >= I.text.length;
    if (!full) { I.t = 99; return; }
    if (cur.input) { if (!$('intro-name').classList.contains('on')) openNameInput(cur.input); return; }
    if (cur.pick && !I.starter) {
      var k = introCapsuleAt(x, y);
      if (k >= 0 && !I.confirming) {
        AU.sfx('pop'); I.pick = k; I.confirming = true; I.t = 0;
        var id = CA.STARTER_TRIO[k], sp = SP[id];
        AU.cry(id);
        I.text = 'So you want ' + sp.name.toUpperCase() + ', the ' + CA.TYPES[sp.type].name.toUpperCase() + ' critter?';
        $('intro-yesno').classList.add('on');
      }
      return;
    }
    if (cur.end) { finishIntro(); return; }
    AU.sfx('tap');
    introGo(I.step + 1);
  }
  function openNameInput(which) {
    var presets = which === 'name' ? ['SUNNY', 'ACE', 'KAI', 'MIA'] : ['REX', 'JADE', 'VOX', 'NOVA'];
    $('name-in').value = which === 'name' ? INTRO.name : INTRO.rival;
    var pr = $('name-presets'); pr.innerHTML = '';
    presets.forEach(function (p) { var b = document.createElement('button'); b.className = 'btn small'; b.textContent = p; b.onclick = function () { AU.sfx('tap'); $('name-in').value = p; }; pr.appendChild(b); });
    $('intro-name').classList.add('on');
    $('name-ok').onclick = function () {
      var v = ($('name-in').value || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, 7) || presets[0];
      if (which === 'name') INTRO.name = v; else INTRO.rival = v;
      AU.sfx('go'); $('intro-name').classList.remove('on');
      introGo(INTRO.step + 1);
    };
  }
  $('yn-yes').onclick = function () {
    if (!INTRO || INTRO.pick < 0) return;
    AU.sfx('fanfare');
    INTRO.starter = CA.STARTER_TRIO[INTRO.pick];
    $('intro-yesno').classList.remove('on');
    introGo(INTRO.step + 1);
  };
  $('yn-no').onclick = function () {
    if (!INTRO) return;
    AU.sfx('tap'); INTRO.pick = -1; INTRO.confirming = false;
    $('intro-yesno').classList.remove('on');
    INTRO.text = INTRO.cur.say; INTRO.t = 99;
  };
  function finishIntro() {
    S.save = newSave(INTRO.name, INTRO.rival, INTRO.starter);
    S.deck = [INTRO.starter];
    persist();
    INTRO = null;
    show('map');
  }
  // the intro is drawn in a virtual space scaled by the UI zoom so tablets get a big, readable scene;
  // the text box grows to fit the whole message
  function introLayout() {
    var z = S.uiZ || 1, W = window.innerWidth / z, Hh = window.innerHeight / z;
    var maxc = Math.floor((W - 50) / 12), n = 1, cur = '';
    if (INTRO) INTRO.text.toUpperCase().split(' ').forEach(function (w) { if ((cur + ' ' + w).trim().length > maxc) { n++; cur = w; } else cur += ' ' + w; });
    var boxH = Math.max(96, 34 + Math.min(6, n) * 18);
    return { W: W, H: Hh, z: z, boxH: boxH, boxY: Hh - boxH - 14 - (Hh > 700 ? 30 : 0) };
  }
  function introCapsuleAt(x, y) {
    var L = introLayout();
    for (var k = 0; k < 3; k++) {
      var cx = L.W / 2 + (k - 1) * Math.min(L.W * 0.28, 130), cy = L.H * 0.5;
      if (Math.hypot(x - cx, y - cy) < 46) return k;
    }
    return -1;
  }
  function drawIntro(dt, t) {
    var cv = $('intro-cv'), dpr = Math.min(2, window.devicePixelRatio || 1), L = introLayout(), pw = Math.round(window.innerWidth * dpr), ph = Math.round(window.innerHeight * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    var c = cv.getContext('2d'); c.setTransform(dpr * L.z, 0, 0, dpr * L.z, 0, 0);
    var I = INTRO; if (!I) return;
    I.t += dt;
    var scene = I.cur.scene, W = L.W, Hh = L.H;
    // a sunny lab: window light over a wooden floor
    var g = c.createLinearGradient(0, 0, 0, Hh);
    g.addColorStop(0, '#fff8e8'); g.addColorStop(0.62, '#ffe9c2'); g.addColorStop(0.621, '#e0b27a'); g.addColorStop(1, '#c98f58');
    c.fillStyle = g; c.fillRect(0, 0, W, Hh);
    c.fillStyle = '#bfe9ff'; CA.rr(c, W * 0.08, Hh * 0.08, W * 0.3, Hh * 0.2, 8); c.fill();
    c.strokeStyle = '#a07040'; c.lineWidth = 5; c.stroke();
    c.beginPath(); c.moveTo(W * 0.23, Hh * 0.08); c.lineTo(W * 0.23, Hh * 0.28); c.moveTo(W * 0.08, Hh * 0.18); c.lineTo(W * 0.38, Hh * 0.18); c.stroke();
    c.fillStyle = 'rgba(255,240,180,0.25)';
    c.beginPath(); c.moveTo(W * 0.08, Hh * 0.28); c.lineTo(W * 0.38, Hh * 0.28); c.lineTo(W * 0.75, Hh * 0.62); c.lineTo(W * 0.3, Hh * 0.62); c.closePath(); c.fill();
    for (var sh = 0; sh < 3; sh++) { c.fillStyle = '#d9a46a'; c.fillRect(W * 0.6, Hh * (0.1 + sh * 0.08), W * 0.32, 6); for (var bk = 0; bk < 6; bk++) { c.fillStyle = ['#ff4d5e', '#3d8bff', '#45c25a', '#ffd23f', '#a45cff'][(bk + sh) % 5]; c.fillRect(W * 0.62 + bk * W * 0.045, Hh * (0.1 + sh * 0.08) - 18, W * 0.035, 18); } }
    var cx = W / 2, floor = Hh * 0.62 + 30;
    c.fillStyle = 'rgba(60,30,10,0.18)'; Art.helpers.E(c, cx, floor, 70, 14); c.fill();
    if (scene === 'prof') Art.trainer(c, CA.PROF.look, cx, floor, 2.3, false, { t: t });
    else if (scene === 'player') Art.trainer(c, PLAYER_LOOK, cx, floor, 2.3, false, { t: t, cheer: I.cur.end ? 1 : 0 });
    else if (scene === 'rival') Art.trainer(c, CA.RIVAL_LOOK, cx, floor, 2.3, false, { t: t });
    else if (scene === 'critters') {
      var ids = ['fuzzlets', 'zappip', 'gloomcap', 'lumisprite'];
      for (var q = 0; q < 4; q++) {
        var x = cx + (q - 1.5) * Math.min(W * 0.22, 95), hop = Math.max(0, Math.sin(t * 4 + q * 1.4)) * 18;
        c.fillStyle = 'rgba(60,30,10,0.18)'; Art.helpers.E(c, x, floor, 26, 7); c.fill();
        Art.creature(c, ids[q], { t: t + q, mv: 0, walk: 0, atk: 0, hurt: 0, blink: ((t + q) % 3) < 0.12, faint: 0, happy: hop > 10 }, x, floor - hop, Math.min(1.15, W / 360), q % 2 ? -1 : 1);
      }
    } else if (scene === 'lab') {
      // the table with three capsules
      var ty = Hh * 0.5;
      c.fillStyle = '#a0683a'; CA.rr(c, cx - Math.min(W * 0.44, 210), ty + 18, Math.min(W * 0.88, 420), 26, 8); c.fill();
      c.fillStyle = '#7a4a26'; c.fillRect(cx - Math.min(W * 0.4, 190), ty + 44, 12, 60); c.fillRect(cx + Math.min(W * 0.4, 190) - 12, ty + 44, 12, 60);
      for (var k = 0; k < 3; k++) {
        var kx = cx + (k - 1) * Math.min(W * 0.28, 130);
        var id = CA.STARTER_TRIO[k];
        var taken = I.starter && (id === I.starter || (I.cur.rival && id === CA.rivalStarter(I.starter)));
        var show = I.pick === k || (I.cur.rival && id === CA.rivalStarter(I.starter)) || (I.starter && id === I.starter);
        if (!taken || show) Art.capsule(c, kx, ty, 20, k === 0 ? 1 : 0, I.pick === k ? Math.sin(t * 10) * 0.2 : 0);
        if (show) {
          c.fillStyle = 'rgba(255,240,180,0.35)'; Art.helpers.C(c, kx, ty - 50, 52); c.fill();
          Art.creature(c, id, { t: t, mv: 0, walk: 0, atk: 0, hurt: 0, blink: (t % 3) < 0.12, faint: 0, happy: true }, kx, ty - 12, 0.75, k === 2 ? -1 : 1);
          if (I.cur.rival && id === CA.rivalStarter(I.starter)) Art.pixelText(c, I.rival + "'S!", kx, ty - 110, 2, '#b0202e', 'center', '#ffffff');
        } else if (!I.starter) {
          Art.typeIcon(c, SP[id].type, kx, ty - 38, 11);
        }
      }
      if (I.cur.rival && CA.STARTER_TRIO.indexOf(CA.rivalStarter(I.starter)) < 0) {
        // the rival's pick isn't one of the trio (water starter) - show it popping out beside the table
        var rx = cx, rid = CA.rivalStarter(I.starter);
        Art.creature(c, rid, { t: t, mv: 0, walk: 0, atk: 0, hurt: 0, blink: false, faint: 0, happy: true }, rx, Hh * 0.3, 0.75, 1);
        Art.pixelText(c, I.rival + "'S!", rx, Hh * 0.3 - 92, 2, '#b0202e', 'center', '#ffffff');
      }
    }
    // Gen-1 text box
    var bx = 10, bw = W - 20, by = L.boxY, bh = L.boxH, px = 2;
    CA.rr(c, bx, by, bw, bh, 8); c.fillStyle = '#fbfbf4'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#2b1f33'; c.stroke();
    CA.rr(c, bx + 5, by + 5, bw - 10, bh - 10, 5); c.lineWidth = 2; c.stroke();
    var shown = I.text.slice(0, Math.floor(I.t * 40)).toUpperCase(), maxc = Math.floor((bw - 30) / (6 * px)), lines = [], curl = '';
    shown.split(' ').forEach(function (w) { if ((curl + ' ' + w).trim().length > maxc) { lines.push(curl.trim()); curl = w; } else curl += ' ' + w; });
    lines.push(curl.trim());
    for (var li = 0; li < Math.min(6, lines.length); li++) Art.pixelText(c, lines[li], bx + 16, by + 20 + li * 18, px, '#2b1f33', 'left');
    if (I.t * 40 >= I.text.length && !I.cur.input && !(I.cur.pick && !I.starter) && ((t * 3) | 0) % 2 === 0) {
      c.fillStyle = '#2b1f33'; c.beginPath(); c.moveTo(bx + bw - 26, by + bh - 20); c.lineTo(bx + bw - 14, by + bh - 20); c.lineTo(bx + bw - 20, by + bh - 12); c.closePath(); c.fill();
    }
  }
  $('intro-cv').addEventListener('pointerdown', function (ev) { AU.init(); var z = S.uiZ || 1; introTap(ev.clientX / z, ev.clientY / z); });

  // ---- battle ---------------------------------------------------------------------------------
  function startBattle(cfg) {
    AU.init();
    if (!cfg && S.mode === 'journey' && S.pendingCfg) cfg = S.pendingCfg;
    if (!cfg) {
      // quick battles and cup matches: rivals match your team's average level
      var tr = CA.TRAINERS[S.trIdx], lv = S.save ? avgLevel() : 10;
      cfg = {
        decks: [S.deck.filter(Boolean), tr.deck.slice()], looks: [PLAYER_LOOK, tr.look], names: [S.save ? S.save.name : 'You', tr.name],
        levels: [myLevels(), uniformLevels(tr.deck, lv)],
        skills: [null, tr.skill], emult: [1, CA.crowdBonus(tr)], spectate: false,
        intro: tr.title + ' ' + tr.name + ' wants to battle!'
      };
    }
    S.cfg = cfg;
    var b = S.battle = new CA.Battle({ decks: cfg.decks, energyMult: cfg.emult, levels: cfg.levels, wild: cfg.wild });
    S.ai = [cfg.skills[0] === null ? null : new CA.AI(b, 0, cfg.skills[0]), cfg.skills[1] === null ? null : new CA.AI(b, 1, cfg.skills[1])];
    if (S.save) { cfg.decks[1].forEach(seen); persist(); }
    var ui = S.ui;
    ui.looks = cfg.looks; ui.names = cfg.names; ui.spectate = cfg.spectate; ui.speed = 1; ui.info = -1;
    ui.drag = null; ui.sel = -1; ui.phase = 'intro'; ui.leadT = R.leadTime;
    S.paused = false; S.endT = 0; S.resultShown = false; S.acc = 0; S.hitstop = 0; S.slow = 0; S.introT = 1.9;
    renderer.fx = []; renderer.nums = []; renderer.callouts = []; renderer.banners = []; renderer.dialog = []; renderer.dlg = null;
    renderer.hype = 0.7; renderer.cam.tz = 1;
    show('battle');
    resize();
    // camera sweep: start close on the rival (or the wild critter) and pull back to the whole stadium
    var focus = cfg.wild ? renderer.proj(R.W / 2, 7) : renderer.trainerPos(1);
    renderer.cam.fx = focus.x; renderer.cam.fy = focus.y; renderer.cam.z = 1.45; renderer.cam.speed = 1.3;
    renderer.cam.tz = 1; renderer.cam.tfx = renderer.W / 2; renderer.cam.tfy = renderer.H * 0.45;
    if (cfg.intro) renderer.say(cfg.intro, true);
    if (!cfg.wild) renderer.fireworks(3);
    AU.music(cfg.wild ? 'wild' : 'battle');
    AU.crowdStart();
    AU.cheer(0.9);
  }

  // both leads are thrown at the same moment, then the clock starts
  function revealLeads(pLead) {
    var b = S.battle, ui = S.ui;
    if (ui.phase !== 'lead' && ui.phase !== 'intro') return;
    if (S.ai[0]) { var a0 = S.ai[0].pickLead(); b.deploy(0, a0.hi, a0.x, a0.y, true); }
    else if (pLead) b.deploy(0, pLead.hi, pLead.x, pLead.y, true);
    if (S.ai[1]) { var a1 = S.ai[1].pickLead(); b.deploy(1, a1.hi, a1.x, a1.y, true); }
    ui.phase = 'battle'; ui.sel = -1; ui.drag = null;
    renderer.cam.speed = 4;
    renderer.banner('BATTLE!', '#ffd23f');
    AU.sfx('go'); AU.cheer(1);
  }
  function autoLead() {
    var s = S.battle.sides[0], best = 0, bs = -9;
    for (var i = 0; i < s.hand.length; i++) {
      var sp = SP[s.hand[i]];
      if (sp.cost > s.energy) continue;
      var sc = (sp.role === 'tank' ? 3 : sp.role === 'brawler' ? 2.5 : 1) - sp.cost * 0.1;
      if (sc > bs) { bs = sc; best = i; }
    }
    return { hi: best, x: R.W / 2, y: 22 };
  }

  function leaveBattle() {
    AU.crowdStop();
    S.battle = null; S.ai = [null, null];
    $('ov-pause').classList.remove('on'); $('ov-result').classList.remove('on');
    S.paused = false;
    renderer.cam.tz = 1;
  }

  function handleEvents(b) {
    var ev = b.events, spect = S.ui.spectate;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      renderer.onEvent(e, b, S.ui);
      switch (e.k) {
        case 'throw': AU.sfx('throw'); break;
        case 'pop': AU.sfx('pop'); AU.cry(e.sp, e.side === 1 ? 0.92 : 1); AU.cheer(SP[e.sp].cost >= 6 ? 0.9 : 0.25); break;
        case 'hit': AU.sfx('hit'); if (e.eff > 0) AU.sfx('super'); if (e.dmg >= 230) S.hitstop = Math.max(S.hitstop, 0.06); break;
        case 'shoot': AU.sfx({ bubble: 'bubble', star: 'star', orb: 'orb', seed: 'pew', spark: 'twinkle', spore: 'puff' }[e.kind] || 'pew'); break;
        case 'chain': AU.sfx('zap'); break;
        case 'charging': AU.sfx('charge'); break;
        case 'beam': AU.sfx('beam'); AU.cheer(0.6); S.hitstop = 0.08; break;
        case 'cone': AU.sfx('fire'); break;
        case 'heal': AU.sfx('heal'); break;
        case 'shield': AU.sfx('shield'); break;
        case 'leap': AU.sfx('leap'); break;
        case 'land': S.hitstop = Math.max(S.hitstop, 0.05); break;
        case 'bash': AU.sfx('bash'); S.hitstop = 0.08; break;
        case 'faint': AU.sfx('faint'); break;
        case 'ko': AU.cheer(1); if (!spect) buzz(e.side === 1 ? 25 : 40); break;
        case 'evolve': AU.sfx('evolve'); AU.cheer(0.8); break;
        case 'evolved': AU.sfx('evolved'); AU.cry(e.u.sp.id, 0.8); AU.cheer(1.1); S.hitstop = Math.max(S.hitstop, 0.07); break;
        case 'boost': AU.sfx('fanfare'); AU.chant(R.boostTime); AU.cheer(1.2); if (!spect && e.side === 0) buzz(30); break;
        case 'double': AU.sfx('fanfare'); AU.cheer(1); AU.intensity(1); break;
        case 'overtime': AU.sfx('fanfare'); AU.cheer(1); AU.intensity(2); break;
        case 'wild': AU.sfx('rustle'); (function (id) { setTimeout(function () { AU.cry(id, 0.85); }, 700); })(e.u.sp.id); break;
        case 'rustle': AU.sfx('rustle'); break;
        case 'catchthrow': AU.sfx('throw'); break;
        case 'catchland': AU.sfx('pop'); break;
        case 'wobble': AU.sfx('wobble'); break;
        case 'breakfree': AU.sfx('breakfree'); AU.cry(e.u.sp.id, 0.9); break;
        case 'caught': AU.sfx('caught'); AU.cheer(1.2); buzz(40); break;
        case 'end':
          AU.cheer(1.3);
          if (b.endReason !== 'caught') AU.sfx(spect || e.winner === 0 ? 'victory' : 'defeat');
          if (e.reason !== 'time' && renderer.lastFaint) {
            S.slow = 1.6;
            renderer.cam.tz = 1.35; renderer.cam.tfx = renderer.lastFaint.x; renderer.cam.tfy = renderer.lastFaint.y;
          }
          break;
      }
    }
    ev.length = 0;
  }

  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }

  function battleFrame(dt) {
    var b = S.battle, ui = S.ui;
    var rdt = dt;
    if (!S.paused) {
      if (ui.drag && !ui.drag.moved && performance.now() - ui.drag.t0 > 420) ui.info = ui.drag.hi;
      if (ui.phase === 'intro') {
        S.introT -= dt;
        if (S.introT <= 0) {
          if (ui.spectate) revealLeads(null);
          else { ui.phase = 'lead'; ui.leadT = R.leadTime; AU.sfx('beep'); }
        }
      } else if (ui.phase === 'lead') {
        ui.leadT -= dt;
        if (ui.leadT <= 0) revealLeads(autoLead());
      } else {
        if (S.slow > 0) { S.slow -= dt; rdt = dt * 0.3; if (S.slow <= 0) renderer.cam.tz = 1; }
        if (S.hitstop > 0) { S.hitstop -= dt; }
        else {
          S.acc += rdt * (ui.spectate ? ui.speed : 1);
          var n = 0;
          while (S.acc >= STEP && n < 12) {
            if (S.ai[0]) S.ai[0].update(STEP);
            if (S.ai[1]) S.ai[1].update(STEP);
            b.step(STEP);
            S.acc -= STEP; n++;
          }
          if (n >= 12) S.acc = 0;
        }
        handleEvents(b);
        if (ui.drag) refreshDrag(ui.drag);
      }
      if (b.over) {
        S.endT += dt;
        if (S.endT > 3.0 && !S.resultShown) showResult();
      }
    }
    renderer.frame(S.paused ? 0 : rdt, b, ui);
  }

  function rewardHtml(id, line) {
    return '<div class="reward"><canvas id="res-reward"></canvas><div>' + line + '<br><span class="muted">Added to your collection! It evolves into ' + CA.EVOS[id].name + '.</span></div></div>';
  }

  function showResult() {
    S.resultShown = true;
    var b = S.battle, cfg = S.cfg, ui = S.ui;
    var me = b.sides[0], them = b.sides[1];
    var secs = Math.round(b.overtime ? R.time + (R.overtime - Math.max(0, b.time)) : R.time - Math.max(0, b.time));
    var stats = '<div class="stats"><div><b>' + me.ko + ' – ' + them.ko + '</b>KOs</div><div><b>' + Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2) + '</b>Battle time</div>' +
      '<div><b>' + me.evos + '</b>Evolutions</div><div><b>' + Math.round(me.dmgDealt) + '</b>Damage dealt</div></div>';
    var html, rewardId = null;
    if (S.mode === 'journey' && S.save) { showJourneyResult(b, cfg); return; }
    if (ui.spectate) {
      var wn = b.winner === -1 ? 'Draw!' : ui.names[b.winner] + ' wins!';
      html = '<h2 style="color:#ffb21f;text-shadow:0 3px 0 #2b1f33;font-size:32px">' + wn + '</h2>' + stats.replace('Damage dealt', ui.names[0] + ' damage').replace('Evolutions', ui.names[0] + ' evos');
      if (cfg.cupMatch) {
        var m = cfg.cupMatch;
        if (!m.w) { m.w = b.winner === 1 ? m.b : m.a; m.sc = me.ko + '-' + them.ko; }
        html += '<div class="btns"><button class="btn primary" id="r-cup">Back to the Cup</button></div>';
      } else html += '<div class="btns"><button class="btn primary" id="r-again">Watch again</button><button class="btn" id="r-menu">Menu</button></div>';
    } else {
      var tr = CA.TRAINERS[S.trIdx];
      var win = b.winner === 0, draw = b.winner === -1, first = false;
      if (S.mode === 'league' && win && S.beaten.indexOf(tr.id) < 0) { S.beaten.push(tr.id); store.set('beaten', S.beaten); first = true; }
      var why = b.endReason === 'wipe' ? (win ? tr.name + ' is out of critters!' : draw ? 'Both teams fell together!' : 'You\'re out of critters!')
        : b.endReason === 'sudden' ? 'Sudden-death KO!' : 'Time! Decided by KOs.';
      html = '<h2 style="color:' + (win ? '#ffb21f' : draw ? '#5a6170' : '#ff4d5e') + ';text-shadow:0 3px 0 #2b1f33">' + (win ? 'VICTORY!' : draw ? 'DRAW' : 'DEFEAT') + '</h2>' +
        '<div class="muted" style="font-weight:800">' + why + '</div>';
      if (win && first) html += '<canvas class="badge-big" id="res-badge"></canvas><div style="font-weight:900;margin-top:4px">You earned the ' + tr.name + ' Badge!</div>';
      if (win && first && tr.reward) { rewardId = tr.reward; html += rewardHtml(tr.reward, tr.name + ' gave you a <b>' + SP[tr.reward].name.toUpperCase() + '</b>!'); }
      html += '<div class="quote"><b>' + tr.name + ':</b> “' + (win ? tr.lose : tr.win) + '”</div>' + stats + '<div class="btns">';
      if (S.mode === 'cup') {
        var cm = S.cupMatch;
        if (cm && !cm.w) {
          var opp = cm.a === 'you' ? cm.b : cm.a;
          cm.w = win ? 'you' : opp; cm.sc = cm.a === 'you' ? me.ko + '-' + them.ko : them.ko + '-' + me.ko;
          if (!win) S.cup.out = true;
          cupSimOthers(); cupAdvance(); store.set('cup', S.cup);
        }
        html += '<button class="btn primary" id="r-cup">Back to the Cup</button>';
      } else {
        var next = S.trIdx + 1;
        if (win && S.mode === 'league' && next < CA.TRAINERS.length) html += '<button class="btn primary" id="r-next">Next: ' + CA.TRAINERS[next].name + '</button>';
        if (win && S.mode === 'league' && S.trIdx === 9) html += '<div style="font-weight:900;color:#1d4fb0">★ You are the new Sunshine League Champion! ★</div>';
        html += '<button class="btn' + (win ? '' : ' primary') + '" id="r-again">Rematch</button>';
      }
      html += '<div class="row"><button class="btn small" id="r-team" style="flex:1">Edit Team</button><button class="btn small" id="r-menu" style="flex:1">Menu</button></div></div>';
    }
    $('result-card').innerHTML = html;
    $('ov-result').classList.add('on');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if ($('res-badge')) {
      var bc = $('res-badge'); bc.width = 96 * dpr; bc.height = 96 * dpr;
      var c = bc.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      Art.badge(c, CA.TRAINERS[S.trIdx].badge, 48, 48, 38, true);
    }
    if (rewardId && $('res-reward')) {
      var rc = $('res-reward'); rc.width = 64 * dpr; rc.height = 64 * dpr;
      var r2 = rc.getContext('2d'); r2.setTransform(dpr, 0, 0, dpr, 0, 0);
      var rs = SP[rewardId];
      Art.portrait(r2, rewardId, 32, 60 + (rs.fly ? 8 : 0), 56 / Art.height(rewardId), 0.3);
      setTimeout(function () { AU.cry(rewardId); }, 500);
    }
    function on2(id, fn) { if ($(id)) $(id).onclick = function () { AU.sfx('tap'); fn(); }; }
    on2('r-next', function () { leaveBattle(); openVs(S.trIdx + 1, 'league'); });
    on2('r-again', function () { var cfg2 = S.cfg; leaveBattle(); startBattle(ui.spectate ? cfg2 : null); });
    on2('r-team', function () { leaveBattle(); show('team'); });
    on2('r-menu', function () { leaveBattle(); show('title'); });
    on2('r-cup', function () { leaveBattle(); show('cup'); });
  }

  function showJourneyResult(b, cfg) {
    var res = journeyResult(b, cfg), win = b.winner === 0, n = S.node, html;
    var reason = b.endReason;
    var title = reason === 'caught' ? 'GOTCHA!' : win ? 'VICTORY!' : cfg.wild && b.winner === -1 ? 'IT FLED!' : 'BLACKED OUT';
    var col = reason === 'caught' || win ? '#ffb21f' : '#ff4d5e';
    var why = reason === 'caught' ? SP[cfg.wild.sp].name + ' was caught!' : reason === 'wildko' ? 'The wild ' + SP[cfg.wild.sp].name + ' fainted. Weaken it less next time to catch it!' :
      win ? cfg.names[1] + ' is out of critters!' : cfg.wild && b.winner === -1 ? 'The wild critter ran off into the grass.' : 'You\'re out of usable critters! You hurried back to the lab...';
    html = '<h2 style="color:' + col + ';text-shadow:0 3px 0 #2b1f33">' + title + '</h2><div class="muted" style="font-weight:800">' + why + '</div>';
    if (res.caught) html += rewardHtml2(res.caught.id, res.caught.isNew ? SP[res.caught.id].name.toUpperCase() + ' joined your collection at Lv ' + S.save.owned[res.caught.id].lv + '!' : 'Another ' + SP[res.caught.id].name + '! It trained with yours (+XP).');
    if (res.badge) html += '<canvas class="badge-big" id="res-badge"></canvas><div style="font-weight:900;margin-top:4px">You earned the ' + res.badge.name + ' Badge!</div>';
    if (res.champion) html += '<div style="font-weight:900;color:#1d4fb0;margin:8px 0;font-size:18px">★ HALL OF FAME ★<br>Champion ' + S.save.name + '!</div><div class="muted">Rumours speak of a legendary critter atop the Sky Pillar...</div>';
    if (cfg.kind === 'gym') { var tr = trById(n.tr); html += '<div class="quote"><b>' + tr.name + ':</b> “' + (win ? tr.lose : tr.win) + '”</div>'; }
    if (cfg.kind === 'rival') html += '<div class="quote"><b>' + S.save.rival + ':</b> “' + rivalLine(n.n, win ? 'lose' : 'win') + '”</div>';
    html += '<div style="margin:8px 0 12px">' + xpRowsHtml(res.rows) + '</div><div class="btns">';
    if (cfg.wild) html += '<button class="btn primary" id="r-walk">Keep exploring</button>';
    else if (!win) html += '<button class="btn primary" id="r-retry">Try again</button>';
    html += '<div class="row"><button class="btn small" id="r-team" style="flex:1">Team</button><button class="btn small' + (cfg.wild || !win ? '' : ' primary') + '" id="r-map" style="flex:1">Map</button></div></div>';
    $('result-card').innerHTML = html;
    $('ov-result').classList.add('on');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if ($('res-badge')) { var bc = $('res-badge'); bc.width = 96 * dpr; bc.height = 96 * dpr; var c = bc.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); Art.badge(c, res.badge.badge, 48, 48, 38, true); }
    if (res.caught && $('res-reward')) {
      var rc = $('res-reward'); rc.width = 64 * dpr; rc.height = 64 * dpr;
      var r2 = rc.getContext('2d'); r2.setTransform(dpr, 0, 0, dpr, 0, 0);
      Art.portrait(r2, res.caught.id, 32, 60 + (SP[res.caught.id].fly ? 8 : 0), 56 / Art.height(res.caught.id), 0.3);
    }
    animateXp(res.rows);
    if (res.badge || res.champion) setTimeout(function () { AU.sfx('badge'); }, 300);
    function on2(id, fn) { if ($(id)) $(id).onclick = function () { AU.sfx('tap'); fn(); }; }
    on2('r-walk', function () { leaveBattle(); startBattle(wildCfg(n)); });
    on2('r-retry', function () { leaveBattle(); startBattle(nodeCfg(n)); });
    on2('r-team', function () { leaveBattle(); show('team'); });
    on2('r-map', function () { leaveBattle(); show('map'); });
  }
  function rewardHtml2(id, line) {
    return '<div class="reward"><canvas id="res-reward"></canvas><div>' + line + '<br><span class="muted">It evolves into ' + CA.EVOS[id].name + ' in battle.</span></div></div>';
  }

  function setPaused(p) {
    if (S.screen !== 'battle' || S.resultShown) return;
    S.paused = p;
    S.ui.drag = null; S.ui.info = -1;
    syncToggles();
    $('ov-pause').classList.toggle('on', p);
    $('p-quit').textContent = S.ui.spectate ? 'Leave' : 'Forfeit';
    if (p) AU.music(null); else AU.music('battle');
  }

  // fast-forward a spectated battle to its result
  function skipToEnd() {
    var b = S.battle, n = 0;
    while (!b.over && n < 60 * 400) { S.ai[0].update(STEP); if (S.ai[1]) S.ai[1].update(STEP); b.step(STEP); b.events.length = 0; n++; }
    b.events.length = 0;
    for (var i = 0; i < b.units.length; i++) if (b.units[i].st === 'dead') b.units[i].deadT = 9;
    S.endT = 2.5;
  }

  // ---- input ----------------------------------------------------------------------------------
  function pt(ev) { return { x: ev.clientX, y: ev.clientY }; }
  function fingerOffset(d) { return d.touch ? renderer.L.tile * 1.3 : 0; }
  function refreshDrag(d) {
    var L = renderer.L, b = S.battle;
    d.onField = d.sy < L.handY - 6;
    var fp = renderer.unproj(d.sx, d.sy - fingerOffset(d));
    var cp = b.clampDeploy(0, fp.x, fp.y);
    d.fx = cp.x; d.fy = cp.y;
    d.card = b.sides[0].hand[d.hi];
    d.valid = b.canDeploy(0, d.hi);
  }
  function tryDeploy(hi, fx, fy) {
    var b = S.battle, ui = S.ui;
    if (!b.canDeploy(0, hi)) {
      AU.sfx('deny');
      renderer.nums.push({ x: renderer.W / 2, y: renderer.L.handY - 10, t: 0, s: b.sides[0].capsules <= 0 ? 'NO CAPSULES LEFT!' : 'NOT ENOUGH ENERGY!', col: '#ffd23f', pix: true });
      return false;
    }
    if (ui.phase === 'lead') { revealLeads({ hi: hi, x: fx, y: fy }); buzz(15); return true; }
    b.deploy(0, hi, fx, fy);
    ui.sel = -1;
    buzz(12);
    return true;
  }

  gameCv.addEventListener('pointerdown', function (ev) {
    AU.init();
    if (S.screen !== 'battle' || S.paused) return;
    var b = S.battle, ui = S.ui, p = pt(ev);
    if (ui.spectate) {
      var sb = renderer.specAt(p.x, p.y);
      if (sb === 0) { ui.speed = ui.speed === 1 ? 2 : ui.speed === 2 ? 4 : 1; AU.sfx('tap'); }
      if (sb === 1 && !b.over) { AU.sfx('tap'); skipToEnd(); }
      if (sb === 2) { AU.sfx('tap'); leaveBattle(); show(S.mode === 'cupwatch' ? 'cup' : 'watch'); }
      if (ui.phase === 'intro') S.introT = Math.min(S.introT, 0.2);
      return;
    }
    if (b.over) return;
    if (ui.phase === 'intro') { S.introT = Math.min(S.introT, 0.15); return; }
    if (ui.phase === 'battle' && b.wild && renderer.catchAt(p.x, p.y)) {
      if (!b.throwCatch()) { AU.sfx('deny'); if (b.sides[0].capsules <= 0) renderer.nums.push({ x: p.x, y: p.y - 40, t: 0, s: 'NO CAPSULES!', col: '#ffd23f', pix: true }); }
      return;
    }
    if (ui.phase === 'battle' && renderer.boostAt(p.x, p.y)) {
      if (b.boost(0)) buzz(25); else AU.sfx('deny');
      return;
    }
    var hi = renderer.cardAt(p.x, p.y, b.sides[0].hand.length);
    if (hi >= 0) {
      ui.drag = { hi: hi, sx: p.x, sy: p.y, x0: p.x, y0: p.y, moved: false, onField: false, touch: ev.pointerType !== 'mouse', id: ev.pointerId, t0: performance.now() };
      refreshDrag(ui.drag);
      try { gameCv.setPointerCapture(ev.pointerId); } catch (e) { }
      AU.sfx('card');
      return;
    }
    if (ui.phase === 'battle') {
      var eu = renderer.evoAt(b, p.x, p.y);
      if (eu) {
        if (b.evolve(0, eu.rec)) buzz(20);
        else { AU.sfx('deny'); renderer.nums.push({ x: p.x, y: p.y - 30, t: 0, s: 'NEED ' + CA.evoCost(eu.sp) + ' ENERGY', col: '#ffd23f', pix: true }); }
        return;
      }
    }
    if (ui.sel >= 0 && p.y < renderer.L.handY - 6) {
      var fp = renderer.unproj(p.x, p.y), cp = b.clampDeploy(0, fp.x, fp.y);
      tryDeploy(ui.sel, cp.x, cp.y);
    }
  });
  gameCv.addEventListener('pointermove', function (ev) {
    var d = S.ui.drag;
    if (!d || ev.pointerId !== d.id) return;
    var p = pt(ev);
    d.sx = p.x; d.sy = p.y;
    if (Math.abs(p.x - d.x0) + Math.abs(p.y - d.y0) > 10) { d.moved = true; S.ui.info = -1; }
    refreshDrag(d);
  });
  function endDrag(ev, cancel) {
    var d = S.ui.drag;
    if (!d || ev.pointerId !== d.id) return;
    S.ui.drag = null;
    var wasInfo = S.ui.info >= 0;
    S.ui.info = -1;
    if (cancel || !S.battle || S.battle.over || wasInfo) return;
    if (d.onField && d.moved) tryDeploy(d.hi, d.fx, d.fy);
    else if (!d.moved) S.ui.sel = S.ui.sel === d.hi ? -1 : d.hi;
  }
  gameCv.addEventListener('pointerup', function (ev) { endDrag(ev, false); });
  gameCv.addEventListener('pointercancel', function (ev) { endDrag(ev, true); });

  // ---- buttons --------------------------------------------------------------------------------
  function on(id, fn) { $(id).addEventListener('click', function (e) { AU.init(); fn(e); }); }
  on('b-journey', function () { AU.sfx('tap'); if (S.save) show('map'); else startIntro(); });
  on('map-team', function () { AU.sfx('tap'); swapIn = null; show('team'); });
  on('b-cup', function () { AU.sfx('tap'); show('cup'); });
  on('b-quick', function () { AU.sfx('tap'); openVs((Math.random() * CA.TRAINERS.length) | 0, 'quick'); });
  on('b-team', function () { AU.sfx('tap'); swapIn = null; show('team'); });
  on('b-watch', function () { AU.sfx('tap'); show('watch'); });
  on('b-help', function () { AU.sfx('tap'); show('help'); });
  function toggleMusic() { AU.setMusic(!AU.musicOn); store.set('music', AU.musicOn); syncToggles(); AU.sfx('tap'); }
  function toggleSfx() { AU.setSfx(!AU.sfxOn); store.set('sfx', AU.sfxOn); syncToggles(); AU.sfx('tap'); }
  on('b-music', toggleMusic); on('b-sfx', toggleSfx); on('p-music', toggleMusic); on('p-sfx', toggleSfx);
  on('vs-go', function () { AU.sfx('go'); startBattle(S.mode === 'journey' ? S.pendingCfg : null); });
  on('vs-edit', function () { AU.sfx('tap'); swapIn = null; show('team'); });
  on('w-go', function () { AU.sfx('go'); S.mode = 'watch'; if (S.watch.a === S.watch.b) S.watch.b = (S.watch.a + 1) % 10; watchMatch(S.watch.a, S.watch.b); });
  on('w-rand', function () { AU.sfx('tap'); S.watch.a = (Math.random() * 10) | 0; do { S.watch.b = (Math.random() * 10) | 0; } while (S.watch.b === S.watch.a); buildWatch(); });
  on('pausebtn', function () { AU.sfx('tap'); setPaused(true); });
  on('p-resume', function () { AU.sfx('tap'); setPaused(false); });
  on('p-quit', function () {
    AU.sfx('tap'); var spect = S.ui.spectate; leaveBattle();
    show(spect ? (S.mode === 'cupwatch' ? 'cup' : 'watch') : S.mode === 'league' ? 'league' : S.mode === 'cup' ? 'cup' : 'title');
  });
  var backs = document.querySelectorAll('[data-back]');
  for (var bi = 0; bi < backs.length; bi++) backs[bi].addEventListener('click', function () { AU.init(); AU.sfx('tap'); goBack(); });

  function goBack() {
    if ($('sheet').classList.contains('on')) { $('sheet').classList.remove('on'); live = live.filter(function (l) { return !l.sheet; }); return true; }
    switch (S.screen) {
      case 'battle':
        if (S.resultShown) { leaveBattle(); show('title'); } else setPaused(!S.paused);
        return true;
      case 'vs': show(S.mode === 'journey' ? 'map' : S.mode === 'cup' ? 'cup' : 'title'); return true;
      case 'intro': INTRO = null; show('title'); return true;
      case 'map': show('title'); return true;
      case 'team':
        if (!validDeck(S.deck)) { AU.sfx('deny'); $('teamhint').textContent = 'Pick at least one critter before leaving!'; return true; }
        saveDeck(); swapIn = null;
        if (S.prev === 'vs') openVs(S.trIdx, S.mode);
        else if (S.prev === 'map' || (S.prev === 'battle' && S.mode === 'journey')) show('map');
        else show('title');
        return true;
      case 'league': case 'help': case 'cup': case 'watch': show('title'); return true;
    }
    return false;
  }
  window.__back = function () { return goBack(); };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (S.screen === 'battle' && !S.paused && !S.resultShown) setPaused(true); AU.suspend(); }
    else AU.resume();
  });

  // ---- menu backdrop: sunny sky, stadium, parading critters ---------------------------------------
  var parade = [];
  function menuFrame(dt) {
    var W = window.innerWidth, Hh = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (bgCv.width !== Math.round(W * dpr) || bgCv.height !== Math.round(Hh * dpr)) {
      bgCv.width = Math.round(W * dpr); bgCv.height = Math.round(Hh * dpr);
      bgCv.style.width = W + 'px'; bgCv.style.height = Hh + 'px';
      bgCv.getContext('2d').__g = null;
    }
    var c = bgCv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    menuT += dt;
    var t = menuT;
    var horizon = (S.screen === 'title' ? titleGround() - 34 : Hh * 0.555) / Hh;
    var g = c.createLinearGradient(0, 0, 0, Hh);
    g.addColorStop(0, '#4fb8ff'); g.addColorStop(horizon, '#b4e6ff'); g.addColorStop(Math.min(1, horizon + 0.001), '#8fd967'); g.addColorStop(1, '#5cbf3e');
    c.fillStyle = g; c.fillRect(0, 0, W, Hh);
    // sun & rays
    var sx = W * 0.82, sy = Hh * 0.1;
    c.save(); c.translate(sx, sy); c.rotate(t * 0.1);
    c.fillStyle = 'rgba(255,245,190,0.28)';
    for (var i = 0; i < 14; i++) { c.rotate(Math.PI * 2 / 14); c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -Hh); c.lineTo(18, -Hh); c.closePath(); c.fill(); }
    c.restore();
    var sg = c.createRadialGradient(sx, sy, 4, sx, sy, 70);
    sg.addColorStop(0, '#fffde8'); sg.addColorStop(0.4, '#ffe36a'); sg.addColorStop(1, 'rgba(255,220,100,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, 70, 0, 7); c.fill();
    // clouds
    for (i = 0; i < 4; i++) {
      var cx = ((t * (8 + i * 4) + i * 260) % (W + 200)) - 100, cy = Hh * (0.08 + i * 0.07);
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.beginPath(); c.ellipse(cx, cy, 44, 15, 0, 0, 7); c.ellipse(cx + 22, cy - 10, 26, 16, 0, 0, 7); c.ellipse(cx - 18, cy - 6, 22, 13, 0, 0, 7); c.fill();
    }
    var title = S.screen === 'title';
    var hy = title ? titleGround() - 34 : Hh * 0.555;
    drawStadium(c, W, hy, Math.min(150, Hh * 0.15), t);
    // flowers on the grass
    for (i = 0; i < 26; i++) {
      var fx = (i * 97) % W, fy = hy + 14 + ((i * 61) % 100) / 100 * (Hh - hy - 26);
      c.fillStyle = ['#fff', '#ffe36a', '#ff9ad0'][i % 3];
      for (var k = 0; k < 4; k++) { c.beginPath(); c.arc(fx + Math.cos(k * 1.57) * 3, fy + Math.sin(k * 1.57) * 3, 2.6, 0, 7); c.fill(); }
      c.fillStyle = '#ffb21f'; c.beginPath(); c.arc(fx, fy, 1.8, 0, 7); c.fill();
    }
    if (title) drawLineup(c, W, t);
    // parade of critters along the bottom
    if (!title && !parade.length) {
      for (i = 0; i < 6; i++) parade.push({ id: CA.SPECIES_ORDER[(Math.random() * CA.SPECIES_ORDER.length) | 0], x: -60 - i * (W + 120) / 6, ph: Math.random() * 9 });
    }
    var gy = Hh - 22;
    for (i = 0; !title && i < parade.length; i++) {
      var p = parade[i], sp = SP[p.id];
      p.x += dt * (34 + sp.spd * 6);
      if (p.x > W + 60) { p.x -= W + 140; p.id = CA.SPECIES_ORDER[(Math.random() * CA.SPECIES_ORDER.length) | 0]; }
      var sc = (sp.r * 2.9 * 26) / 100;
      c.fillStyle = 'rgba(30,70,20,0.25)'; Art.helpers.E(c, p.x, gy, sp.r * 28, sp.r * 9); c.fill();
      Art.creature(c, p.id, { t: t + p.ph, mv: 1, walk: (t + p.ph) * 9, atk: 0, hurt: 0, blink: ((t + p.ph) % 3.5) < 0.1, faint: 0 }, p.x, gy, sc, 1);
    }
    // live canvases on the current screen
    for (i = 0; i < live.length; i++) live[i].draw(live[i].cv.getContext('2d'), t);
    if (S.screen === 'intro' && INTRO) drawIntro(dt, t);
  }
  var menuT = 0;

  function titleGround() {
    var menu = document.querySelector('#scr-title .menu');
    var top = menu ? menu.getBoundingClientRect().top : window.innerHeight * 0.55;
    return top - 8;
  }

  function drawStadium(c, W, hy, h, t) {
    var x0 = -10, x1 = W + 10, top = hy - h;
    // light towers
    for (var k = 0; k < 2; k++) {
      var lx = k ? W * 0.9 : W * 0.1;
      c.fillStyle = '#9aa8bd'; c.fillRect(lx - 2.5, top - h * 0.55, 5, h * 0.6);
      CA.rr(c, lx - 16, top - h * 0.7, 32, 18, 4); c.fillStyle = '#5a6a82'; c.fill();
      c.fillStyle = '#fffbe0';
      for (var q = 0; q < 6; q++) { c.beginPath(); c.arc(lx - 11 + (q % 3) * 11, top - h * 0.7 + 5 + ((q / 3) | 0) * 8, 3, 0, 7); c.fill(); }
    }
    // tiers
    var tiers = 5;
    for (var i = 0; i < tiers; i++) {
      var y0 = top + h * i / tiers, y1 = top + h * (i + 1) / tiers, bow = h * 0.12;
      c.beginPath();
      c.moveTo(x0, y0 + bow); c.quadraticCurveTo(W / 2, y0 - bow, x1, y0 + bow);
      c.lineTo(x1, y1 + bow); c.quadraticCurveTo(W / 2, y1 - bow, x0, y1 + bow); c.closePath();
      c.fillStyle = i % 2 ? '#d3deef' : '#eaf0f9'; c.fill();
    }
    // rim & pennants
    c.beginPath(); c.moveTo(x0, top + h * 0.12); c.quadraticCurveTo(W / 2, top - h * 0.12, x1, top + h * 0.12);
    c.lineWidth = 7; c.strokeStyle = '#3d8bff'; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#ffffff'; c.stroke();
    var cols = ['#ff4d5e', '#ffd23f', '#3d8bff', '#45c25a'];
    for (var f = 0; f < 7; f++) {
      var fx = W * (0.06 + f * 0.148), kx = (fx - W / 2) / (W / 2);
      var fy = top + h * 0.12 - h * 0.24 * (1 - kx * kx) * 0.5 - 1;
      c.fillStyle = '#7a8aa0'; c.fillRect(fx - 1, fy - 26, 2, 26);
      var wv = Math.sin(t * 5 + f) * 3;
      c.fillStyle = cols[f % 4];
      c.beginPath(); c.moveTo(fx + 1, fy - 26); c.quadraticCurveTo(fx + 9, fy - 27 + wv, fx + 17, fy - 23 + wv); c.lineTo(fx + 1, fy - 17); c.closePath(); c.fill();
    }
    // crowd
    var shirts = ['#ff4d5e', '#3d8bff', '#ffd23f', '#45c25a', '#ff8a3d', '#a45cff', '#ffffff', '#ff7ac8'];
    var skins = ['#ffd9b8', '#f2c193', '#c98d62', '#8a5a3a'];
    var rows = 6, n = 0;
    for (var r = 0; r < rows; r++) {
      var ry = top + h * (0.2 + r * 0.13);
      var step = 9.5 + r * 0.6;
      for (var x = (r % 2) * step / 2; x < W; x += step, n++) {
        var kx2 = (x - W / 2) / (W / 2);
        var yy = ry + h * 0.12 * kx2 * kx2 - Math.max(0, Math.sin(t * (3 + (n % 5) * 0.4) + n * 1.7)) * 3;
        var sc = 0.8 + r * 0.06;
        c.fillStyle = shirts[(n * 7) % shirts.length];
        c.beginPath(); c.ellipse(x, yy + 4.5 * sc, 4.6 * sc, 3.6 * sc, 0, 0, 7); c.fill();
        c.fillStyle = skins[(n * 3) % skins.length];
        c.beginPath(); c.arc(x, yy - 1.5 * sc, 3.3 * sc, 0, 7); c.fill();
      }
    }
    // front wall
    c.fillStyle = '#3d8bff'; c.fillRect(0, hy - 4, W, 5);
    c.fillStyle = '#ffffff'; c.fillRect(0, hy - 6, W, 2);
  }

  // the classic starter trio bouncing in front of the stadium, a legend circling overhead
  function drawLineup(c, W, t) {
    var ground = titleGround();
    var logo = document.querySelector('#scr-title .tagline');
    var room = ground - (logo ? logo.getBoundingClientRect().bottom : 0) - 10;
    if (room < 70) return;
    var s = Math.min(1.0, room / 140);
    var ids = ['sproutle', 'emberpup', 'puddlefin'];
    for (var i = 0; i < 3; i++) {
      var x = W / 2 + (i - 1) * Math.min(W * 0.3, 130), ph = t * 1.6 - i * 0.7;
      var hop = Math.max(0, Math.sin(ph * 3)) * (Math.sin(ph) > 0.4 ? 1 : 0);
      c.fillStyle = 'rgba(30,70,20,0.25)'; Art.helpers.E(c, x, ground, 34 * s * (1 - hop * 0.3), 9 * s); c.fill();
      var cyc = (t / 3.2 + i * 0.66) % 2, evo = cyc > 1 ? 1 : 0, edge = Math.min(Math.abs(cyc - 1), Math.abs(cyc - 2), cyc);
      Art.creature(c, ids[i], { t: t + i, mv: 0, walk: 0, atk: hop > 0.8 ? 0.4 : 0, hurt: 0, blink: ((t + i * 1.3) % 3.8) < 0.12, faint: 0, cheer: false, evo: evo }, x, ground - hop * 26 * s, s * (i === 1 ? 0.95 : 0.85) * (evo ? 1.12 : 1), i === 2 ? -1 : 1);
      if (edge < 0.06) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,250,210,' + (1 - edge / 0.06) * 0.8 + ')'; Art.helpers.C(c, x, ground - 45 * s, 60 * s); c.fill(); c.restore(); }
    }
    var ax = W / 2 + Math.cos(t * 0.35) * W * 0.36, ay = ground - room * 0.78 + Math.sin(t * 0.7) * 10;
    if (ay > ground - room + 20) Art.creature(c, 'azurion', { t: t, mv: 0, walk: 0, atk: 0, hurt: 0, blink: false, faint: 0 }, ax, ay, s * 0.55, Math.sin(t * 0.35) < 0 ? 1 : -1);
  }


  // ---- main loop ----------------------------------------------------------------------------------
  var lastNow = 0;
  function loop(now) {
    var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
    lastNow = now;
    try {
      if (S.screen === 'battle' && S.battle) { battleFrame(dt); if (!S.paused) watchFps(dt); }
      else menuFrame(dt);
    } catch (err) {
      if (window.console) console.error(err);
    }
    requestAnimationFrame(loop);
  }

  // adaptive resolution: if a phone struggles, render the arena at a lower pixel ratio
  var quality = { dpr: Math.min(2, window.devicePixelRatio || 1), acc: 0, frames: 0, slow: 0 };
  function watchFps(dt) {
    quality.acc += dt; quality.frames++;
    if (quality.acc < 2) return;
    var fps = quality.frames / quality.acc;
    quality.acc = 0; quality.frames = 0;
    quality.slow = fps < 42 ? quality.slow + 1 : 0;
    if (quality.slow >= 2 && quality.dpr > 1.01) {
      quality.dpr = Math.max(1, quality.dpr - 0.35);
      quality.slow = 0;
      resize();
    }
  }

  function resize() {
    var W = window.innerWidth, Hh = window.innerHeight;
    renderer.resize(W, Hh, quality.dpr);
    var L = renderer.L, pb = $('pausebtn'), u = L.ui;
    pb.style.left = Math.round(W - 46 * u) + 'px';
    pb.style.top = Math.round(8 * u) + 'px';
    pb.style.width = pb.style.height = Math.round(38 * u) + 'px';
  }
  window.addEventListener('resize', function () { uiZoom(); if (S.screen === 'battle') resize(); });

  // tablets: zoom the menus, map and sheets up so they aren't a tiny phone-sized column
  function uiZoom() {
    var k = Math.min(window.innerWidth / 430, window.innerHeight / 820), z = k > 1.1 ? Math.min(1.6, k) : 1;
    S.uiZ = z;
    var els = document.querySelectorAll('.screen:not(#scr-intro), .overlay, .sheet-wrap, .intro-ui');
    for (var i = 0; i < els.length; i++) els[i].style.zoom = z > 1 ? String(z) : '';
  }
  uiZoom();

  // debug / testing hooks
  window.__ca = { S: S, renderer: renderer, startBattle: startBattle, openVs: openVs, show: show, revealLeads: revealLeads, simMatch: simMatch, owned: owned, watchMatch: watchMatch };

  show('title');
  resize();
  requestAnimationFrame(loop);
})();
