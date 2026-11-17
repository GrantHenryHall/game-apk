'use strict';
// ---------- creature drawing toolkit ----------
// Every creature is drawn in a little local space: origin at its feet, y up is negative,
// facing right, roughly 36 units tall. These globals are the "pen" the creature files use.
let c = null;            // current 2d context
let INK = '#2b2238';     // outline colour of the creature being drawn
let LW = 2;              // outline width
let T = 0;               // creature-local time (seconds)
let AT = 0;              // attack progress 0..1 (0 when not attacking)
let AP = 0;              // attack pulse 0 -> 1 -> 0
let MV = 0;              // 1 while walking
let ST = 0;              // walk swing -1..1
let BK = false;          // blinking right now
let W = 0;               // breathing wave -1..1
let TW = 0;              // tail-wag wave -1..1
// ---- attack choreography. An attack has one or more "beats" (moments a hit lands).
// Around each beat a creature winds up (anticipation), snaps into the strike, holds, and recovers.
let WD = 0;              // wind-up of the current beat 0..1 (peaks, then releases into the strike)
let SK = 0;              // strike of the current beat 0..1 (hits 1 exactly as the blow lands, then eases off)
let SM = 0;              // 1 while a limb is snapping through the strike (for motion smears)
let BI = -1;             // which beat is playing (-1 when not attacking)
let HU = 0;              // 1 while flinching from a hit
const BW = [0, 0, 0, 0, 0, 0], BS = [0, 0, 0, 0, 0, 0];   // wind / strike per beat, for moves with several hits
let ROOT = null, ROOTI = null, ANC = null;                // where the move comes out of the creature (see mark)

function fs(fill, lw) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw !== 0) { c.lineWidth = lw || LW; c.strokeStyle = INK; c.stroke(); }
}
// smooth closed blob through control points [x,y,x,y,...]
function bl(p, fill, lw) {
  const n = p.length >> 1;
  c.beginPath();
  c.moveTo((p[n * 2 - 2] + p[0]) / 2, (p[n * 2 - 1] + p[1]) / 2);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    c.quadraticCurveTo(p[i * 2], p[i * 2 + 1], (p[i * 2] + p[j * 2]) / 2, (p[i * 2 + 1] + p[j * 2 + 1]) / 2);
  }
  c.closePath(); fs(fill, lw);
}
// sharp polygon
function pg(p, fill, lw) {
  c.beginPath(); c.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
  c.closePath(); fs(fill, lw);
}
// outlined ellipse
function el(x, y, rx, ry, fill, rot, lw) {
  c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); fs(fill, lw);
}
// plain filled ellipse (details)
function dot(x, y, rx, ry, fill, rot) {
  c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry === undefined ? rx : ry), rot || 0, 0, TAU);
  c.fillStyle = fill; c.fill();
}
function curvePath(p) {
  const n = p.length >> 1;
  c.beginPath(); c.moveTo(p[0], p[1]);
  if (n === 2) { c.lineTo(p[2], p[3]); return; }
  for (let i = 1; i < n - 1; i++) {
    const x = p[i * 2], y = p[i * 2 + 1], last = i === n - 2;
    c.quadraticCurveTo(x, y, last ? p[i * 2 + 2] : (x + p[i * 2 + 2]) / 2, last ? p[i * 2 + 3] : (y + p[i * 2 + 3]) / 2);
  }
}
// thick outlined open curve (tails, limbs, necks)
function cv(p, col, wd) {
  curvePath(p);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = INK; c.lineWidth = wd + LW * 1.7; c.stroke();
  c.strokeStyle = col; c.lineWidth = wd; c.stroke();
}
// thin detail line
function ln(p, col, wd) {
  curvePath(p);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = col || INK; c.lineWidth = wd || 1.4; c.stroke();
}
// soft white highlight
function shine(x, y, rx, ry, rot, al) { dot(x, y, rx, ry, 'rgba(255,255,255,' + (al || .38) + ')', rot); }
function blush(x, y, s) { dot(x, y, 2.6 * (s || 1), 1.6 * (s || 1), 'rgba(255,105,135,.5)'); }
// eye: tall glossy dot by default, or a big eye when an iris colour is given
function eye(x, y, s, iris) {
  s = s || 1;
  if (HU > .35) { ln([x - 2.3 * s, y - 2 * s, x + 1.5 * s, y, x - 2.3 * s, y + 2 * s], INK, 1.6); return; }   // flinch: eyes squeezed
  if (BK) { ln([x - 2.4 * s, y, x, y + 1.3 * s, x + 2.4 * s, y], INK, 1.5); return; }
  if (iris) {
    el(x, y, 3.3 * s, 3.9 * s, '#fff', 0, 1.3);
    dot(x + .5 * s, y + .3 * s, 2.3 * s, 2.9 * s, iris);
    dot(x + .7 * s, y + .5 * s, 1.2 * s, 1.7 * s, '#17121f');
    dot(x - .5 * s, y - 1.4 * s, 1 * s, 1 * s, '#fff');
  } else {
    dot(x, y, 2.3 * s, 3.1 * s, '#1c1624');
    dot(x - .7 * s, y - 1.2 * s, .95 * s, 1.15 * s, '#fff');
    dot(x + .7 * s, y + 1.3 * s, .5 * s, .5 * s, 'rgba(255,255,255,.55)');
  }
}
// two eyes at once; `closed` squeezes them shut (effort, concentration, bliss)
function eyes(x1, y1, x2, y2, s, iris, closed, s2) { const b0 = BK; if (closed) BK = true; eye(x1, y1, s, iris); eye(x2, y2, s2 || s, iris); BK = b0; }
// joint: everything drawn until U() is rotated by `ang` about (px,py) and shifted by (dx,dy)
function J(px, py, ang, dx, dy) { c.save(); c.translate(px + (dx || 0), py + (dy || 0)); if (ang) c.rotate(ang); c.translate(-px, -py); }
function U() { c.restore(); }
// scale about a point (squash and stretch of one body part)
function Z(px, py, sx, sy) { c.save(); c.translate(px, py); c.scale(sx, sy); c.translate(-px, -py); }
// remember where this creature's move comes from (mouth, fist, wand tip...) in its own root space,
// so effects start from exactly the right spot whatever pose it is in
function mark(x, y) {
  if (!ROOT) return;
  if (!ROOTI) ROOTI = ROOT.inverse();
  const m = c.getTransform(), wx = m.a * x + m.c * y + m.e, wy = m.b * x + m.d * y + m.f;
  ANC = [ROOTI.a * wx + ROOTI.c * wy + ROOTI.e, ROOTI.b * wx + ROOTI.d * wy + ROOTI.f];
}
// motion smear: a soft tapered crescent trailing a fast limb. Sweeps from angle a0 (thin) to a1 (thick) about (cx,cy)
function swoosh(cx, cy, r, a0, a1, wid, col) {
  if (SM <= 0) return;
  const n = 9, ga = c.globalAlpha;
  c.beginPath();
  for (let i = 0; i <= n; i++) { const f = i / n, an = a0 + (a1 - a0) * f; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(an) * r, cy + Math.sin(an) * r); }
  for (let i = n; i >= 0; i--) { const f = i / n, an = a0 + (a1 - a0) * f, rr = r - wid * f; c.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); }
  c.closePath(); c.globalAlpha = ga * .6; c.fillStyle = col || '#ffffff'; c.fill(); c.globalAlpha = ga;
}
// straight smear from (x0,y0) (thin) to (x1,y1) (thick)
function streak(x0, y0, x1, y1, wid, col) {
  if (SM <= 0) return;
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * wid / 2, ny = dx / l * wid / 2, ga = c.globalAlpha;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + nx, y1 + ny); c.lineTo(x1 - nx, y1 - ny); c.closePath();
  c.globalAlpha = ga * .55; c.fillStyle = col || '#ffffff'; c.fill(); c.globalAlpha = ga;
}
function brow(x, y, dir, s) { s = s || 1; ln([x - 2.6 * s, y - dir * 1.2 * s, x + 2.6 * s, y + dir * 1.2 * s], INK, 1.7); }
function smile(x, y, wd, col) { ln([x - wd, y, x, y + wd * .8, x + wd, y], col || INK, 1.4); }
function openMouth(x, y, rx, ry) { el(x, y, rx, ry, '#7a2438', 0, 1.3); dot(x, y + ry * .45, rx * .6, ry * .4, '#ff8fa3'); }
// two feet with a walk shuffle
function feet(x1, x2, y, rx, ry, fill) {
  el(x1, y - Math.max(0, ST) * 3, rx, ry, fill);
  el(x2, y - Math.max(0, -ST) * 3, rx, ry, fill);
}
// animated flame, base at (x,y) rising upward
function flame(x, y, wd, h, ph, c1, c2, c3) {
  const s = Math.sin(T * 9 + ph) * wd * .28, s2 = Math.sin(T * 13 + ph) * h * .08;
  bl([x - wd, y, x - wd * .9, y - h * .45, x + s, y - h - s2, x + wd * .9, y - h * .4, x + wd, y, x, y + wd * .45], c1);
  bl([x - wd * .55, y, x - wd * .5, y - h * .3, x + s * .6, y - h * .62, x + wd * .5, y - h * .28, x + wd * .55, y, x, y + wd * .28], c2, 0);
  if (c3) dot(x, y - h * .12, wd * .28, h * .13, c3);
}
function star(x, y, r, fill, n, rot, lw) {
  n = n || 5; rot = rot || 0;
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * .45 : r, an = rot - PI / 2 + i * PI / n;
    c[i ? 'lineTo' : 'moveTo'](x + Math.cos(an) * rr, y + Math.sin(an) * rr);
  }
  c.closePath(); fs(fill, lw);
}
// leaf from (x,y) pointing along rot
function leaf(x, y, len, wid, rot, fill, lw) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath(); c.moveTo(0, 0);
  c.quadraticCurveTo(len * .5, -wid, len, 0);
  c.quadraticCurveTo(len * .5, wid, 0, 0);
  c.closePath(); fs(fill, lw);
  c.beginPath(); c.moveTo(len * .1, 0); c.lineTo(len * .8, 0);
  c.lineWidth = .9; c.strokeStyle = 'rgba(0,0,0,.22)'; c.stroke();
  c.restore();
}
// lightning bolt glyph centred on (x,y)
function bolt(x, y, s, rot, fill, lw) {
  c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
  c.beginPath();
  c.moveTo(1.5, -6); c.lineTo(-3.5, .8); c.lineTo(-.4, .8); c.lineTo(-1.8, 6); c.lineTo(3.6, -1.4); c.lineTo(.4, -1.4);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw !== 0) { c.lineWidth = (lw || LW) / s; c.strokeStyle = INK; c.stroke(); }
  c.restore();
}
// fluffy merged puff from circles [x,y,r,...] (clouds, wool, fur)
function puff(list, fill) {
  c.strokeStyle = INK; c.lineWidth = LW * 2;
  for (let i = 0; i < list.length; i += 3) { c.beginPath(); c.arc(list[i], list[i + 1], list[i + 2], 0, TAU); c.stroke(); }
  c.fillStyle = fill;
  for (let i = 0; i < list.length; i += 3) { c.beginPath(); c.arc(list[i], list[i + 1], list[i + 2], 0, TAU); c.fill(); }
}
function crescent(x, y, r, fill, rot, lw) {
  c.save(); c.translate(x, y); c.rotate(rot || 0);
  c.beginPath(); c.arc(0, 0, r, -PI * .5, PI * .5, false);
  c.quadraticCurveTo(r * 1.05, 0, 0, -r);
  c.closePath(); fs(fill, lw); c.restore();
}
function diamond(x, y, rx, ry, fill, lw) { pg([x, y - ry, x + rx, y, x, y + ry, x - rx, y], fill, lw); }
function glow(x, y, r, col, al) {
  const gr = c.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, al === undefined ? .7 : al)); gr.addColorStop(1, rgba(col, 0));
  c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

// ---------- registry + the one entry point everything else uses ----------
const CREATURE_ART = {};

// work out the wind / strike curves for attack progress p and the list of beat times
function beatCurves(p, beats) {
  WD = SK = SM = 0; BI = -1;
  const n = beats.length;
  for (let i = 0; i < 6; i++) { BW[i] = 0; BS[i] = 0; }
  if (!(p > 0)) return;
  for (let i = 0; i < n; i++) {
    const b = beats[i], a0 = i === 0 ? 0 : (beats[i - 1] + b) / 2, e = i === n - 1 ? 1 : (b + beats[i + 1]) / 2;
    if (p < a0 || p > e) continue;
    let w = 0, k = 0;
    if (p < b) {
      const q = (p - a0) / (b - a0 || 1);
      if (q < .66) w = Ease.outCubic(q / .66);
      else { const r = (q - .66) / .34; w = 1 - r * r; k = r * r * r; if (r > .12) SM = 1; }
    } else {
      const q = (p - b) / (e - b || 1);
      k = q < .2 ? 1 : 1 - Ease.inOut((q - .2) / .8);
      if (q < .09) SM = 1;
    }
    BI = i; WD = w; SK = k; BW[i] = w; BS[i] = k;
  }
}

// pose: { atk: 0..1 | 0, hit: when the blow lands (0..1), beats: [..] for multi-hit moves, hurt: 0..1, moving, seed }
// returns the creature-space point its move comes from (or null)
function drawCreature(ctx, id, time, pose) {
  c = ctx; pose = pose || {};
  const seed = pose.seed || 0;
  T = time + seed * 7.31;
  AT = pose.atk || 0; AP = AT > 0 ? Math.sin(AT * PI) : 0;
  beatCurves(AT, pose.beats || [pose.hit || .45]);
  HU = pose.hurt || 0;
  MV = pose.moving ? 1 : 0; ST = MV ? Math.sin(T * 13) : 0;
  W = Math.sin(T * 3); TW = Math.sin(T * 5.2);
  BK = !pose.noBlink && ((T * .37 + seed) % 1) > .955;
  if (pose.shut || HU > .35) BK = true;
  LW = 2; INK = '#2b2238';
  c.lineJoin = 'round'; c.lineCap = 'round';
  ROOT = c.getTransform ? c.getTransform() : null; ROOTI = null; ANC = null;
  CREATURE_ART[id]();
  return ANC;
}
