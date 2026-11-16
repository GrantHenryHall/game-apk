'use strict';
// ---------- unique attack animations, part A: Fire, Water, Leaf, Spark, Stone ----------
// Each entry: { dur, at, pose(u,k), tick(G,u,k), fire(G,u,tg), commit }
//   pose  = body motion over the attack (k is 0..1)
//   tick  = per-frame emitter while the attack plays
//   fire  = called once at k >= at; spawns the effect and deals the damage
//   commit = the dash really moves the creature

// irregular splat decal that fades (ink, venom, snow)
function splat(fx, x, y, col, r, dur, ground) {
  const lobes = []; for (let i = 0; i < 9; i++) lobes.push(rnd(.55, 1.15));
  fx.add({ dur: dur || .6, ground, draw(ctx, k) {
    const s = r * (.5 + Ease.outCubic(Math.min(1, k * 4)) * .5);
    ctx.globalAlpha = k > .5 ? 1 - (k - .5) / .5 : 1; ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i <= 9; i++) {
      const an = i / 9 * TAU, l = lobes[i % 9] * s, an2 = (i + .5) / 9 * TAU, l2 = s * .5;
      if (!i) ctx.moveTo(x + Math.cos(an) * l, y + Math.sin(an) * l * (ground ? .55 : 1));
      else ctx.quadraticCurveTo(x + Math.cos(an2 - TAU / 9) * l2, y + Math.sin(an2 - TAU / 9) * l2 * (ground ? .55 : 1), x + Math.cos(an) * l, y + Math.sin(an) * l * (ground ? .55 : 1));
    }
    ctx.fill();
  } });
}

// ===================== FIRE =====================
ATTACKS.furnox = { dur: .72, at: .45,                       // Furnace Ram
  pose(u, k) { ram(u, k, 5, 15, .45); u.sy = 1 - Ease.hump(Ease.seg(k, 0, .3)) * .08; },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    fx.add({ dur: .32, draw(ctx, k) {
      ctx.translate(x, y); ctx.rotate(an); ctx.globalAlpha = 1 - k * k;
      const s = .6 + Ease.outCubic(k) * .8;
      for (const q of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(-6 * s, q * 3 * s); ctx.quadraticCurveTo(4 * s, q * 16 * s, 17 * s, q * 13 * s); ctx.quadraticCurveTo(6 * s, q * 9 * s, 2 * s, q * s); ctx.closePath();
        ctx.fillStyle = '#ff5a2a'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-3 * s, q * 3 * s); ctx.quadraticCurveTo(4 * s, q * 12 * s, 12 * s, q * 11 * s); ctx.quadraticCurveTo(5 * s, q * 8 * s, 2 * s, q * 2 * s); ctx.closePath();
        ctx.fillStyle = '#ffd23d'; ctx.fill();
      }
    } });
    fx.pow(x, y, 13, '#ff7a2a', '#ffe27a');
    fx.burst(x, y, 10, { col: ['#ff7a2a', '#ffd23d', '#ff4a1a'], spd: 95, life: .45, size: 2.6, ang: an, spread: 1.1, g: 60 });
    fx.burst(u.x, u.y, 4, { col: 'rgba(170,140,110,.8)', shape: 'p', spd: 25, life: .4, size: 5, grow: 8, flat: .5 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.blazaroo = { dur: .62, at: .2,                      // Blaze Jabs
  pose(u, k) { lunge(u, k, 7, .3); u.lift = Math.abs(Math.sin(k * PI * 2)) * 3; },
  fire(G, u, tg) {
    const fx = G.fx;
    const jab = i => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg) + rnd(-3, 3), y = bodyY(tg) + (i ? 5 : -5), m = muzzle(u, 14, i ? 12 : 17), an = Math.atan2(y - m.y, x - m.x);
      fx.add({ dur: .14, draw(ctx, k) {
        ctx.globalAlpha = 1 - k * .7;
        ctx.translate(lerp(m.x, x, Ease.outCubic(k)), lerp(m.y, y, Ease.outCubic(k))); ctx.rotate(an);
        ctx.beginPath(); ctx.moveTo(5, 0); ctx.quadraticCurveTo(-4, -6, -17, 0); ctx.quadraticCurveTo(-4, 6, 5, 0); ctx.fillStyle = '#ff6a2a'; ctx.fill();
        ctx.beginPath(); ctx.arc(1, 0, 3.4, 0, TAU); ctx.fillStyle = '#ffe27a'; ctx.fill();
      } });
      fx.pow(x, y, 9, '#ff5a2a', '#fff3a8', .08);
      fx.burst(x, y, 5, { col: ['#ff7a2a', '#ffd23d'], spd: 70, life: .3, size: 2, g: 40 });
      G.hit(u, tg, u.sp.dmg);
    };
    jab(0); fx.after(.2, () => jab(1));
  } };

ATTACKS.flarret = { dur: .6, at: .32, commit: true,         // Comet Dash
  pose(u, k) { travel(u, k, .12, .5, u.aD); const h = Ease.hump(Ease.seg(k, .12, .5)); u.sx = 1 + h * .35; u.sy = 1 - h * .2; },
  tick(G, u, k) {
    if (k > .12 && k < .55) for (let i = 0; i < 2; i++) G.fx.p({ x: u.x + u.ox + rnd(-3, 3), y: u.y + u.oy - u.r * .8 + rnd(-3, 3), vx: -u.adx * 30, vy: -u.ady * 30 - 12, life: .35, size: rnd(3, 5.5), col: pick(['#ff7a2a', '#ffd23d', '#ff4a1a']) });
  },
  fire(G, u, tg) {
    const fx = G.fx, x0 = u.x, y0 = u.y - u.r * .8, x1 = u.x + u.adx * u.aD, y1 = u.y + u.ady * u.aD - u.r * .8;
    fx.add({ dur: .38, draw(ctx, k) {
      const gr = ctx.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(255,120,40,0)'); gr.addColorStop(.7, 'rgba(255,170,60,' + (.8 * (1 - k)) + ')'); gr.addColorStop(1, 'rgba(255,245,180,' + (1 - k) + ')');
      ctx.strokeStyle = gr; ctx.lineWidth = 10 * (1 - k * .6); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    } });
    const x = bodyX(tg), y = bodyY(tg);
    fx.pow(x, y, 11, '#ff5a2a', '#ffe27a');
    fx.burst(x, y, 8, { col: ['#ff7a2a', '#ffd23d'], spd: 90, life: .4, size: 2.4, g: 50 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.solcub = { dur: .78, at: .5,                        // Solar Flare
  pose(u, k) { u.sy = 1 + Ease.hump(Ease.seg(k, .1, .6)) * .08; lunge(u, k, -3, .5); },
  tick(G, u, k) {
    if (k < .5 && Math.random() < .6) { const m = muzzle(u, 3, 26), an = rnd(TAU); G.fx.p({ x: m.x + Math.cos(an) * 18, y: m.y + Math.sin(an) * 18, vx: -Math.cos(an) * 55, vy: -Math.sin(an) * 55, life: .3, size: 1.7, col: '#ffe27a' }); }
  },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 6, 25), x = bodyX(tg), y = bodyY(tg);
    fx.add({ dur: .34, draw(ctx, k) {
      const wd = (1 - k) * 7 + 1; ctx.lineCap = 'round'; ctx.globalAlpha = 1 - k * k;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255,150,40,.55)'; ctx.lineWidth = wd * 2.2; ctx.stroke();
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = wd; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = wd * .4; ctx.stroke();
      ctx.translate(x, y); ctx.rotate(k * 2); ctx.fillStyle = '#ffd23d';
      for (let i = 0; i < 8; i++) { ctx.rotate(PI / 4); ctx.beginPath(); ctx.moveTo(-2.4, 5); ctx.lineTo(0, 14 + 6 * (1 - k)); ctx.lineTo(2.4, 5); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fillStyle = '#fff7c0'; ctx.fill();
    } });
    for (let i = 1; i < 5; i++) fx.p({ x: lerp(m.x, x, i / 5), y: lerp(m.y, y, i / 5), life: .4, size: 3.6, col: '#fff', shape: 's', vr: 6 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.campyre = { dur: .9, at: .5,                        // Bonfire Ring
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .6)); u.sy = 1 + p * .16; u.sx = 1 - p * .06; },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y, R = u.sp.aoe;
    fx.add({ dur: .9, ground: true, draw(ctx, k) { ctx.globalAlpha = (1 - k) * .4; ctx.fillStyle = '#3a1a0a'; ctx.beginPath(); ctx.ellipse(x, y, R, R * .55, 0, 0, TAU); ctx.fill(); } });
    const pillar = (px, py, d, s) => fx.add({ dur: .5, delay: d, draw(ctx, k) {
      const h = Ease.hump(k) * s, wob = Math.sin(k * 20) * 1.5; ctx.translate(px, py);
      for (const [w2, col] of [[1, '#ff5a2a'], [.6, '#ffb52e'], [.3, '#fff3a8']]) {
        ctx.beginPath(); ctx.moveTo(-6 * w2, 0); ctx.quadraticCurveTo(-7 * w2, -h * .5, wob * w2, -h * w2 - 2); ctx.quadraticCurveTo(7 * w2, -h * .5, 6 * w2, 0); ctx.closePath();
        ctx.fillStyle = col; ctx.fill();
      }
    } });
    for (let i = 0; i < 7; i++) { const an = i / 7 * TAU; pillar(x + Math.cos(an) * R * .72, y + Math.sin(an) * R * .4, i * .035, 20); }
    pillar(x, y, .2, 30);
    fx.after(.2, () => { G.area(u, x, y, R, u.sp.dmg); fx.burst(x, y - 6, 12, { col: ['#ff7a2a', '#ffd23d'], spd: 60, life: .6, size: 2.4, up: 50, g: -20 }); });
  } };

// ===================== WATER =====================
ATTACKS.walrump = { dur: .9, at: .5,                        // Tidal Flop
  pose(u, k) {
    const j = Ease.seg(k, .1, .5); u.lift = Math.sin(j * PI) * 16; lunge(u, k, 10, .5); u.rot = Math.sin(j * PI) * .25;
    const sq = Ease.hump(Ease.seg(k, .5, .75)); u.sx = 1 + sq * .25; u.sy = 1 - sq * .25;
  },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x + u.adx * 12, y = u.y + u.ady * 12, R = u.sp.aoe;
    fx.ring(x, y, 6, R, .45, '#e8f6ff', 3, true); fx.ring(x, y, 3, R * .7, .5, '#7ac8ff', 2, true, .06);
    for (let i = 0; i < 14; i++) { const an = i / 14 * TAU; fx.p({ x: x + Math.cos(an) * 8, y: y + Math.sin(an) * 5, vx: Math.cos(an) * 55, vy: Math.sin(an) * 30 - 95, g: 300, life: .55, size: 2.6, col: pick(['#bfe6ff', '#7ac8ff', '#fff']), shape: 'd' }); }
    fx.burst(x, y, 6, { col: 'rgba(255,255,255,.9)', shape: 'p', spd: 40, life: .4, size: 5, grow: 10, flat: .5 });
    G.shake(3); G.area(u, x, y, R, u.sp.dmg);
  } };

ATTACKS.snipclaw = { dur: .75, at: .52,                     // Bubble Clamp
  pose(u, k) { ram(u, k, 3, 9, .52); },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(u.ady, u.adx);
    fx.add({ dur: .28, draw(ctx, k) {
      const cl = Ease.outBack(Math.min(1, k * 2.2));
      ctx.translate(x, y); ctx.rotate(an + PI / 2); ctx.globalAlpha = k > .6 ? 1 - (k - .6) / .4 : 1;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * (17 - 13 * cl), 0); ctx.scale(s, 1);
        ctx.beginPath(); ctx.moveTo(8, -12); ctx.quadraticCurveTo(-8, -10, -6, 0); ctx.quadraticCurveTo(-8, 10, 8, 12); ctx.quadraticCurveTo(0, 6, 1, 0); ctx.quadraticCurveTo(0, -6, 8, -12); ctx.closePath();
        ctx.fillStyle = '#3fbccb'; ctx.fill(); ctx.strokeStyle = '#e8ffff'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
      }
    } });
    fx.after(.1, () => {
      fx.burst(x, y, 9, { col: ['#bff3ff', '#fff'], shape: 'b', spd: 60, life: .5, size: 3.4, up: 20 });
      fx.ring(x, y, 3, 15, .25, '#fff', 2); G.hit(u, tg, u.sp.dmg);
    });
  } };

ATTACKS.zipfin = { dur: .6, at: .34, commit: true,          // Jet Lance
  pose(u, k) { travel(u, k, .14, .5, u.aD); const h = Ease.hump(Ease.seg(k, .14, .5)); u.sx = 1 + h * .3; u.sy = 1 - h * .15; },
  tick(G, u, k) {
    if (k > .14 && k < .52) { const x = u.x + u.ox, y = u.y + u.oy - u.r, nx = -u.ady, ny = u.adx; for (const s of [-1, 1]) G.fx.p({ x, y, vx: nx * s * 45 - u.adx * 20, vy: ny * s * 45 - u.ady * 20, life: .3, size: 2.2, col: pick(['#bfe6ff', '#fff', '#7ac8ff']), shape: 'd' }); }
  },
  fire(G, u, tg) {
    const fx = G.fx, x0 = u.x, y0 = u.y - u.r, L = u.aD, an = Math.atan2(u.ady, u.adx);
    fx.add({ dur: .42, draw(ctx, k) {
      ctx.translate(x0, y0); ctx.rotate(an); ctx.globalAlpha = (1 - k) * .8;
      ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(L * .9, -5 * (1 - k)); ctx.lineTo(L + 8, 0); ctx.lineTo(L * .9, 5 * (1 - k)); ctx.lineTo(0, 1); ctx.closePath();
      ctx.fillStyle = '#8fd4ff'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.ellipse(L * i / 4.5, 0, 2 + k * 4, (5 + i) * (.6 + k), 0, 0, TAU); ctx.stroke(); }
    } });
    const x = bodyX(tg), y = bodyY(tg);
    fx.pow(x, y, 10, '#3fa2ff', '#e8f6ff');
    fx.burst(x, y, 8, { col: ['#bfe6ff', '#fff'], shape: 'd', spd: 80, life: .4, size: 2.4, g: 200, up: 30 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.inkjet = { dur: .8, at: .3,                         // Ink Burst
  pose(u, k) { const p = Math.sin(Ease.seg(k, .25, .75) * PI * 3); u.sy = 1 + p * .07; u.sx = 1 - p * .05; lunge(u, k, -3, .4); },
  fire(G, u, tg) {
    const fx = G.fx;
    for (let i = 0; i < 3; i++) {
      const m = muzzle(u, 2, 10);
      shoot(G, tg, { x: m.x, y: m.y, speed: 260, delay: i * .12, arc: 6,
        draw(ctx, x, y, an) {
          ctx.translate(x, y); ctx.rotate(an); ctx.fillStyle = '#1c1f4d';
          ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(0, -4, -10, 0); ctx.quadraticCurveTo(0, 4, 4, 0); ctx.fill();
          ctx.fillStyle = '#6f7fe0'; ctx.beginPath(); ctx.arc(1, -1, 1.2, 0, TAU); ctx.fill();
        },
        trail(x, y) { fx.p({ x, y, life: .25, size: 1.8, col: '#2a2f6a' }); },
        hit(t, x, y) { splat(fx, x, y, '#1c1f4d', 9); fx.burst(x, y, 5, { col: '#2a2f6a', shape: 'd', spd: 60, life: .3, size: 2, g: 150 }); if (t) G.hit(u, t, u.sp.dmg); } });
    }
  } };

ATTACKS.drizzelly = { dur: .95, at: .45,                    // Bubble Bloom
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .6)); u.sy = 1 + p * .14; u.lift = p * 4; },
  fire(G, u, tg) {
    const fx = G.fx, gx = tg.x, gy = tg.y, x = gx, y = gy - tg.r * .8, R = u.sp.aoe, m = muzzle(u, 0, 22);
    for (let i = 0; i < 6; i++) {
      const ex = x + rnd(-R * .6, R * .6), ey = y + rnd(-R * .4, R * .4), rr = rnd(4, 7);
      fx.add({ dur: .5, delay: i * .05, draw(ctx, k) {
        const px = lerp(m.x, ex, Ease.outCubic(k)) + Math.sin(k * 9 + i) * 3, py = lerp(m.y, ey, Ease.outCubic(k)) - Math.sin(k * PI) * 14, q = rr * (.5 + k * .5);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.fillStyle = 'rgba(150,225,255,.4)';
        ctx.beginPath(); ctx.arc(px, py, q, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - q * .3, py - q * .3, q * .2, 0, TAU); ctx.fill();
      }, end() { fx.ring(ex, ey, rr, rr * 2.2, .22, '#fff', 1.6); fx.burst(ex, ey, 4, { col: ['#bfe6ff', '#fff'], shape: 'd', spd: 50, life: .3, size: 1.8, g: 120 }); } });
    }
    fx.after(.55, () => G.area(u, gx, gy, R, u.sp.dmg));
    fx.ring(u.x, u.y, 8, 64, .6, 'rgba(160,235,255,.85)', 2, true);
    G.allies(u.side).forEach(al => { if (dist2(al.x, al.y, u.x, u.y) <= 64) G.heal(al, u.sp.heal, '#9fe8ff'); });
  } };

// ===================== LEAF =====================
ATTACKS.stumply = { dur: .9, at: .45,                       // Root Rise
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .2, .55)); u.sy = 1 - p * .12; u.sx = 1 + p * .08; },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y;
    fx.burst(x, y, 6, { col: 'rgba(150,110,70,.8)', shape: 'p', spd: 30, life: .4, size: 4, grow: 8, flat: .5 });
    fx.add({ dur: 1.1, draw(ctx, k) {
      const g = k < .2 ? Ease.outBack(k / .2) : k > .8 ? 1 - (k - .8) / .2 : 1;
      ctx.translate(x, y); ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const s = i % 2 ? 1 : -1, bx = (i - 1.5) * 7, h = (20 + (i % 2) * 6) * g;
        ctx.beginPath(); ctx.moveTo(bx, 0); ctx.bezierCurveTo(bx + s * 12, -h * .4, bx - s * 10, -h * .8, bx + s * 3, -h);
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 5.4; ctx.stroke(); ctx.strokeStyle = '#a8743c'; ctx.lineWidth = 3; ctx.stroke();
        if (g > .6) { ctx.fillStyle = '#5fd060'; ctx.beginPath(); ctx.ellipse(bx + s * 6, -h - 1, 4, 2, s * .6, 0, TAU); ctx.fill(); }
      }
    } });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.brambear = { dur: .8, at: .25,                      // Thorn Swipe
  pose(u, k) { lunge(u, k, 8, .35); u.rot = Math.sin(k * PI * 3) * .12; },
  fire(G, u, tg) {
    const fx = G.fx, base = Math.atan2(u.ady, u.adx);
    for (let i = 0; i < 3; i++) fx.after(i * .13, () => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg), y = bodyY(tg), rot = base + PI / 2 + (i - 1) * .7;
      fx.add({ dur: .24, draw(ctx, k) {
        ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = 1 - k * k; ctx.lineCap = 'round';
        const L = Ease.outCubic(Math.min(1, k * 2.5));
        for (let j = -1; j <= 1; j++) {
          ctx.beginPath(); ctx.moveTo(-12, j * 5 - 3); ctx.quadraticCurveTo(0, j * 5 + 3, -12 + 24 * L, j * 5 - 3 * (1 - L));
          ctx.strokeStyle = '#eaffd0'; ctx.lineWidth = 3.6 * (1 - k * .5); ctx.stroke(); ctx.strokeStyle = '#4fc85e'; ctx.lineWidth = 1.6; ctx.stroke();
        }
      } });
      fx.burst(x, y, 4, { col: ['#5fd060', '#7fe070', '#3da04a'], shape: 'l', spd: 70, life: .5, size: 3.4, vr: 8, g: 80 });
      G.hit(u, tg, u.sp.dmg);
      if (u.state === 'active') G.heal(u, u.sp.selfHeal, '#7fe070', true);
    });
  } };

ATTACKS.cloverbun = { dur: .7, at: .42,                     // Lucky Kick
  pose(u, k) {
    const j = Ease.seg(k, .08, .42), b = Ease.seg(k, .42, .9), f = j < 1 ? Ease.inOut(j) : 1 - Ease.inOut(b);
    u.ox = u.adx * u.aC * f; u.oy = u.ady * u.aC * f;
    u.lift = j < 1 ? Math.sin(j * PI) * 20 : Math.sin(b * PI) * 12; u.rot = j < 1 ? -j * .3 : 0;
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), crit = Math.random() < u.sp.crit, col = crit ? '#ffd23d' : '#55c85a';
    fx.add({ dur: .42, draw(ctx, k) {
      const s = (crit ? 1.5 : 1) * (.4 + Ease.outBack(Math.min(1, k * 2)) * .8);
      ctx.translate(x, y - 4 * k); ctx.rotate(k * 1.2); ctx.globalAlpha = 1 - k * k * k; ctx.fillStyle = col; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) { ctx.rotate(PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-9 * s, -4 * s, -7 * s, -13 * s, 0, -8 * s); ctx.bezierCurveTo(7 * s, -13 * s, 9 * s, -4 * s, 0, 0); ctx.fill(); ctx.stroke(); }
    } });
    fx.burst(x, y, crit ? 10 : 5, { col: crit ? ['#ffd23d', '#fff'] : ['#fff', '#bfffb0'], shape: 's', spd: 90, life: .45, size: crit ? 4 : 3, vr: 8 });
    if (crit) fx.text(x, y - 18, 'LUCKY!', '#ffd23d', 9);
    G.hit(u, tg, u.sp.dmg * (crit ? 2 : 1));
  } };

ATTACKS.bloomerang = { dur: .9, at: .28,                    // Petal-rang
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .45)); u.rot = -p * .25; lunge(u, k, 3, .3); },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, 8, 14);
    let ex = bodyX(tg), ey = bodyY(tg), h1 = false, h2 = false, acc = 0;
    const strike = dmg => {
      if (tg.state !== 'active') return;
      fx.burst(ex, ey, 5, { col: ['#ff8fb8', '#ffb3cf', '#ffe27a'], shape: 'l', spd: 70, life: .4, size: 3, vr: 9 });
      fx.pow(ex, ey, 8, '#ff8fb8', '#fff'); G.hit(u, tg, dmg);
    };
    fx.add({ dur: .85, px: m.x, py: m.y,
      update(dt, k, it) {
        if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); }
        const home = u.state === 'active', hx = home ? u.x : m.x, hy = home ? u.y - 14 * u.vs : m.y;
        const dx = ex - m.x, dy = ey - m.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        const s = Math.sin(k * PI), side = Math.sin(k * TAU) * 14, fx1 = m.x + dx * 1.25, fy1 = m.y + dy * 1.25;
        if (k < .5) { it.px = lerp(m.x, fx1, s) + nx * side; it.py = lerp(m.y, fy1, s) + ny * side; }
        else { it.px = lerp(hx, fx1, s) + nx * side; it.py = lerp(hy, fy1, s) + ny * side; }
        if (!h1 && k >= .28) { h1 = true; strike(u.sp.dmg); }
        if (!h2 && k >= .72) { h2 = true; strike(u.sp.back); }
        acc += dt; if (acc > .05) { acc = 0; fx.p({ x: it.px, y: it.py, life: .35, size: 2.4, col: pick(['#ff8fb8', '#ffd0e0']), shape: 'l', rot: rnd(TAU), vr: 6 }); }
      },
      draw(ctx, k, it) {
        ctx.translate(it.px, it.py); ctx.rotate(k * 40);
        for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(5.5, 0, 6.5, 3.2, 0, 0, TAU); ctx.fillStyle = i % 2 ? '#ff8fb8' : '#ffb3cf'; ctx.fill(); ctx.strokeStyle = '#6a2a4a'; ctx.lineWidth = .9; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, TAU); ctx.fillStyle = '#ffe27a'; ctx.fill();
      } });
  } };

ATTACKS.sporel = { dur: .9, at: .45,                        // Healing Spores
  pose(u, k) { const p = Ease.seg(k, .15, .7); u.sy = 1 + Math.sin(p * PI * 2) * .08; u.lift = Ease.hump(Ease.seg(k, .3, .6)) * 5; },
  fire(G, u, tg) {
    const fx = G.fx, R = u.sp.healR;
    for (let i = 0; i < 16; i++) { const an = rnd(TAU), d = rnd(6, R * .9); fx.p({ x: u.x + Math.cos(an) * 8, y: u.y - 22 + Math.sin(an) * 4, vx: Math.cos(an) * d * 1.6, vy: Math.sin(an) * d * .9 - 25, drag: 2.2, g: -12, life: rnd(.7, 1.1), size: rnd(1.6, 2.8), col: pick(['#c8ff9a', '#fff7a8', '#9af0a0']) }); }
    fx.ring(u.x, u.y, 8, R, .7, 'rgba(180,255,150,.85)', 2, true);
    G.allies(u.side).forEach(al => { if (dist2(al.x, al.y, u.x, u.y) <= R) G.heal(al, u.sp.heal, '#9af0a0'); });
    const m = muzzle(u, 0, 30);
    shoot(G, tg, { x: m.x, y: m.y, speed: 150, arc: 14,
      draw(ctx, x, y, an, k) { for (let i = 0; i < 3; i++) { const a2 = k * 8 + i * 2.1; ctx.fillStyle = i ? '#c8ff9a' : '#fff7a8'; ctx.beginPath(); ctx.arc(x + Math.cos(a2) * 3, y + Math.sin(a2) * 3, 2.4, 0, TAU); ctx.fill(); } },
      hit(t, x, y) { fx.burst(x, y, 6, { col: ['#c8ff9a', '#fff7a8'], shape: 'p', spd: 30, life: .5, size: 4, grow: 6 }); if (t) G.hit(u, t, u.sp.dmg); } });
  } };

// ===================== SPARK =====================
ATTACKS.ohmadillo = { dur: .85, at: .55, commit: true,      // Static Roll
  pose(u, k) {
    const h = Ease.inCubic(Ease.seg(k, .12, .55)) - Ease.hump(Ease.seg(k, .55, .85)) * .12;
    u.ox = u.adx * u.aC * h; u.oy = u.ady * u.aC * h;
    u.rot = Ease.inOut(Ease.seg(k, .04, .72)) * TAU * 3; u.pivot = true;
    u.lift = Ease.hump(Ease.seg(k, .55, .8)) * 6;
  },
  tick(G, u, k) {
    if (k > .15 && k < .55) {
      G.fx.p({ x: u.x + u.ox, y: u.y + u.oy, vx: -u.adx * 20 + rnd(-10, 10), vy: -12, life: .3, size: 3.5, grow: 7, col: 'rgba(190,170,130,.7)', shape: 'p' });
      if (Math.random() < .5) G.fx.p({ x: u.x + u.ox + rnd(-8, 8), y: u.y + u.oy - u.r + rnd(-8, 8), life: .15, size: 3, col: '#fff7b0', shape: 'z', rot: rnd(TAU) });
    }
  },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg);
    for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + rnd(.3); lightning(fx, x, y, x + Math.cos(an) * 20, y + Math.sin(an) * 20, { segs: 3, jit: 4, wid: 1.6, dur: .2 }); }
    fx.ring(x, y, 4, 20, .25, '#ffe14a', 2.4); fx.pow(x, y, 11, '#ffd23d', '#fff');
    G.shake(2); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.zapcoon = { dur: .6, at: .42,                       // Tail Taser
  pose(u, k) { lunge(u, k, 6, .42); u.rot = Ease.inOut(Ease.seg(k, .15, .62)) * TAU; u.pivot = true; },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), an = Math.atan2(y - (u.y + u.oy - u.r), x - (u.x + u.ox));
    const cx = u.x + u.ox, cy = u.y + u.oy - u.r, R = dist2(cx, cy, x, y) + 3;
    fx.slash(cx, cy, an, R, '#ffe14a', { sweep: 2.4, wid: 6, dur: .26, edge: '#fff' });
    fx.add({ dur: .26, draw(ctx, k) {
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.3; ctx.lineJoin = 'miter'; ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const a2 = an - 1.2 + 2.4 * i / 10, rr = R + (i % 2 ? 4 : -3) + rnd(-1.5, 1.5); ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr); }
      ctx.stroke();
    } });
    fx.burst(x, y, 7, { col: ['#ffe14a', '#fff'], shape: 'k', spd: 110, life: .25, size: 2.4 });
    fx.pow(x, y, 9, '#ffd23d', '#fff');
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.dynafly = { dur: .5, at: .3, commit: true,          // Zigzag Strike
  pose(u, k) {
    const h = k < .2 ? 0 : k < .42 ? (k - .2) / .22 : 1, st = Math.min(4, Math.floor(h * 4 + .0001)), f = st / 4;
    const side = (st % 2 ? 1 : -1) * (st === 0 || st === 4 ? 0 : 10);
    u.ox = u.adx * u.aD * f - u.ady * side; u.oy = u.ady * u.aD * f + u.adx * side;
    u.al = k > .2 && k < .42 ? .55 : 1;
  },
  fire(G, u, tg) {
    const fx = G.fx, x0 = u.x, y0 = u.y - u.r, D = u.aD, pts = [x0, y0];
    for (let i = 1; i <= 4; i++) { const f = i / 4, side = (i % 2 ? 1 : -1) * (i === 4 ? 0 : 10); pts.push(x0 + u.adx * D * f - u.ady * side, y0 + u.ady * D * f + u.adx * side); }
    fx.add({ dur: .34, draw(ctx, k) {
      ctx.globalAlpha = 1 - k * k;
      strokePts(ctx, pts, 'rgba(255,225,80,.5)', 7 * (1 - k * .5)); strokePts(ctx, pts, '#fffbd0', 2.6);
      ctx.fillStyle = '#3de0c8';
      for (let i = 2; i < pts.length - 2; i += 2) { ctx.beginPath(); ctx.arc(pts[i], pts[i + 1], 3.4 * (1 - k), 0, TAU); ctx.fill(); }
    } });
    const x = bodyX(tg), y = bodyY(tg);
    fx.pow(x, y, 10, '#ffd23d', '#fff');
    fx.burst(x, y, 6, { col: ['#ffe14a', '#fff'], shape: 'z', spd: 70, life: .3, size: 3, vr: 10 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.teslowl = { dur: .75, at: .5,                       // Arc Bolt
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .6)); u.sy = 1 + p * .06; u.lift = p * 3; },
  tick(G, u, k) { if (k < .5 && Math.random() < .45) { const m = muzzle(u, rnd(-10, 10), 40); G.fx.p({ x: m.x, y: m.y, vx: rnd(-20, 20), vy: rnd(-30, 0), life: .2, size: 2.6, col: '#bff8ff', shape: 'z', vr: 10, rot: rnd(TAU) }); } },
  fire(G, u, tg) {
    const fx = G.fx, x = bodyX(tg), y = bodyY(tg), p1 = muzzle(u, -9.7, 40), p2 = muzzle(u, 10.7, 40), mx = (p1.x + p2.x) / 2 + u.face * 10, my = p1.y - 3;
    const o = { segs: 3, jit: 3, wid: 1.6, col: '#dffcff', glow: 'rgba(120,240,255,.5)' };
    lightning(fx, p1.x, p1.y, mx, my, o); lightning(fx, p2.x, p2.y, mx, my, o);
    lightning(fx, mx, my, x, y, { segs: 7, jit: 8, wid: 2.8, dur: .26 });
    lightning(fx, lerp(mx, x, .5), lerp(my, y, .5), x + rnd(-18, 18), y + rnd(-18, 18), { segs: 3, jit: 5, wid: 1.4, dur: .18 });
    fx.flash(x, y, 12, '#fffbd0', .15);
    fx.burst(x, y, 8, { col: ['#ffe14a', '#fff', '#7af0ff'], shape: 'k', spd: 120, life: .25, size: 2.2 });
    G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.nimbolt = { dur: .85, at: .45,                      // Thunderclap
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .55)); u.sx = 1 + p * .15; u.sy = 1 - p * .08; if (k > .4 && k < .6) u.ox = Math.sin(k * 120) * 1.2; },
  fire(G, u, tg) {
    const fx = G.fx, cx = bodyX(tg), cy = bodyY(tg) - 52;
    fx.add({ dur: .55, draw(ctx, k) {
      ctx.globalAlpha = k < .2 ? k / .2 : 1 - Ease.seg(k, .65, 1); ctx.fillStyle = '#5a6488';
      for (const q of [[-9, 0, 7], [0, -3, 9], [9, 0, 7], [0, 3, 7]]) { ctx.beginPath(); ctx.arc(cx + q[0], cy + q[1], q[2], 0, TAU); ctx.fill(); }
    } });
    const zap = (x, y) => fx.burst(x, y, 7, { col: ['#ffe14a', '#fff'], shape: 'k', spd: 120, life: .25, size: 2.2 });
    fx.after(.12, () => {
      if (tg.state !== 'active') return;
      const x = bodyX(tg), y = bodyY(tg);
      lightning(fx, x + rnd(-4, 4), y - 50, x, y, { segs: 6, jit: 7, wid: 3.4, dur: .28 });
      fx.flash(x, y, 18, '#fffbd0', .2); fx.ring(tg.x, tg.y, 4, 22, .3, '#ffe14a', 2, true); zap(x, y);
      G.shake(2.5); G.hit(u, tg, u.sp.dmg);
      let prev = tg; const used = [tg];
      for (let i = 0; i < u.sp.chain; i++) {
        const nx = G.nearestEnemy(u.side, prev.x, prev.y, 80, used);
        if (!nx) break; used.push(nx);
        const from = prev;
        fx.after(.08 * (i + 1), () => {
          if (nx.state !== 'active') return;
          lightning(fx, bodyX(from), bodyY(from), bodyX(nx), bodyY(nx), { segs: 5, jit: 6, wid: 2, dur: .2 });
          zap(bodyX(nx), bodyY(nx)); G.hit(u, nx, u.sp.dmg * .6);
        });
        prev = nx;
      }
    });
  } };

// ===================== STONE =====================
ATTACKS.cobblem = { dur: .95, at: .5,                       // Quake Stomp
  pose(u, k) { const j = Ease.seg(k, .1, .5); u.lift = Math.sin(j * PI) * 10; const sq = Ease.hump(Ease.seg(k, .5, .8)); u.sx = 1 + sq * .18; u.sy = 1 - sq * .2; },
  fire(G, u, tg) {
    const fx = G.fx, x = u.x, y = u.y, R = u.sp.aoe, cracks = [];
    for (let i = 0; i < 8; i++) {
      const an = i / 8 * TAU + rnd(-.2, .2), pts = [0, 0];
      for (let j = 1; j <= 4; j++) { const rr = R * j / 4, a2 = an + rnd(-.25, .25); pts.push(Math.cos(a2) * rr, Math.sin(a2) * rr * .55); }
      cracks.push(pts);
    }
    fx.add({ dur: 1.1, ground: true, draw(ctx, k) {
      ctx.translate(x, y); ctx.globalAlpha = k > .6 ? 1 - (k - .6) / .4 : 1;
      const n = Math.max(2, Math.ceil(Ease.outCubic(Math.min(1, k * 4)) * 4) + 1);
      for (const p of cracks) { const sub = p.slice(0, n * 2); strokePts(ctx, sub, '#6b4a2c', 3); strokePts(ctx, sub, '#2a1c10', 1.2); }
    } });
    fx.ring(x, y, 8, R, .4, 'rgba(215,185,145,.95)', 3, true);
    for (let i = 0; i < 10; i++) { const an = rnd(TAU), d = rnd(8, R * .8); fx.p({ x: x + Math.cos(an) * d, y: y + Math.sin(an) * d * .55, vx: rnd(-20, 20), vy: rnd(-140, -70), g: 420, life: .55, size: rnd(2, 3.6), col: pick(['#b89d7c', '#95795a', '#cdb393']), shape: 'q', vr: 10, rot: rnd(TAU) }); }
    G.shake(4); G.area(u, x, y, R, u.sp.dmg);
  } };

ATTACKS.quarrilla = { dur: .95, at: .5,                     // Rock Uppercut
  pose(u, k) { ram(u, k, 2, 7, .5); u.sy = 1 - Ease.hump(Ease.seg(k, .3, .5)) * .1; },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y;
    fx.add({ dur: .75, ground: true, draw(ctx, k) {
      const h = k < .2 ? Ease.outBack(k / .2) * 32 : k < .6 ? 32 : 32 * (1 - Ease.inCubic((k - .6) / .4));
      ctx.translate(x, y); ctx.globalAlpha = k > .8 ? 1 - (k - .8) / .2 : 1; ctx.lineJoin = 'round';
      ctx.fillStyle = '#95795a'; ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-6, -h + 8); ctx.lineTo(6, -h + 8); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#bca688';
      ctx.beginPath(); ctx.moveTo(-9, -h + 9); ctx.lineTo(-10, -h); ctx.lineTo(-5, -h - 6); ctx.lineTo(6, -h - 6); ctx.lineTo(10, -h); ctx.lineTo(9, -h + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, -h - 5); ctx.lineTo(-3, -h + 2); ctx.moveTo(2, -h - 5); ctx.lineTo(2, -h + 2); ctx.stroke();
    } });
    fx.burst(x, y, 8, { col: ['#b89d7c', '#95795a'], shape: 'q', spd: 80, life: .5, size: 3, up: 80, g: 380, vr: 10 });
    fx.burst(x, y, 5, { col: 'rgba(170,140,110,.8)', shape: 'p', spd: 30, life: .4, size: 5, grow: 8, flat: .5 });
    G.shake(3); G.hit(u, tg, u.sp.dmg);
    if (tg.state === 'active') tg.kz = 150;
  } };

ATTACKS.jerboing = { dur: .95, at: .62, commit: true,       // Burrow Pop
  pose(u, k) {
    const under = Ease.inOut(Ease.seg(k, .18, .58)), pop = Ease.seg(k, .58, .95);
    u.ox = u.adx * u.aC * under; u.oy = u.ady * u.aC * under;
    if (k < .18) u.sy = 1 - Ease.seg(k, 0, .18) * .9;
    else if (k < .58) u.hide = true;
    else { u.lift = Math.sin(pop * PI) * 20; u.rot = Ease.inOut(pop) * TAU; u.pivot = true; }
  },
  tick(G, u, k) {
    if (k > .1 && k < .6) {
      const x = u.x + u.ox, y = u.y + u.oy;
      G.fx.p({ x: x + rnd(-4, 4), y: y + rnd(-2, 2), vy: -18, life: .45, size: 4, grow: 5, col: 'rgba(150,110,70,.85)', shape: 'p' });
      if (Math.random() < .6) G.fx.p({ x, y, vx: rnd(-30, 30), vy: rnd(-70, -30), g: 300, life: .35, size: 2, col: '#8a623a' });
    }
  },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y;
    for (let i = 0; i < 16; i++) fx.p({ x: x + rnd(-6, 6), y, vx: rnd(-55, 55), vy: rnd(-170, -70), g: 420, life: .6, size: rnd(2, 3.6), col: pick(['#8a623a', '#b08a5a', '#6a4826']) });
    fx.ring(x, y, 5, 22, .35, 'rgba(190,150,100,.9)', 3, true);
    fx.pow(bodyX(tg), bodyY(tg), 11, '#e6b96a', '#fff3d0');
    G.shake(2); G.hit(u, tg, u.sp.dmg);
  } };

ATTACKS.glintgecko = { dur: .85, at: .5,                    // Prism Shard
  pose(u, k) { lunge(u, k, -4, .5); u.sy = 1 + Ease.hump(Ease.seg(k, .1, .5)) * .06; },
  fire(G, u, tg) {
    const fx = G.fx, m = muzzle(u, -1, 26); let hue = 0;
    shoot(G, tg, { x: m.x, y: m.y, speed: 330, trailEvery: .02,
      draw(ctx, x, y, an) {
        ctx.translate(x, y); ctx.rotate(an);
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(3, -4); ctx.lineTo(-7, -3); ctx.lineTo(-10, 0); ctx.lineTo(-7, 3); ctx.lineTo(3, 4); ctx.closePath();
        const gr = ctx.createLinearGradient(-10, 0, 10, 0); gr.addColorStop(0, '#ff9ad8'); gr.addColorStop(.5, '#fff'); gr.addColorStop(1, '#7aecff');
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = .8; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
      },
      trail(x, y) { hue = (hue + 47) % 360; fx.p({ x, y, life: .35, size: 2.6, col: 'hsl(' + hue + ',95%,72%)', shape: 'q', vr: 8, rot: rnd(TAU) }); },
      hit(t, x, y) {
        fx.burst(x, y, 10, { col: ['#7aecff', '#ff9ad8', '#b6a0ff', '#fff'], shape: 'q', spd: 110, life: .45, size: 3.4, vr: 12, g: 120 });
        fx.p({ x, y, life: .3, size: 12, col: '#fff', shape: 's', vr: 5 });
        if (t) G.hit(u, t, u.sp.dmg);
      } });
  } };

ATTACKS.ankhat = { dur: .95, at: .45,                       // Pyramid Seal
  pose(u, k) { const p = Ease.hump(Ease.seg(k, .1, .7)); u.lift = p * 4; u.sy = 1 + p * .05; },
  fire(G, u, tg) {
    const fx = G.fx, x = tg.x, y = tg.y, R = u.sp.aoe;
    fx.add({ dur: 1, ground: true, draw(ctx, k) {
      const al = k < .2 ? k / .2 : 1 - Ease.seg(k, .7, 1);
      ctx.translate(x, y); ctx.scale(1, .55); ctx.rotate(k * 2);
      ctx.globalAlpha = al * .25; ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.globalAlpha = al; ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R * .78, 0, TAU); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        ctx.rotate(TAU / 12); ctx.fillStyle = i % 3 ? '#ffd34a' : '#3de0d0';
        if (i % 2) ctx.fillRect(R * .82, -1.5, R * .13, 3); else { ctx.beginPath(); ctx.arc(R * .89, 0, 2.2, 0, TAU); ctx.fill(); }
      }
    } });
    fx.add({ dur: .9, draw(ctx, k) {
      const py = y - 60 * (1 - Ease.outBounce(Math.min(1, k * 2.2))), S = 22;
      ctx.globalAlpha = (k > .75 ? 1 - (k - .75) / .25 : Math.min(1, k * 5)) * .88;
      ctx.beginPath(); ctx.moveTo(x, py - S * 1.3); ctx.lineTo(x + S, py); ctx.lineTo(x - S, py); ctx.closePath();
      const gr = ctx.createLinearGradient(x - S, py, x + S, py);
      gr.addColorStop(0, 'rgba(255,225,120,.8)'); gr.addColorStop(.55, 'rgba(255,245,190,.9)'); gr.addColorStop(.56, 'rgba(240,180,60,.8)'); gr.addColorStop(1, 'rgba(220,150,40,.75)');
      ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = '#fff3c0'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, py - S * 1.3); ctx.lineTo(x + S * .12, py); ctx.stroke();
      ctx.strokeStyle = '#2a4fc0'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x - 5, py - S * .42, 4.4, 2.2, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#2a4fc0'; ctx.beginPath(); ctx.arc(x - 5, py - S * .42, 1.2, 0, TAU); ctx.fill();
    } });
    fx.after(.4, () => {
      G.area(u, x, y, R, u.sp.dmg); G.shake(2);
      for (let i = 0; i < 12; i++) { const an = rnd(TAU); fx.p({ x: x + Math.cos(an) * R * .5, y: y + Math.sin(an) * R * .3, vx: -Math.sin(an) * 60, vy: Math.cos(an) * 34 - 10, drag: 1.5, life: .7, size: rnd(1.6, 2.8), col: pick(['#f0d49a', '#e6b96a', '#fff3c0']) }); }
    });
  } };
