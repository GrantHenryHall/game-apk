'use strict';
// ---------- app shell: layout, screens, match flow, main loop ----------
const $ = id => document.getElementById(id);
const App = {
  V: {}, G: null, mode: 'demo', paused: false, time: 0, last: 0, cv: null, ctx: null,
  match: null,          // { rival, skill, league }
  screen: 'title', pending: null, resultT: -1, demoT: 0,
  sand: null, dexSp: null, dexBuilt: false, dctx: null,
  img: { team: {}, sp: {} },

  init() {
    // a WebView can report a zero-sized window for a moment while it is being attached
    if (!window.innerWidth || !window.innerHeight) { setTimeout(() => this.init(), 60); return; }
    this.cv = $('cv'); this.ctx = this.cv.getContext('2d');
    this.dctx = $('dexcv').getContext('2d');
    League.load();
    this.layout();
    window.addEventListener('resize', () => this.layout());
    this.bind();
    this.startDemo();
    this.show('title');
    requestAnimationFrame(ts => this.frame(ts));
  },

  layout() {
    const cw = window.innerWidth, ch = window.innerHeight; if (!cw || !ch) return;
    const V = this.V, H = Math.max(640, 360 * ch / cw), sc = ch / H, W = cw / sc;
    let dpr = Math.min(window.devicePixelRatio || 1, 3);
    while (cw * dpr * ch * dpr > 3.4e6 && dpr > 1) dpr -= .25;
    this.cv.width = Math.round(cw * dpr); this.cv.height = Math.round(ch * dpr);
    V.W = W; V.H = H; V.sc = sc; V.px = sc * dpr; V.ox = (W - 360) / 2; V.trayH = 152;
    // room for a camera notch / punch-hole at the top (reported by the Android shell)
    V.safe = (this.safePx || 0) / (window.devicePixelRatio || 1) / sc;
    V.fs = Math.min(316 / FW, (H - V.trayH - 96 - V.safe) / (FH + 12));
    V.fw = FW * V.fs; V.fh = FH * V.fs; V.fx = (W - V.fw) / 2;
    V.topH = H - V.trayH - V.fh - 8; V.fy = V.topH; V.skyH = V.safe + clamp((V.topH - V.safe) * .4, 34, 84);
    document.documentElement.style.fontSize = (sc * 10) + 'px';
    document.documentElement.style.setProperty('--safe', (V.safe * sc) + 'px');
    const dc = $('dexcv'); dc.width = Math.round(336 * V.px); dc.height = Math.round(190 * V.px); dc.style.height = '19rem';
    UI.rects();
    if (this.G) Arena.build(V, this.G.teams);
  },

  myTeam() { return League.state ? TEAM[League.state.team] : TEAMS[0]; },
  show(name) {
    this.screen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + name));
    if (name !== 'dex') this.sand = null;
  },

  // ----- little cached pictures for the DOM screens -----
  teamImg(tm) {
    if (!this.img.team[tm.id]) { const c2 = document.createElement('canvas'); c2.width = c2.height = 96; drawEmblem(c2.getContext('2d'), tm, 48, 48, 46); this.img.team[tm.id] = c2.toDataURL(); }
    return this.img.team[tm.id];
  },
  spImg(sp) {
    if (!this.img.sp[sp.id]) {
      const c2 = document.createElement('canvas'); c2.width = c2.height = 128; const g = c2.getContext('2d');
      g.fillStyle = EL[sp.el].light; g.fillRect(0, 0, 128, 128);
      g.fillStyle = 'rgba(0,0,0,.1)'; g.beginPath(); g.ellipse(64, 106, 34, 8, 0, 0, TAU); g.fill();
      g.translate(62, 106); g.scale(2.05, 2.05); drawCreature(g, sp.id, .4, { seed: sp.i * .13, noBlink: true });
      this.img.sp[sp.id] = c2.toDataURL();
    }
    return this.img.sp[sp.id];
  },

  // ----- matches -----
  startDemo() {
    const mine = this.myTeam(), other = pick(TEAMS.filter(tm => tm !== mine));
    this.G = new Game({ teams: [mine, other], ai: [.6, .6], demo: true });
    this.G.onEvent = (type, d) => { if (type === 'ko') { Arena.cheerFor(d.by, .8); Arena.burstConfetti(d.by, 14); } };
    Arena.build(this.V, this.G.teams); this.mode = 'demo'; this.demoT = 0; UI.reset();
  },
  startBattle(m) {
    if (!this.seenHow()) { this.pending = m; this.show('how'); return; }
    this.match = m;
    const mine = this.myTeam();
    this.G = new Game({ teams: [mine, m.rival], ai: [null, m.skill] });
    this.G.onEvent = (type, d) => this.onEvent(type, d);
    Arena.build(this.V, this.G.teams); Arena.confetti.length = 0;
    this.mode = 'battle'; this.paused = false; this.resultT = -1;
    UI.reset(); UI.sel = EL[mine.el].i;
    this.show(null);
  },
  seenHow() { try { return localStorage.getItem('sunlings.how') === '1'; } catch (e) { return true; } },

  onEvent(type, d) {
    switch (type) {
      case 'deploy': Sfx.play('deploy'); break;
      case 'attack': Sfx.play(d.u.sp.el); break;
      case 'hit': Sfx.play(d.m > 1 ? 'superhit' : 'hit'); break;
      case 'ko': Sfx.play('ko'); Sfx.cheer(d.by === 0 ? 1 : .55); Arena.cheerFor(d.by, 1); Arena.burstConfetti(d.by, 26); UI.pop[d.by] = 1; break;
      case 'recall': Sfx.play('recall'); break;
      case 'penalty': Sfx.play('penalty'); UI.pop[1 - d.side] = 1; Arena.cheerFor(1 - d.side, .6); break;
      case 'count': if (d.n > 0) Sfx.play('count'); break;
      case 'start': Sfx.play('go'); Sfx.cheer(.8); Arena.cheerFor(0, .8); Arena.cheerFor(1, .8); break;
      case 'win':
        Sfx.play(d.winner === 0 ? 'win' : 'lose'); Sfx.cheer(1);
        Arena.cheerFor(d.winner, 1); Arena.burstConfetti(d.winner, 120); this.resultT = 2.6; UI.cancel();
        break;
    }
  },

  showResult() {
    const G = this.G, won = G.over.winner === 0, m = this.match;
    if (m.league) League.finishRound(G.score[0], G.score[1]);
    $('rs-title').textContent = won ? 'VICTORY!' : 'DEFEAT';
    $('rs-title').style.color = won ? '#e0762a' : '#5b6686';
    $('rs-score').innerHTML = '<img src="' + this.teamImg(G.teams[0]) + '"><span>' + G.score[0] + ' – ' + G.score[1] + '</span><img src="' + this.teamImg(G.teams[1]) + '">';
    let best = null, bn = 0;
    Object.keys(G.stats.best).forEach(k => { if (k.slice(-1) === '0' && G.stats.best[k] > bn) { bn = G.stats.best[k]; best = SP[k.slice(0, -1)]; } });
    $('rs-mvp').innerHTML = best ? '<img src="' + this.spImg(best) + '"><span>Star of the match<br><b style="font-size:1.7rem">' + best.name + '</b><br>' + bn + ' KO' + (bn > 1 ? 's' : '') + '</span>' : '';
    const mins = Math.floor(G.time / 60), secs = Math.floor(G.time % 60);
    $('rs-sub').textContent = (m.diff ? m.diff.toUpperCase() + ' · ' : '') + 'vs ' + G.teams[1].name + ' · ' + G.stats.sent[0] + ' creatures sent · ' + mins + ':' + (secs < 10 ? '0' : '') + secs;
    $('b-rematch').style.display = m.league ? 'none' : '';
    $('b-continue').textContent = m.league ? 'LEAGUE TABLE' : 'CONTINUE';
    this.show('result');
  },

  pause() { if (this.mode !== 'battle' || this.G.over) return; this.paused = true; UI.cancel(); this.syncAudioButtons(); this.show('pause'); },
  resume() { this.paused = false; this.show(null); this.last = 0; },
  toTitle() { this.paused = false; this.startDemo(); this.show('title'); },

  // ----- league screen -----
  openLeague() {
    const st = League.state;
    if (!st) { this.openTeams(); return; }
    $('lg-title').textContent = 'SEASON ' + st.season + (st.done ? ' · FINAL' : ' · ROUND ' + (st.round + 1) + '/9');
    const nx = $('lg-next'), rival = League.nextRival(), mine = this.myTeam();
    if (rival) {
      const stars = Math.round(1 + League.rivalSkill() * 4.2);
      nx.innerHTML = '<img src="' + this.teamImg(rival) + '"><div class="txt"><small>NEXT MATCH · ' + EL[rival.el].name.toUpperCase() + '</small><h3>' + rival.name + '</h3><small>' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</small></div><button class="btn big" id="b-battle">BATTLE!</button>';
      $('b-battle').onclick = () => this.startBattle({ rival, skill: League.rivalSkill(), league: true });
    } else {
      const pl = League.place(), th = ['st', 'nd', 'rd'][pl - 1] || 'th';
      nx.innerHTML = '<img src="' + this.teamImg(mine) + '"><div class="txt"><small>SEASON OVER</small><h3>' + (pl === 1 ? 'CHAMPIONS! 🏆' : 'You finished ' + pl + th) + '</h3><small>' + mine.name + '</small></div>';
    }
    let h = '<tr><th></th><th style="text-align:left">TEAM</th><th>W</th><th>L</th><th>KO +/-</th></tr>';
    League.standings().forEach((r, i) => {
      const diff = r.kf - r.ka;
      h += '<tr class="' + (r.team.id === st.team ? 'me' : '') + '"><td>' + (i + 1) + '</td><td class="nm"><img src="' + this.teamImg(r.team) + '">' + r.team.name + '</td><td>' + r.w + '</td><td>' + r.l + '</td><td>' + (diff > 0 ? '+' : '') + diff + '</td></tr>';
    });
    $('lg-table').innerHTML = h;
    this.show('league');
  },
  openTeams() {
    const grid = $('teamgrid');
    if (!grid.children.length) TEAMS.forEach(tm => {
      const b = document.createElement('button'); b.className = 'team';
      b.innerHTML = '<img src="' + this.teamImg(tm) + '"><span>' + tm.name + '<small>' + EL[tm.el].name + ' fans</small></span>';
      b.onclick = () => { Sfx.play('ui'); League.start(tm.id); this.startDemo(); this.openLeague(); };
      grid.appendChild(b);
    });
    this.show('teams');
  },

  // ----- creature gallery with a live sparring preview -----
  openDex() {
    const grid = $('dexgrid');
    if (!this.dexBuilt) {
      this.dexBuilt = true;
      SPECIES.forEach(sp => {
        const b = document.createElement('button'); b.className = 'dex'; b.id = 'dex-' + sp.id;
        b.innerHTML = '<img src="' + this.spImg(sp) + '">' + sp.name;
        b.onclick = () => { Sfx.play('ui'); this.setDex(sp); };
        grid.appendChild(b);
      });
    }
    this.show('dex'); this.setDex(this.dexSp || SPECIES[0]);
  },
  setDex(sp) {
    this.dexSp = sp;
    document.querySelectorAll('.dex').forEach(b => b.classList.toggle('on', b.id === 'dex-' + sp.id));
    const e = EL[sp.el], weak = ELEMENTS.filter(q => BEATS[q.id].indexOf(sp.el) >= 0).map(q => q.name).join(', ');
    $('dexinfo').innerHTML = '<div class="nm">' + sp.name + '<span class="tag" style="background:' + e.col + '">' + e.name.toUpperCase() + '</span><span class="tag" style="background:' + e.dark + '">' + ROLES[sp.role].name.toUpperCase() + '</span></div>' +
      '<p>' + sp.move + ' — ' + sp.blurb + '</p><p>Strong vs ' + BEATS[sp.el].map(id => EL[id].name).join(', ') + ' · Weak to ' + weak + '</p>';
    const G = new Game({ teams: [TEAMS[e.i], TEAMS[(e.i + 5) % 10]], ai: [null, null], demo: true });
    G.sandbox = true;
    const a = G.deploy(0, sp.id, 80, 300), d = G.deploy(1, sp.id === 'cobblem' ? 'walrump' : 'cobblem', 220, 100);
    a.x = 78; a.y = 265; d.x = 222; d.y = 265; d.dummy = true; d.home = { x: 222, y: 265 };
    G.onEvent = (type, q) => { if (type === 'attack') Sfx.play(q.u.sp.el); else if (type === 'hit') Sfx.play('hit'); };
    this.sand = G;
  },

  syncAudioButtons() {
    ['b-snd', 'b-snd2'].forEach(id => { $(id).textContent = 'SOUND ' + (Sfx.sound ? 'ON' : 'OFF'); });
    ['b-mus', 'b-mus2'].forEach(id => { $(id).textContent = 'MUSIC ' + (Sfx.music ? 'ON' : 'OFF'); });
  },

  bind() {
    const cv = this.cv;
    const pt = e => ({ x: e.clientX / this.V.sc, y: e.clientY / this.V.sc });
    const live = () => this.mode === 'battle' && !this.paused && !this.G.over;
    let pid = null;
    cv.addEventListener('pointerdown', e => { e.preventDefault(); if (pid !== null || !live()) return; pid = e.pointerId; try { cv.setPointerCapture(pid); } catch (er) { /* fine */ } UI.down(pt(e)); });
    cv.addEventListener('pointermove', e => { if (e.pointerId === pid && live()) UI.move(pt(e)); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; if (live()) { if (e.type === 'pointercancel') UI.cancel(); else UI.up(pt(e)); } else UI.cancel(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerdown', () => Sfx.unlock(), true);

    const click = (id, fn) => { $(id).addEventListener('click', () => { Sfx.play('ui'); fn(); }); };
    click('b-league', () => this.openLeague());
    click('b-quick', () => this.show('diff'));
    const SMART = { easy: .15, medium: .5, hard: .9 };
    document.querySelectorAll('.diff').forEach(b => b.addEventListener('click', () => {
      Sfx.play('ui'); const d = b.getAttribute('data-diff'), mine = this.myTeam();
      this.startBattle({ rival: pick(TEAMS.filter(tm => tm !== mine)), skill: SMART[d], diff: d, league: false });
    }));
    click('b-dex', () => this.openDex());
    click('b-how', () => { this.pending = null; this.show('how'); });
    click('b-howok', () => { try { localStorage.setItem('sunlings.how', '1'); } catch (e) { /* ignore */ } const p = this.pending; this.pending = null; if (p) this.startBattle(p); else this.show('title'); });
    const snd = () => { Sfx.setSound(!Sfx.sound); this.syncAudioButtons(); }, mus = () => { Sfx.setMusic(!Sfx.music); this.syncAudioButtons(); };
    click('b-snd', snd); click('b-snd2', snd); click('b-mus', mus); click('b-mus2', mus);
    click('b-resume', () => this.resume());
    click('b-quit', () => this.toTitle());
    click('b-continue', () => { if (this.match.league) { this.startDemo(); this.openLeague(); } else this.toTitle(); });
    click('b-rematch', () => this.startBattle(this.match));
    click('b-menu', () => this.toTitle());
    // a season in progress takes a second tap to throw away
    let armed = 0;
    click('b-newseason', () => {
      const st = League.state, now = Date.now();
      if (st && !st.done && now - armed > 3500) { armed = now; $('b-newseason').textContent = 'TAP AGAIN TO RESTART THE SEASON'; setTimeout(() => { $('b-newseason').textContent = 'START A NEW SEASON'; }, 3500); return; }
      armed = 0; $('b-newseason').textContent = 'START A NEW SEASON'; League.reset(); this.openTeams();
    });
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { Sfx.play('ui'); this.show(b.getAttribute('data-go')); }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
    this.syncAudioButtons();
    window.setSafeTop = px => { this.safePx = px; this.layout(); };
    // Android back button (called from the native shell). Returns true when handled here.
    window.appBack = () => {
      if (this.mode === 'battle' && !this.G.over) { if (this.paused) this.resume(); else this.pause(); return true; }
      if (this.mode === 'battle' && !this.screen) return true;   // victory moment: results are on their way
      if (this.screen && this.screen !== 'title') { if (this.mode === 'battle') this.toTitle(); else this.show('title'); return true; }
      return false;
    };
  },

  frame(ts) {
    requestAnimationFrame(t2 => this.frame(t2));
    let dt = this.last ? (ts - this.last) / 1000 : 1 / 60; this.last = ts;
    if (dt > .25) dt = 1 / 60;
    dt = Math.min(dt, .05);
    this.time += dt;
    const G = this.G, V = this.V, ctx = this.ctx, t = this.time;

    if (!this.paused) {
      G.update(dt); Arena.update(dt, G.excite); UI.update(dt);
      if (this.mode === 'demo' && G.over) { this.demoT += dt; if (this.demoT > 4) this.startDemo(); }
      if (this.resultT > 0) { this.resultT -= dt; if (this.resultT <= 0) this.showResult(); }
    }
    Sfx.crowd(this.mode === 'battle' ? .35 + G.excite * .65 : .12);

    ctx.setTransform(V.px, 0, 0, V.px, 0, 0);
    Arena.drawBack(ctx, t);
    Arena.drawCrowd(ctx, t, G.excite);
    Arena.drawFieldLight(ctx, t);
    const battle = this.mode === 'battle';
    drawBattle(ctx, this.G, t, battle ? { ground: c2 => UI.dragGround(c2, t), mid: c2 => UI.dragAir(c2, t) } : null);
    Arena.drawConfetti(ctx);
    if (battle) {
      UI.drawScoreboard(ctx); UI.drawTray(ctx, t); UI.drawDragLoose(ctx, t); UI.drawOverlays(ctx, t);
    } else {
      const ty = V.H - V.trayH, pg2 = ctx.createLinearGradient(0, ty, 0, V.H);
      pg2.addColorStop(0, '#2c3566'); pg2.addColorStop(1, '#1d2347');
      ctx.fillStyle = pg2; ctx.fillRect(0, ty, V.W, V.trayH); ctx.fillStyle = '#ffd23d'; ctx.fillRect(0, ty, V.W, 2.5);
    }

    // creature gallery preview
    if (this.sand) {
      const S = this.sand, c2 = this.dctx;
      S.update(dt);
      c2.setTransform(V.px, 0, 0, V.px, 0, 0);
      c2.fillStyle = '#63cf5c'; c2.fillRect(0, 0, 336, 190);
      c2.fillStyle = '#58c452'; for (let i = 0; i < 6; i += 2) c2.fillRect(0, i * 34, 336, 34);
      c2.strokeStyle = 'rgba(255,255,255,.6)'; c2.lineWidth = 2; c2.beginPath(); c2.ellipse(168, 160, 150, 22, 0, 0, TAU); c2.stroke();
      drawBattle(c2, S, t, null, { x: 168 - 150 * 1.22, y: 160 - 265 * 1.22, s: 1.22 });
    }
  }
};
window.addEventListener('load', () => App.init());
