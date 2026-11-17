'use strict';
// ---------- creature art, part A: Fire, Water, Leaf, Spark, Stone ----------
// See art.js for the pen helpers. Origin = feet, y up is negative, facing right.
// Each creature acts out its own move: WD is the wind-up, SK the strike (see art.js), and
// mark(x, y) tells the effects where the move leaves the body (mouth, fist, horn tip...).

// ===== FIRE =====
CREATURE_ART.furnox = function () {            // ember ox calf. Furnace Ram: paws the ground, drops its horns, drives forward
  INK = '#5a2318';
  const bd = '#ea5a3c', bel = '#ffc48f', hn = '#fff3da', dk = '#47323c';
  const paw = WD > 0 ? Math.sin(AT * 70) * WD : 0, hot = Math.max(WD, SK);
  cv([-15, -17, -22, -20 + TW - SK * 6, -24, -11 + TW * 2 - SK * 11], bd, 2.6); dot(-24, -10 + TW * 2 - SK * 11, 3.2, 3.6, dk);
  el(-9, -2.5 - Math.max(0, ST) * 3, 5, 3.6, dk);
  el(7 - paw * 3, -2.5 - Math.max(0, -ST) * 3 - Math.max(0, paw) * 2.5, 5, 3.6, dk);
  J(0, -3, -WD * .09 + SK * .1);
  bl([-18, -13, -17, -27, -4, -32, 10, -30, 17, -20, 15, -6, 0, -3, -13, -4], bd);
  dot(-2, -8.5, 9, 4.2, bel);
  const lava = hot > .25 ? '#fff3a8' : '#ffd84a';
  ln([-13, -24, -9, -20, -11, -16], lava, 1.8 + hot * .8); ln([-5, -28, -2, -24, -4, -20], lava, 1.8 + hot * .8);
  J(4, -17, WD * .45 + SK * .3, SK * 5 - WD * 2.5, WD * 1.5 + SK * 2);   // horns down to aim, and still down as it drives through
  pg([3, -30, 0, -41, 9, -33], hn); pg([16, -29, 23, -38, 20, -27], hn);
  el(11, -21, 11, 10, bd);
  el(-1, -25, 3.2, 2.1, bd, -.6 - SK * .5);
  el(16, -15.5, 7, 5, bel);
  dot(13.6, -15.2, 1 + WD * .4, 1.3 + WD * .4, INK); dot(18.8, -15.6, 1 + WD * .4, 1.3 + WD * .4, INK);
  eye(7.5, -22.5); eye(16.5, -23.5);
  if (hot > .1) { brow(7.5, -27, 1); brow(16.5, -28, -1); }
  if (WD > .25) { dot(22 + WD * 5, -15.5, 1.5 + WD * 2.3, 1.5 + WD * 2.3, 'rgba(255,255,255,.75)'); dot(25 + WD * 8, -18.5, 1 + WD * 1.8, 1 + WD * 1.8, 'rgba(255,255,255,.5)'); }
  mark(21, -37);
  U();
  shine(-6, -27.5, 5, 1.8, -.2);
  U();
};

CREATURE_ART.blazaroo = function () {          // boxing kangaroo. Blaze Jabs: a lead jab, then a cross with its whole body behind it
  INK = '#5c2a12';
  const bd = '#f49a4c', bel = '#ffe6b8';
  const w1 = BW[0], j1 = BS[0], w2 = BW[1], j2 = BS[1], gd = AT > 0 ? Math.min(1, AT * 10, (1 - AT) * 7) : 0;   // gd: fists up in guard
  const fx1 = lerp(-9, 4, gd) - w2 * 7 + j2 * 22, fy1 = lerp(-15, -20, gd) + w2 * 1.5 + j2 * 1.5;   // rear fist
  const fx2 = lerp(13, 12, gd) - w1 * 5 + j1 * 14, fy2 = lerp(-17, -21, gd) - w1 + j1;             // lead fist
  const fist = (x, y, ph) => { flame(x, y - 3, 3.4, 8, ph, '#ff5a2a', '#ffd23d'); el(x, y, 4.6, 4.3, '#ff5a3a'); shine(x - 1.2, y - 1.6, 1.6, 1); };
  cv([-7, -7, -17, -3 - j2 * 2, -23, -11 + TW * 1.5 - j2 * 5], bd, 4.6);
  el(-3, -2 - Math.max(0, ST) * 3, 7, 3, bd); el(8 + j2 * 3, -2 - Math.max(0, -ST) * 3, 7, 3, bd);
  J(0, -4, -w2 * .1 + j2 * .15 - w1 * .03 + j1 * .05);
  if (j2 < .3) { cv([-6, -21, (fx1 - 6) / 2 - 3, (fy1 - 21) / 2 + 3, fx1, fy1], bd, 3); fist(fx1, fy1, 1); }
  bl([-10, -5, -12, -19, -4, -29, 6, -29, 11, -19, 10, -5, 0, -2], bd);
  dot(2, -11.5, 6, 7, bel); ln([-2, -9.5, 2, -8, 6, -9.5], '#d98a4a', 1.2);
  J(4, -27, -j2 * .06, j1 * 1.5 + j2 * 2.5, 0);
  const sw = (j1 + j2) * 3.5;
  bl([-3, -35, -7 - sw, -48 + sw * .5, 1 - sw, -40], bd); bl([6, -36, 8 - sw, -49 + sw * .5, 12 - sw, -39], bd);
  dot(-3.2 - sw * .6, -41, 1.2, 3.4, '#ffb0a0', -.25 - sw * .08); dot(8.6 - sw * .6, -42, 1.2, 3.4, '#ffb0a0', .1 - sw * .08);
  el(4, -31, 9, 8, bd);
  el(9.5, -28, 5, 3.6, bel); dot(12.6, -29.4, 1.3, 1, INK);
  eye(2, -32.5); eye(9, -33.5);
  if (gd > .5) { brow(2, -36.6, 1, .9); brow(9, -37.4, -1, .9); ln([8, -26.4, 11, -26.2], INK, 1.3); } else smile(9.5, -26.6, 1.8);
  U();
  if (j2 >= .3) { cv([3, -21, (fx1 + 3) / 2, fy1 - 2, fx1, fy1], bd, 3); if (BI === 1) streak(fx1 - 15, fy1, fx1 - 2, fy1, 8, '#ffe27a'); fist(fx1, fy1, 1); }
  cv([6, -21, (fx2 + 6) / 2, fy2 + 3, fx2, fy2], bd, 3);
  if (BI === 0) streak(fx2 - 12, fy2, fx2 - 2, fy2, 7, '#ffe27a');
  fist(fx2, fy2, 2);
  mark(BI === 1 ? fx1 + 4 : fx2 + 4, BI === 1 ? fy1 : fy2);
  U();
};

CREATURE_ART.flarret = function () {           // comet-tailed ferret. Comet Dash: coils, then streaks flat-out
  INK = '#5a2a14';
  const bd = '#ff8a3c', cr = '#fff0cf', mk = '#7a3a1e';
  const co = AT > 0 && AT < .12 ? Ease.outCubic(AT / .12) : 0, ds = AT > 0 ? Ease.hump(Ease.seg(AT, .12, .5)) : 0, cl = 1 - ds;
  const tl = 1 + ds * .5, tu = co * 6;
  bl([-11, -11, -22 * tl, -18 + TW * 2 * cl - tu, -33 * tl, -9 + TW * 3 * cl - tu * .5 - ds * 2, -21 * tl, -5 - ds * 2, -11, -5], '#ffb52e');
  bl([-13, -9.5, -21 * tl, -13 + TW * 2 * cl - tu, -28 * tl, -9 + TW * 2.5 * cl - ds * 2, -20 * tl, -7 - ds * 2], '#fff1a0', 0);
  el(-8 - ds * 7 + co * 3, -2 - Math.max(0, ST) * 3 - ds * 4, 3.6 + ds, 2.6, mk);
  el(8 + ds * 8 - co * 3, -2 - Math.max(0, -ST) * 3 - ds * 5, 3.6 + ds, 2.6, mk);
  Z(0, -4, 1 + co * .06, 1 - co * .18);
  bl([-14, -5, -14, -14, -4, -18, 8, -16, 12, -8, 8, -4], bd);
  dot(0, -6.5, 8, 2.8, cr);
  J(12, -12, co * .25 - ds * .12, ds * 2.5, co * 2 + ds * 2.5);
  el(7 - ds * 2.5, -22.5 + ds * 2.5, 2.7, 3.1 - ds * .8, bd, -ds * .7); el(16 - ds * 2.5, -23 + ds * 2.5, 2.7, 3.1 - ds * .8, bd, -ds * .7);
  el(12, -15, 8.2, 7.2, bd);
  dot(12.6, -16, 6.6, 3.1, mk);
  eye(9, -16, .95, '#ffb52e'); eye(16, -16.5, .95, '#ffb52e');
  if (ds > .2 || co > .2) { brow(9, -19.6, 1, .8); brow(16, -20, -1, .8); }
  dot(17.5, -11.6, 3.3, 2.4, cr); dot(19.8, -12.4, 1.1, .9, INK);
  smile(17, -10.4, 1.4);
  mark(19, -12);
  U(); U();
};

CREATURE_ART.solcub = function () {            // sun-maned cub. Solar Flare: draws a deep breath, then roars a beam of sunlight
  INK = '#6a3a10';
  const bd = '#ffcb4f', cr = '#fff3d0', ray = '#ff8a2a';
  cv([-9, -6, -19, -7 - SK * 3, -20, -18 + TW * 2 - SK * 4], bd, 2.6);
  star(-20, -20 + TW * 2 - SK * 4, 4.4 + SK * 1.5, ray, 8, T);
  feet(-6, 6, -2, 4.6, 3, bd);
  bl([-11, -4, -12 - WD, -16, 0, -21 - WD, 11 + WD, -16, 10, -4, 0, -2], bd);
  dot(1, -8, 5.5 + WD * 1.6, 4.5 + WD * 1.2, cr);
  J(2, -17, -WD * .3 + SK * .18, -WD * 2 + SK * 3.5, SK);
  const cx = 3, cy = -25, n = 11;
  for (let i = 0; i < n; i++) {
    const an = i / n * TAU + T * .7, r2 = 16.5 - WD * 3.5 + SK * 7.5 + Math.sin(T * 4 + i) * .8;
    pg([cx + Math.cos(an - .27) * 10, cy + Math.sin(an - .27) * 9.5, cx + Math.cos(an) * r2, cy + Math.sin(an) * r2 * .95, cx + Math.cos(an + .27) * 10, cy + Math.sin(an + .27) * 9.5], i % 2 ? ray : (SK > .4 ? '#ffe27a' : '#ffb52e'));
  }
  el(-5, -33.5, 3.2, 3.2, bd); el(10.5, -34, 3.2, 3.2, bd);
  el(cx, cy, 10.6, 9.6, bd);
  if (SK > .12) {
    dot(6, -21.4, 5.2, 4.2, cr); pg([5, -25.4, 8.2, -25.6, 6.6, -23.8], '#c2562a', 1);
    openMouth(6.8, -20.4, 3.2 + SK, 2 + SK * 2.4);
    pg([4.6, -22, 5.3, -20.4, 6, -22], '#fff', .6); pg([7.8, -22, 8.5, -20.4, 9.2, -22], '#fff', .6);
  } else {
    dot(6, -22, 4.8 + WD * .8, 3.3 + WD * .6, cr);
    pg([5, -24.4, 8.2, -24.6, 6.6, -22.6], '#c2562a', 1);
    ln([6.6, -22.6, 6.6, -21.2], INK, 1.1); smile(4.9, -21.2, 1.6); smile(8.3, -21.3, 1.6);
  }
  eyes(-.5, -26.5, 9, -27.2, 1, undefined, WD > .5);
  if (SK > .2) { brow(-.5, -30.6, 1); brow(9, -31.2, -1); }
  blush(-3.5, -22.5, 1 + WD * .5);
  mark(11.5, -20.4);
  U();
};

CREATURE_ART.campyre = function () {           // living campfire. Bonfire Ring: gathers itself small, then throws its arms up and blazes
  INK = '#5a2a14';
  el(-6, -3.2, 10.5, 3.7, '#8a5a3a', .28); el(6, -3.2, 10.5, 3.7, '#a87044', -.28);
  dot(-14.5, -5.8, 2.2, 2.9, '#e8c79a', .28); dot(14.5, -5.8, 2.2, 2.9, '#f0d2a6', -.28);
  const s = Math.sin(T * 8) * 2, s2 = Math.sin(T * 11) * 1.4, g = -WD * 5 + SK * 9, wdt = 1 + WD * .1 - SK * .06;
  bl([-12 * wdt, -6, -14 * wdt, -20, -6 + s2, -27 - g * .5, 0 + s, -39 - g, 6 + s2, -27 - g * .5, 14 * wdt, -20, 12 * wdt, -6, 0, -2], '#ff6a2a');
  bl([-8 * wdt, -6, -9 * wdt, -17, 0 + s * .5, -29 - g * .6, 9 * wdt, -17, 8 * wdt, -6, 0, -3], '#ffb52e', 0);
  dot(0, -8, 5.5, 4, SK > .3 ? '#ffffff' : '#fff3a8');
  eyes(-4, -14.5, 4.4, -14.5, 1, undefined, WD > .45);
  if (SK > .15) openMouth(.2, -9.4, 2.6, 2 + SK * 1.8); else smile(.2, -10.4, 1.9);
  blush(-7.6, -11.4); blush(8, -11.4);
  const ax = 17 - WD * 4 + SK * 1.5, ay = -15 + WD * 7 - SK * 12;
  cv([-11, -12, -ax, ay], '#8a5a3a', 1.6); cv([11, -12, ax, ay], '#8a5a3a', 1.6);
  ln([-ax, ay, -ax - 2, ay - 2.5], '#8a5a3a', 1.2); ln([ax, ay, ax + 2, ay - 2.5], '#8a5a3a', 1.2);
  for (let i = 0; i < 3; i++) { const k = (T * (.7 + SK) + i / 3) % 1; dot(-9 + i * 9 + Math.sin(T * 3 + i) * 2, -30 - g - k * 14, 1.2 * (1 - k), 1.2 * (1 - k), '#ffe27a'); }
  mark(0, -32 - g);
};

// ===== WATER =====
CREATURE_ART.walrump = function () {           // chubby walrus. Tidal Flop: heaves itself up and belly-flops
  INK = '#1f3a5c';
  const bd = '#74b6ea', bel = '#dcf1ff', mz = '#ffeedd';
  bl([-15, -7, -24, -12 + TW * 1.5 - SK * 5, -27, -4 + TW - SK * 6, -18, -2], '#5a9fd6');
  bl([-18, -4, -18, -20, -6, -29, 8, -29, 18, -20, 18, -6, 6, -2, -10, -2], bd);
  dot(1, -7.5, 11, 4.6, bel);
  bl([6, -7, 15, -5 - WD * 9 + SK * 3, 22 + SK * 3, -1.5 - WD * 12 + SK, 11, -1], '#5a9fd6');
  J(8, -13, -WD * .14 + SK * .1);
  el(8, -21, 11.6, 10.6, bd);
  el(11, -15.6, 7.6 + SK * .6, 5.4 + SK * .5, mz);
  dot(8, -15, .7, .7, '#c9a58f'); dot(10, -13.3, .7, .7, '#c9a58f'); dot(14, -13.3, .7, .7, '#c9a58f'); dot(16, -15, .7, .7, '#c9a58f');
  dot(11.4, -19.6, 2.1, 1.5, INK);
  pg([7.6, -12.6, 7, -4.5, 10.6, -11.6], '#fff'); pg([13.6, -11.6, 15.4, -4.5, 17, -12.6], '#fff');
  eyes(4.2, -24.4, 15.2, -25, 1, undefined, SK > .45);
  blush(1, -20);
  U();
  shine(-8, -24, 5, 2, -.5);
  mark(10, -3);
};

CREATURE_ART.snipclaw = function () {          // teal crab. Bubble Clamp: the big claw yawns wide, shoots out and snaps shut
  INK = '#14485a';
  const bd = '#3fbccb', lt = '#9eeaf0', co = '#ff8a5c';
  for (let i = 0; i < 3; i++) {
    const k = Math.sin(T * 12 + i * 2) * MV;
    cv([-9 - i * 2, -6, -15 - i * 2, -6 - k, -17 - i * 2, -1], bd, 1.8);
    cv([7 + i * 2, -6, 13 + i * 2, -6 + k, 15 + i * 2, -1], bd, 1.8);
  }
  cv([-10, -13, -16, -16 - WD * 3, -18, -13 - WD * 4], bd, 2.4); el(-18.5, -12 - WD * 4, 4.2, 3.8, bd); ln([-21.5, -12 - WD * 4, -17, -12.6 - WD * 4], INK, 1.2);
  J(0, -8, -WD * .1 + SK * .1);
  bl([-14, -4, -15, -14, -8, -19, 8, -19, 15, -14, 14, -4, 0, -1], bd);
  dot(0, -5.6, 9, 2.6, lt);
  const lx = SK * 2.2 - WD * 1.2;
  cv([-5, -18, -6 + lx, -25 + W * .6], bd, 2.2); cv([5, -18, 6 + lx, -25 - W * .6], bd, 2.2);
  if (BK) { el(-6 + lx, -27, 3.6, 3.6, bd); el(6 + lx, -27, 3.6, 3.6, bd); ln([-8 + lx, -27, -4 + lx, -27], INK, 1.4); ln([4 + lx, -27, 8 + lx, -27], INK, 1.4); }
  else { el(-6 + lx, -27 + W * .6, 3.7, 3.7, '#fff'); dot(-5.3 + lx + SK, -26.6 + W * .6, 1.7, 2, '#17121f'); el(6 + lx, -27 - W * .6, 3.7, 3.7, '#fff'); dot(6.7 + lx + SK, -26.6 - W * .6, 1.7, 2, '#17121f'); }
  if (SK > .3) openMouth(0, -10, 2.6, 1.8); else smile(0, -10.5, 3);
  blush(-8, -10.5); blush(8, -10.5);
  U();
  const open = AT > 0 ? .25 + WD * .85 - SK * .25 : .25 + W * .05;
  const kx = 17 - WD * 5 + SK * 10, ky = -16 - WD * 5 + SK * 4;
  cv([11, -12, 14 - WD * 2 + SK * 3, -15 - WD * 3, kx - 2, ky + 1], bd, 3);
  streak(kx - 13, ky - 4, kx + 2, ky, 10, '#eaffff');
  c.save(); c.translate(kx, ky);
  c.save(); c.rotate(-open * .75); bl([-3, 0, -2, -8, 8, -9, 14, -3, 6, -1], bd); pg([10, -6.6, 14, -3, 9.5, -2.6], co, 1.2); c.restore();
  c.save(); c.rotate(open * .55); bl([-3, -1, -2, 5, 6, 6, 12, 2, 5, 0], bd); c.restore();
  c.restore();
  mark(kx + 10, ky - 1);
};

CREATURE_ART.zipfin = function () {            // little sailfish. Jet Lance: coils back, then goes arrow-straight with its sail folded
  INK = '#143a6a';
  const bd = '#2f8fe8', bel = '#e8f6ff', sl = '#7ad6ff';
  const co = AT > 0 && AT < .14 ? Ease.outCubic(AT / .14) : 0, ds = AT > 0 ? Ease.hump(Ease.seg(AT, .14, .5)) : 0, cl = 1 - ds;
  const y = -15 + W * 1.6 * cl, fl = Math.sin(T * 40) * 2 * ds, sh = 1 - ds * .62;
  J(0, y, -co * .22);
  pg([-13, y, -25, y - 9 + TW * 2 * cl + fl + co * 3, -20, y, -25, y + 8 + TW * 2 * cl + fl - co * 3], bd);
  bl([-9, y - 5, -7 - ds * 3, y - 5 - 17 * sh, 4 - ds * 4, y - 5 - 14 * sh, 11, y - 6], sl);
  if (ds < .5) { ln([-5, y - 8, -4, y - 18], '#2f8fe8', 1.3); ln([0, y - 8, 1, y - 17], '#2f8fe8', 1.3); ln([5, y - 8, 5.5, y - 14], '#2f8fe8', 1.3); }
  pg([13, y - 3.4, 30, y - 1, 13, y + 1.2], '#dff3ff');
  bl([-16, y, -6, y - 8.5, 8, y - 7.5, 17, y - 2, 8, y + 5.5, -6, y + 5.5], bd);
  bl([-12, y + 2, 0, y + 1, 12, y + 1, 6, y + 4.6, -6, y + 4.8], bel, 0);
  pg([0, y + 2, -5 - ds * 6, y + 10 - ds * 5, 4, y + 4], sl);
  eye(9, y - 2.4, .95); if (ds > .2 || co > .2) brow(9, y - 5.8, -1, .8);
  smile(13.5, y + .8, 1.3);
  shine(-2, y - 5.4, 6, 1.4, 0);
  mark(29, y - 1);
  U();
};

CREATURE_ART.inkjet = function () {            // ink-squirting squid. Ink Burst: squeezes its mantle for each of three shots
  INK = '#141a44';
  const bd = '#5f7fff', lt = '#a9baff';
  const sq = BS[0] + BS[1] + BS[2], wn = BW[0] + BW[1] + BW[2];
  const y = -6 + W * 1.6;
  for (let i = 0; i < 5; i++) {
    const x = -8 + i * 4, k = Math.sin(T * 5 + i * 1.3) * 2.5;
    cv([x, y - 8, x + k * .5 - sq * 3, y - 2, x - k - sq * 6, y + 3 - sq * 2.5], lt, 2.2);
  }
  Z(0, y - 18, 1 - sq * .1 + wn * .08, 1 + sq * .07 - wn * .06);
  pg([-9, y - 27, -18, y - 24 + TW - sq * 3, -10, y - 18], lt); pg([9, y - 27, 18, y - 24 - TW - sq * 3, 10, y - 18], lt);
  bl([-10.5, y - 7, -11.5, y - 22, 0, y - 37, 11.5, y - 22, 10.5, y - 7, 0, y - 4], bd);
  dot(-4, y - 27, 1.6, 1.6, lt); dot(4.5, y - 29.5, 1.2, 1.2, lt); dot(1, y - 24, 1, 1, lt);
  eyes(-4.4, y - 13.5, 5, y - 13.5, 1.2, '#232f8a', sq > .55);
  if (wn + sq > .1) el(1.2 + sq * 1.6, y - 8, 1.6 + wn * 1.3 + sq * .7, 1.5 + wn * 1.1 + sq * .5, '#1c1f4d'); else dot(.3, y - 8.4, 1.3, 1, INK);
  blush(-8, y - 9.5); blush(8.6, y - 9.5);
  shine(-5, y - 30, 2.2, 4.5, .5);
  U();
  mark(4, y - 8);
};

CREATURE_ART.drizzelly = function () {         // dew-drop jellyfish. Bubble Bloom: its bell squeezes down and pulses the bubbles out
  INK = '#1d5a7a';
  const y = -15 + W * 2;
  for (let i = 0; i < 4; i++) {
    const x = -8 + i * 5.3 + (i - 1.5) * SK * 2.4, k = Math.sin(T * 4 + i * 1.7) * 3 * (1 + SK * 1.2);
    cv([x, y, x + k, y + 5, x - k, y + 10 - WD * 3, x + k * .5, y + 14 - WD * 5], i % 2 ? '#ffb6dc' : '#bfeeff', 1.9);
  }
  Z(0, y - 4, 1 + WD * .13 - SK * .08, 1 - WD * .17 + SK * .14);
  bl([-13.5, y, -14.5, y - 12, -4, y - 20, 0, y - 28 - SK * 4, 4, y - 20, 14.5, y - 12, 13.5, y, 7, y + 3, 0, y + .5, -7, y + 3], '#8fe0ff');
  bl([-10, y - 3, -10, y - 11, 0, y - 18, 10, y - 11, 10, y - 3, 0, y - 2], 'rgba(255,255,255,.28)', 0);
  eyes(-4.6, y - 8.5, 4.8, y - 8.5, 1, undefined, SK > .4);
  if (SK > .3) openMouth(.1, y - 4.8, 1.6, 1.4); else smile(.1, y - 5.2, 1.7);
  blush(-8.6, y - 5.2); blush(8.8, y - 5.2);
  shine(-6.5, y - 15, 2.2, 4, .7, .6);
  U();
  for (let i = 0; i < 2; i++) { const k = (T * .6 + i * .5) % 1; el(-12 + i * 25, y - 16 - k * 12, 1.8 * (1 - k * .5), 1.8 * (1 - k * .5), 'rgba(255,255,255,.35)', 0, 1); }
  mark(0, y - 31);
};

// ===== LEAF =====
CREATURE_ART.stumply = function () {           // walking tree stump. Root Rise: throws its arms up, then slams them down into the earth
  INK = '#3d2a14';
  const bark = '#ad783e', top = '#f2d8a0', lf = '#5fd060';
  bl([-13, -3, -19, -1.5 - WD * 2, -15, .5, -8, 0], bark); bl([13, -3, 19, -1.5 - WD * 2, 15, .5, 8, 0], bark);
  feet(-6, 6, -1.6, 4.4, 2.6, '#8f5f2e');
  bl([-13, -2, -14.5, -22, -12, -27, 12, -27, 14.5, -22, 13, -2, 0, 0], bark);
  ln([-9, -6, -9.5, -12], '#7d5226', 1.3); ln([10, -17, 10.4, -23], '#7d5226', 1.3); ln([-11, -18, -11, -22], '#7d5226', 1.3);
  el(0, -27, 12.6, 4.6, top);
  c.beginPath(); c.ellipse(0, -27, 7.5, 2.6, 0, 0, TAU); c.strokeStyle = '#d6b272'; c.lineWidth = 1; c.stroke();
  c.beginPath(); c.ellipse(.5, -27, 3.4, 1.2, 0, 0, TAU); c.stroke();
  J(0, -28, -WD * .5 + SK * .7);
  cv([0, -28, 1, -35], '#5a8a2a', 1.5);
  leaf(1, -35, 9, 4, -.5 + TW * .18, lf); leaf(1, -35, 8, 3.6, PI + .45 + TW * .18, '#7fe070');
  U();
  dot(-9.5, -24.6, 3.4, 1.8, '#6fc45a'); dot(8, -3.5, 3.6, 1.6, '#6fc45a');
  eyes(-3.4, -15, 6, -15, 1, undefined, SK > .4);
  if (WD > .3 || SK > .1) openMouth(1.4, -9.4, 2.2, 1.6 + SK); else smile(1.4, -10.6, 2);
  blush(-7, -11); blush(9.6, -11);
  const ax = 19 - WD * 2 + SK * 2, ay = -16 - WD * 15 + SK * 11;
  cv([-13.5, -13, -ax, ay], bark, 2.2); cv([13.5, -13, ax, ay], bark, 2.2);
  ln([-ax, ay, -ax - 2.4, ay - 2], INK, 1.2); ln([-ax, ay, -ax + 1, ay - 3], INK, 1.2); ln([ax, ay, ax + 2.4, ay - 2], INK, 1.2); ln([ax, ay, ax - 1, ay - 3], INK, 1.2);
  mark(16, -2);
};

CREATURE_ART.brambear = function () {          // bear cub with bramble gauntlets. Thorn Swipe: right, left, then a big overhand right
  INK = '#4a2a14';
  const bd = '#cf8e4c', cr = '#ffe8c2', gr = '#5fd060';
  const nw = BW[0] + BW[2], ns = BS[0] + BS[2] * 1.15, fw = BW[1], fs2 = BS[1];
  const px = 14 - nw * 5 + ns * 9, py = -13 - nw * 16 + ns * 6;            // near paw: up behind the ear, then raked down
  const fpx = -12.5 + fw * 14 + fs2 * 31, fpy = -12 - fw * 17 + fs2 * 2;   // far paw comes across the body
  const paw = (x, y) => {
    pg([x + 3, y - 4, x + 8, y - 6, x + 5, y - 1], '#eaffd0', 1.1); pg([x + 4, y - 1, x + 9.6, y - 1, x + 5, y + 2], '#eaffd0', 1.1); pg([x + 3, y + 2, x + 8, y + 5, x + 4, y + 4.6], '#eaffd0', 1.1);
    el(x, y, 4.9, 4.7, gr); ln([x - 3, y - 1.5, x + 2.6, y - 2.4], '#2f9a44', 1.2); ln([x - 3, y + 1.6, x + 2.6, y + 1.2], '#2f9a44', 1.2);
  };
  feet(-7, 7, -2.2, 5.6, 3.5, bd);
  J(0, -3, -nw * .07 + ns * .1 + fw * .05 - fs2 * .06);
  if (fw + fs2 < .15) { el(-12.5, -12, 4.6, 4.4, gr); ln([-15, -13, -10, -13.6], '#2f9a44', 1.2); }
  bl([-12, -4, -13, -18, 0, -23, 13, -18, 12, -4, 0, -1], bd);
  dot(1, -9.5, 6.5, 5.5, cr);
  for (let i = 0; i < 5; i++) leaf(-8 + i * 4.6, -19.5 + Math.abs(i - 2) * .8, 6, 2.6, PI * .5 + (i - 2) * .32, i % 2 ? gr : '#7fe070', 1.3);
  J(2, -20, -nw * .05 + ns * .09 + fw * .04, ns * 1.5 + fs2 * 1.2, 0);
  el(-6.5, -36.5, 3.8, 3.8, bd); el(10.5, -37, 3.8, 3.8, bd);
  dot(-6.5, -36.3, 1.8, 1.8, '#f4b7a0'); dot(10.5, -36.8, 1.8, 1.8, '#f4b7a0');
  el(2, -28.5, 11, 10, bd);
  leaf(1, -38, 7, 3, -1.2 + TW * .12, gr, 1.3);
  dot(5, -25.4, 5.2, 3.7, cr); dot(6.6, -27, 1.8, 1.3, INK);
  if (ns + fs2 > .35) openMouth(6.4, -23.8, 2.2, 1.9); else { ln([6.6, -25.8, 6.6, -24.6], INK, 1.1); smile(6.6, -24.4, 1.8); }
  eye(-1.4, -29.5); eye(8.6, -30.2);
  if (AT > 0) { brow(-1.4, -33.6, 1); brow(8.6, -34.2, -1); }
  blush(-4.6, -25.4);
  U();
  if (fw + fs2 >= .15) { cv([-4, -17, (fpx - 4) / 2, fpy - 4, fpx, fpy], bd, 3.4); if (BI === 1) swoosh(-2, -15, 22, -1.5, .25, 6, '#eaffd0'); paw(fpx, fpy); }
  cv([8, -17, (px + 8) / 2 + 2, (py - 17) / 2 - 2, px, py], bd, 3.6);
  if (BI === 0 || BI === 2) swoosh(8, -16, 17, -1.35, .55, 6, '#eaffd0');
  paw(px, py);
  mark(BI === 1 ? fpx + 5 : px + 5, BI === 1 ? fpy : py);
  U();
};

CREATURE_ART.cloverbun = function () {         // clover-eared bunny. Lucky Kick: crouches, springs, and drives both feet in
  INK = '#4a5a3a';
  const bd = '#f8fff2', gr = '#55c85a', pk = '#ffb9cc';
  const j = AT > 0 ? Ease.seg(AT, .08, .42) : 0, co = AT > 0 && AT < .08 ? AT / .08 : 0, kick = AT > 0 ? (j < 1 ? Ease.outCubic(j) : 1 - Ease.seg(AT, .42, .58)) : 0;
  el(-10.5, -8, 4.2, 4.2, '#fff');
  const f1x = lerp(-3, 12, kick), f1y = lerp(-1.8, -8, kick), f2x = lerp(8, 17, kick), f2y = lerp(-1.8, -5, kick);
  if (j > .45 && j < 1) { c.globalAlpha *= .55; pg([f2x - 14, f2y, f2x + 2, f2y - 3.4, f2x + 2, f2y + 3.4], '#ffffff', 0); c.globalAlpha /= .55; }
  el(f1x, f1y - Math.max(0, ST) * 3, 6.2, 2.9, bd, -kick * .5); el(f2x, f2y - Math.max(0, -ST) * 3, 6.2 + kick, 2.9 + kick * .4, bd, -kick * .5);
  Z(0, -3, 1 + co * .08, 1 - co * .2);
  bl([-10, -3, -11, -15, 0, -19, 10, -15, 9, -3, 0, -1], bd);
  const s0 = TW * 1.5, bk = kick * 8 + co * 3, dn = kick * 6;
  bl([-2, -30, -6 - s0 - bk, -44 + dn, 0 - s0 - bk, -46 + dn, 3, -31], bd); dot(-1.6 - (s0 + bk) * .6, -38 + dn * .5, 1.5, 5, pk, -.12 - bk * .06);
  bl([5, -31, 7 + s0 - bk, -46 + dn, 12 + s0 - bk, -45 + dn, 9.5, -30], bd); dot(8.4 + (s0 - bk) * .6, -38.5 + dn * .5, 1.5, 5, pk, .12 - bk * .06);
  const clover = (x, y) => { el(x - 3, y, 3, 3, gr, 0, 1.4); el(x + 3, y, 3, 3, gr, 0, 1.4); el(x, y - 3, 3, 3, gr, 0, 1.4); dot(x, y - .6, 2.4, 2.4, gr); };
  clover(-3.4 - s0 - bk, -47 + dn); clover(9.8 + s0 - bk, -47.5 + dn);
  el(3, -23.5, 9.6, 8.6, bd);
  eye(-.6, -24.6); eye(7.8, -25.2);
  if (kick > .3) { brow(-.6, -28.6, 1, .9); brow(7.8, -29.2, -1, .9); }
  dot(4.8, -21.4, 1.3, 1, '#ff7f9f'); smile(3.4, -20.2, 1.3); smile(6.2, -20.3, 1.3);
  blush(-4.2, -21); blush(10.6, -21.6);
  U();
  mark(19, -5);
};

CREATURE_ART.bloomerang = function () {        // flower sprite. Petal-rang: winds its leaf arm right back and flings a spinning petal
  INK = '#6a2a4a';
  const gr = '#5fd060', pt = '#ff8fb8', pt2 = '#ffb3cf';
  const rot = -.5 - WD * 1.7 + SK * 1.5 + TW * .1 * (AT > 0 ? 0 : 1), hx = 6 + Math.cos(rot) * 9, hy = -10 + Math.sin(rot) * 9;
  feet(-4, 4, -1.6, 3.7, 2.4, '#3da04a');
  J(0, -2, -WD * .12 + SK * .14);
  bl([-6, -3, -7, -13, 0, -16, 7, -13, 6, -3, 0, -1], gr);
  leaf(-6, -10, 9, 3.6, PI + .5 + WD * .4 - SK * .6, gr); leaf(6, -10, 9, 3.6, rot, '#7fe070');
  if (AT > 0 && AT < .29) {   // the petal-rang, still in hand
    c.save(); c.translate(hx, hy); c.rotate(T * 12);
    for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); el(3.4, 0, 4, 2, i % 2 ? pt : pt2, 0, .9); }
    dot(0, 0, 1.6, 1.6, '#ffe27a'); c.restore();
  } else if (SM) streak(hx - 9, hy - 5, hx, hy, 6, '#ffd0e0');
  const cx = 0, cy = -25.5, sp = W * .06 + Ease.outCubic(SK) * 1.3 - WD * .5;
  for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + sp; el(cx + Math.cos(an) * 9.5, cy + Math.sin(an) * 9.5, 6, 4.3, i % 2 ? pt : pt2, an); }
  el(cx, cy, 8.3, 8.3, '#ffe27a');
  eyes(-3.2, -26.5, 3.6, -26.5, 1, undefined, false);
  if (SK > .3) openMouth(.2, -22.8, 1.8, 1.5); else smile(.2, -23.2, 1.9);
  blush(-5.8, -23.2); blush(6.2, -23.2);
  mark(hx, hy);
  U();
};

CREATURE_ART.sporel = function () {            // sleepy toadstool healer. Healing Spores: its cap squashes down, then springs up puffing
  INK = '#5a2330';
  const cap = '#f2686e', cr = '#fff3dc';
  const b = -WD * 4.5 + SK * 6;
  feet(-4, 4, -1.6, 3.8, 2.4, cr);
  bl([-7.5, -2, -8.5, -14 - SK * 1.5, 0, -16 - SK * 2, 8.5, -14 - SK * 1.5, 7.5, -2, 0, 0], cr);
  dot(0, -15 - SK * 2, 7.6, 2.2, '#7fe070');
  eyes(-3.2, -8.4, 3.6, -8.4, 1, undefined, SK > .35 || WD > .6);
  smile(.2, -5.4, 1.7);
  blush(-5.8, -5.4); blush(6.2, -5.4);
  Z(0, -12 - b, 1 + WD * .08 - SK * .05, 1 - WD * .14 + SK * .1);
  bl([-17, -14 - b, -16, -26 - b, 0, -35 - b, 16, -26 - b, 17, -14 - b, 8, -11 - b, 0, -13 - b, -8, -11 - b], cap);
  dot(-8, -22 - b, 3.4, 2.8, '#fff'); dot(5, -27 - b, 4, 3, '#fff'); dot(11.5, -18.6 - b, 2.3, 1.9, '#fff'); dot(-1.5, -17.4 - b, 1.8, 1.4, '#fff');
  U();
  for (let i = 0; i < 3; i++) { const k = (T * (.5 + SK) + i / 3) % 1; dot(-12 + i * 12 + Math.sin(T * 2 + i * 2) * 2, -30 - b - k * 12, 1.2, 1.2, 'rgba(190,255,160,' + (1 - k) + ')'); }
  mark(0, -33 - b);
};

// ===== SPARK =====
CREATURE_ART.ohmadillo = function () {         // battery-plated armadillo. Static Roll: tucks into a ball, rolls in, and uncurls
  INK = '#4a3a10';
  const sh = '#ffd23d', sk = '#f8e8c8';
  const curl = AT > 0 ? Ease.seg(AT, .02, .12) - Ease.seg(AT, .74, .88) : 0;
  if (curl < .97) {
    Z(4, -10, 1 - curl, 1 - curl);
    pg([-14, -6, -23, -3 + TW, -13, -2], sk);
    feet(-7, 6, -1.8, 4, 2.6, sk);
    bl([7, -5, 9, -17, 19, -14, 25, -8.5, 16, -4], sk);
    el(9.5, -19, 2.6, 4.2, sk, .3); dot(9.6, -19, 1.1, 2.6, '#f4b7a0', .3);
    eye(16.5, -11.6, .95); dot(24.2, -8.6, 1.3, 1.1, INK); smile(20, -6.6, 1.4);
    U();
  }
  if (curl > .5) {   // tucked into a ball
    el(-1, -14.5, 13.6, 13.6, sh);
    for (let i = -2; i <= 2; i++) ln([-1 + i * 4.4, -27.4 + Math.abs(i) * 1.7, -1 + i * 5.6, -14.5, -1 + i * 4.4, -1.6 - Math.abs(i) * 1.7], '#d99a14', 1.6);
    ln([-8, -15, -5.4, -15], '#4a3a10', 1.4); ln([-6.7, -16.3, -6.7, -13.7], '#4a3a10', 1.4); ln([3.4, -14.5, 6, -14.5], '#4a3a10', 1.4);
    shine(-6, -22, 5, 2, -.6);
  } else {
    bl([-16, -3, -17, -18, -5, -28, 9, -23, 14, -11, 10, -3], sh);
    ln([-11, -23, -12.5, -4], '#d99a14', 1.6); ln([-4.5, -26.5, -6, -3.6], '#d99a14', 1.6); ln([2.5, -25, 1.5, -3.6], '#d99a14', 1.6); ln([8.6, -20.5, 8, -4], '#d99a14', 1.6);
    ln([-9.5, -15, -7, -15], '#4a3a10', 1.4); ln([-8.25, -16.3, -8.25, -13.7], '#4a3a10', 1.4);
    ln([4, -14.5, 6.6, -14.5], '#4a3a10', 1.4);
    shine(-8, -23, 5, 1.6, -.5);
  }
  mark(12, -13);
};

CREATURE_ART.zapcoon = function () {           // storm-grey raccoon. Tail Taser: coils its charged tail, then whips it round at full stretch
  INK = '#252a40';
  const bd = '#8f9ab6', dk = '#3b425e', cr = '#f6f2e8', yl = '#ffd23d';
  c.save(); c.translate(-8, -7); c.rotate(TW * .1 * (AT > 0 ? 0 : 1) + WD * .35 - SK * 1.5); c.scale(1 + SK * .3 - WD * .1, 1 + SK * .3 - WD * .1);
  bl([0, 2, -13, -1, -18, -15, -11, -24, -3, -17, 2, -6], bd);
  c.save(); c.clip();
  ln([-16, -4, -4, -1], yl, 3); ln([-19, -12, -3, -9], yl, 3); ln([-17, -20, -4, -17], yl, 3);
  c.restore();
  bl([0, 2, -13, -1, -18, -15, -11, -24, -3, -17, 2, -6], null);
  if (WD + SK > .2) bolt(-14, -27, .5 + (WD + SK) * .4, .4, '#fff7b0', 1.2);
  mark(-12, -24);
  c.restore();
  feet(-6, 6, -2, 4.8, 3, dk);
  J(0, -4, -WD * .08 + SK * .07);
  bl([-11, -4, -12, -17, 0, -22, 11, -17, 10, -4, 0, -1], bd);
  dot(1, -9, 5.6, 5, cr);
  bolt(1, -9.4, .62, .15, yl, 1);
  J(3, -20, WD * .14 - SK * .08);
  el(-6, -34.4, 3.8, 3.8, bd); el(11.4, -35, 3.8, 3.8, bd);
  dot(-6, -34.2, 1.8, 1.8, dk); dot(11.4, -34.8, 1.8, 1.8, dk);
  el(3, -26.5, 10.6, 9.2, bd);
  bl([-6.6, -28, -3, -31, 4, -29, 11, -31.5, 13.4, -28, 9, -24.6, 3, -26, -3, -24.4], dk, 0);
  eye(-1.6, -27.6, .95, yl); eye(8.4, -28.2, .95, yl);
  dot(5, -22.6, 4.4, 3, cr); dot(6.8, -23.8, 1.5, 1.1, INK);
  if (SK > .3) openMouth(6, -20.8, 2.2, 1.5); else ln([3.6, -21.2, 6, -20.2, 8.6, -21.4], INK, 1.3);
  blush(-4.6, -22.2);
  U();
  el(12 - WD * 3, -12 - WD * 3 - SK * 2, 3.3, 3.1, dk); el(-11 + WD * 3, -11 - WD * 3, 3.3, 3.1, dk);
  U();
};

CREATURE_ART.dynafly = function () {           // lightning dragonfly. Zigzag Strike: curls its tail under, then zips with wings swept back
  INK = '#3a3a10';
  const bd = '#ffe14a', ey = '#3de0c8';
  const co = AT > 0 && AT < .2 ? AT / .2 : 0, ds = AT > .2 && AT < .44 ? 1 : 0;
  const y = -19 + W * 1.5, fl = Math.sin(T * (38 + co * 30)) * (ds ? .3 : 1), sw = ds * .55;
  c.globalAlpha *= .7;
  el(-3 - sw * 6, y - 5, 12, 3.2, '#d6f6ff', -.5 + fl * .35 + sw, 1.2); el(1 - sw * 6, y - 5, 12, 3.2, '#d6f6ff', -1.2 + fl * .3 + sw * 1.6, 1.2);
  el(-4 - sw * 6, y + 2, 10, 2.8, '#eafcff', .35 - fl * .3 - sw * .6, 1.2);
  c.globalAlpha /= .7;
  cv([-3, y, -13, y + 2.5 + co * 5, -24 + co * 8, y - 2 + TW * 2 * (1 - ds) + co * 9], bd, 3.6);
  if (co < .3) for (let i = 0; i < 4; i++) ln([-8 - i * 4, y - .6 + i * .2, -8.4 - i * 4, y + 3.4 - i * .5], '#3ab8a8', 1.5);
  bolt(-26 + co * 9, y - 3 + TW * 2 * (1 - ds) + co * 10, .6 + co * .3, 1.2, '#fff7b0', 1.2);
  el(0, y, 5.6, 5.1, bd);
  el(7, y - 2, 6.2, 5.6, bd);
  if (BK) { ln([3, y - 3, 6, y - 2.4], INK, 1.4); ln([8.6, y - 3.6, 11.6, y - 3], INK, 1.4); }
  else { el(4.6, y - 3, 3.2, 3.6, ey, 0, 1.2); dot(3.8, y - 4.2, 1, 1.2, '#fff'); el(10.4, y - 3.6, 3, 3.4, ey, 0, 1.2); dot(9.6, y - 4.8, 1, 1.2, '#fff'); }
  smile(8.4, y + 1.2, 1.5);
  mark(13, y - 2);
};

CREATURE_ART.teslowl = function () {           // owl with tesla-coil tufts. Arc Bolt: spreads its wings as the coils charge, then snaps them forward
  INK = '#4a2f0a';
  const bd = '#ffcf3d', wg = '#c98a1e', cr = '#fff6dc';
  dot(-4, -1.2, 3.2, 1.8, '#ff9a2e'); dot(5, -1.2, 3.2, 1.8, '#ff9a2e');
  const coil = (x, d) => {
    cv([x, -29, x + d * 1.5, -38], '#9aa3b8', 1.6);
    for (let i = 0; i < 3; i++) el(x + d * (.4 + i * .45), -31.5 - i * 2.6, 3 - i * .5, 1.1, '#c9d0e0', 0, 1);
    glow(x + d * 1.7, -40, 5 + WD * 7 + SK * 3, '#7af0ff', .5 + WD * .45);
    el(x + d * 1.7, -40, 2.3 + WD * .6, 2.3 + WD * .6, SK > .3 ? '#ffffff' : '#bff8ff', 0, 1.2);
  };
  coil(-8, -1); coil(9, 1);
  Z(0, -3, 1 + WD * .05, 1 + WD * .04);
  bl([-13, -3, -14.5, -20, -8, -31, 8, -31, 14.5, -20, 13, -3, 0, 0], bd);
  dot(0, -9, 7.5, 6.5, cr);
  ln([-3, -10, 0, -8.4, 3, -10], wg, 1.2); ln([-3, -6.4, 0, -4.8, 3, -6.4], wg, 1.2);
  bl([-13, -8, -16 - WD * 6 + SK * 4, -17 - WD * 10 + SK * 5, -12, -22, -9, -12], wg);
  bl([13, -8, 16 + WD * 6 + SK * 5, -17 - WD * 10 + SK * 5, 12, -22, 9, -12], wg);
  if (BK) { el(-5.4, -21, 6, 6, cr); el(6, -21, 6, 6, cr); ln([-8.4, -21, -2.4, -21], INK, 1.5); ln([3, -21, 9, -21], INK, 1.5); }
  else {
    const pr = 3 - SK * 1.2;
    el(-5.4, -21, 6, 6, '#fff'); el(6, -21, 6, 6, '#fff'); dot(-4.6, -21, pr, pr * 1.1, '#17121f'); dot(6.8, -21, pr, pr * 1.1, '#17121f'); dot(-5.8, -22.4, 1.2, 1.2, '#fff'); dot(5.6, -22.4, 1.2, 1.2, '#fff');
    if (WD > .2) { c.fillStyle = bd; c.beginPath(); c.arc(-5.4, -21, 6.2, PI * 1.08, PI * 1.92); c.closePath(); c.fill(); c.beginPath(); c.arc(6, -21, 6.2, PI * 1.08, PI * 1.92); c.closePath(); c.fill(); ln([-10.6, -23, -.4, -23], INK, 1.4); ln([.8, -23, 11.2, -23], INK, 1.4); }
  }
  pg([-1.4, -18, 2, -18, .3, -14.4 + SK * 2.2], '#ff9a2e', 1.2);
  U();
  mark(.5, -41);
};

CREATURE_ART.nimbolt = function () {           // grumpy little thundercloud. Thunderclap: swells and darkens, then flashes white
  INK = '#3a4a6a';
  const y = -17 + W * 1.8;
  bolt(-1, y + 9 + SK * 5, 1.25 + SK * .35, .1, '#ffe14a', 1.4);
  const d = Math.round(246 - WD * 70);
  puff([-9, y, 7, 0, y - 4, 9, 9, y, 7, -4, y + 3, 6, 5, y + 3, 6, -1, y - 9, 6], SK > .35 ? '#fffbe0' : 'rgb(' + d + ',' + (d + 2) + ',' + Math.min(255, d + 12) + ')');
  dot(-3, y + 5.6, 8, 2.2, 'rgba(160,178,220,.5)');
  eye(-4, y - 2); eye(5, y - 2);
  brow(-4.4, y - 6.6, 1 + WD * .9); brow(5.4, y - 6.6, -1 - WD * .9);
  if (SK > .15) openMouth(.5, y + 2.6, 2, 1.5 + SK * 1.2);
  else if (WD > .35) ln([-2, y + 2.2, -.8, y + 3.2, .5, y + 2.2, 1.8, y + 3.2, 3, y + 2.2], INK, 1.3);
  else ln([-1, y + 2.6, .5, y + 2, 2, y + 2.6], INK, 1.3);
  blush(-8.4, y + 1.6); blush(9.4, y + 1.6);
  shine(-7, y - 7, 3, 1.6, -.4, .8);
  mark(0, y - 1);
};

// ===== STONE =====
CREATURE_ART.cobblem = function () {           // mossy boulder golem. Quake Stomp: raises both fists high and brings them down
  INK = '#3a3028';
  const rk = '#b89d7c', dk = '#95795a', gem = '#4de0d0';
  feet(-8, 8, -2.2, 5.6, 3.4, dk);
  pg([-14, -4, -16, -16, -9, -28, 6, -30, 15, -20, 14, -5, 0, -1], rk);
  pg([-9, -28, 6, -30, 9, -24, -6, -22], '#cdb393', 0);
  ln([-16, -16, -6, -22, 9, -24, 15, -20], dk, 1.2); ln([-6, -22, -8, -8], dk, 1.2);
  const mo = -WD * 1.2 + SK * 2.4;
  puff([-6, -30 + mo, 3.4, -1, -32 + mo, 4, 4, -31 + mo, 3], '#6fc45a');
  if (BK || SK > .4) { ln([-6, -16, -1.5, -16], INK, 1.5); ln([4.5, -16.5, 9, -16.5], INK, 1.5); }
  else { diamond(-3.8, -16, 2.8, 3.4, gem, 1.3); diamond(6.8, -16.6, 2.8, 3.4, gem, 1.3); dot(-4.6, -17.2, .9, .9, '#fff'); dot(6, -17.8, .9, .9, '#fff'); }
  if (SK > .2) openMouth(1.5, -9.4, 2.6, 1.6); else ln([-1.5, -10, .5, -8.8, 2.5, -10, 4.5, -8.8], INK, 1.4);
  diamond(1.5, -4.6, 2.3, 1.9, WD > .4 ? '#d8fffa' : gem, 1.1);
  const ay = -12 - WD * 13 + SK * 7, ax = 16 - WD * 3 + SK * 3;
  el(-ax, ay, 5, 5.4, dk); el(ax, ay, 5, 5.4, dk);
  if (SM) { streak(-ax, ay - 12, -ax, ay, 8, '#fff3d6'); streak(ax, ay - 12, ax, ay, 8, '#fff3d6'); }
  mark(0, -2);
};

CREATURE_ART.quarrilla = function () {         // baby gorilla with rock fists. Rock Uppercut: drums its chest, drops a shoulder, and swings up
  INK = '#2e2620';
  const fur = '#8a7868', fc = '#f2d6b0', rk = '#c4ae90';
  const dr = AT > 0 && AT < .2 ? Math.sin(AT / .2 * PI * 3) : 0, wnd = WD * Ease.seg(AT, .16, .32);
  const fx1 = -14 + dr * 3 + SK * 3, fy1 = -7 - Math.abs(dr) * 3 - SK * 6;
  const fx2 = 15 - dr * 3 - wnd * 5 + SK * 8, fy2 = -7 - Math.abs(dr) * 3 + wnd * 2.5 - SK * 26;
  const rock = (x, y) => { pg([x - 5, y - 3, x - 1, y - 6, x + 5, y - 3, x + 4, y + 3.6, x - 4, y + 4], rk); ln([x - 2, y - 3, x, y + 1], '#95795a', 1.1); };
  feet(-6, 6, -2, 4.6, 3, fur);
  J(0, -3, wnd * .1 - SK * .12);
  cv([-10, -20, -15, -15, fx1, fy1 - 3], fur, 4.2); rock(fx1, fy1);
  bl([-12, -3, -14, -18, -6, -28, 8, -27, 13, -16, 10, -3, 0, -1], fur);
  dot(1, -10.4, 6.6, 5.6, '#a39080');
  el(-5.6, -30, 2.8, 3.2, fc); el(13.6, -30.6, 2.6, 3, fc);
  el(4, -28, 10, 9.4, fur);
  bl([-3, -26, -2.4, -32, 4.5, -33.4, 11.4, -32, 12.4, -26, 9, -20.6, 0, -20.6], fc, 1.4);
  ln([-2, -32, 4.5, -32.8 + (AT > 0 ? 1 : 0), 11, -32], INK, 1.8);
  eye(1.2, -28, 1); eye(8.6, -28.4, 1);
  dot(3.8, -24.2, .75, .75, INK); dot(6.2, -24.3, .75, .75, INK);
  if (SK > .25 || Math.abs(dr) > .3) openMouth(5, -21.8, 2.4, 1.7); else smile(5, -22.4, 2.4);
  blush(-1, -24); blush(10.6, -24.4);
  ln([2, -37.4, 4, -39.6, 6, -37.4], INK, 1.3);
  cv([10, -19, 15 + SK * 2, -14 - SK * 10, fx2, fy2 + 3], fur, 4.2);
  if (BI === 0 && wnd === 0) swoosh(9, -10, 19, 1.15, -1.25, 7, '#fff3d6');
  rock(fx2, fy2);
  mark(fx2 + 2, fy2 - 5);
  U();
};

CREATURE_ART.jerboing = function () {          // big-eared desert jerboa. Burrow Pop: folds its ears and dives, then bursts out star-shaped
  INK = '#5a3d1e';
  const bd = '#f2cc8e', cr = '#fff5e0', pk = '#ffb9b0';
  const dive = AT > 0 && AT < .18 ? AT / .18 : 0, pop = AT > .58 ? Ease.hump(Ease.seg(AT, .58, .95)) : 0;
  cv([-8, -8, -20, -11 - pop * 4, -24, -25 + TW * 2.5 - pop * 6], bd, 1.8); el(-24, -27 + TW * 2.5 - pop * 6, 3, 3.6, '#7a5230');
  el(5 + pop * 6, -1.6 - Math.max(0, ST) * 3 - pop * 2, 7.6, 2.6, bd, -pop * .5); el(-3 - pop * 6, -1.6 - Math.max(0, -ST) * 3 - pop * 2, 6.6, 2.4, bd, pop * .5);
  el(0, -12, 10.4, 10.2, bd);
  dot(2, -8.6, 5.6, 5, cr);
  const e = TW * .08;
  c.save(); c.translate(-4, -20); c.rotate(-.12 + e - dive * 1 - pop * .35); bl([-3, 0, -6, -19, 2, -21, 4, -1], bd); dot(-1, -11, 2, 6.6, pk, -.08); c.restore();
  c.save(); c.translate(5, -21); c.rotate(.2 - e - dive * 1.3 + pop * .35); bl([-3, 0, -2, -20, 6, -19, 4, -1], bd); dot(1.6, -11, 2, 6.6, pk, .08); c.restore();
  eyes(-.6, -15, 8, -15.6, 1.15 + pop * .15, undefined, dive > .5);
  dot(5, -11.4, 1.3, 1, '#ff8a8a');
  if (pop > .3) openMouth(5, -9.4, 1.6, 1.4); else smile(5, -10, 1.3);
  ln([8, -10.6, 13.5, -11.6], '#b08a5a', .8); ln([8, -9.6, 13.5, -8.6], '#b08a5a', .8);
  blush(-4.4, -10.6);
  cv([7, -7.6, 10.5 + pop * 4, -6 - pop * 7], bd, 1.6); cv([-6, -8, -9.5 - pop * 4, -6.5 - pop * 7], bd, 1.6);
  mark(0, -12);
};

CREATURE_ART.glintgecko = function () {        // gecko with a crystal back. Prism Shard: its crystals swell and glow, and the middle one fires
  INK = '#4a3220';
  const bd = '#dcae6e', cr = '#fff0d2';
  const g = WD * 4, gone = SK > .25 ? Math.min(1, (SK - .25) / .5) : 0;
  cv([-10, -6.6, -20, -5 - WD * 2, -23, -13 - WD * 2, -17 + WD * 2, -16 + TW - WD * 2], bd, 4);
  const toes = (x, y) => { dot(x - 2.6, y, 1.6, 1.6, cr); dot(x, y + .8, 1.6, 1.6, cr); dot(x + 2.6, y, 1.6, 1.6, cr); };
  cv([-7, -5, -10, -1.6 - Math.max(0, ST) * 2], bd, 2.6); cv([7, -5, 10, -1.6 - Math.max(0, -ST) * 2], bd, 2.6);
  toes(-10.5, -1 - Math.max(0, ST) * 2); toes(10.5, -1 - Math.max(0, -ST) * 2);
  bl([-12, -4, -12, -12, 0, -15, 10, -13, 12, -6, 4, -3], bd);
  dot(1, -5.4, 7.4, 2.2, cr);
  pg([-10, -12, -8, -22 - g, -4, -13], WD > .5 ? '#c8f8ff' : '#7aecff');
  if (gone < .97) pg([-5, -14, -1, -14 - (13 + g) * (1 - gone), 3, -14], WD > .5 ? '#ffd0ee' : '#ff9ad8');
  pg([2, -14, 6, -22 - g, 8, -13], WD > .5 ? '#e0d6ff' : '#b6a0ff');
  ln([-8, -20 - g, -7, -14], '#fff', 1); if (gone < .5) ln([-1, -24 - g, -.4, -16], '#fff', 1);
  if (WD > .2) star(-1, -30 - g, 3.4 * WD, '#fff', 4, T * 3, 0);
  J(12, -10, SK * .18 - WD * .08);
  el(12, -14, 8.2, 7.2, bd);
  eye(9, -16, 1.05, '#35c8e0'); eye(16, -16.6, 1.05, '#35c8e0');
  if (SK > .3) openMouth(13.5, -10, 2.6, 1.6); else ln([8, -10.6, 12.6, -9, 18, -11.4], INK, 1.3);
  dot(18.6, -14, .6, .6, INK);
  U();
  mark(-1, -28 - g);
};

CREATURE_ART.ankhat = function () {            // little sphinx cat in lapis and gold. Pyramid Seal: closes its eyes, lifts a paw, and brings it down
  INK = '#3a2a12';
  const fur = '#eabb70', lap = '#2a4fc0', gd = '#ffd34a', tq = '#3de0d0';
  const pw = Math.max(WD, SK * .0), hot = Math.max(WD, SK);
  cv([-8, -4, -18, -5, -19, -15 + TW * 2 - SK * 3, -14, -17 + TW * 2 - SK * 5], fur, 2.8); ln([-19.6, -11 + TW - SK * 2, -17, -11.6 + TW - SK * 2], gd, 2.2);
  bl([-9, -2, -10, -16, 0, -21, 10, -16, 10, -2, 0, 0], fur);
  dot(-4, -1.8, 3.6, 2, '#f6d9a0');
  if (pw > .05) el(5 + pw * 5, -1.8 - pw * 10, 3.6, 2.4, '#f6d9a0', -pw * .5); else dot(5, -1.8, 3.6, 2, '#f6d9a0');
  if (SM && WD === 0) streak(10, -14, 6, -3, 6, '#fff3c0');
  const fo = SK * 3;
  pg([-8, -34, -14 - fo, -15, -6 - fo * .5, -16, -4, -28], lap); pg([11, -34, 16 + fo, -15, 8 + fo * .5, -16, 8, -28], lap);
  ln([-10.6 - fo * .4, -27, -5.2, -26], gd, 1.5); ln([-12 - fo * .7, -21.6, -6 - fo * .3, -21], gd, 1.5); ln([9, -26, 13.2 + fo * .4, -27], gd, 1.5); ln([8.6 + fo * .3, -21, 14.6 + fo * .7, -21.6], gd, 1.5);
  bl([-7, -15.6, 0, -13, 9, -15.6, 9, -18.6, 0, -16.4, -7, -18.6], gd, 1.4);
  diamond(1, -15.4, 2, 2.3, tq, 1.1);
  pg([-7, -32, -8, -41, -1, -35], fur); pg([7, -35, 12, -41, 11, -32], fur);
  dot(-5.6, -36, 1.2, 2, '#f4b7a0', -.3); dot(9.6, -36.6, 1.2, 2, '#f4b7a0', .3);
  el(2, -27, 9.6, 8.6, fur);
  bl([-7.4, -30, -5, -35.4, 2, -36.4, 9, -35.4, 11.4, -30, 2, -32.4], lap, 1.4);
  ln([-6.6, -31.4, 2, -33.8, 10.6, -31.4], gd, 1.6);
  diamond(2, -35.4, 1.8 + hot * .5, 2.4 + hot * .6, hot > .15 ? '#fff' : tq, 1.1);
  if (hot > .1) glow(2, -35.4, 4 + hot * 8, '#ffe27a', .8 * hot);
  eyes(-1.6, -27, 6.8, -27.4, 1, SK > .2 ? '#bffff5' : '#18b8a8', WD > .4);
  ln([-5, -27.4, -8, -28.8], INK, 1.3); ln([10, -28, 12.6, -29.6], INK, 1.3);
  pg([1.6, -23.6, 4, -23.6, 2.8, -22.2], '#c2562a', .9);
  smile(1.4, -21.4, 1.3); smile(4.2, -21.5, 1.3);
  mark(2, -35.4);
};
