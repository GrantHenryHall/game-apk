'use strict';
// ---------- creature art, part A: Fire, Water, Leaf, Spark, Stone ----------
// See art.js for the pen helpers. Origin = feet, y up is negative, facing right.

// ===== FIRE =====
CREATURE_ART.furnox = function () {            // ember ox calf
  INK = '#5a2318';
  const bd = '#ea5a3c', bel = '#ffc48f', hn = '#fff3da', dk = '#47323c';
  cv([-15, -17, -22, -20 + TW, -24, -11 + TW * 2], bd, 2.6); dot(-24, -10 + TW * 2, 3.2, 3.6, dk);
  feet(-9, 7, -2.5, 5, 3.6, dk);
  bl([-18, -13, -17, -27, -4, -32, 10, -30, 17, -20, 15, -6, 0, -3, -13, -4], bd);
  dot(-2, -8.5, 9, 4.2, bel);
  ln([-13, -24, -9, -20, -11, -16], '#ffd84a', 1.8); ln([-5, -28, -2, -24, -4, -20], '#ffd84a', 1.8);
  pg([3, -30, 0, -41, 9, -33], hn); pg([16, -29, 23, -38, 20, -27], hn);
  el(11, -21, 11, 10, bd);
  el(-1, -25, 3.2, 2.1, bd, -.6);
  el(16, -15.5, 7, 5, bel);
  dot(13.6, -15.2, 1, 1.3, INK); dot(18.8, -15.6, 1, 1.3, INK);
  eye(7.5, -22.5); eye(16.5, -23.5);
  if (AP > .05) { brow(7.5, -27, 1); brow(16.5, -28, -1); dot(22 + AP * 5, -16, 1.5 + AP * 2.5, 1.5 + AP * 2.5, 'rgba(255,255,255,.75)'); dot(24 + AP * 8, -19, 1 + AP * 2, 1 + AP * 2, 'rgba(255,255,255,.5)'); }
  shine(-6, -27.5, 5, 1.8, -.2);
};

CREATURE_ART.blazaroo = function () {          // boxing kangaroo with flame mitts
  INK = '#5c2a12';
  const bd = '#f49a4c', bel = '#ffe6b8';
  cv([-7, -7, -17, -3, -23, -11 + TW * 1.5], bd, 4.6);
  feet(-3, 8, -2, 7, 3, bd);
  bl([-10, -5, -12, -19, -4, -29, 6, -29, 11, -19, 10, -5, 0, -2], bd);
  dot(2, -11.5, 6, 7, bel); ln([-2, -9.5, 2, -8, 6, -9.5], '#d98a4a', 1.2);
  bl([-3, -35, -7, -48, 1, -40], bd); bl([6, -36, 8, -49, 12, -39], bd);
  dot(-3.2, -41, 1.2, 3.4, '#ffb0a0', -.25); dot(8.6, -42, 1.2, 3.4, '#ffb0a0', .1);
  el(4, -31, 9, 8, bd);
  el(9.5, -28, 5, 3.6, bel); dot(12.6, -29.4, 1.3, 1, INK);
  eye(2, -32.5); eye(9, -33.5); smile(9.5, -26.6, 1.8);
  const j1 = AT > 0 && AT < .5 ? Math.sin(AT * 2 * PI) : 0, j2 = AT >= .5 ? Math.sin((AT - .5) * 2 * PI) : 0;
  const fx1 = -9 + j2 * 20, fy1 = -15 - j2 * 3, fx2 = 13 + j1 * 9, fy2 = -17 - j1 * 2;
  flame(fx1, fy1 - 3, 3.4, 8, 1, '#ff5a2a', '#ffd23d');
  el(fx1, fy1, 4.6, 4.3, '#ff5a3a'); shine(fx1 - 1.2, fy1 - 1.6, 1.6, 1);
  flame(fx2, fy2 - 3, 3.4, 8, 2, '#ff5a2a', '#ffd23d');
  el(fx2, fy2, 4.6, 4.3, '#ff5a3a'); shine(fx2 - 1.2, fy2 - 1.6, 1.6, 1);
};

CREATURE_ART.flarret = function () {           // comet-tailed ferret
  INK = '#5a2a14';
  const bd = '#ff8a3c', cr = '#fff0cf', mk = '#7a3a1e';
  bl([-11, -11, -22, -18 + TW * 2, -33, -9 + TW * 3, -21, -5, -11, -5], '#ffb52e');
  bl([-13, -9.5, -21, -13 + TW * 2, -28, -9 + TW * 2.5, -20, -7], '#fff1a0', 0);
  feet(-8, 8, -2, 3.6, 2.6, mk);
  bl([-14, -5, -14, -14, -4, -18, 8, -16, 12, -8, 8, -4], bd);
  dot(0, -6.5, 8, 2.8, cr);
  el(7, -22.5, 2.7, 3.1, bd); el(16, -23, 2.7, 3.1, bd);
  el(12, -15, 8.2, 7.2, bd);
  dot(12.6, -16, 6.6, 3.1, mk);
  eye(9, -16, .95, '#ffb52e'); eye(16, -16.5, .95, '#ffb52e');
  dot(17.5, -11.6, 3.3, 2.4, cr); dot(19.8, -12.4, 1.1, .9, INK);
  smile(17, -10.4, 1.4);
};

CREATURE_ART.solcub = function () {            // lion cub with a sun-ray mane
  INK = '#6a3a10';
  const bd = '#ffcb4f', cr = '#fff3d0', ray = '#ff8a2a';
  cv([-9, -6, -19, -7, -20, -18 + TW * 2], bd, 2.6);
  star(-20, -20 + TW * 2, 4.4, ray, 8, T);
  feet(-6, 6, -2, 4.6, 3, bd);
  bl([-11, -4, -12, -16, 0, -21, 11, -16, 10, -4, 0, -2], bd);
  dot(1, -8, 5.5, 4.5, cr);
  const cx = 3, cy = -25, n = 11;
  for (let i = 0; i < n; i++) {
    const an = i / n * TAU + T * .7, r2 = 16.5 + AP * 6 + Math.sin(T * 4 + i) * .8;
    pg([cx + Math.cos(an - .27) * 10, cy + Math.sin(an - .27) * 9.5, cx + Math.cos(an) * r2, cy + Math.sin(an) * r2 * .95, cx + Math.cos(an + .27) * 10, cy + Math.sin(an + .27) * 9.5], i % 2 ? ray : '#ffb52e');
  }
  el(-5, -33.5, 3.2, 3.2, bd); el(10.5, -34, 3.2, 3.2, bd);
  el(cx, cy, 10.6, 9.6, bd);
  dot(6, -22, 4.8, 3.3, cr);
  pg([5, -24.4, 8.2, -24.6, 6.6, -22.6], '#c2562a', 1);
  ln([6.6, -22.6, 6.6, -21.2], INK, 1.1); smile(4.9, -21.2, 1.6); smile(8.3, -21.3, 1.6);
  eye(-.5, -26.5); eye(9, -27.2);
  blush(-3.5, -22.5);
};

CREATURE_ART.campyre = function () {           // living campfire
  INK = '#5a2a14';
  el(-6, -3.2, 10.5, 3.7, '#8a5a3a', .28); el(6, -3.2, 10.5, 3.7, '#a87044', -.28);
  dot(-14.5, -5.8, 2.2, 2.9, '#e8c79a', .28); dot(14.5, -5.8, 2.2, 2.9, '#f0d2a6', -.28);
  const s = Math.sin(T * 8) * 2, s2 = Math.sin(T * 11) * 1.4, g = AP * 5;
  bl([-12, -6, -14, -20, -6 + s2, -27, 0 + s, -39 - g, 6 + s2, -27, 14, -20, 12, -6, 0, -2], '#ff6a2a');
  bl([-8, -6, -9, -17, 0 + s * .5, -29 - g * .6, 9, -17, 8, -6, 0, -3], '#ffb52e', 0);
  dot(0, -8, 5.5, 4, '#fff3a8');
  eye(-4, -14.5); eye(4.4, -14.5);
  if (AP > .1) openMouth(.2, -9.6, 2.4, 2 + AP * 1.5); else smile(.2, -10.4, 1.9);
  blush(-7.6, -11.4); blush(8, -11.4);
  cv([-11, -12, -17, -15 - AP * 6], '#8a5a3a', 1.6); cv([11, -12, 17, -15 - AP * 6], '#8a5a3a', 1.6);
  for (let i = 0; i < 3; i++) { const k = (T * .7 + i / 3) % 1; dot(-9 + i * 9 + Math.sin(T * 3 + i) * 2, -30 - k * 14, 1.2 * (1 - k), 1.2 * (1 - k), '#ffe27a'); }
};

// ===== WATER =====
CREATURE_ART.walrump = function () {           // chubby walrus
  INK = '#1f3a5c';
  const bd = '#74b6ea', bel = '#dcf1ff', mz = '#ffeedd';
  bl([-15, -7, -24, -12 + TW * 1.5, -27, -4 + TW, -18, -2], '#5a9fd6');
  bl([-18, -4, -18, -20, -6, -29, 8, -29, 18, -20, 18, -6, 6, -2, -10, -2], bd);
  dot(1, -7.5, 11, 4.6, bel);
  bl([6, -7, 15, -5 - AP * 6, 22, -1.5 - AP * 8, 11, -1], '#5a9fd6');
  el(8, -21, 11.6, 10.6, bd);
  el(11, -15.6, 7.6, 5.4, mz);
  dot(8, -15, .7, .7, '#c9a58f'); dot(10, -13.3, .7, .7, '#c9a58f'); dot(14, -13.3, .7, .7, '#c9a58f'); dot(16, -15, .7, .7, '#c9a58f');
  dot(11.4, -19.6, 2.1, 1.5, INK);
  pg([7.6, -12.6, 7, -4.5, 10.6, -11.6], '#fff'); pg([13.6, -11.6, 15.4, -4.5, 17, -12.6], '#fff');
  eye(4.2, -24.4); eye(15.2, -25);
  blush(1, -20); shine(-8, -24, 5, 2, -.5);
};

CREATURE_ART.snipclaw = function () {          // teal crab with one giant pincer
  INK = '#14485a';
  const bd = '#3fbccb', lt = '#9eeaf0', co = '#ff8a5c';
  for (let i = 0; i < 3; i++) {
    const k = Math.sin(T * 12 + i * 2) * MV;
    cv([-9 - i * 2, -6, -15 - i * 2, -6 - k, -17 - i * 2, -1], bd, 1.8);
    cv([7 + i * 2, -6, 13 + i * 2, -6 + k, 15 + i * 2, -1], bd, 1.8);
  }
  cv([-10, -13, -16, -16, -18, -13], bd, 2.4); el(-18.5, -12, 4.2, 3.8, bd); ln([-21.5, -12, -17, -12.6], INK, 1.2);
  bl([-14, -4, -15, -14, -8, -19, 8, -19, 15, -14, 14, -4, 0, -1], bd);
  dot(0, -5.6, 9, 2.6, lt);
  cv([-5, -18, -6, -25 + W * .6], bd, 2.2); cv([5, -18, 6, -25 - W * .6], bd, 2.2);
  if (BK) { el(-6, -27, 3.6, 3.6, bd); el(6, -27, 3.6, 3.6, bd); ln([-8, -27, -4, -27], INK, 1.4); ln([4, -27, 8, -27], INK, 1.4); }
  else { el(-6, -27 + W * .6, 3.7, 3.7, '#fff'); dot(-5.3, -26.6 + W * .6, 1.7, 2, '#17121f'); el(6, -27 - W * .6, 3.7, 3.7, '#fff'); dot(6.7, -26.6 - W * .6, 1.7, 2, '#17121f'); }
  smile(0, -10.5, 3); blush(-8, -10.5); blush(8, -10.5);
  // the big claw: jaws open on wind-up and snap shut
  const open = AT > 0 ? (AT < .5 ? Ease.seg(AT, 0, .45) : 1 - Ease.seg(AT, .5, .62)) : .25 + W * .05;
  const kx = 17 + AP * 5, ky = -16 - AP * 3;
  cv([11, -12, 14, -15, kx - 2, ky + 1], bd, 3);
  c.save(); c.translate(kx, ky);
  c.save(); c.rotate(-open * .75); bl([-3, 0, -2, -8, 8, -9, 14, -3, 6, -1], bd); pg([10, -6.6, 14, -3, 9.5, -2.6], co, 1.2); c.restore();
  c.save(); c.rotate(open * .55); bl([-3, -1, -2, 5, 6, 6, 12, 2, 5, 0], bd); c.restore();
  c.restore();
};

CREATURE_ART.zipfin = function () {            // little sailfish
  INK = '#143a6a';
  const bd = '#2f8fe8', bel = '#e8f6ff', sl = '#7ad6ff';
  const y = -15 + W * 1.6;
  pg([-13, y, -25, y - 9 + TW * 2, -20, y, -25, y + 8 + TW * 2], bd);
  bl([-9, y - 5, -7, y - 22, 4, y - 19, 11, y - 6], sl);
  ln([-5, y - 8, -4, y - 18], '#2f8fe8', 1.3); ln([0, y - 8, 1, y - 17], '#2f8fe8', 1.3); ln([5, y - 8, 5.5, y - 14], '#2f8fe8', 1.3);
  pg([13, y - 3.4, 30, y - 1, 13, y + 1.2], '#dff3ff');
  bl([-16, y, -6, y - 8.5, 8, y - 7.5, 17, y - 2, 8, y + 5.5, -6, y + 5.5], bd);
  bl([-12, y + 2, 0, y + 1, 12, y + 1, 6, y + 4.6, -6, y + 4.8], bel, 0);
  pg([0, y + 2, -5, y + 10 + AP * 3, 4, y + 4], sl);
  eye(9, y - 2.4, .95); smile(13.5, y + .8, 1.3);
  shine(-2, y - 5.4, 6, 1.4, 0);
};

CREATURE_ART.inkjet = function () {            // ink-squirting squid
  INK = '#141a44';
  const bd = '#5f7fff', lt = '#a9baff';
  const y = -4 + W * 1.6 - 2;
  for (let i = 0; i < 5; i++) {
    const x = -8 + i * 4, k = Math.sin(T * 5 + i * 1.3) * 2.5;
    cv([x, y - 8, x + k * .5, y - 2, x - k, y + 3], lt, 2.2);
  }
  pg([-9, y - 27, -18, y - 24 + TW, -10, y - 18], lt); pg([9, y - 27, 18, y - 24 - TW, 10, y - 18], lt);
  bl([-10.5, y - 7, -11.5, y - 22, 0, y - 37, 11.5, y - 22, 10.5, y - 7, 0, y - 4], bd);
  dot(-4, y - 27, 1.6, 1.6, lt); dot(4.5, y - 29.5, 1.2, 1.2, lt); dot(1, y - 24, 1, 1, lt);
  eye(-4.4, y - 13.5, 1.2, '#232f8a'); eye(5, y - 13.5, 1.2, '#232f8a');
  if (AP > .1) { el(.3, y - 8, 2 + AP, 2 + AP, '#1c1f4d'); } else dot(.3, y - 8.4, 1.3, 1, INK);
  blush(-8, y - 9.5); blush(8.6, y - 9.5);
  shine(-5, y - 30, 2.2, 4.5, .5);
};

CREATURE_ART.drizzelly = function () {         // dew-drop jellyfish
  INK = '#1d5a7a';
  const y = -15 + W * 2;
  for (let i = 0; i < 4; i++) {
    const x = -8 + i * 5.3, k = Math.sin(T * 4 + i * 1.7) * 3;
    cv([x, y, x + k, y + 5, x - k, y + 10, x + k * .5, y + 14], i % 2 ? '#ffb6dc' : '#bfeeff', 1.9);
  }
  bl([-13.5, y, -14.5, y - 12, -4, y - 20, 0, y - 28 - AP * 3, 4, y - 20, 14.5, y - 12, 13.5, y, 7, y + 3, 0, y + .5, -7, y + 3], '#8fe0ff');
  bl([-10, y - 3, -10, y - 11, 0, y - 18, 10, y - 11, 10, y - 3, 0, y - 2], 'rgba(255,255,255,.28)', 0);
  eye(-4.6, y - 8.5); eye(4.8, y - 8.5); smile(.1, y - 5.2, 1.7);
  blush(-8.6, y - 5.2); blush(8.8, y - 5.2);
  shine(-6.5, y - 15, 2.2, 4, .7, .6);
  for (let i = 0; i < 2; i++) { const k = (T * .6 + i * .5) % 1; el(-12 + i * 25, y - 16 - k * 12, 1.8 * (1 - k * .5), 1.8 * (1 - k * .5), 'rgba(255,255,255,.35)', 0, 1); }
};

// ===== LEAF =====
CREATURE_ART.stumply = function () {           // walking tree stump
  INK = '#3d2a14';
  const bark = '#ad783e', top = '#f2d8a0', lf = '#5fd060';
  bl([-13, -3, -19, -1.5, -15, .5, -8, 0], bark); bl([13, -3, 19, -1.5, 15, .5, 8, 0], bark);
  feet(-6, 6, -1.6, 4.4, 2.6, '#8f5f2e');
  bl([-13, -2, -14.5, -22, -12, -27, 12, -27, 14.5, -22, 13, -2, 0, 0], bark);
  ln([-9, -6, -9.5, -12], '#7d5226', 1.3); ln([10, -17, 10.4, -23], '#7d5226', 1.3); ln([-11, -18, -11, -22], '#7d5226', 1.3);
  el(0, -27, 12.6, 4.6, top);
  c.beginPath(); c.ellipse(0, -27, 7.5, 2.6, 0, 0, TAU); c.strokeStyle = '#d6b272'; c.lineWidth = 1; c.stroke();
  c.beginPath(); c.ellipse(.5, -27, 3.4, 1.2, 0, 0, TAU); c.stroke();
  cv([0, -28, 1, -35 - AP * 2], '#5a8a2a', 1.5);
  leaf(1, -35 - AP * 2, 9, 4, -.5 + TW * .18, lf); leaf(1, -35 - AP * 2, 8, 3.6, PI + .45 + TW * .18, '#7fe070');
  dot(-9.5, -24.6, 3.4, 1.8, '#6fc45a'); dot(8, -3.5, 3.6, 1.6, '#6fc45a');
  eye(-3.4, -15); eye(6, -15);
  if (AP > .1) openMouth(1.4, -9.4, 2.2, 1.6 + AP); else smile(1.4, -10.6, 2);
  blush(-7, -11); blush(9.6, -11);
  cv([-13.5, -13, -19, -16 - AP * 5], bark, 2.2); cv([13.5, -13, 19, -16 - AP * 5], bark, 2.2);
};

CREATURE_ART.brambear = function () {          // bear cub with bramble gauntlets
  INK = '#4a2a14';
  const bd = '#cf8e4c', cr = '#ffe8c2', gr = '#5fd060';
  feet(-7, 7, -2.2, 5.6, 3.5, bd);
  bl([-12, -4, -13, -18, 0, -23, 13, -18, 12, -4, 0, -1], bd);
  dot(1, -9.5, 6.5, 5.5, cr);
  for (let i = 0; i < 5; i++) leaf(-8 + i * 4.6, -19.5 + Math.abs(i - 2) * .8, 6, 2.6, PI * .5 + (i - 2) * .32, i % 2 ? gr : '#7fe070', 1.3);
  el(-6.5, -36.5, 3.8, 3.8, bd); el(10.5, -37, 3.8, 3.8, bd);
  dot(-6.5, -36.3, 1.8, 1.8, '#f4b7a0'); dot(10.5, -36.8, 1.8, 1.8, '#f4b7a0');
  el(2, -28.5, 11, 10, bd);
  leaf(1, -38, 7, 3, -1.2 + TW * .12, gr, 1.3);
  dot(5, -25.4, 5.2, 3.7, cr); dot(6.6, -27, 1.8, 1.3, INK);
  ln([6.6, -25.8, 6.6, -24.6], INK, 1.1); smile(6.6, -24.4, 1.8);
  eye(-1.4, -29.5); eye(8.6, -30.2);
  blush(-4.6, -25.4);
  const sw = AT > 0 ? Math.sin(AT * PI * 3) : 0;
  const px = 14 + AP * 6, py = -13 - AP * 6 + sw * 4;
  pg([px + 3, py - 4, px + 8, py - 6, px + 5, py - 1], '#eaffd0', 1.1); pg([px + 4, py - 1, px + 9.6, py - 1, px + 5, py + 2], '#eaffd0', 1.1); pg([px + 3, py + 2, px + 8, py + 5, px + 4, py + 4.6], '#eaffd0', 1.1);
  el(px, py, 4.9, 4.7, gr); ln([px - 3, py - 1.5, px + 2.6, py - 2.4], '#2f9a44', 1.2); ln([px - 3, py + 1.6, px + 2.6, py + 1.2], '#2f9a44', 1.2);
  el(-12.5, -12, 4.6, 4.4, gr); ln([-15, -13, -10, -13.6], '#2f9a44', 1.2);
};

CREATURE_ART.cloverbun = function () {         // clover-eared bunny
  INK = '#4a5a3a';
  const bd = '#f8fff2', gr = '#55c85a', pk = '#ffb9cc';
  el(-10.5, -8, 4.2, 4.2, '#fff');
  feet(-3, 8, -1.8, 6.2, 2.9, bd);
  bl([-10, -3, -11, -15, 0, -19, 10, -15, 9, -3, 0, -1], bd);
  const sway = TW * 1.5 + AP * 3;
  bl([-2, -30, -6 - sway, -44, 0 - sway, -46, 3, -31], bd); dot(-1.6 - sway * .6, -38, 1.5, 5, pk, -.12);
  bl([5, -31, 7 + sway, -46, 12 + sway, -45, 9.5, -30], bd); dot(8.4 + sway * .6, -38.5, 1.5, 5, pk, .12);
  const clover = (x, y) => { el(x - 3, y, 3, 3, gr, 0, 1.4); el(x + 3, y, 3, 3, gr, 0, 1.4); el(x, y - 3, 3, 3, gr, 0, 1.4); dot(x, y - .6, 2.4, 2.4, gr); };
  clover(-3.4 - sway, -47); clover(9.8 + sway, -47.5);
  el(3, -23.5, 9.6, 8.6, bd);
  eye(-.6, -24.6); eye(7.8, -25.2);
  dot(4.8, -21.4, 1.3, 1, '#ff7f9f'); smile(3.4, -20.2, 1.3); smile(6.2, -20.3, 1.3);
  blush(-4.2, -21); blush(10.6, -21.6);
};

CREATURE_ART.bloomerang = function () {        // flower sprite
  INK = '#6a2a4a';
  const gr = '#5fd060', pt = '#ff8fb8', pt2 = '#ffb3cf';
  feet(-4, 4, -1.6, 3.7, 2.4, '#3da04a');
  bl([-6, -3, -7, -13, 0, -16, 7, -13, 6, -3, 0, -1], gr);
  leaf(-6, -10, 9, 3.6, PI + .5 - AP * 1.2, gr); leaf(6, -10, 9, 3.6, -.5 + AP * 1.2 + TW * .1, '#7fe070');
  const cx = 0, cy = -25.5, sp = W * .06 + AT * TAU;
  for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + sp; el(cx + Math.cos(an) * 9.5, cy + Math.sin(an) * 9.5, 6, 4.3, i % 2 ? pt : pt2, an); }
  el(cx, cy, 8.3, 8.3, '#ffe27a');
  eye(-3.2, -26.5); eye(3.6, -26.5); smile(.2, -23.2, 1.9);
  blush(-5.8, -23.2); blush(6.2, -23.2);
};

CREATURE_ART.sporel = function () {            // sleepy toadstool healer
  INK = '#5a2330';
  const cap = '#f2686e', cr = '#fff3dc';
  feet(-4, 4, -1.6, 3.8, 2.4, cr);
  bl([-7.5, -2, -8.5, -14, 0, -16, 8.5, -14, 7.5, -2, 0, 0], cr);
  dot(0, -15, 7.6, 2.2, '#7fe070');
  const b = AP * 3;
  bl([-17, -14 - b, -16, -26 - b, 0, -35 - b * 1.6, 16, -26 - b, 17, -14 - b, 8, -11 - b, 0, -13 - b, -8, -11 - b], cap);
  dot(-8, -22 - b, 3.4, 2.8, '#fff'); dot(5, -27 - b, 4, 3, '#fff'); dot(11.5, -18.6 - b, 2.3, 1.9, '#fff'); dot(-1.5, -17.4 - b, 1.8, 1.4, '#fff');
  eye(-3.2, -8.4); eye(3.6, -8.4); smile(.2, -5.4, 1.7);
  blush(-5.8, -5.4); blush(6.2, -5.4);
  for (let i = 0; i < 3; i++) { const k = (T * .5 + i / 3) % 1; dot(-12 + i * 12 + Math.sin(T * 2 + i * 2) * 2, -30 - k * 12, 1.2, 1.2, 'rgba(190,255,160,' + (1 - k) + ')'); }
};

// ===== SPARK =====
CREATURE_ART.ohmadillo = function () {         // battery-plated armadillo
  INK = '#4a3a10';
  const sh = '#ffd23d', sk = '#f8e8c8';
  pg([-14, -6, -23, -3 + TW, -13, -2], sk);
  feet(-7, 6, -1.8, 4, 2.6, sk);
  bl([7, -5, 9, -17, 19, -14, 25, -8.5, 16, -4], sk);
  el(9.5, -19, 2.6, 4.2, sk, .3); dot(9.6, -19, 1.1, 2.6, '#f4b7a0', .3);
  eye(16.5, -11.6, .95); dot(24.2, -8.6, 1.3, 1.1, INK); smile(20, -6.6, 1.4);
  bl([-16, -3, -17, -18, -5, -28, 9, -23, 14, -11, 10, -3], sh);
  ln([-11, -23, -12.5, -4], '#d99a14', 1.6); ln([-4.5, -26.5, -6, -3.6], '#d99a14', 1.6); ln([2.5, -25, 1.5, -3.6], '#d99a14', 1.6); ln([8.6, -20.5, 8, -4], '#d99a14', 1.6);
  ln([-9.5, -15, -7, -15], '#4a3a10', 1.4); ln([-8.25, -16.3, -8.25, -13.7], '#4a3a10', 1.4);
  ln([4, -14.5, 6.6, -14.5], '#4a3a10', 1.4);
  shine(-8, -23, 5, 1.6, -.5);
  if (AP > .05) bolt(-2, -31 - AP * 3, .7 + AP * .4, .3, '#fff7b0', 1.2);
};

CREATURE_ART.zapcoon = function () {           // storm-grey raccoon with a charged ringed tail
  INK = '#252a40';
  const bd = '#8f9ab6', dk = '#3b425e', cr = '#f6f2e8', yl = '#ffd23d';
  c.save(); c.translate(-8, -7); c.rotate(TW * .1 - AP * 1.5);
  bl([0, 2, -13, -1, -18, -15, -11, -24, -3, -17, 2, -6], bd);
  c.save(); c.clip();
  ln([-16, -4, -4, -1], yl, 3); ln([-19, -12, -3, -9], yl, 3); ln([-17, -20, -4, -17], yl, 3);
  c.restore();
  bl([0, 2, -13, -1, -18, -15, -11, -24, -3, -17, 2, -6], null);
  if (AP > .2) bolt(-14, -27, .8 * AP, .4, '#fff7b0', 1.2);
  c.restore();
  feet(-6, 6, -2, 4.8, 3, dk);
  bl([-11, -4, -12, -17, 0, -22, 11, -17, 10, -4, 0, -1], bd);
  dot(1, -9, 5.6, 5, cr);
  bolt(1, -9.4, .62, .15, yl, 1);
  el(-6, -34.4, 3.8, 3.8, bd); el(11.4, -35, 3.8, 3.8, bd);
  dot(-6, -34.2, 1.8, 1.8, dk); dot(11.4, -34.8, 1.8, 1.8, dk);
  el(3, -26.5, 10.6, 9.2, bd);
  bl([-6.6, -28, -3, -31, 4, -29, 11, -31.5, 13.4, -28, 9, -24.6, 3, -26, -3, -24.4], dk, 0);
  eye(-1.6, -27.6, .95, yl); eye(8.4, -28.2, .95, yl);
  dot(5, -22.6, 4.4, 3, cr); dot(6.8, -23.8, 1.5, 1.1, INK);
  ln([3.6, -21.2, 6, -20.2, 8.6, -21.4], INK, 1.3);
  blush(-4.6, -22.2);
  el(12, -12 - AP * 2, 3.3, 3.1, dk); el(-11, -11, 3.3, 3.1, dk);
};

CREATURE_ART.dynafly = function () {           // lightning dragonfly
  INK = '#3a3a10';
  const bd = '#ffe14a', ey = '#3de0c8';
  const y = -19 + W * 1.5, fl = Math.sin(T * 38);
  c.globalAlpha *= .7;
  el(-3, y - 5, 12, 3.2, '#d6f6ff', -.5 + fl * .35, 1.2); el(1, y - 5, 12, 3.2, '#d6f6ff', -1.2 + fl * .3, 1.2);
  el(-4, y + 2, 10, 2.8, '#eafcff', .35 - fl * .3, 1.2);
  c.globalAlpha /= .7;
  cv([-3, y, -13, y + 2.5, -24, y - 2 + TW * 2], bd, 3.6);
  for (let i = 0; i < 4; i++) ln([-8 - i * 4, y - .6 + i * .2, -8.4 - i * 4, y + 3.4 - i * .5], '#3ab8a8', 1.5);
  bolt(-26, y - 3 + TW * 2, .6, 1.2, '#fff7b0', 1.2);
  el(0, y, 5.6, 5.1, bd);
  el(7, y - 2, 6.2, 5.6, bd);
  if (BK) { ln([3, y - 3, 6, y - 2.4], INK, 1.4); ln([8.6, y - 3.6, 11.6, y - 3], INK, 1.4); }
  else { el(4.6, y - 3, 3.2, 3.6, ey, 0, 1.2); dot(3.8, y - 4.2, 1, 1.2, '#fff'); el(10.4, y - 3.6, 3, 3.4, ey, 0, 1.2); dot(9.6, y - 4.8, 1, 1.2, '#fff'); }
  smile(8.4, y + 1.2, 1.5);
};

CREATURE_ART.teslowl = function () {           // owl with tesla-coil tufts
  INK = '#4a2f0a';
  const bd = '#ffcf3d', wg = '#c98a1e', cr = '#fff6dc';
  dot(-4, -1.2, 3.2, 1.8, '#ff9a2e'); dot(5, -1.2, 3.2, 1.8, '#ff9a2e');
  const coil = (x, d) => {
    cv([x, -29, x + d * 1.5, -38], '#9aa3b8', 1.6);
    for (let i = 0; i < 3; i++) el(x + d * (.4 + i * .45), -31.5 - i * 2.6, 3 - i * .5, 1.1, '#c9d0e0', 0, 1);
    glow(x + d * 1.7, -40, 5 + AP * 6, '#7af0ff', .5 + AP * .4);
    el(x + d * 1.7, -40, 2.3, 2.3, '#bff8ff', 0, 1.2);
  };
  coil(-8, -1); coil(9, 1);
  bl([-13, -3, -14.5, -20, -8, -31, 8, -31, 14.5, -20, 13, -3, 0, 0], bd);
  dot(0, -9, 7.5, 6.5, cr);
  ln([-3, -10, 0, -8.4, 3, -10], wg, 1.2); ln([-3, -6.4, 0, -4.8, 3, -6.4], wg, 1.2);
  bl([-13, -8, -16 - AP * 5, -17 - AP * 6, -12, -22, -9, -12], wg); bl([13, -8, 16 + AP * 5, -17 - AP * 6, 12, -22, 9, -12], wg);
  if (BK) { el(-5.4, -21, 6, 6, cr); el(6, -21, 6, 6, cr); ln([-8.4, -21, -2.4, -21], INK, 1.5); ln([3, -21, 9, -21], INK, 1.5); }
  else { el(-5.4, -21, 6, 6, '#fff'); el(6, -21, 6, 6, '#fff'); dot(-4.6, -21, 3, 3.3, '#17121f'); dot(6.8, -21, 3, 3.3, '#17121f'); dot(-5.8, -22.4, 1.2, 1.2, '#fff'); dot(5.6, -22.4, 1.2, 1.2, '#fff'); }
  pg([-1.4, -18, 2, -18, .3, -14.4], '#ff9a2e', 1.2);
};

CREATURE_ART.nimbolt = function () {           // grumpy little thundercloud
  INK = '#3a4a6a';
  const y = -17 + W * 1.8;
  bolt(-1, y + 9 + AP * 3, 1.25, .1, '#ffe14a', 1.4);
  puff([-9, y, 7, 0, y - 4, 9, 9, y, 7, -4, y + 3, 6, 5, y + 3, 6, -1, y - 9, 6], AP > .1 ? '#dfe6f7' : '#f6f8ff');
  dot(-3, y + 5.6, 8, 2.2, 'rgba(160,178,220,.5)');
  eye(-4, y - 2); eye(5, y - 2);
  brow(-4.4, y - 6.6, 1); brow(5.4, y - 6.6, -1);
  if (AP > .1) openMouth(.5, y + 2.6, 1.8, 1.4 + AP); else ln([-1, y + 2.6, .5, y + 2, 2, y + 2.6], INK, 1.3);
  blush(-8.4, y + 1.6); blush(9.4, y + 1.6);
  shine(-7, y - 7, 3, 1.6, -.4, .8);
};

// ===== STONE =====
CREATURE_ART.cobblem = function () {           // mossy boulder golem
  INK = '#3a3028';
  const rk = '#b89d7c', dk = '#95795a', gem = '#4de0d0';
  feet(-8, 8, -2.2, 5.6, 3.4, dk);
  const lift = AT > 0 ? (AT < .5 ? Ease.seg(AT, 0, .45) * 7 : (1 - Ease.seg(AT, .5, .6)) * 7) : 0;
  el(-16, -12 - lift, 5, 5.4, dk); el(16, -12 - lift, 5, 5.4, dk);
  pg([-14, -4, -16, -16, -9, -28, 6, -30, 15, -20, 14, -5, 0, -1], rk);
  pg([-9, -28, 6, -30, 9, -24, -6, -22], '#cdb393', 0);
  ln([-16, -16, -6, -22, 9, -24, 15, -20], dk, 1.2); ln([-6, -22, -8, -8], dk, 1.2);
  puff([-6, -30, 3.4, -1, -32, 4, 4, -31, 3], '#6fc45a');
  if (BK) { ln([-6, -16, -1.5, -16], INK, 1.5); ln([4.5, -16.5, 9, -16.5], INK, 1.5); }
  else { diamond(-3.8, -16, 2.8, 3.4, gem, 1.3); diamond(6.8, -16.6, 2.8, 3.4, gem, 1.3); dot(-4.6, -17.2, .9, .9, '#fff'); dot(6, -17.8, .9, .9, '#fff'); }
  ln([-1.5, -10, .5, -8.8, 2.5, -10, 4.5, -8.8], INK, 1.4);
  diamond(1.5, -4.6, 2.3, 1.9, gem, 1.1);
};

CREATURE_ART.quarrilla = function () {         // baby gorilla with rock fists
  INK = '#2e2620';
  const fur = '#8a7868', fc = '#f2d6b0', rk = '#c4ae90';
  feet(-6, 6, -2, 4.6, 3, fur);
  bl([-12, -3, -14, -18, -6, -28, 8, -27, 13, -16, 10, -3, 0, -1], fur);
  dot(1, -10.4, 6.6, 5.6, '#a39080');
  el(-5.6, -30, 2.8, 3.2, fc); el(13.6, -30.6, 2.6, 3, fc);
  el(4, -28, 10, 9.4, fur);
  bl([-3, -26, -2.4, -32, 4.5, -33.4, 11.4, -32, 12.4, -26, 9, -20.6, 0, -20.6], fc, 1.4);
  ln([-2, -32, 4.5, -32.8, 11, -32], INK, 1.8);
  eye(1.2, -28, 1); eye(8.6, -28.4, 1);
  dot(3.8, -24.2, .75, .75, INK); dot(6.2, -24.3, .75, .75, INK);
  smile(5, -22.4, 2.4); blush(-1, -24); blush(10.6, -24.4);
  ln([2, -37.4, 4, -39.6, 6, -37.4], INK, 1.3);
  const up = AT > 0 ? Ease.seg(AT, .3, .5) - Ease.seg(AT, .7, 1) : 0, dr = AT > 0 && AT < .3 ? Math.sin(AT / .3 * PI * 3) : 0;
  const fx1 = -14 + dr * 3, fy1 = -7 - Math.abs(dr) * 3, fx2 = 15 + up * 3 - dr * 3, fy2 = -7 - up * 20 - Math.abs(dr) * 3;
  cv([-10, -20, -15, -15, fx1, fy1 - 3], fur, 4.2); cv([10, -19, 15, -14 - up * 6, fx2, fy2 - 3], fur, 4.2);
  pg([fx1 - 5, fy1 - 3, fx1 - 1, fy1 - 6, fx1 + 5, fy1 - 3, fx1 + 4, fy1 + 3.6, fx1 - 4, fy1 + 4], rk);
  pg([fx2 - 5, fy2 - 3, fx2 - 1, fy2 - 6, fx2 + 5, fy2 - 3, fx2 + 4, fy2 + 3.6, fx2 - 4, fy2 + 4], rk);
  ln([fx2 - 2, fy2 - 3, fx2, fy2 + 1], '#95795a', 1.1); ln([fx1 - 2, fy1 - 3, fx1, fy1 + 1], '#95795a', 1.1);
};

CREATURE_ART.jerboing = function () {          // big-eared desert jerboa
  INK = '#5a3d1e';
  const bd = '#f2cc8e', cr = '#fff5e0', pk = '#ffb9b0';
  cv([-8, -8, -20, -11, -24, -25 + TW * 2.5], bd, 1.8); el(-24, -27 + TW * 2.5, 3, 3.6, '#7a5230');
  el(5, -1.6 - Math.max(0, ST) * 3, 7.6, 2.6, bd); el(-3, -1.6 - Math.max(0, -ST) * 3, 6.6, 2.4, bd);
  el(0, -12, 10.4, 10.2, bd);
  dot(2, -8.6, 5.6, 5, cr);
  const e = TW * .08;
  c.save(); c.translate(-4, -20); c.rotate(-.12 + e); bl([-3, 0, -6, -19, 2, -21, 4, -1], bd); dot(-1, -11, 2, 6.6, pk, -.08); c.restore();
  c.save(); c.translate(5, -21); c.rotate(.2 - e); bl([-3, 0, -2, -20, 6, -19, 4, -1], bd); dot(1.6, -11, 2, 6.6, pk, .08); c.restore();
  eye(-.6, -15, 1.15); eye(8, -15.6, 1.15);
  dot(5, -11.4, 1.3, 1, '#ff8a8a'); smile(5, -10, 1.3);
  ln([8, -10.6, 13.5, -11.6], '#b08a5a', .8); ln([8, -9.6, 13.5, -8.6], '#b08a5a', .8);
  blush(-4.4, -10.6);
  cv([7, -7.6, 10.5, -6 - AP * 3], bd, 1.6);
};

CREATURE_ART.glintgecko = function () {        // gecko with a crystal back
  INK = '#4a3220';
  const bd = '#dcae6e', cr = '#fff0d2';
  cv([-10, -6.6, -20, -5, -23, -13, -17, -16 + TW], bd, 4);
  const toes = (x, y) => { dot(x - 2.6, y, 1.6, 1.6, cr); dot(x, y + .8, 1.6, 1.6, cr); dot(x + 2.6, y, 1.6, 1.6, cr); };
  cv([-7, -5, -10, -1.6 - Math.max(0, ST) * 2], bd, 2.6); cv([7, -5, 10, -1.6 - Math.max(0, -ST) * 2], bd, 2.6);
  toes(-10.5, -1 - Math.max(0, ST) * 2); toes(10.5, -1 - Math.max(0, -ST) * 2);
  bl([-12, -4, -12, -12, 0, -15, 10, -13, 12, -6, 4, -3], bd);
  dot(1, -5.4, 7.4, 2.2, cr);
  const g = AP * 3;
  pg([-10, -12, -8, -22 - g, -4, -13], '#7aecff'); pg([-5, -14, -1, -27 - g, 3, -14], '#ff9ad8'); pg([2, -14, 6, -22 - g, 8, -13], '#b6a0ff');
  ln([-8, -20 - g, -7, -14], '#fff', 1); ln([-1, -24 - g, -.4, -16], '#fff', 1);
  if (AP > .2) star(-1, -30 - g, 3 * AP, '#fff', 4, T * 3, 0);
  el(12, -14, 8.2, 7.2, bd);
  eye(9, -16, 1.05, '#35c8e0'); eye(16, -16.6, 1.05, '#35c8e0');
  ln([8, -10.6, 12.6, -9, 18, -11.4], INK, 1.3);
  dot(18.6, -14, .6, .6, INK);
};

CREATURE_ART.ankhat = function () {            // little sphinx cat in lapis and gold
  INK = '#3a2a12';
  const fur = '#eabb70', lap = '#2a4fc0', gd = '#ffd34a', tq = '#3de0d0';
  cv([-8, -4, -18, -5, -19, -15 + TW * 2, -14, -17 + TW * 2], fur, 2.8); ln([-19.6, -11 + TW, -17, -11.6 + TW], gd, 2.2);
  bl([-9, -2, -10, -16, 0, -21, 10, -16, 10, -2, 0, 0], fur);
  dot(-4, -1.8, 3.6, 2, '#f6d9a0'); dot(5, -1.8, 3.6, 2, '#f6d9a0');
  // headdress flaps
  pg([-8, -34, -14, -15, -6, -16, -4, -28], lap); pg([11, -34, 16, -15, 8, -16, 8, -28], lap);
  ln([-10.6, -27, -5.2, -26], gd, 1.5); ln([-12, -21.6, -6, -21], gd, 1.5); ln([9, -26, 13.2, -27], gd, 1.5); ln([8.6, -21, 14.6, -21.6], gd, 1.5);
  bl([-7, -15.6, 0, -13, 9, -15.6, 9, -18.6, 0, -16.4, -7, -18.6], gd, 1.4);
  diamond(1, -15.4, 2, 2.3, tq, 1.1);
  pg([-7, -32, -8, -41, -1, -35], fur); pg([7, -35, 12, -41, 11, -32], fur);
  dot(-5.6, -36, 1.2, 2, '#f4b7a0', -.3); dot(9.6, -36.6, 1.2, 2, '#f4b7a0', .3);
  el(2, -27, 9.6, 8.6, fur);
  bl([-7.4, -30, -5, -35.4, 2, -36.4, 9, -35.4, 11.4, -30, 2, -32.4], lap, 1.4);
  ln([-6.6, -31.4, 2, -33.8, 10.6, -31.4], gd, 1.6);
  diamond(2, -35.4, 1.8, 2.4, AP > .1 ? '#fff' : tq, 1.1);
  if (AP > .1) glow(2, -35.4, 4 + AP * 8, '#ffe27a', .8 * AP);
  eye(-1.6, -27, 1, '#18b8a8'); eye(6.8, -27.4, 1, '#18b8a8');
  ln([-5, -27.4, -8, -28.8], INK, 1.3); ln([10, -28, 12.6, -29.6], INK, 1.3);
  pg([1.6, -23.6, 4, -23.6, 2.8, -22.2], '#c2562a', .9);
  smile(1.4, -21.4, 1.3); smile(4.2, -21.5, 1.3);
};
