'use strict';
// ---------- stadium, crowd, creatures-on-the-field, icons ----------

// ===== little vector icons (drawn in a unit box, radius ~1) =====
function elGlyph(ctx, id, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = .24; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (id) {
    case 'fire':
      ctx.moveTo(0, -1); ctx.bezierCurveTo(.2, -.4, .95, -.1, .62, .55); ctx.bezierCurveTo(.4, 1.02, -.4, 1.02, -.62, .55);
      ctx.bezierCurveTo(-.9, 0, -.3, -.15, -.38, -.62); ctx.bezierCurveTo(-.12, -.42, -.1, -.7, 0, -1); ctx.fill(); break;
    case 'water':
      ctx.moveTo(0, -1); ctx.bezierCurveTo(.3, -.4, .78, 0, .78, .38); ctx.bezierCurveTo(.78, .86, .36, 1, 0, 1);
      ctx.bezierCurveTo(-.36, 1, -.78, .86, -.78, .38); ctx.bezierCurveTo(-.78, 0, -.3, -.4, 0, -1); ctx.fill(); break;
    case 'leaf':
      ctx.moveTo(-.85, .85); ctx.quadraticCurveTo(-1, -.75, .85, -.85); ctx.quadraticCurveTo(1, .75, -.85, .85); ctx.fill(); break;
    case 'spark':
      ctx.moveTo(.28, -1); ctx.lineTo(-.62, .16); ctx.lineTo(-.06, .16); ctx.lineTo(-.3, 1); ctx.lineTo(.62, -.26); ctx.lineTo(.06, -.26); ctx.closePath(); ctx.fill(); break;
    case 'stone':
      ctx.moveTo(-.95, .72); ctx.lineTo(-.55, -.3); ctx.lineTo(-.1, -.8); ctx.lineTo(.45, -.52); ctx.lineTo(.95, .12); ctx.lineTo(.72, .72); ctx.closePath(); ctx.fill(); break;
    case 'frost':
      for (let i = 0; i < 3; i++) { const an = i * PI / 3 + PI / 2, cx = Math.cos(an), cy = Math.sin(an); ctx.moveTo(cx * .95, cy * .95); ctx.lineTo(-cx * .95, -cy * .95);
        for (const q of [-1, 1]) { ctx.moveTo(cx * q * .55, cy * q * .55); ctx.lineTo(cx * q * .85 - cy * .25, cy * q * .85 + cx * .25); ctx.moveTo(cx * q * .55, cy * q * .55); ctx.lineTo(cx * q * .85 + cy * .25, cy * q * .85 - cx * .25); } }
      ctx.stroke(); break;
    case 'sky':
      ctx.moveTo(-.95, .2); ctx.quadraticCurveTo(-.5, -1.05, .95, -.8); ctx.quadraticCurveTo(.55, -.45, .5, -.2); ctx.quadraticCurveTo(.8, -.2, .9, 0);
      ctx.quadraticCurveTo(.4, .15, .25, .35); ctx.quadraticCurveTo(.5, .4, .55, .6); ctx.quadraticCurveTo(-.3, .95, -.95, .2); ctx.fill(); break;
    case 'venom':
      ctx.moveTo(-.2, -1); ctx.bezierCurveTo(.05, -.5, .5, -.1, .5, .3); ctx.bezierCurveTo(.5, .75, .15, .95, -.2, .95);
      ctx.bezierCurveTo(-.55, .95, -.9, .75, -.9, .3); ctx.bezierCurveTo(-.9, -.1, -.45, -.5, -.2, -1); ctx.fill();
      ctx.beginPath(); ctx.arc(.72, -.55, .26, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(.82, .1, .16, 0, TAU); ctx.fill(); break;
    case 'mystic':
      for (let i = 0; i < 8; i++) { const an = i * PI / 4 - PI / 2, rr = i % 2 ? .32 : 1; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.fill(); break;
    case 'shadow':
      ctx.arc(0, 0, .95, -PI * .62, PI * .62, false); ctx.quadraticCurveTo(.25, 0, Math.cos(-PI * .62) * .95, Math.sin(-PI * .62) * .95); ctx.fill(); break;
  }
  ctx.restore();
}
function roleGlyph(ctx, role, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = .28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (role) {
    case 'tank':
      ctx.moveTo(-.8, -.85); ctx.lineTo(.8, -.85); ctx.lineTo(.8, .05); ctx.quadraticCurveTo(.75, .8, 0, 1); ctx.quadraticCurveTo(-.75, .8, -.8, .05); ctx.closePath(); ctx.fill(); break;
    case 'brawler':
      ctx.moveTo(-.75, .75); ctx.lineTo(.55, -.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(.9, -.9); ctx.lineTo(.3, -.8); ctx.lineTo(.8, -.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-.75, .1); ctx.lineTo(-.1, .75); ctx.stroke(); break;
    case 'dasher':
      ctx.moveTo(-.85, -.7); ctx.lineTo(-.15, 0); ctx.lineTo(-.85, .7); ctx.moveTo(.05, -.7); ctx.lineTo(.75, 0); ctx.lineTo(.05, .7); ctx.stroke(); break;
    case 'sniper':
      ctx.arc(0, 0, .62, 0, TAU); ctx.moveTo(0, -1); ctx.lineTo(0, -.4); ctx.moveTo(0, 1); ctx.lineTo(0, .4); ctx.moveTo(-1, 0); ctx.lineTo(-.4, 0); ctx.moveTo(1, 0); ctx.lineTo(.4, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, .14, 0, TAU); ctx.fill(); break;
    case 'caster':
      for (let i = 0; i < 8; i++) { const an = i * PI / 4 - PI / 2, rr = i % 2 ? .28 : .9; ctx[i ? 'lineTo' : 'moveTo'](-.15 + Math.cos(an) * rr, .12 + Math.sin(an) * rr); }
      ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(.72, -.7, .22, 0, TAU); ctx.fill(); break;
  }
  ctx.restore();
}
function drawEmblem(ctx, team, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * .88, 0, TAU); ctx.fillStyle = team.c1; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * .7, 0, TAU); ctx.strokeStyle = team.c2; ctx.lineWidth = r * .09; ctx.stroke();
  elGlyph(ctx, team.el, x, y, r * .44, '#fff');
}

// ===== crowd: fans pre-rendered row by row, bobbed in chunks =====
const SKIN = ['#ffd9b3', '#f2c198', '#d9a070', '#a8703f', '#7a4f2a', '#ffe3c9'];
const HAIR = ['#2a2018', '#5a3a1e', '#c98a3a', '#e8d27a', '#1a1a22', '#8a3a2a', '#d8d8e0'];
class CrowdBlock {
  // palette: array of shirt colours (repeats = weighting)
  constructor(w, h, palette, o) {
    o = o || {};
    this.w = w; this.h = h; this.step = o.step || 6.6; this.rowStep = o.rowStep || 7.4; this.rowH = 16; this.res = 2;
    this.rows = Math.max(1, Math.floor((h - 4) / this.rowStep));
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w * this.res); cv.height = this.rows * this.rowH * this.res;
    const g = cv.getContext('2d'); g.scale(this.res, this.res);
    for (let r = 0; r < this.rows; r++) {
      const by = r * this.rowH + 11, off = (r % 2) * this.step * .5;
      for (let x = -2 + off; x < w + 3; x += this.step) {
        const fx = x + rnd(-.8, .8), fy = by + rnd(-.8, .8), shirt = pick(palette), skin = pick(SKIN), up = Math.random() < .3;
        g.fillStyle = shirt; g.beginPath(); g.ellipse(fx, fy + 2.4, 3.3, 3.6, 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(fx, fy + 4.4, 3.3, 1.6, 0, 0, TAU); g.fill();
        if (up) { g.strokeStyle = skin; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(fx - 2.6, fy + .6); g.lineTo(fx - 3.8, fy - 4.4); g.moveTo(fx + 2.6, fy + .6); g.lineTo(fx + 3.8, fy - 4.4); g.stroke(); }
        g.fillStyle = skin; g.beginPath(); g.arc(fx, fy - 2.2, 2.3, 0, TAU); g.fill();
        const hr = Math.random();
        if (hr < .7) { g.fillStyle = hr < .14 ? shirt : pick(HAIR); g.beginPath(); g.arc(fx, fy - 2.7, 2.4, PI * 1.05, PI * 1.95); g.closePath(); g.fill(); }
      }
    }
    this.cv = cv;
  }
  // amp = jump height in px, t = time
  draw(ctx, x, y, t, amp, phase) {
    const R = this.res, rh = this.rowH, cw = 22;
    for (let r = 0; r < this.rows; r++) {
      const dy = y + r * this.rowStep - 6;
      if (amp < .9) {
        const o = -Math.abs(Math.sin(t * 2.2 + r * 1.7 + phase)) * amp * 1.4;
        ctx.drawImage(this.cv, 0, r * rh * R, this.cv.width, rh * R, x, dy + o, this.w, rh);
      } else {
        for (let cx = 0; cx < this.w; cx += cw) {
          const w2 = Math.min(cw, this.w - cx), o = -Math.abs(Math.sin(t * 6.5 + cx * .045 + r * 1.3 + phase)) * amp;
          ctx.drawImage(this.cv, cx * R, r * rh * R, w2 * R, rh * R, x + cx, dy + o, w2, rh);
        }
      }
    }
  }
}

// ===== the stadium =====
const Arena = {
  bg: null, blocks: null, clouds: [], confetti: [], flashes: [], cheer: [0, 0], V: null, teams: null,

  // V: { W, H, ox, topH, trayH, skyH, fx, fy, fs, fw, fh, px }  (px = device pixels per logical unit)
  build(V, teams) {
    this.V = V; this.teams = teams;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(V.W * V.px); cv.height = Math.ceil(V.H * V.px);
    const g = cv.getContext('2d'); g.scale(V.px, V.px);
    const { W, H, skyH, topH, fx, fy, fw, fh } = V, botY = H - V.trayH;

    // far hills peeking over the rim
    g.fillStyle = '#8fdc8a'; g.beginPath(); g.moveTo(0, skyH + 2);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, skyH - 9 - Math.sin(x * .021 + 1) * 7 - Math.sin(x * .05) * 3);
    g.lineTo(W, skyH + 2); g.closePath(); g.fill();
    // stand structure (top + sides share one concrete bowl)
    const gr = g.createLinearGradient(0, skyH, 0, topH);
    gr.addColorStop(0, '#6f7fb0'); gr.addColorStop(1, '#8e9bc4');
    g.fillStyle = gr; g.fillRect(0, skyH, W, botY - skyH);
    // rim rail
    g.fillStyle = '#ffffff'; g.fillRect(0, skyH - 2.5, W, 4);
    g.fillStyle = '#ffd23d'; for (let x = 0; x < W; x += 18) g.fillRect(x, skyH - 2.5, 9, 4);
    // field apron + boards around the pitch
    g.fillStyle = '#3f9e4a'; roundRect(g, fx - 9, fy - 9, fw + 18, fh + 18, 10); g.fill();
    g.fillStyle = '#ffffff'; roundRect(g, fx - 6, fy - 6, fw + 12, fh + 12, 8); g.fill();
    // ad-board segments in both teams' colours
    const seg = (x0, y0, w, h, horiz) => {
      const n = Math.max(2, Math.round((horiz ? w : h) / 38)), cols = [teams[0].c1, '#ffffff', teams[1].c1, '#ffd23d'];
      for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; if (horiz) g.fillRect(x0 + w * i / n, y0, w / n + .5, h); else g.fillRect(x0, y0 + h * i / n, w, h / n + .5); }
    };
    seg(fx - 2, fy - 6, fw + 4, 4, true); seg(fx - 6, fy - 2, 4, fh + 4, false); seg(fx + fw + 2, fy - 2, 4, fh + 4, false); seg(fx - 2, fy + fh + 2, fw + 4, 4, true);
    // grass with mowing stripes
    g.save(); roundRect(g, fx - 2, fy - 2, fw + 4, fh + 4, 5); g.clip();
    g.fillStyle = '#63cf5c'; g.fillRect(fx - 2, fy - 2, fw + 4, fh + 4);
    const stripes = 12;
    for (let i = 0; i < stripes; i += 2) { g.fillStyle = '#58c452'; g.fillRect(fx - 2, fy + fh * i / stripes, fw + 4, fh / stripes); }
    // soft sunlight falling from the top right
    const sun = g.createLinearGradient(fx + fw, fy, fx, fy + fh);
    sun.addColorStop(0, 'rgba(255,250,190,.34)'); sun.addColorStop(.5, 'rgba(255,250,190,.08)'); sun.addColorStop(1, 'rgba(20,90,60,.14)');
    g.fillStyle = sun; g.fillRect(fx - 2, fy - 2, fw + 4, fh + 4);
    g.restore();
    // chalk lines
    const s = V.fs; g.strokeStyle = 'rgba(255,255,255,.82)'; g.lineWidth = 2 * s; g.lineJoin = 'round';
    roundRect(g, fx + 5 * s, fy + 5 * s, fw - 10 * s, fh - 10 * s, 6 * s); g.stroke();
    g.beginPath(); g.moveTo(fx + 5 * s, fy + fh / 2); g.lineTo(fx + fw - 5 * s, fy + fh / 2); g.stroke();
    g.beginPath(); g.arc(fx + fw / 2, fy + fh / 2, 34 * s, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(fx + fw / 2, fy + fh / 2, 34 * s, 0, TAU); g.fill();
    // league sun emblem in the centre circle
    g.save(); g.translate(fx + fw / 2, fy + fh / 2); g.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.beginPath(); g.moveTo(-3 * s, -15 * s); g.lineTo(0, -25 * s); g.lineTo(3 * s, -15 * s); g.closePath(); g.fill(); }
    g.beginPath(); g.arc(0, 0, 12 * s, 0, TAU); g.fill(); g.restore();
    for (const q of [.2, .8]) { g.beginPath(); g.arc(fx + fw / 2, fy + fh * q, 3 * s, 0, TAU); g.fillStyle = 'rgba(255,255,255,.75)'; g.fill(); }
    this.bg = cv;

    // crowd blocks: home fans on the left, rival fans on the right
    const pal = tm => [tm.c1, tm.c1, tm.c1, tm.c2, '#ffffff', '#ffe27a', shade(tm.c1, .3)];
    const half = W / 2, standH = topH - 12 - skyH;
    this.blocks = [];
    this.blocks.push({ b: new CrowdBlock(half, standH, pal(teams[0])), x: 0, y: skyH + 4, side: 0 });
    this.blocks.push({ b: new CrowdBlock(half, standH, pal(teams[1])), x: half, y: skyH + 4, side: 1 });
    const sideW = fx - 10;
    if (sideW > 8) {
      const sh = botY - topH + 6;
      this.blocks.push({ b: new CrowdBlock(sideW, sh, pal(teams[0])), x: 0, y: topH - 8, side: 0 });
      this.blocks.push({ b: new CrowdBlock(sideW, sh, pal(teams[1])), x: fx + fw + 10, y: topH - 8, side: 1 });
    }
    if (!this.clouds.length) for (let i = 0; i < 5; i++) this.clouds.push({ x: rnd(-40, W + 40), y: rnd(4, Math.max(10, skyH - 22)), s: rnd(.6, 1.2), v: rnd(3, 7) });
    this.clouds.forEach(cl => { cl.y = Math.min(cl.y, Math.max(8, skyH - 20)); });
  },

  cheerFor(side, amt) { this.cheer[side] = Math.min(1, this.cheer[side] + amt); },
  burstConfetti(side, n) {
    const V = this.V, tm = this.teams[side], cols = [tm.c1, tm.c2, '#ffffff', '#ffe27a'];
    for (let i = 0; i < n && this.confetti.length < 260; i++) {
      const fromLeft = side === 0;
      this.confetti.push({ x: fromLeft ? rnd(0, V.W * .4) : rnd(V.W * .6, V.W), y: rnd(V.skyH, V.topH), vx: (fromLeft ? 1 : -1) * rnd(10, 90), vy: rnd(-170, -60), rot: rnd(TAU), vr: rnd(-9, 9), col: pick(cols), life: rnd(1.6, 2.8), w: rnd(2.4, 4.4) });
    }
  },

  update(dt, excite) {
    const V = this.V;
    for (let s = 0; s < 2; s++) this.cheer[s] = Math.max(0, this.cheer[s] - dt * .45);
    for (const cl of this.clouds) { cl.x += cl.v * dt; if (cl.x > V.W + 70) { cl.x = -70; cl.y = rnd(4, Math.max(10, V.skyH - 22)); } }
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const p = this.confetti[i]; p.life -= dt;
      if (p.life <= 0 || p.y > V.H) { this.confetti.splice(i, 1); continue; }
      p.vy += 150 * dt; p.vx *= Math.exp(-1.2 * dt); p.vy = Math.min(p.vy, 70);
      p.x += (p.vx + Math.sin(p.life * 6 + p.rot) * 22) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    // camera flashes in the stands
    const e = Math.max(this.cheer[0], this.cheer[1], excite || 0);
    if (Math.random() < dt * (1 + e * 26)) this.flashes.push({ x: rnd(0, V.W), y: rnd(V.skyH + 6, V.topH - 12), t: .22 });
    for (let i = this.flashes.length - 1; i >= 0; i--) { this.flashes[i].t -= dt; if (this.flashes[i].t <= 0) this.flashes.splice(i, 1); }
  },

  drawBack(ctx, t) {
    const V = this.V, { W, skyH } = V;
    // sky
    const sk = ctx.createLinearGradient(0, 0, 0, skyH + 6);
    sk.addColorStop(0, '#2f9bff'); sk.addColorStop(.6, '#7ccbff'); sk.addColorStop(1, '#d6f3ff');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, skyH + 8);
    // sun with slow rays
    const sx = W - Math.min(54, W * .15), sy = Math.max(20, skyH * .42);
    const gl = ctx.createRadialGradient(sx, sy, 2, sx, sy, 78);
    gl.addColorStop(0, 'rgba(255,253,210,.95)'); gl.addColorStop(.25, 'rgba(255,244,160,.5)'); gl.addColorStop(1, 'rgba(255,244,160,0)');
    ctx.fillStyle = gl; ctx.fillRect(sx - 80, sy - 80, 160, 160);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * .12); ctx.fillStyle = 'rgba(255,250,200,.42)';
    for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-2.6, -17); ctx.lineTo(0, -30 - (i % 2) * 9 - Math.sin(t * 2 + i) * 2); ctx.lineTo(2.6, -17); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#fff6b8'; ctx.beginPath(); ctx.arc(sx, sy, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, 10, 0, TAU); ctx.fill();
    // clouds
    ctx.fillStyle = '#ffffff';
    for (const cl of this.clouds) {
      const s = cl.s; ctx.globalAlpha = .95;
      ctx.beginPath(); ctx.arc(cl.x, cl.y, 9 * s, 0, TAU); ctx.arc(cl.x + 11 * s, cl.y - 4 * s, 11 * s, 0, TAU); ctx.arc(cl.x + 24 * s, cl.y, 9 * s, 0, TAU); ctx.arc(cl.x + 12 * s, cl.y + 3 * s, 10 * s, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // static stadium + pitch
    ctx.drawImage(this.bg, 0, 0, V.W, V.H);
  },

  drawCrowd(ctx, t, excite) {
    const V = this.V;
    for (const k of this.blocks) {
      const e = Math.max(this.cheer[k.side], (excite || 0) * .35);
      k.b.draw(ctx, k.x, k.y, t, .5 + e * 5.5, k.side * 2.1 + k.x * .01);
    }
    // flags along the rim
    const n = Math.max(4, Math.round(V.W / 60));
    for (let i = 0; i < n; i++) {
      const x = (i + .5) * V.W / n, tm = this.teams[i < n / 2 ? 0 : 1], y = V.skyH - 2, hgt = 20;
      if (Math.abs(x - V.W / 2) < 100) continue;
      ctx.strokeStyle = '#e8ecf5'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - hgt); ctx.stroke();
      const w1 = Math.sin(t * 5 + i * 1.3) * 2.2, w2 = Math.sin(t * 5 + i * 1.3 + 1.2) * 2.6;
      ctx.fillStyle = tm.c1; ctx.beginPath(); ctx.moveTo(x, y - hgt); ctx.quadraticCurveTo(x + 7, y - hgt - 2 + w1, x + 15, y - hgt + 2 + w2);
      ctx.lineTo(x + 15, y - hgt + 10 + w2); ctx.quadraticCurveTo(x + 7, y - hgt + 6 + w1, x, y - hgt + 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tm.c2; ctx.beginPath(); ctx.arc(x + 7, y - hgt + 4.5 + w1 * .7, 2, 0, TAU); ctx.fill();
    }
    // camera flashes
    for (const f of this.flashes) { const k = f.t / .22; ctx.globalAlpha = k; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x, f.y, 1.4 + (1 - k) * 2.6, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  },

  // drifting cloud shadows on the grass
  drawFieldLight(ctx, t) {
    const V = this.V;
    ctx.save(); roundRect(ctx, V.fx - 2, V.fy - 2, V.fw + 4, V.fh + 4, 5); ctx.clip();
    ctx.fillStyle = 'rgba(20,70,50,.075)';
    for (let i = 0; i < 3; i++) {
      const x = ((t * (7 + i * 3) + i * 170) % (V.fw + 260)) - 130 + V.fx, y = V.fy + V.fh * (.2 + i * .3);
      ctx.beginPath(); ctx.ellipse(x, y, 70 + i * 16, 30 + i * 6, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },

  drawConfetti(ctx) {
    for (const p of this.confetti) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.w * .3 * Math.abs(Math.cos(p.rot * 1.7)) - .3, p.w, p.w * .6 * Math.abs(Math.cos(p.rot * 1.7)) + .6);
      ctx.restore();
    }
  }
};

// ===== creatures on the field =====
function drawShadow(ctx, u, lift) {
  const k = clamp(1 - lift * .014, .45, 1);
  ctx.fillStyle = 'rgba(20,70,30,.3)';
  ctx.beginPath(); ctx.ellipse(u.x + u.ox, u.y + u.oy + 1, u.r * .95 * k, u.r * .36 * k, 0, 0, TAU); ctx.fill();
}

function drawUnit(ctx, G, u, time) {
  if (u.state === 'gone') return;
  let x = u.x + u.ox, y = u.y + u.oy, lift = u.lift + u.z, al = u.al, sx = u.sx, sy = u.sy, rot = u.rot, pivot = u.pivot, shut = false;
  if (u.state === 'deploy') {
    const k = clamp(u.st / RULES.DEPLOY, 0, 1), s = Ease.outBack(k);
    sx *= s; sy *= s; lift += (1 - k) * 12;
  } else if (u.state === 'faint') {
    const k = clamp(u.st / .95, 0, 1);
    rot = -Ease.outCubic(Math.min(1, k * 2.4)) * 1.5; pivot = true; shut = true;
    lift += Ease.hump(Math.min(1, k * 2.6)) * 7; al = k > .55 ? 1 - (k - .55) / .45 : 1;
  } else if (u.state === 'recall') {
    const k = clamp(u.st / .6, 0, 1);
    sx *= 1 - k * .75; sy *= 1 + k * 1.3; al = 1 - k * k; lift += k * k * 70;
    const gr = ctx.createLinearGradient(0, y - 110, 0, y);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,' + (.8 * Ease.hump(k)) + ')');
    ctx.fillStyle = gr; ctx.fillRect(x - u.r * .7, y - 110, u.r * 1.4, 110);
  } else if (u.stun > 0) shut = u.stunKind !== 'zap';
  if (u.hide) return;

  // team ring + shadow
  if (u.state === 'active' || u.state === 'deploy') {
    ctx.strokeStyle = u.side === 0 ? 'rgba(60,225,90,.9)' : 'rgba(255,60,75,.9)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(x, y + 1, u.r * 1.08, u.r * .43, 0, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = al; drawShadow(ctx, u, lift); ctx.globalAlpha = 1;

  const face = (u.flip ? -1 : 1) * u.face, s = u.vs;
  const t = time + u.seed * 9, br = Math.sin(t * 3) * .018;
  const hop = u.moving ? Math.abs(Math.sin(t * 13)) * 2.2 : 0;
  const jx = u.flash > 0 ? Math.sin(time * 90) * u.flash * 1.6 : 0;
  const pose = { atk: u.atkT >= 0 ? clamp(u.atkT / u.atk.dur, .001, 1) : 0, moving: u.moving, seed: u.seed, shut };
  const paint = () => {
    ctx.save();
    ctx.translate(x + jx, y - lift - hop);
    ctx.scale(s * face * sx * (1 - br * .5), s * sy * (1 + br));
    if (rot) { if (pivot) { ctx.translate(0, -15); ctx.rotate(rot); ctx.translate(0, 15); } else ctx.rotate(rot); }
    drawCreature(ctx, u.sp.id, time, pose);
    ctx.restore();
  };
  ctx.globalAlpha = al; paint();
  if (u.flash > .05) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al * u.flash * .28; paint(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.globalAlpha = 1;

  const top = y - lift - 38 * s;
  // status overlays
  if (u.state === 'active') {
    if (u.shield > 0) {
      ctx.strokeStyle = 'rgba(255,220,90,.9)'; ctx.fillStyle = 'rgba(255,230,120,.16)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(x, y - lift - 17 * s, u.r * 1.25, 21 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
    }
    if (u.stun > 0) {
      if (u.stunKind === 'ice') {
        ctx.fillStyle = 'rgba(170,230,255,.5)'; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4;
        roundRect(ctx, x - u.r * 1.1, y - lift - 36 * s, u.r * 2.2, 38 * s, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - u.r * .6, y - lift - 30 * s); ctx.lineTo(x - u.r * .2, y - lift - 20 * s); ctx.stroke();
      } else if (u.stunKind === 'zap') {
        ctx.strokeStyle = '#fff7b0'; ctx.lineWidth = 1.5; ctx.lineJoin = 'miter';
        for (let i = 0; i < 3; i++) { const an = time * 9 + i * 2.1, px = x + Math.cos(an) * u.r, py = y - lift - 16 * s + Math.sin(an * 1.3) * 12; ctx.beginPath(); ctx.moveTo(px - 3, py - 4); ctx.lineTo(px + 1, py - 1); ctx.lineTo(px - 1, py + 1); ctx.lineTo(px + 3, py + 4); ctx.stroke(); }
      } else {
        ctx.fillStyle = '#ffe14a';
        for (let i = 0; i < 3; i++) { const an = time * 6 + i * TAU / 3; star4(ctx, x + Math.cos(an) * u.r * .8, top + 4 + Math.sin(an) * 3, 3); }
      }
    }
  }
  if (u.state === 'faint') {
    ctx.fillStyle = '#ffe14a'; ctx.globalAlpha = al;
    for (let i = 0; i < 3; i++) { const an = time * 7 + i * TAU / 3; star4(ctx, x + Math.cos(an) * u.r * .9, y - u.r * 1.3 + Math.sin(an) * 3, 3.2); }
    ctx.globalAlpha = 1;
  }
  // health bar, element pip and stint timer
  if (u.state === 'active' || u.state === 'deploy') {
    const bw = 26 + u.r * .5, bx = x - bw / 2 + 3, by = top - 6, f = clamp(u.hp / u.maxHp, 0, 1), mine = u.side === 0;
    // your side: green bars. the rival: red bars. (the empty part keeps a dark tint of the same colour)
    ctx.fillStyle = 'rgba(20,16,34,.85)'; roundRect(ctx, bx - 1.2, by - 1.2, bw + 2.4, 7, 3.4); ctx.fill();
    ctx.fillStyle = mine ? '#17481f' : '#5a141c'; roundRect(ctx, bx, by, bw, 4.6, 2.3); ctx.fill();
    if (f > 0) {
      if (f < .3) ctx.globalAlpha = .7 + Math.sin(time * 12) * .3;
      ctx.fillStyle = mine ? '#35e653' : '#ff3145'; roundRect(ctx, bx, by, Math.max(2.6, bw * f), 4.6, 2.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; roundRect(ctx, bx + .8, by + .6, Math.max(1.4, bw * f - 1.6), 1.3, .65); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const lf = clamp(u.life / RULES.STINT, 0, 1);
    ctx.fillStyle = 'rgba(25,20,40,.6)'; ctx.fillRect(bx, by + 6.6, bw, 1.6);
    ctx.fillStyle = lf < .17 ? '#ffd23d' : '#ffffff'; ctx.fillRect(bx, by + 6.6, bw * lf, 1.6);
    const e = EL[u.sp.el];
    ctx.beginPath(); ctx.arc(bx - 5, by + 2, 4.4, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(bx - 5, by + 2, 3.6, 0, TAU); ctx.fillStyle = e.col; ctx.fill();
    elGlyph(ctx, e.id, bx - 5, by + 2, 2.3, '#fff');
  }
}

// whole battlefield: ground effects, creatures sorted by depth, air effects
function drawBattle(ctx, G, time, extra, T) {
  const V = Arena.V, fx = G.fx, sh = fx.shake;
  T = T || { x: V.fx, y: V.fy, s: V.fs };
  ctx.save();
  ctx.translate(T.x + (sh ? rnd(-sh, sh) * .5 : 0), T.y + (sh ? rnd(-sh, sh) * .5 : 0)); ctx.scale(T.s, T.s);
  fx.drawItems(ctx, true);
  if (extra && extra.ground) extra.ground(ctx);
  const us = G.units.slice().sort((p, q) => (p.y + p.oy) - (q.y + q.oy));
  for (const u of us) drawUnit(ctx, G, u, time);
  if (extra && extra.mid) extra.mid(ctx);
  fx.drawItems(ctx, false);
  fx.drawParts(ctx);
  fx.drawTexts(ctx);
  ctx.restore();
}
