'use strict';
// ---------- creature art, part B: Frost, Sky, Venom, Mystic, Shadow ----------

// ===== FROST =====
CREATURE_ART.yetuff = function () {            // fluffy yeti
  INK = '#3a5a7a';
  const sk = '#84cdf5';
  feet(-7, 7, -2.2, 5.6, 3.4, sk);
  const up = AT > 0 ? Ease.seg(AT, 0, .4) - Ease.seg(AT, .5, .65) : 0;
  el(-15, -13 - up * 14, 4.6, 4.6, sk); el(15, -13 - up * 14, 4.6, 4.6, sk);
  puff([-8, -10, 7.5, 8, -10, 7.5, -11, -19, 7, 11, -19, 7, -6, -27, 7, 6, -27, 7, 0, -18, 12, 0, -31, 5], '#ffffff');
  dot(-5, -7, 7, 3, 'rgba(170,205,235,.45)'); dot(7, -6.6, 6, 2.6, 'rgba(170,205,235,.45)');
  el(2.5, -18.5, 8.4, 7.2, sk);
  eye(-.8, -19.6); eye(6.6, -20);
  if (AP > .1) openMouth(3, -14.6, 2.2, 1.4 + AP); else smile(3, -15.6, 1.9);
  blush(-3.6, -15.6); blush(9.4, -16);
  ln([-2, -33, 0, -36.6, 2, -33], INK, 1.3);
};

CREATURE_ART.slapguin = function () {          // scarf-wearing penguin
  INK = '#16264a';
  const bd = '#33549f', bk = '#ffb02e', sc = '#ff5a72';
  dot(-4, -1.2, 4, 2, bk); dot(5, -1.2, 4, 2, bk);
  bl([-12, -9, -17, -13 + TW, -13, -20, -9, -13], bd);
  bl([-11, -2, -12.5, -20, -6, -31, 7, -31, 12.5, -20, 11, -2, 0, 0], bd);
  bl([-5.5, -3, -7, -15, -1, -20, 8, -20, 10, -12, 8, -3, 1, -1.6], '#fff', 0);
  dot(-1, -25, 4.2, 3.6, '#fff'); dot(7, -25.4, 3.8, 3.4, '#fff');
  eye(-.4, -25.2, .9); eye(6.8, -25.6, .9);
  pg([2, -23.4, 11.6, -21.6, 2.4, -19.6], bk);
  blush(-4, -21.6);
  bl([-9, -19.6, 0, -17, 10, -19.6, 10, -16.4, 0, -13.6, -9, -16.4], sc, 1.5);
  bl([-7, -17, -15, -14 + TW * 1.5, -17, -10 + TW * 2, -9, -13.6], sc, 1.5);
  const sw = AT > 0 ? Math.sin(AT * PI * 2) : 0;
  c.save(); c.translate(11, -17); c.rotate(.5 - AP * 1.5 + sw * .5);
  bl([-2, 0, 2, -3, 12, 1, 4, 4.6], bd); c.restore();
};

CREATURE_ART.lynxicle = function () {          // icicle-eared lynx
  INK = '#2a4a6a';
  const fur = '#d3ebff', mk = '#8fc0ea', ice = '#7fe3ff';
  el(-13, -11 + TW, 3.6, 3.2, fur);
  feet(-8, 7, -2, 4.6, 3, fur);
  bl([-13, -4, -13.5, -14, -2, -18.5, 10, -15, 12, -5, 0, -2], fur);
  dot(-7, -13, 1.6, 1.3, mk); dot(-3, -15.4, 1.4, 1.1, mk); dot(-9.4, -8.6, 1.4, 1.2, mk);
  pg([1, -17, -4, -13, 2.6, -12.6], '#fff'); pg([17, -18, 21.6, -14, 16, -13], '#fff');
  pg([2, -25, 0, -37, 8, -28], fur); pg([12, -28, 18, -37.4, 17.4, -25], fur);
  pg([.6, -34, -.6, -41 - AP * 3, 2.6, -35.6], ice, 1.2); pg([17.4, -34.6, 19.6, -41.4 - AP * 3, 19, -35], ice, 1.2);
  el(9, -20.5, 9.6, 8.6, fur);
  dot(11.4, -17.6, 4.4, 3, '#fff');
  pg([10.4, -19.6, 12.8, -19.6, 11.6, -18.2], '#ff8fa8', .9);
  smile(10.2, -17, 1.3); smile(13, -17.1, 1.3);
  eye(5.6, -22, 1, '#35b6ff'); eye(14, -22.6, 1, '#35b6ff');
  ln([9, -27.4, 9.6, -24.6], mk, 1.3);
};

CREATURE_ART.rimeling = function () {          // pearl-white ice dragonet
  INK = '#34558a';
  const bd = '#f4f9ff', sh = '#bcd8f5', wg = '#9fd2ff';
  cv([-8, -6, -19, -4, -24, -12 + TW * 2, -19, -18 + TW * 2], bd, 3.4);
  pg([-19, -18 + TW * 2, -25, -22 + TW * 2, -17, -23 + TW * 2], wg);
  const fl = W * 2.5 + AP * 5;
  bl([-3, -20, -15, -37 - fl, -22, -24 - fl * .4, -12, -18], wg);
  ln([-4, -20, -15.5, -30 - fl * .7], '#6fb0ea', 1.1); ln([-4, -20, -18, -25 - fl * .4], '#6fb0ea', 1.1);
  feet(-5, 5, -2, 4.4, 2.8, bd);
  bl([-9, -3, -10.5, -16, -2, -22, 7, -20, 10, -8, 6, -3], bd);
  dot(2, -9.6, 4.6, 6, sh); ln([-1, -12, 5, -12], '#fff', 1); ln([-1, -8.6, 5, -8.6], '#fff', 1);
  pg([2, -31, -8, -39, 3, -27], sh); pg([6, -33, 1, -44, 10, -32], bd);
  el(8, -27, 8.2, 7.2, bd);
  if (AP > .1) { bl([10, -29.6, 20, -29, 20.6, -25.6, 11, -24.6], bd); bl([10, -23.6, 19, -22.6 + AP * 2, 11, -20 + AP * 2], bd); glow(20, -24, 4 + AP * 7, '#aef2ff', .9 * AP); }
  else bl([10, -29.6, 20, -27.6, 20, -22.6, 10, -21], bd);
  dot(18.6, -26.6, .7, .7, INK);
  eye(8.2, -27.6, 1.1, '#1e6aff'); brow(8.4, -32.4, -1, .9);
  shine(-2, -18.4, 4, 1.4, -.3, .7);
};

CREATURE_ART.auroseal = function () {          // aurora seal pup
  INK = '#3a4a6a';
  const bd = '#f8fbff', sh = '#d5e5f6';
  bl([-14, -6, -22, -13 + TW * 2, -27, -8 + TW * 2, -22, -6, -26, -1, -16, -2], sh);
  bl([-16, -3, -14.5, -13, -2, -18, 8, -18, 12, -10, 12, -3, -2, -1], bd);
  ln([-12, -10.6, -6, -15, 1, -15.6], '#5fffc0', 2); ln([-13, -7.6, -6, -12, 2, -12.6], '#b08aff', 2); ln([-12.6, -4.8, -5, -9, 2, -9.6], '#ff8ad8', 2);
  bl([3, -4, 9, -2.6 - AP * 3, 16, -1 - AP * 5, 7, -.2], sh);
  el(9, -17, 9.8, 8.8, bd);
  eye(5, -18.4, 1.15); eye(13.4, -18.8, 1.15);
  dot(9.8, -14.6, 1.5, 1.1, INK); smile(8.6, -13.2, 1.2); smile(11, -13.3, 1.2);
  dot(5.4, -13.4, .6, .6, '#9ab0c8'); dot(4, -12, .6, .6, '#9ab0c8'); dot(14, -13.6, .6, .6, '#9ab0c8'); dot(15.6, -12.4, .6, .6, '#9ab0c8');
  blush(2.4, -14.4); blush(16.6, -15);
  if (AP > .05) {
    c.globalAlpha *= AP;
    ln([-8, -30, 0, -34 + W, 8, -30, 16, -34 - W], '#5fffc0', 2.4); ln([-8, -33, 0, -37 + W, 8, -33, 16, -37 - W], '#b08aff', 2.4);
    c.globalAlpha /= AP;
  }
};

// ===== SKY =====
CREATURE_ART.wooloft = function () {           // floating cloud sheep
  INK = '#4a5a8a';
  const fc = '#5d6db0';
  const y = -5 + W * 2, big = 1 + AP * .22;
  for (let i = 0; i < 4; i++) cv([-8 + i * 5, y - 6, -8 + i * 5 + Math.sin(T * 4 + i) * 1.2, y + 2], fc, 2.2);
  c.save(); c.translate(0, y - 17); c.scale(big, big);
  puff([-9, 3, 7, 0, 5, 7, 8, 3, 7, -11, -5, 7, 10, -5, 7, -5, -11, 7, 5, -11, 7, 0, -2, 10], '#ffffff');
  dot(-3, 7.6, 9, 2.6, 'rgba(255,190,210,.4)');
  c.restore();
  bl([3, y - 22, -1, y - 17, 3, y - 15], fc);
  el(9.5, y - 15.5, 7.2, 6.6, fc);
  cv([6, y - 21.6, 3.4, y - 24, 5.6, y - 26], '#ffd66a', 1.5); cv([13, y - 21.6, 15.6, y - 24, 13.4, y - 26], '#ffd66a', 1.5);
  eye(7, y - 16.6, .9, '#8fd0ff'); eye(13, y - 17, .9, '#8fd0ff');
  dot(11.6, y - 12.6, 1, .7, '#2f3a6a'); smile(11.6, y - 11.6, 1.2, '#2f3a6a');
};

CREATURE_ART.kickadee = function () {          // kick-boxing chickadee
  INK = '#2a2a3a';
  const cr = '#f5ecd8', cap = '#2f3140', wg = '#8e9ebc', hb = '#ff4a5c', lg = '#ff9a2e';
  pg([-9, -16, -21, -22 + TW * 2, -19, -14 + TW * 2, -10, -11], wg);
  const k = AT > 0 ? Ease.seg(AT, .15, .4) - Ease.seg(AT, .6, .9) : 0;
  cv([-3, -6, -3.6, -1.2 - Math.max(0, ST) * 2], lg, 1.6); ln([-6, -.6, -1, -.6], INK, 2.4);
  cv([3, -7, 5 + k * 12, -3 - k * 9], lg, 1.6); ln([4 + k * 12, -1.6 - k * 9, 9 + k * 14, -1.6 - k * 10], INK, 2.4);
  el(0, -15, 11, 10.6, cr);
  dot(2, -9, 6, 3.6, '#ffdcae');
  bl([-9, -14, -12, -8 - AP * 4, -3, -6, 0, -12], wg);
  bl([-8.6, -19, -7, -26, 1, -27.6, 9, -24, 8, -19.6, 0, -21], cap, 1.6);
  dot(7.6, -13.6, 3, 2.2, cap);
  cv([-9, -22, 0, -24.6, 9, -22], hb, 1.9);
  cv([-9, -22, -15, -24 + TW * 2, -18, -20 + TW * 3], hb, 1.5);
  pg([9.6, -18.4, 15, -16.6, 9.6, -15.2], '#3a3d50', 1.3);
  if (BK) ln([3, -18.4, 7, -18.4], '#fff', 1.4); else { dot(5, -18.6, 2.7, 3, '#fff'); dot(5.5, -18.4, 1.6, 2, '#17121f'); dot(4.6, -19.4, .7, .7, '#fff'); }
  blush(2, -14.4);
};

CREATURE_ART.hummingblur = function () {       // hyperactive hummingbird
  INK = '#0f4a3a';
  const bd = '#2fd0a0';
  const y = -21 + W * 1.2 + Math.sin(T * 17) * .5;
  pg([-7, y + 2, -15, y + 3 + TW, -13, y + 8 + TW, -5, y + 5], '#1a9a7a');
  const fr = Math.floor(T * 30) % 3;
  c.globalAlpha *= .45;
  for (let i = 0; i < 3; i++) el(-2 - i, y - 3 - i * 2 + (fr === i ? -2 : 0), 10, 3.2, '#c8fff0', -1.1 + i * .55 + (fr - 1) * .2, 1);
  c.globalAlpha /= .45;
  bl([-8, y + 4, -6, y - 5, 2, y - 8, 7, y - 3, 3, y + 4.6], bd);
  dot(-1, y + 2, 4.4, 2.6, '#f2fff8');
  el(6, y - 7, 5.6, 5.3, bd);
  dot(7.6, y - 3.6, 3.2, 2.2, '#ff4fa0');
  pg([10.4, y - 8.4, 25 + AP * 4, y - 9.4, 10.4, y - 6.4], '#2a3a4a', 1.1);
  eye(7.4, y - 8.4, .85);
  shine(-2, y - 4.4, 3, 1.2, -.5, .6);
};

CREATURE_ART.pelicannon = function () {        // pelican with an air-cannon beak
  INK = '#4a3a2a';
  const bd = '#ffffff', wg = '#9fb6d8', bk = '#ffb02e';
  dot(-5, -1.2, 4.2, 2, bk); dot(4, -1.2, 4.2, 2, bk);
  bl([-13, -3, -14.5, -17, -4, -24, 6, -22, 9, -10, 6, -3, -4, -1], bd);
  bl([-13, -8, -17, -16 + TW, -6, -19, -1, -11, -7, -6], wg);
  ln([-12, -11, -5, -13], '#7f98c0', 1.1); ln([-11, -8, -4, -10], '#7f98c0', 1.1);
  cv([2, -18, 3.6, -24], bd, 6.2);
  el(4, -28, 7.6, 7.2, bd);
  ln([1, -34.6, -1, -39, 3, -35.4, 3.6, -40, 5.6, -35], INK, 1.4);
  const rc = AT > 0 ? -Ease.seg(AT, .3, .4) * 4 + Ease.seg(AT, .4, .9) * 4 : 0, sw = AT > 0 ? Ease.seg(AT, 0, .3) * (1 - Ease.seg(AT, .35, .5)) : 0;
  c.save(); c.translate(rc, 0);
  bl([7, -24.6, 16, -19 + sw * 4, 25, -21.6, 25, -25.6, 8, -27], '#ffd98a');
  bl([6, -31.6, 25, -30.4, 26.4, -23.6, 7, -24], bk);
  el(25.6, -27, 2.6, 4.4, '#5a3a1a'); dot(25.8, -27, 1.3, 2.8, '#2a1a0a');
  c.restore();
  eye(3.6, -29.6, .95);
  blush(.4, -25.6);
};

CREATURE_ART.zephyray = function () {          // kite-shaped sky ray
  INK = '#2a4a8a';
  const bd = '#72baff', lt = '#e8f5ff', rb = '#ff7a9c';
  const y = -17 + W * 2, fl = W * 3 + AP * 5;
  const k1 = Math.sin(T * 4) * 3, k2 = Math.sin(T * 4 + 1.5) * 3;
  cv([-13, y, -20, y + 4 + k1, -27, y + 1 + k2, -33, y + 5 + k1], rb, 1.6);
  pg([-20, y + 4 + k1, -23, y + .5 + k1, -23, y + 7.5 + k1], '#ffd34a', 1.1); pg([-27, y + 1 + k2, -30, y - 2.5 + k2, -30, y + 4.5 + k2], '#7dffb0', 1.1);
  bl([-15, y, -3, y - 14 - fl, 17, y - 2, -2, y + 10 + fl * .5], bd);
  bl([-9, y, -2, y - 7 - fl * .5, 11, y - 1.4, -1, y + 5.4 + fl * .3], lt, 0);
  ln([-13, y, 15, y - 1.8], '#4f9ae8', 1.1);
  bl([13, y - 5.6, 19, y - 8.6, 17, y - 3.4], bd); bl([14, y + 1.4, 20, y + 3, 16, y - .6], bd);
  eye(7.4, y - 5, .95); eye(10, y + 1.6, .95);
  smile(13, y - 1.6, 1.4);
  blush(4.6, y - 1.6);
};

// ===== VENOM =====
CREATURE_ART.snoxious = function () {          // toxic snail
  INK = '#3a1f5a';
  const sh = '#a45fda', bd = '#bfe454';
  bl([-15, -1, -13, -6.6, 4, -7.6, 14, -11, 19, -6, 17, -1, 0, .6], bd);
  dot(-2, -1.6, 12, 1.6, '#e0f7a0');
  const hide = AT > 0 ? Ease.seg(AT, 0, .25) - Ease.seg(AT, .8, 1) : 0;
  c.save(); c.translate(-hide * 6, hide * 3);
  bl([10, -4, 9.6, -16, 16, -19, 20, -11, 18.6, -4], bd);
  const sw = W * 1.2;
  cv([11.6, -17, 10.6 + sw, -25], bd, 2); cv([17, -18, 18.6 + sw, -26], bd, 2);
  if (BK) { el(10.6 + sw, -26.6, 3.2, 3.2, bd); el(18.6 + sw, -27.6, 3.2, 3.2, bd); }
  else { el(10.6 + sw, -26.6, 3.3, 3.3, '#fff'); dot(11.3 + sw, -26.4, 1.5, 1.8, '#17121f'); el(18.6 + sw, -27.6, 3.3, 3.3, '#fff'); dot(19.3 + sw, -27.4, 1.5, 1.8, '#17121f'); }
  smile(16, -9.6, 1.9); blush(12, -9);
  c.restore();
  c.save(); c.translate(-3, -16); c.rotate(AT > 0 ? AT * TAU * 2 : 0);
  el(0, 0, 12.6, 12, sh);
  c.beginPath(); for (let i = 0; i < 40; i++) { const an = i * .32, rr = 10.4 - i * .25; c[i ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
  c.strokeStyle = '#dcb4ff'; c.lineWidth = 1.7; c.stroke();
  c.restore();
  for (let i = 0; i < 3; i++) { const k = (T * .6 + i / 3) % 1; el(-11 + i * 8, -27 - k * 9, 2 - k, 2 - k, 'rgba(170,255,90,.55)', 0, 1); }
};

CREATURE_ART.scorplet = function () {          // scorpion pup
  INK = '#4a1440';
  const bd = '#b96adc', lt = '#e2b4f5', st = '#a4ff4a';
  for (let i = 0; i < 2; i++) { const k = Math.sin(T * 12 + i * 2) * MV * 1.5; cv([-6 + i * 5, -4, -9 + i * 5, -1 - k], bd, 1.8); cv([4 + i * 4, -4, 7 + i * 4, -1 + k], bd, 1.8); }
  const j = AT > 0 ? Ease.seg(AT, .25, .45) - Ease.seg(AT, .55, .9) : 0;
  const tx = -3 + j * 20 + W, ty = -34 + j * 14;
  cv([-8, -11, -19, -18, -15, -33 + j * 4, tx - 3, ty], bd, 4.2);
  dot(-17.6, -19, 1.6, 1.6, lt); dot(-15.6, -29 + j * 3, 1.6, 1.6, lt);
  bl([tx - 4, ty - 3, tx + 3, ty - 4, tx + 9, ty + 3, tx + 1, ty + 3.6], st);
  if (j > .3) dot(tx + 10, ty + 5, 1.4, 2, '#a4ff4a');
  el(0, -9.5, 11.4, 8.4, bd);
  ln([-6, -16, -5, -3], '#8a3fb0', 1.2); ln([-1, -17.6, -.4, -1.6], '#8a3fb0', 1.2);
  dot(3, -5, 6, 2.4, lt);
  cv([8, -12, 13, -16, 15, -14], bd, 2.6); cv([9, -6, 14, -5], bd, 2.6);
  const claw = (x, y, o) => { bl([x - 3, y, x, y - 4 - o, x + 6, y - 3, x + 2, y], bd); bl([x - 3, y, x, y + 4 + o, x + 6, y + 3, x + 2, y], bd); };
  claw(16, -14.6, AP * 1.5); claw(15.6, -4.6, W * .5 + .5);
  eye(3, -11.6, 1.05); eye(9, -11, .95);
  smile(7.4, -6.6, 1.5); blush(1, -7.4);
};

CREATURE_ART.hopdart = function () {           // poison-dart frog
  INK = '#3a1f5a';
  const bd = '#ffd12e', lg = '#7d42c8', sp = '#5a2fa0';
  const cr = AT > 0 ? Ease.seg(AT, 0, .2) * (1 - Ease.seg(AT, .2, .3)) : 0;
  bl([-9, -5, -18, -11, -19, -3, -13, 0, -6, -1], lg); bl([9, -5, 18, -11, 19, -3, 13, 0, 6, -1], lg);
  dot(-16.6, -.8, 1.5, 1.5, '#b88af0'); dot(-13.6, .2, 1.5, 1.5, '#b88af0'); dot(16.6, -.8, 1.5, 1.5, '#b88af0'); dot(13.6, .2, 1.5, 1.5, '#b88af0');
  c.save(); c.translate(0, cr * 3); c.scale(1 + cr * .1, 1 - cr * .16);
  bl([-10.5, -3, -11.5, -13, 0, -18.5, 11.5, -13, 10.5, -3, 0, -1], bd);
  dot(0, -4.6, 7, 2.6, '#fff3b0');
  el(-5.4, -18.4, 4.7, 4.7, bd); el(6, -18.8, 4.7, 4.7, bd);
  if (BK) { ln([-7.6, -18.6, -3.2, -18.6], INK, 1.5); ln([3.8, -19, 8.2, -19], INK, 1.5); }
  else { dot(-4.8, -18.6, 2.6, 3, '#17121f'); dot(6.6, -19, 2.6, 3, '#17121f'); dot(-5.6, -19.8, 1, 1, '#fff'); dot(5.8, -20.2, 1, 1, '#fff'); }
  dot(-7, -11, 1.7, 1.4, sp); dot(7.6, -9, 1.9, 1.5, sp); dot(-2, -14.4, 1.3, 1.1, sp); dot(3, -7.4, 1.2, 1, sp);
  ln([-5.4, -10.4, .4, -8.4, 6.2, -10.6], INK, 1.4);
  blush(-7.6, -7.4); blush(8.4, -7.6);
  c.restore();
  cv([-5, -4, -6.6, -.8], lg, 2); cv([5, -4, 6.6, -.8], lg, 2);
};

CREATURE_ART.hissyfit = function () {          // tiny cobra with a big attitude
  INK = '#2a1f4a';
  const bd = '#8c6ce4', bel = '#ffeab0', pk = '#ff8ad0';
  cv([-12, -4, -19, -6, -21, -12 + TW * 2], bd, 2.6);
  el(-1, -5, 13.4, 5.4, bd); el(0, -9.6, 9.4, 4.4, bd);
  ln([-9, -3.4, 0, -2, 9, -3.4], '#6a4cc0', 1.2);
  const rear = AT > 0 ? Ease.seg(AT, 0, .35) - Ease.seg(AT, .45, .6) : 0, lx = -rear * 4, ly = -rear * 2;
  cv([0, -10, 2 + lx * .5, -19, 4 + lx, -25 + ly], bd, 6.4);
  ln([1.6, -11, 3.6 + lx * .5, -19], bel, 3);
  c.save(); c.translate(lx, ly);
  const hw = 1 + AP * .16;
  bl([4 - 12.6 * hw, -24, 4 - 13.6 * hw, -34.6, 0, -39, 4, -36.4, 8, -39, 4 + 13.6 * hw, -34.6, 4 + 12.6 * hw, -24, 4, -17.6], bd);
  dot(-4.6, -27, 2.6, 3.6, pk, .3); dot(12.8, -27.4, 2.6, 3.6, pk, -.3);
  el(5, -29.6, 6.7, 6.2, bd);
  eye(2.4, -30.6, .9, '#ffe14a'); eye(8.6, -31, .9, '#ffe14a');
  brow(2.2, -35, 1, .9); brow(9, -35.4, -1, .9);
  if (AP > .15) { openMouth(6.6, -26, 2.2, 1.6 + AP * 1.4); pg([5.2, -27.2, 5.8, -24.8, 6.6, -27.2], '#fff', .6); }
  else { ln([4.6, -26.4, 6.6, -25.6, 8.8, -26.6], INK, 1.3); const tg = Math.max(0, Math.sin(T * 6)); if (tg > .5) ln([8, -25.6, 12.6, -24.6, 14, -26], '#ff4a6a', 1.2); }
  c.restore();
};

CREATURE_ART.bubbrew = function () {           // living cauldron
  INK = '#1f0f33';
  const bd = '#55309a', gd = '#ffc93d', br = '#8fff5a';
  el(-8, -1.8, 3.4, 2.4, gd); el(8, -1.8, 3.4, 2.4, gd); el(0, -.8, 3.4, 2.4, gd);
  const tip = AT > 0 ? Math.sin(AT * PI) * .22 : 0;
  c.save(); c.translate(0, -12); c.rotate(tip); c.translate(0, 12);
  c.beginPath(); c.arc(-15, -17, 4, PI * .5, PI * 1.5); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = gd; c.lineWidth = 1.8; c.stroke();
  c.beginPath(); c.arc(15, -17, 4, -PI * .5, PI * .5); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = gd; c.lineWidth = 1.8; c.stroke();
  bl([-14, -6, -15.5, -18, -10, -24.6, 10, -24.6, 15.5, -18, 14, -6, 0, -1], bd);
  shine(-9, -16, 2.4, 6, .35, .22);
  el(0, -24.6, 13.2, 4.2, gd);
  dot(0, -24.8, 10.6, 2.8, br);
  for (let i = 0; i < 4; i++) { const k = (T * .8 + i * .27) % 1; el(-7 + i * 4.8 + Math.sin(T * 3 + i) * 1.4, -26 - k * (12 + AP * 8), 2.6 * (1 - k * .6), 2.6 * (1 - k * .6), 'rgba(160,255,110,' + (.75 * (1 - k)) + ')', 0, 1); }
  if (BK) { ln([-7, -14.4, -2.6, -14.4], br, 1.6); ln([3, -14.4, 7.4, -14.4], br, 1.6); }
  else { dot(-4.8, -14.6, 2.6, 3.4, br); dot(5.2, -14.6, 2.6, 3.4, br); dot(-5.6, -15.8, .9, .9, '#fff'); dot(4.4, -15.8, .9, .9, '#fff'); }
  smile(.2, -9.6, 2.2, br);
  star(.2, -5, 2.2, gd, 5, 0, .9);
  c.restore();
};

// ===== MYSTIC =====
CREATURE_ART.monolit = function () {           // rune-carved monolith
  INK = '#141a44';
  const bd = '#3d53bd', lt = '#5f7ae6', gd = '#ffd34a';
  const y = -3 + W * 1.4, g = .55 + W * .2 + AP * .45;
  for (let i = 0; i < 2; i++) { const an = T * 1.6 + i * PI; diamond(Math.cos(an) * 19, y - 18 + Math.sin(an) * 5, 2.4, 3.2, lt, 1.2); }
  el(-15, y - 13 - AP * 5, 3.8, 4.2, bd); el(15, y - 13 - AP * 5, 3.8, 4.2, bd);
  pg([-11, y, -12, y - 26, -6, y - 36, 7, y - 36, 12, y - 26, 11, y, 0, y + 3], bd);
  pg([-7, y - 4, -8, y - 25, -4, y - 32, 5, y - 32, 8, y - 25, 7, y - 4], lt, 0);
  c.globalAlpha *= clamp(g, 0, 1);
  c.beginPath(); c.arc(0, y - 28, 2.3, 0, TAU); c.strokeStyle = gd; c.lineWidth = 1.3; c.stroke();
  ln([-4, y - 9.6, 0, y - 13.6, 4, y - 9.6, -4, y - 9.6], gd, 1.3);
  ln([-5, y - 6, 5, y - 6], gd, 1.3); ln([0, y - 25.4, 0, y - 23], gd, 1.3);
  c.globalAlpha /= clamp(g, 0, 1);
  if (AP > .1) glow(0, y - 18, 12 + AP * 12, '#ffe27a', .5 * AP);
  if (BK) { ln([-5.6, y - 19, -1.6, y - 19], gd, 1.6); ln([2, y - 19, 6, y - 19], gd, 1.6); }
  else { dot(-3.6, y - 19, 2.2, 3, '#fff6c8'); dot(4, y - 19, 2.2, 3, '#fff6c8'); dot(-3.6, y - 18.6, 1.1, 1.7, '#ffb52e'); dot(4, y - 18.6, 1.1, 1.7, '#ffb52e'); }
};

CREATURE_ART.chipmonk = function () {          // chipmunk monk
  INK = '#4a2a14';
  const fur = '#dc8c4c', dk = '#6e3d20', cr = '#fff0d6', rb = '#ff9a2e', bd2 = '#6c4bd8';
  bl([-7, -3, -21, -8, -22, -27 + TW * 2, -11, -31 + TW * 2, -10, -17], fur);
  ln([-13, -8, -17, -18, -14, -27 + TW * 2], dk, 2.2);
  feet(-5, 6, -2, 4.6, 2.9, fur);
  bl([-10, -4, -11, -16, 0, -20, 10, -16, 9, -4, 0, -1], fur);
  bl([-10.6, -15, -4, -19.6, 8, -8, 9.6, -3.6, 0, -1, -6, -6], rb, 1.5);
  ln([-9, -11, 5, -3], '#e07a14', 1.1);
  el(-5, -32.6, 3, 3, fur); el(10, -33.2, 3, 3, fur);
  el(3, -25, 10.2, 9.2, fur);
  ln([-3, -32.6, 1, -28.6], dk, 1.9); ln([3.6, -33.8, 5.4, -29.4], cr, 1.6); ln([8, -33, 8.6, -29], dk, 1.9);
  dot(-2.6, -21.6, 4.6, 4, cr); dot(9.4, -22, 4.2, 3.8, cr);
  dot(4.4, -22, 2.6, 2, cr);
  if (BK || AP < .05) { smile(-.6, -26.4, 2.2); smile(8.4, -27, 2.2); } else { eye(-.6, -26.6); eye(8.4, -27.2); }
  dot(4.6, -23.2, 1.3, 1, INK);
  pg([3.6, -21.6, 5.6, -21.6, 5.4, -19.6, 3.8, -19.6], '#fff', .8);
  for (let i = 0; i < 6; i++) dot(-5 + i * 3.2, -17 + Math.sin(i / 5 * PI) * 2.2, 1.5, 1.5, bd2);
  const th = AT > 0 ? Ease.seg(AT, .2, .42) - Ease.seg(AT, .6, 1) : 0;
  cv([9, -12, 12 + th * 6, -13 - th * 2], fur, 2.6);
  el(13.6 + th * 9, -13.6 - th * 2, 3 + th, 4 + th * 1.4, cr);
  if (th > .3) glow(15 + th * 9, -14 - th * 2, 9 * th, '#b9a4ff', .7);
  el(-11, -11, 3.2, 3.2, fur);
};

CREATURE_ART.telemur = function () {           // teleporting lemur
  INK = '#2a1f4a';
  const fur = '#bcaceC', dk = '#3d2f66', gd = '#ffc93d';
  const tp = [-7, -7, -21, -8, -20, -27, -9, -33 + TW * 2, -9, -42 + TW * 3];
  curvePath(tp); c.strokeStyle = INK; c.lineWidth = 4.8 + LW * 1.7; c.stroke();
  c.strokeStyle = '#ffffff'; c.lineWidth = 4.8; c.stroke();
  c.setLineDash([4.2, 4.2]); c.lineCap = 'butt'; c.strokeStyle = '#7d5fe0'; c.stroke(); c.setLineDash([]); c.lineCap = 'round';
  star(-9, -45 + TW * 3, 4.6 + AP * 2, gd, 5, T * 1.4);
  feet(-4, 6, -2, 4.4, 2.8, dk);
  bl([-9, -4, -10, -15, 0, -19, 9, -15, 8, -4, 0, -1], fur);
  dot(1, -8.4, 4.6, 5, '#fff');
  pg([-5, -28, -8, -36, 0, -31], fur); pg([8, -31, 13, -37, 13, -28], fur);
  el(4, -23, 9.4, 8.4, '#fff');
  bl([-5.4, -25, -3, -31, 4, -32.4, 11, -31, 13.4, -25, 4, -28.6], fur, 1.4);
  dot(.2, -23.4, 4.2, 4.4, dk); dot(8.6, -23.8, 4, 4.3, dk);
  eye(.4, -23.4, .98, gd); eye(8.6, -23.8, .98, gd);
  dot(5.4, -19.2, 1.2, .9, INK); smile(5.4, -18, 1.4);
  el(10, -10 - AP * 3, 2.8, 2.8, dk); el(-9, -10, 2.8, 2.8, dk);
};

CREATURE_ART.mageling = function () {          // apprentice in violet, gold and teal
  INK = '#22103f';
  const rb = '#5d31ac', gd = '#ffc93d', tq = '#2fe0c8', fc = '#f4e8ff';
  const y = -2 + W * 1.4;
  bl([-10.5, y, -9.5, y - 14, 0, y - 18, 9.5, y - 14, 10.5, y, 5, y + 2.4, 0, y, -5, y + 2.4], rb);
  ln([-9.6, y - 3, -5, y - .6, 0, y - 3, 5, y - .6, 9.6, y - 3], gd, 1.6);
  diamond(0, y - 10, 2, 2.6, tq, 1.1);
  el(1, y - 20, 8.6, 7.6, fc);
  eye(-2.2, y - 20, 1, '#7d42e8'); eye(5, y - 20.4, 1, '#7d42e8');
  smile(1.6, y - 16.2, 1.5); blush(-4.6, y - 16.8); blush(8, y - 17.2);
  el(1, y - 26, 13.4, 3.7, rb, -.08);
  bl([-7, y - 27, -4, y - 40, -11, y - 47 + TW * 1.5, 1, y - 43, 8.6, y - 27.6], rb);
  bl([-6.6, y - 29.6, 1, y - 31, 8.4, y - 30.4, 8.2, y - 27.4, 1, y - 28, -6.8, y - 26.8], gd, 1.3);
  diamond(1, y - 29.4, 1.9, 1.9, tq, 1);
  star(-12, y - 49 + TW * 1.5, 3.4, gd, 5, T * 1.2, 1.1);
  const lift = AT > 0 ? Ease.seg(AT, 0, .4) - Ease.seg(AT, .7, 1) : 0;
  c.save(); c.translate(13, y - 9); c.rotate(.18 + lift * .75);
  cv([0, 2, 0, -15], '#a8743c', 1.6);
  glow(0, -17.6, 6 + lift * 9, tq, .45 + lift * .5);
  el(0, -17.6, 3.3, 3.3, tq); dot(-1, -18.6, 1, 1, '#fff');
  c.restore();
  el(12.6, y - 8.6, 2.6, 2.6, fc);
};

CREATURE_ART.lunafawn = function () {          // fawn crowned with a crescent moon
  INK = '#3a3470';
  const bd = '#d2c7ff', hf = '#6c5bd0', mn = '#ffe680';
  const leg = (x, ph) => { const k = MV ? Math.sin(T * 13 + ph) * 3 : 0; cv([x, -11, x + k * .4, -5, x + k, -1.4], bd, 2.2); el(x + k, -1.2, 1.9, 1.5, hf, 0, 1.3); };
  leg(-9, 0); leg(-4, PI); leg(5, PI); leg(9, 0);
  el(-12.4, -17 + TW, 2.6, 2.4, '#fff');
  bl([-12.5, -12, -11.5, -20.6, 0, -23.4, 9, -20.6, 10.5, -12, 0, -9], bd);
  dot(-6, -18, 1.5, 1.3, '#fff'); dot(-2, -20.4, 1.3, 1.1, '#fff'); dot(-8, -14.6, 1.2, 1, '#fff'); dot(2, -18.4, 1.2, 1, '#fff');
  dot(0, -11, 7, 2, '#fff');
  cv([7, -18, 10, -27], bd, 5.6);
  bl([6.6, -32, 1.6, -38.6, 8.6, -35.4], bd);
  el(11, -30.4, 7.2, 6.3, bd);
  dot(15.4, -28, 3.4, 2.6, '#fff'); dot(17.6, -28.8, 1.1, .9, hf);
  eye(11, -31.4, 1.1); ln([8.4, -34.6, 7, -36], INK, 1.1);
  blush(12, -27);
  const gy = -43 - AP * 3;
  glow(11, gy, 8 + AP * 10, mn, .45 + AP * .4);
  crescent(11, gy, 5.6, mn, -.5 + W * .05, 1.5);
};

// ===== SHADOW =====
CREATURE_ART.cryptoise = function () {         // tortoise carrying a little crypt
  INK = '#231a33';
  const sk = '#7462a0', sh = '#4d465e', stn = '#a29cb4', fl = '#b06aff';
  pg([-14, -6, -21, -3 + TW, -13, -3], sk);
  feet(-8, 8, -2, 4.8, 3, sk);
  bl([-15.5, -5, -15.5, -16, -4, -23.4, 8, -21, 13.5, -12, 12.5, -5, 0, -3], sh);
  ln([-10, -6, -8, -17], '#383244', 1.3); ln([-1, -4.6, 0, -21], '#383244', 1.3); ln([7, -5, 8, -18], '#383244', 1.3);
  const rise = AP * 3;
  c.save(); c.translate(-3, -20 - rise); c.rotate(-.08);
  bl([-6.5, 0, -6.5, -12, 0, -17.6, 6.5, -12, 6.5, 0], stn);
  crescent(-.6, -9, 3, null, .4, 0); c.strokeStyle = '#5d566e'; c.lineWidth = 1.2; c.stroke();
  ln([-3, -3.4, 3, -3.4], '#5d566e', 1.1);
  c.restore();
  el(7, -22.6, 1.6, 2.6, '#f0e6d2', 0, 1.2); flame(7, -25, 1.9, 5.4 + AP * 3, 0, fl, '#e8d0ff');
  dot(-11, -9, 3, 1.6, '#6fc45a'); dot(10, -19.4, 2, 1.2, '#6fc45a');
  el(15.4, -11, 7.2, 6.6, sk);
  if (BK) { ln([11.6, -12, 15, -12], INK, 1.5); ln([17, -12.4, 20, -12.4], INK, 1.5); }
  else { eye(13.4, -12, .9); eye(18.6, -12.4, .85); ln([10.8, -14.4, 16, -13.8], INK, 1.5); ln([16.6, -14, 21, -14.6], INK, 1.5); }
  smile(17, -7.6, 1.6); blush(12, -8);
};

CREATURE_ART.obsidrake = function () {         // black dragonet with crimson eyes
  INK = '#0f0a14';
  const bd = '#342f40', lt = '#524b62', rd = '#c42a3c', mb = '#8e2033';
  cv([-8, -6, -19, -4, -24, -12 + TW * 2], bd, 4);
  pg([-24, -12 + TW * 2, -31, -15 + TW * 2, -25, -20 + TW * 2, -21, -15 + TW * 2], rd);
  const fl = W * 2.5 + AP * 6;
  bl([-4, -19, -17, -35 - fl, -23, -23 - fl * .5, -17, -22, -15, -14, -9, -15], mb);
  ln([-4, -19, -17, -34 - fl], bd, 1.6); ln([-4, -19, -22, -23 - fl * .5], bd, 1.6);
  feet(-5, 6, -2, 5, 3, bd);
  pg([2, -.6, 4, -2.6, 6, -.6], '#fff', .8); pg([8, -.6, 10, -2.6, 11.6, -.8], '#fff', .8);
  bl([-10.5, -3, -12.5, -15, -4, -23.4, 6, -22, 11.5, -12, 9, -3, 0, -1], bd);
  dot(2, -9.4, 5.2, 6.2, rd); ln([-1.6, -12, 5.6, -12], '#e0566a', 1); ln([-2, -8.6, 6, -8.6], '#e0566a', 1); ln([-1, -5.4, 5, -5.4], '#e0566a', 1);
  pg([1, -29, -8, -37, 3.6, -25], lt); pg([7, -32, 3, -43, 11.6, -31], lt);
  el(8, -25.6, 9.2, 8.2, bd);
  const op = AT > 0 ? Ease.seg(AT, .1, .4) - Ease.seg(AT, .5, .62) : 0;
  bl([10, -28.6, 20.6, -27.4 - op * 2, 21, -23.6 - op * 2, 11, -22.6], bd);
  bl([10, -22.4, 19.6, -21.4 + op * 4, 11, -18.6 + op * 3], lt);
  pg([15, -23.4 - op, 16.2, -20.4 - op, 17.4, -23.4 - op * 1.2], '#fff', .8);
  if (op > .2) glow(19, -22, 8 * op, '#ff3a4a', .8);
  dot(19, -26.4 - op * 2, .7, .7, '#ff7a8a');
  if (BK) ln([5, -26.6, 10, -26], '#ff3a4a', 1.6);
  else { el(7.6, -26.4, 3.2, 3.4, '#fff', 0, 1.2); dot(8.2, -26.2, 2.2, 2.6, '#ff2a3c'); dot(8.5, -26, 1, 1.6, '#2a0a10'); dot(7, -27.6, .9, .9, '#fff'); }
  brow(7.6, -31, -1, 1.05);
  shine(-3, -19.4, 4, 1.4, -.4, .22);
};

CREATURE_ART.shinobat = function () {          // ninja bat
  INK = '#1a1030';
  const bd = '#62529a', mb = '#3f3368', sc = '#ff3a5c';
  const y = -17 + W * 1.5, fl = Math.sin(T * 11) * 5 - AP * 4;
  bl([-6, y - 2, -15, y - 9 + fl, -25, y - 3 + fl * 1.4, -20, y + 1 + fl, -16, y - 1 + fl * .6, -12, y + 3 + fl * .5, -7, y + 3], mb);
  bl([6, y - 2, 15, y - 9 + fl, 25, y - 3 + fl * 1.4, 20, y + 1 + fl, 16, y - 1 + fl * .6, 12, y + 3 + fl * .5, 7, y + 3], mb);
  pg([-7, y - 5, -9, y - 17, -1, y - 8], bd); pg([7, y - 5, 9, y - 17, 1, y - 8], bd);
  dot(-6, y - 10, 1.3, 3, '#ff9ab8', -.25); dot(6, y - 10, 1.3, 3, '#ff9ab8', .25);
  el(0, y, 8.8, 8.3, bd);
  cv([-2.6, y + 8, -3, y + 11], bd, 1.4); cv([2.6, y + 8, 3, y + 11], bd, 1.4);
  eye(-3.4, y - 2, 1, '#b48aff'); eye(3.8, y - 2, 1, '#b48aff');
  bl([-8.6, y + 1.6, 0, y + 3.6, 8.6, y + 1.6, 8, y + 6, 0, y + 8.6, -8, y + 6], sc, 1.5);
  bl([-7, y + 4, -14, y + 6 + TW * 2, -19, y + 3 + TW * 3, -15, y + 9 + TW * 2, -8, y + 7], sc, 1.4);
  pg([-1.6, y + 3.4, -.8, y + 5.6, 0, y + 3.6], '#fff', .6);
};

CREATURE_ART.lumbra = function () {            // hooded wisp with a lantern
  INK = '#1a1436';
  const ck = '#423878', lt = '#5f53a6', fc = '#c4ebff';
  const y = -6 + W * 2;
  glow(15.6, y - 19, 11 + W * 1.5 + AP * 8, '#5ad0ff', .4 + AP * .3);
  bl([-9, y - 2, -10.5, y - 18, -3, y - 27, 0, y - 33 + TW, 5, y - 27, 10.5, y - 18, 9, y - 4, 3, y + 1, -3, y + 6 + TW * 2, -8, y + 9 + TW * 3, -5, y + 1], ck);
  bl([-7, y - 6, -8, y - 16, 0, y - 12, 7, y - 7, 2, y - 3], lt, 0);
  el(2, y - 17.4, 6.7, 6.2, fc);
  eye(-.4, y - 18, .9); eye(5, y - 18.4, .9); smile(2.6, y - 14.4, 1.4);
  blush(-2.6, y - 14.8);
  const lift = AP * .5;
  c.save(); c.translate(9, y - 9); c.rotate(-lift);
  cv([0, 0, 6, -17], '#8a7a5a', 1.5);
  ln([6, -17, 7, -14.6], INK, 1.1);
  el(7, -9.6, 4.1, 5.1, 'rgba(150,225,255,.45)');
  flame(7, -7.2, 2.1, 5.6, 0, '#5ad0ff', '#e6fbff');
  ln([3.6, -14.4, 10.4, -14.4], '#ffd34a', 1.9); ln([4.4, -4.6, 9.6, -4.6], '#ffd34a', 1.9);
  c.restore();
  el(9, y - 9, 2.5, 2.5, lt);
};

CREATURE_ART.omencrow = function () {          // fortune-telling crow
  INK = '#120c22';
  const bd = '#332d52', sh = '#5d4fa6', gd = '#ffc93d', mg = '#ff4ad0';
  pg([-9, -9, -22, -11 + TW * 2, -21, -5 + TW * 2, -9, -4], bd); pg([-9, -7, -20, -3 + TW, -9, -2.6], sh);
  cv([-3, -5, -3.4, -1.4], gd, 1.5); ln([-6, -.8, -1, -.8], INK, 2.2); cv([4, -5, 4.4, -1.4], gd, 1.5); ln([2, -.8, 7, -.8], INK, 2.2);
  bl([-11, -4, -12.5, -17, -3, -24.4, 7, -22, 11, -12, 8, -4, 0, -2], bd);
  const up = AP * 9;
  bl([-10, -9, -15 - up * .6, -16 - up, -8, -21 - up * .4, 0, -14, -3, -7], sh);
  ln([-11, -13 - up * .5, -4, -14], '#8475d0', 1.1); ln([-9, -10.4 - up * .3, -3, -11], '#8475d0', 1.1);
  pg([2, -32, -2, -39, 5.6, -34], bd); pg([5, -33, 5, -41, 9, -33.6], bd);
  el(6, -26.4, 8.2, 7.7, bd);
  pg([11, -29, 22, -25.6, 11, -22.4], gd);
  ln([11.6, -25.6, 19, -25.6], '#c98a00', 1);
  eye(6.4, -27.4, 1.08, mg);
  diamond(4.4, -32.4, 1.6, 2, mg, 1);
  if (AP > .1) glow(4.4, -32.4, 4 + AP * 7, '#ff4ad0', AP * .8);
  ln([-1, -19, 3, -14.6, 8, -17.6], gd, 1.1);
  crescent(3.2, -12.6, 2.8, gd, .6, 1.1);
  shine(-5, -19.6, 4, 1.4, -.5, .25);
};
