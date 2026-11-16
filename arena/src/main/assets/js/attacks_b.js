'use strict';
// ---------- unique attack animations, part B: Frost, Sky, Venom, Mystic, Shadow ----------

function snowball(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#8fc0ea'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.beginPath(); ctx.arc(x + r * .2, y + r * .2, r * .6, .2, 1.6); ctx.strokeStyle = '#cfe6f8'; ctx.lineWidth = 1.2; ctx.stroke();
}
function batShape(ctx, col) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(0, -4); ctx.lineTo(4, -9); ctx.lineTo(5, -3); ctx.quadraticCurveTo(12, -10, 20, -3); ctx.quadraticCurveTo(15, -2, 13, 3); ctx.quadraticCurveTo(9, 0, 6, 4);
  ctx.lineTo(0, 6); ctx.lineTo(-6, 4); ctx.quadraticCurveTo(-9, 0, -13, 3); ctx.quadraticCurveTo(-15, -2, -20, -3); ctx.quadraticCurveTo(-12, -10, -5, -3); ctx.lineTo(-4, -9);
  ctx.closePath(); ctx.fill();
}
function star4(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .3, y - r * .3); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .3, y + r * .3);
  ctx.lineTo(x, y + r); ctx.lineTo(x - r * .3, y + r * .3); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .3, y - r * .3); ctx.closePath(); ctx.fill();
}
// lingering toxic pool that keeps ticking
function venomPuddle(G, u, x, y, r, dur, tick) {
  let acc = 0;
  G.fx.add({ dur, ground: true,
    update(dt) {
      acc += dt;
      if (acc >= .5) { acc -= .5; G.enemies(u.side).forEach(e => { if (dist2(e.x, e.y, x, y) <= r + e.r * .4) G.hit(u, e, tick, { dot: true }); }); }
      if (Math.random() < dt * 8) G.fx.p({ x: x + rnd(-r * .7, r * .7), y: y + rnd(-r * .3, r * .3), vy: -14, life: .5, size: rnd(1.4, 2.6), col: '#c8ff8a', shape: 'b' });
    },
    draw(ctx, k) {
      const al = k < .08 ? k / .08 : 1 - Ease.seg(k, .8, 1);
      ctx.globalAlpha = al * .8; ctx.fillStyle = '#7d3fc0'; ctx.beginPath(); ctx.ellipse(x, y, r, r * .5, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = al * .55; ctx.fillStyle = '#a4ff4a'; ctx.beginPath(); ctx.ellipse(x - r * .15, y - r * .05, r * .62, r * .28, 0, 0, TAU); ctx.fill();
    } });
}

// ===================== FROST =====================
ATTACKS.yetuff = { dur: .95, at: .45,                       // Snowball Smash
  pose(u, k) { lunge(u, k, 6, .5); const sq = Ease.hump(Ease.seg(k, .45, .7)); u.sx = 1 + sq * .1; u.sy = 1 + Ease.hump(Ease.seg(k, 0, .4)) * .06 - sq * .1; },
  start(G, u) {
    G.fx.add({ dur: .95 * .45, draw(ctx, k) { if (u.state !== 'active') return; const r = 3 + Ease.outCubic(k) * 8; snowball(ctx, u.x + u.ox, u.y + u.oy - 34 * u.vs - r, r); } });
  },
  fire(G, u, tg) {
    const fx = G.fx;
    shoot(G, tg, { x: u.x + u.ox, y: u.y + u.oy - 34 * u.vs - 11, speed: 380, arc: 10,
      draw(ctx, x, y) { snowball(ctx, x, y, 11); },
      hit(t, x, y) {
        fx.burst(x, y, 8, { col: '#fff', shape: 'p', spd: 55, life: .45, size: 6, grow: 8 });
        fx.burst(x, y, 9, { col: ['#fff', '#bfeaff'], shape: 'f', spd: 80, life: .6, size: 3.4, vr: 5, g: 60 });
        splat(fx, t ? t.x : x, t ? t.y : y + 14, 'rgba(255,255,255,.85)', 16, .9, true);
        G.shake(3); if (t) G.hit(u, t, u.sp.dmg);
      } });
  } };

ATTACKS.slapguin = { dur: .7, at: .3,                       // Flipper Slap
  pose(u, k) { lunge(u, k, 10, .3); u.rot = Ease.hump(Ease.seg(k, 0, .7)) * .45; },
  fire(G, u, tg) {
    const fx = G.fx, an = Math.atan2(u.ady, u.adx);
    const slap = i => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg), y = bodyY(tg), d = i ? -1 : 1;
      fx.add({ dur: .22, draw(ctx, k) {
        ctx.translate(x, y); ctx.rotate(an + d * .5); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineWidth = 2.4;
        for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(-4, 0, 7 + j * 5 + k * 6, -.7, .7); ctx.stroke(); }
      } });
      fx.burst(x, y, 5, { col: ['#dff6ff', '#8fd8ff', '#fff'], shape: 'q', spd: 90, life: .35, size: 2.6, vr: 12, ang: an, spread: 1 });
      fx.p({ x, y, life: .25, size: 7, col: '#fff', shape: 's', vr: 6 });
      G.hit(u, tg, u.sp.dmg);
    };
    slap(0); fx.after(.2, () => slap(1));
  } };

ATTACKS.lynxicle = { dur: .8, at: .55, commit: true,        // Blizzard Pounce
  pose(u, k) {
    const j = Ease.seg(k, .15, .55), f = Ease.inOut(j), sq = Ease.hump(Ease.seg(k, .55, .8));
    u.ox = u.adx * u.aC * f; u.oy = u.ady * u.aC * f; u.lift = Math.sin(j * PI) * 28;
    u.rot = j > 0 && j < 1 ? (j - .5) * .9 : 0;
    u.sy = (k < .15 ? 1 - k / .15 * .2 : 1) - sq * .15; u.sx = 1 + sq * .1;
  },
  tick(G, u, k) { if (k > .15 && k < .55 && Math.random() < .7) G.fx.p({ x: u.x + u.ox + rnd(-4, 4), y: u.y + u.oy - u.lift - u.r, vy: 20, life: .4, size: 2.6, col: '#fff', shape: 'f', vr: 4 }); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg);
    for (const d of [-1, 1]) fx.add({ dur: .28, draw(ctx, k) {
      ctx.translate(x, y); ctx.rotate(d * .8); ctx.globalAlpha = 1 - k * k; ctx.lineCap = 'round';
      const L = Ease.outCubic(Math.min(1, k * 3));
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-15 + 30 * L, 0);
      ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 6 * (1 - k * .6); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4 * (1 - k * .6); ctx.stroke();
    } });
    fx.burst(x, y, 10, { col: ['#fff', '#bfeaff'], shape: 'f', spd: 85, life: .6, size: 3.6, vr: 5 });
    fx.ring(tg.x, tg.y, 5, 24, .4, '#dff6ff', 2.4, true);
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.rimeling = { dur: .9, at: .4,                       // Frost Ray
  pose(u, k) { lunge(u, k, -4, .4); u.sy = 1 + Ease.hump(Ease.seg(k, .1, .9)) * .05; },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 20, 24);
    let ex = bodyX(tg), ey = bodyY(tg), acc = 0;
    fx.add({ dur: .45,
      update(dt) {
        if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); }
        acc += dt; if (acc > .03) { acc = 0; fx.p({ x: ex + rnd(-8, 8), y: ey + rnd(-8, 8), vy: -15, life: .4, size: 3, col: '#fff', shape: 'f', vr: 4 }); }
      },
      draw(ctx, k) {
        const al = k < .15 ? k / .15 : 1 - Ease.seg(k, .7, 1), wd = 5 * al + 1, an = Math.atan2(ey - m.y, ex - m.x), L = Math.hypot(ex - m.x, ey - m.y);
        ctx.lineCap = 'round'; ctx.globalAlpha = al;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey);
        ctx.strokeStyle = 'rgba(120,200,255,.5)'; ctx.lineWidth = wd * 2.4; ctx.stroke();
        ctx.strokeStyle = '#dff6ff'; ctx.lineWidth = wd; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = wd * .45; ctx.stroke();
        ctx.translate(m.x, m.y); ctx.rotate(an); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) { const f = (k * 2.2 + i / 4) % 1; ctx.beginPath(); ctx.ellipse(L * f, 0, 2.2, 5 + f * 4, 0, 0, TAU); ctx.stroke(); }
        ctx.translate(L, 0); ctx.rotate(-an + k * 1.5); ctx.lineWidth = 1.6;
        for (let i = 0; i < 6; i++) { ctx.rotate(PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -11 * al); ctx.moveTo(0, -7 * al); ctx.lineTo(3 * al, -9.5 * al); ctx.moveTo(0, -7 * al); ctx.lineTo(-3 * al, -9.5 * al); ctx.stroke(); }
      } });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.auroseal = { dur: 1, at: .45,                       // Aurora Veil
  pose(u, k) { u.lift = Ease.hump(Ease.seg(k, .1, .8)) * 3; u.rot = Math.sin(k * PI * 4) * .06; },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y, R = u.sp.aoe, cols = ['95,255,192', '176,138,255', '255,138,216'];
    fx.add({ dur: 1.1, draw(ctx, k) {
      const al = k < .2 ? k / .2 : 1 - Ease.seg(k, .65, 1);
      for (let b = 0; b < 3; b++) {
        const top = y - 58 - b * 5, bx = x + (b - 1) * R * .5, wv = i => Math.sin(i * .9 + k * 7 + b * 2) * 5;
        const gr = ctx.createLinearGradient(0, top, 0, y);
        gr.addColorStop(0, 'rgba(' + cols[b] + ',0)'); gr.addColorStop(.35, 'rgba(' + cols[b] + ',' + (.6 * al) + ')'); gr.addColorStop(1, 'rgba(' + cols[b] + ',0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bx - R * .45 + wv(0), top);
        for (let i = 1; i <= 6; i++) ctx.lineTo(bx - R * .45 + wv(i), top + (y - top) * i / 6);
        for (let i = 6; i >= 0; i--) ctx.lineTo(bx + R * .45 + wv(i + 2), top + (y - top) * i / 6);
        ctx.closePath(); ctx.fill();
      }
    } });
    fx.ring(x, y, 6, R, .6, '#dff6ff', 2, true);
    fx.after(.3, () => { G.area(u, x, y, R, u.sp.dmg); fx.burst(x, y - 14, 12, { col: ['#5fffc0', '#b08aff', '#ff8ad8', '#fff'], shape: 's', spd: 55, life: .7, size: 3, vr: 5, jit: R * .5 }); });
  } };

// ===================== SKY =====================
ATTACKS.wooloft = { dur: .8, at: .5,                        // Cloud Bump
  pose(u, k) { const s = 1 + Ease.seg(k, 0, .4) * .3 - (k > .5 ? Ease.outElastic(Ease.seg(k, .5, .85)) * .3 : 0); u.sx = s; u.sy = s; ram(u, k, 4, 14, .5); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    for (let i = 0; i < 7; i++) { const a2 = an + (i - 3) * .42; fx.p({ x: x - u.adx * 6, y: y - u.ady * 6, vx: Math.cos(a2) * 70, vy: Math.sin(a2) * 70, drag: 3, life: .5, size: 6, grow: 5, col: '#fff', shape: 'p' }); }
    fx.add({ dur: .3, draw(ctx, k) {
      ctx.translate(x, y); ctx.rotate(an); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(-10, 0, 16 + j * 7 + k * 10, -.6, .6); ctx.stroke(); }
    } });
    fx.text(x, y - 16, 'BOING', '#fff', 7, { dur: .5 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.kickadee = { dur: .6, at: .4,                       // Gale Kick
  pose(u, k) { lunge(u, k, 8, .4); u.lift = Ease.hump(Ease.seg(k, .05, .7)) * 9; u.rot = Ease.inOut(Ease.seg(k, .1, .6)) * TAU; u.pivot = true; },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), cx = u.x + u.ox, cy = u.y + u.oy - u.r - u.lift, an = Math.atan2(y - cy, x - cx), R = dist2(cx, cy, x, y);
    fx.slash(cx, cy, an, R + 6, 'rgba(255,255,255,.92)', { sweep: 3.2, wid: 4, dur: .24 });
    fx.slash(cx, cy, an + .4, R - 2, 'rgba(170,200,255,.85)', { sweep: 2.6, wid: 3, dur: .28, delay: .04 });
    for (let i = 0; i < 6; i++) fx.p({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: Math.cos(an) * rnd(80, 150), vy: Math.sin(an) * rnd(80, 150), life: .25, size: 3.4, col: '#fff', shape: 'k' });
    G.area(u, tg.x, tg.y, u.sp.aoe, u.sp.dmg);
  } };

ATTACKS.hummingblur = { dur: .75, at: .15,                  // Needle Flurry
  pose(u, k) { const j = Math.abs(Math.sin(Ease.seg(k, .1, .85) * PI * 5)); u.ox = u.adx * (3 + j * 9); u.oy = u.ady * (3 + j * 9) + Math.sin(k * 60) * 1.2; },
  tick(G, u, k) {
    if (k > .1 && k < .85 && Math.random() < .5) {
      const x = u.x + u.ox, y = u.y + u.oy - 21 * u.vs;
      G.fx.add({ dur: .14, draw(ctx, q) { ctx.globalAlpha = (1 - q) * .4; ctx.fillStyle = '#2fd0a0'; ctx.beginPath(); ctx.ellipse(x, y, 7, 4.5, 0, 0, TAU); ctx.fill(); } });
    }
  },
  fire(G, u, tg) {
    const fx = G.fx;
    for (let i = 0; i < 5; i++) fx.after(i * .1, () => {
      if (tg.state !== 'active' || u.state !== 'active') return;
      const x = bodyX(tg) + rnd(-6, 6), y = bodyY(tg) + rnd(-7, 7), sx = u.x + u.ox + u.face * 14 * u.vs, sy = u.y + u.oy - 29 * u.vs;
      fx.add({ dur: .1, draw(ctx, k) { ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke(); } });
      fx.p({ x, y, life: .18, size: 5, col: '#fff', shape: 's', rot: rnd(TAU) }); fx.p({ x, y, life: .2, size: 2, col: '#ff4fa0' });
      G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.pelicannon = { dur: .85, at: .4,                    // Air Cannon
  pose(u, k) { const rc = Ease.seg(k, .4, .5) - Ease.seg(k, .5, .9); u.ox = -u.adx * 5 * rc; u.oy = -u.ady * 5 * rc; u.sy = 1 + Ease.hump(Ease.seg(k, 0, .4)) * .08; },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 26, 27);
    fx.burst(m.x, m.y, 5, { col: '#fff', shape: 'p', spd: 40, life: .3, size: 4, grow: 8, ang: Math.atan2(u.ady, u.adx), spread: .8 });
    shoot(G, tg, { x: m.x, y: m.y, speed: 240, trailEvery: .06,
      draw(ctx, x, y, an, k) {
        ctx.translate(x, y); ctx.rotate(an); const s = 1 + k * .6;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(0, 0, 3.4 * s, 9 * s, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(190,210,255,.95)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(-3.4, 0, 2.4 * s, 6.5 * s, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-7.4, 0, 1.6 * s, 4 * s, 0, 0, TAU); ctx.stroke();
      },
      trail(x, y) { fx.p({ x, y, life: .25, size: 3, grow: 8, col: 'rgba(255,255,255,.8)', shape: 'r' }); },
      hit(t, x, y) {
        fx.ring(x, y, 6, 24, .3, '#fff', 2.6); fx.ring(x, y, 3, 16, .35, 'rgba(190,210,255,.95)', 1.6, false, .05);
        fx.burst(x, y, 6, { col: '#fff', shape: 'k', spd: 110, life: .22, size: 2.6 });
        if (t) G.hit(u, t, u.sp.dmg);
      } });
  } };

ATTACKS.zephyray = { dur: 1, at: .4,                        // Twister
  pose(u, k) { const p = Ease.seg(k, .05, .6); u.rot = Ease.inOut(p) * TAU; u.pivot = true; u.lift = Ease.hump(p) * 5; },
  fire(G, u, tg) {
    const fx = G.fx, sx = u.x, sy = u.y, ex = tg.x, ey = tg.y, R = u.sp.aoe;
    let done = false, acc = 0;
    fx.add({ dur: 1.15, px: sx, py: sy,
      update(dt, k, it) {
        const mv = Ease.outCubic(Math.min(1, k / .3)); it.px = lerp(sx, ex, mv); it.py = lerp(sy, ey, mv);
        if (k > .3) {
          if (!done) { done = true; G.area(u, ex, ey, R, u.sp.dmg); }
          G.enemies(u.side).forEach(e => { const d = dist2(e.x, e.y, ex, ey); if (d < R * 1.25 && d > 3) { e.x += (ex - e.x) / d * 60 * dt; e.y += (ey - e.y) / d * 60 * dt; } });
        }
        acc += dt;
        if (acc > .04) { acc = 0; const an = rnd(TAU), rr = rnd(6, 18); fx.p({ x: it.px + Math.cos(an) * rr, y: it.py - rnd(4, 40), vx: -Math.sin(an) * 90, vy: rnd(-20, 5), life: .3, size: 2.4, col: pick(['#fff', '#7fe070', '#cfe0ff']), shape: Math.random() < .4 ? 'l' : 'k', rot: rnd(TAU), vr: 9 }); }
      },
      draw(ctx, k, it) {
        const al = k < .1 ? k / .1 : 1 - Ease.seg(k, .85, 1);
        ctx.translate(it.px, it.py);
        for (let i = 0; i < 7; i++) {
          const f = i / 6, w2 = 4 + f * 15, ox = Math.sin(k * 26 + i * .9) * (2 + f * 5);
          ctx.beginPath(); ctx.ellipse(ox, -f * 46, w2, w2 * .32, 0, 0, TAU);
          ctx.globalAlpha = al * .18; ctx.fillStyle = '#fff'; ctx.fill();
          ctx.globalAlpha = al; ctx.strokeStyle = i % 2 ? '#fff' : '#cfe0ff'; ctx.lineWidth = 2.2; ctx.stroke();
        }
      } });
  } };

// ===================== VENOM =====================
ATTACKS.snoxious = { dur: 1, at: .45,                       // Shell Spray
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .2, .8)); u.sy = 1 - p * .06; u.ox = Math.sin(k * 70) * p * .8; },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x, y = u.y, R = u.sp.aoe;
    for (let i = 0; i < 14; i++) { const an = i / 14 * TAU; fx.p({ x: x + Math.cos(an) * 10, y: y - 14 + Math.sin(an) * 6, vx: Math.cos(an) * R * 2.1, vy: Math.sin(an) * R * 1.2, drag: 3, life: .75, size: 6, grow: 6, col: i % 2 ? 'rgba(170,255,90,.75)' : 'rgba(180,95,224,.7)', shape: 'p' }); }
    for (let i = 0; i < 10; i++) { const an = rnd(TAU); fx.p({ x, y: y - 14, vx: Math.cos(an) * 120, vy: Math.sin(an) * 70, drag: 2.5, life: .4, size: 2.2, col: '#a4ff4a', shape: 'd' }); }
    fx.ring(x, y, 10, R, .5, '#b45fe0', 3, true);
    G.area(u, x, y, R, u.sp.dmg);
  } };

ATTACKS.scorplet = { dur: .75, at: .45,                     // Tail Sting
  pose(u, k) { ram(u, k, 3, 8, .45); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), sx = x - u.face * 14, sy = y - 26, an = Math.atan2(y - sy, x - sx);
    fx.add({ dur: .22, draw(ctx, k) {
      const L = Ease.outCubic(Math.min(1, k * 3)), hx = lerp(sx, x, L), hy = lerp(sy, y, L);
      ctx.globalAlpha = 1 - k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy);
      ctx.strokeStyle = '#a4ff4a'; ctx.lineWidth = 4 * (1 - k * .5); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.translate(hx, hy); ctx.rotate(an); ctx.fillStyle = '#a4ff4a'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-3, -3.4); ctx.lineTo(-3, 3.4); ctx.closePath(); ctx.fill();
    } });
    fx.after(.07, () => {
      fx.burst(x, y, 6, { col: ['#a4ff4a', '#b45fe0'], shape: 'd', spd: 60, life: .4, size: 2.4, g: 160, up: 20 });
      fx.burst(x, y, 5, { col: '#c88af0', shape: 'b', spd: 20, life: .8, size: 3, up: 26, g: -20 });
      fx.pow(x, y, 8, '#b45fe0', '#d8ff9a'); G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.hopdart = { dur: .85, at: .4,                       // Dart Leap
  pose(u, k) {
    const j = Ease.seg(k, .12, .4), stick = Ease.seg(k, .4, .55), b = Ease.seg(k, .55, .95), f = j < 1 ? Ease.inOut(j) : 1 - Ease.inOut(b);
    u.ox = u.adx * u.aC * f; u.oy = u.ady * u.aC * f;
    u.lift = j < 1 ? Math.sin(j * PI) * 18 : stick < 1 ? 0 : Math.sin(b * PI) * 14;
    if (k < .12) { u.sy = 1 - k / .12 * .2; u.sx = 1 + k / .12 * .12; } else if (stick > 0 && stick < 1) { u.sy = .85; u.sx = 1.12; }
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg);
    splat(fx, x, y, '#ffd12e', 13, .7); splat(fx, x + 3, y + 2, '#7d42c8', 7, .7);
    fx.burst(x, y, 9, { col: ['#ffd12e', '#a4ff4a', '#7d42c8'], shape: 'd', spd: 85, life: .4, size: 2.6, g: 180 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.hissyfit = { dur: .85, at: .45,                     // Venom Spit
  pose(u, k) { lunge(u, k, 4, .45); },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 9, 27);
    shoot(G, tg, { x: m.x, y: m.y, speed: 200, arc: 26,
      draw(ctx, x, y, an) {
        ctx.translate(x, y); ctx.rotate(an); ctx.fillStyle = '#8c3fd0';
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.quadraticCurveTo(0, -5.5, -10, 0); ctx.quadraticCurveTo(0, 5.5, 6, 0); ctx.fill();
        ctx.fillStyle = '#a4ff4a'; ctx.beginPath(); ctx.arc(1.5, 0, 2.6, 0, TAU); ctx.fill();
      },
      trail(x, y) { fx.p({ x, y, vy: 20, life: .3, size: 1.8, col: '#a4ff4a' }); },
      hit(t, x, y) {
        fx.burst(x, y, 7, { col: ['#a4ff4a', '#b45fe0'], shape: 'd', spd: 70, life: .35, size: 2.4, g: 180 });
        if (t) G.hit(u, t, u.sp.dmg);
        venomPuddle(G, u, t ? t.x : x, t ? t.y : y + 12, 26, u.sp.puddle, 12);
      } });
  } };

ATTACKS.bubbrew = { dur: .95, at: .45,                      // Hex Brew
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .6)); u.lift = p * 5; u.sy = 1 + p * .05; },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 0, 30), gx = tg.x, gy = tg.y, R = u.sp.aoe;
    fx.add({ dur: .42,
      draw(ctx, k) {
        ctx.translate(lerp(m.x, gx, k), lerp(m.y, gy - 6, k) - Math.sin(k * PI) * 34); ctx.rotate(k * 14);
        ctx.strokeStyle = '#1f0f33'; ctx.lineWidth = 1.2;
        ctx.fillStyle = 'rgba(210,255,225,.92)'; ctx.beginPath(); ctx.arc(0, 2, 5, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8fff5a'; ctx.beginPath(); ctx.arc(0, 2, 4.2, .15, PI - .15); ctx.fill();
        ctx.fillStyle = 'rgba(210,255,225,.92)'; ctx.fillRect(-1.8, -7, 3.6, 5); ctx.strokeRect(-1.8, -7, 3.6, 5);
        ctx.fillStyle = '#a8743c'; ctx.fillRect(-2.2, -9.4, 4.4, 2.6);
      },
      end() {
        fx.burst(gx, gy - 6, 6, { col: '#dfffe8', shape: 'q', spd: 90, life: .35, size: 2.4, vr: 12, g: 200, up: 40 });
        for (let i = 0; i < 9; i++) { const an = i / 9 * TAU; fx.p({ x: gx + Math.cos(an) * 6, y: gy - 8 + Math.sin(an) * 4, vx: Math.cos(an) * R * 1.6, vy: Math.sin(an) * R * .9 - 8, drag: 3, life: 1, size: 8, grow: 7, col: i % 2 ? 'rgba(143,255,90,.6)' : 'rgba(180,95,224,.55)', shape: 'p' }); }
        fx.burst(gx, gy - 10, 8, { col: ['#c8ff8a', '#e2b4f5'], shape: 'b', spd: 30, life: .9, size: 3, up: 30, g: -25, jit: R * .4 });
        fx.ring(gx, gy, 6, R, .45, '#8fff5a', 2.4, true); G.area(u, gx, gy, R, u.sp.dmg);
      } });
  } };

// ===================== MYSTIC =====================
ATTACKS.monolit = { dur: 1, at: .5,                         // Rune Pulse
  pose(u, k) { u.lift = Ease.hump(Ease.seg(k, .1, .6)) * 7; u.sy = 1 - Ease.hump(Ease.seg(k, .5, .7)) * .08; },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x, y = u.y, R = u.sp.aoe;
    fx.add({ dur: .75, ground: true, draw(ctx, k) {
      const r = lerp(8, R, Ease.outCubic(k));
      ctx.translate(x, y); ctx.scale(1, .55); ctx.globalAlpha = 1 - k * k;
      ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, r * .7, 0, TAU); ctx.stroke();
      ctx.rotate(k * 1.5);
      for (let q = 0; q < 2; q++) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const an = i * TAU / 3 + q * PI; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * r * .7, Math.sin(an) * r * .7); } ctx.closePath(); ctx.stroke(); }
      ctx.fillStyle = '#fff3c0';
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate(i * TAU / 6 + PI / 6); ctx.translate(r * .86, 0);
        if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.fill(); }
        else if (i % 3 === 1) { ctx.beginPath(); ctx.moveTo(0, -2.8); ctx.lineTo(2.6, 2.2); ctx.lineTo(-2.6, 2.2); ctx.closePath(); ctx.fill(); }
        else ctx.fillRect(-1, -3, 2, 6);
        ctx.restore();
      }
    } });
    fx.flash(x, y - 20, 16, '#ffe27a', .25);
    G.area(u, x, y, R, u.sp.dmg); G.shield(u, u.sp.shield);
  } };

ATTACKS.chipmonk = { dur: .7, at: .42,                      // Chi Palm
  pose(u, k) { ram(u, k, 3, 8, .42); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), m = muzzle(u, 20, 14), an = Math.atan2(y - m.y, x - m.x);
    fx.add({ dur: .34, draw(ctx, k) {
      ctx.translate(m.x, m.y); ctx.rotate(an); ctx.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        const q = clamp(k * 1.6 - j * .2, 0, 1); if (q <= 0 || q >= 1) continue;
        ctx.globalAlpha = (1 - q) * .9; ctx.strokeStyle = j % 2 ? '#fff' : '#b9a4ff'; ctx.lineWidth = 3 - j * .5;
        ctx.beginPath(); ctx.arc(-8 + q * 26, 0, 8 + q * 12, -.8, .8); ctx.stroke();
      }
    } });
    fx.add({ dur: .42, delay: .06, draw(ctx, k) {
      const s = .7 + Ease.outBack(Math.min(1, k * 2.5)) * .5;
      ctx.translate(x, y); ctx.globalAlpha = 1 - k * k; ctx.scale(s, s); ctx.fillStyle = '#e6dcff';
      ctx.beginPath(); ctx.ellipse(0, 2, 5, 5.6, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-5.4 + i * 3.6, -5.6 - (i === 1 || i === 2 ? 1.6 : 0), 1.5, 2.6, (i - 1.5) * .18, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(-7, 1, 1.6, 2.4, -.8, 0, TAU); ctx.fill();
    } });
    fx.ring(x, y, 4, 18, .3, '#b9a4ff', 2);
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.telemur = { dur: .75, at: .45, commit: true,        // Blink Strike
  pose(u, k) {
    if (k < .2) { const s = 1 - Ease.inCubic(k / .2); u.sx = s; u.sy = 2 - s; u.al = s; }
    else { u.ox = u.adx * u.aD; u.oy = u.ady * u.aD; u.flip = true; if (k < .3) u.hide = true; else { const s = Ease.outBack(Ease.seg(k, .3, .45)); u.sx = s; u.sy = s; } }
  },
  start(G, u) {
    const x = u.x, y = u.y - u.r;
    G.fx.after(.13, () => { G.fx.burst(x, y, 8, { col: ['#ffc93d', '#fff', '#b9a4ff'], shape: 's', spd: 60, life: .45, size: 3.4, vr: 8 }); G.fx.ring(x, y, 3, 16, .3, '#b9a4ff', 2); });
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), ax = u.x + u.ox, ay = u.y + u.oy - u.r;
    fx.burst(ax, ay, 6, { col: ['#ffc93d', '#fff'], shape: 's', spd: 50, life: .4, size: 3, vr: 8 });
    fx.add({ dur: .36, draw(ctx, k) {
      ctx.translate(x, y); ctx.globalAlpha = 1 - k * k;
      const s = 8 + Ease.outCubic(k) * 10; ctx.rotate(k * 1.4 - .3);
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = -PI / 2 + i * PI / 5, rr = i % 2 ? s * .45 : s; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.strokeStyle = '#ffc93d'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.globalAlpha *= .3; ctx.fillStyle = '#fff3c0'; ctx.fill();
    } });
    fx.add({ dur: .2, draw(ctx, k) {
      ctx.globalAlpha = 1 - k; ctx.lineCap = 'round'; const L = Ease.outCubic(Math.min(1, k * 3));
      ctx.beginPath(); ctx.moveTo(x - 16, y - 12); ctx.lineTo(x - 16 + 32 * L, y - 12 + 24 * L);
      ctx.strokeStyle = '#b9a4ff'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    } });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.mageling = { dur: .9, at: .5,                       // Arcane Orb
  pose(u, k) { u.lift = Ease.hump(Ease.seg(k, .05, .6)) * 5; lunge(u, k, -3, .5); },
  start(G, u) {
    G.fx.add({ dur: .9 * .62, draw(ctx, k) {
      if (u.state !== 'active') return;
      const m = muzzle(u, 24, 20), al = k < .2 ? k / .2 : 1 - Ease.seg(k, .8, 1), R = 13 * Ease.outBack(Math.min(1, k * 2.5));
      ctx.translate(m.x, m.y); ctx.scale(.5, 1); ctx.globalAlpha = al;
      ctx.strokeStyle = '#2fe0c8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#d6c4ff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, R * .72, 0, TAU); ctx.stroke();
      ctx.rotate(k * 5); ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const an = i * TAU * 2 / 5; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * R * .72, Math.sin(an) * R * .72); }
      ctx.stroke();
    } });
  },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 24, 20);
    shoot(G, tg, { x: m.x, y: m.y, speed: 250, trailEvery: .03,
      draw(ctx, x, y, an, k, it) {
        ctx.fillStyle = 'rgba(125,66,232,.35)'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#b48aff'; ctx.beginPath(); ctx.arc(x, y, 5.2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 1, y - 1, 2.2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2fe0c8';
        for (let i = 0; i < 3; i++) { const a2 = it.t * 14 + i * TAU / 3; star4(ctx, x + Math.cos(a2) * 10, y + Math.sin(a2) * 5.5, 2.8); }
      },
      trail(x, y) { fx.p({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), life: .35, size: 2.4, col: pick(['#b48aff', '#2fe0c8', '#ffc93d']), shape: 's', vr: 6 }); },
      hit(t, x, y) {
        fx.add({ dur: .4, draw(ctx, k) {
          const R = 6 + Ease.outCubic(k) * 16; ctx.translate(x, y); ctx.globalAlpha = 1 - k * k;
          ctx.strokeStyle = '#b48aff'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
          ctx.rotate(k * 2); ctx.strokeStyle = '#2fe0c8'; ctx.lineWidth = 1.4; ctx.beginPath();
          for (let i = 0; i <= 5; i++) { const an = i * TAU * 2 / 5; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * R, Math.sin(an) * R); }
          ctx.stroke();
        } });
        fx.flash(x, y, 12, '#d6c4ff', .18);
        fx.burst(x, y, 9, { col: ['#b48aff', '#2fe0c8', '#ffc93d', '#fff'], shape: 's', spd: 90, life: .45, size: 3.4, vr: 8 });
        if (t) G.hit(u, t, u.sp.dmg);
      } });
  } };

ATTACKS.lunafawn = { dur: .95, at: .45,                     // Moonbeam
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .05, .7)); u.lift = p * 4; u.rot = -p * .08; },
  fire(G, u, tg) {
    const fx = G.fx;
    const beam = (t, col, heal) => {
      fx.add({ dur: .6, draw(ctx, k) {
        if (t.state !== 'active') return;
        const x = t.x, y = t.y, al = k < .2 ? k / .2 : 1 - Ease.seg(k, .6, 1), top = y - 120, w0 = 4 + al * 4, w1 = t.r * 1.1;
        const gr = ctx.createLinearGradient(0, top, 0, y);
        gr.addColorStop(0, 'rgba(' + col + ',0)'); gr.addColorStop(.5, 'rgba(' + col + ',' + (.55 * al) + ')'); gr.addColorStop(1, 'rgba(' + col + ',' + (.8 * al) + ')');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - w0, top); ctx.lineTo(x + w0, top); ctx.lineTo(x + w1, y); ctx.lineTo(x - w1, y); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = al * .5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, w1, w1 * .4, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = al; ctx.translate(x, top + 44 - k * 6); ctx.rotate(-.5); ctx.fillStyle = '#ffe680';
        ctx.beginPath(); ctx.arc(0, 0, 6, -PI * .5, PI * .5); ctx.quadraticCurveTo(6.3, 0, 0, -6); ctx.fill();
      } });
      for (let i = 0; i < 6; i++) fx.p({ x: t.x + rnd(-8, 8), y: t.y - rnd(40, 90), vy: rnd(40, 70), life: .6, size: 2.6, col: heal ? '#eaffd0' : '#fff7c0', shape: 's', vr: 4 });
    };
    beam(tg, '255,240,170', false); G.hit(u, tg, u.sp.dmg);
    const al = G.weakestAlly(u.side);
    if (al) fx.after(.15, () => { if (al.state !== 'active') return; beam(al, '200,255,220', true); G.heal(al, u.sp.healOne, '#eaffd0'); });
  } };

// ===================== SHADOW =====================
ATTACKS.cryptoise = { dur: 1, at: .4,                       // Grave Rise
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .5)); u.sy = 1 - p * .1; u.sx = 1 + p * .06; },
  fire(G, u, tg) {
    const fx = G.fx, pts = [.35, .62, .88].map(f => ({ x: lerp(u.x, tg.x, f), y: lerp(u.y, tg.y, f) }));
    pts.forEach((p, i) => {
      const d = i * .13;
      fx.after(d, () => fx.burst(p.x, p.y, 5, { col: 'rgba(125,105,145,.8)', shape: 'p', spd: 28, life: .4, size: 4, grow: 7, flat: .5 }));
      fx.add({ dur: .75, delay: d, draw(ctx, k) {
        const h = k < .2 ? Ease.outBack(k / .2) : k > .7 ? 1 - Ease.inCubic((k - .7) / .3) : 1, s = .8 + i * .15;
        ctx.translate(p.x, p.y); ctx.scale(s, s);
        ctx.beginPath(); ctx.rect(-14, -44, 28, 44); ctx.clip(); ctx.translate(0, (1 - h) * 27);
        ctx.fillStyle = '#a29cb4'; ctx.strokeStyle = '#231a33'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-8, -14); ctx.quadraticCurveTo(-8, -24, 0, -24); ctx.quadraticCurveTo(8, -24, 8, -14); ctx.lineTo(8, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#5d566e'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(0, -14, 3.4, -PI * .5, PI * .5); ctx.quadraticCurveTo(2.6, -14, 0, -17.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.stroke();
      } });
    });
    fx.after(.36, () => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg), y = bodyY(tg);
      fx.burst(x, y, 8, { col: ['#b06aff', '#e8d0ff'], spd: 50, life: .6, size: 2.6, up: 40, g: -30 });
      fx.ring(tg.x, tg.y, 4, 20, .35, '#b06aff', 2.4, true);
      G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.obsidrake = { dur: .8, at: .5,                      // Night Fang
  pose(u, k) { ram(u, k, 4, 10, .5); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg);
    const jaw = ctx => {
      ctx.fillStyle = '#2a1f3a'; ctx.beginPath(); ctx.moveTo(-16, -14); ctx.quadraticCurveTo(0, -24, 16, -14); ctx.lineTo(16, -4); ctx.lineTo(-16, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ff3a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-16, -14); ctx.quadraticCurveTo(0, -24, 16, -14); ctx.stroke();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 4; i++) { const tx = -13 + i * 8.6; ctx.beginPath(); ctx.moveTo(tx - 3.4, -4); ctx.lineTo(tx, 4 + (i % 3 === 0 ? 3 : 0)); ctx.lineTo(tx + 3.4, -4); ctx.closePath(); ctx.fill(); }
    };
    fx.add({ dur: .38, draw(ctx, k) {
      const gap = 17 * (1 - (k < .45 ? Ease.inCubic(k / .45) : 1));
      ctx.translate(x, y); ctx.globalAlpha = k > .6 ? 1 - (k - .6) / .4 : 1;
      ctx.save(); ctx.translate(0, -gap); jaw(ctx); ctx.restore();
      ctx.save(); ctx.scale(1, -1); ctx.translate(0, -gap); jaw(ctx); ctx.restore();
    } });
    fx.after(.17, () => {
      fx.flash(x, y, 16, '#ff2a3c', .2);
      fx.burst(x, y, 8, { col: ['#ff3a4a', '#2a1f3a'], shape: 'q', spd: 90, life: .35, size: 2.6, vr: 10 });
      G.shake(2); G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.shinobat = { dur: .6, at: .36, commit: true,        // Echo Swoop
  pose(u, k) { travel(u, k, .12, .55, u.aD); const h = Ease.hump(Ease.seg(k, .12, .55)); u.lift = -h * 8; u.sx = 1 + h * .2; u.rot = h * .3; },
  start(G, u) {
    const x0 = u.x, y0 = u.y, dx = u.adx * u.aD, dy = u.ady * u.aD, up = 17 * u.vs, face = u.face;
    for (let i = 1; i <= 3; i++) G.fx.add({ dur: .38, delay: .07 + i * .055, draw(ctx, k) {
      const f = Ease.inOut(Math.min(1, k * 1.3));
      ctx.translate(x0 + dx * f, y0 + dy * f - up + Math.sin(f * PI) * 8); ctx.scale(face, 1); ctx.globalAlpha = (1 - k) * .5;
      batShape(ctx, '#3f3368');
    } });
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    fx.slash(x - u.adx * 12, y - u.ady * 12, an, 16, '#8a5cff', { sweep: 2.2, wid: 6, dur: .24, edge: '#ff3a5c' });
    fx.burst(x, y, 7, { col: ['#8a5cff', '#ff3a5c', '#2a1f4a'], shape: 'k', spd: 100, life: .28, size: 2.6 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.lumbra = { dur: .9, at: .35,                        // Wisp Spiral
  pose(u, k) { u.lift = Ease.hump(Ease.seg(k, .05, .8)) * 4; },
  fire(G, u, tg) {
    const fx = G.fx;
    for (let i = 0; i < 3; i++) {
      const m = muzzle(u, 16, 25), ph = i * TAU / 3;
      let ex = bodyX(tg), ey = bodyY(tg), acc = 0;
      fx.add({ dur: Math.max(.3, dist2(m.x, m.y, ex, ey) / 170), delay: i * .12, px: m.x, py: m.y,
        update(dt, k, it) {
          if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); }
          const dx = ex - m.x, dy = ey - m.y, len = Math.hypot(dx, dy) || 1, off = Math.sin(k * TAU * 1.5 + ph) * 14 * Math.sin(k * PI);
          it.px = m.x + dx * k - dy / len * off; it.py = m.y + dy * k + dx / len * off;
          acc += dt; if (acc > .03) { acc = 0; fx.p({ x: it.px, y: it.py, life: .3, size: 2.4, col: pick(['#5ad0ff', '#b8ecff', '#8a7aff']) }); }
        },
        draw(ctx, k, it) {
          ctx.fillStyle = 'rgba(90,208,255,.35)'; ctx.beginPath(); ctx.arc(it.px, it.py, 6.5, 0, TAU); ctx.fill();
          ctx.fillStyle = '#5ad0ff'; ctx.beginPath(); ctx.arc(it.px, it.py, 3.8, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(it.px, it.py, 1.8, 0, TAU); ctx.fill();
        },
        end() {
          fx.burst(ex, ey, 6, { col: ['#5ad0ff', '#e6fbff', '#8a7aff'], spd: 50, life: .4, size: 2.6, up: 30, g: -40 });
          fx.ring(ex, ey, 3, 12, .25, '#5ad0ff', 1.8);
          if (tg.state === 'active') G.hit(u, tg, u.sp.dmg);
        } });
    }
  } };

ATTACKS.omencrow = { dur: 1, at: .45,                       // Nightfall
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .05, .7)); u.lift = p * 6; u.sy = 1 + p * .05; },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y, R = u.sp.aoe;
    fx.add({ dur: 1.1, ground: true, draw(ctx, k) {
      const al = k < .2 ? k / .2 : 1 - Ease.seg(k, .75, 1), g = Ease.outCubic(Math.min(1, k * 3));
      ctx.beginPath(); ctx.ellipse(x, y, R * g, R * .55 * g, 0, 0, TAU);
      ctx.globalAlpha = al * .7; ctx.fillStyle = '#1a1030'; ctx.fill();
      ctx.globalAlpha = al; ctx.strokeStyle = '#ff4ad0'; ctx.lineWidth = 1.6; ctx.stroke();
    } });
    fx.add({ dur: 1, draw(ctx, k) {
      const ey = y - 66; ctx.globalAlpha = k < .2 ? k / .2 : 1 - Ease.seg(k, .7, 1);
      ctx.fillStyle = 'rgba(255,74,208,.35)'; ctx.beginPath(); ctx.arc(x, ey, 13 + Math.sin(k * 20) * 1.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff4ad0'; ctx.beginPath(); ctx.arc(x, ey, 10, 0, TAU); ctx.fill();
      ctx.fillStyle = '#120c22'; ctx.beginPath(); ctx.arc(x + (1 - Math.min(1, k * 2.5)) * 9, ey, 9, 0, TAU); ctx.fill();
    } });
    for (let i = 0; i < 5; i++) {
      const an = i / 5 * TAU + .4, hx = x + Math.cos(an) * R * .55, hy = y + Math.sin(an) * R * .3;
      fx.add({ dur: .8, delay: .12 + i * .05, draw(ctx, k) {
        const h = Ease.hump(k) * 22, sw = Math.sin(k * 10 + i) * 3;
        ctx.translate(hx, hy); ctx.globalAlpha = .9; ctx.strokeStyle = '#2a1f4a'; ctx.lineCap = 'round'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sw, -h * .5, sw * .5, -h); ctx.stroke();
        ctx.lineWidth = 1.8;
        for (let f = -1; f <= 1; f++) { ctx.beginPath(); ctx.moveTo(sw * .5, -h); ctx.lineTo(sw * .5 + f * 3.4, -h - 4.6 * (h / 22)); ctx.stroke(); }
      } });
    }
    fx.after(.3, () => { G.area(u, x, y, R, u.sp.dmg); fx.burst(x, y - 10, 10, { col: ['#ff4ad0', '#8a7aff'], shape: 's', spd: 60, life: .5, size: 3, vr: 6, jit: R * .4 }); });
  } };
