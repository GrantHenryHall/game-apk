'use strict';
// ---------- unique attack animations, part B: Frost, Sky, Venom, Mystic, Shadow ----------

function snowball(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#8fc0ea'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.beginPath(); ctx.arc(x + r * .2, y + r * .2, r * .6, .2, 1.6); ctx.strokeStyle = '#cfe6f8'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#e4f3ff'; ctx.beginPath(); ctx.arc(x - r * .35, y - r * .3, r * .22, 0, TAU); ctx.fill();
}
function batShape(ctx, col) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(0, -4); ctx.lineTo(4, -9); ctx.lineTo(5, -3); ctx.quadraticCurveTo(12, -10, 20, -3); ctx.quadraticCurveTo(15, -2, 13, 3); ctx.quadraticCurveTo(9, 0, 6, 4);
  ctx.lineTo(0, 6); ctx.lineTo(-6, 4); ctx.quadraticCurveTo(-9, 0, -13, 3); ctx.quadraticCurveTo(-15, -2, -20, -3); ctx.quadraticCurveTo(-12, -10, -5, -3); ctx.lineTo(-4, -9);
  ctx.closePath(); ctx.fill();
}
// an open hand, centred on the palm
function palmShape(ctx) {
  ctx.beginPath(); ctx.ellipse(0, 2, 5, 5.6, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-5.4 + i * 3.6, -5.6 - (i === 1 || i === 2 ? 1.6 : 0), 1.5, 2.7, (i - 1.5) * .18, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(-7, 1, 1.6, 2.4, -.8, 0, TAU); ctx.fill();
}
// lingering toxic pool that keeps ticking
function venomPuddle(G, u, x, y, r, dur, tick) {
  let acc = 0;
  G.fx.add({ dur, ground: true,
    update(dt) {
      acc += dt;
      if (acc >= .5) { acc -= .5; G.enemies(u.side).forEach(e => { if (dist2(e.x, e.y, x, y) <= r + e.r * .4) G.hit(u, e, tick, { dot: true }); }); }
      if (Math.random() < dt * 9) G.fx.p({ x: x + rnd(-r * .7, r * .7), y: y + rnd(-r * .3, r * .3), vy: -14, life: .55, size: rnd(1.4, 2.8), col: pick(['#c8ff8a', '#d9b0ff']), shape: 'b' });
      if (Math.random() < dt * 3) G.fx.p({ x: x + rnd(-r * .5, r * .5), y: y - 2, vy: -16, life: .9, size: 4, grow: 6, col: 'rgba(150,235,90,.3)', shape: 'p' });
    },
    draw(ctx, k) {
      const al = k < .08 ? k / .08 : 1 - Ease.seg(k, .8, 1), wob = 1 + Math.sin(k * 40) * .03;
      ctx.translate(x, y); halo(ctx, 0, 0, r * 1.3, '#a4ff4a', al * .35);
      ctx.globalAlpha = al * .82; ctx.fillStyle = '#7d3fc0'; ctx.beginPath(); ctx.ellipse(0, 0, r * wob, r * .5, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = al * .6; ctx.fillStyle = '#a4ff4a'; ctx.beginPath(); ctx.ellipse(-r * .15, -r * .05, r * .62, r * .28, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = al * .8; ctx.strokeStyle = '#e2c4ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, 0, r * wob, r * .5, 0, PI * 1.1, PI * 1.7); ctx.stroke();
    } });
}

// ===================== FROST =====================
ATTACKS.yetuff = { dur: 1, at: .45,                         // Snowball Smash
  pose(u, k) { lunge(u, k, 6, .5); const sq = Ease.hump(Ease.seg(k, .45, .7)); u.sx = 1 + sq * .1; u.sy = 1 + Ease.hump(Ease.seg(k, 0, .4)) * .06 - sq * .1; },
  start(G, u) {
    charge(G, u, .42, () => ({ x: u.x + u.ox, y: u.y + u.oy - 34 * u.vs - 9 }), 21);
    G.fx.add({ dur: .45, draw(ctx, k) { if (u.state !== 'active') return; const r = 3 + Ease.outCubic(k) * 9; snowball(ctx, u.x + u.ox, u.y + u.oy - 34 * u.vs - r, r); } });
  },
  fire(G, u, tg) {
    const fx = G.fx;
    shoot(G, tg, { x: u.x + u.ox, y: u.y + u.oy - 34 * u.vs - 12, speed: 340, arc: 12, tail: { n: 9, w: 10, col: '#ffffff', al: .55 },
      draw(ctx, x, y, an, k) { ctx.translate(x, y); ctx.rotate(k * 6); snowball(ctx, 0, 0, 12); },
      trail(x, y) { fx.p({ x: x + rnd(-5, 5), y: y + rnd(-5, 5), vy: 20, life: .5, size: 2.8, col: '#ffffff', shape: 'f', vr: 4 }); },
      hit(t, x, y) {
        fx.burst(x, y, 9, { col: ['rgba(255,255,255,.95)', 'rgba(228,243,255,.9)'], shape: 'p', spd: 60, life: .5, size: 6.5, grow: 9, drag: 2 });
        fx.burst(x, y, 8, { col: '#ffffff', spd: 95, life: .55, size: 3, up: 60, g: 340 });   // clumps of snow
        impact(G, 'frost', x, y, 1.3, t ? t.x : x, t ? t.y : y + 14);
        decal(fx, t ? t.x : x, t ? t.y : y + 14, 17, 'snow');
        G.shake(3.5); if (t) G.hit(u, t, u.sp.dmg);
      } });
  } };

ATTACKS.slapguin = { dur: .74, at: .3,                      // Flipper Slap
  pose(u, k) { lunge(u, k, 10, .3); u.rot = Ease.hump(Ease.seg(k, 0, .7)) * .45; },
  start(G, u) {
    // it slides in on its belly, leaving a streak of ice
    const x0 = u.x, y0 = u.y, x1 = u.x + u.adx * Math.max(10, u.aC * .92), y1 = u.y + u.ady * Math.max(10, u.aC * .92);
    G.fx.add({ dur: 1.2, ground: true, draw(ctx, k) {
      const g = Math.min(1, k * 5); ctx.lineCap = 'round'; ctx.globalAlpha = (1 - Ease.seg(k, .4, 1)) * .8;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, g), lerp(y0, y1, g));
      ctx.strokeStyle = '#dff6ff'; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
    } });
  },
  tick(G, u, k) { if (k < .3) G.fx.p({ x: u.x + u.ox - u.adx * 6 + rnd(-4, 4), y: u.y + u.oy - rnd(0, 6), vx: -u.adx * 50 + rnd(-20, 20), vy: -u.ady * 50 - 30, g: 200, life: .35, size: 2.4, col: pick(['#ffffff', '#bfeaff']), shape: 'q', vr: 10, rot: rnd(TAU) }); },
  fire(G, u, tg) {
    const fx = G.fx, an = Math.atan2(u.ady, u.adx);
    const slap = i => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg), y = bodyY(tg), d = i ? -1 : 1;
      fx.add({ dur: .26, draw(ctx, k) {
        ctx.translate(x, y); ctx.rotate(an + d * .5); ctx.lineCap = 'round';
        for (let j = 0; j < 3; j++) {
          ctx.beginPath(); ctx.arc(-4, 0, 8 + j * 5.5 + k * 7, -.75, .75);
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .5; ctx.strokeStyle = '#aef2ff'; ctx.lineWidth = 6; ctx.stroke();
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.stroke();
        }
      } });
      fx.pow(x, y, i ? 11 : 8, '#8fd8ff', '#ffffff');
      impact(G, 'frost', x, y, i ? .8 : .55, tg.x, tg.y);
      if (i) G.shake(1.5);
      G.hit(u, tg, u.sp.dmg);
    };
    slap(0); fx.after(.2, () => slap(1));
  } };

ATTACKS.lynxicle = { dur: .84, at: .55, commit: true,       // Blizzard Pounce
  pose(u, k) {
    const j = Ease.seg(k, .15, .55), f = Ease.inOut(j), sq = Ease.hump(Ease.seg(k, .55, .8));
    u.ox = u.adx * u.aC * f; u.oy = u.ady * u.aC * f; u.lift = Math.sin(j * PI) * 30;
    u.rot = j > 0 && j < 1 ? (j - .5) * .9 : 0;
    u.sy = (k < .15 ? 1 - k / .15 * .2 : 1) - sq * .15; u.sx = 1 + sq * .1;
  },
  start(G, u) { G.fx.burst(u.x, u.y, 5, { col: 'rgba(255,255,255,.85)', shape: 'p', spd: 26, life: .4, size: 4, grow: 8, flat: .5 }); },
  tick(G, u, k, dt) {
    if (k > .15 && k < .55) {
      G.fx.p({ x: u.x + u.ox + rnd(-5, 5), y: u.y + u.oy - u.lift - u.r + rnd(-4, 4), vy: 22, life: .5, size: 2.8, col: pick(['#ffffff', '#bfeaff']), shape: Math.random() < .5 ? 'f' : 'g', vr: 4 });
      if (every(u, dt, .05)) ghost(G, u, .36, .22);
    }
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), gx = tg.x, gy = tg.y;
    // crossed ice claws
    for (const d of [-1, 1]) fx.add({ dur: .32, draw(ctx, k) {
      ctx.translate(x, y); ctx.rotate(d * .8); ctx.lineCap = 'round';
      const L = Ease.outCubic(Math.min(1, k * 3));
      ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-17 + 34 * L, 0);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .7; ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 11 * (1 - k * .5); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k * k; ctx.strokeStyle = '#dff6ff'; ctx.lineWidth = 4.4 * (1 - k * .6); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.stroke();
    } });
    // icicles spring up in a ring around the landing
    for (let i = 0; i < 6; i++) {
      const a2 = i / 6 * TAU + .5, px = gx + Math.cos(a2) * 21, py = gy + Math.sin(a2) * 11.5, hh = rnd(11, 16);
      fx.add({ dur: .8, delay: .03 * i, draw(ctx, k) {
        const h = (k < .2 ? Ease.outBack(k / .2) : 1 - Ease.seg(k, .6, 1)) * hh;
        ctx.translate(px, py); ctx.beginPath(); ctx.moveTo(-3.2, 0); ctx.lineTo(0, -h); ctx.lineTo(3.2, 0); ctx.closePath();
        ctx.fillStyle = '#cdf1ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-.8, -h * .85); ctx.lineTo(-1.2, -1); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
      } });
    }
    shock(fx, gx, gy, 5, 28, .4, '#aef2ff', true);
    impact(G, 'frost', x, y, 1.1, gx, gy);
    G.shake(2.5); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.rimeling = { dur: .92, at: .4,                      // Frost Ray
  pose(u, k) { lunge(u, k, -4, .4); u.sy = 1 + Ease.hump(Ease.seg(k, .1, .9)) * .05; },
  start(G, u) { charge(G, u, .92 * .38, () => muzzle(u, 20, 24), 17); },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 20, 24);
    let ex = bodyX(tg), ey = bodyY(tg), acc = 0;
    cross(fx, m.x, m.y, 20, '#ffffff', .25);
    fx.add({ dur: .5,
      update(dt) {
        if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); }
        acc += dt; if (acc < .03) return; acc = 0;
        fx.p({ x: ex + rnd(-9, 9), y: ey + rnd(-9, 9), vy: -15, life: .45, size: 3, col: '#ffffff', shape: 'f', vr: 4 });
        const f = rnd(.1, .9); fx.p({ x: lerp(m.x, ex, f), y: lerp(m.y, ey, f) + rnd(-3, 3), vy: 26, life: .5, size: 2.2, col: pick(['#ffffff', '#aef2ff']), shape: Math.random() < .5 ? 'f' : 'g', vr: 3 });
      },
      draw(ctx, k) {
        const al = k < .15 ? k / .15 : 1 - Ease.seg(k, .7, 1), wd = 5.5 * al + 1, an = Math.atan2(ey - m.y, ex - m.x), L = Math.hypot(ex - m.x, ey - m.y);
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(ex, ey);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al * .55; ctx.strokeStyle = '#5ac8ff'; ctx.lineWidth = wd * 3.2; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = al; ctx.strokeStyle = '#dff6ff'; ctx.lineWidth = wd * 1.1; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = wd * .5; ctx.stroke();
        halo(ctx, m.x, m.y, 15, '#aef2ff', al); halo(ctx, ex, ey, 20, '#aef2ff', al);
        ctx.translate(m.x, m.y); ctx.rotate(an); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3;
        for (let i = 0; i < 5; i++) { const f = (k * 2.2 + i / 5) % 1; ctx.beginPath(); ctx.ellipse(L * f, 0, 2.4, 5.5 + f * 4.5, 0, 0, TAU); ctx.stroke(); }
        ctx.translate(L, 0); ctx.rotate(-an + k * 1.5); ctx.lineWidth = 1.7;
        for (let i = 0; i < 6; i++) { ctx.rotate(PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -13 * al); ctx.moveTo(0, -8 * al); ctx.lineTo(3.4 * al, -11 * al); ctx.moveTo(0, -8 * al); ctx.lineTo(-3.4 * al, -11 * al); ctx.stroke(); }
      } });
    // frost settles on the grass under the beam
    for (let i = 1; i <= 3; i++) fx.after(i * .05, () => decal(fx, lerp(u.x, tg.x, i / 4), lerp(u.y, tg.y, i / 4), 9, 'frost'));
    impact(G, 'frost', ex, ey, 1, tg.x, tg.y);
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.auroseal = { dur: 1, at: .45,                       // Aurora Veil
  pose(u, k) { u.lift = Ease.hump(Ease.seg(k, .1, .8)) * 3; u.rot = Math.sin(k * PI * 4) * .06; },
  start(G, u) { charge(G, u, .42, () => muzzle(u, 6, 32), 17); },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y, R = u.sp.aoe, cols = ['95,255,192', '176,138,255', '255,138,216'];
    let acc = 0;
    // curtains of northern lights ripple over the area while snow drifts down inside them
    fx.add({ dur: 1.25,
      update(dt, k) {
        acc += dt; if (acc < .04 || k > .8) return; acc = 0;
        fx.p({ x: x + rnd(-R * .9, R * .9), y: y - rnd(30, 64), vy: rnd(26, 44), vx: rnd(-6, 6), life: .9, size: 2.6, col: '#ffffff', shape: 'f', vr: 3 });
        fx.p({ x: x + rnd(-R * .9, R * .9), y: y - rnd(8, 60), life: .35, size: 3, col: pick(['#ffffff', '#aef2ff', '#d9c4ff']), shape: 's', vr: 6 });
      },
      draw(ctx, k) {
        const al = k < .2 ? k / .2 : 1 - Ease.seg(k, .65, 1);
        ctx.globalCompositeOperation = 'lighter';
        for (let b = 0; b < 3; b++) {
          const top = y - 64 - b * 5, bx = x + (b - 1) * R * .5, wv = i => Math.sin(i * .9 + k * 7 + b * 2) * 5.5;
          const gr = ctx.createLinearGradient(0, top, 0, y);
          gr.addColorStop(0, 'rgba(' + cols[b] + ',0)'); gr.addColorStop(.35, 'rgba(' + cols[b] + ',' + (.62 * al) + ')'); gr.addColorStop(1, 'rgba(' + cols[b] + ',0)');
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bx - R * .48 + wv(0), top);
          for (let i = 1; i <= 6; i++) ctx.lineTo(bx - R * .48 + wv(i), top + (y - top) * i / 6);
          for (let i = 6; i >= 0; i--) ctx.lineTo(bx + R * .48 + wv(i + 2), top + (y - top) * i / 6);
          ctx.closePath(); ctx.fill();
        }
      } });
    groundGlow(fx, x, y, R * 1.5, '#aef2ff', 1.1, .6); shock(fx, x, y, 6, R, .6, '#aef2ff', true); decal(fx, x, y, R * .85, 'frost');
    fx.after(.3, () => { foesIn(G, u.side, x, y, R).forEach(e => impact(G, 'frost', bodyX(e), bodyY(e), .6, e.x, e.y)); G.area(u, x, y, R, u.sp.dmg); });
  } };

// ===================== SKY =====================
ATTACKS.wooloft = { dur: .84, at: .5,                       // Cloud Bump
  pose(u, k) { const s = 1 + Ease.seg(k, 0, .4) * .32 - (k > .5 ? Ease.outElastic(Ease.seg(k, .5, .85)) * .32 : 0); u.sx = s; u.sy = s; ram(u, k, 4, 14, .5); },
  start(G, u) { charge(G, u, .84 * .4, () => ({ x: u.x + u.ox, y: u.y + u.oy - 22 * u.vs }), 28); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    for (let i = 0; i < 9; i++) { const a2 = an + (i - 4) * .36; fx.p({ x: x - u.adx * 6, y: y - u.ady * 6, vx: Math.cos(a2) * 76, vy: Math.sin(a2) * 76, drag: 3, life: .55, size: 6.5, grow: 6, col: i % 2 ? '#ffffff' : '#eef4ff', shape: 'p' }); }
    fx.add({ dur: .34, draw(ctx, k) {
      ctx.translate(x, y); ctx.rotate(an); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(-10, 0, 16 + j * 7 + k * 11, -.6, .6); ctx.stroke(); }
    } });
    fx.pow(x, y, 12, '#cfe0ff', '#ffffff'); impact(G, 'sky', x, y, 1.1);
    fx.text(x, y - 18, 'BOING', '#ffffff', 7.5, { dur: .55 });
    G.shake(2); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.kickadee = { dur: .64, at: .4,                      // Gale Kick
  pose(u, k) { lunge(u, k, 8, .4); u.lift = Ease.hump(Ease.seg(k, .05, .7)) * 9; u.rot = Ease.inOut(Ease.seg(k, .1, .6)) * TAU; u.pivot = true; },
  tick(G, u, k) {
    if (k > .1 && k < .6) { const an = k * 26, cx = u.x + u.ox, cy = u.y + u.oy - u.r - u.lift; G.fx.p({ x: cx + Math.cos(an) * 14, y: cy + Math.sin(an) * 14, vx: -Math.sin(an) * 90, vy: Math.cos(an) * 90, life: .16, size: 2.6, col: '#ffffff', shape: 'k' }); }
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), cx = u.x + u.ox, cy = u.y + u.oy - u.r - u.lift, an = Math.atan2(y - cy, x - cx), R = dist2(cx, cy, x, y);
    fx.slash(cx, cy, an, R + 7, 'rgba(255,255,255,.95)', { sweep: 3.2, wid: 5, dur: .26 });
    fx.slash(cx, cy, an + .4, R - 1, 'rgba(170,200,255,.9)', { sweep: 2.6, wid: 3.4, dur: .3, delay: .04 });
    // a blade of wind sails on past the target
    fx.add({ dur: .4, draw(ctx, k) {
      const d = 4 + Ease.outCubic(k) * 42;
      ctx.translate(x + Math.cos(an) * d, y + Math.sin(an) * d); ctx.rotate(an);
      halo(ctx, 0, 0, 16, '#cfe0ff', (1 - k) * .7); ctx.globalAlpha = 1 - k * k;
      ctx.beginPath(); ctx.arc(-9, 0, 15, -1.05, 1.05); ctx.arc(-14.5, 0, 16.5, .86, -.86, true); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
    } });
    for (let i = 0; i < 6; i++) { const v = rnd(80, 150); fx.p({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: Math.cos(an) * v, vy: Math.sin(an) * v, life: .25, size: 3.4, col: '#ffffff', shape: 'k' }); }
    impact(G, 'sky', x, y, .9);
    G.shake(1.5); G.area(u, tg.x, tg.y, u.sp.aoe, u.sp.dmg);
  } };

ATTACKS.hummingblur = { dur: .78, at: .15,                  // Needle Flurry
  pose(u, k) { const j = Math.abs(Math.sin(Ease.seg(k, .1, .85) * PI * 5)); const d = Math.max(3 + j * 9, u.aC * (.35 + j * .6)); u.ox = u.adx * d; u.oy = u.ady * d + Math.sin(k * 60) * 1.2; },
  tick(G, u, k, dt) { if (k > .1 && k < .85 && every(u, dt, .045)) ghost(G, u, .32, .16); },
  fire(G, u, tg) {
    const fx = G.fx;
    for (let i = 0; i < 5; i++) fx.after(i * .1, () => {
      if (tg.state !== 'active' || u.state !== 'active') return;
      const x = bodyX(tg) + rnd(-6, 6), y = bodyY(tg) + rnd(-7, 7), sx = u.x + u.ox + u.face * 14 * u.vs, sy = u.y + u.oy - 29 * u.vs;
      fx.add({ dur: .12, draw(ctx, k) {
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .6; ctx.strokeStyle = '#8ff5d6'; ctx.lineWidth = 5; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.7; ctx.stroke();
      } });
      cross(fx, x, y, i === 4 ? 16 : 9, '#ffffff', .16, rnd(TAU));
      fx.p({ x, y, life: .3, size: 2.4, col: '#ff4fa0', shape: 'g' });
      if (i === 4) { impact(G, 'sky', x, y, .75); G.shake(1); }
      G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.pelicannon = { dur: .88, at: .4,                    // Air Cannon
  pose(u, k) { const rc = Ease.seg(k, .4, .5) - Ease.seg(k, .5, .9); u.ox = -u.adx * 6 * rc; u.oy = -u.ady * 6 * rc; u.sy = 1 + Ease.hump(Ease.seg(k, 0, .4)) * .08; },
  start(G, u) { charge(G, u, .88 * .38, () => muzzle(u, 27, 27), 21); },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 27, 27), an0 = Math.atan2(bodyY(tg) - m.y, bodyX(tg) - m.x);
    fx.burst(m.x, m.y, 7, { col: '#ffffff', shape: 'p', spd: 46, life: .32, size: 4.4, grow: 9, ang: an0, spread: .8 });
    fx.ring(m.x, m.y, 3, 15, .22, '#ffffff', 2.4); cross(fx, m.x, m.y, 14, '#ffffff', .2);
    shoot(G, tg, { x: m.x, y: m.y, speed: 230, trailEvery: .05, glow: { r: 15, col: '#cfe0ff', al: .6 },
      draw(ctx, x, y, an, k) {
        ctx.translate(x, y); ctx.rotate(an); const s = 1 + k * .7;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.ellipse(0, 0, 3.6 * s, 9.5 * s, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill();
        ctx.strokeStyle = 'rgba(190,210,255,.95)'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.ellipse(-3.6, 0, 2.5 * s, 6.8 * s, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-7.8, 0, 1.7 * s, 4.2 * s, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-11.6, 0, 1 * s, 2.4 * s, 0, 0, TAU); ctx.stroke();
      },
      trail(x, y) { fx.p({ x, y, life: .28, size: 3, grow: 9, col: 'rgba(255,255,255,.8)', shape: 'r' }); },
      hit(t, x, y) {
        shock(fx, x, y, 6, 27, .32, '#cfe0ff'); fx.ring(x, y, 3, 17, .38, '#ffffff', 1.8, false, .06);
        for (let i = 0; i < 6; i++) { const a2 = an0 + rnd(-.5, .5), v = rnd(50, 95); fx.p({ x, y: y + rnd(-6, 8), vx: Math.cos(a2) * v, vy: Math.sin(a2) * v, drag: 2.5, life: .5, size: 5, grow: 8, col: 'rgba(255,255,255,.7)', shape: 'p' }); }
        impact(G, 'sky', x, y, 1.15);
        G.shake(2); if (t) G.hit(u, t, u.sp.dmg);
      } });
  } };

ATTACKS.zephyray = { dur: 1, at: .4,                        // Twister
  pose(u, k) { const p = Ease.seg(k, .05, .6); u.rot = Ease.inOut(p) * TAU; u.pivot = true; u.lift = Ease.hump(p) * 5; },
  start(G, u) { charge(G, u, .38, () => ({ x: u.x, y: u.y - 18 * u.vs }), 25); },
  fire(G, u, tg) {
    const fx = G.fx, sx = u.x, sy = u.y, ex = tg.x, ey = tg.y, R = u.sp.aoe;
    let done = false, acc = 0, acc2 = 0;
    fx.add({ dur: 1.25, px: sx, py: sy,
      update(dt, k, it) {
        const mv = Ease.outCubic(Math.min(1, k / .3)); it.px = lerp(sx, ex, mv); it.py = lerp(sy, ey, mv);
        if (k > .3) {
          if (!done) { done = true; foesIn(G, u.side, ex, ey, R).forEach(e => impact(G, 'sky', bodyX(e), bodyY(e), .55)); G.area(u, ex, ey, R, u.sp.dmg); }
          G.enemies(u.side).forEach(e => { const d = dist2(e.x, e.y, ex, ey); if (d < R * 1.25 && d > 3) { e.x += (ex - e.x) / d * 60 * dt; e.y += (ey - e.y) / d * 60 * dt; } });
        }
        acc += dt; acc2 += dt;
        if (acc > .035 && k < .9) { acc = 0; const an = rnd(TAU), rr = rnd(6, 20), h = rnd(4, 46); fx.p({ x: it.px + Math.cos(an) * rr, y: it.py - h, vx: -Math.sin(an) * 95, vy: rnd(-22, 4), life: .3, size: 2.6, col: pick(['#ffffff', '#7fe070', '#cfe0ff', '#e6d3b0']), shape: Math.random() < .45 ? 'l' : 'k', rot: rnd(TAU), vr: 9 }); }
        if (acc2 > .16 && k < .85) { acc2 = 0; fx.ring(it.px, it.py, 5, 20, .4, 'rgba(255,255,255,.9)', 1.8, true); fx.p({ x: it.px + rnd(-8, 8), y: it.py, vx: rnd(-30, 30), vy: -8, life: .5, size: 5, grow: 9, col: 'rgba(225,215,190,.5)', shape: 'p' }); }
      },
      draw(ctx, k, it) {
        const al = k < .1 ? k / .1 : 1 - Ease.seg(k, .82, 1);
        ctx.translate(it.px, it.py);
        for (let i = 0; i < 10; i++) {
          const f = i / 9, w2 = 4 + f * 17, ox = Math.sin(k * 30 + i * .8) * (2 + f * 6);
          ctx.beginPath(); ctx.ellipse(ox, -f * 52, w2, w2 * .3, 0, 0, TAU);
          ctx.globalAlpha = al * .16; ctx.fillStyle = '#ffffff'; ctx.fill();
          ctx.globalAlpha = al * (.55 + f * .45); ctx.strokeStyle = i % 2 ? '#ffffff' : '#cfe0ff'; ctx.lineWidth = 2.4; ctx.stroke();
        }
        halo(ctx, 0, -50, 22, '#cfe0ff', al * .4);
      },
      end(it) { fx.burst(it.px, it.py - 24, 8, { col: ['rgba(255,255,255,.8)', 'rgba(238,244,255,.8)'], shape: 'p', spd: 50, life: .5, size: 6, grow: 8, drag: 2.5 }); } });
  } };

// ===================== VENOM =====================
ATTACKS.snoxious = { dur: 1, at: .45,                       // Shell Spray
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .2, .8)); u.sy = 1 - p * .06; u.ox = Math.sin(k * 70) * p * .8; },
  start(G, u) { charge(G, u, .42, () => ({ x: u.x - 3 * u.face * u.vs, y: u.y - 16 * u.vs }), 19); },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x, y = u.y, R = u.sp.aoe;
    let acc = 0, ang = rnd(TAU);
    // the spinning shell sprays toxic mist in spiral arms
    fx.add({ dur: .5, update(dt) {
      acc += dt; if (acc < .028) return; acc = 0; ang += .62;
      for (let arm = 0; arm < 3; arm++) {
        const a2 = ang + arm * TAU / 3;
        fx.p({ x: x + Math.cos(a2) * 9, y: y - 15 + Math.sin(a2) * 5, vx: Math.cos(a2) * R * 2.3, vy: Math.sin(a2) * R * 1.3, drag: 3, life: .8, size: 5.5, grow: 7, col: arm % 2 ? 'rgba(170,255,90,.7)' : 'rgba(180,95,224,.65)', shape: 'p' });
        fx.p({ x, y: y - 15, vx: Math.cos(a2 + .2) * 130, vy: Math.sin(a2 + .2) * 75, drag: 2.5, life: .42, size: 2.3, col: '#a4ff4a', shape: 'd' });
      }
    } });
    shock(fx, x, y, 10, R, .5, '#b45fe0', true); groundGlow(fx, x, y, R * 1.3, '#a4ff4a', .8, .5); decal(fx, x, y, R * .8, 'goo');
    foesIn(G, u.side, x, y, R).forEach(e => impact(G, 'venom', bodyX(e), bodyY(e), .55, e.x, e.y));
    G.area(u, x, y, R, u.sp.dmg);
  } };

ATTACKS.scorplet = { dur: .78, at: .45,                     // Tail Sting
  pose(u, k) { ram(u, k, 3, 8, .45); },
  start(G, u) { const m = muzzle(u, -2, 36); flare(G.fx, m.x, m.y, 12, '#a4ff4a', .3, .08); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), m = muzzle(u, -2, 36), cx = (m.x + x) / 2, cy = Math.min(m.y, y) - 22;
    // the stinger whips over in an arc and jabs down
    fx.add({ dur: .26, draw(ctx, k) {
      const L = Ease.outCubic(Math.min(1, k * 2.4)), n = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= n; i++) { const f = i / n * L, q = 1 - f, px = q * q * m.x + 2 * q * f * cx + f * f * x, py = q * q * m.y + 2 * q * f * cy + f * f * y; ctx[i ? 'lineTo' : 'moveTo'](px, py); }
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .7; ctx.strokeStyle = '#a4ff4a'; ctx.lineWidth = 9; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k * k; ctx.strokeStyle = '#b96adc'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#f0ffd0'; ctx.lineWidth = 1.4; ctx.stroke();
      const q = 1 - L, hx = q * q * m.x + 2 * q * L * cx + L * L * x, hy = q * q * m.y + 2 * q * L * cy + L * L * y, an = Math.atan2(2 * (1 - L) * (cy - m.y) + 2 * L * (y - cy), 2 * (1 - L) * (cx - m.x) + 2 * L * (x - cx));
      ctx.translate(hx, hy); ctx.rotate(an); ctx.fillStyle = '#a4ff4a'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-3, -4); ctx.lineTo(-3, 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .8; ctx.stroke();
    } });
    fx.after(.1, () => {
      cross(fx, x, y, 20, '#eaffb0', .22); shock(fx, x, y, 4, 20, .3, '#b45fe0');
      impact(G, 'venom', x, y, 1, tg.x, tg.y);
      G.shake(1.5); G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.hopdart = { dur: .88, at: .4,                       // Dart Leap
  pose(u, k) {
    const j = Ease.seg(k, .12, .4), stick = Ease.seg(k, .4, .55), b = Ease.seg(k, .55, .95), f = j < 1 ? Ease.inOut(j) : 1 - Ease.inOut(b);
    u.ox = u.adx * u.aC * f; u.oy = u.ady * u.aC * f;
    u.lift = j < 1 ? Math.sin(j * PI) * 20 : stick < 1 ? 0 : Math.sin(b * PI) * 14;
    if (k < .12) { u.sy = 1 - k / .12 * .2; u.sx = 1 + k / .12 * .12; } else if (stick > 0 && stick < 1) { u.sy = .85; u.sx = 1.12; }
  },
  tick(G, u, k, dt) { if (k > .12 && k < .4 && every(u, dt, .05)) ghost(G, u, .34, .2); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg);
    splat(fx, x, y, '#ffd12e', 14, .8); splat(fx, x + 3, y + 2, '#7d42c8', 7.5, .8);
    impact(G, 'venom', x, y, 1, tg.x, tg.y);
    // sticky strands stretch and snap as it hops away
    fx.add({ dur: .42, delay: .13, draw(ctx, k) {
      if (u.state !== 'active' || tg.state !== 'active' || k > .8) return;
      const ax = bodyX(tg), ay = bodyY(tg), bx = bodyX(u), by = bodyY(u);
      ctx.lineCap = 'round'; ctx.globalAlpha = 1 - k;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(ax, ay + i * 4); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 7 + i * 3, bx, by + i * 3); ctx.strokeStyle = i ? '#a4ff4a' : '#ffd12e'; ctx.lineWidth = 2.2 * (1 - k); ctx.stroke(); }
    } });
    G.shake(1.5); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.hissyfit = { dur: .88, at: .45,                     // Venom Spit
  pose(u, k) { lunge(u, k, 4, .45); },
  start(G, u) { charge(G, u, .88 * .42, () => muzzle(u, 9, 27), 15); },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 9, 27);
    fx.burst(m.x, m.y, 4, { col: ['#a4ff4a', '#b45fe0'], shape: 'd', spd: 40, life: .25, size: 2 });
    shoot(G, tg, { x: m.x, y: m.y, speed: 195, arc: 28, tail: { n: 10, w: 7, col: '#8c3fd0', core: '#a4ff4a', al: .85 }, glow: { r: 12, col: '#a4ff4a', al: .6 },
      draw(ctx, x, y, an) {
        ctx.translate(x, y); ctx.rotate(an); ctx.fillStyle = '#8c3fd0';
        ctx.beginPath(); ctx.moveTo(7, 0); ctx.quadraticCurveTo(0, -6.5, -11, 0); ctx.quadraticCurveTo(0, 6.5, 7, 0); ctx.fill();
        ctx.fillStyle = '#a4ff4a'; ctx.beginPath(); ctx.arc(1.6, 0, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#eaffd0'; ctx.beginPath(); ctx.arc(.8, -1, 1, 0, TAU); ctx.fill();
      },
      trail(x, y) { fx.p({ x, y, vy: 30, g: 120, life: .35, size: 1.9, col: pick(['#a4ff4a', '#c88af0']), shape: 'd' }); },
      hit(t, x, y) {
        impact(G, 'venom', x, y, 1, t ? t.x : x, t ? t.y : y + 12);
        if (t) G.hit(u, t, u.sp.dmg);
        venomPuddle(G, u, t ? t.x : x, t ? t.y : y + 12, 26, u.sp.puddle, 12);
      } });
  } };

ATTACKS.bubbrew = { dur: .98, at: .45,                      // Hex Brew
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .6)); u.lift = p * 5; u.sy = 1 + p * .05; },
  start(G, u) {
    charge(G, u, .98 * .42, () => muzzle(u, 0, 30), 18);
    G.fx.burst(u.x, u.y - 26 * u.vs, 5, { col: ['#c8ff8a', '#a4ff4a'], shape: 'b', spd: 22, life: .7, size: 3, up: 30, g: -20 });
  },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 0, 30), gx = tg.x, gy = tg.y, R = u.sp.aoe, tr = [];
    // a corked flask tumbles through the air, trailing green sparkles
    fx.add({ dur: .46,
      update(dt, k) { if (Math.random() < .7) fx.p({ x: lerp(m.x, gx, k) + rnd(-2, 2), y: lerp(m.y, gy - 6, k) - Math.sin(k * PI) * 36 + rnd(-2, 2), life: .4, size: 2, col: pick(['#a4ff4a', '#e2b4f5']), shape: 'g' }); },
      draw(ctx, k) {
        const px = lerp(m.x, gx, k), py = lerp(m.y, gy - 6, k) - Math.sin(k * PI) * 36;
        tr.push(px, py); if (tr.length > 20) tr.splice(0, 2);
        ctx.globalCompositeOperation = 'lighter'; ribbon(ctx, tr, 6, '#8fff5a', .6); ctx.globalCompositeOperation = 'source-over';
        halo(ctx, px, py, 13, '#a4ff4a', .7);
        ctx.translate(px, py); ctx.rotate(k * 14); ctx.strokeStyle = '#1f0f33'; ctx.lineWidth = 1.2;
        ctx.fillStyle = 'rgba(215,255,228,.94)'; ctx.beginPath(); ctx.arc(0, 2, 5.4, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8fff5a'; ctx.beginPath(); ctx.arc(0, 2, 4.5, .15, PI - .15); ctx.fill();
        ctx.fillStyle = 'rgba(215,255,228,.94)'; ctx.fillRect(-1.9, -7.4, 3.8, 5.2); ctx.strokeRect(-1.9, -7.4, 3.8, 5.2);
        ctx.fillStyle = '#a8743c'; ctx.fillRect(-2.3, -9.9, 4.6, 2.7);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-2, .4, 1.1, 0, TAU); ctx.fill();
      },
      end() {
        cross(fx, gx, gy - 6, 20, '#eaffd0', .22);
        fx.burst(gx, gy - 6, 8, { col: '#dfffe8', shape: 'q', spd: 95, life: .4, size: 2.6, vr: 12, g: 220, up: 45 });
        for (let i = 0; i < 11; i++) { const an = i / 11 * TAU; fx.p({ x: gx + Math.cos(an) * 6, y: gy - 8 + Math.sin(an) * 4, vx: Math.cos(an) * R * 1.6, vy: Math.sin(an) * R * .9 - 8, drag: 3, life: 1.1, size: 8.5, grow: 7, col: i % 2 ? 'rgba(143,255,90,.55)' : 'rgba(180,95,224,.5)', shape: 'p' }); }
        fx.burst(gx, gy - 10, 10, { col: ['#c8ff8a', '#e2b4f5'], shape: 'b', spd: 30, life: 1, size: 3.2, up: 32, g: -25, jit: R * .45 });
        // hex swirls drift up out of the cloud
        for (let i = 0; i < 3; i++) { const hx = gx + (i - 1) * R * .45;
          fx.add({ dur: .9, delay: i * .1, draw(ctx, k) { ctx.translate(hx + Math.sin(k * 8 + i) * 3, gy - 10 - k * 30); ctx.rotate(k * 5); ctx.globalAlpha = Ease.hump(k); ctx.strokeStyle = i % 2 ? '#e2b4f5' : '#c8ff8a'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let j = 0; j < 22; j++) { const a2 = j * .5, rr = j * .32; ctx[j ? 'lineTo' : 'moveTo'](Math.cos(a2) * rr, Math.sin(a2) * rr); } ctx.stroke(); } }); }
        shock(fx, gx, gy, 6, R, .45, '#8fff5a', true); groundGlow(fx, gx, gy, R * 1.4, '#a4ff4a', .9, .55); decal(fx, gx, gy, R * .75, 'goo');
        foesIn(G, u.side, gx, gy, R).forEach(e => impact(G, 'venom', bodyX(e), bodyY(e), .5, e.x, e.y));
        G.area(u, gx, gy, R, u.sp.dmg);
      } });
  } };

// ===================== MYSTIC =====================
ATTACKS.monolit = { dur: 1, at: .5,                         // Rune Pulse
  pose(u, k) { u.lift = Ease.hump(Ease.seg(k, .1, .6)) * 7; u.sy = 1 - Ease.hump(Ease.seg(k, .5, .7)) * .08; },
  start(G, u) { charge(G, u, .48, () => ({ x: u.x, y: u.y - 20 * u.vs - u.lift }), 23, 'gold'); },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x, y = u.y, R = u.sp.aoe;
    groundGlow(fx, x, y, R * 1.5, '#ffd34a', .8, .7);
    fx.add({ dur: .85, ground: true, draw(ctx, k) {
      const r = lerp(8, R, Ease.outCubic(k));
      ctx.translate(x, y); ctx.scale(1, .55); ctx.globalAlpha = 1 - k * k;
      ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, r * .7, 0, TAU); ctx.stroke();
      ctx.rotate(k * 1.5);
      for (let q = 0; q < 2; q++) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const an = i * TAU / 3 + q * PI; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * r * .7, Math.sin(an) * r * .7); } ctx.closePath(); ctx.stroke(); }
      ctx.fillStyle = '#fff3c0';
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate(i * TAU / 6 + PI / 6); ctx.translate(r * .86, 0);
        if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, TAU); ctx.fill(); }
        else if (i % 3 === 1) { ctx.beginPath(); ctx.moveTo(0, -2.9); ctx.lineTo(2.7, 2.3); ctx.lineTo(-2.7, 2.3); ctx.closePath(); ctx.fill(); }
        else ctx.fillRect(-1, -3.1, 2, 6.2);
        ctx.restore();
      }
    } });
    // six pillars of light shoot up around the ring
    for (let i = 0; i < 6; i++) {
      const an = i * TAU / 6 + PI / 6, px = x + Math.cos(an) * R * .82, py = y + Math.sin(an) * R * .45;
      fx.add({ dur: .62, delay: .05 + i * .03, draw(ctx, k) {
        const al = Ease.hump(k), h = 50 * Ease.outCubic(Math.min(1, k * 2.2));
        const gr = ctx.createLinearGradient(0, py - h, 0, py); gr.addColorStop(0, 'rgba(255,225,120,0)'); gr.addColorStop(1, 'rgba(255,244,190,' + (.9 * al) + ')');
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.fillRect(px - 2.4, py - h, 4.8, h);
        halo(ctx, px, py, 8, '#ffd34a', al);
      } });
    }
    // its shield snaps into place as a hexagon of light
    fx.add({ dur: .5, draw(ctx, k) {
      const r = 14 + Ease.outBack(Math.min(1, k * 2)) * 13; ctx.translate(x, y - 18 * u.vs); ctx.globalAlpha = 1 - k * k;
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const an = i * TAU / 6 + PI / 6; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * r, Math.sin(an) * r * 1.1); } ctx.closePath();
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke(); ctx.globalAlpha *= .22; ctx.fillStyle = '#fff3c0'; ctx.fill();
    } });
    flare(fx, x, y - 20, 22, '#ffe27a', .3);
    foesIn(G, u.side, x, y, R).forEach(e => impact(G, 'mystic', bodyX(e), bodyY(e), .55));
    G.shake(2); G.area(u, x, y, R, u.sp.dmg); G.shield(u, u.sp.shield);
  } };

ATTACKS.chipmonk = { dur: .74, at: .42,                     // Chi Palm
  pose(u, k) { ram(u, k, 3, 8, .42); },
  start(G, u) { charge(G, u, .74 * .4, () => muzzle(u, 15, 14), 14); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), m = muzzle(u, 18, 14), an = Math.atan2(y - m.y, x - m.x);
    fx.add({ dur: .36, draw(ctx, k) {
      ctx.translate(m.x, m.y); ctx.rotate(an); ctx.lineCap = 'round';
      for (let j = 0; j < 4; j++) {
        const q = clamp(k * 1.6 - j * .17, 0, 1); if (q <= 0 || q >= 1) continue;
        ctx.beginPath(); ctx.arc(-8 + q * 28, 0, 8 + q * 13, -.85, .85);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - q) * .5; ctx.strokeStyle = '#b48aff'; ctx.lineWidth = 7; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = (1 - q) * .95; ctx.strokeStyle = j % 2 ? '#ffffff' : '#d6c4ff'; ctx.lineWidth = 3 - j * .4; ctx.stroke();
      }
    } });
    // a big spirit palm flies out and lands flat on the target
    fx.add({ dur: .5, draw(ctx, k) {
      const fly = Ease.outCubic(Math.min(1, k * 3.2)), s = (1.1 + fly * 1.1) * (k > .3 ? 1 + (k - .3) * .5 : 1);
      const px = lerp(m.x, x, fly), py = lerp(m.y, y, fly);
      halo(ctx, px, py, 22 * s * .6, '#b48aff', (1 - k) * .8);
      ctx.translate(px, py); ctx.rotate(an + PI / 2); ctx.scale(s, s); ctx.globalAlpha = (1 - k * k) * .9;
      ctx.fillStyle = '#e6dcff'; palmShape(ctx);
      ctx.globalAlpha *= .6; ctx.fillStyle = '#ffffff'; ctx.scale(.6, .6); palmShape(ctx);
    } });
    fx.after(.1, () => { shock(fx, x, y, 5, 24, .32, '#b48aff'); impact(G, 'mystic', x, y, .9); G.shake(2); G.hit(u, tg, u.sp.dmg); });
  } };

ATTACKS.telemur = { dur: .78, at: .45, commit: true,        // Blink Strike
  pose(u, k) {
    if (k < .2) { const s = 1 - Ease.inCubic(k / .2); u.sx = s; u.sy = 2 - s; u.al = s; }
    else { u.ox = u.adx * u.aD; u.oy = u.ady * u.aD; u.flip = true; if (k < .3) u.hide = true; else { const s = Ease.outBack(Ease.seg(k, .3, .45)); u.sx = s; u.sy = s; } }
  },
  start(G, u) {
    const fx = G.fx, x = u.x, y = u.y - u.r, x1 = u.x + u.adx * u.aD, y1 = u.y + u.ady * u.aD - u.r;
    ghost(G, u, .5, .3);
    // it folds away into a ring of stars...
    fx.add({ dur: .26, delay: .05, draw(ctx, k) { ctx.globalAlpha = k < .3 ? k / .3 : 1 - Ease.seg(k, .6, 1); ctx.strokeStyle = '#d6c4ff'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, 20 * (1 - Ease.outCubic(k)) + 2, 0, TAU); ctx.stroke(); halo(ctx, x, y, 16, '#b48aff', .7); } });
    fx.after(.14, () => fx.burst(x, y, 9, { col: ['#ffc93d', '#ffffff', '#b9a4ff'], shape: 's', spd: 65, life: .5, size: 3.6, vr: 8 }));
    // ...and a line of twinkles marks the jump
    for (let i = 1; i < 8; i++) fx.after(.14 + i * .012, () => { const f = i / 8; fx.p({ x: lerp(x, x1, f), y: lerp(y, y1, f) + rnd(-2, 2), life: .4, size: 2.6, col: pick(['#ffc93d', '#d6c4ff', '#8ff5e6']), shape: i % 2 ? 's' : 'g', vr: 6 }); });
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), ax = u.x + u.ox, ay = u.y + u.oy - u.r;
    fx.ring(ax, ay, 3, 20, .3, '#d6c4ff', 2.2); flare(fx, ax, ay, 18, '#b48aff', .28);
    fx.burst(ax, ay, 7, { col: ['#ffc93d', '#ffffff'], shape: 's', spd: 55, life: .45, size: 3.2, vr: 8 });
    fx.add({ dur: .4, draw(ctx, k) {
      const s = 9 + Ease.outCubic(k) * 12;
      halo(ctx, x, y, s * 1.6, '#ffc93d', (1 - k) * .7);
      ctx.translate(x, y); ctx.globalAlpha = 1 - k * k; ctx.rotate(k * 1.4 - .3);
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = -PI / 2 + i * PI / 5, rr = i % 2 ? s * .45 : s; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.strokeStyle = '#ffc93d'; ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.globalAlpha *= .3; ctx.fillStyle = '#fff3c0'; ctx.fill();
    } });
    fx.add({ dur: .22, draw(ctx, k) {
      const L = Ease.outCubic(Math.min(1, k * 3)); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 18, y - 13); ctx.lineTo(x - 18 + 36 * L, y - 13 + 26 * L);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - k) * .7; ctx.strokeStyle = '#b48aff'; ctx.lineWidth = 10; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.stroke();
    } });
    impact(G, 'mystic', x, y, 1);
    G.shake(2); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.mageling = { dur: .92, at: .5,                      // Arcane Orb
  pose(u, k) { u.lift = Ease.hump(Ease.seg(k, .05, .6)) * 5; lunge(u, k, -3, .5); },
  start(G, u) {
    charge(G, u, .92 * .48, () => muzzle(u, 24, 21), 17);
    // a spell circle draws itself in the air in front of the wand
    G.fx.add({ dur: .92 * .64, draw(ctx, k) {
      if (u.state !== 'active') return;
      const m = muzzle(u, 24, 21), al = k < .2 ? k / .2 : 1 - Ease.seg(k, .8, 1), R = 14 * Ease.outBack(Math.min(1, k * 2.5));
      halo(ctx, m.x, m.y, R * 1.6, '#2fe0c8', al * .5);
      ctx.translate(m.x, m.y); ctx.scale(.5, 1); ctx.globalAlpha = al;
      ctx.strokeStyle = '#2fe0c8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#d6c4ff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, R * .72, 0, TAU); ctx.stroke();
      ctx.save(); ctx.rotate(-k * 3); ctx.fillStyle = '#ffc93d'; for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.fillRect(R * .8, -.8, R * .14, 1.6); } ctx.restore();
      ctx.rotate(k * 5); ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const an = i * TAU * 2 / 5; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * R * .72, Math.sin(an) * R * .72); }
      ctx.stroke();
    } });
  },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 24, 21);
    cross(fx, m.x, m.y, 20, '#ffffff', .22);
    shoot(G, tg, { x: m.x, y: m.y, speed: 240, trailEvery: .03, tail: { n: 13, w: 9, col: '#7d42e8', core: '#e6dcff', add: true }, glow: { r: 18, col: '#b48aff', al: .8 },
      draw(ctx, x, y, an, k, it) {
        ctx.fillStyle = '#b48aff'; ctx.beginPath(); ctx.arc(x, y, 5.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e6dcff'; ctx.beginPath(); ctx.arc(x - .6, y - .6, 3.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - 1.2, y - 1.2, 1.9, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2fe0c8';
        for (let i = 0; i < 3; i++) { const a2 = it.t * 14 + i * TAU / 3; star4(ctx, x + Math.cos(a2) * 11, y + Math.sin(a2) * 6, 3); }
      },
      trail(x, y) { fx.p({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), life: .4, size: 2.4, col: pick(['#b48aff', '#2fe0c8', '#ffc93d']), shape: Math.random() < .5 ? 's' : 'g', vr: 6 }); },
      hit(t, x, y) {
        fx.add({ dur: .44, draw(ctx, k) {
          const R = 7 + Ease.outCubic(k) * 18; ctx.translate(x, y); ctx.globalAlpha = 1 - k * k;
          ctx.strokeStyle = '#b48aff'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
          ctx.rotate(k * 2); ctx.strokeStyle = '#2fe0c8'; ctx.lineWidth = 1.5; ctx.beginPath();
          for (let i = 0; i <= 5; i++) { const an = i * TAU * 2 / 5; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * R, Math.sin(an) * R); }
          ctx.stroke();
        } });
        impact(G, 'mystic', x, y, 1.2);
        if (t) { decal(fx, t.x, t.y, 15, 'sigil'); G.hit(u, t, u.sp.dmg); }
        G.shake(2);
      } });
  } };

ATTACKS.lunafawn = { dur: .98, at: .45,                     // Moonbeam
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .05, .7)); u.lift = p * 4; u.rot = -p * .08; },
  start(G, u) { charge(G, u, .98 * .42, () => muzzle(u, 11, 46), 17, 'gold'); },
  fire(G, u, tg) {
    const fx = G.fx;
    const beam = (t, col, hex, heal) => {
      groundGlow(fx, t.x, t.y, t.r * 3, hex, .7, .8);
      fx.add({ dur: .7, draw(ctx, k) {
        if (t.state !== 'active') return;
        const x = t.x, y = t.y, al = k < .2 ? k / .2 : 1 - Ease.seg(k, .6, 1), top = y - 124, w0 = 4 + al * 5, w1 = t.r * 1.2;
        const gr = ctx.createLinearGradient(0, top, 0, y);
        gr.addColorStop(0, 'rgba(' + col + ',0)'); gr.addColorStop(.5, 'rgba(' + col + ',' + (.5 * al) + ')'); gr.addColorStop(1, 'rgba(' + col + ',' + (.8 * al) + ')');
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(x - w0, top); ctx.lineTo(x + w0, top); ctx.lineTo(x + w1, y); ctx.lineTo(x - w1, y); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - w0 * .4, top); ctx.lineTo(x + w0 * .4, top); ctx.lineTo(x + w1 * .45, y); ctx.lineTo(x - w1 * .45, y); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // the moon itself hangs at the top of the beam
        const my = top + 40 - k * 6; halo(ctx, x, my, 20, '#ffe680', al);
        ctx.globalAlpha = al; ctx.translate(x, my); ctx.rotate(-.5); ctx.fillStyle = '#ffe680';
        ctx.beginPath(); ctx.arc(0, 0, 7.5, -PI * .5, PI * .5); ctx.quadraticCurveTo(7.9, 0, 0, -7.5); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .9; ctx.stroke();
      } });
      for (let i = 0; i < 9; i++) fx.p({ x: t.x + rnd(-10, 10), y: t.y - rnd(40, 100), vy: rnd(40, 75), life: .7, size: 2.8, col: heal ? '#eaffd0' : '#fff7c0', shape: i % 2 ? 's' : 'g', vr: 4 });
    };
    beam(tg, '255,240,170', '#ffe680', false);
    impact(G, 'mystic', bodyX(tg), bodyY(tg), .75);
    G.hit(u, tg, u.sp.dmg);
    const al = G.weakestAlly(u.side);
    if (al) fx.after(.16, () => { if (al.state !== 'active') return; beam(al, '200,255,220', '#b8ffd0', true); G.heal(al, u.sp.healOne, '#eaffd0'); });
  } };

// ===================== SHADOW =====================
ATTACKS.cryptoise = { dur: 1, at: .4,                       // Grave Rise
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .5)); u.sy = 1 - p * .1; u.sx = 1 + p * .06; },
  start(G, u, tg) {
    // a low purple mist creeps out toward the target
    const fx = G.fx, x0 = u.x, y0 = u.y;
    for (let i = 1; i <= 5; i++) fx.after(i * .06, () => { if (tg.state !== 'active') return; fx.p({ x: lerp(x0, tg.x, i / 6), y: lerp(y0, tg.y, i / 6), vy: -6, life: .8, size: 5, grow: 8, col: 'rgba(125,95,170,.5)', shape: 'p' }); });
  },
  fire(G, u, tg) {
    const fx = G.fx, pts = [.35, .62, .88].map(f => ({ x: lerp(u.x, tg.x, f), y: lerp(u.y, tg.y, f) }));
    pts.forEach((p, i) => {
      const d = i * .13;
      fx.after(d, () => { fx.burst(p.x, p.y, 6, { col: 'rgba(125,105,145,.8)', shape: 'p', spd: 30, life: .45, size: 4.4, grow: 8, flat: .5 }); fx.burst(p.x, p.y, 4, { col: ['#6a5a7a', '#4a4458'], shape: 'q', spd: 50, life: .45, size: 2.4, up: 70, g: 360, vr: 9 }); });
      fx.add({ dur: .85, delay: d, draw(ctx, k) {
        const h = k < .2 ? Ease.outBack(k / .2) : k > .7 ? 1 - Ease.inCubic((k - .7) / .3) : 1, s = .85 + i * .16;
        halo(ctx, p.x, p.y - 14 * s, 20 * s, '#b06aff', .45 * h);
        ctx.translate(p.x, p.y); ctx.scale(s, s);
        ctx.beginPath(); ctx.rect(-14, -46, 28, 46); ctx.clip(); ctx.translate(0, (1 - h) * 28);
        ctx.fillStyle = '#a29cb4'; ctx.strokeStyle = '#231a33'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-8, -14); ctx.quadraticCurveTo(-8, -24, 0, -24); ctx.quadraticCurveTo(8, -24, 8, -14); ctx.lineTo(8, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-6, -14); ctx.quadraticCurveTo(-6, -21, -1, -22); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#5d566e'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(0, -14, 3.4, -PI * .5, PI * .5); ctx.quadraticCurveTo(2.6, -14, 0, -17.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.stroke();
        ctx.fillStyle = '#6fc45a'; ctx.beginPath(); ctx.arc(-6, 0, 2.6, 0, TAU); ctx.fill();
      } });
      // a little ghost drifts up out of each grave
      fx.add({ dur: .95, delay: d + .18, draw(ctx, k) {
        const yy = p.y - 24 - k * 24, xx = p.x + Math.sin(k * 9 + i) * 3.4;
        ctx.globalAlpha = (k < .2 ? k / .2 : 1 - Ease.seg(k, .5, 1)) * .92;
        halo(ctx, xx, yy, 10, '#b06aff', .55);
        ctx.fillStyle = '#efe6ff'; ctx.beginPath(); ctx.arc(xx, yy, 4.4, PI, TAU); ctx.lineTo(xx + 4.4, yy + 5.2); ctx.lineTo(xx + 2.1, yy + 3.5); ctx.lineTo(xx, yy + 5.6); ctx.lineTo(xx - 2.1, yy + 3.5); ctx.lineTo(xx - 4.4, yy + 5.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.arc(xx - 1.6, yy - .4, .85, 0, TAU); ctx.arc(xx + 1.6, yy - .4, .85, 0, TAU); ctx.fill();
      } });
    });
    fx.after(.38, () => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg), y = bodyY(tg);
      shock(fx, tg.x, tg.y, 4, 24, .38, '#b06aff', true);
      impact(G, 'shadow', x, y, 1, tg.x, tg.y);
      G.shake(2); G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.obsidrake = { dur: .84, at: .5,                     // Night Fang
  pose(u, k) { ram(u, k, 4, 10, .5); },
  start(G, u) { charge(G, u, .84 * .45, () => muzzle(u, 20, 24), 15); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg);
    const jaw = (ctx, eyes) => {
      ctx.fillStyle = '#2a1f3a'; ctx.beginPath(); ctx.moveTo(-18, -15); ctx.quadraticCurveTo(0, -27, 18, -15); ctx.lineTo(18, -4); ctx.lineTo(-18, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ff3a4a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-18, -15); ctx.quadraticCurveTo(0, -27, 18, -15); ctx.stroke();
      ctx.fillStyle = '#7a1f30'; ctx.fillRect(-18, -6.5, 36, 2.5);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) { const tx = -14.4 + i * 7.2; ctx.beginPath(); ctx.moveTo(tx - 3, -4); ctx.lineTo(tx, 4 + (i === 1 || i === 3 ? 3.5 : 0)); ctx.lineTo(tx + 3, -4); ctx.closePath(); ctx.fill(); }
      if (eyes) { ctx.fillStyle = '#ff2a3c'; for (const q of [-7.5, 7.5]) { ctx.beginPath(); ctx.moveTo(q - 3.4, -14); ctx.lineTo(q + 3.4, -15.5 * (q < 0 ? .92 : 1.02)); ctx.lineTo(q, -11); ctx.closePath(); ctx.fill(); } }
    };
    // shadowy jaws with burning eyes snap shut on the target
    fx.add({ dur: .42, draw(ctx, k) {
      const gap = 19 * (1 - (k < .42 ? Ease.inCubic(k / .42) : 1));
      halo(ctx, x, y, 26, '#ff2a3c', (k < .42 ? k / .42 : 1 - Ease.seg(k, .5, 1)) * .6);
      ctx.translate(x, y); ctx.globalAlpha = k > .62 ? 1 - (k - .62) / .38 : 1;
      ctx.save(); ctx.translate(0, -gap); jaw(ctx, true); ctx.restore();
      ctx.save(); ctx.scale(1, -1); ctx.translate(0, -gap); jaw(ctx, false); ctx.restore();
    } });
    fx.after(.18, () => {
      flare(fx, x, y, 26, '#ff2a3c', .24);
      // two crimson fang cuts are left hanging in the air
      fx.add({ dur: .4, draw(ctx, k) { ctx.globalAlpha = 1 - k; ctx.lineCap = 'round'; for (const q of [-5, 5]) { ctx.beginPath(); ctx.moveTo(x + q - 3, y - 11); ctx.quadraticCurveTo(x + q + 2, y, x + q - 2, y + 11); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ff3a4a'; ctx.lineWidth = 5; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#ffd0d6'; ctx.lineWidth = 1.5; ctx.stroke(); } } });
      impact(G, 'shadow', x, y, 1.1, tg.x, tg.y);
      G.shake(3); G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.shinobat = { dur: .64, at: .36, commit: true,       // Echo Swoop
  pose(u, k) { travel(u, k, .12, .55, u.aD); const h = Ease.hump(Ease.seg(k, .12, .55)); u.lift = -h * 8; u.sx = 1 + h * .2; u.rot = h * .3; },
  start(G, u) {
    const fx = G.fx, x0 = u.x, y0 = u.y, dx = u.adx * u.aD, dy = u.ady * u.aD, up = 17 * u.vs, face = u.face, an = Math.atan2(u.ady, u.adx);
    // a screech rings out ahead of it...
    fx.add({ dur: .3, draw(ctx, k) {
      ctx.translate(x0, y0 - up); ctx.rotate(an); ctx.lineCap = 'round';
      for (let j = 0; j < 3; j++) { const q = clamp(k * 1.5 - j * .2, 0, 1); if (q <= 0 || q >= 1) continue; ctx.globalAlpha = (1 - q) * .9; ctx.strokeStyle = j % 2 ? '#ff4ad0' : '#d6c4ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q * 22, 0, 6 + q * 12, -.7, .7); ctx.stroke(); }
    } });
    // ...and shadow bats follow it in
    for (let i = 1; i <= 3; i++) fx.add({ dur: .4, delay: .07 + i * .055, draw(ctx, k) {
      const f = Ease.inOut(Math.min(1, k * 1.3));
      ctx.translate(x0 + dx * f, y0 + dy * f - up + Math.sin(f * PI) * 8); ctx.scale(face * (1 + i * .08), 1 + i * .08); ctx.globalAlpha = (1 - k) * .55;
      batShape(ctx, '#3f3368');
    } });
  },
  tick(G, u, k, dt) {
    if (k > .12 && k < .56) {
      G.fx.p({ x: u.x + u.ox + rnd(-4, 4), y: u.y + u.oy - 17 * u.vs - u.lift + rnd(-4, 4), life: .4, size: 2.4, col: pick(['#8a5cff', '#ff4ad0']), shape: 'g' });
      if (every(u, dt, .045)) ghost(G, u, .42, .22);
    }
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    fx.slash(x - u.adx * 13, y - u.ady * 13, an, 18, '#8a5cff', { sweep: 2.3, wid: 7, dur: .28, edge: '#ff4ad0' });
    fx.slash(x - u.adx * 13, y - u.ady * 13, an, 12, '#ff4ad0', { sweep: 2, wid: 3, dur: .24, delay: .03 });
    impact(G, 'shadow', x, y, .9, tg.x, tg.y);
    G.shake(1.5); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.lumbra = { dur: .92, at: .35,                       // Wisp Spiral
  pose(u, k) { u.lift = Ease.hump(Ease.seg(k, .05, .8)) * 4; },
  start(G, u) { charge(G, u, .92 * .33, () => muzzle(u, 16, 25), 14, 'wisp'); },
  fire(G, u, tg) {
    const fx = G.fx;
    for (let i = 0; i < 3; i++) {
      const m = muzzle(u, 16, 25), ph = i * TAU / 3, tr = [];
      let ex = bodyX(tg), ey = bodyY(tg), acc = 0;
      fx.add({ dur: Math.max(.34, dist2(m.x, m.y, ex, ey) / 165), delay: i * .12, px: m.x, py: m.y,
        update(dt, k, it) {
          if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); }
          const dx = ex - m.x, dy = ey - m.y, len = Math.hypot(dx, dy) || 1, off = Math.sin(k * TAU * 1.5 + ph) * 15 * Math.sin(k * PI);
          it.px = m.x + dx * k - dy / len * off; it.py = m.y + dy * k + dx / len * off;
          tr.push(it.px, it.py); if (tr.length > 24) tr.splice(0, 2);
          acc += dt; if (acc > .04) { acc = 0; fx.p({ x: it.px, y: it.py, vy: -8, life: .35, size: 2.2, col: pick(['#5ad0ff', '#b8ecff', '#8a7aff']), shape: 'g' }); }
        },
        draw(ctx, k, it) {
          ctx.globalCompositeOperation = 'lighter'; ribbon(ctx, tr, 8, '#3aa0ff', .75); ctx.globalCompositeOperation = 'source-over'; ribbon(ctx, tr, 2.6, '#e6fbff', .95);
          halo(ctx, it.px, it.py, 14, '#5ad0ff', .9);
          // a tiny wisp with a face, its flame licking backward
          const wob = Math.sin(k * 40) * 1.2;
          ctx.fillStyle = '#5ad0ff'; ctx.beginPath(); ctx.arc(it.px, it.py, 4.4, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.moveTo(it.px - 3.4, it.py - 2); ctx.quadraticCurveTo(it.px + wob, it.py - 11, it.px + 3.4, it.py - 2); ctx.fill();
          ctx.fillStyle = '#e6fbff'; ctx.beginPath(); ctx.arc(it.px, it.py + .4, 2.6, 0, TAU); ctx.fill();
          ctx.fillStyle = '#1a2a5a'; ctx.beginPath(); ctx.arc(it.px - 1, it.py, .7, 0, TAU); ctx.arc(it.px + 1, it.py, .7, 0, TAU); ctx.fill();
        },
        end() {
          flare(fx, ex, ey, 20, '#5ad0ff', .25);
          for (let j = 0; j < 4; j++) { const a2 = -PI / 2 + (j - 1.5) * .6, len = rnd(9, 14);
            fx.add({ dur: .34, draw(ctx, k) { ctx.translate(ex, ey - k * 6); ctx.rotate(a2); ctx.globalAlpha = 1 - k * k; flameTongue(ctx, len * (.3 + Ease.outCubic(k) * .8), 3.6 * Ease.hump(k), '#3aa0ff'); flameTongue(ctx, len * .6 * (.3 + Ease.outCubic(k) * .8), 2 * Ease.hump(k), '#e6fbff'); } }); }
          fx.burst(ex, ey, 6, { col: ['#5ad0ff', '#e6fbff', '#8a7aff'], shape: 'g', spd: 55, life: .5, size: 2.6, up: 30, g: -40 });
          fx.ring(ex, ey, 3, 14, .28, '#5ad0ff', 2);
          if (tg.state === 'active') G.hit(u, tg, u.sp.dmg);
        } });
    }
  } };

ATTACKS.omencrow = { dur: 1, at: .45,                       // Nightfall
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .05, .7)); u.lift = p * 6; u.sy = 1 + p * .05; },
  start(G, u) { charge(G, u, .42, () => muzzle(u, 4.4, 33), 15); },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y, R = u.sp.aoe;
    let acc = 0;
    // the ground goes dark inside a turning ring of runes, and black feathers drift down
    fx.add({ dur: 1.25, ground: true,
      update(dt, k) { acc += dt; if (acc > .07 && k < .7) { acc = 0; fx.p({ x: x + rnd(-R * .8, R * .8), y: y - rnd(40, 70), vx: rnd(-12, 12), vy: rnd(24, 40), life: 1, size: 3.6, col: pick(['#2a1f4a', '#3f3368', '#120c22']), shape: 'l', rot: rnd(TAU), vr: 4 }); } },
      draw(ctx, k) {
        const al = k < .2 ? k / .2 : 1 - Ease.seg(k, .75, 1), g = Ease.outCubic(Math.min(1, k * 3));
        ctx.translate(x, y); ctx.scale(1, .55);
        ctx.beginPath(); ctx.arc(0, 0, R * g, 0, TAU); ctx.globalAlpha = al * .72; ctx.fillStyle = '#1a1030'; ctx.fill();
        ctx.globalAlpha = al; ctx.strokeStyle = '#ff4ad0'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.rotate(k * 2.4); ctx.fillStyle = '#ff4ad0';
        for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); if (i % 2) ctx.fillRect(R * g * .78, -1.2, R * .13, 2.4); else { ctx.beginPath(); ctx.arc(R * g * .84, 0, 2, 0, TAU); ctx.fill(); } }
      } });
    // an eclipse hangs overhead
    fx.add({ dur: 1.1, draw(ctx, k) {
      const ey = y - 68, al = k < .2 ? k / .2 : 1 - Ease.seg(k, .7, 1);
      halo(ctx, x, ey, 30, '#ff4ad0', al * .8);
      ctx.globalAlpha = al; ctx.save(); ctx.translate(x, ey); ctx.rotate(k * 1.5); ctx.fillStyle = '#ff7ae0';
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-1.6, 10); ctx.lineTo(0, 15 + (i % 2) * 4); ctx.lineTo(1.6, 10); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#ff4ad0'; ctx.beginPath(); ctx.arc(x, ey, 10.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#120c22'; ctx.beginPath(); ctx.arc(x + (1 - Math.min(1, k * 2.5)) * 9.5, ey, 9.5, 0, TAU); ctx.fill();
    } });
    // shadow hands claw up out of the dark
    for (let i = 0; i < 6; i++) {
      const an = i / 6 * TAU + .4, hx = x + Math.cos(an) * R * .56, hy = y + Math.sin(an) * R * .31;
      fx.add({ dur: .85, delay: .12 + i * .045, draw(ctx, k) {
        const h = Ease.hump(k) * 24, sw = Math.sin(k * 10 + i) * 3.2;
        ctx.translate(hx, hy); ctx.globalAlpha = .92; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sw, -h * .5, sw * .5, -h);
        ctx.strokeStyle = '#ff4ad0'; ctx.lineWidth = 6; ctx.globalAlpha = .25; ctx.stroke();
        ctx.globalAlpha = .92; ctx.strokeStyle = '#2a1f4a'; ctx.lineWidth = 4.4; ctx.stroke();
        ctx.lineWidth = 1.9;
        for (let f = -1; f <= 1; f++) { ctx.beginPath(); ctx.moveTo(sw * .5, -h); ctx.quadraticCurveTo(sw * .5 + f * 3, -h - 3 * (h / 24), sw * .5 + f * 4, -h - 5.4 * (h / 24)); ctx.stroke(); }
      } });
    }
    fx.after(.3, () => {
      foesIn(G, u.side, x, y, R).forEach(e => impact(G, 'shadow', bodyX(e), bodyY(e), .6, e.x, e.y));
      G.area(u, x, y, R, u.sp.dmg); G.shake(2);
      fx.burst(x, y - 10, 10, { col: ['#ff4ad0', '#8a7aff'], shape: 'g', spd: 40, life: .9, size: 2.6, up: 34, g: -30, jit: R * .45 });
    });
  } };
