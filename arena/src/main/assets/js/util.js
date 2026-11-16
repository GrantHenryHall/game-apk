'use strict';
// ---------- tiny math + color helpers shared by everything ----------
const TAU = Math.PI * 2, PI = Math.PI;
const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const lerp = (p, q, k) => p + (q - p) * k;
const rnd = (lo, hi) => hi === undefined ? Math.random() * (lo === undefined ? 1 : lo) : lo + Math.random() * (hi - lo);
const rndi = (lo, hi) => Math.floor(rnd(lo, hi + 1));
const pick = arr => arr[(Math.random() * arr.length) | 0];
const dist2 = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const sgn = v => v < 0 ? -1 : 1;

const Ease = {
  outCubic: k => 1 - Math.pow(1 - k, 3),
  inCubic: k => k * k * k,
  inOut: k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2,
  outBack: k => { const s = 1.70158; k -= 1; return k * k * ((s + 1) * k + s) + 1; },
  outElastic: k => k === 0 ? 0 : k === 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * (TAU / 3)) + 1,
  outBounce: k => {
    const n = 7.5625, d = 2.75;
    if (k < 1 / d) return n * k * k;
    if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75;
    if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375;
    return n * (k -= 2.625 / d) * k + .984375;
  },
  // 0 -> 1 -> 0 hump
  hump: k => Math.sin(clamp(k, 0, 1) * PI),
  // maps k in [a,b] to 0..1 clamped
  seg: (k, lo, hi) => clamp((k - lo) / (hi - lo), 0, 1)
};

function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, al) { const c3 = hexToRgb(hex); return 'rgba(' + c3[0] + ',' + c3[1] + ',' + c3[2] + ',' + al + ')'; }
// amt > 0 lightens toward white, amt < 0 darkens toward black
function shade(hex, amt) {
  const c3 = hexToRgb(hex), tgt = amt > 0 ? 255 : 0, k = Math.abs(amt);
  return 'rgb(' + c3.map(v => Math.round(v + (tgt - v) * k)).join(',') + ')';
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
// chunky outlined text used all over the HUD
function chunkyText(ctx, str, x, y, size, fill, stroke, lw, align) {
  ctx.font = '900 ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || size * .22; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y);
}
const FONT = '"Arial Rounded MT Bold","Nunito","Baloo 2","Trebuchet MS","Segoe UI",Roboto,system-ui,sans-serif';
