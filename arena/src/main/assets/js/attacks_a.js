'use strict';
// ---------- unique attack animations, part A: Fire, Water, Leaf, Spark, Stone ----------
// Each entry: { dur, at, pose(u,k), start(G,u,tg), tick(G,u,k,dt), fire(G,u,tg), commit }
//   pose  = body motion over the attack (k is 0..1)
//   start = the wind-up, called as the attack begins
//   tick  = per-frame emitter while the attack plays
//   fire  = called once at k >= at; the move itself, its effect and its damage
//   commit = the dash really moves the creature
// Every move is layered: a wind-up, the signature effect, an element-flavoured impact, and a mark left behind.

// true once every `period` seconds for this creature (rate-limits per-frame emitters)
function every(u, dt, period) { u.fxAcc = (u.fxAcc || 0) + dt; if (u.fxAcc >= period) { u.fxAcc = 0; return true; } return false; }

// a small flame left burning on the grass
function groundFlame(fx, x, y, s) {
  s = s || 1; const ph = rnd(TAU);
  fx.add({ dur: .8, draw(ctx, k) {
    const h = (k < .15 ? k / .15 : 1 - Ease.seg(k, .4, 1)) * 9 * s, wob = Math.sin(k * 30 + ph) * 1.4;
    halo(ctx, x, y - 3, 9 * s, '#ff8a2a', .5 * (1 - k)); ctx.translate(x, y);
    for (const q of [[1, '#ff5a2a'], [.55, '#ffd23d']]) {
      const w2 = q[0];
      ctx.beginPath(); ctx.moveTo(-3 * s * w2, 0); ctx.quadraticCurveTo(-3.4 * s * w2, -h * .5, wob * w2, -h * w2 - 1); ctx.quadraticCurveTo(3.4 * s * w2, -h * .5, 3 * s * w2, 0); ctx.closePath();
      ctx.fillStyle = q[1]; ctx.fill();
    }
  } });
}
// ink that runs down from a splat
function inkDrips(fx, x, y, col) {
  for (let i = 0; i < 3; i++) {
    const dx = rnd(-6, 6), len = rnd(7, 13);
    fx.add({ dur: .85, delay: .08, draw(ctx, k) {
      const l = len * Ease.outCubic(Math.min(1, k * 1.6));
      ctx.globalAlpha = k > .6 ? 1 - (k - .6) / .4 : 1; ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + dx, y + 2); ctx.lineTo(x + dx, y + 2 + l); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + dx, y + 2 + l, 1.8, 0, TAU); ctx.fill();
    } });
  }
}
// the hole a burrower leaves behind
function burrowHole(fx, x, y) {
  fx.add({ dur: 1.6, ground: true, draw(ctx, k) {
    ctx.globalAlpha = k < .08 ? k / .08 : 1 - Ease.seg(k, .6, 1);
    ctx.fillStyle = '#8a623a'; ctx.beginPath(); ctx.ellipse(x, y, 10.5, 5.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1c10'; ctx.beginPath(); ctx.ellipse(x, y + .6, 7.2, 3.3, 0, 0, TAU); ctx.fill();
  } });
}

// ===================== FIRE =====================
ATTACKS.furnox = { dur: .8, at: .46,                        // Furnace Ram
  pose(u, k) { ram(u, k, 7, 15, .46); const w = Ease.hump(Ease.seg(k, 0, .3)); u.sy = 1 - w * .1; u.sx = 1 + w * .06; },
  start(G, u) {
    charge(G, u, .8 * .3, () => muzzle(u, 12, 36), 13);
    G.fx.burst(u.x - u.adx * 10, u.y, 3, { col: 'rgba(190,165,130,.7)', shape: 'p', spd: 20, life: .5, size: 4, grow: 8, flat: .5 });
  },
  tick(G, u, k, dt) {
    if (k > .28 && k < .5) {
      const x = u.x + u.ox, y = u.y + u.oy;
      G.fx.p({ x: x - u.adx * 8 + rnd(-5, 5), y: y - rnd(4, 24), vx: -u.adx * 45, vy: -u.ady * 45 - 16, life: .42, size: rnd(2.4, 4.2), col: pick(['#ff7a2a', '#ffd23d', '#ff4a1a']), shape: 'g' });
      if (every(u, dt, .04)) G.fx.p({ x: x - u.adx * 6, y, vy: -10, life: .45, size: 4, grow: 10, col: 'rgba(190,165,130,.6)', shape: 'p' });
    }
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    // the blazing horns: two curved flames sweeping past the target, three colours deep
    fx.add({ dur: .44, draw(ctx, k) {
      ctx.translate(x, y); ctx.rotate(an); const s = .7 + Ease.outCubic(k) * .9;
      halo(ctx, 4 * s, 0, 24 * s, '#ff8a2a', (1 - k) * .8);
      ctx.globalAlpha = 1 - k * k;
      for (const q of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(-7 * s, q * 3 * s); ctx.quadraticCurveTo(4 * s, q * 17 * s, 19 * s, q * 14 * s); ctx.quadraticCurveTo(7 * s, q * 9 * s, 2 * s, q * s); ctx.closePath(); ctx.fillStyle = '#ff4a1a'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-4 * s, q * 3 * s); ctx.quadraticCurveTo(4 * s, q * 13 * s, 14 * s, q * 12 * s); ctx.quadraticCurveTo(6 * s, q * 8 * s, 2 * s, q * 2 * s); ctx.closePath(); ctx.fillStyle = '#ffb02e'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-2 * s, q * 3 * s); ctx.quadraticCurveTo(4 * s, q * 9.5 * s, 9 * s, q * 9 * s); ctx.quadraticCurveTo(5 * s, q * 6.5 * s, 2 * s, q * 2.4 * s); ctx.closePath(); ctx.fillStyle = '#fff3a8'; ctx.fill();
      }
    } });
    shock(fx, x, y, 5, 24, .32, '#ff8a2a');
    impact(G, 'fire', x, y, 1.25, tg.x, tg.y);
    G.shake(2.5); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.blazaroo = { dur: .7, at: .2,                       // Blaze Jabs
  pose(u, k) { lunge(u, k, 7, .3); u.lift = Math.abs(Math.sin(k * PI * 2)) * 3; },
  start(G, u) { const m = muzzle(u, 13, 16); flare(G.fx, m.x, m.y, 13, '#ff8a2a', .22); },
  fire(G, u, tg) {
    const fx = G.fx;
    const jab = i => {
      if (tg.state !== 'active' || u.state !== 'active') return;
      const x = bodyX(tg) + rnd(-3, 3), y = bodyY(tg) + (i ? 6 : -5), m = muzzle(u, 6, i ? 11 : 18), an = Math.atan2(y - m.y, x - m.x), tr = [];
      // a fist of flame streaking in, dragging a ribbon of fire behind it
      fx.add({ dur: .16, draw(ctx, k) {
        const e = Ease.outCubic(k), hx = lerp(m.x, x, e), hy = lerp(m.y, y, e);
        tr.push(hx, hy);
        ctx.globalCompositeOperation = 'lighter'; ribbon(ctx, tr, 9, '#ff5a2a', .9); ribbon(ctx, tr, 4, '#ffd23d', 1); ctx.globalCompositeOperation = 'source-over';
        halo(ctx, hx, hy, 13, '#ff8a2a', .9);
        ctx.translate(hx, hy); ctx.rotate(an);
        flameTongue(ctx, -16, 6, '#ff5a2a'); flameTongue(ctx, -10, 3.6, '#ffd23d');
        ctx.beginPath(); ctx.arc(1, 0, 4.4, 0, TAU); ctx.fillStyle = '#ff5a3a'; ctx.fill();
        ctx.beginPath(); ctx.arc(1.6, -.6, 2.4, 0, TAU); ctx.fillStyle = '#fff3a8'; ctx.fill();
      } });
      fx.after(.1, () => {
        fx.pow(x, y, i ? 12 : 9, '#ff5a2a', '#fff3a8');
        impact(G, 'fire', x, y, i ? .95 : .65, tg.x, tg.y);
        if (i) G.shake(1.5);
        G.hit(u, tg, u.sp.dmg);
      });
    };
    jab(0); fx.after(.22, () => jab(1));
  } };

ATTACKS.flarret = { dur: .62, at: .32, commit: true,        // Comet Dash
  pose(u, k) { travel(u, k, .12, .5, u.aD); const h = Ease.hump(Ease.seg(k, .12, .5)); u.sx = 1 + h * .35; u.sy = 1 - h * .2; },
  start(G, u) { G.fx.burst(u.x, u.y, 4, { col: 'rgba(190,165,130,.7)', shape: 'p', spd: 24, life: .4, size: 4, grow: 8, flat: .5 }); flare(G.fx, u.x, u.y - u.r, 14, '#ff8a2a', .25); },
  tick(G, u, k, dt) {
    if (k > .12 && k < .55) {
      const x = u.x + u.ox, y = u.y + u.oy - u.r * .8;
      for (let i = 0; i < 2; i++) G.fx.p({ x: x + rnd(-3, 3), y: y + rnd(-4, 4), vx: -u.adx * 30, vy: -u.ady * 30 - 12, life: .45, size: rnd(3, 5.5), col: pick(['#ff7a2a', '#ffd23d', '#ff4a1a']), shape: 'g' });
      if (every(u, dt, .05)) { ghost(G, u, .4, .22); groundFlame(G.fx, u.x + u.ox + rnd(-3, 3), u.y + u.oy + rnd(-2, 2)); }
    }
  },
  fire(G, u, tg) {
    const fx = G.fx, x0 = u.x, y0 = u.y - u.r * .8, x1 = u.x + u.adx * u.aD, y1 = u.y + u.ady * u.aD - u.r * .8;
    fx.add({ dur: .44, draw(ctx, k) {
      const gr = ctx.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(255,120,40,0)'); gr.addColorStop(.7, 'rgba(255,150,50,' + (.55 * (1 - k)) + ')'); gr.addColorStop(1, 'rgba(255,225,150,' + (.7 * (1 - k)) + ')');
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = gr; ctx.lineWidth = 10 * (1 - k * .6); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.lineWidth = 4 * (1 - k * .6); ctx.stroke();
    } });
    const x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    // the ring of fire the comet punches through
    fx.add({ dur: .42, draw(ctx, k) {
      const r = 9 + Ease.outCubic(k) * 15;
      ctx.translate(x, y); ctx.rotate(an); ctx.globalAlpha = 1 - k * k; ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); ctx.ellipse(0, 0, r * .42, r, 0, 0, TAU);
      ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 5.5 * (1 - k * .6); ctx.stroke(); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.8; ctx.stroke();
    } });
    impact(G, 'fire', x, y, 1.1, tg.x, tg.y);
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.solcub = { dur: .88, at: .52,                       // Solar Flare
  pose(u, k) { u.sy = 1 + Ease.hump(Ease.seg(k, .1, .6)) * .08; lunge(u, k, -3, .5); },
  start(G, u) {
    charge(G, u, .88 * .5, () => muzzle(u, 6, 47), 22);
    // a little sun swells above its mane
    G.fx.add({ dur: .88 * .52, draw(ctx, k) {
      if (u.state !== 'active') return;
      const m = muzzle(u, 6, 47), r = 2 + Ease.outCubic(k) * 6;
      ctx.translate(m.x, m.y); ctx.rotate(k * 3); ctx.fillStyle = '#ffd23d';
      for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.beginPath(); ctx.moveTo(-1.4, r); ctx.lineTo(0, r + 3 + k * 5); ctx.lineTo(1.4, r); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = '#fff3a8'; ctx.fill(); ctx.strokeStyle = '#ff9a2e'; ctx.lineWidth = 1; ctx.stroke();
    } });
  },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 6, 47);
    let ex = bodyX(tg), ey = bodyY(tg);
    fx.add({ dur: .46,
      update() { if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); } },
      draw(ctx, k) {
        const al = k < .12 ? k / .12 : 1 - Ease.seg(k, .55, 1), wd = 7 * al + 1, an = Math.atan2(ey - m.y, ex - m.x), L = Math.hypot(ex - m.x, ey - m.y);
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al * .38; ctx.strokeStyle = '#ff8a2a'; ctx.lineWidth = wd * 2.3; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = al;
        ctx.strokeStyle = '#ffd23d'; ctx.lineWidth = wd * 1.2; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = wd * .5; ctx.stroke();
        halo(ctx, m.x, m.y, 14, '#ffd23d', al * .8);
        ctx.translate(m.x, m.y); ctx.rotate(an);
        for (let i = 0; i < 3; i++) halo(ctx, L * ((k * 2.6 + i / 3) % 1), 0, 6, '#ffffff', al * .7);   // light racing down the beam
        ctx.translate(L, 0); halo(ctx, 0, 0, 18, '#ffe27a', al * .7);
        ctx.rotate(k * 2.4); ctx.fillStyle = '#ffd23d'; ctx.globalAlpha = al;
        for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-2.4, 6); ctx.lineTo(0, 15 + (i % 2) * 6 + 5 * (1 - k)); ctx.lineTo(2.4, 6); ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fillStyle = '#fff7c0'; ctx.fill();
      } });
    cross(fx, m.x, m.y, 22, '#fff7c0', .3);
    impact(G, 'fire', ex, ey, .9, tg.x, tg.y);
    for (let i = 1; i < 5; i++) fx.p({ x: lerp(m.x, ex, i / 5), y: lerp(m.y, ey, i / 5), life: .45, size: 3.6, col: '#ffffff', shape: 's', vr: 6 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.campyre = { dur: .95, at: .5,                       // Bonfire Ring
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .6)); u.sy = 1 + p * .16; u.sx = 1 - p * .06; },
  start(G, u, tg) {
    charge(G, u, .95 * .45, () => muzzle(u, 0, 32), 18);
    const R = u.sp.aoe;
    // a dotted circle of embers warns where the bonfire will rise
    G.fx.add({ dur: .95 * .5, ground: true, draw(ctx, k) {
      if (tg.state !== 'active') return;
      ctx.translate(tg.x, tg.y); ctx.scale(1, .55); halo(ctx, 0, 0, R * 1.15, '#ff8a2a', k * .4);
      ctx.rotate(k * 2); ctx.globalAlpha = k; ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 2.2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(0, 0, R * .78, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    } });
  },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y, R = u.sp.aoe;
    decal(fx, x, y, R, 'scorch'); groundGlow(fx, x, y, R * 1.5, '#ff8a2a', .8, .8);
    const pillar = (px, py, d, s) => fx.add({ dur: .56, delay: d, draw(ctx, k) {
      const h = Ease.hump(k) * s, wob = Math.sin(k * 20) * 1.6;
      halo(ctx, px, py - h * .35, 8 + h * .5, '#ff8a2a', .75 * Ease.hump(k)); ctx.translate(px, py);
      for (const q of [[1, '#ff4a1a'], [.72, '#ff8a2a'], [.46, '#ffd23d'], [.22, '#fff7c0']]) {
        const w2 = q[0];
        ctx.beginPath(); ctx.moveTo(-6.5 * w2, 0); ctx.quadraticCurveTo(-7.5 * w2, -h * .5, wob * w2, -h * w2 - 2); ctx.quadraticCurveTo(7.5 * w2, -h * .5, 6.5 * w2, 0); ctx.closePath();
        ctx.fillStyle = q[1]; ctx.fill();
      }
    }, end() { fx.p({ x: px, y: py - s * .6, vy: -40, life: .5, size: 2.4, col: '#ffd23d', shape: 'g' }); } });
    for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; pillar(x + Math.cos(an) * R * .74, y + Math.sin(an) * R * .41, i * .035, 22); }
    pillar(x, y, .22, 34);
    fx.after(.22, () => {
      foesIn(G, u.side, x, y, R).forEach(e => impact(G, 'fire', bodyX(e), bodyY(e), .6, e.x, e.y));
      G.area(u, x, y, R, u.sp.dmg); G.shake(2);
      fx.burst(x, y - 6, 14, { col: ['#ff7a2a', '#ffd23d', '#ffb02e'], shape: 'g', spd: 55, life: 1, size: 2.6, up: 55, g: -30, jit: R * .4 });
      fx.burst(x, y - 14, 4, { col: 'rgba(90,70,70,.4)', shape: 'p', spd: 14, life: 1.1, size: 7, grow: 10, up: 30 });
    });
  } };

// ===================== WATER =====================
ATTACKS.walrump = { dur: .95, at: .5,                       // Tidal Flop
  pose(u, k) {
    const j = Ease.seg(k, .1, .5); u.lift = Math.sin(j * PI) * 18; lunge(u, k, 10, .5); u.rot = Math.sin(j * PI) * .25;
    const sq = Ease.hump(Ease.seg(k, .5, .75)); u.sx = 1 + sq * .28; u.sy = 1 - sq * .28;
  },
  start(G, u) {
    G.fx.burst(u.x, u.y, 6, { col: ['#bfe6ff', '#ffffff'], shape: 'd', spd: 50, life: .4, size: 2, up: 60, g: 300 });
    G.fx.ring(u.x, u.y, 4, 16, .3, '#eaf7ff', 2, true);
  },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x + u.ox, y = u.y + u.oy, R = u.sp.aoe;
    // a ring of little wave crests rolling outward over a sheet of water
    fx.add({ dur: .62, ground: true, draw(ctx, k) {
      const r = lerp(8, R * 1.1, Ease.outCubic(k)); ctx.translate(x, y); ctx.lineCap = 'round';
      ctx.globalAlpha = (1 - k) * .3; ctx.fillStyle = '#7ac8ff'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .55, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1 - k * k;
      for (let i = 0; i < 14; i++) {
        const an = i / 14 * TAU;
        ctx.beginPath(); ctx.arc(Math.cos(an) * r, Math.sin(an) * r * .55, 4.6 * (1 - k * .4), PI, TAU);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = '#7ac8ff'; ctx.lineWidth = 1; ctx.stroke();
      }
    } });
    shock(fx, x, y, 6, R, .45, '#7ac8ff', true);
    impact(G, 'water', x, y - 4, 1.6, x, y);
    for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; fx.p({ x: x + Math.cos(an) * 8, y: y + Math.sin(an) * 5, vx: Math.cos(an) * 60, vy: Math.sin(an) * 32 - 120, g: 320, life: .65, size: 2.8, col: pick(['#bfe6ff', '#7ac8ff', '#ffffff']), shape: 'd' }); }
    foesIn(G, u.side, x, y, R).forEach(e => impact(G, 'water', bodyX(e), bodyY(e), .55, e.x, e.y));
    G.shake(3.5); G.area(u, x, y, R, u.sp.dmg);
  } };

ATTACKS.snipclaw = { dur: .8, at: .52,                      // Bubble Clamp
  pose(u, k) { ram(u, k, 3, 9, .52); },
  start(G, u) { const m = muzzle(u, 20, 18); cross(G.fx, m.x, m.y, 13, '#ffffff', .3, 0, .12); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    // two pincers of water snapping shut
    fx.add({ dur: .36, draw(ctx, k) {
      const cl = Ease.outBack(Math.min(1, k * 2.2));
      ctx.translate(x, y); ctx.rotate(an + PI / 2); ctx.globalAlpha = k > .6 ? 1 - (k - .6) / .4 : 1;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * (21 - 16 * cl), 0); ctx.scale(s * 1.15, 1.15);
        ctx.beginPath(); ctx.moveTo(8, -12); ctx.quadraticCurveTo(-8, -10, -6, 0); ctx.quadraticCurveTo(-8, 10, 8, 12); ctx.quadraticCurveTo(0, 6, 1, 0); ctx.quadraticCurveTo(0, -6, 8, -12); ctx.closePath();
        const gr = ctx.createLinearGradient(-8, 0, 8, 0); gr.addColorStop(0, 'rgba(63,188,203,.96)'); gr.addColorStop(1, 'rgba(170,238,246,.88)');
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.quadraticCurveTo(-5.4, 0, -3, 6); ctx.stroke();
        ctx.restore();
      }
    } });
    fx.after(.11, () => {
      cross(fx, x, y, 22, '#ffffff', .22);
      for (let i = 0; i < 12; i++) { const a2 = i / 12 * TAU; fx.p({ x: x + Math.cos(a2) * 4, y: y + Math.sin(a2) * 4, vx: Math.cos(a2) * 72, vy: Math.sin(a2) * 72, drag: 3, life: .65, size: rnd(2.4, 4.2), col: pick(['#bff3ff', '#ffffff']), shape: 'b' }); }
      shock(fx, x, y, 4, 21, .3, '#7ac8ff'); impact(G, 'water', x, y, .9, tg.x, tg.y);
      G.shake(2); G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.zipfin = { dur: .62, at: .34, commit: true,         // Jet Lance
  pose(u, k) { travel(u, k, .14, .5, u.aD); const h = Ease.hump(Ease.seg(k, .14, .5)); u.sx = 1 + h * .3; u.sy = 1 - h * .15; },
  start(G, u) { G.fx.ring(u.x, u.y, 4, 18, .3, '#eaf7ff', 2, true); G.fx.burst(u.x, u.y - u.r, 5, { col: ['#bfe6ff', '#ffffff'], shape: 'b', spd: 30, life: .5, size: 2.6 }); },
  tick(G, u, k, dt) {
    if (k > .14 && k < .52) {
      const x = u.x + u.ox, y = u.y + u.oy - u.r, nx = -u.ady, ny = u.adx;
      for (const s of [-1, 1]) G.fx.p({ x, y, vx: nx * s * 48 - u.adx * 20, vy: ny * s * 48 - u.ady * 20, life: .32, size: 2.4, col: pick(['#bfe6ff', '#ffffff', '#7ac8ff']), shape: 'd' });
      if (every(u, dt, .05)) { ghost(G, u, .38, .2); G.fx.ring(u.x + u.ox, u.y + u.oy, 3, 13, .45, '#eaf7ff', 1.6, true); G.fx.p({ x, y, vy: -18, life: .6, size: 2.6, col: '#ffffff', shape: 'b' }); }
    }
  },
  fire(G, u, tg) {
    const fx = G.fx, x0 = u.x, y0 = u.y - u.r, L = u.aD, an = Math.atan2(u.ady, u.adx);
    fx.add({ dur: .46, draw(ctx, k) {
      ctx.translate(x0, y0); ctx.rotate(an);
      halo(ctx, L, 0, 16 * (1 - k), '#bfe6ff', 1 - k);
      ctx.globalAlpha = (1 - k) * .85;
      ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(L * .9, -6 * (1 - k)); ctx.lineTo(L + 10, 0); ctx.lineTo(L * .9, 6 * (1 - k)); ctx.lineTo(0, 1); ctx.closePath();
      const gr = ctx.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, 'rgba(143,212,255,0)'); gr.addColorStop(1, 'rgba(190,232,255,1)');
      ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      for (let i = 1; i <= 5; i++) { ctx.beginPath(); ctx.ellipse(L * i / 5.5, 0, 2 + k * 4, (5 + i) * (.6 + k), 0, 0, TAU); ctx.stroke(); }
    } });
    const x = bodyX(tg), y = bodyY(tg);
    shock(fx, x, y, 4, 22, .3, '#7ac8ff'); impact(G, 'water', x, y, 1.1, tg.x, tg.y);
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.inkjet = { dur: .88, at: .3,                        // Ink Burst
  pose(u, k) { const p = Math.sin(Ease.seg(k, .25, .75) * PI * 3); u.sy = 1 + p * .07; u.sx = 1 - p * .05; lunge(u, k, -3, .4); },
  start(G, u) {
    const fx = G.fx; let acc = 0;
    fx.add({ dur: .88 * .28, update(dt) {
      acc += dt; if (acc < .03 || u.state !== 'active') return; acc = 0;
      const m = muzzle(u, 2, 10), an = rnd(TAU);
      fx.p({ x: m.x + Math.cos(an) * 15, y: m.y + Math.sin(an) * 15, vx: -Math.cos(an) * 48, vy: -Math.sin(an) * 48, life: .3, size: 2.3, col: pick(['#2a2f6a', '#1c1f4d']) });
    } });
  },
  fire(G, u, tg) {
    const fx = G.fx;
    for (let i = 0; i < 3; i++) {
      const m = muzzle(u, 2, 10);
      fx.after(i * .12, () => fx.burst(m.x, m.y, 3, { col: '#2a2f6a', spd: 30, life: .25, size: 2 }));
      shoot(G, tg, { x: m.x, y: m.y, speed: 250, delay: i * .12, arc: 7, tail: { n: 9, w: 5.5, col: '#1c1f4d', al: .9 },
        draw(ctx, x, y, an) {
          ctx.translate(x, y); ctx.rotate(an); ctx.fillStyle = '#1c1f4d';
          ctx.beginPath(); ctx.moveTo(5, 0); ctx.quadraticCurveTo(0, -5, -11, 0); ctx.quadraticCurveTo(0, 5, 5, 0); ctx.fill();
          ctx.fillStyle = '#7f8ff0'; ctx.beginPath(); ctx.ellipse(1.4, -1.6, 2, 1, -.4, 0, TAU); ctx.fill();
        },
        trail(x, y) { fx.p({ x, y, vy: 24, life: .3, size: 1.7, col: '#2a2f6a' }); },
        hit(t, x, y) {
          splat(fx, x, y, '#1c1f4d', 11, .8); splat(fx, x - 2, y - 1, '#3a418f', 5, .8); inkDrips(fx, x, y, '#1c1f4d');
          fx.burst(x, y, 7, { col: ['#2a2f6a', '#1c1f4d', '#5f6fd0'], shape: 'd', spd: 75, life: .4, size: 2.3, g: 190, up: 20 });
          if (t) { decal(fx, t.x, t.y, 12, 'ink'); G.hit(u, t, u.sp.dmg); }
        } });
    }
  } };

ATTACKS.drizzelly = { dur: 1, at: .45,                      // Bubble Bloom
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .6)); u.sy = 1 + p * .14; u.lift = p * 4; },
  start(G, u) { charge(G, u, .42, () => muzzle(u, 0, 36), 18); },
  fire(G, u, tg) {
    const fx = G.fx, gx = tg.x, gy = tg.y, x = gx, y = gy - tg.r * .8, R = u.sp.aoe, m = muzzle(u, 0, 36);
    for (let i = 0; i < 7; i++) {
      const ex = x + rnd(-R * .6, R * .6), ey = y + rnd(-R * .4, R * .4), rr = rnd(4.5, 8), hue = rnd(360);
      fx.add({ dur: .56, delay: i * .05,
        draw(ctx, k) {
          const e = Ease.outCubic(k), px = lerp(m.x, ex, e) + Math.sin(k * 9 + i) * 3, py = lerp(m.y, ey, e) - Math.sin(k * PI) * 16, q = rr * (.5 + k * .5);
          ctx.beginPath(); ctx.arc(px, py, q, 0, TAU); ctx.fillStyle = 'rgba(150,225,255,.32)'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.stroke();
          // soap-bubble sheen
          ctx.lineWidth = 1.2; ctx.strokeStyle = 'hsla(' + hue + ',95%,75%,.9)'; ctx.beginPath(); ctx.arc(px, py, q * .72, -2.4, -.9); ctx.stroke();
          ctx.strokeStyle = 'hsla(' + ((hue + 120) % 360) + ',95%,75%,.8)'; ctx.beginPath(); ctx.arc(px, py, q * .72, .6, 1.9); ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px - q * .32, py - q * .32, q * .2, 0, TAU); ctx.fill();
        },
        end() { fx.ring(ex, ey, rr, rr * 2.4, .25, '#ffffff', 1.8); cross(fx, ex, ey, rr * 1.7, '#ffffff', .2); fx.burst(ex, ey, 5, { col: ['#bfe6ff', '#ffffff'], shape: 'd', spd: 55, life: .35, size: 1.9, g: 140 }); } });
    }
    fx.after(.6, () => { impact(G, 'water', gx, gy - 8, .9, gx, gy); G.area(u, gx, gy, R, u.sp.dmg); });
    // a gentle healing drizzle over nearby friends
    shock(fx, u.x, u.y, 8, 64, .7, '#9fe8ff', true);
    G.allies(u.side).forEach(al => {
      if (dist2(al.x, al.y, u.x, u.y) > 64) return;
      G.heal(al, u.sp.heal, '#9fe8ff');
      for (let i = 0; i < 6; i++) fx.p({ x: al.x + rnd(-al.r, al.r), y: al.y - al.r * 2.4 - rnd(10, 30), vy: rnd(70, 100), life: .45, size: 2, col: pick(['#9fe8ff', '#d8ffe8']), shape: 'd' });
    });
  } };

// ===================== LEAF =====================
ATTACKS.stumply = { dur: .95, at: .45,                      // Root Rise
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .2, .55)); u.sy = 1 - p * .12; u.sx = 1 + p * .08; },
  start(G, u, tg) {
    // a ripple of earth runs along the ground toward the target
    const fx = G.fx, x0 = u.x, y0 = u.y;
    for (let i = 1; i <= 4; i++) fx.after(i * .085, () => {
      if (tg.state !== 'active') return;
      const px = lerp(x0, tg.x, i / 5), py = lerp(y0, tg.y, i / 5);
      fx.burst(px, py, 2, { col: 'rgba(150,110,70,.75)', shape: 'p', spd: 14, life: .4, size: 3.4, grow: 7, flat: .5 });
      fx.add({ dur: .5, ground: true, draw(ctx, k) { ctx.globalAlpha = 1 - k; ctx.fillStyle = '#8a623a'; ctx.beginPath(); ctx.ellipse(px, py, 6.5, 3.4 * Ease.hump(k) + 1, 0, PI, TAU); ctx.fill(); } });
    });
  },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y;
    fx.burst(x, y, 7, { col: 'rgba(150,110,70,.8)', shape: 'p', spd: 32, life: .45, size: 4.4, grow: 9, flat: .5 });
    fx.burst(x, y, 6, { col: ['#8a623a', '#6a4826'], shape: 'q', spd: 60, life: .5, size: 2.6, up: 75, g: 380, vr: 10 });
    fx.add({ dur: 1.25, draw(ctx, k) {
      const g = k < .2 ? Ease.outBack(k / .2) : k > .8 ? 1 - (k - .8) / .2 : 1, bloom = Ease.seg(k, .28, .5) * (k > .8 ? 1 - (k - .8) / .2 : 1);
      ctx.translate(x, y); ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const s = i % 2 ? 1 : -1, bx = (i - 2) * 6.5, h = (20 + (i % 3) * 5) * g, tx = bx + s * 3, ty = -h;
        ctx.beginPath(); ctx.moveTo(bx, 0); ctx.bezierCurveTo(bx + s * 12, -h * .4, bx - s * 10, -h * .8, tx, ty);
        ctx.strokeStyle = '#4a2f14'; ctx.lineWidth = 5.8; ctx.stroke(); ctx.strokeStyle = '#a8743c'; ctx.lineWidth = 3.3; ctx.stroke(); ctx.strokeStyle = '#d6a868'; ctx.lineWidth = 1; ctx.stroke();
        if (bloom > 0) {   // leaves unfurl, and the middle root flowers
          ctx.fillStyle = '#5fd060'; ctx.beginPath(); ctx.ellipse(tx + s * 4, ty - 1, 4.6 * bloom, 2.2 * bloom, s * .6, 0, TAU); ctx.fill();
          ctx.fillStyle = '#8fe87a'; ctx.beginPath(); ctx.ellipse(tx - s * 3, ty + 2, 3.5 * bloom, 1.7 * bloom, -s * .7, 0, TAU); ctx.fill();
          if (i === 2) {
            ctx.save(); ctx.translate(tx, ty - 3); ctx.rotate(k * 2);
            for (let p = 0; p < 5; p++) { ctx.rotate(TAU / 5); ctx.fillStyle = '#ff9ac0'; ctx.beginPath(); ctx.ellipse(3.3 * bloom, 0, 2.7 * bloom, 1.7 * bloom, 0, 0, TAU); ctx.fill(); }
            ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(0, 0, 1.7 * bloom, 0, TAU); ctx.fill(); ctx.restore();
          }
        }
      }
    } });
    impact(G, 'leaf', bodyX(tg), bodyY(tg), .9);
    G.shake(1.5); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.brambear = { dur: .86, at: .25,                     // Thorn Swipe
  pose(u, k) { lunge(u, k, 8, .35); u.rot = Math.sin(k * PI * 3) * .12; },
  fire(G, u, tg) {
    const fx = G.fx, base = Math.atan2(u.ady, u.adx);
    for (let i = 0; i < 3; i++) fx.after(i * .14, () => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg), y = bodyY(tg), rot = base + PI / 2 + (i - 1) * .7, big = i === 2 ? 1.3 : 1;
      // three glowing claw marks; the last swipe is the biggest
      fx.add({ dur: .3, draw(ctx, k) {
        ctx.translate(x, y); ctx.rotate(rot); ctx.scale(big, big); ctx.lineCap = 'round';
        const L = Ease.outCubic(Math.min(1, k * 2.5));
        for (let j = -1; j <= 1; j++) {
          ctx.beginPath(); ctx.moveTo(-13, j * 5.5 - 3); ctx.quadraticCurveTo(0, j * 5.5 + 3.4, -13 + 26 * L, j * 5.5 - 3 * (1 - L));
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .6; ctx.strokeStyle = '#7fe070'; ctx.lineWidth = 7; ctx.stroke();
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k * k;
          ctx.strokeStyle = '#f2ffe0'; ctx.lineWidth = 3.4 * (1 - k * .5); ctx.stroke(); ctx.strokeStyle = '#3da04a'; ctx.lineWidth = 1.2; ctx.stroke();
        }
      } });
      for (let j = 0; j < 4; j++) { const a2 = rot - PI / 2 + rnd(-.6, .6), v = rnd(90, 150); fx.p({ x, y, vx: Math.cos(a2) * v, vy: Math.sin(a2) * v, life: .3, size: 2.6, col: '#eaffd0', shape: 'k' }); }
      impact(G, 'leaf', x, y, i === 2 ? .85 : .5);
      if (i === 2) G.shake(1.5);
      G.hit(u, tg, u.sp.dmg);
      if (u.state === 'active') G.heal(u, u.sp.selfHeal, '#7fe070', true);
    });
  } };

ATTACKS.cloverbun = { dur: .72, at: .42,                    // Lucky Kick
  pose(u, k) {
    const j = Ease.seg(k, .08, .42), b = Ease.seg(k, .42, .9), f = j < 1 ? Ease.inOut(j) : 1 - Ease.inOut(b);
    u.ox = u.adx * u.aC * f; u.oy = u.ady * u.aC * f;
    u.lift = j < 1 ? Math.sin(j * PI) * 22 : Math.sin(b * PI) * 12; u.rot = j < 1 ? -j * .3 : 0;
  },
  start(G, u) { G.fx.burst(u.x, u.y, 4, { col: 'rgba(255,255,255,.8)', shape: 'p', spd: 22, life: .35, size: 3.4, grow: 7, flat: .5 }); },
  tick(G, u, k, dt) { if (k > .08 && k < .42 && every(u, dt, .05)) ghost(G, u, .34, .2); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), crit = Math.random() < u.sp.crit, col = crit ? '#ffd23d' : '#55c85a';
    // a four-leaf clover pops out of the kick
    fx.add({ dur: .5, draw(ctx, k) {
      const s = (crit ? 1.55 : 1.1) * (.4 + Ease.outBack(Math.min(1, k * 2)) * .8);
      halo(ctx, x, y - 4 * k, 18 * s, crit ? '#ffe27a' : '#9af0a0', (1 - k) * .7);
      ctx.translate(x, y - 4 * k); ctx.rotate(k * 1.2); ctx.globalAlpha = 1 - k * k * k; ctx.fillStyle = col; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
      for (let i = 0; i < 4; i++) { ctx.rotate(PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-9 * s, -4 * s, -7 * s, -13 * s, 0, -8 * s); ctx.bezierCurveTo(7 * s, -13 * s, 9 * s, -4 * s, 0, 0); ctx.fill(); ctx.stroke(); }
    } });
    fx.burst(x, y, crit ? 12 : 6, { col: crit ? ['#ffd23d', '#ffffff', '#fff3a8'] : ['#ffffff', '#bfffb0'], shape: 's', spd: 95, life: .5, size: crit ? 4.2 : 3, vr: 8 });
    if (crit) {
      // jackpot: a little rainbow arches over the target
      fx.add({ dur: .8, draw(ctx, k) {
        ctx.globalAlpha = (k < .2 ? k / .2 : 1 - Ease.seg(k, .6, 1)) * .95; ctx.lineWidth = 2.3; ctx.lineCap = 'round';
        ['#ff5a5a', '#ffb02e', '#ffe14a', '#5fd060', '#4fc3ff', '#b48aff'].forEach((c2, i) => { ctx.strokeStyle = c2; ctx.beginPath(); ctx.arc(x, y + 4, 24 - i * 2.3, PI, PI + PI * Ease.outCubic(Math.min(1, k * 2.5))); ctx.stroke(); });
      } });
      fx.text(x, y - 30, 'LUCKY!', '#ffd23d', 10); cross(fx, x, y, 26, '#fff7c0', .3); G.shake(2.5);
    }
    impact(G, 'leaf', x, y, crit ? 1.2 : .85);
    G.hit(u, tg, u.sp.dmg * (crit ? 2 : 1));
  } };

ATTACKS.bloomerang = { dur: .9, at: .28,                    // Petal-rang
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .45)); u.rot = -p * .25; lunge(u, k, 3, .3); },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 8, 14), tr = [];
    let ex = bodyX(tg), ey = bodyY(tg), h1 = false, h2 = false, acc = 0;
    const strike = (dmg, s) => {
      if (tg.state !== 'active') return;
      fx.burst(ex, ey, 6, { col: ['#ff8fb8', '#ffb3cf', '#ffe27a'], shape: 'l', spd: 75, life: .6, size: 3.2, vr: 9, drag: 1.5, g: 40 });
      fx.pow(ex, ey, 8 * s, '#ff8fb8', '#ffffff'); impact(G, 'leaf', ex, ey, .6 * s); G.hit(u, tg, dmg);
    };
    fx.add({ dur: .88, px: m.x, py: m.y,
      update(dt, k, it) {
        if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); }
        const home = u.state === 'active', hx = home ? u.x : m.x, hy = home ? u.y - 14 * u.vs : m.y;
        const dx = ex - m.x, dy = ey - m.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        const s = Math.sin(k * PI), side = Math.sin(k * TAU) * 15, fx1 = m.x + dx * 1.25, fy1 = m.y + dy * 1.25;
        if (k < .5) { it.px = lerp(m.x, fx1, s) + nx * side; it.py = lerp(m.y, fy1, s) + ny * side; }
        else { it.px = lerp(hx, fx1, s) + nx * side; it.py = lerp(hy, fy1, s) + ny * side; }
        tr.push(it.px, it.py); if (tr.length > 22) tr.splice(0, 2);
        if (!h1 && k >= .28) { h1 = true; strike(u.sp.dmg, 1); }
        if (!h2 && k >= .72) { h2 = true; strike(u.sp.back, .8); }
        acc += dt; if (acc > .045) { acc = 0; fx.p({ x: it.px, y: it.py, life: .5, size: 2.6, col: pick(['#ff8fb8', '#ffd0e0', '#fff7a8']), shape: 'l', rot: rnd(TAU), vr: 6, vy: 12 }); }
      },
      draw(ctx, k, it) {
        ctx.globalCompositeOperation = 'lighter'; ribbon(ctx, tr, 7, '#ff8fb8', .7); ctx.globalCompositeOperation = 'source-over'; ribbon(ctx, tr, 2.4, '#ffffff', .9);
        halo(ctx, it.px, it.py, 13, '#ffb3cf', .8);
        ctx.translate(it.px, it.py); ctx.rotate(k * 44);
        for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(6, 0, 7, 3.4, 0, 0, TAU); ctx.fillStyle = i % 2 ? '#ff8fb8' : '#ffb3cf'; ctx.fill(); ctx.strokeStyle = '#6a2a4a'; ctx.lineWidth = .9; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, 2.8, 0, TAU); ctx.fillStyle = '#ffe27a'; ctx.fill();
      } });
  } };

ATTACKS.sporel = { dur: .95, at: .45,                       // Healing Spores
  pose(u, k) { const p = Ease.seg(k, .15, .7); u.sy = 1 + Math.sin(p * PI * 2) * .08; u.lift = Ease.hump(Ease.seg(k, .3, .6)) * 5; },
  start(G, u) { charge(G, u, .95 * .42, () => muzzle(u, 0, 27), 16); },
  fire(G, u, tg) {
    const fx = G.fx, R = u.sp.healR;
    for (let i = 0; i < 18; i++) { const an = rnd(TAU), d = rnd(6, R * .9); fx.p({ x: u.x + Math.cos(an) * 8, y: u.y - 22 + Math.sin(an) * 4, vx: Math.cos(an) * d * 1.6, vy: Math.sin(an) * d * .9 - 25, drag: 2.2, g: -12, life: rnd(.8, 1.3), size: rnd(1.6, 2.8), col: pick(['#c8ff9a', '#fff7a8', '#9af0a0']), shape: 'g' }); }
    shock(fx, u.x, u.y, 8, R, .7, '#9af0a0', true); groundGlow(fx, u.x, u.y, R, '#9af0a0', .7, .5);
    G.allies(u.side).forEach(al => {
      if (dist2(al.x, al.y, u.x, u.y) > R) return;
      G.heal(al, u.sp.heal, '#9af0a0');
      fx.burst(al.x, al.y - al.r, 4, { col: ['#c8ff9a', '#fff7a8'], shape: 'g', spd: 18, life: .8, size: 2.2, up: 30, g: -20, jit: al.r * .6 });
    });
    const m = muzzle(u, 0, 30);
    shoot(G, tg, { x: m.x, y: m.y, speed: 150, arc: 15, tail: { n: 10, w: 5, col: '#c8ff9a', add: true, al: .7 }, glow: { r: 10, col: '#c8ff9a' },
      draw(ctx, x, y, an, k) { for (let i = 0; i < 3; i++) { const a2 = k * 8 + i * 2.1; ctx.fillStyle = i ? '#c8ff9a' : '#fff7a8'; ctx.beginPath(); ctx.arc(x + Math.cos(a2) * 3.2, y + Math.sin(a2) * 3.2, 2.5, 0, TAU); ctx.fill(); } },
      hit(t, x, y) { fx.burst(x, y, 6, { col: ['rgba(200,255,154,.7)', 'rgba(255,247,168,.7)'], shape: 'p', spd: 30, life: .55, size: 4.4, grow: 7 }); impact(G, 'leaf', x, y, .6); if (t) G.hit(u, t, u.sp.dmg); } });
  } };

// ===================== SPARK =====================
ATTACKS.ohmadillo = { dur: .88, at: .55, commit: true,      // Static Roll
  pose(u, k) {
    const h = Ease.inCubic(Ease.seg(k, .12, .55)) - Ease.hump(Ease.seg(k, .55, .85)) * .12;
    u.ox = u.adx * u.aC * h; u.oy = u.ady * u.aC * h;
    u.rot = Ease.inOut(Ease.seg(k, .04, .72)) * TAU * 3; u.pivot = true;
    u.lift = Ease.hump(Ease.seg(k, .55, .8)) * 6;
  },
  tick(G, u, k, dt) {
    if (k > .1 && k < .56) {
      const x = u.x + u.ox, y = u.y + u.oy;
      G.fx.p({ x, y, vx: -u.adx * 20 + rnd(-10, 10), vy: -12, life: .35, size: 3.6, grow: 8, col: 'rgba(190,170,130,.65)', shape: 'p' });
      if (every(u, dt, .045)) {   // static crawling over the spinning shell
        const cy = y - u.r, a1 = rnd(TAU), a2 = a1 + rnd(1.2, 2.4), r = u.r * 1.05;
        lightning(G.fx, x + Math.cos(a1) * r, cy + Math.sin(a1) * r, x + Math.cos(a2) * r, cy + Math.sin(a2) * r, { segs: 3, jit: 3, wid: 1.3, dur: .09 });
        G.fx.p({ x: x + rnd(-8, 8), y: cy + rnd(-8, 8), life: .3, size: 2.2, col: '#fff7b0', shape: 'g' });
      }
    }
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg);
    for (let i = 0; i < 7; i++) { const an = i / 7 * TAU + rnd(.3); lightning(fx, x, y, x + Math.cos(an) * 24, y + Math.sin(an) * 24, { segs: 4, jit: 4.5, wid: 1.7, dur: .22 }); }
    shock(fx, x, y, 4, 24, .3, '#ffe14a'); impact(G, 'spark', x, y, 1.2, tg.x, tg.y);
    for (let i = 0; i < 3; i++) fx.after(.16 + i * .1, () => { if (tg.state === 'active') fx.p({ x: bodyX(tg) + rnd(-9, 9), y: bodyY(tg) + rnd(-9, 9), life: .18, size: 3.4, col: '#fff7b0', shape: 'z', rot: rnd(TAU) }); });
    G.shake(2.5); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.zapcoon = { dur: .64, at: .42,                      // Tail Taser
  pose(u, k) { lunge(u, k, 6, .42); u.rot = Ease.inOut(Ease.seg(k, .15, .62)) * TAU; u.pivot = true; },
  start(G, u) { const m = muzzle(u, -14, 20); flare(G.fx, m.x, m.y, 12, '#ffe14a', .25); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), cx = u.x + u.ox, cy = u.y + u.oy - u.r, an = Math.atan2(y - cy, x - cx), R = dist2(cx, cy, x, y) + 3;
    // the charged tail whips round in a glowing arc, with two fading echoes behind it
    for (let e = 0; e < 3; e++) fx.add({ dur: .28, delay: e * .045, draw(ctx, k) {
      const head = an - 1.3 + 2.6 * Ease.outCubic(k), tail = an - 1.3 + 2.6 * Ease.outCubic(Math.max(0, k * 1.5 - .5));
      ctx.beginPath(); ctx.arc(cx, cy, R - e * 3, tail, head); ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * (e ? .3 : .7); ctx.strokeStyle = '#ffd23d'; ctx.lineWidth = 11 - e * 2; ctx.stroke();
      if (!e) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k * k; ctx.strokeStyle = '#fffbd0'; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.stroke(); }
    } });
    fx.add({ dur: .28, draw(ctx, k) {
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.lineJoin = 'miter'; ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const a2 = an - 1.2 + 2.4 * i / 10, rr = R + (i % 2 ? 4.4 : -3.4) + rnd(-1.5, 1.5); ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr); }
      ctx.stroke();
    } });
    impact(G, 'spark', x, y, 1, tg.x, tg.y);
    G.shake(1.5); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.dynafly = { dur: .52, at: .3, commit: true,         // Zigzag Strike
  pose(u, k) {
    const h = k < .2 ? 0 : k < .42 ? (k - .2) / .22 : 1, st = Math.min(4, Math.floor(h * 4 + .0001)), f = st / 4;
    const side = (st % 2 ? 1 : -1) * (st === 0 || st === 4 ? 0 : 11);
    u.ox = u.adx * u.aD * f - u.ady * side; u.oy = u.ady * u.aD * f + u.adx * side;
    u.al = k > .2 && k < .42 ? .6 : 1;
  },
  tick(G, u, k, dt) { if (k > .18 && k < .44 && every(u, dt, .028)) ghost(G, u, .5, .24); },
  fire(G, u, tg) {
    const fx = G.fx, x0 = u.x, y0 = u.y - u.r * 1.5, D = u.aD, pts = [x0, y0];
    for (let i = 1; i <= 4; i++) { const f = i / 4, side = (i % 2 ? 1 : -1) * (i === 4 ? 0 : 11); pts.push(x0 + u.adx * D * f - u.ady * side, y0 + u.ady * D * f + u.adx * side); }
    fx.add({ dur: .38, draw(ctx, k) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .6; strokePts(ctx, pts, '#ffd23d', 9 * (1 - k * .5));
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k * k; strokePts(ctx, pts, '#fffbd0', 3); strokePts(ctx, pts, '#ffffff', 1.2);
    } });
    for (let i = 2; i < pts.length - 2; i += 2) { cross(fx, pts[i], pts[i + 1], 11, '#bffff5', .3, .4, i * .012); fx.p({ x: pts[i], y: pts[i + 1], life: .5, size: 2.6, col: '#3de0c8', shape: 'g' }); }
    for (let i = 0; i < 6; i++) { const f = rnd(0, 1), j = Math.min(3, Math.floor(f * 4)), q = f * 4 - j; fx.p({ x: lerp(pts[j * 2], pts[j * 2 + 2], q), y: lerp(pts[j * 2 + 1], pts[j * 2 + 3], q), vy: -10, life: .6, size: 1.9, col: pick(['#fff7b0', '#7af0ff']), shape: 'g' }); }
    const x = bodyX(tg), y = bodyY(tg);
    impact(G, 'spark', x, y, 1, tg.x, tg.y);
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.teslowl = { dur: .8, at: .5,                        // Arc Bolt
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .6)); u.sy = 1 + p * .06; u.lift = p * 3; },
  start(G, u) {
    // the coils spin up: sparks leap between the two tips
    const fx = G.fx; let acc = 0;
    fx.add({ dur: .8 * .5,
      update(dt) {
        if (u.state !== 'active') return;
        acc += dt; if (acc < .07) return; acc = 0;
        const p1 = muzzle(u, -9.7, 40), p2 = muzzle(u, 10.7, 40);
        lightning(fx, p1.x, p1.y, p2.x, p2.y, { segs: 4, jit: 3.5, wid: 1.2, dur: .08, col: '#dffcff', glow: '#7af0ff' });
        fx.p({ x: lerp(p1.x, p2.x, rnd(0, 1)), y: p1.y + rnd(-4, 2), vx: rnd(-20, 20), vy: rnd(-34, -6), life: .22, size: 2.6, col: '#bff8ff', shape: 'z', vr: 10, rot: rnd(TAU) });
      },
      draw(ctx, k) {
        if (u.state !== 'active') return;
        const p1 = muzzle(u, -9.7, 40), p2 = muzzle(u, 10.7, 40);
        halo(ctx, p1.x, p1.y, 5 + k * 8, '#7af0ff', .5 + k * .5); halo(ctx, p2.x, p2.y, 5 + k * 8, '#7af0ff', .5 + k * .5);
      } });
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), p1 = muzzle(u, -9.7, 40), p2 = muzzle(u, 10.7, 40), mx = (p1.x + p2.x) / 2 + u.face * 10, my = p1.y - 3;
    const o = { segs: 3, jit: 3, wid: 1.6, col: '#dffcff', glow: '#7af0ff' };
    lightning(fx, p1.x, p1.y, mx, my, o); lightning(fx, p2.x, p2.y, mx, my, o);
    flare(fx, mx, my, 15, '#7af0ff', .25);
    lightning(fx, mx, my, x, y, { segs: 8, jit: 9, wid: 3, dur: .3 });
    for (let i = 0; i < 3; i++) { const f = .3 + i * .22; lightning(fx, lerp(mx, x, f), lerp(my, y, f), lerp(mx, x, f + .15) + rnd(-20, 20), lerp(my, y, f + .15) + rnd(-20, 20), { segs: 3, jit: 5, wid: 1.3, dur: .18, delay: i * .03 }); }
    // an electric cage crackles around the target
    fx.add({ dur: .36, draw(ctx, k) {
      ctx.translate(x, y); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff9c4'; ctx.lineWidth = 1.4; ctx.lineJoin = 'miter';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); const rx = 13 + i * 2, ph = k * 14 + i * 2.1;
        for (let j = 0; j <= 14; j++) { const a2 = j / 14 * TAU + ph, rr = rx + (j % 2 ? 2.4 : -2.4); ctx[j ? 'lineTo' : 'moveTo'](Math.cos(a2) * rr, Math.sin(a2) * rr * (.45 + i * .25)); }
        ctx.stroke();
      }
    } });
    impact(G, 'spark', x, y, 1.1, tg.x, tg.y);
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.nimbolt = { dur: .9, at: .45,                       // Thunderclap
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .55)); u.sx = 1 + p * .15; u.sy = 1 - p * .08; if (k > .4 && k < .6) u.ox = Math.sin(k * 120) * 1.2; },
  start(G, u) { charge(G, u, .9 * .42, () => muzzle(u, 0, 18), 17); },
  fire(G, u, tg) {
    const fx = G.fx, cx = bodyX(tg), cy = bodyY(tg) - 54;
    let acc = 0;
    // a storm cloud gathers overhead, flickering inside, and it starts to rain
    fx.add({ dur: .62,
      update(dt, k) { acc += dt; if (acc > .03 && k < .75) { acc = 0; fx.p({ x: cx + rnd(-13, 13), y: cy + 6, vx: -8, vy: rnd(150, 190), life: .22, size: 2.4, col: '#bfe6ff', shape: 'k' }); } },
      draw(ctx, k) {
        const al = k < .18 ? k / .18 : 1 - Ease.seg(k, .7, 1);
        ctx.globalAlpha = al;
        ctx.fillStyle = '#434b70'; for (const q of [[-10, 2, 8], [0, 3, 9], [10, 2, 8]]) { ctx.beginPath(); ctx.arc(cx + q[0], cy + q[1], q[2], 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#6b7499'; for (const q of [[-8, -2, 7], [1, -5, 9], [9, -2, 7]]) { ctx.beginPath(); ctx.arc(cx + q[0], cy + q[1], q[2], 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#8f98bd'; ctx.beginPath(); ctx.arc(cx - 2, cy - 8, 5, 0, TAU); ctx.fill();
        if (Math.sin(k * 60) > .2) halo(ctx, cx, cy + 1, 13, '#ffe14a', al * .8);
      } });
    fx.after(.14, () => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg), y = bodyY(tg);
      lightning(fx, x + rnd(-4, 4), y - 50, x, y, { segs: 7, jit: 8, wid: 3.8, dur: .3 });
      lightning(fx, x + rnd(-3, 3), y - 28, x + rnd(-22, 22), y - 6, { segs: 3, jit: 5, wid: 1.4, dur: .2 });
      groundGlow(fx, tg.x, tg.y, 44, '#ffe14a', .35, .9); shock(fx, tg.x, tg.y, 4, 26, .34, '#ffe14a', true);
      impact(G, 'spark', x, y, 1.3, tg.x, tg.y); decal(fx, tg.x, tg.y, 11, 'scorch');
      G.shake(3); G.hit(u, tg, u.sp.dmg);
      let prev = tg; const used = [tg];
      for (let i = 0; i < u.sp.chain; i++) {
        const nx = G.nearestEnemy(u.side, prev.x, prev.y, 90, used);
        if (!nx) break; used.push(nx);
        const from = prev;
        fx.after(.09 * (i + 1), () => {
          if (nx.state !== 'active') return;
          lightning(fx, bodyX(from), bodyY(from), bodyX(nx), bodyY(nx), { segs: 6, jit: 7, wid: 2.2, dur: .22 });
          impact(G, 'spark', bodyX(nx), bodyY(nx), .7, nx.x, nx.y); G.hit(u, nx, u.sp.dmg * .6);
        });
        prev = nx;
      }
    });
  } };

// ===================== STONE =====================
ATTACKS.cobblem = { dur: .98, at: .5,                       // Quake Stomp
  pose(u, k) { const j = Ease.seg(k, .1, .5); u.lift = Math.sin(j * PI) * 11; const sq = Ease.hump(Ease.seg(k, .5, .8)); u.sx = 1 + sq * .18; u.sy = 1 - sq * .2; },
  start(G, u) { G.fx.burst(u.x, u.y, 5, { col: ['#b89d7c', '#95795a'], shape: 'q', spd: 30, life: .45, size: 2.4, up: 70, g: 300, vr: 8 }); },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x, y = u.y, R = u.sp.aoe, cracks = [];
    for (let i = 0; i < 9; i++) {
      const an = i / 9 * TAU + rnd(-.2, .2), pts = [0, 0];
      for (let j = 1; j <= 4; j++) { const rr = R * 1.05 * j / 4, a2 = an + rnd(-.25, .25); pts.push(Math.cos(a2) * rr, Math.sin(a2) * rr * .55); }
      cracks.push(pts);
    }
    fx.add({ dur: 1.5, ground: true, draw(ctx, k) {
      ctx.translate(x, y); ctx.globalAlpha = k > .55 ? 1 - (k - .55) / .45 : 1;
      const n = Math.max(2, Math.ceil(Ease.outCubic(Math.min(1, k * 5)) * 4) + 1);
      for (const p of cracks) { const sub = p.slice(0, n * 2); strokePts(ctx, sub, '#6b4a2c', 3.4); strokePts(ctx, sub, '#2a1c10', 1.3); }
    } });
    shock(fx, x, y, 8, R, .42, '#e6c890', true);
    // jagged rocks punch up out of the ground in a ring, then sink back
    for (let i = 0; i < 8; i++) {
      const an = i / 8 * TAU + .2, px = x + Math.cos(an) * R * .62, py = y + Math.sin(an) * R * .34, hh = rnd(11, 16);
      fx.add({ dur: .75, delay: .03 * i, draw(ctx, k) {
        const h = Ease.hump(Math.min(1, k * 1.25)) * hh;
        ctx.translate(px, py); ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-4.6, 0); ctx.lineTo(-1, -h); ctx.lineTo(1.8, -h * .78); ctx.lineTo(4.6, 0); ctx.closePath();
        ctx.fillStyle = '#b89d7c'; ctx.fill(); ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-1, -h); ctx.lineTo(-.2, 0); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.stroke();
      } });
      fx.p({ x: px, y: py, vx: Math.cos(an) * 30, vy: Math.sin(an) * 16 - 6, life: .6, size: 5, grow: 10, drag: 2, col: 'rgba(200,175,140,.6)', shape: 'p' });
    }
    for (let i = 0; i < 12; i++) { const an = rnd(TAU), d = rnd(8, R * .8); fx.p({ x: x + Math.cos(an) * d, y: y + Math.sin(an) * d * .55, vx: rnd(-20, 20), vy: rnd(-150, -70), g: 420, life: .6, size: rnd(2, 3.8), col: pick(['#b89d7c', '#95795a', '#cdb393']), shape: 'q', vr: 10, rot: rnd(TAU) }); }
    foesIn(G, u.side, x, y, R).forEach(e => impact(G, 'stone', bodyX(e), bodyY(e), .6, e.x, e.y));
    G.shake(4.5); G.area(u, x, y, R, u.sp.dmg);
  } };

ATTACKS.quarrilla = { dur: .98, at: .5,                     // Rock Uppercut
  pose(u, k) { ram(u, k, 2, 7, .5); u.sy = 1 - Ease.hump(Ease.seg(k, .3, .5)) * .1; },
  start(G, u) {
    // a quick chest-drum before the punch
    const fx = G.fx;
    for (let i = 0; i < 3; i++) fx.after(.05 + i * .085, () => { if (u.state !== 'active') return; const m = muzzle(u, (i % 2 ? 5 : -3), 12); fx.ring(m.x, m.y, 2, 9, .16, '#fff3d6', 1.8); });
  },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y;
    // a fist of rock bursts up from below
    fx.add({ dur: .8, ground: true, draw(ctx, k) {
      const h = k < .2 ? Ease.outBack(k / .2) * 34 : k < .6 ? 34 : 34 * (1 - Ease.inCubic((k - .6) / .4));
      ctx.translate(x, y); ctx.globalAlpha = k > .82 ? 1 - (k - .82) / .18 : 1; ctx.lineJoin = 'round';
      ctx.fillStyle = '#95795a'; ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-6.5, -h + 8); ctx.lineTo(6.5, -h + 8); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#6b563f'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(-1.6, -h * .45); ctx.lineTo(-3.6, -h * .7); ctx.moveTo(3.6, -4); ctx.lineTo(2, -h * .5); ctx.stroke();
      ctx.fillStyle = '#c4ae90'; ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-10, -h + 9); ctx.lineTo(-11, -h); ctx.lineTo(-5.5, -h - 7); ctx.lineTo(6.5, -h - 7); ctx.lineTo(11, -h); ctx.lineTo(10, -h + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3.4, -h - 6); ctx.lineTo(-3.4, -h + 2); ctx.moveTo(2.2, -h - 6); ctx.lineTo(2.2, -h + 2); ctx.stroke();
      ctx.fillStyle = '#6fc45a'; ctx.beginPath(); ctx.arc(-7, -h - 3, 2.4, 0, TAU); ctx.fill();
    } });
    shock(fx, x, y, 6, 26, .36, '#e6c890', true);
    fx.burst(x, y, 9, { col: ['#b89d7c', '#95795a'], shape: 'q', spd: 85, life: .55, size: 3.2, up: 90, g: 380, vr: 10 });
    fx.burst(x, y, 6, { col: 'rgba(190,160,125,.75)', shape: 'p', spd: 34, life: .5, size: 5.5, grow: 9, flat: .5 });
    const bx = bodyX(tg), by = bodyY(tg);
    impact(G, 'stone', bx, by, 1.05, x, y);
    // whoosh lines as the target is launched
    fx.add({ dur: .3, draw(ctx, k) { ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(bx + i * 8, by + 4 - k * 16); ctx.lineTo(bx + i * 8, by + 16 - k * 10); ctx.stroke(); } } });
    G.shake(3.5); G.hit(u, tg, u.sp.dmg);
    if (tg.state === 'active') tg.kz = 150;
  } };

ATTACKS.jerboing = { dur: .98, at: .62, commit: true,       // Burrow Pop
  pose(u, k) {
    const under = Ease.inOut(Ease.seg(k, .18, .58)), pop = Ease.seg(k, .58, .95);
    u.ox = u.adx * u.aC * under; u.oy = u.ady * u.aC * under;
    if (k < .18) u.sy = 1 - Ease.seg(k, 0, .18) * .9;
    else if (k < .58) u.hide = true;
    else { u.lift = Math.sin(pop * PI) * 22; u.rot = Ease.inOut(pop) * TAU; u.pivot = true; }
  },
  start(G, u) {
    const fx = G.fx, x = u.x, y = u.y;
    fx.after(.12, () => { burrowHole(fx, x, y); fx.burst(x, y, 8, { col: ['#8a623a', '#b08a5a', '#6a4826'], spd: 50, life: .5, size: 2.6, up: 90, g: 380 }); });
  },
  tick(G, u, k, dt) {
    if (k > .16 && k < .6) {
      const x = u.x + u.ox, y = u.y + u.oy;
      if (every(u, dt, .03)) {   // the travelling mound
        G.fx.add({ dur: .5, ground: true, draw(ctx, q) { ctx.globalAlpha = 1 - q; ctx.fillStyle = '#9a6f42'; ctx.beginPath(); ctx.ellipse(x, y, 7.5, 4.2 * (1 - q * .6), 0, PI, TAU); ctx.fill(); ctx.strokeStyle = '#5a3d1e'; ctx.lineWidth = 1; ctx.stroke(); } });
        G.fx.p({ x: x + rnd(-4, 4), y: y + rnd(-2, 2), vy: -18, life: .45, size: 4, grow: 5, col: 'rgba(150,110,70,.8)', shape: 'p' });
      }
      if (Math.random() < .6) G.fx.p({ x, y, vx: rnd(-30, 30), vy: rnd(-70, -30), g: 300, life: .35, size: 2, col: '#8a623a' });
    }
    if (k > .6 && k < .9 && every(u, dt, .06)) ghost(G, u, .3, .2);
  },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x + u.ox, y = u.y + u.oy;
    burrowHole(fx, x, y);
    for (let i = 0; i < 18; i++) fx.p({ x: x + rnd(-6, 6), y, vx: rnd(-60, 60), vy: rnd(-180, -70), g: 420, life: .65, size: rnd(2, 3.8), col: pick(['#8a623a', '#b08a5a', '#6a4826']) });
    shock(fx, x, y, 5, 24, .36, '#e6c890', true);
    impact(G, 'stone', bodyX(tg), bodyY(tg), .95, tg.x, tg.y);
    G.shake(2.5); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.glintgecko = { dur: .9, at: .5,                     // Prism Shard
  pose(u, k) { lunge(u, k, -4, .5); u.sy = 1 + Ease.hump(Ease.seg(k, .1, .5)) * .06; },
  start(G, u) { charge(G, u, .9 * .48, () => muzzle(u, -1, 29), 17, 'mystic'); },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, -1, 29); let hue = 0;
    cross(fx, m.x, m.y, 18, '#ffffff', .25);
    shoot(G, tg, { x: m.x, y: m.y, speed: 320, trailEvery: .02, tail: { n: 13, w: 7, col: '#ff9ad8', core: '#ffffff', add: true }, glow: { r: 15, col: '#bff3ff', al: .8 },
      draw(ctx, x, y, an, k) {
        ctx.translate(x, y); ctx.rotate(an);
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(4, -4.6); ctx.lineTo(-8, -3.4); ctx.lineTo(-12, 0); ctx.lineTo(-8, 3.4); ctx.lineTo(4, 4.6); ctx.closePath();
        const gr = ctx.createLinearGradient(-12, 0, 12, 0); gr.addColorStop(0, '#ff9ad8'); gr.addColorStop(.5, '#ffffff'); gr.addColorStop(1, '#7aecff');
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .9; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(4, -4.6); ctx.lineTo(-8, 3.4); ctx.stroke();
      },
      trail(x, y) { hue = (hue + 47) % 360; fx.p({ x, y, life: .4, size: 2.8, col: 'hsl(' + hue + ',95%,72%)', shape: 'q', vr: 8, rot: rnd(TAU) }); },
      hit(t, x, y) {
        // the shard shatters into a fan of rainbow light
        const rot = rnd(TAU);
        fx.add({ dur: .46, draw(ctx, k) {
          ctx.translate(x, y); ctx.rotate(rot + k * .6); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k * k;
          for (let i = 0; i < 9; i++) { ctx.rotate(TAU / 9); const l = (12 + (i % 3) * 7) * (.4 + Ease.outCubic(k) * .8); ctx.beginPath(); ctx.moveTo(0, -1.8); ctx.lineTo(l, 0); ctx.lineTo(0, 1.8); ctx.closePath(); ctx.fillStyle = 'hsl(' + (i * 40) + ',95%,66%)'; ctx.fill(); }
        } });
        flare(fx, x, y, 24, '#ffffff', .25); cross(fx, x, y, 28, '#ffffff', .3);
        fx.burst(x, y, 12, { col: ['#7aecff', '#ff9ad8', '#b6a0ff', '#ffffff'], shape: 'q', spd: 120, life: .5, size: 3.6, vr: 12, g: 120 });
        fx.burst(x, y, 5, { col: ['#bff3ff', '#ffd0ee'], shape: 'g', spd: 40, life: .6, size: 2.4, drag: 2 });
        if (t) { decal(fx, t.x, t.y, 12, 'crack'); G.hit(u, t, u.sp.dmg); }
        G.shake(1.5);
      } });
  } };

ATTACKS.ankhat = { dur: .98, at: .45,                       // Pyramid Seal
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .7)); u.lift = p * 4; u.sy = 1 + p * .05; },
  start(G, u) { charge(G, u, .98 * .42, () => muzzle(u, 2, 37), 16, 'gold'); },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y, R = u.sp.aoe;
    groundGlow(fx, x, y, R * 1.5, '#ffd34a', 1, .7);
    // a ring of glyphs turns on the sand
    fx.add({ dur: 1.1, ground: true, draw(ctx, k) {
      const al = k < .2 ? k / .2 : 1 - Ease.seg(k, .7, 1);
      ctx.translate(x, y); ctx.scale(1, .55); ctx.rotate(k * 2);
      ctx.globalAlpha = al * .25; ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.globalAlpha = al; ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R * .78, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * .4, 0, TAU); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        ctx.rotate(TAU / 12); ctx.fillStyle = i % 3 ? '#ffd34a' : '#3de0d0';
        if (i % 2) ctx.fillRect(R * .82, -1.5, R * .13, 3); else { ctx.beginPath(); ctx.arc(R * .89, 0, 2.3, 0, TAU); ctx.fill(); }
      }
    } });
    // a pyramid of light drops out of the sky
    fx.add({ dur: .95, draw(ctx, k) {
      const py = y - 64 * (1 - Ease.outBounce(Math.min(1, k * 2.2))), S = 23, al = k > .75 ? 1 - (k - .75) / .25 : Math.min(1, k * 5);
      halo(ctx, x, py - S * .5, S * 2, '#ffe27a', al * .7);
      ctx.globalAlpha = al * .9;
      ctx.beginPath(); ctx.moveTo(x, py - S * 1.3); ctx.lineTo(x + S, py); ctx.lineTo(x - S, py); ctx.closePath();
      const gr = ctx.createLinearGradient(x - S, py, x + S, py);
      gr.addColorStop(0, 'rgba(255,225,120,.82)'); gr.addColorStop(.55, 'rgba(255,247,200,.92)'); gr.addColorStop(.56, 'rgba(240,180,60,.82)'); gr.addColorStop(1, 'rgba(220,150,40,.78)');
      ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = '#fff3c0'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, py - S * 1.3); ctx.lineTo(x + S * .12, py); ctx.stroke();
      ctx.strokeStyle = 'rgba(190,130,40,.6)'; ctx.lineWidth = .8; for (let i = 1; i < 4; i++) { const f = i / 4; ctx.beginPath(); ctx.moveTo(x - S * f, py - S * 1.3 * (1 - f)); ctx.lineTo(x + S * f, py - S * 1.3 * (1 - f)); ctx.stroke(); }
      ctx.strokeStyle = '#2a4fc0'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x - 5, py - S * .42, 4.6, 2.3, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#2a4fc0'; ctx.beginPath(); ctx.arc(x - 5, py - S * .42, 1.3, 0, TAU); ctx.fill();
      halo(ctx, x, py - S * 1.3, 9, '#ffffff', al);
    } });
    fx.after(.42, () => {
      shock(fx, x, y, 8, R, .4, '#ffd34a', true); cross(fx, x, y - 30, 30, '#fff7c0', .3);
      foesIn(G, u.side, x, y, R).forEach(e => impact(G, 'stone', bodyX(e), bodyY(e), .55, e.x, e.y));
      G.area(u, x, y, R, u.sp.dmg); G.shake(2.5);
      // sand whipped up into a slow whirl
      for (let i = 0; i < 16; i++) { const an = rnd(TAU), d = rnd(.3, .9); fx.p({ x: x + Math.cos(an) * R * d, y: y + Math.sin(an) * R * d * .55 - rnd(0, 10), vx: -Math.sin(an) * 70, vy: Math.cos(an) * 38 - 14, drag: 1.5, life: .9, size: rnd(1.6, 2.8), col: pick(['#f0d49a', '#e6b96a', '#fff3c0']), shape: i % 3 ? 'c' : 'g' }); }
    });
  } };
