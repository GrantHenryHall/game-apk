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
    if (this.parts.length > 560) return;
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
        case 'g': { const q = s * (.5 + k * .5); halo(ctx, p.x, p.y, q * 2.5, p.col, 1); ctx.fillStyle = '#ffffff'; ctx.globalAlpha *= .9; ctx.beginPath(); ctx.arc(p.x, p.y, q * .42, 0, TAU); ctx.fill(); break; }
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
// soft glow sprites, tinted once per colour and reused (cheap additive light)
const GLOW_CACHE = {};
function glowSprite(col) {
  let s = GLOW_CACHE[col];
  if (!s) {
    s = document.createElement('canvas'); s.width = s.height = 64;
    const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(.3, rgba(col, .6)); gr.addColorStop(.65, rgba(col, .18)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); GLOW_CACHE[col] = s;
  }
  return s;
}
// a glowing blob of light. col must be a #hex colour. add=false draws it as plain paint instead of light
function halo(ctx, x, y, r, col, al, add) {
  if (r <= .2 || al <= .01) return;
  const pa = ctx.globalAlpha, pc = ctx.globalCompositeOperation;
  ctx.globalAlpha = pa * Math.min(1, al * .72); if (add !== false) ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = pa; ctx.globalCompositeOperation = pc;
}
// tapered ribbon through recent positions [x,y,...] (newest last)
function ribbon(ctx, pts, w, col, al) {
  const n = pts.length >> 1; if (n < 2) return;
  ctx.lineCap = 'round'; ctx.strokeStyle = col;
  for (let i = 1; i < n; i++) {
    const f = i / (n - 1);
    ctx.globalAlpha = (al === undefined ? 1 : al) * f * f; ctx.lineWidth = Math.max(.5, w * f);
    ctx.beginPath(); ctx.moveTo(pts[i * 2 - 2], pts[i * 2 - 1]); ctx.lineTo(pts[i * 2], pts[i * 2 + 1]); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function star4(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .3, y - r * .3); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .3, y + r * .3);
  ctx.lineTo(x, y + r); ctx.lineTo(x - r * .3, y + r * .3); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .3, y - r * .3); ctx.closePath(); ctx.fill();
}
// flame teardrop pointing along +x from the origin
function flameTongue(ctx, l, w, col) {
  ctx.beginPath(); ctx.moveTo(0, -w); ctx.quadraticCurveTo(l * .55, -w * 1.05, l, 0); ctx.quadraticCurveTo(l * .55, w * 1.05, 0, w); ctx.quadraticCurveTo(-w * .9, 0, 0, -w);
  ctx.fillStyle = col; ctx.fill();
}
// a pop of light that swells and fades
function flare(fx, x, y, r, col, dur, delay) {
  fx.add({ dur: dur || .25, delay, draw(ctx, k) { halo(ctx, x, y, r * (.55 + Ease.outCubic(k) * .65), col, (1 - k) * .62); } });
}
// thin four-point lens flare
function cross(fx, x, y, len, col, dur, rot, delay) {
  fx.add({ dur: dur || .25, delay, draw(ctx, k) {
    const l = len * (.4 + Ease.outCubic(k) * .7), w = len * .085 * (1 - k);
    ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha = 1 - k * k; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col;
    for (let i = 0; i < 2; i++) { ctx.rotate(PI / 2); ctx.beginPath(); ctx.moveTo(-l, 0); ctx.lineTo(0, -w); ctx.lineTo(l, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill(); }
  } });
}
// light spilling onto the grass
function groundGlow(fx, x, y, r, col, dur, al, delay) {
  fx.add({ dur: dur || .4, ground: true, delay, draw(ctx, k) { ctx.translate(x, y); ctx.scale(1, .55); halo(ctx, 0, 0, r * (.7 + k * .4), col, (al || .7) * .7 * (1 - k)); } });
}
// thick shockwave: a soft coloured band with a bright core line
function shock(fx, x, y, r0, r1, dur, col, ground, delay) {
  fx.add({ dur: dur || .4, ground, delay, draw(ctx, k) {
    const r = lerp(r0, r1, Ease.outCubic(k)), sq = ground ? .55 : 1;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * sq, 0, 0, TAU);
    ctx.globalAlpha = (1 - k) * .32; ctx.strokeStyle = col; ctx.lineWidth = 4.6 * (1 - k * .5); ctx.stroke();
    ctx.globalAlpha = (1 - k * k) * .9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4 * (1 - k * .5); ctx.stroke();
  } });
}
// marks left on the grass that linger and fade
function decal(fx, x, y, r, kind) {
  if (fx.items.length > 170) return;
  const seed = rnd(TAU);
  fx.add({ dur: kind === 'dark' ? 1.4 : 1.9, ground: true, draw(ctx, k) {
    const al = k < .06 ? k / .06 : 1 - Ease.seg(k, .4, 1);
    ctx.translate(x, y); ctx.scale(1, .55);
    switch (kind) {
      case 'scorch':
        ctx.globalAlpha = al * .34; ctx.fillStyle = '#3a1a0a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.globalAlpha = al * .3; ctx.beginPath(); ctx.arc(0, 0, r * .6, 0, TAU); ctx.fill();
        if (k < .5) { ctx.globalAlpha = (1 - k * 2) * .9; ctx.fillStyle = '#ffb02e'; for (let i = 0; i < 6; i++) { const an = seed + i * 1.3, rr = r * (.3 + (i % 3) * .2); ctx.beginPath(); ctx.arc(Math.cos(an) * rr, Math.sin(an) * rr, 1.3, 0, TAU); ctx.fill(); } }
        break;
      case 'wet':
        ctx.globalAlpha = al * .28; ctx.fillStyle = '#2a7fc4'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.globalAlpha = al * .7; ctx.strokeStyle = '#eaf7ff'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(0, 0, r * .68, seed, seed + 1.7); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * .4, seed + 3, seed + 4.2); ctx.stroke(); break;
      case 'frost':
        ctx.globalAlpha = al * .55; ctx.fillStyle = '#eafaff'; ctx.beginPath();
        for (let i = 0; i < 16; i++) { const an = seed + i * TAU / 16, rr = i % 2 ? r * .7 : r * 1.1; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
        ctx.closePath(); ctx.fill(); ctx.globalAlpha = al * .85; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); break;
      case 'crack':
        ctx.globalAlpha = al * .8; ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 1.7; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
        for (let i = 0; i < 5; i++) { const an = seed + i * TAU / 5; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an + .28) * r * .5, Math.sin(an + .28) * r * .5); ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
        ctx.stroke(); break;
      case 'goo':
        ctx.globalAlpha = al * .6; ctx.fillStyle = '#7d3fc0'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.globalAlpha = al * .5; ctx.fillStyle = '#a4ff4a'; ctx.beginPath(); ctx.arc(-r * .15, -r * .1, r * .55, 0, TAU); ctx.fill(); break;
      case 'dark':
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.globalAlpha = al * .5; ctx.fillStyle = '#1a1030'; ctx.fill();
        ctx.globalAlpha = al * .75; ctx.strokeStyle = '#ff4ad0'; ctx.lineWidth = 1.1; ctx.stroke(); break;
      case 'ink':
        ctx.globalAlpha = al * .6; ctx.fillStyle = '#1c1f4d'; ctx.beginPath();
        for (let i = 0; i < 14; i++) { const an = seed + i * TAU / 14, rr = i % 2 ? r * .62 : r * 1.05; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
        ctx.closePath(); ctx.fill(); break;
      case 'snow':
        ctx.globalAlpha = al * .8; ctx.fillStyle = '#ffffff'; ctx.beginPath();
        for (let i = 0; i < 9; i++) { const an = seed + i * TAU / 9; ctx.moveTo(Math.cos(an) * r * .55, Math.sin(an) * r * .55); ctx.arc(Math.cos(an) * r * .55, Math.sin(an) * r * .55, r * .42, 0, TAU); }
        ctx.arc(0, 0, r * .6, 0, TAU); ctx.fill(); break;
      case 'sigil':
        ctx.globalAlpha = al * .9; ctx.strokeStyle = '#b48aff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#2fe0c8'; ctx.lineWidth = 1; ctx.rotate(seed + k * 2); ctx.beginPath();
        for (let i = 0; i <= 5; i++) { const an = i * TAU * 2 / 5; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * r, Math.sin(an) * r); }
        ctx.stroke(); break;
    }
  } });
}
// a see-through echo of a creature exactly as it looks right now (dash trails, blinks)
function ghost(G, u, al, dur) {
  const x = u.x + u.ox, y = u.y + u.oy - u.lift - u.z, face = (u.flip ? -1 : 1) * u.face, s = u.vs, id = u.sp.id, seed = u.seed;
  const sx = u.sx, sy = u.sy, rot = u.rot, pv = u.pivot, t = G.time, atk = u.atkT >= 0 ? clamp(u.atkT / u.atk.dur, .001, 1) : 0;
  G.fx.add({ dur: dur || .26, draw(ctx, k) {
    ctx.globalAlpha = (al || .45) * .7 * (1 - k); ctx.translate(x, y); ctx.scale(s * face * sx, s * sy);
    if (rot) { if (pv) { ctx.translate(0, -15); ctx.rotate(rot); ctx.translate(0, 15); } else ctx.rotate(rot); }
    drawCreature(ctx, id, t, { atk, seed, noBlink: true });
  } });
}

// ----- wind-ups: motes gather where the move is about to come from while a glow swells -----
const CHARGE = {
  fire: ['g', ['#ff7a2a', '#ffd23d'], '#ff8a2a'], water: ['b', ['#bfe6ff', '#ffffff'], '#7ac8ff'], leaf: ['l', ['#5fd060', '#b8f09a'], '#8fe87a'],
  spark: ['z', ['#fff7b0', '#7af0ff'], '#ffe14a'], stone: ['q', ['#b89d7c', '#e6d3b0'], '#e6c890'], frost: ['f', ['#ffffff', '#aef2ff'], '#aef2ff'],
  sky: ['k', ['#ffffff', '#cfe0ff'], '#cfe0ff'], venom: ['b', ['#a4ff4a', '#c88af0'], '#a4ff4a'], mystic: ['s', ['#b48aff', '#2fe0c8', '#ffc93d'], '#b48aff'],
  shadow: ['g', ['#8a5cff', '#ff4ad0'], '#b05cff'], gold: ['g', ['#ffd34a', '#fff3c0'], '#ffd34a'], ink: ['c', ['#2a2f6a', '#1c1f4d'], '#5f6fd0'],
  wisp: ['g', ['#5ad0ff', '#b8ecff'], '#5ad0ff']
};
function charge(G, u, dur, pt, r, kind) {
  const fx = G.fx, c = CHARGE[kind || u.sp.el]; let acc = 0; r = r || 20;
  fx.add({ dur,
    update(dt) {
      if (u.state !== 'active') return;
      acc += dt; if (acc < .045) return; acc = 0;
      const m = pt(), an = rnd(TAU), d = r * rnd(.75, 1.15);
      fx.p({ x: m.x + Math.cos(an) * d, y: m.y + Math.sin(an) * d, vx: -Math.cos(an) * d * 3.1, vy: -Math.sin(an) * d * 3.1, life: .3, size: rnd(1.6, 2.8), col: pick(c[1]), shape: c[0], rot: rnd(TAU), vr: 6 });
    },
    draw(ctx, k) {
      if (u.state !== 'active') return;
      const m = pt(), q = r / 20;
      halo(ctx, m.x, m.y, (3 + k * 8.5) * q, c[2], .25 + k * .5); halo(ctx, m.x, m.y, (1 + k * 3.6) * q, '#ffffff', k * .7);
    } });
}

// ----- element-flavoured impacts -----
// Every hit lands at the point of contact (the side of the target facing the attacker) and throws its
// debris onward in the direction of the blow. They are kept small and crisp: a sharp contact spark,
// a handful of pieces, and a mark on the grass.

// the instant of contact: a tight ring of thin spokes and a bright core, gone in a blink
function contact(fx, x, y, s, col) {
  const rot = rnd(TAU);
  fx.add({ dur: .17, draw(ctx, k) {
    ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round';
    ctx.globalAlpha = 1 - k * k; ctx.strokeStyle = col; ctx.lineWidth = 1.5 * s * (1 - k * .6);
    for (let i = 0; i < 7; i++) { ctx.rotate(TAU / 7); const r0 = (3 + k * 9) * s, r1 = (7 + k * 13) * s * (i % 2 ? 1 : .72); ctx.beginPath(); ctx.moveTo(r0, 0); ctx.lineTo(r1, 0); ctx.stroke(); }
    ctx.globalAlpha = (1 - k) * .9; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 3.2 * s * (1 - k * .7), 0, TAU); ctx.fill();
  } });
}
// pieces thrown onward along the blow (or evenly all round when there is no direction)
function spray(fx, x, y, n, o, dir) {
  if (dir !== undefined) { o.ang = dir; o.spread = o.spread || 1.05; }
  fx.burst(x, y, n, o);
}
const IMPACT = {
  fire(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s, '#ffe27a'); flare(fx, x, y, 17 * s, '#ff8a2a', .26);
    const base = dir === undefined ? -PI / 2 : dir * .5 - PI / 4;      // flames lick up and onward
    for (let i = 0; i < 4; i++) {
      const an = base + (i - 1.5) * .5 + rnd(-.12, .12), len = rnd(10, 16) * s;
      fx.add({ dur: .36, delay: rnd(0, .05), draw(ctx, k) {
        const l = len * (.3 + Ease.outCubic(k) * .8), w = 3.6 * s * Ease.hump(k);
        ctx.translate(x + Math.cos(an) * 3, y + Math.sin(an) * 3 - k * 6); ctx.rotate(an); ctx.globalAlpha = 1 - k * k;
        flameTongue(ctx, l, w, '#ff5a2a'); flameTongue(ctx, l * .62, w * .55, '#ffd23d'); flameTongue(ctx, l * .3, w * .25, '#fff7c0');
      } });
    }
    spray(fx, x, y, 6, { col: ['#ff7a2a', '#ffd23d', '#ffb02e'], shape: 'g', spd: 80 * s, life: .7, size: 2.1 * s, up: 26, g: -40, drag: 1.6 }, dir);
    fx.burst(x, y - 4, 2, { col: 'rgba(90,70,70,.4)', shape: 'p', spd: 12, life: .9, size: 4.4 * s, grow: 8, up: 24 });
    decal(fx, gx, gy, 13 * s, 'scorch');
  },
  water(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * .9, '#ffffff');
    fx.add({ dur: .44, draw(ctx, k) {
      const h = Ease.hump(k); ctx.translate(x, y + 5 * s); ctx.globalAlpha = 1 - k * k; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const an = i / 7 * TAU, ex = Math.cos(an) * (7 + 10 * Ease.outCubic(k)) * s, ey = Math.sin(an) * 3.5 * s - h * (10 + (i % 3) * 4) * s;
        ctx.beginPath(); ctx.moveTo(Math.cos(an) * 4.5 * s, Math.sin(an) * 2.2 * s); ctx.quadraticCurveTo(ex * .6, ey - 4 * s, ex, ey);
        ctx.strokeStyle = '#eaf7ff'; ctx.lineWidth = 2.8 * s * (1 - k * .6); ctx.stroke(); ctx.strokeStyle = '#7ac8ff'; ctx.lineWidth = 1.1 * s; ctx.stroke();
      }
    } });
    spray(fx, x, y, 7, { col: ['#bfe6ff', '#ffffff', '#7ac8ff'], shape: 'd', spd: 95 * s, life: .55, size: 2.2 * s, up: 45, g: 320 }, dir);
    fx.burst(x, y, 3, { col: ['#ffffff', '#dff3ff'], shape: 'b', spd: 22, life: .8, size: 2.7 * s, up: 22, g: -18 });
    fx.ring(gx, gy, 5 * s, 20 * s, .5, '#eaf7ff', 1.8, true); fx.ring(gx, gy, 3 * s, 13 * s, .6, '#7ac8ff', 1.2, true, .1);
    decal(fx, gx, gy, 12 * s, 'wet');
  },
  leaf(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * .9, '#eaffd0');
    fx.add({ dur: .42, draw(ctx, k) {
      const r = (4 + Ease.outCubic(k) * 10) * s; ctx.translate(x, y); ctx.rotate(k * 1.6); ctx.globalAlpha = 1 - k * k;
      for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(r * .35, 0); ctx.quadraticCurveTo(r * .75, -3.4 * s, r * 1.2, 0); ctx.quadraticCurveTo(r * .75, 3.4 * s, r * .35, 0); ctx.fillStyle = i % 2 ? '#5fd060' : '#8fe87a'; ctx.fill(); }
    } });
    spray(fx, x, y, 6, { col: ['#5fd060', '#7fe070', '#3da04a', '#b8f09a'], shape: 'l', spd: 90 * s, life: .95, size: 3.3 * s, vr: 9, g: 70, drag: 1.7 }, dir);
    fx.burst(x, y, 2, { col: ['#ffb3cf', '#fff7a8'], shape: 'l', spd: 50 * s, life: 1, size: 2.6 * s, vr: 7, g: 40, drag: 1.4 });
    fx.burst(x, y, 2, { col: ['#eaffd0', '#fff7a8'], shape: 'g', spd: 26, life: .7, size: 1.9 * s, up: 20, g: -20 });
  },
  spark(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * 1.15, '#fffbd0'); flare(fx, x, y, 15 * s, '#ffe14a', .16);
    cross(fx, x, y, 20 * s, '#fffbd0', .22, rnd(-.3, .3));
    for (let i = 0; i < 4; i++) { const an = (dir === undefined ? i / 4 * TAU : dir + (i - 1.5) * .7) + rnd(-.3, .3), l = rnd(11, 18) * s; lightning(fx, x, y, x + Math.cos(an) * l, y + Math.sin(an) * l, { segs: 3, jit: 3.5 * s, wid: 1.3, dur: .18, delay: i * .015 }); }
    spray(fx, x, y, 7, { col: ['#ffe14a', '#ffffff', '#7af0ff'], shape: 'k', spd: 150 * s, life: .26, size: 2.2 * s }, dir);
    fx.burst(x, y, 3, { col: ['#fff7b0', '#7af0ff'], shape: 'g', spd: 45 * s, life: .5, size: 2 * s, drag: 3 });
    fx.ring(gx, gy, 4 * s, 18 * s, .3, '#ffe14a', 1.8, true);
  },
  stone(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * 1.1, '#fff3d6');
    spray(fx, x, y, 7, { col: ['#b89d7c', '#95795a', '#cdb393', '#e6d3b0'], shape: 'q', spd: 115 * s, life: .65, size: 3.1 * s, vr: 12, g: 380, up: 38 }, dir);
    fx.burst(x, y + 4, 4, { col: ['rgba(190,165,130,.65)', 'rgba(215,195,160,.6)'], shape: 'p', spd: 38 * s, life: .7, size: 5.4 * s, grow: 10, flat: .6, drag: 2 });
    decal(fx, gx, gy, 14 * s, 'crack');
  },
  frost(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * .9, '#ffffff'); flare(fx, x, y, 14 * s, '#aef2ff', .22);
    const rot = rnd(TAU);
    fx.add({ dur: .5, draw(ctx, k) {
      const g = k < .25 ? Ease.outBack(k / .25) : 1; ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = k > .5 ? 1 - (k - .5) / .5 : 1;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(TAU / 6); const l = (9 + (i % 3) * 4.5) * s * g, w = 2.4 * s;
        ctx.beginPath(); ctx.moveTo(3 * s, 0); ctx.lineTo(l * .45, -w); ctx.lineTo(l, 0); ctx.lineTo(l * .45, w); ctx.closePath();
        ctx.fillStyle = i % 2 ? '#dff6ff' : '#9fe3ff'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = .8; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.lineTo(l * .9, 0); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = .6; ctx.stroke();
      }
    } });
    spray(fx, x, y, 6, { col: ['#ffffff', '#bfeaff'], shape: 'f', spd: 75 * s, life: .9, size: 3.1 * s, vr: 5, g: 40, drag: 1.6 }, dir);
    fx.burst(x, y + 3, 2, { col: 'rgba(225,245,255,.5)', shape: 'p', spd: 20, life: .7, size: 5.4 * s, grow: 8, flat: .6 });
    decal(fx, gx, gy, 14 * s, 'frost');
  },
  sky(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * .9, '#ffffff');
    fx.add({ dur: .42, draw(ctx, k) {
      ctx.translate(x, y); ctx.lineCap = 'round'; ctx.globalAlpha = 1 - k * k;
      for (let i = 0; i < 3; i++) { const r = (7 + i * 4.5 + k * 8) * s, a0 = k * 5 + i * 2.1; ctx.beginPath(); ctx.arc(0, 0, r, a0, a0 + 2.1 - k); ctx.strokeStyle = i % 2 ? '#cfe0ff' : '#ffffff'; ctx.lineWidth = (2.4 - i * .5) * s; ctx.stroke(); }
    } });
    spray(fx, x, y, 4, { col: ['rgba(255,255,255,.85)', 'rgba(238,244,255,.85)'], shape: 'p', spd: 65 * s, life: .5, size: 4.6 * s, grow: 7, drag: 3 }, dir);
    fx.burst(x, y, 3, { col: ['#ffffff', '#cfe0ff', '#fff0a8'], shape: 'l', spd: 55 * s, life: 1.1, size: 3 * s, vr: 6, g: 50, drag: 2 });
    spray(fx, x, y, 5, { col: '#ffffff', shape: 'k', spd: 140 * s, life: .22, size: 2.4 * s }, dir);
  },
  venom(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * .85, '#eaffb0');
    splat(fx, x, y, '#8c3fd0', 10.5 * s, .7); splat(fx, x + 1, y + 1, '#a4ff4a', 5.6 * s, .7);
    spray(fx, x, y, 6, { col: ['#a4ff4a', '#b45fe0', '#d8ff9a'], shape: 'd', spd: 80 * s, life: .5, size: 2.2 * s, g: 240, up: 28 }, dir);
    fx.burst(x, y, 4, { col: ['#c88af0', '#c8ff8a'], shape: 'b', spd: 18, life: 1, size: 2.7 * s, up: 26, g: -22, jit: 5 * s });
    fx.burst(x, y, 2, { col: 'rgba(150,235,90,.34)', shape: 'p', spd: 14, life: .9, size: 5.4 * s, grow: 8, up: 10 });
    decal(fx, gx, gy, 11 * s, 'goo');
  },
  mystic(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * .9, '#ffffff'); flare(fx, x, y, 16 * s, '#b48aff', .24); cross(fx, x, y, 17 * s, '#ffffff', .22, PI / 4);
    fx.add({ dur: .5, draw(ctx, k) {
      const r = (5 + Ease.outCubic(k) * 13) * s; ctx.translate(x, y); ctx.globalAlpha = 1 - k * k;
      ctx.strokeStyle = '#d6c4ff'; ctx.lineWidth = 1.7 * s; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#2fe0c8'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, TAU); ctx.stroke();
      ctx.rotate(k * 2.5); ctx.fillStyle = '#ffc93d'; for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); star4(ctx, r, 0, 2.3 * s); }
    } });
    spray(fx, x, y, 5, { col: ['#b48aff', '#2fe0c8', '#ffc93d', '#ffffff'], shape: 's', spd: 85 * s, life: .7, size: 3.1 * s, vr: 8, drag: 2 }, dir);
    fx.burst(x, y, 3, { col: ['#d6c4ff', '#8ff5e6'], shape: 'g', spd: 36 * s, life: .7, size: 2.1 * s, up: 16, g: -24, drag: 1.5 });
  },
  shadow(fx, x, y, s, gx, gy, dir) {
    contact(fx, x, y, s * .9, '#ffd0f4');
    fx.add({ dur: .42, draw(ctx, k) {
      const r = (5 + Ease.outCubic(k) * 12) * s; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      ctx.globalAlpha = (1 - k) * .68; ctx.fillStyle = '#1a1030'; ctx.fill();
      ctx.globalAlpha = 1 - k * k; ctx.strokeStyle = '#ff4ad0'; ctx.lineWidth = 1.9 * s * (1 - k * .5); ctx.stroke();
    } });
    fx.burst(x, y, 4, { col: ['rgba(60,40,95,.6)', 'rgba(35,25,60,.6)'], shape: 'p', spd: 24 * s, life: 1, size: 4.6 * s, grow: 8, up: 28, drag: 1.5 });
    spray(fx, x, y, 6, { col: ['#8a5cff', '#ff4ad0', '#2a1f4a'], shape: 'q', spd: 100 * s, life: .45, size: 2.6 * s, vr: 12 }, dir);
    fx.burst(x, y, 2, { col: ['#ff4ad0', '#b48aff'], shape: 'g', spd: 32, life: .6, size: 2 * s, drag: 2 });
    decal(fx, gx, gy, 12 * s, 'dark');
  }
};
// s = size (1 is a normal hit). gx,gy = the spot on the grass under the hit. dir = the way the blow is travelling
function impact(G, el, x, y, s, gx, gy, dir) {
  s = s || 1;
  if (gx === undefined) { gx = x; gy = y + 14; }
  if (dir !== undefined) { x -= Math.cos(dir) * 7 * s; y -= Math.sin(dir) * 7 * s; }
  IMPACT[el](G.fx, x, y, s, gx, gy, dir);
}

// irregular splat that fades (ink, venom, snow)
function splat(fx, x, y, col, r, dur, ground) {
  const lobes = []; for (let i = 0; i < 9; i++) lobes.push(rnd(.55, 1.15));
  fx.add({ dur: dur || .6, ground, draw(ctx, k) {
    const s = r * (.5 + Ease.outCubic(Math.min(1, k * 4)) * .5), q = ground ? .55 : 1;
    ctx.globalAlpha = k > .5 ? 1 - (k - .5) / .5 : 1; ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i <= 9; i++) {
      const an = i / 9 * TAU, l = lobes[i % 9] * s, an2 = (i - .5) / 9 * TAU, l2 = s * .5;
      if (!i) ctx.moveTo(x + Math.cos(an) * l, y + Math.sin(an) * l * q);
      else ctx.quadraticCurveTo(x + Math.cos(an2) * l2, y + Math.sin(an2) * l2 * q, x + Math.cos(an) * l, y + Math.sin(an) * l * q);
    }
    ctx.fill();
  } });
}

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
// lightning that re-rolls its shape a few times while it lives, with a soft glow around a hot core
function lightning(fx, x1, y1, x2, y2, o) {
  o = o || {};
  let pts = boltPts(x1, y1, x2, y2, o.segs || 6, o.jit || 7), acc = 0;
  fx.add({ dur: o.dur || .22, delay: o.delay,
    update(dt) { acc += dt; if (acc > .045) { acc = 0; pts = boltPts(x1, y1, x2, y2, o.segs || 6, o.jit || 7); } },
    draw(ctx, k) {
      const w = o.wid || 2.4;
      ctx.globalAlpha = (1 - k * k) * .34; ctx.globalCompositeOperation = 'lighter';
      strokePts(ctx, pts, o.glow || '#ffd23d', w * 2.8);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - k * k;
      strokePts(ctx, pts, o.col || '#fff9c4', w); strokePts(ctx, pts, '#ffffff', w * .4);
    } });
}
// centre of a unit's body (where hits land)
const bodyX = u => u.x + (u.ox || 0), bodyY = u => u.y + (u.oy || 0) - u.r * .95 - (u.z || 0) - (u.lift || 0);
// point in front of a unit, in its own art units (fwd along facing, up from the ground)
function muzzle(u, fwd, up) { return { x: u.x + (u.ox || 0) + u.face * fwd * u.vs, y: u.y + (u.oy || 0) - up * u.vs - (u.lift || 0) }; }
// the exact spot a creature's move leaves its body (mouth, fist, wand tip...), as its art last drew it.
// fwd/up are the fallback used before it has been drawn (and in the headless tests)
function emit(u, fwd, up) {
  if (!u.anc) return muzzle(u, fwd, up);
  const face = (u.flip ? -1 : 1) * u.face;
  return { x: u.x + (u.ox || 0) + face * u.vs * u.sx * u.anc[0], y: u.y + (u.oy || 0) - (u.lift || 0) - (u.z || 0) + u.vs * u.sy * u.anc[1] };
}
// the direction a creature's attack travels in (radians)
const aim = u => Math.atan2(u.ady, u.adx);

// homing projectile. o: { x, y, speed, arc, draw(ctx,x,y,ang,k,it), trail(x,y,it), hit(tgt|null,x,y),
//                         tail: { n, w, col, core, add }, glow: { r, col, al } }
function shoot(G, tg, o) {
  const sx = o.x, sy = o.y;
  let ex = bodyX(tg), ey = bodyY(tg);
  const dur = Math.max(.1, dist2(sx, sy, ex, ey) / o.speed);
  let acc = 0;
  return G.fx.add({ dur, delay: o.delay, px: sx, py: sy, ang: 0, tr: [],
    update(dt, k, it) {
      if (tg.state === 'active') { ex = bodyX(tg); ey = bodyY(tg); }
      const nx = lerp(sx, ex, k), ny = lerp(sy, ey, k) - Math.sin(k * PI) * (o.arc || 0);
      it.ang = Math.atan2(ny - it.py, nx - it.px); it.px = nx; it.py = ny;
      if (o.tail) { it.tr.push(nx, ny); if (it.tr.length > o.tail.n * 2) it.tr.splice(0, 2); }
      if (o.trail) { acc += dt; if (acc > (o.trailEvery || .03)) { acc = 0; o.trail(nx, ny, it); } }
    },
    draw(ctx, k, it) {
      if (o.tail) {
        if (o.tail.add) ctx.globalCompositeOperation = 'lighter';
        ribbon(ctx, it.tr, o.tail.w, o.tail.col, o.tail.al || .85);
        ctx.globalCompositeOperation = 'source-over';
        if (o.tail.core) ribbon(ctx, it.tr, o.tail.w * .4, o.tail.core, 1);
      }
      if (o.glow) halo(ctx, it.px, it.py, o.glow.r, o.glow.col, o.glow.al || .7);
      o.draw(ctx, it.px, it.py, it.ang, k, it);
    },
    end(it) { o.hit(tg.state === 'active' ? tg : null, ex, ey); } });
}

// ---------- body-motion helpers used by attack poses ----------
// melee creatures stand a little back from their target, so their swings reach across the gap
const reachAmt = (u, amt) => u.sp.range === 0 && amt > 0 ? Math.max(amt, u.aC * .92) : amt;
function lunge(u, k, amt, peak) {
  peak = peak || .4; amt = reachAmt(u, amt);
  const h = k < peak ? Ease.outCubic(k / peak) : 1 - Ease.inOut((k - peak) / (1 - peak));
  u.ox = u.adx * amt * h; u.oy = u.ady * amt * h;
}
// wind back, then lunge
function ram(u, k, back, fwd, hitK) {
  fwd = reachAmt(u, fwd);
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
// creatures of the other side inside a circle (for dressing up area moves)
function foesIn(G, side, x, y, r) { return G.enemies(side).filter(e => dist2(e.x, e.y, x, y) <= r + e.r * .5); }

const ATTACKS = {};
