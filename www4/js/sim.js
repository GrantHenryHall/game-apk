/* Critter Arena 4 — real-time battle simulation + trainer AI, levels and wild battles.
 * No DOM access: the renderer reads state and drains `battle.events`. Runs headless in node. */
(function (root) {
  var CA = root.CA;
  var R = CA.RULES, SP = CA.SPECIES;
  var TAU = Math.PI * 2;

  function rngFrom(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function gap(a, b) { return dist(a, b) - a.r - b.r; }

  // ---------------------------------------------------------------------------
  function Battle(opts) {
    this.rng = rngFrom(opts.seed || (Math.random() * 1e9) | 0);
    this.t = 0;
    this.time = R.time;
    this.overtime = false;
    this.over = false;
    this.winner = null;          // 0 player, 1 enemy, -1 draw
    this.endReason = '';
    this.units = [];
    this.projs = [];
    this.throws = [];
    this.events = [];
    this.nextId = 1;
    this.emult = opts.energyMult || [1, 1];
    // levels: per side, a map species -> level (missing = level 10, the balance baseline)
    this.levels = opts.levels || [{}, {}];
    // shiny: per side, a map species -> true for critters with their rare sparkly colours
    this.shiny = opts.shiny || [{}, {}];
    this.sides = [this.makeSide(0, opts.decks[0]), this.makeSide(1, opts.decks[1])];
    this.wild = opts.wild || null;
    if (this.wild) this.setupWild();
  }
  CA.Battle = Battle;
  var B = Battle.prototype;

  B.makeSide = function (idx, deck) {
    var q = deck.slice();
    for (var i = q.length - 1; i > 0; i--) { var j = (this.rng() * (i + 1)) | 0; var tmp = q[i]; q[i] = q[j]; q[j] = tmp; }
    return {
      idx: idx, deck: deck.slice(), hand: q.slice(0, Math.min(4, q.length)), queue: q.slice(4),
      energy: R.energyStart, capsules: R.capsules, records: [], ko: 0, hype: 0, boostT: 0, evos: 0,
      dmgDealt: 0, sent: 0
    };
  };

  B.energyRate = function () {
    if (this.overtime) return 3;
    return this.time <= R.doubleAt ? 2 : 1;
  };

  B.zone = function (side) { return side === 0 ? R.playerZone : R.enemyZone; };

  B.clampDeploy = function (side, x, y) {
    var z = this.zone(side);
    return { x: clamp(x, 0.8, R.W - 0.8), y: clamp(y, z[0], z[1]) };
  };

  B.canDeploy = function (side, hi) {
    var s = this.sides[side];
    if (this.over || s.capsules <= 0 || hi < 0 || hi >= s.hand.length) return false;
    var sp = SP[s.hand[hi]];
    return !!sp && s.energy >= sp.cost;
  };

  // Send out the creature in hand slot `hi` at (x, y): a capsule is thrown from the trainer.
  B.deploy = function (side, hi, x, y, lead) {
    if (!this.canDeploy(side, hi)) return false;
    var s = this.sides[side];
    var id = s.hand[hi], sp = SP[id];
    var p = this.clampDeploy(side, x, y);
    s.energy -= sp.cost;
    s.capsules--;
    s.sent++;
    if (s.queue.length) { s.hand[hi] = s.queue.shift(); s.queue.push(id); } // tiny teams keep the card in hand
    var rec = { side: side, sp: id, alive: 0, done: false, units: [], xp: 0, evo: 0, kills: 0 };
    if (sp.cost >= 6) this.addHype(side, 5);
    s.records.push(rec);
    var th = {
      side: side, sp: id, rec: rec, x: p.x, y: p.y, t: 0, dur: R.throwTime,
      fx: R.W / 2 + (side === 0 ? 1.4 : -1.4), fy: side === 0 ? R.H + 1.6 : -1.6
    };
    this.throws.push(th);
    this.events.push({ k: 'throw', side: side, sp: id, x: p.x, y: p.y, th: th, lead: !!lead });
    return true;
  };

  B.spawnRecord = function (th) {
    var sp = SP[th.sp], n = sp.n;
    for (var i = 0; i < n; i++) {
      var ox = 0, oy = 0;
      if (n > 1) {
        var ang = (i / n) * TAU + 0.6;
        ox = Math.cos(ang) * 0.62; oy = Math.sin(ang) * 0.5;
      }
      var p = this.clampDeploy(th.side, th.x + ox, th.y + oy);
      var u = this.makeUnit(th.side, sp, p.x, p.y, th.rec);
      th.rec.units.push(u);
      th.rec.alive++;
      this.units.push(u);
    }
    this.events.push({ k: 'pop', side: th.side, sp: th.sp, x: th.x, y: th.y });
  };

  B.level = function (side, id) { var l = this.levels[side] && this.levels[side][id]; return l || 10; };
  B.makeUnit = function (side, sp, x, y, rec) {
    var lv = this.level(side, sp.id), m = CA.lvMult(lv);
    return {
      id: this.nextId++, side: side, sp: sp, rec: rec, lv: lv, lvm: m,
      x: x, y: y, r: sp.r, hp: sp.hp * m, maxHp: sp.hp * m, shield: 0, shieldT: 0,
      st: 'spawn', spawnT: R.spawnTime, born: this.t,
      cd: 0.15 + this.rng() * 0.2, wind: 0, windTarget: null, target: null, retT: 0,
      face: side === 0 ? 1 : -1, moving: false, mvx: 0, mvy: 0,
      slowT: 0, slowAmt: 0,
      leapCd: 0, leap: null, pounce: false,
      chargeT: 0, charging: false, healCd: 0.4, shieldCd: 0.6,
      veilT: 0, deadT: 0, z: 0, phase: this.rng() * 10,
      lastAtk: -9, lastHurt: -9, lastHeal: -9, lastShield: -9, lastEff: 0, cheer: false,
      dm: m, evo: 0, evolving: 0, lastMove: -9, boss: false, inBall: false, shiny: !!(this.shiny[side] && this.shiny[side][sp.id])
    };
  };

  B.alive = function (u) { return u.st === 'act' || u.st === 'spawn'; };
  B.targetable = function (u) { return this.alive(u) && u.veilT <= 0 && !u.leap && !(u.evolving > 0) && !u.inBall && !u.catching; };

  // ---- wild battles: a boss critter, minions rustling out of the grass, and capturing --------
  B.setupWild = function () {
    var w = this.wild, sp = SP[w.sp];
    this.sides[1].capsules = 0;
    this.sides[1].hand = []; this.sides[1].queue = [];
    var rec = { side: 1, sp: w.sp, alive: 1, done: false, units: [], xp: 0, evo: 0, kills: 0, boss: true };
    this.sides[1].records.push(rec);
    var u = this.makeUnit(1, sp, R.W / 2, 7, rec);
    var m = CA.lvMult(w.level);
    u.lv = w.level; u.lvm = m;
    var legend = sp.role === 'legend';
    u.boss = true; u.maxHp = u.hp = sp.hp * m * (legend ? R.legendHp : R.bossHp); u.dm = m * (legend ? R.legendDmg : R.bossDmg);
    u.shiny = !!w.shiny;
    u.r = Math.min(1.25, sp.r * 1.45);
    u.spawnT = 1.0;
    rec.units.push(u);
    this.units.push(u);
    this.boss = u;
    w.spawnT = 7; w.catchCd = 0; w.ball = null; w.tries = 0;
    this.events.push({ k: 'wild', u: u });
  };
  B.wildStep = function (dt) {
    var w = this.wild;
    if (w.catchCd > 0) w.catchCd -= dt;
    // minions rustle out of the grass from time to time
    w.spawnT -= dt;
    if (w.spawnT <= 0 && w.minions && w.minions.length) {
      w.spawnT = 10 + this.rng() * 5;
      var alive = 0;
      for (var i = 0; i < this.units.length; i++) { var x = this.units[i]; if (x.side === 1 && !x.boss && this.alive(x)) alive++; }
      if (alive < 4) {
        var id = w.minions[(this.rng() * w.minions.length) | 0], sp = SP[id];
        var px = 2 + this.rng() * (R.W - 4), py = 2 + this.rng() * 9;
        var rec = { side: 1, sp: id, alive: 0, done: false, units: [], xp: 0, evo: 0, kills: 0 };
        this.sides[1].records.push(rec);
        var n = Math.min(2, sp.n);
        for (var k = 0; k < n; k++) {
          var u = this.makeUnit(1, sp, px + k * 0.7, py + k * 0.4, rec);
          var m = CA.lvMult(w.minionLevel || w.level);
          u.lv = w.minionLevel || w.level; u.lvm = m; u.hp = u.maxHp = sp.hp * m; u.dm = m;
          rec.units.push(u); rec.alive++; this.units.push(u);
        }
        this.events.push({ k: 'rustle', x: px, y: py, sp: id });
      }
    }
    // a capsule in flight / wobbling
    var b = w.ball;
    if (b) {
      b.t += dt;
      if (b.phase === 'fly' && b.t >= 0.55) {
        if (!this.alive(this.boss) || this.boss.inBall) { w.ball = null; this.boss.catching = false; return; }
        b.phase = 'wobble'; b.t = 0; this.boss.inBall = true; this.boss.catching = false;
        b.x = this.boss.x; b.y = this.boss.y;
        this.events.push({ k: 'catchland', x: b.x, y: b.y });
      } else if (b.phase === 'wobble') {
        var n2 = Math.floor(b.t / 0.6);
        if (n2 > b.shakes) {
          b.shakes = n2;
          if (b.shakes > b.willShake) {
            // broke free
            this.boss.inBall = false; w.ball = null; w.catchCd = 2.5;
            this.events.push({ k: 'breakfree', u: this.boss });
          } else if (b.shakes >= 3 && b.success) {
            this.boss.st = 'dead'; this.boss.deadT = 9; this.boss.caught = true;
            b.phase = 'caught';
            this.events.push({ k: 'caught', u: this.boss, x: b.x, y: b.y });
            this.finish(0, 'caught');
          } else this.events.push({ k: 'wobble', n: b.shakes, x: b.x, y: b.y });
        }
      }
    }
  };
  B.catchChance = function () {
    var u = this.boss;
    if (!u) return 0;
    var f = u.hp / u.maxHp;
    return clamp(0.08 + (1 - f) * 0.92 + (u.slowT > 0 ? 0.08 : 0), 0.05, 0.96);
  };
  B.canCatch = function () {
    var w = this.wild;
    // with a bag (the overworld), throws come out of the bag instead of the battle's capsules
    return !!w && !this.over && this.boss && this.boss.st === 'act' && !this.boss.inBall && !w.ball && w.catchCd <= 0 && (w.bag || this.sides[0].capsules > 0);
  };
  B.throwCatch = function (bonus) {
    if (!this.canCatch()) return false;
    var w = this.wild, s = this.sides[0];
    if (!w.bag) s.capsules--;
    w.tries++;
    var p = clamp(this.catchChance() * (bonus || 1), 0, 0.98), ok = this.rng() < p;
    // like the classics, the number of wobbles hints at how close it was
    var shakes = ok ? 3 : p > 0.6 ? 2 : p > 0.3 ? 1 : 0;
    if (!ok && this.rng() < 0.4) shakes = Math.max(0, shakes - 1);
    w.ball = { phase: 'fly', t: 0, x: this.boss.x, y: this.boss.y, success: ok, willShake: ok ? 3 : shakes, shakes: 0 };
    // like the classics, the target freezes while the capsule is in the air
    this.boss.catching = true; this.boss.wind = 0; this.boss.leap = null; this.boss.moving = false;
    this.events.push({ k: 'catchthrow', x: this.boss.x, y: this.boss.y });
    return true;
  };

  // ---- crowd hype & boost ----------------------------------------------------------
  B.addHype = function (side, amt) {
    var s = this.sides[side];
    if (s.boostT > 0) return;
    s.hype = Math.min(R.hypeMax, s.hype + amt);
  };
  B.canBoost = function (side) { var s = this.sides[side]; return !this.over && s.hype >= R.hypeMax && s.boostT <= 0; };
  B.boost = function (side) {
    if (!this.canBoost(side)) return false;
    var s = this.sides[side];
    s.hype = 0; s.boostT = R.boostTime; s.boosts = (s.boosts || 0) + 1;
    this.events.push({ k: 'boost', side: side });
    return true;
  };

  // ---- evolution ------------------------------------------------------------------------
  B.evoReady = function (rec) { return !rec.evo && !rec.done && rec.alive > 0 && rec.xp >= CA.evoXp(SP[rec.sp]); };
  B.canEvolve = function (side, rec) {
    if (this.over || !rec || rec.side !== side || !this.evoReady(rec)) return false;
    for (var i = 0; i < rec.units.length; i++) if (rec.units[i].st === 'spawn') return false;
    return this.sides[side].energy >= CA.evoCost(SP[rec.sp]);
  };
  B.evolve = function (side, rec) {
    if (!this.canEvolve(side, rec)) return false;
    var s = this.sides[side];
    s.energy -= CA.evoCost(SP[rec.sp]);
    s.evos++;
    rec.evo = 1;
    for (var i = 0; i < rec.units.length; i++) {
      var u = rec.units[i];
      if (u.st !== 'act') continue;
      u.evolving = R.evoTime; u.leap = null; u.wind = 0; u.charging = false; u.moving = false;
    }
    this.events.push({ k: 'evolve', side: side, rec: rec });
    this.addHype(side, 12);
    return true;
  };
  B.finishEvolve = function (u) {
    var sp = u.sp;
    u.evolving = 0; u.evo = 1;
    // keeps its health fraction and heals a quarter on top
    var frac = Math.min(1, u.hp / u.maxHp + 0.25);
    u.maxHp = sp.hp * u.lvm * R.evoHp; u.hp = u.maxHp * frac;
    u.dm = u.lvm * R.evoDmg; u.r = sp.r * R.evoSize;
    u.slowT = 0;
    this.events.push({ k: 'evolved', u: u });
  };

  // ---------------------------------------------------------------------------
  B.step = function (dt) {
    if (this.over) {
      // victory lap: survivors keep animating
      this.t += dt;
      for (var k = this.units.length - 1; k >= 0; k--) {
        var du = this.units[k];
        if (du.st === 'dead') { du.deadT += dt; if (du.deadT > 1.4) this.units.splice(k, 1); }
      }
      return;
    }
    this.t += dt;

    // clock
    this.time -= dt;
    if (this.time <= 0) {
      if (!this.overtime) {
        var a = this.sides[0].ko, b = this.sides[1].ko;
        if (a !== b) { this.finish(a > b ? 0 : 1, 'time'); return; }
        this.overtime = true;
        this.time = R.overtime;
        this.events.push({ k: 'overtime' });
      } else {
        this.finish(-1, 'time'); return;
      }
    }
    if (!this.overtime && this.time <= R.doubleAt && this.time + dt > R.doubleAt) this.events.push({ k: 'double' });

    var rate = this.energyRate();
    for (var si = 0; si < 2; si++) {
      var s = this.sides[si];
      s.energy = Math.min(R.energyMax, s.energy + dt * rate * this.emult[si] / R.energyRegen);
      if (s.boostT > 0) { s.boostT -= dt; if (s.boostT <= 0) { s.boostT = 0; this.events.push({ k: 'boostEnd', side: si }); } }
      else this.addHype(si, dt * 0.6);
    }

    // capsules in flight
    for (var i = this.throws.length - 1; i >= 0; i--) {
      var th = this.throws[i];
      th.t += dt;
      if (th.t >= th.dur) { this.throws.splice(i, 1); this.spawnRecord(th); }
    }

    if (this.wild) this.wildStep(dt);
    var units = this.units;
    for (i = 0; i < units.length; i++) this.updateUnit(units[i], dt);
    this.separate();
    this.updateProjs(dt);

    for (i = units.length - 1; i >= 0; i--) {
      var u = units[i];
      if (u.st === 'dead') { u.deadT += dt; if (u.deadT > 1.4) units.splice(i, 1); }
    }
    this.checkEnd();
  };

  B.finish = function (winner, reason) {
    if (this.over) return;
    this.over = true;
    this.winner = winner;
    this.endReason = reason;
    for (var i = 0; i < this.units.length; i++) {
      var u = this.units[i];
      if (this.alive(u) && u.side === winner) u.cheer = true;
    }
    this.events.push({ k: 'end', winner: winner, reason: reason });
  };

  B.sideOut = function (side) {
    if (this.sides[side].capsules > 0) return false;
    for (var i = 0; i < this.throws.length; i++) if (this.throws[i].side === side) return false;
    for (i = 0; i < this.units.length; i++) { var u = this.units[i]; if (u.side === side && this.alive(u)) return false; }
    return true;
  };

  B.checkEnd = function () {
    if (this.over) return;
    if (this.wild) {
      if (this.boss.st === 'dead' && !this.boss.caught) { this.finish(0, 'wildko'); return; }
      if (this.sideOut(0) && !this.wild.ball) this.finish(1, 'wipe');
      return;
    }
    var o0 = this.sideOut(0), o1 = this.sideOut(1);
    if (o0 && o1) this.finish(-1, 'wipe');
    else if (o0) this.finish(1, 'wipe');
    else if (o1) this.finish(0, 'wipe');
  };

  // ---------------------------------------------------------------------------
  B.chooseTarget = function (u) {
    var sp = u.sp, best = null, bd = 1e9, i, e, d;
    var units = this.units;
    if (sp.hunter) {
      // hunt fragile backliners first
      for (i = 0; i < units.length; i++) {
        e = units[i];
        if (e.side === u.side || !this.targetable(e)) continue;
        var role = e.sp.role;
        var soft = role === 'ranged' || role === 'splash' || role === 'support' || role === 'legend';
        d = gap(u, e) - (soft ? 6 : 0) + e.hp / 900;
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    }
    // taunting tanks pull aggro
    var tb = null, tbd = 1e9;
    for (i = 0; i < units.length; i++) {
      e = units[i];
      if (e.side === u.side || !this.targetable(e)) continue;
      d = gap(u, e);
      if (e.sp.taunt && d <= e.sp.taunt + e.evo * 0.3 && d < tbd) { tbd = d; tb = e; }
      if (d < bd) { bd = d; best = e; }
    }
    if (tb) return tb;
    // stickiness: keep the current target unless something is clearly closer
    if (u.target && this.targetable(u.target) && best !== u.target) {
      if (gap(u, u.target) < bd + 1.2) return u.target;
    }
    return best;
  };

  B.moveToward = function (u, tx, ty, spd, dt, stopAt) {
    var dx = tx - u.x, dy = ty - u.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d <= (stopAt || 0.05)) { u.moving = false; return; }
    var step = Math.min(d, spd * dt);
    u.mvx = dx / d; u.mvy = dy / d;
    u.x += u.mvx * step; u.y += u.mvy * step;
    u.moving = true;
    if (Math.abs(dx) > 0.05) u.face = dx > 0 ? 1 : -1;
  };

  B.updateUnit = function (u, dt) {
    if (u.st === 'dead' || u.inBall || u.catching) return;
    var sp = u.sp;
    if (u.st === 'spawn') {
      u.spawnT -= dt;
      if (u.spawnT <= 0) {
        u.st = 'act';
        if (sp.veil) u.veilT = sp.veil;
        this.events.push({ k: 'ready', u: u });
      }
      return;
    }
    if (u.evolving > 0) {
      u.evolving -= dt; u.moving = false;
      if (u.evolving <= 0) this.finishEvolve(u);
      return;
    }
    u.rec.xp += dt * 9 / sp.n;
    var boosted = this.sides[u.side].boostT > 0;
    var slowMul = (u.slowT > 0 ? 1 - u.slowAmt : 1) * (boosted ? R.boostHaste : 1);
    if (u.slowT > 0) u.slowT -= dt;
    u.cd -= dt * slowMul;
    if (u.shieldT > 0) { u.shieldT -= dt; if (u.shieldT <= 0) u.shield = 0; }
    if (u.veilT > 0) u.veilT -= dt;
    if (u.leapCd > 0) u.leapCd -= dt;

    // mid-leap
    if (u.leap) {
      var L = u.leap;
      L.t += dt;
      var k = Math.min(1, L.t / L.dur);
      u.x = L.x0 + (L.x1 - L.x0) * k;
      u.y = L.y0 + (L.y1 - L.y0) * k;
      u.z = Math.sin(k * Math.PI) * 1.6;
      if (k >= 1) { u.leap = null; u.z = 0; u.pounce = true; u.cd = 0; this.events.push({ k: 'land', u: u }); }
      return;
    }

    // support abilities
    if (sp.heal) {
      u.healCd -= dt;
      if (u.healCd <= 0) {
        var hb = null, hp = 0.985;
        for (var i = 0; i < this.units.length; i++) {
          var a = this.units[i];
          if (a.side !== u.side || a.st !== 'act') continue;
          if (gap(u, a) > sp.healRange) continue;
          var f = a.hp / a.maxHp;
          if (f < hp) { hp = f; hb = a; }
        }
        if (hb) {
          var amt = Math.min(sp.heal * u.dm, hb.maxHp - hb.hp);
          hb.hp += amt; hb.lastHeal = this.t; u.lastAtk = this.t;
          this.events.push({ k: 'heal', from: u, to: hb, amt: amt });
          u.healCd = sp.healRate;
        } else u.healCd = 0.25;
      }
    }
    if (sp.shield) {
      u.shieldCd -= dt;
      if (u.shieldCd <= 0) {
        var cands = [];
        for (i = 0; i < this.units.length; i++) {
          a = this.units[i];
          if (a.side !== u.side || a.st !== 'act' || a.shield > 0) continue;
          if (gap(u, a) > sp.shieldRange) continue;
          cands.push(a);
        }
        if (cands.length && this.hasFoes(u.side)) {
          cands.sort(function (p, q) { return p.hp / p.maxHp - q.hp / q.maxHp; });
          for (i = 0; i < Math.min(sp.shieldN, cands.length); i++) {
            cands[i].shield = sp.shield * u.dm; cands[i].shieldT = 7; cands[i].lastShield = this.t;
            this.events.push({ k: 'shield', from: u, to: cands[i] });
          }
          u.lastAtk = this.t;
          u.shieldCd = sp.shieldRate;
        } else u.shieldCd = 0.3;
      }
    }

    // targeting
    u.retT -= dt;
    if (u.retT <= 0 || !u.target || !this.targetable(u.target)) {
      u.target = this.chooseTarget(u);
      u.retT = 0.25;
    }
    var t = u.target;

    // attack wind-up in progress
    if (u.wind > 0) {
      u.wind -= dt * slowMul;
      u.moving = false;
      if (u.wind <= 0) this.release(u);
      return;
    }

    var spd = sp.spd * (u.slowT > 0 ? 1 - u.slowAmt : 1) * (boosted ? R.boostSpeed : 1);
    if (!t) {
      u.charging = false; u.chargeT = 0;
      this.idleMove(u, spd, dt);
      return;
    }

    var g = gap(u, t);
    // assassins pounce over the front line
    if (sp.leap && u.leapCd <= 0 && g > 1.4 && g < sp.leap.range) {
      var dx = u.x - t.x, dy = u.y - t.y, dd = Math.sqrt(dx * dx + dy * dy) || 1;
      var off = t.r + u.r + 0.15;
      u.leap = { t: 0, dur: 0.5, x0: u.x, y0: u.y, x1: t.x + dx / dd * off, y1: t.y + dy / dd * off };
      u.leapCd = sp.leap.cd;
      u.face = t.x > u.x ? 1 : -1;
      u.veilT = 0;
      this.events.push({ k: 'leap', u: u });
      return;
    }

    // supports hang back behind their front line
    if (sp.role === 'support' && g > sp.range) {
      var anchor = this.frontAlly(u);
      if (anchor) {
        var back = u.side === 0 ? 2.2 : -2.2;
        this.moveToward(u, anchor.x + (u.x > anchor.x ? 0.8 : -0.8), anchor.y + back, spd, dt, 0.4);
        return;
      }
    }

    if (g > sp.range) {
      if (sp.charge) {
        if (g > sp.charge.min || u.charging) {
          u.chargeT += dt;
          if (u.chargeT > sp.charge.delay && !u.charging) { u.charging = true; this.events.push({ k: 'charge', u: u }); }
        }
        if (u.charging) spd = sp.charge.spd * slowMul;
      }
      this.moveToward(u, t.x, t.y, spd, dt, 0);
      return;
    }

    // in range: attack
    u.moving = false;
    if (Math.abs(t.x - u.x) > 0.05) u.face = t.x > u.x ? 1 : -1;
    if (u.cd <= 0) {
      u.cd = sp.rate;
      u.wind = sp.atk === 'beam' ? 0.55 : sp.atk === 'cone' ? 0.35 : sp.atk === 'melee' ? 0.2 : 0.25;
      u.windTarget = t;
      u.lastAtk = this.t;
      u.veilT = 0;
      if (sp.atk === 'beam') this.events.push({ k: 'charging', u: u });
    }
  };

  B.hasFoes = function (side) {
    for (var i = 0; i < this.units.length; i++) { var e = this.units[i]; if (e.side !== side && this.alive(e)) return true; }
    return false;
  };

  B.frontAlly = function (u) {
    var best = null, bv = -1e9;
    for (var i = 0; i < this.units.length; i++) {
      var a = this.units[i];
      if (a === u || a.side !== u.side || a.st !== 'act' || a.sp.role === 'support') continue;
      var v = u.side === 0 ? -a.y : a.y; // furthest forward
      v -= dist(u, a) * 0.15;
      if (v > bv) { bv = v; best = a; }
    }
    return best;
  };

  B.idleMove = function (u, spd, dt) {
    // no foes on the field: advance to a rally line just past the centre and wait there
    var ry = u.side === 0 ? R.MID - 3 : R.MID + 3;
    if (u.sp.role === 'support' || u.sp.role === 'ranged') ry += u.side === 0 ? 2.5 : -2.5;
    var rx = clamp(u.x, 2, R.W - 2);
    if (Math.abs(u.y - ry) > 0.3) this.moveToward(u, rx, ry, spd * 0.8, dt, 0.3);
    else u.moving = false;
  };

  // the attack lands / is released
  B.release = function (u) {
    var t = u.windTarget, sp = u.sp;
    u.windTarget = null;
    if (!t || !this.alive(t)) return;
    var mult = 1;
    if (u.pounce) { mult *= sp.leap.mult; u.pounce = false; }
    if (u.charging) { mult *= sp.charge.mult; }
    var dmg = sp.dmg * mult * u.dm;
    var i, e;
    switch (sp.atk) {
      case 'melee':
        if (gap(u, t) > sp.range + 0.6) { u.charging = false; u.chargeT = 0; return; }
        this.damage(u, t, dmg, true);
        if (u.charging) {
          var dx = t.x - u.x, dy = t.y - u.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
          var kb = 1.1 * Math.min(1, (u.r * u.r) / (t.r * t.r));
          t.x = clamp(t.x + dx / d * kb, t.r, R.W - t.r); t.y = clamp(t.y + dy / d * kb, t.r, R.H - t.r);
          this.events.push({ k: 'bash', u: u, t: t });
        }
        u.charging = false; u.chargeT = 0;
        break;
      case 'proj':
      case 'spore':
        this.projs.push({
          kind: sp.atk === 'spore' ? 'spore' : sp.proj, side: u.side, src: u, target: sp.atk === 'spore' ? null : t,
          x: u.x, y: u.y, z: sp.fly ? 1.2 : 0.6, sx: u.x, sy: u.y, tx: t.x, ty: t.y, spd: sp.pspd,
          dmg: dmg, type: sp.type, splash: sp.splash * (u.evo ? 1.15 : 1), slow: sp.slow || 0, slowT: (sp.slowT || 0) * (u.evo ? 1.3 : 1), t: 0
        });
        this.events.push({ k: 'shoot', u: u, kind: sp.proj || 'spore' });
        break;
      case 'chain':
        var hit = [t], pts = [{ x: u.x, y: u.y }, { x: t.x, y: t.y }];
        this.damage(u, t, dmg, false);
        var last = t;
        for (var c = 0; c < sp.chain + u.evo; c++) {
          var nb = null, nd = sp.chainRange;
          for (i = 0; i < this.units.length; i++) {
            e = this.units[i];
            if (e.side === u.side || !this.targetable(e) || hit.indexOf(e) >= 0) continue;
            var gd = gap(last, e);
            if (gd < nd) { nd = gd; nb = e; }
          }
          if (!nb) break;
          hit.push(nb); pts.push({ x: nb.x, y: nb.y });
          this.damage(u, nb, dmg * Math.pow(0.75, c + 1), false);
          last = nb;
        }
        this.events.push({ k: 'chain', u: u, pts: pts });
        break;
      case 'cone':
        var ax = t.x - u.x, ay = t.y - u.y, al = Math.sqrt(ax * ax + ay * ay) || 1;
        ax /= al; ay /= al;
        var reach = sp.range + u.r + 0.6, half = sp.cone / 2;
        for (i = 0; i < this.units.length; i++) {
          e = this.units[i];
          if (e.side === u.side || !this.targetable(e)) continue;
          var ex = e.x - u.x, ey = e.y - u.y, el = Math.sqrt(ex * ex + ey * ey);
          if (el - e.r > reach) continue;
          var cos = el > 0.01 ? (ex * ax + ey * ay) / el : 1;
          var ang = Math.acos(clamp(cos, -1, 1));
          if (ang <= half + Math.atan2(e.r, Math.max(el, 0.01)) || e === t) this.damage(u, e, dmg, false);
        }
        this.events.push({ k: 'cone', u: u, ax: ax, ay: ay, reach: reach, half: half });
        break;
      case 'beam':
        var bx = t.x - u.x, by = t.y - u.y, bl = Math.sqrt(bx * bx + by * by) || 1;
        bx /= bl; by /= bl;
        var len = sp.range + u.r + 1.2;
        for (i = 0; i < this.units.length; i++) {
          e = this.units[i];
          if (e.side === u.side || !this.targetable(e)) continue;
          var px = e.x - u.x, py = e.y - u.y;
          var along = px * bx + py * by;
          if (along < -e.r || along > len + e.r) continue;
          var perp = Math.abs(px * by - py * bx);
          if (perp <= sp.beamW / 2 + e.r || e === t) this.damage(u, e, dmg, false);
        }
        this.events.push({ k: 'beam', u: u, x0: u.x, y0: u.y, x1: u.x + bx * len, y1: u.y + by * len });
        break;
    }
  };

  B.updateProjs = function (dt) {
    for (var i = this.projs.length - 1; i >= 0; i--) {
      var p = this.projs[i];
      p.t += dt;
      if (p.target && this.alive(p.target)) { p.tx = p.target.x; p.ty = p.target.y; }
      var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy);
      var step = p.spd * dt;
      if (d <= step + 0.05) {
        this.projs.splice(i, 1);
        this.impact(p);
      } else {
        p.x += dx / d * step; p.y += dy / d * step;
      }
    }
  };

  B.impact = function (p) {
    if (p.splash) {
      for (var i = 0; i < this.units.length; i++) {
        var e = this.units[i];
        if (e.side === p.side || !this.targetable(e)) continue;
        var dx = e.x - p.tx, dy = e.y - p.ty;
        if (Math.sqrt(dx * dx + dy * dy) - e.r <= p.splash) {
          this.damage(p.src, e, p.dmg, false, p.type);
          if (p.slow && this.alive(e)) { e.slowT = p.slowT; e.slowAmt = p.slow; }
        }
      }
      this.events.push({ k: 'burst', kind: p.kind, x: p.tx, y: p.ty, r: p.splash, side: p.side });
    } else {
      if (p.target && this.alive(p.target)) this.damage(p.src, p.target, p.dmg, false, p.type);
      this.events.push({ k: 'pop2', kind: p.kind, x: p.tx, y: p.ty, side: p.side });
    }
  };

  B.damage = function (src, t, dmg, melee, typeOverride) {
    if (!this.alive(t) || t.evolving > 0 || t.inBall || t.catching) return;
    var atype = typeOverride || src.sp.type;
    var mult = CA.typeMult(atype, t.sp.type);
    var d = dmg * mult * (1 - (t.sp.armor ? t.sp.armor + t.evo * 0.08 : 0));
    var absorbed = 0;
    if (t.shield > 0) {
      absorbed = Math.min(t.shield, d);
      t.shield -= absorbed; d -= absorbed;
      if (t.shield <= 0) { t.shield = 0; this.events.push({ k: 'unshield', u: t }); }
    }
    t.hp -= d;
    t.lastHurt = this.t;
    t.lastEff = mult > 1 ? 1 : mult < 1 ? -1 : 0;
    this.sides[src.side].dmgDealt += d;
    src.rec.xp += d + absorbed; t.rec.xp += (d + absorbed) * 0.5;
    if (mult > 1) this.addHype(src.side, 1.2);
    this.events.push({ k: 'hit', u: t, src: src, dmg: d + absorbed, shielded: absorbed > 0 && d <= 0, eff: t.lastEff, melee: melee });
    if (melee && t.sp.thorns && this.alive(src)) {
      var back = (d + absorbed) * t.sp.thorns;
      src.hp -= back; src.lastHurt = this.t;
      this.events.push({ k: 'thorn', u: src, dmg: back });
      if (src.hp <= 0) this.kill(src, t);
    }
    if (t.hp <= 0) this.kill(t, src);
  };

  B.kill = function (u, by) {
    if (u.st === 'dead') return;
    if (by && by.rec) by.rec.kills++;
    u.st = 'dead'; u.deadT = 0; u.hp = 0; u.leap = null; u.z = 0;
    var rec = u.rec;
    rec.alive--;
    this.events.push({ k: 'faint', u: u });
    if (rec.alive <= 0 && !rec.done) {
      rec.done = true;
      var other = this.sides[1 - u.side];
      other.ko++;
      this.addHype(1 - u.side, 22);
      this.events.push({ k: 'ko', side: u.side, sp: rec.sp, evo: rec.evo });
      if (this.overtime && this.sides[0].ko !== this.sides[1].ko) {
        this.finish(this.sides[0].ko > this.sides[1].ko ? 0 : 1, 'sudden');
      }
    }
  };

  // simple circle separation, ground and air layers apart
  B.separate = function () {
    var us = this.units, n = us.length;
    for (var it = 0; it < 2; it++) {
      for (var i = 0; i < n; i++) {
        var a = us[i];
        if (a.st === 'dead' || a.leap || a.inBall) continue;
        for (var j = i + 1; j < n; j++) {
          var b = us[j];
          if (b.st === 'dead' || b.leap || b.inBall || !!a.sp.fly !== !!b.sp.fly) continue;
          var dx = b.x - a.x, dy = b.y - a.y;
          var min = (a.r + b.r) * 1.25;
          var d2 = dx * dx + dy * dy;
          if (d2 >= min * min) continue;
          var d = Math.sqrt(d2);
          if (d < 0.001) { dx = (this.rng() - 0.5) * 0.1; dy = (this.rng() - 0.5) * 0.1; d = Math.sqrt(dx * dx + dy * dy); }
          var over = (min - d) * 0.5;
          var ma = a.r * a.r * (a.st === 'spawn' ? 4 : 1), mb = b.r * b.r * (b.st === 'spawn' ? 4 : 1);
          var ka = mb / (ma + mb), kb = ma / (ma + mb);
          var nx = dx / d, ny = dy / d;
          a.x -= nx * over * 2 * ka; a.y -= ny * over * 2 * ka;
          b.x += nx * over * 2 * kb; b.y += ny * over * 2 * kb;
        }
      }
    }
    for (i = 0; i < n; i++) {
      var u = us[i];
      u.x = clamp(u.x, u.r * 0.8, R.W - u.r * 0.8);
      u.y = clamp(u.y, u.r * 0.8, R.H - u.r * 0.8);
    }
  };

  // ===========================================================================
  // Trainer AI. Plays by exactly the same rules as the player (energy, capsules, hand).
  var ROLE_M = {
    //          tank brawl range splash supp assas swarm legend
    tank:     [0.0, 0.8, -0.3, 0.3, 0.0, 1.0, -0.8, 0.2],
    brawler:  [0.2, 0.0, 0.8, 0.6, 0.8, 0.8, -0.2, 0.0],
    ranged:   [1.0, 0.3, 0.0, 0.2, 0.5, -0.6, 0.0, 0.6],
    splash:   [0.3, 0.3, 0.3, 0.0, 0.3, 0.0, 1.6, 0.2],
    support:  [0.2, 0.2, 0.0, 0.0, 0.0, -0.5, 0.0, 0.2],
    assassin: [-0.6, -0.3, 1.5, 1.2, 1.5, 0.0, -0.6, 0.4],
    swarm:    [1.2, 0.2, 0.6, -1.0, 0.6, 0.3, 0.0, 1.2],
    legend:   [0.8, 0.8, 0.6, 0.5, 0.6, 0.5, 0.6, 0.3]
  };
  var ROLE_I = { tank: 0, brawler: 1, ranged: 2, splash: 3, support: 4, assassin: 5, swarm: 6, legend: 7 };

  function AI(battle, side, skill) {
    this.b = battle; this.side = side; this.skill = skill;
    this.think = 1.0 + (1 - skill) * 1.5;
    this.reaction = 1.7 - skill * 1.3;
  }
  CA.AI = AI;

  // y measured from this AI's own back line (0) toward the enemy's back line (30)
  AI.prototype.py = function (y) { return this.side === 1 ? y : R.H - y; };
  AI.prototype.toY = function (py) { return this.side === 1 ? py : R.H - py; };

  AI.prototype.update = function (dt) {
    var b = this.b;
    if (b.over) return;
    this.think -= dt;
    if (this.think > 0) return;
    this.think = this.reaction * (0.6 + 0.8 * b.rng());
    var me = b.sides[this.side];

    var foes = [], mine = [], i, u;
    for (i = 0; i < b.units.length; i++) {
      u = b.units[i];
      if (!b.alive(u)) continue;
      (u.side === this.side ? mine : foes).push(u);
    }
    var inFlight = 0;
    for (i = 0; i < b.throws.length; i++) if (b.throws[i].side === this.side) inFlight++;

    // threat: foes weighted by how deep they are into our half
    var threat = 0, tx = 0, tpy = 0, tw = 0;
    for (i = 0; i < foes.length; i++) {
      var f = foes[i], fpy = this.py(f.y);
      var w = f.sp.cost * (f.hp / f.maxHp) / f.sp.n * (fpy < 15 ? 1.6 : fpy < 20 ? 1.0 : 0.5);
      threat += w; tx += f.x * w; tpy += fpy * w; tw += w;
    }
    var defense = 0;
    for (i = 0; i < mine.length; i++) defense += mine[i].sp.cost * (mine[i].hp / mine[i].maxHp) / mine[i].sp.n;
    defense += inFlight * 3;
    var center = tw > 0 ? { x: tx / tw, py: tpy / tw } : null;
    var calm = foes.length === 0 || (center && center.py > 20 && threat < 4);

    // crowd boost: unleash it while our critters are in the thick of a fight
    var engaged = 0;
    for (i = 0; i < mine.length; i++) {
      u = mine[i];
      if (u.target && b.alive(u.target) && Math.sqrt((u.x - u.target.x) * (u.x - u.target.x) + (u.y - u.target.y) * (u.y - u.target.y)) - u.r - u.target.r < u.sp.range + 1.5) engaged += u.sp.cost / u.sp.n;
    }
    if (b.canBoost(this.side) && (engaged >= 6 - this.skill * 2 || (this.skill < 0.3 && b.rng() < 0.3 && engaged > 0))) { b.boost(this.side); return; }

    // evolution: often better value than a fresh capsule, especially mid-fight
    var evoBest = null, evoScore = -9;
    for (i = 0; i < me.records.length; i++) {
      var rec = me.records[i];
      if (!b.evoReady(rec)) continue;
      var rsp = SP[rec.sp], hpf = 0, eng = 0, n = 0;
      for (var k = 0; k < rec.units.length; k++) {
        var ru = rec.units[k];
        if (ru.st !== 'act') continue;
        n++; hpf += ru.hp / ru.maxHp;
        if (ru.target && b.alive(ru.target)) eng = 1;
      }
      if (!n) continue;
      hpf /= n;
      var es = 1.0 + rsp.cost * 0.35 + (eng ? 1.4 : -0.6) + (1 - hpf) * 2.2 + this.skill * 0.6;
      if (es > evoScore) { evoScore = es; evoBest = rec; }
    }
    if (me.capsules <= 0) {
      if (evoBest && b.canEvolve(this.side, evoBest)) b.evolve(this.side, evoBest);
      return;
    }

    var best = null, waitFor = null;
    for (var hi = 0; hi < me.hand.length; hi++) {
      var id = me.hand[hi], sp = SP[id];
      var sc = this.score(sp, foes, mine, threat, defense, calm, me);
      sc += (b.rng() - 0.5) * (1 - this.skill) * 5;
      var opt = { hi: hi, sp: sp, score: sc };
      if (me.energy >= sp.cost) { if (!best || sc > best.score) best = opt; }
      else if (!waitFor || sc > waitFor.score) waitFor = opt;
    }
    // a smart trainer saves up for a clearly better card when not under pressure
    if (waitFor && this.skill > 0.45 && threat <= defense + 2 && waitFor.sp.cost - me.energy < 2.2 &&
        (!best || waitFor.score > best.score + 1.2)) return;
    if (evoBest && this.skill > 0.15 && evoScore > (best ? best.score : -1) + 0.5) {
      if (b.canEvolve(this.side, evoBest)) b.evolve(this.side, evoBest);
      return; // save up for the evolution
    }
    if (!best) return;

    var threshold = calm ? this.skill * 2.2 : -0.5;
    if (calm && me.energy >= 9.6) threshold = -5;
    if (calm && mine.length + inFlight >= 3 && me.energy < 8) threshold += 2;
    if (best.score < threshold) return;

    var pos = this.place(best.sp, foes, mine, center, calm);
    b.deploy(this.side, best.hi, pos.x, pos.y);
  };

  // the opening send-out: a sturdy lead in a random lane, keeping energy for follow-ups
  AI.prototype.pickLead = function () {
    var b = this.b, me = b.sides[this.side], best = 0, bs = -99;
    for (var hi = 0; hi < me.hand.length; hi++) {
      var sp = SP[me.hand[hi]];
      if (sp.cost > me.energy) continue;
      var r = sp.role;
      var sc = (r === 'tank' ? 2.2 : r === 'brawler' ? 2 : r === 'swarm' ? 1.2 : r === 'legend' ? 1.5 : r === 'support' ? -1 : 0.6);
      sc -= Math.max(0, sp.cost - 5) * 0.8 * this.skill;
      sc += (b.rng() - 0.5) * (2.5 - this.skill * 2);
      if (sc > bs) { bs = sc; best = hi; }
    }
    var x = [4.5, 9, 13.5][(b.rng() * 3) | 0] + (b.rng() - 0.5) * 2;
    return { hi: best, x: x, y: this.toY(6 + b.rng() * 5) };
  };

  AI.prototype.score = function (sp, foes, mine, threat, defense, calm, me) {
    var s = 0, i;
    var ri = ROLE_I[sp.role];
    var cw = 0, cv = 0;
    for (i = 0; i < foes.length; i++) {
      var f = foes[i];
      var w = f.sp.cost * (f.hp / f.maxHp) / f.sp.n * (this.py(f.y) < 16 ? 1.5 : 1);
      var m = ROLE_M[sp.role][ROLE_I[f.sp.role]];
      m += (CA.typeMult(sp.type, f.sp.type) - 1) * 2.0 * this.skill;
      m -= (CA.typeMult(f.sp.type, sp.type) - 1) * 1.4 * this.skill;
      cv += w * m; cw += w;
    }
    if (cw > 0) s += (cv / cw) * 3 * Math.min(1, cw / 4) * (0.4 + this.skill);

    // urgency: we're losing the fight in our half
    if (threat > defense) s += Math.min(3, (threat - defense) * 0.5) * (sp.role === 'support' ? 0.2 : 1);

    var hasFront = false, frontCount = 0, supCount = 0;
    for (i = 0; i < mine.length; i++) {
      var r = mine[i].sp.role;
      if (r === 'tank' || r === 'brawler' || r === 'legend') { hasFront = true; frontCount++; }
      if (r === 'support') supCount++;
    }
    if (sp.role === 'ranged' || sp.role === 'splash' || sp.role === 'support' || sp.role === 'legend') s += hasFront ? 1.4 * this.skill + 0.3 : -0.4;
    if ((sp.role === 'tank' || sp.role === 'brawler') && !hasFront) s += 1.1;
    if (sp.role === 'support' && mine.length === 0) s -= 2.5;
    if (sp.role === 'support' && supCount > 0) s -= 1.0;
    if (sp.role === 'assassin') {
      var soft = 0;
      for (i = 0; i < foes.length; i++) { var fr = foes[i].sp.role; if (fr === 'ranged' || fr === 'splash' || fr === 'support') soft++; }
      s += soft ? 1.2 : -0.8;
    }
    if (calm && (sp.role === 'tank' || sp.role === 'legend') && me.energy >= sp.cost + 1) s += 1.2 * this.skill;

    // capsules are scarce late: favour value per capsule
    var scarcity = 1 - me.capsules / R.capsules;
    s += (sp.cost - 3.5) * 0.5 * scarcity * (0.5 + this.skill);
    if (me.energy >= 9.5) s += 1.5;
    return s;
  };

  AI.prototype.place = function (sp, foes, mine, center, calm) {
    var b = this.b, rng = b.rng, sk = this.skill;
    var zMin = 1.2, zMax = 13.5;
    var x, py, i;
    var role = sp.role;
    var front = null, fv = -1;
    for (i = 0; i < mine.length; i++) {
      var r = mine[i].sp.role;
      if (r !== 'tank' && r !== 'brawler' && r !== 'legend') continue;
      var mpy = this.py(mine[i].y);
      if (mpy > fv) { fv = mpy; front = mine[i]; }
    }
    if (role === 'assassin') {
      // stand at our front edge in the lane of their softest backliner
      var tgt = null, td = 1e9;
      for (i = 0; i < foes.length; i++) {
        var f = foes[i], fr = f.sp.role;
        var soft = fr === 'ranged' || fr === 'splash' || fr === 'support' || fr === 'legend';
        var d = Math.abs(this.py(f.y) - 13) + (soft ? 0 : 8);
        if (d < td) { td = d; tgt = f; }
      }
      x = tgt ? tgt.x : 9; py = tgt ? Math.min(zMax, this.py(tgt.y) - 4) : zMax;
    } else if (role === 'tank' || role === 'brawler' || role === 'swarm') {
      if (center && !calm) {
        x = center.x;
        if (center.py < zMax + 1) py = center.py - (role === 'swarm' ? 0.2 : 1.2);
        else py = zMax;
      } else {
        x = rng() < 0.5 ? 4.5 + rng() * 2 : 11.5 + rng() * 2;
        if (rng() < 0.3) x = 9;
        py = role === 'tank' && sk > 0.4 ? 3 + rng() * 2 : 8 + rng() * 4;
      }
    } else {
      // ranged, splash, support, legend: shelter behind a front-liner
      if (front && this.py(front.y) < 18) {
        x = front.x + (rng() - 0.5) * 2;
        py = this.py(front.y) - (role === 'support' ? 2 : 2.8);
      } else if (center && !calm) {
        x = center.x + (rng() - 0.5) * 3;
        py = center.py - Math.min(sp.range, 5) - 0.8;
      } else {
        x = 7 + rng() * 4;
        py = 2.5 + rng() * 2;
      }
    }
    // sloppy trainers misplace
    var jit = (1 - sk) * 3.2;
    x += (rng() - 0.5) * jit; py += (rng() - 0.5) * jit;
    x = clamp(x, 1, R.W - 1);
    py = clamp(py, zMin, zMax);
    return { x: x, y: this.toY(py) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
