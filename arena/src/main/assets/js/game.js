'use strict';
// ---------- battle simulation: units, rules, damage, statuses, the rival AI ----------
const FW = RULES.FW, FH = RULES.FH, MID = RULES.FH / 2;
const visScale = r => .62 + (r / 16) * .5;
const BURN_DPS = 22, POISON_DPS = 18;

class Game {
  // o: { teams:[mine, rival], ai:[skill|null, skill|null], target, demo }
  constructor(o) {
    this.fx = new FxSystem();
    this.units = []; this.uid = 0;
    this.score = [0, 0]; this.target = o.target || RULES.KO_TARGET;
    this.teams = o.teams; this.demo = !!o.demo;
    this.time = 0; this.state = o.demo ? 'play' : 'intro'; this.introT = o.demo ? 0 : 3.3;
    this.over = null; this.empty = [0, 0]; this.t0 = o.demo ? -99 : 0; this.sandbox = false;
    this.ais = [0, 1].map(s => o.ai[s] == null ? null : new AIPlayer(s, o.teams[s], o.ai[s]));
    this.stats = { dmg: [0, 0], sent: [0, 0], best: {} };
    this.excite = 0;                 // crowd energy, 0..1
    this.onEvent = null;
  }
  emit(type, data) { if (this.onEvent) this.onEvent(type, data || {}); }
  shake(v) { this.fx.shake = Math.max(this.fx.shake, v); }

  // ----- queries -----
  side(s) { return this.units.filter(u => u.side === s && (u.state === 'active' || u.state === 'deploy')); }
  count(s) { let n = 0; for (const u of this.units) if (u.side === s && (u.state === 'active' || u.state === 'deploy')) n++; return n; }
  has(s, id) { for (const u of this.units) if (u.side === s && u.sp.id === id && (u.state === 'active' || u.state === 'deploy')) return true; return false; }
  enemies(s) { return this.units.filter(u => u.side !== s && u.state === 'active'); }
  allies(s) { return this.units.filter(u => u.side === s && u.state === 'active'); }
  nearestEnemy(s, x, y, maxR, exclude) {
    let best = null, bd = maxR || 1e9;
    for (const u of this.units) {
      if (u.side === s || u.state !== 'active' || (exclude && exclude.indexOf(u) >= 0)) continue;
      const d = dist2(x, y, u.x, u.y); if (d < bd) { bd = d; best = u; }
    }
    return best;
  }
  weakestAlly(s) {
    let best = null, bf = .999;
    for (const u of this.units) { if (u.side !== s || u.state !== 'active') continue; const f = u.hp / u.maxHp; if (f < bf) { bf = f; best = u; } }
    return best;
  }

  // how long a side may stand empty before the rival is given a point (longer before the very first send-out)
  grace(s) { return this.stats.sent[s] === 0 ? RULES.FIRST_GRACE : RULES.EMPTY_GRACE; }

  // ----- deploying -----
  canDeploy(s, id) { return this.state === 'play' && this.count(s) < RULES.MAX_FIELD && !this.has(s, id); }
  clampDeploy(s, x, y) {
    const M = RULES.MARGIN;
    return { x: clamp(x, M, FW - M), y: s === 0 ? clamp(y, MID + 14, FH - M) : clamp(y, M + 8, MID - 14) };
  }
  deploy(s, id, x, y) {
    if (!this.canDeploy(s, id)) return null;
    const sp = SP[id], p = this.clampDeploy(s, x, y);
    const u = {
      id: ++this.uid, side: s, sp, x: p.x, y: p.y, r: sp.r, vs: visScale(sp.r),
      hp: sp.hp, maxHp: sp.hp, face: s === 0 ? 1 : -1, state: 'deploy', st: 0,
      cd: rnd(.15, .45), atkT: -1, atk: null, fired: false, tgt: null, retarget: 0,
      life: RULES.STINT, age: 0, seed: Math.random(), moving: false,
      ox: 0, oy: 0, lift: 0, rot: 0, sx: 1, sy: 1, hide: false, al: 1, pivot: false, flip: false,
      adx: 0, ady: s === 0 ? -1 : 1, adist: 0, aC: 0, aD: 0,
      flash: 0, kx: 0, ky: 0, kz: 0, z: 0,
      burn: 0, poison: 0, chill: 0, stun: 0, stunKind: 'daze', stunImm: 0, root: 0, curse: 0, shield: 0, shieldT: 0,
      dealt: 0, kos: 0, emitT: 0,
      rec: 0, recT: 1, rx: 0, ry: 0, freeze: 0, anc: null      // flinch, hit-stop, and where its move leaves its body
    };
    this.units.push(u); this.stats.sent[s]++; this.empty[s] = 0;
    const tc = this.teams[s].c1, fx = this.fx;
    fx.ring(u.x, u.y, 4, u.r * 2.2, .45, '#fff', 3, true);
    fx.ring(u.x, u.y, 2, u.r * 1.7, .5, tc, 2.4, true, .06);
    fx.add({ dur: .45, draw(ctx, k) {
      const gr = ctx.createLinearGradient(0, u.y - 90, 0, u.y);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,' + (.75 * (1 - k)) + ')');
      ctx.fillStyle = gr; const w2 = u.r * (1.1 - k * .7); ctx.fillRect(u.x - w2, u.y - 90, w2 * 2, 90);
    } });
    fx.burst(u.x, u.y - u.r, 10, { col: ['#fff', tc, '#fff3a8'], shape: 's', spd: 80, life: .55, size: 3.4, vr: 8 });
    this.emit('deploy', { u });
    return u;
  }

  // ----- damage, healing, statuses -----
  hit(src, tg, dmg, o) {
    o = o || {};
    if (!tg || tg.state !== 'active') return 0;
    const m = o.dot ? 1 : typeMult(src.sp.el, tg.sp.el);
    let d = dmg * m;
    if (tg.curse > 0) d *= 1.3;
    if (!o.dot && src.sp.role === 'dasher' && (tg.sp.role === 'sniper' || tg.sp.role === 'caster')) d *= BACKSTAB;
    if (tg.shield > 0) {
      const ab = Math.min(tg.shield, d); tg.shield -= ab; d -= ab;
      if (!o.dot) this.fx.ring(bodyX(tg), bodyY(tg), tg.r * .8, tg.r * 1.5, .25, '#ffe27a', 2);
    }
    tg.hp -= d; this.stats.dmg[src.side] += d; src.dealt += d;
    if (!o.dot) {
      tg.flash = 1;
      if (d >= 1) this.fx.text(bodyX(tg) + rnd(-6, 6), bodyY(tg) - tg.r * .7, String(Math.round(d)), m > 1 ? '#ffe14a' : m < 1 ? '#c9c9d6' : '#ffffff', m > 1 ? 10.5 : m < 1 ? 6.5 : 8);
      const s = src.sp;
      if ((s.burn || s.burnCh) && (!s.burnCh || Math.random() < s.burnCh)) tg.burn = Math.max(tg.burn, s.burn || 2);
      if (s.poison) tg.poison = Math.max(tg.poison, s.poison);
      if (s.chill) tg.chill = Math.max(tg.chill, s.chill);
      if (s.root) tg.root = Math.max(tg.root, s.root);
      if (s.curse) tg.curse = Math.max(tg.curse, s.curse);
      if (s.stun && tg.stunImm <= 0 && Math.random() < (s.stunCh || 0)) {
        tg.stun = Math.max(tg.stun, s.stun); tg.stunImm = s.stun + 1.6;
        tg.stunKind = s.el === 'spark' ? 'zap' : s.el === 'frost' ? 'ice' : 'daze';
      }
      if (s.knock) {
        const dx = tg.x - (src.x + src.ox), dy = tg.y - (src.y + src.oy), l = Math.hypot(dx, dy) || 1;
        tg.kx += dx / l * s.knock * 6; tg.ky += dy / l * s.knock * 6;
      }
      if (s.leech && src.state === 'active' && d > 0) {
        this.heal(src, d * s.leech, '#ff5a7a', true);
        const fx = this.fx, x0 = bodyX(tg), y0 = bodyY(tg);
        for (let i = 0; i < 3; i++) fx.add({ dur: .4, delay: i * .06, draw(ctx, k) {
          const e = Ease.inOut(k), x = lerp(x0, bodyX(src), e), y = lerp(y0, bodyY(src), e) - Math.sin(k * PI) * 10;
          ctx.fillStyle = 'rgba(255,60,90,.4)'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
          ctx.fillStyle = '#ff7a9a'; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
        } });
      }
      // the target flinches away from the blow, and a solid hit freezes both for a beat
      const hx = tg.x - (src.x + src.ox), hy = tg.y - (src.y + src.oy), hl = Math.hypot(hx, hy) || 1, heavy = Math.min(1, d / (tg.maxHp * .035));
      tg.rx = hx / hl; tg.ry = hy / hl; tg.rec = Math.min(1.25, (.4 + heavy * .6) * (m > 1 ? 1.25 : 1)); tg.recT = 0;
      const stop = .018 + heavy * .04;
      tg.freeze = Math.max(tg.freeze, stop);
      if (src.state === 'active' && src.atkT >= 0 && hl < (src.r + tg.r) * 2.4) src.freeze = Math.max(src.freeze, stop);
      this.emit('hit', { tg, m, d });
    }
    if (tg.hp <= 0) this.ko(tg, src);
    return d;
  }
  area(src, x, y, r, dmg) {
    let n = 0;
    for (const e of this.units) {
      if (e.side === src.side || e.state !== 'active') continue;
      if (dist2(x, y, e.x, e.y) <= r + e.r * .5) { this.hit(src, e, dmg); n++; }
    }
    return n;
  }
  heal(u, amt, col, quiet) {
    if (!u || u.state !== 'active' || u.hp >= u.maxHp) return;
    u.hp = Math.min(u.maxHp, u.hp + amt);
    const fx = this.fx;
    for (let i = 0; i < (quiet ? 1 : 3); i++) fx.p({ x: u.x + rnd(-u.r, u.r) * .7, y: u.y - rnd(u.r * .4, u.r * 1.6), vy: -26, life: .7, size: 2.6, col: col || '#9af0a0', shape: 'h' });
    if (!quiet) fx.text(u.x, u.y - u.r * 2.3, '+' + Math.round(amt), '#9dffa8', 7, { dur: .7 });
  }
  shield(u, amt) { if (u.state === 'active') { u.shield = Math.min(amt * 2, u.shield + amt); u.shieldT = 5; } }

  ko(u, src) {
    if (u.state !== 'active') return;
    const by = 1 - u.side, fx = this.fx;
    u.state = 'faint'; u.st = 0; u.hp = 0; u.atkT = -1;
    this.score[by]++;
    if (src && src.side === by) { src.kos++; const b = this.stats.best; b[src.sp.id + by] = (b[src.sp.id + by] || 0) + 1; }
    const x = u.x, y = u.y - u.r;
    fx.burst(x, y, 9, { col: ['#fff', '#ffe14a'], shape: 's', spd: 95, life: .7, size: 4.2, vr: 9, g: 60 });
    fx.burst(x, u.y, 6, { col: 'rgba(255,255,255,.9)', shape: 'p', spd: 34, life: .5, size: 6, grow: 9, flat: .5 });
    fx.text(x, y - 14, 'KO!', this.teams[by].c1 === '#3a2d50' ? '#ff3d5e' : '#fff', 13, { dur: 1.1, vy: -16, stroke: shade(this.teams[by].c1, -.55) });
    this.excite = 1; this.shake(4);
    this.emit('ko', { u, by });
    if (!this.over && this.score[by] >= this.target) this.finish(by);
  }
  recall(u) {
    if (u.state !== 'active' && u.state !== 'deploy') return;
    u.state = 'recall'; u.st = 0; u.atkT = -1;
    this.fx.burst(u.x, u.y - u.r, 8, { col: ['#fff', this.teams[u.side].c1], shape: 's', spd: 60, life: .5, size: 3, vr: 8, up: 30 });
    this.emit('recall', { u });
  }
  finish(winner) {
    this.over = { winner, t: 0 }; this.state = 'over';
    this.emit('win', { winner });
  }

  // ----- per-frame -----
  update(dt) {
    this.time += dt;
    this.excite = Math.max(0, this.excite - dt * .35);
    if (this.state === 'intro') {
      const before = Math.ceil(this.introT); this.introT -= dt;
      const after = Math.ceil(this.introT);
      if (after !== before && after >= 0) this.emit('count', { n: after });
      if (this.introT <= 0) { this.state = 'play'; this.t0 = this.time; this.emit('start'); }
    }
    if (this.state === 'play') {
      for (const ai of this.ais) if (ai) ai.update(dt, this);
      for (let s = 0; s < 2; s++) {
        if (this.count(s) === 0) {
          this.empty[s] += dt;
          if (this.empty[s] >= this.grace(s)) {
            this.empty[s] = 0; this.score[1 - s]++;
            this.fx.text(FW / 2, s === 0 ? FH * .72 : FH * .28, 'EMPTY SIDE! +1', '#ffe14a', 12, { dur: 1.4, vy: -8 });
            this.emit('penalty', { side: s });
            if (!this.over && this.score[1 - s] >= this.target) this.finish(1 - s);
          }
        } else this.empty[s] = 0;
      }
    }
    if (this.over) {
      this.over.t += dt;
      if (this.over.t > .7 && !this.over.cleared) { this.over.cleared = true; this.units.forEach(u => { if (u.side !== this.over.winner) this.recall(u); }); }
    }
    for (const u of this.units) this.updateUnit(u, dt);
    this.separate(dt);
    for (let i = this.units.length - 1; i >= 0; i--) if (this.units[i].state === 'gone') this.units.splice(i, 1);
    this.fx.update(dt);
  }

  updateUnit(u, dt) {
    u.age += dt; u.st += dt;
    u.flash = Math.max(0, u.flash - dt * 8);
    if (u.recT < 1) u.recT += dt;
    // hit-stop: both creatures hold their pose for an instant when a blow lands, which gives it weight
    if (u.freeze > 0 && u.state === 'active') { u.freeze -= dt; return; }
    u.ox = u.oy = u.lift = u.rot = 0; u.sx = u.sy = 1; u.hide = false; u.al = 1; u.pivot = false; u.flip = false;
    u.moving = false;
    if (u.state === 'deploy') { if (u.st >= RULES.DEPLOY) { u.state = 'active'; u.st = 0; } return; }
    if (u.state === 'faint') { if (u.st >= .95) u.state = 'gone'; return; }
    if (u.state === 'recall') { if (u.st >= .6) u.state = 'gone'; return; }
    if (u.state !== 'active') return;

    // shoves and knock-ups
    if (u.kx || u.ky) {
      u.x += u.kx * dt; u.y += u.ky * dt;
      const dk = Math.exp(-6 * dt); u.kx *= dk; u.ky *= dk;
      if (Math.abs(u.kx) + Math.abs(u.ky) < 2) u.kx = u.ky = 0;
    }
    if (u.z > 0 || u.kz > 0) { u.z += u.kz * dt; u.kz -= 340 * dt; if (u.z <= 0) { u.z = 0; u.kz = 0; } }

    // damage over time
    const fx = this.fx; u.emitT -= dt;
    const emit = u.emitT <= 0; if (emit) u.emitT = .14;
    if (u.burn > 0) {
      u.burn -= dt; u.hp -= BURN_DPS * dt; this.stats.dmg[1 - u.side] += BURN_DPS * dt;
      if (emit) fx.p({ x: u.x + rnd(-u.r, u.r) * .6, y: u.y - rnd(4, u.r * 1.6), vy: -34, life: .4, size: rnd(2, 3.4), col: pick(['#ff7a2a', '#ffd23d']) });
    }
    if (u.poison > 0) {
      u.poison -= dt; u.hp -= POISON_DPS * dt; this.stats.dmg[1 - u.side] += POISON_DPS * dt;
      if (emit && Math.random() < .6) fx.p({ x: u.x + rnd(-u.r, u.r) * .6, y: u.y - rnd(4, u.r * 1.4), vy: -20, life: .6, size: rnd(1.6, 2.8), col: '#c88af0', shape: 'b' });
    }
    if (u.chill > 0) { u.chill -= dt; if (emit && Math.random() < .35) fx.p({ x: u.x + rnd(-u.r, u.r) * .7, y: u.y - rnd(4, u.r * 1.8), vy: 10, life: .6, size: 2.6, col: '#dff6ff', shape: 'f', vr: 3 }); }
    if (u.curse > 0) { u.curse -= dt; if (emit && Math.random() < .4) fx.p({ x: u.x + rnd(-u.r, u.r) * .7, y: u.y - rnd(4, u.r * 1.6), vy: -16, life: .6, size: 2.2, col: '#ff4ad0', shape: 's', vr: 4 }); }
    if (u.root > 0) u.root -= dt;
    if (u.stunImm > 0) u.stunImm -= dt;
    if (u.shield > 0) { u.shieldT -= dt; if (u.shieldT <= 0) u.shield = 0; }
    if (u.hp <= 0) { this.ko(u, null); return; }

    if (this.over) { if (u.side === this.over.winner) u.lift = Math.abs(Math.sin((u.age + u.seed) * 7)) * 9; return; }
    if (u.stun > 0) { u.stun -= dt; return; }
    // sparring partner in the creature gallery: stands still and never runs out of health
    if (u.dummy) { if (u.hp < u.maxHp * .4) u.hp = u.maxHp; u.x = u.home.x; u.y = u.home.y; u.kx = u.ky = 0; return; }

    if (!this.sandbox) u.life -= dt;
    const slow = u.chill > 0 ? .62 : 1;

    // mid-attack
    if (u.atkT >= 0) {
      const A = u.atk; u.atkT += dt * slow;
      const k = Math.min(1, u.atkT / A.dur);
      if (A.pose) A.pose(u, k);
      if (A.tick) A.tick(this, u, k, dt);
      if (!u.fired && k >= A.at) {
        u.fired = true;
        if (u.tgt && u.tgt.state === 'active') { A.fire(this, u, u.tgt); this.emit('attack', { u }); }
      }
      if (k >= 1) {
        if (A.commit) { u.x = clamp(u.x + u.ox, u.r, FW - u.r); u.y = clamp(u.y + u.oy, u.r + 8, FH - 4); }
        u.ox = u.oy = u.lift = u.rot = 0; u.sx = u.sy = 1; u.hide = false; u.al = 1;
        u.atkT = -1; u.cd = u.sp.cd * rnd(.92, 1.08);
      }
      return;
    }
    if (u.life <= 0) { this.fx.text(u.x, u.y - u.r * 2.6, 'HOME TIME!', '#ffffff', 7.5, { dur: 1 }); this.recall(u); return; }

    u.cd -= dt * slow;
    u.retarget -= dt;
    if (!u.tgt || u.tgt.state !== 'active' || u.retarget <= 0) { u.tgt = this.pickTarget(u); u.retarget = .45; }
    const tg = u.tgt;
    if (!tg) return;
    const dx = tg.x - u.x, dy = tg.y - u.y, d = Math.hypot(dx, dy) || .001;
    if (Math.abs(dx) > 3) u.face = dx > 0 ? 1 : -1;
    // melee creatures stop a little short of their target so the swing itself is easy to see
    const reach = Math.max(u.sp.range, (u.r + tg.r) * RULES.SPREAD + 9);
    if (d <= reach) {
      if (u.cd <= 0) {
        const A = ATTACKS[u.sp.id];
        u.atk = A; u.atkT = 0; u.fired = false;
        u.adx = dx / d; u.ady = dy / d; u.adist = d;
        u.aC = Math.max(0, d - (u.r + tg.r) * .8); u.aD = d + tg.r + u.r + 6;
        if (A.start) A.start(this, u, tg);
      }
    } else if (u.root <= 0) {
      const v = u.sp.spd * slow * dt;
      u.x += dx / d * v; u.y += dy / d * v; u.moving = true;
    }
  }

  pickTarget(u) {
    let best = null, bs = 1e9;
    const dive = u.sp.role === 'dasher';
    for (const e of this.units) {
      if (e.side === u.side || e.state !== 'active') continue;
      let s = dist2(u.x, u.y, e.x, e.y);
      if (dive && (e.sp.role === 'sniper' || e.sp.role === 'caster')) s -= 75;
      if (e === u.tgt) s -= 14;
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  }

  separate(dt) {
    const us = this.units, k = Math.min(1, dt * 11);
    for (let i = 0; i < us.length; i++) {
      const p = us[i]; if (p.state !== 'active') continue;
      const pd = p.atkT >= 0 && p.atk.commit;
      for (let j = i + 1; j < us.length; j++) {
        const q = us[j]; if (q.state !== 'active') continue;
        if (pd || (q.atkT >= 0 && q.atk.commit)) continue;
        let dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
        const min = (p.r + q.r) * RULES.SPREAD;
        if (d >= min) continue;
        if (d < .01) { dx = rnd(-1, 1); dy = rnd(-1, 1); d = Math.hypot(dx, dy) || 1; }
        const push = (min - d) * k, wp = q.r / (p.r + q.r), wq = p.r / (p.r + q.r);
        p.x -= dx / d * push * wp; p.y -= dy / d * push * wp;
        q.x += dx / d * push * wq; q.y += dy / d * push * wq;
      }
      p.x = clamp(p.x, p.r, FW - p.r); p.y = clamp(p.y, p.r + 8, FH - 4);
    }
  }
}

// ---------- the rival coach ----------
class AIPlayer {
  // `smart` (0..1) is the only thing that differs between an easy and a hard coach: how well it PICKS.
  // Every coach sends creatures out at the same human pace and places them the same sensible way.
  constructor(side, team, smart) { this.side = side; this.team = team; this.smart = smart; this.t = rnd(.5, 1); }
  update(dt, G) {
    this.t -= dt; if (this.t > 0) return;
    const n = G.count(this.side);
    if (n >= RULES.MAX_FIELD) { this.t = .25; return; }
    const sp = this.choose(G);
    if (!sp) { this.t = .5; return; }
    const p = this.place(G, sp);
    G.deploy(this.side, sp.id, p.x, p.y);
    this.t = (n < 2 ? 1.2 : 2.3) * rnd(.75, 1.3);
  }
  choose(G) {
    const mine = G.side(this.side), foes = G.side(1 - this.side), sm = this.smart;
    const have = { tank: 0, brawler: 0, dasher: 0, sniper: 0, caster: 0 };
    mine.forEach(u => { have[u.sp.role]++; });
    const want = { tank: 1.2, brawler: 1.2, dasher: .8, sniper: 1.2, caster: .8 };
    const foeRanged = foes.filter(u => u.sp.role === 'sniper' || u.sp.role === 'caster').length, foeMelee = foes.length - foeRanged;
    const counterW = Math.max(0, sm - .25) * 2.7;      // an easy coach does not read your side at all
    let best = null, bs = -1e9;
    for (const sp of SPECIES) {
      if (G.has(this.side, sp.id)) continue;
      let s = Math.random() * lerp(2.4, .5, sm);                 // whim: big for an easy coach, small for a sharp one
      if (sp.el === this.team.el) s += lerp(1.3, .7, sm);        // everyone favours their home element
      s += (want[sp.role] - have[sp.role]) * lerp(.15, .7, sm);  // a sense of team shape
      if (have.tank === 0 && sp.role === 'tank') s += .6 * sm;
      if (foes.length && counterW > 0) {
        let mu = 0;
        for (const e of foes) { const at = typeMult(sp.el, e.sp.el), df = typeMult(e.sp.el, sp.el); mu += (at > 1 ? 1 : at < 1 ? -.5 : 0) + (df > 1 ? -1 : df < 1 ? .5 : 0); }
        s += counterW * mu / foes.length;
        if (sp.role === 'dasher') s += sm * .3 * foeRanged;      // dive a ranged-heavy side
        if (sp.role === 'caster') s += sm * .15 * foeMelee;      // blast a melee clump
      }
      if (s > bs) { bs = s; best = sp; }
    }
    return best;
  }
  place(G, sp) {
    const foes = G.side(1 - this.side), mine = G.side(this.side), M = RULES.MARGIN;
    let cx = FW / 2;
    if (foes.length) cx = foes.reduce((a, u) => a + u.x, 0) / foes.length;
    const wob = .7;
    let depth, x;
    switch (sp.role) {
      case 'tank': depth = .16; x = cx + rnd(-28, 28) * wob; break;
      case 'brawler': depth = .28; x = cx + rnd(-60, 60) * wob; break;
      case 'dasher': depth = .3; x = (Math.random() < .5 ? 34 : FW - 34) + rnd(-14, 14); break;
      case 'sniper': {
        depth = .78; let bx = FW / 2, bd = -1;
        for (let i = 0; i < 6; i++) { const tx = 30 + i * (FW - 60) / 5; let d = 1e9; mine.forEach(u => { if (u.sp.role === 'sniper' || u.sp.role === 'caster') d = Math.min(d, Math.abs(u.x - tx)); }); d += rnd(0, 30); if (d > bd) { bd = d; bx = tx; } }
        x = bx; break;
      }
      default: depth = .6; x = cx + rnd(-70, 70) * wob;
    }
    depth = clamp(depth + rnd(-.07, .07) * wob, .06, .95);
    const span = MID - M - 14, y = this.side === 1 ? MID - 14 - depth * span : MID + 14 + depth * span;
    return G.clampDeploy(this.side, x, y);
  }
}
