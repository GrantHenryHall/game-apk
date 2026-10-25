/* Critter Arena — app shell: menus, team builder, league, input and the battle loop. */
(function () {
  var CA = window.CA, Art = CA.Art, SP = CA.SPECIES, R = CA.RULES, AU = CA.Audio;
  var $ = function (id) { return document.getElementById(id); };
  var STEP = 1 / 60;

  // ---- persistence (best-effort; the game works without storage) ----------------------
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('ca.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('ca.' + k, JSON.stringify(v)); } catch (e) { } }
  };
  function validDeck(d) {
    if (!d || d.length !== 8) return null;
    for (var i = 0; i < 8; i++) if (!SP[d[i]] || d.indexOf(d[i]) !== i) return null;
    return d;
  }

  var PLAYER_LOOK = { skin: '#ffd2a6', hair: '#3a2a1e', style: 'spiky', cap: '#3d8bff', shirt: '#3d8bff', pants: '#2b3a66' };
  var S = {
    screen: 'title', prev: 'title',
    deck: validDeck(store.get('deck', null)) || CA.DEFAULT_DECK.slice(),
    beaten: store.get('beaten', []),
    battle: null, ai: null, trIdx: 0, mode: 'league',
    ui: { drag: null, sel: -1, countdown: null, looks: [PLAYER_LOOK, PLAYER_LOOK], names: ['You', 'Rival'] },
    paused: false, endT: 0, resultShown: false, acc: 0
  };
  AU.musicOn = store.get('music', true);
  AU.sfxOn = store.get('sfx', true);

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
  function faceCanvas(id, size, bg) {
    var cv = mkCanvas(size, size), c = ctxOf(cv);
    if (bg) { c.fillStyle = bg; c.fillRect(0, 0, size, size); }
    var sp = SP[id], hgt = Art.height(id);
    var s = size * 0.9 / hgt;
    Art.portrait(c, id, size / 2, size * 0.95 + (sp.fly ? size * 0.12 : 0), s, 0.3);
    return cv;
  }
  function trainerCanvas(tr, w, h) {
    var cv = mkCanvas(w, h), c = ctxOf(cv);
    Art.trainer(c, tr.look, w / 2, h * 0.97, h / 125, false, { t: 0.5 });
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

  // ---- screens --------------------------------------------------------------------------
  function show(name) {
    S.prev = S.screen;
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
    if (!inBattle) AU.music('menu');
    var sc = $('scr-' + name); if (sc) sc.scrollTop = 0;
  }

  function buildTitle() {
    var bc = $('badgecase'); bc.innerHTML = '';
    CA.TRAINERS.forEach(function (tr) { bc.appendChild(badgeCanvas(tr, 24, S.beaten.indexOf(tr.id) >= 0)); });
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
    return n; // index of the first trainer not yet beaten
  }

  function buildLeague() {
    var box = $('trainers'); box.innerHTML = '';
    var open = unlockedCount();
    CA.TRAINERS.forEach(function (tr, i) {
      var row = document.createElement('div');
      var beaten = S.beaten.indexOf(tr.id) >= 0, locked = i > open;
      row.className = 'tr' + (locked ? ' locked' : '');
      var face = trainerCanvas(tr, 64, 64); face.className = 'face';
      var info = document.createElement('div'); info.className = 'info';
      info.innerHTML = '<div class="nm">' + tr.name + '</div><div class="ti">' + tr.title + ' · <span class="stars">' + stars(tr) + '</span></div>';
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

  // ---- team builder -----------------------------------------------------------------
  var swapIn = null;
  function buildTeam() {
    var tg = $('teamgrid'); tg.innerHTML = '';
    var cg = $('collgrid'); cg.innerHTML = '';
    var cw = Math.min(110, (Math.min(window.innerWidth, 560) - 32 - 24 - 21) / 4);
    for (var i = 0; i < 8; i++) {
      var slot = document.createElement('div');
      var id = S.deck[i];
      slot.className = 'slot' + (id ? '' : ' empty') + (swapIn && id ? ' swap' : '');
      if (id) slot.appendChild(cardCanvas(id, cw));
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
      slot.className = 'slot' + (S.deck.indexOf(id) >= 0 ? ' inteam' : '');
      slot.appendChild(cardCanvas(id, 80));
      slot.onclick = function () { AU.init(); AU.sfx('tap'); swapIn = null; openSheet(id); };
      cg.appendChild(slot);
    });
    var full = S.deck.filter(Boolean);
    var avg = full.reduce(function (a, id) { return a + SP[id].cost; }, 0) / Math.max(1, full.length);
    $('teamstat').textContent = full.length + '/8 · avg ☀ ' + avg.toFixed(1);
    $('teamhint').textContent = swapIn ? 'Tap a team slot to swap in ' + SP[swapIn].name + '.' :
      full.length < 8 ? 'Your team needs 8 critters — add ' + (8 - full.length) + ' more.' : 'Tap a creature to see its stats.';
  }
  function saveDeck() { if (validDeck(S.deck)) store.set('deck', S.deck); }

  function statRow(label, v, max, col, txt) {
    return '<div class="sbar"><span>' + label + '</span><div class="tk"><i style="width:' + Math.min(100, v / max * 100) + '%;background:' + col + '"></i></div><span>' + txt + '</span></div>';
  }
  function typeChip(t) { var T = CA.TYPES[t]; return '<span class="chip" style="background:' + T.color + '">' + T.name + '</span>'; }

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
    var sp = SP[id], role = CA.ROLES[sp.role];
    var body = $('sheet-body');
    var inTeam = S.deck.indexOf(id) >= 0, count = S.deck.filter(Boolean).length;
    var dps = sp.dmg / sp.rate * sp.n;
    var html = '<div class="top"><canvas class="big" id="sheet-cv"></canvas><div>' +
      '<h4>' + sp.name + (sp.n > 1 ? ' <span class="muted">×' + sp.n + '</span>' : '') + '</h4>' +
      typeChip(sp.type) + '<span class="chip" style="background:' + role.frame + ';color:' + role.ink + '">' + role.name + '</span>' +
      '<div style="margin-top:6px;font-weight:900;font-size:18px">☀ ' + sp.cost + ' energy</div>' +
      '<div class="muted" style="margin-top:2px">' + role.blurb + '</div></div></div>' +
      '<div class="desc">' + sp.desc + '</div><div class="bars">' +
      statRow('Health', sp.hp * sp.n, 2500, '#4fe36a', Math.round(sp.hp) + (sp.n > 1 ? '×' + sp.n : '')) +
      statRow('Power', dps, 300, '#ff8a3d', Math.round(dps) + '/s') +
      statRow('Range', sp.range, 6.5, '#3d8bff', sp.range < 1 ? 'Melee' : sp.range.toFixed(1)) +
      statRow('Speed', sp.spd, 2.8, '#ffd23f', sp.spd >= 2.2 ? 'Fast' : sp.spd >= 1.4 ? 'Medium' : 'Slow') +
      '</div>' + matchups(sp.type) + '<div class="row" style="margin-top:14px">';
    if (inTeam) html += '<button class="btn red" id="sh-rm" style="flex:1">Remove</button>';
    else if (count < 8) html += '<button class="btn primary" id="sh-add" style="flex:1">Add to team</button>';
    else html += '<button class="btn blue" id="sh-swap" style="flex:1">Swap in…</button>';
    html += '<button class="btn" id="sh-close" style="flex:1">Close</button></div>';
    body.innerHTML = html;
    var cv = $('sheet-cv'), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = 132 * dpr; cv.height = 132 * dpr;
    var T = CA.TYPES[sp.type];
    live.push({
      cv: cv, draw: function (c, t) {
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        var g = c.createLinearGradient(0, 0, 0, 132); g.addColorStop(0, '#e9f8ff'); g.addColorStop(1, T.light);
        c.fillStyle = g; c.fillRect(0, 0, 132, 132);
        c.fillStyle = 'rgba(40,80,30,0.18)'; Art.helpers.E(c, 66, 120, 36, 9); c.fill();
        var hgt = Art.height(id), s = 118 / hgt;
        var ph = t % 4, a = { t: t, mv: 0, walk: 0, atk: ph > 3.2 ? Math.sin((ph - 3.2) / 0.8 * Math.PI) : 0, hurt: 0, blink: (t % 3.3) < 0.12, faint: 0 };
        Art.creature(c, id, a, 66, 124 + (sp.fly ? 14 : 0), s, 1);
      }
    });
    $('sheet').classList.add('on');
    function close() { $('sheet').classList.remove('on'); live = live.filter(function (l) { return l.cv !== cv; }); }
    $('sh-close').onclick = function () { AU.sfx('tap'); close(); };
    if ($('sh-rm')) $('sh-rm').onclick = function () {
      AU.sfx('tap'); var i = S.deck.indexOf(id); S.deck[i] = null;
      // keep filled slots packed at the front
      S.deck = S.deck.filter(Boolean); while (S.deck.length < 8) S.deck.push(null);
      close(); buildTeam();
    };
    if ($('sh-add')) $('sh-add').onclick = function () {
      AU.sfx('card'); var i = S.deck.indexOf(null); if (i < 0) i = S.deck.length; S.deck[i] = id;
      saveDeck(); close(); buildTeam(); AU.cry(id);
    };
    if ($('sh-swap')) $('sh-swap').onclick = function () { AU.sfx('tap'); swapIn = id; close(); buildTeam(); $('scr-team').scrollTop = 0; };
  }
  $('sheet').onclick = function (e) { if (e.target === $('sheet')) { $('sheet').classList.remove('on'); live = []; } };

  // ---- help -------------------------------------------------------------------------------
  function buildHelp() {
    var hr = $('help-roles'); hr.innerHTML = '';
    Object.keys(CA.ROLES).forEach(function (k) {
      var r = CA.ROLES[k];
      var el = document.createElement('div'); el.className = 'roleln';
      el.innerHTML = '<span class="sw" style="background:' + r.frame + ';color:' + r.ink + '">' + r.name + '</span><span>' + r.blurb + '</span>';
      hr.appendChild(el);
    });
    var cyc = ['fire', 'leaf', 'stone', 'spark', 'water', 'fire'];
    $('help-cycle').innerHTML = cyc.map(typeChip).join(' › ');
  }

  // ---- VS screen ----------------------------------------------------------------------------
  function openVs(i, mode) {
    S.trIdx = i; S.mode = mode;
    var tr = CA.TRAINERS[i];
    show('vs');
    $('vs-title').textContent = mode === 'quick' ? 'Quick Battle' : (i === 9 ? 'Champion' : 'League #' + (i + 1));
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

  // ---- battle ---------------------------------------------------------------------------------
  function startBattle() {
    var tr = CA.TRAINERS[S.trIdx];
    AU.init();
    var b = S.battle = new CA.Battle({ decks: [S.deck.slice(), tr.deck.slice()], energyMult: [1, CA.crowdBonus(tr)] });
    S.ai = new CA.AI(b, 1, tr.skill);
    S.ui.looks = [PLAYER_LOOK, tr.look];
    S.ui.names = ['You', tr.name];
    S.ui.drag = null; S.ui.sel = -1; S.ui.countdown = 3.2;
    S.paused = false; S.endT = 0; S.resultShown = false; S.acc = 0;
    renderer.fx = []; renderer.nums = []; renderer.toasts = []; renderer.banners = [];
    renderer.hype = 0.6;
    show('battle');
    resize();
    AU.music('battle');
    AU.crowdStart();
    AU.cheer(0.8);
  }

  function leaveBattle() {
    AU.crowdStop();
    S.battle = null; S.ai = null;
    $('ov-pause').classList.remove('on'); $('ov-result').classList.remove('on');
    S.paused = false;
  }

  function handleEvents(b) {
    var ev = b.events;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      renderer.onEvent(e, b);
      switch (e.k) {
        case 'throw': AU.sfx('throw'); break;
        case 'pop': AU.sfx('pop'); AU.cry(e.sp, e.side === 1 ? 0.92 : 1); AU.cheer(SP[e.sp].cost >= 6 ? 0.9 : 0.25); break;
        case 'hit': AU.sfx('hit'); if (e.eff > 0) AU.sfx('super'); break;
        case 'shoot':
          AU.sfx({ bubble: 'bubble', star: 'star', orb: 'orb', seed: 'pew', spark: 'twinkle', spore: 'puff' }[e.kind] || 'pew'); break;
        case 'chain': AU.sfx('zap'); break;
        case 'charging': AU.sfx('charge'); break;
        case 'beam': AU.sfx('beam'); AU.cheer(0.6); break;
        case 'cone': AU.sfx('fire'); break;
        case 'heal': AU.sfx('heal'); break;
        case 'shield': AU.sfx('shield'); break;
        case 'leap': AU.sfx('leap'); break;
        case 'bash': AU.sfx('bash'); break;
        case 'faint': AU.sfx('faint'); break;
        case 'ko': AU.cheer(1); buzz(e.side === 1 ? 25 : 40); break;
        case 'double': case 'overtime': AU.sfx('fanfare'); AU.cheer(1); break;
        case 'end': AU.cheer(1.2); AU.sfx(e.winner === 0 ? 'victory' : 'defeat'); break;
      }
    }
    ev.length = 0;
  }

  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }

  function battleFrame(dt) {
    var b = S.battle, ui = S.ui;
    if (!S.paused) {
      if (ui.countdown !== null) {
        var prev = ui.countdown;
        ui.countdown -= dt;
        if (prev > 0 && Math.ceil(prev) !== Math.ceil(ui.countdown) && ui.countdown > 0) AU.sfx('beep');
        if (prev > 0 && ui.countdown <= 0) { AU.sfx('go'); AU.cheer(1); }
        if (ui.countdown < -0.7) ui.countdown = null;
      }
      if (ui.countdown === null || ui.countdown <= 0) {
        S.acc += dt;
        while (S.acc >= STEP) {
          S.ai.update(STEP);
          b.step(STEP);
          S.acc -= STEP;
        }
        handleEvents(b);
        if (ui.drag) refreshDrag(ui.drag);
      }
      if (b.over) {
        S.endT += dt;
        if (S.endT > 2.8 && !S.resultShown) showResult();
      }
    }
    renderer.frame(S.paused ? 0 : dt, b, ui);
  }

  function showResult() {
    S.resultShown = true;
    var b = S.battle, tr = CA.TRAINERS[S.trIdx];
    var win = b.winner === 0, draw = b.winner === -1;
    var first = false;
    if (win && S.beaten.indexOf(tr.id) < 0) { S.beaten.push(tr.id); store.set('beaten', S.beaten); first = true; }
    var me = b.sides[0], them = b.sides[1];
    var secs = Math.round(b.overtime ? R.time + (R.overtime - Math.max(0, b.time)) : R.time - Math.max(0, b.time));
    var why = b.endReason === 'wipe' ? (win ? tr.name + ' is out of critters!' : draw ? 'Both teams fell together!' : 'You\'re out of critters!')
      : b.endReason === 'sudden' ? 'Sudden-death KO!' : 'Time! Decided by KOs.';
    var html = '<h2 style="color:' + (win ? '#ffb21f' : draw ? '#5a6170' : '#ff4d5e') + ';text-shadow:0 3px 0 #2b1f33">' + (win ? 'VICTORY!' : draw ? 'DRAW' : 'DEFEAT') + '</h2>' +
      '<div class="muted" style="font-weight:800">' + why + '</div>';
    if (win && first && S.mode === 'league') html += '<canvas class="badge-big" id="res-badge"></canvas><div style="font-weight:900;margin-top:4px">You earned the ' + tr.name + ' Badge!</div>';
    html += '<div class="quote"><b>' + tr.name + ':</b> “' + (win ? tr.lose : tr.win) + '”</div>' +
      '<div class="stats"><div><b>' + me.ko + ' – ' + them.ko + '</b>KOs</div><div><b>' + Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2) + '</b>Battle time</div>' +
      '<div><b>' + me.sent + '</b>Critters sent</div><div><b>' + Math.round(me.dmgDealt) + '</b>Damage dealt</div></div><div class="btns">';
    var next = S.trIdx + 1;
    if (win && S.mode === 'league' && next < CA.TRAINERS.length) html += '<button class="btn primary" id="r-next">Next: ' + CA.TRAINERS[next].name + '</button>';
    if (win && S.mode === 'league' && S.trIdx === 9) html += '<div style="font-weight:900;color:#1d4fb0">★ You are the new Sunshine League Champion! ★</div>';
    html += '<button class="btn' + (win ? '' : ' primary') + '" id="r-again">Rematch</button>' +
      '<div class="row"><button class="btn small" id="r-team" style="flex:1">Edit Team</button><button class="btn small" id="r-menu" style="flex:1">Menu</button></div></div>';
    $('result-card').innerHTML = html;
    $('ov-result').classList.add('on');
    if ($('res-badge')) {
      var bc = $('res-badge'), dpr = Math.min(2, window.devicePixelRatio || 1);
      bc.width = 96 * dpr; bc.height = 96 * dpr;
      var c = bc.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      Art.badge(c, tr.badge, 48, 48, 38, true);
    }
    if ($('r-next')) $('r-next').onclick = function () { AU.sfx('tap'); leaveBattle(); openVs(next, 'league'); };
    $('r-again').onclick = function () { AU.sfx('tap'); leaveBattle(); startBattle(); };
    $('r-team').onclick = function () { AU.sfx('tap'); leaveBattle(); show('team'); };
    $('r-menu').onclick = function () { AU.sfx('tap'); leaveBattle(); show('title'); };
  }

  function setPaused(p) {
    if (S.screen !== 'battle' || S.resultShown) return;
    S.paused = p;
    S.ui.drag = null;
    syncToggles();
    $('ov-pause').classList.toggle('on', p);
    if (p) AU.music(null); else AU.music('battle');
  }

  // ---- input ----------------------------------------------------------------------------------
  function pt(ev) { return { x: ev.clientX, y: ev.clientY }; }
  function fingerOffset(d) { return d.touch ? renderer.L.tile * 1.3 : 0; }
  function refreshDrag(d) {
    var L = renderer.L, b = S.battle;
    d.onField = d.sy < L.handY - 6;
    var fp = renderer.toField(d.sx, d.sy - fingerOffset(d));
    var cp = b.clampDeploy(0, fp.x, fp.y);
    d.fx = cp.x; d.fy = cp.y;
    d.card = b.sides[0].hand[d.hi];
    d.valid = b.canDeploy(0, d.hi);
  }
  function tryDeploy(hi, fx, fy) {
    var b = S.battle;
    if (!b.canDeploy(0, hi)) {
      AU.sfx('deny');
      var L = renderer.L;
      renderer.nums.push({ x: renderer.W / 2, y: L.handY - 8, t: 0, s: b.sides[0].capsules <= 0 ? 'No capsules left!' : 'Not enough energy!', col: '#ffd23f', small: true });
      return false;
    }
    b.deploy(0, hi, fx, fy);
    S.ui.sel = -1;
    buzz(12);
    return true;
  }

  gameCv.addEventListener('pointerdown', function (ev) {
    AU.init();
    if (S.screen !== 'battle' || S.paused) return;
    var b = S.battle, ui = S.ui;
    if (b.over || (ui.countdown !== null && ui.countdown > 0)) return;
    var p = pt(ev);
    var hi = renderer.cardAt(p.x, p.y);
    if (hi >= 0) {
      ui.drag = { hi: hi, sx: p.x, sy: p.y, x0: p.x, y0: p.y, moved: false, onField: false, touch: ev.pointerType !== 'mouse', id: ev.pointerId };
      refreshDrag(ui.drag);
      try { gameCv.setPointerCapture(ev.pointerId); } catch (e) { }
      AU.sfx('card');
      return;
    }
    if (ui.sel >= 0 && p.y < renderer.L.handY - 6) {
      var fp = renderer.toField(p.x, p.y);
      tryDeploy(ui.sel, fp.x, fp.y);
    }
  });
  gameCv.addEventListener('pointermove', function (ev) {
    var d = S.ui.drag;
    if (!d || ev.pointerId !== d.id) return;
    var p = pt(ev);
    d.sx = p.x; d.sy = p.y;
    if (Math.abs(p.x - d.x0) + Math.abs(p.y - d.y0) > 10) d.moved = true;
    refreshDrag(d);
  });
  function endDrag(ev, cancel) {
    var d = S.ui.drag;
    if (!d || ev.pointerId !== d.id) return;
    S.ui.drag = null;
    if (cancel || !S.battle || S.battle.over) return;
    if (d.onField && d.moved) tryDeploy(d.hi, d.fx, d.fy);
    else if (!d.moved) S.ui.sel = S.ui.sel === d.hi ? -1 : d.hi;
  }
  gameCv.addEventListener('pointerup', function (ev) { endDrag(ev, false); });
  gameCv.addEventListener('pointercancel', function (ev) { endDrag(ev, true); });

  // ---- buttons --------------------------------------------------------------------------------
  function on(id, fn) { $(id).addEventListener('click', function (e) { AU.init(); fn(e); }); }
  on('b-league', function () { AU.sfx('tap'); show('league'); });
  on('b-quick', function () { AU.sfx('tap'); openVs((Math.random() * CA.TRAINERS.length) | 0, 'quick'); });
  on('b-team', function () { AU.sfx('tap'); swapIn = null; show('team'); });
  on('b-help', function () { AU.sfx('tap'); show('help'); });
  function toggleMusic() { AU.setMusic(!AU.musicOn); store.set('music', AU.musicOn); syncToggles(); AU.sfx('tap'); }
  function toggleSfx() { AU.setSfx(!AU.sfxOn); store.set('sfx', AU.sfxOn); syncToggles(); AU.sfx('tap'); }
  on('b-music', toggleMusic); on('b-sfx', toggleSfx); on('p-music', toggleMusic); on('p-sfx', toggleSfx);
  on('vs-go', function () { AU.sfx('go'); startBattle(); });
  on('vs-edit', function () { AU.sfx('tap'); swapIn = null; show('team'); });
  on('pausebtn', function () { AU.sfx('tap'); setPaused(true); });
  on('p-resume', function () { AU.sfx('tap'); setPaused(false); });
  on('p-quit', function () { AU.sfx('tap'); leaveBattle(); show(S.mode === 'league' ? 'league' : 'title'); });
  var backs = document.querySelectorAll('[data-back]');
  for (var bi = 0; bi < backs.length; bi++) backs[bi].addEventListener('click', function () { AU.init(); AU.sfx('tap'); goBack(); });

  function goBack() {
    if ($('sheet').classList.contains('on')) { $('sheet').classList.remove('on'); live = []; return true; }
    switch (S.screen) {
      case 'battle':
        if (S.resultShown) { leaveBattle(); show('title'); } else setPaused(!S.paused);
        return true;
      case 'vs': show(S.mode === 'league' ? 'league' : 'title'); return true;
      case 'team':
        if (!validDeck(S.deck)) { AU.sfx('deny'); $('teamhint').textContent = 'Pick 8 critters before leaving!'; return true; }
        saveDeck(); swapIn = null;
        if (S.prev === 'vs') openVs(S.trIdx, S.mode); else show('title');
        return true;
      case 'league': case 'help': show('title'); return true;
    }
    return false;
  }
  // Android back button (called from the WebView shell)
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
      Art.creature(c, ids[i], { t: t + i, mv: 0, walk: 0, atk: hop > 0.8 ? 0.4 : 0, hurt: 0, blink: ((t + i * 1.3) % 3.8) < 0.12, faint: 0, cheer: false }, x, ground - hop * 26 * s, s * (i === 1 ? 0.95 : 0.85), i === 2 ? -1 : 1);
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
    var L = renderer.L;
    var pb = $('pausebtn'), u = L.ui;
    pb.style.left = Math.round(W - (92 + 8 + 48) * u) + 'px';
    pb.style.top = Math.round(10 * u) + 'px';
    pb.style.width = pb.style.height = Math.round(40 * u) + 'px';
  }
  window.addEventListener('resize', function () { if (S.screen === 'battle') resize(); });

  // debug / testing hooks
  window.__ca = { S: S, renderer: renderer, startBattle: startBattle, openVs: openVs, show: show };

  show('title');
  resize();
  requestAnimationFrame(loop);
})();
