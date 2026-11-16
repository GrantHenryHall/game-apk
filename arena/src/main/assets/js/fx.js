'use strict';
// ---------- effects engine: timed effect items, particles, floating text ----------
// Everything here lives in battlefield units; the renderer sets up the transform.
class FxSystem {
  constructor() { this.items = []; this.parts = []; this.texts = []; this.shake = 0; }

  // o: { dur, delay?, ground?, draw(ctx, k, o), update?(dt, k, o), end?(o) }
  add(o) { o.t = -(o.delay || 0); o.dur = o.dur || .5; this.items.push(o); return o; }
  after(delay, fn) { return this.add({ dur: .001, delay, draw: null, end: fn }); }

  // particle: { x,y,vx,vy,g,drag,life,size,grow,col,shape,rot,vr,al }
  p(o) {
    if (this.parts.length > 420) return;
    o.max = o.life = o.life || .5; o.vx = o.vx || 0; o.vy = o.vy || 0; o.g = o.g || 0;
    o.size = o.size || 2; o.rot = o.rot || 0; o.vr = o.vr || 0; o.shape = o.shape || 'c';
    this.parts.push(o);
  }
  burst(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const an = (o.ang === undefined ? rnd(TAU) : o.ang + rnd(-(o.spread || .5), o.spread || .5));
      const sp = rnd(o.spd * .45, o.spd);
      this.p({
        x: x + rnd(-(o.jit || 0), o.jit || 0), y: y + rnd(-(o.jit || 0), o.jit || 0),
        vx: Math.cos(an) * sp, vy: Math.sin(an) * sp * (o.flat || 1) - (o.up || 0),
        g: o.g || 0, drag: o.drag || 0, life: rnd((o.life || .5) * .6, o.life || .5),
        size: rnd((o.size || 2) * .6, o.size || 2), grow: o.grow || 0,
        col: Array.isArray(o.col) ? pick(o.col) : o.col, shape: o.shape || 'c',
        rot: rnd(TAU), vr: o.vr ? rnd(-o.vr, o.vr) : 0, al: o.al
      });
    }
  }
  text(x, y, str, col, size, o) {
    this.texts.push(Object.assign({ x, y, str, col, size: size || 9, t: 0, dur: .8, vy: -22 }, o || {}));
  }
  ring(x, y, r0, r1, dur, col, lw, ground, delay) {
    this.add({ dur, ground, delay, draw(ctx, k) {
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = col; ctx.lineWidth = (lw || 2) * (1 - k * .6);
      ctx.beginPath(); ctx.ellipse(x, y, lerp(r0, r1, Ease.outCubic(k)), lerp(r0, r1, Ease.outCubic(k)) * (ground ? .55 : 1), 0, 0, TAU); ctx.stroke();
    } });
  }
  flash(x, y, r, col, dur, delay) {
    this.add({ dur: dur || .18, delay, draw(ctx, k) {
      ctx.globalAlpha = (1 - k) * .85; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, r * (.6 + k * .6), 0, TAU); ctx.fill();
    } });
  }
  // spiky comic impact star
  pow(x, y, r, c1, c2, delay) {
    const rot = rnd(TAU);
    this.add({ dur: .22, delay, draw(ctx, k) {
      const s = r * (.5 + Ease.outBack(Math.min(1, k * 1.6)) * .6);
      ctx.globalAlpha = 1 - k * k;
      for (let pass = 0; pass < 2; pass++) {
        const rr = pass ? s * .55 : s;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) { const an = rot + i * PI / 8, q = i % 2 ? rr * .5 : rr; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(an) * q, y + Math.sin(an) * q); }
        ctx.closePath(); ctx.fillStyle = pass ? c2 : c1; ctx.fill();
      }
    } });
  }
  // curved slash sweeping around (x,y)
  slash(x, y, ang, rad, col, o) {
    o = o || {};
    const sweep = o.sweep || 1.6, wid = o.wid || 5;
    this.add({ dur: o.dur || .22, delay: o.delay, draw(ctx, k) {
      const head = ang - sweep / 2 + sweep * Ease.outCubic(k), tail = ang - sweep / 2 + sweep * Ease.outCubic(Math.max(0, k * 1.5 - .5));
      ctx.globalAlpha = 1 - k * k;
      ctx.beginPath(); ctx.arc(x, y, rad, tail, head);
      ctx.arc(x, y, rad - wid * (1 - k * .5), head, tail, true); ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
      if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, rad, tail, head); ctx.stroke(); }
    } });
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 30);
    const it = this.items;
    for (let i = it.length - 1; i >= 0; i--) {
      const o = it[i]; o.t += dt;
      if (o.t < 0) continue;
      const k = Math.min(1, o.t / o.dur);
      if (o.update) o.update(dt, k, o);
      if (o.t >= o.dur || o.dead) { if (o.end && !o.dead) o.end(o); it.splice(i, 1); }
    }
    const ps = this.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
      p.vy += p.g * dt;
      if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.grow) p.size += p.grow * dt;
    }
    const tx = this.texts;
    for (let i = tx.length - 1; i >= 0; i--) { const q = tx[i]; q.t += dt; q.y += q.vy * dt; q.vy *= Math.exp(-3 * dt); if (q.t >= q.dur) tx.splice(i, 1); }
  }

  drawItems(ctx, ground) {
    const it = this.items;
    for (let i = 0; i < it.length; i++) {
      const o = it[i];
      if (o.t < 0 || !o.draw || !!o.ground !== ground) continue;
      ctx.save(); o.draw(ctx, Math.min(1, o.t / o.dur), o); ctx.restore();
    }
  }
  drawParts(ctx) {
    const ps = this.parts;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i], k = p.life / p.max, s = p.size;
      ctx.globalAlpha = (p.al === undefined ? 1 : p.al) * Math.min(1, k * 2.2);
      ctx.fillStyle = ctx.strokeStyle = p.col;
      switch (p.shape) {
        case 'c': ctx.beginPath(); ctx.arc(p.x, p.y, s * (.4 + k * .6), 0, TAU); ctx.fill(); break;
        case 'p': ctx.globalAlpha *= .75 * k; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.fill(); break;
        case 'r': ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.stroke(); break;
        case 'b': ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.stroke();
          ctx.globalAlpha *= .35; ctx.fill(); ctx.globalAlpha = Math.min(1, k * 2.2); ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(p.x - s * .35, p.y - s * .35, s * .25, 0, TAU); ctx.fill(); break;
        case 'k': { const m = Math.hypot(p.vx, p.vy) || 1, l = s * 2.2;
          ctx.lineWidth = s * .5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / m * l, p.y - p.vy / m * l); ctx.stroke(); break; }
        case 'd': { const an = Math.atan2(p.vy, p.vx);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(an); ctx.beginPath(); ctx.moveTo(s, 0); ctx.quadraticCurveTo(-s, -s * .8, -s * 2, 0); ctx.quadraticCurveTo(-s, s * .8, s, 0); ctx.fill(); ctx.restore(); break; }
        case 's': { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); const q = s * (.5 + k * .5);
          ctx.beginPath(); for (let j = 0; j < 8; j++) { const an = j * PI / 4, rr = j % 2 ? q * .38 : q; ctx[j ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
          ctx.closePath(); ctx.fill(); ctx.restore(); break; }
        case 'l': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * .7, s, 0); ctx.quadraticCurveTo(0, s * .7, -s, 0); ctx.fill(); ctx.restore(); break;
        case 'f': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.lineWidth = .9; ctx.lineCap = 'round';
          ctx.beginPath(); for (let j = 0; j < 3; j++) { const an = j * PI / 3; ctx.moveTo(Math.cos(an) * s, Math.sin(an) * s); ctx.lineTo(-Math.cos(an) * s, -Math.sin(an) * s); } ctx.stroke(); ctx.restore(); break;
        case 'q': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .8, s * .7); ctx.lineTo(-s * .7, s * .5); ctx.closePath(); ctx.fill(); ctx.restore(); break;
        case 'h': ctx.fillRect(p.x - s * .28, p.y - s, s * .56, s * 2); ctx.fillRect(p.x - s, p.y - s * .28, s * 2, s * .56); break;
        case 'z': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.lineWidth = 1.1; ctx.lineJoin = 'miter';
          ctx.beginPath(); ctx.moveTo(-s, -s * .4); ctx.lineTo(-s * .2, s * .4); ctx.lineTo(s * .2, -s * .4); ctx.lineTo(s, s * .4); ctx.stroke(); ctx.restore(); break;
      }
    }
    ctx.globalAlpha = 1;
  }
  drawTexts(ctx) {
    const tx = this.texts;
    for (let i = 0; i < tx.length; i++) {
      const q = tx[i], k = q.t / q.dur, pop = k < .15 ? Ease.outBack(k / .15) : 1;
      ctx.globalAlpha = k > .7 ? 1 - (k - .7) / .3 : 1;
      chunkyText(ctx, q.str, q.x, q.y, q.size * pop, q.col, q.stroke || 'rgba(30,20,45,.9)', q.size * .26);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- shared helpers for the attack files ----------
// jagged lightning polyline between two points
function boltPts(x1, y1, x2, y2, segs, jit) {
  const pts = [x1, y1], dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  for (let i = 1; i < segs; i++) { const k = i / segs, o = rnd(-jit, jit); pts.push(x1 + dx * k + nx * o, y1 + dy * k + ny * o); }
  pts.push(x2, y2); return pts;
}
function strokePts(ctx, pts, col, wd) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}
// lightning that re-rolls its shape a few times while it lives
function lightning(fx, x1, y1, x2, y2, o) {
  o = o || {};
  let pts = boltPts(x1, y1, x2, y2, o.segs || 6, o.jit || 7), acc = 0;
  fx.add({ dur: o.dur || .22, delay: o.delay,
    update(dt) { acc += dt; if (acc > .045) { acc = 0; pts = boltPts(x1, y1, x2, y2, o.segs || 6, o.jit || 7); } },
    draw(ctx, k) {
      ctx.globalAlpha = 1 - k * k;
      strokePts(ctx, pts, o.glow || 'rgba(255,225,80,.45)', (o.wid || 2.4) * 2.6);
      strokePts(ctx, pts, o.col || '#fff9c4', o.wid || 2.4);
    } });
}
// centre of a unit's body (where hits land)
const bodyX = u => u.x + (u.ox || 0), bodyY = u => u.y + (u.oy || 0) - u.r * .95 - (u.z || 0) - (u.lift || 0);
// point in front of a unit, in its own art units (fwd along facing, up from the ground)
function muzzle(u, fwd, up) { return { x: u.x + u.face * fwd * u.vs, y: u.y - up * u.vs - (u.lift || 0) }; }

// generic homing projectile. o: { x, y, speed, arc, draw(ctx,x,y,ang,k,o), trail(x,y,o), hit(tgt|null,x,y) }
function shoot(G, tg, o) {
  const sx = o.x, sy = o.y;
  let ex = bodyX(tg), ey = bodyY(tg);
  const dur = Math.max(.08, dist2(sx, sy, ex, ey) / o.speed);
  let acc = 0;
  return G.fx.add({ dur, delay: o.delay, px: sx, py: sy, ang: 0,
    update(dt, k, it) {
      if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); }
      const nx = lerp(sx, ex, k), ny = lerp(sy, ey, k) - Math.sin(k * PI) * (o.arc || 0);
      it.ang = Math.atan2(ny - it.py, nx - it.px); it.px = nx; it.py = ny;
      if (o.trail) { acc += dt; if (acc > (o.trailEvery || .03)) { acc = 0; o.trail(nx, ny, it); } }
    },
    draw(ctx, k, it) { o.draw(ctx, it.px, it.py, it.ang, k, it); },
    end(it) { o.hit(tg.state === 'active' ? tg : null, ex, ey); } });
}

// ---------- body-motion helpers used by attack poses ----------
function lunge(u, k, amt, peak) {
  peak = peak || .4;
  const h = k < peak ? Ease.outCubic(k / peak) : 1 - Ease.inOut((k - peak) / (1 - peak));
  u.ox = u.adx * amt * h; u.oy = u.ady * amt * h;
}
// wind back, then lunge
function ram(u, k, back, fwd, hitK) {
  let h;
  if (k < hitK * .6) h = -back * Ease.outCubic(k / (hitK * .6));
  else if (k < hitK) h = lerp(-back, fwd, Ease.inCubic((k - hitK * .6) / (hitK * .4)));
  else h = fwd * (1 - Ease.inOut((k - hitK) / (1 - hitK)));
  u.ox = u.adx * h; u.oy = u.ady * h;
}
// travel a fixed distance along the attack direction between k0 and k1 and stay there
function travel(u, k, k0, k1, d) {
  const h = Ease.inOut(Ease.seg(k, k0, k1));
  u.ox = u.adx * d * h; u.oy = u.ady * d * h; return h;
}

const ATTACKS = {};
