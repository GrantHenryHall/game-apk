'use strict';
// ---------- creature art, part B: Frost, Sky, Venom, Mystic, Shadow ----------
// WD = wind-up, SK = strike, BW[i]/BS[i] = the same per hit for multi-hit moves, mark() = where the move leaves the body.

// ===== FROST =====
CREATURE_ART.yetuff = function () {            // fluffy yeti. Snowball Smash: hoists a snowball overhead with both hands and hurls it down
  INK = '#3a5a7a';
  const sk = '#84cdf5';
  const lx = lerp(-15, -8, WD) + SK * 23, ly = -13 - WD * 26 + SK * 3, rx = lerp(15, 8, WD) + SK * 3, ry = -13 - WD * 26 + SK * 2, up = WD > .2 || SK > .1;
  feet(-7, 7, -2.2, 5.6, 3.4, sk);
  J(0, -2, -WD * .08 + SK * .14);
  if (!up) { el(lx, ly, 4.6, 4.6, sk); el(rx, ry, 4.6, 4.6, sk); }
  puff([-8, -10, 7.5, 8, -10, 7.5, -11, -19, 7, 11, -19, 7, -6, -27, 7, 6, -27, 7, 0, -18, 12, 0, -31, 5], '#ffffff');
  dot(-5, -7, 7, 3, 'rgba(170,205,235,.45)'); dot(7, -6.6, 6, 2.6, 'rgba(170,205,235,.45)');
  el(2.5, -18.5, 8.4, 7.2, sk);
  eye(-.8, -19.6); eye(6.6, -20);
  if (WD > .3 || SK > .1) openMouth(3, -14.6, 2.2, 1.5 + SK * 1.2); else smile(3, -15.6, 1.9);
  blush(-3.6, -15.6); blush(9.4, -16);
  ln([-2, -33, 0, -36.6, 2, -33], INK, 1.3);
  if (up) {
    cv([-9, -22, (lx - 9) / 2, (ly - 22) / 2 - 3, lx, ly], '#ffffff', 3.4); cv([9, -22, (rx + 9) / 2 + 2, (ry - 22) / 2 - 3, rx, ry], '#ffffff', 3.4);
    if (WD === 0) swoosh(4, -20, 20, -1.7, -.1, 7, '#ffffff');
    el(lx, ly, 4.6, 4.6, sk); el(rx, ry, 4.6, 4.6, sk);
  }
  U();
  mark(0, -44);
};

CREATURE_ART.slapguin = function () {          // scarf-wearing penguin. Flipper Slap: a forehand slap, then a backhand from the other flipper
  INK = '#16264a';
  const bd = '#33549f', bk = '#ffb02e', sc = '#ff5a72';
  const w1 = BW[0], s1 = BS[0], w2 = BW[1], s2 = BS[1], st = (s1 + s2) * 3;
  const a1 = .5 - w1 * 2.4 - s1 * .7, a2 = -2.3 + s2 * 2.2;
  dot(-4, -1.2, 4, 2, bk); dot(5, -1.2, 4, 2, bk);
  if (w2 + s2 < .1) bl([-12, -9, -17, -13 + TW, -13, -20, -9, -13], bd);
  bl([-11, -2, -12.5, -20, -6, -31, 7, -31, 12.5, -20, 11, -2, 0, 0], bd);
  bl([-5.5, -3, -7, -15, -1, -20, 8, -20, 10, -12, 8, -3, 1, -1.6], '#fff', 0);
  dot(-1, -25, 4.2, 3.6, '#fff'); dot(7, -25.4, 3.8, 3.4, '#fff');
  eye(-.4, -25.2, .9); eye(6.8, -25.6, .9);
  if (AT > 0) { brow(-.4, -28.6, 1, .8); brow(6.8, -29, -1, .8); }
  pg([2, -23.4, 11.6, -21.6 - (s1 + s2) * .6, 2.4, -19.6 + (s1 + s2) * 1.2], bk);
  blush(-4, -21.6);
  bl([-9, -19.6, 0, -17, 10, -19.6, 10, -16.4, 0, -13.6, -9, -16.4], sc, 1.5);
  bl([-7, -17, -15 - st, -14 + TW * 1.5 - st * .5, -17 - st, -10 + TW * 2 - st * .5, -9, -13.6], sc, 1.5);
  if (w2 + s2 >= .1) {   // the far flipper comes across the front for the backhand
    const q = Math.min(1, (w2 + s2) * 3);
    if (BI === 1) swoosh(4, -16, 14, -2.3, -.1, 5, '#eaffff');
    c.save(); c.translate(4, -16); c.rotate(a2); c.scale(q, q); bl([-2, 0, 2, -3, 13, 1, 4, 4.6], bd); c.restore();
  }
  if (BI === 0) swoosh(11, -17, 14, -1.9, -.2, 5, '#eaffff');
  c.save(); c.translate(11, -17); c.rotate(a1); bl([-2, 0, 2, -3, 12, 1, 4, 4.6], bd); c.restore();
  if (BI === 1) mark(4 + Math.cos(a2) * 13, -16 + Math.sin(a2) * 13); else mark(11 + Math.cos(a1) * 12, -17 + Math.sin(a1) * 12);
};

CREATURE_ART.lynxicle = function () {          // icicle-eared lynx. Blizzard Pounce: wiggles low, leaps with claws out front, lands on them
  INK = '#2a4a6a';
  const fur = '#d3ebff', mk = '#8fc0ea', ice = '#7fe3ff';
  const co = AT > 0 && AT < .15 ? AT / .15 : 0, j = AT > 0 ? Ease.seg(AT, .15, .55) : 0, air = j > 0 && j < 1 ? Math.sin(j * PI) : 0;
  const reach = j > 0 ? (j < 1 ? Ease.outCubic(j) : 1 - Ease.seg(AT, .58, .8)) : 0, eb = co * 4 + air * 5;
  el(-13 - air * 3, -11 + TW + Math.sin(T * 40) * co * 2, 3.6, 3.2, fur);
  el(-8 - air * 7, -2 - Math.max(0, ST) * 3 - air * 3, 4.6 + air, 3, fur);
  const p1x = 7 + reach * 9, p1y = -2 - Math.max(0, -ST) * 3 - reach * 6, p2x = 12 + reach * 8, p2y = -2 - reach * 3;
  if (reach > .3) { for (let i = -1; i <= 1; i++) pg([p2x + 3.4, p2y + i * 1.8 - .7, p2x + 7.4, p2y + i * 2.2, p2x + 3.4, p2y + i * 1.8 + .7], '#eaffff', .7); el(p2x, p2y, 4.4, 2.9, fur, -reach * .3); }
  el(p1x, p1y, 4.6, 3, fur, -reach * .3);
  J(0, -4, co * .18 - air * .1);
  bl([-13, -4, -13.5, -14, -2, -18.5, 10, -15, 12, -5, 0, -2], fur);
  dot(-7, -13, 1.6, 1.3, mk); dot(-3, -15.4, 1.4, 1.1, mk); dot(-9.4, -8.6, 1.4, 1.2, mk);
  pg([1, -17, -4, -13, 2.6, -12.6], '#fff'); pg([17, -18, 21.6, -14, 16, -13], '#fff');
  pg([2, -25, 0 - eb, -37 + eb * .8, 8, -28], fur); pg([12, -28, 18 - eb, -37.4 + eb * .8, 17.4, -25], fur);
  pg([.6 - eb * .8, -34 + eb * .7, -.6 - eb * 1.2, -41 + eb, 2.6 - eb * .8, -35.6 + eb * .7], ice, 1.2); pg([17.4 - eb * .8, -34.6 + eb * .7, 19.6 - eb * 1.2, -41.4 + eb, 19 - eb * .8, -35 + eb * .7], ice, 1.2);
  el(9, -20.5, 9.6, 8.6, fur);
  dot(11.4, -17.6, 4.4, 3, '#fff');
  pg([10.4, -19.6, 12.8, -19.6, 11.6, -18.2], '#ff8fa8', .9);
  if (reach > .45) { openMouth(11.6, -16.4, 2.2, 1.6); pg([10.2, -17.4, 10.8, -15.8, 11.4, -17.4], '#fff', .6); pg([12, -17.4, 12.6, -15.8, 13.2, -17.4], '#fff', .6); }
  else { smile(10.2, -17, 1.3); smile(13, -17.1, 1.3); }
  eye(5.6, -22, 1, '#35b6ff'); eye(14, -22.6, 1, '#35b6ff');
  if (AT > 0) { brow(5.6, -26.2, 1, .9); brow(14, -26.8, -1, .9); }
  ln([9, -27.4, 9.6, -24.6], mk, 1.3);
  U();
  mark(20, -5);
};

CREATURE_ART.rimeling = function () {          // pearl-white ice dragonet. Frost Ray: rears back filling its chest, then lunges and breathes
  INK = '#34558a';
  const bd = '#f4f9ff', sh = '#bcd8f5', wg = '#9fd2ff';
  cv([-8, -6, -19, -4, -24, -12 + TW * 2 - SK * 3, -19 - SK * 3, -18 + TW * 2 - SK * 2], bd, 3.4);
  pg([-19 - SK * 3, -18 + TW * 2 - SK * 2, -25 - SK * 3, -22 + TW * 2 - SK * 2, -17 - SK * 3, -23 + TW * 2 - SK * 2], wg);
  const fl = W * 2.5 + WD * 7 - SK * 5;
  bl([-3, -20, -15, -37 - fl, -22, -24 - fl * .4, -12, -18], wg);
  ln([-4, -20, -15.5, -30 - fl * .7], '#6fb0ea', 1.1); ln([-4, -20, -18, -25 - fl * .4], '#6fb0ea', 1.1);
  feet(-5, 5, -2, 4.4, 2.8, bd);
  bl([-9, -3, -10.5 - WD, -16, -2, -22 - WD, 7 + WD, -20, 10, -8, 6, -3], bd);
  dot(2, -9.6, 4.6 + WD * 1.3, 6 + WD * 1.2, sh); ln([-1, -12, 5, -12], '#fff', 1); ln([-1, -8.6, 5, -8.6], '#fff', 1);
  J(4, -19, -WD * .34 + SK * .2, -WD * 2.5 + SK * 4, SK * .5);
  pg([2, -31, -8, -39, 3, -27], sh); pg([6, -33, 1, -44, 10, -32], bd);
  el(8, -27, 8.2, 7.2, bd);
  const op = WD * .45 + SK;
  if (op > .12) {
    bl([10, -29.6, 20, -29 - op * .6, 20.6, -25.6 - op * .4, 11, -24.6], bd); bl([10, -23.6, 19, -22.6 + op * 2.2, 11, -20 + op * 2.2], bd);
    glow(20, -24, 4 + WD * 5 + SK * 7, '#aef2ff', WD * .5 + SK * .9);
  } else bl([10, -29.6, 20, -27.6, 20, -22.6, 10, -21], bd);
  dot(18.6, -26.6 - op * .8, .7, .7, INK);
  eye(8.2, -27.6, 1.1, '#1e6aff'); brow(8.4, -32.4, -1, .9);
  mark(20.5, -24.4);
  U();
  shine(-2, -18.4, 4, 1.4, -.3, .7);
};

CREATURE_ART.auroseal = function () {          // aurora seal pup. Aurora Veil: lifts a flipper, throws its head back, and sings the lights down
  INK = '#3a4a6a';
  const bd = '#f8fbff', sh = '#d5e5f6';
  bl([-14, -6, -22, -13 + TW * 2 - SK * 4, -27, -8 + TW * 2 - SK * 6, -22, -6, -26, -1 - SK * 3, -16, -2], sh);
  bl([-16, -3, -14.5, -13, -2, -18, 8, -18, 12, -10, 12, -3, -2, -1], bd);
  ln([-12, -10.6, -6, -15, 1, -15.6], '#5fffc0', 2 + SK); ln([-13, -7.6, -6, -12, 2, -12.6], '#b08aff', 2 + SK); ln([-12.6, -4.8, -5, -9, 2, -9.6], '#ff8ad8', 2 + SK);
  bl([3, -4, 9, -2.6 - WD * 8 + SK * 2, 16, -1 - WD * 11 + SK, 7, -.2], sh);
  J(9, -11, -WD * .18 - SK * .32);
  el(9, -17, 9.8, 8.8, bd);
  eyes(5, -18.4, 13.4, -18.8, 1.15, undefined, SK > .3);
  dot(9.8, -14.6, 1.5, 1.1, INK);
  if (SK > .2) openMouth(9.8, -12.2, 1.8, 1.6 + SK * .8); else { smile(8.6, -13.2, 1.2); smile(11, -13.3, 1.2); }
  dot(5.4, -13.4, .6, .6, '#9ab0c8'); dot(4, -12, .6, .6, '#9ab0c8'); dot(14, -13.6, .6, .6, '#9ab0c8'); dot(15.6, -12.4, .6, .6, '#9ab0c8');
  blush(2.4, -14.4); blush(16.6, -15);
  U();
  const al = Math.max(WD * .6, SK);
  if (al > .05) {
    c.globalAlpha *= al;
    ln([-8, -30, 0, -34 + W, 8, -30, 16, -34 - W], '#5fffc0', 2.4); ln([-8, -33, 0, -37 + W, 8, -33, 16, -37 - W], '#b08aff', 2.4); ln([-8, -36, 0, -40 + W, 8, -36, 16, -40 - W], '#ff8ad8', 2);
    c.globalAlpha /= al;
  }
  mark(10, -31);
};

// ===== SKY =====
CREATURE_ART.wooloft = function () {           // floating cloud sheep. Cloud Bump: scrunches its face and puffs right up, then bounces in feet-first
  INK = '#4a5a8a';
  const fc = '#5d6db0';
  const y = -5 + W * 2, big = 1 + WD * .06;
  for (let i = 0; i < 4; i++) cv([-8 + i * 5, y - 6, -8 + i * 5 + Math.sin(T * 4 + i) * 1.2 + SK * 5, y + 2 - WD * 4 - SK], fc, 2.2);
  c.save(); c.translate(0, y - 17); c.scale(big, big);
  puff([-9, 3, 7, 0, 5, 7, 8, 3, 7, -11, -5, 7, 10, -5, 7, -5, -11, 7, 5, -11, 7, 0, -2, 10], '#ffffff');
  dot(-3, 7.6, 9, 2.6, 'rgba(255,190,210,.4)');
  c.restore();
  bl([3, y - 22, -1, y - 17, 3, y - 15], fc);
  el(9.5, y - 15.5, 7.2 + WD * .8, 6.6 + WD * .5, fc);
  cv([6, y - 21.6, 3.4, y - 24, 5.6, y - 26], '#ffd66a', 1.5); cv([13, y - 21.6, 15.6, y - 24, 13.4, y - 26], '#ffd66a', 1.5);
  const b0 = INK; INK = '#e8eeff';
  eyes(7, y - 16.6, 13, y - 17, .9 + SK * .25, WD > .4 ? undefined : '#8fd0ff', WD > .4);
  INK = b0;
  if (WD > .2) { dot(4.4, y - 13, 2.4 * WD, 1.8 * WD, 'rgba(255,150,180,.6)'); dot(15, y - 13.4, 2.4 * WD, 1.8 * WD, 'rgba(255,150,180,.6)'); }
  dot(11.6, y - 12.6, 1, .7, '#2f3a6a');
  if (SK > .2) el(11.6, y - 10.8, 1.3, 1.5, '#2f3a6a', 0, 0); else smile(11.6, y - 11.6, 1.2, '#2f3a6a');
  mark(17, y - 14);
};

CREATURE_ART.kickadee = function () {          // kick-boxing chickadee. Gale Kick: tucks a knee, then whips the leg out through the spin
  INK = '#2a2a3a';
  const cr = '#f5ecd8', cap = '#2f3140', wg = '#8e9ebc', hb = '#ff4a5c', lg = '#ff9a2e';
  const fx = 5 - WD + SK * 17, fy = -3 - WD * 5 - SK * 9;
  pg([-9, -16, -21, -22 + TW * 2 - SK * 3, -19, -14 + TW * 2 - SK * 3, -10, -11], wg);
  cv([-3, -6, -3.6, -1.2 - Math.max(0, ST) * 2], lg, 1.6); ln([-6, -.6, -1, -.6], INK, 2.4);
  streak(fx - 15, fy + 4, fx + 4, fy + 1, 8, '#ffffff');
  cv([3, -7, 5 + WD * 4 + SK * 6, -9 - WD * 2 - SK * 3, fx, fy], lg, 1.6 + SK * .4);
  ln([fx - 1, fy + 1.4, fx + 5 + SK * 2.5, fy + 1.4 - SK * 1.6], INK, 2.4 + SK);
  el(0, -15, 11, 10.6, cr);
  dot(2, -9, 6, 3.6, '#ffdcae');
  bl([-9, -14, -12 - WD * 5, -8 - WD * 9 + SK * 5, -3 - WD * 2, -6 - WD * 2, 0, -12], wg);
  bl([-8.6, -19, -7, -26, 1, -27.6, 9, -24, 8, -19.6, 0, -21], cap, 1.6);
  dot(7.6, -13.6, 3, 2.2, cap);
  cv([-9, -22, 0, -24.6, 9, -22], hb, 1.9);
  cv([-9, -22, -15 - SK * 4, -24 + TW * 2 - SK * 3, -18 - SK * 5, -20 + TW * 3 - SK * 4], hb, 1.5);
  if (SK > .25) { pg([9.6, -18.8, 15, -18.2, 9.6, -16.6], '#3a3d50', 1.3); pg([9.6, -16.4, 14, -14.4, 9.6, -14.6], '#3a3d50', 1.3); }
  else pg([9.6, -18.4, 15, -16.6, 9.6, -15.2], '#3a3d50', 1.3);
  if (BK) ln([3, -18.4, 7, -18.4], '#fff', 1.4); else { dot(5, -18.6, 2.7, 3, '#fff'); dot(5.5, -18.4, 1.6, 2, '#17121f'); dot(4.6, -19.4, .7, .7, '#fff'); }
  blush(2, -14.4);
  mark(fx + 7, fy);
};

CREATURE_ART.hummingblur = function () {       // hyperactive hummingbird. Needle Flurry: five beak thrusts, a blur of wings
  INK = '#0f4a3a';
  const bd = '#2fd0a0';
  let th = 0, wn = 0; for (let i = 0; i < 5; i++) { th += BS[i]; wn += BW[i]; }
  const y = -21 + W * 1.2 + Math.sin(T * 17) * .5, hx = th * 2 - wn * 1.5;
  pg([-7, y + 2, -15, y + 3 + TW, -13, y + 8 + TW, -5, y + 5], '#1a9a7a');
  const fr = Math.floor(T * (30 + (AT > 0 ? 20 : 0))) % 3;
  c.globalAlpha *= .45;
  for (let i = 0; i < 3; i++) el(-2 - i, y - 3 - i * 2 + (fr === i ? -2 : 0), 10, 3.2, '#c8fff0', -1.1 + i * .55 + (fr - 1) * .2, 1);
  c.globalAlpha /= .45;
  bl([-8, y + 4, -6, y - 5, 2, y - 8, 7, y - 3, 3, y + 4.6], bd);
  dot(-1, y + 2, 4.4, 2.6, '#f2fff8');
  el(6 + hx, y - 7, 5.6, 5.3, bd);
  dot(7.6 + hx, y - 3.6, 3.2, 2.2, '#ff4fa0');
  streak(12 + hx, y - 8, 27 + hx + th * 6, y - 9, 4, '#ffffff');
  pg([10.4 + hx, y - 8.4, 25 + hx + th * 6, y - 9.4 + th * .6, 10.4 + hx, y - 6.4], '#2a3a4a', 1.1);
  eye(7.4 + hx, y - 8.4, .85);
  shine(-2, y - 4.4, 3, 1.2, -.5, .6);
  mark(25 + hx + th * 6, y - 9);
};

CREATURE_ART.pelicannon = function () {        // pelican with an air-cannon beak. Air Cannon: gulps its pouch full, levels the beak, and fires
  INK = '#4a3a2a';
  const bd = '#ffffff', wg = '#9fb6d8', bk = '#ffb02e';
  dot(-5, -1.2, 4.2, 2, bk); dot(4, -1.2, 4.2, 2, bk);
  bl([-13, -3, -14.5, -17, -4, -24, 6, -22, 9, -10, 6, -3, -4, -1], bd);
  bl([-13, -8, -17 - SK * 4, -16 + TW - SK * 5, -6, -19, -1, -11, -7, -6], wg);
  ln([-12, -11, -5, -13], '#7f98c0', 1.1); ln([-11, -8, -4, -10], '#7f98c0', 1.1);
  J(3, -20, -WD * .3 + SK * .14, SK * 1.5 - WD, 0);
  cv([2, -18, 3.6, -24], bd, 6.2);
  el(4, -28, 7.6, 7.2, bd);
  ln([1, -34.6, -1 - SK * 3, -39, 3 - SK * 2, -35.4, 3.6 - SK * 3, -40, 5.6, -35], INK, 1.4);
  bl([7, -24.6, 16, -19 + WD * 8.5, 25, -21.6 + WD * 2.5, 25, -25.6, 8, -27], '#ffd98a');
  if (WD > .3) ln([12, -20 + WD * 4, 18, -19 + WD * 5], '#e0a84a', 1);
  bl([6, -31.6, 25, -30.4, 26.4, -23.6, 7, -24], bk);
  el(25.6, -27, 2.6 + SK * .9, 4.4 + SK * 1.1, '#5a3a1a'); dot(25.8, -27, 1.3 + SK * .6, 2.8 + SK * .8, '#2a1a0a');
  eye(3.6, -29.6, .95 + WD * .35);
  blush(.4, -25.6);
  mark(27, -27);
  U();
};

CREATURE_ART.zephyray = function () {          // kite-shaped sky ray. Twister: lifts its fins high and beats them down to spin up the wind
  INK = '#2a4a8a';
  const bd = '#72baff', lt = '#e8f5ff', rb = '#ff7a9c';
  const y = -17 + W * 2, fl = W * 3 + WD * 8 - SK * 10, am = 1 + WD;
  const k1 = Math.sin(T * 4) * 3 * am, k2 = Math.sin(T * 4 + 1.5) * 3 * am;
  cv([-13, y, -20, y + 4 + k1, -27, y + 1 + k2, -33, y + 5 + k1], rb, 1.6);
  pg([-20, y + 4 + k1, -23, y + .5 + k1, -23, y + 7.5 + k1], '#ffd34a', 1.1); pg([-27, y + 1 + k2, -30, y - 2.5 + k2, -30, y + 4.5 + k2], '#7dffb0', 1.1);
  bl([-15, y, -3, y - 14 - fl, 17, y - 2, -2, y + 10 + fl * .5], bd);
  bl([-9, y, -2, y - 7 - fl * .5, 11, y - 1.4, -1, y + 5.4 + fl * .3], lt, 0);
  ln([-13, y, 15, y - 1.8], '#4f9ae8', 1.1);
  bl([13, y - 5.6, 19, y - 8.6, 17, y - 3.4], bd); bl([14, y + 1.4, 20, y + 3, 16, y - .6], bd);
  eye(7.4, y - 5, .95); eye(10, y + 1.6, .95);
  if (SK > .25) openMouth(13, y - 1.4, 1.4, 1.2); else smile(13, y - 1.6, 1.4);
  blush(4.6, y - 1.6);
  mark(0, y - 2);
};

// ===== VENOM =====
CREATURE_ART.snoxious = function () {          // toxic snail. Shell Spray: pulls its head in and spins its shell, spraying as it goes
  INK = '#3a1f5a';
  const sh = '#a45fda', bd = '#bfe454';
  bl([-15, -1, -13, -6.6, 4, -7.6, 14, -11, 19, -6, 17, -1, 0, .6], bd);
  dot(-2, -1.6, 12, 1.6, '#e0f7a0');
  const hide = AT > 0 ? Ease.seg(AT, 0, .25) - Ease.seg(AT, .8, 1) : 0, hot = Math.max(WD, SK);
  c.save(); c.translate(-hide * 6, hide * 3); c.scale(1 - hide * .25, 1 - hide * .25);
  bl([10, -4, 9.6, -16, 16, -19, 20, -11, 18.6, -4], bd);
  const sw = W * 1.2;
  cv([11.6, -17, 10.6 + sw, -25], bd, 2); cv([17, -18, 18.6 + sw, -26], bd, 2);
  if (BK || hide > .4) { el(10.6 + sw, -26.6, 3.2, 3.2, bd); el(18.6 + sw, -27.6, 3.2, 3.2, bd); ln([8.6 + sw, -26.6, 12.6 + sw, -26.6], INK, 1.3); ln([16.6 + sw, -27.6, 20.6 + sw, -27.6], INK, 1.3); }
  else { el(10.6 + sw, -26.6, 3.3, 3.3, '#fff'); dot(11.3 + sw, -26.4, 1.5, 1.8, '#17121f'); el(18.6 + sw, -27.6, 3.3, 3.3, '#fff'); dot(19.3 + sw, -27.4, 1.5, 1.8, '#17121f'); }
  smile(16, -9.6, 1.9); blush(12, -9);
  c.restore();
  if (hot > .1) glow(-3, -16, 13 + hot * 9, '#a4ff4a', hot * .55);
  c.save(); c.translate(-3, -16); c.rotate(AT > 0 ? Ease.inOut(AT) * TAU * 3 : 0);
  el(0, 0, 12.6, 12, sh);
  c.beginPath(); for (let i = 0; i < 40; i++) { const an = i * .32, rr = 10.4 - i * .25; c[i ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
  c.strokeStyle = hot > .3 ? '#eaffb0' : '#dcb4ff'; c.lineWidth = 1.7; c.stroke();
  c.restore();
  for (let i = 0; i < 3; i++) { const k = (T * (.6 + hot) + i / 3) % 1; el(-11 + i * 8, -27 - k * 9, 2 - k, 2 - k, 'rgba(170,255,90,.55)', 0, 1); }
  mark(-3, -16);
};

CREATURE_ART.scorplet = function () {          // scorpion pup. Tail Sting: coils its tail high behind it and whips the stinger over its head
  INK = '#4a1440';
  const bd = '#b96adc', lt = '#e2b4f5', st = '#a4ff4a';
  for (let i = 0; i < 2; i++) { const k = Math.sin(T * 12 + i * 2) * MV * 1.5; cv([-6 + i * 5, -4, -9 + i * 5, -1 - k], bd, 1.8); cv([4 + i * 4, -4, 7 + i * 4, -1 + k], bd, 1.8); }
  const tx = -3 - WD * 7 + SK * 27 + W * (1 - SK), ty = -34 - WD * 5 + SK * 22;
  if (BI === 0 && WD === 0) swoosh(2, -14, 26, -2.5, -.25, 7, '#eaffb0');
  cv([-8, -11, -19 + SK * 9, -18 - WD * 3 + SK * 2, -15 - WD * 3 + SK * 18, -33 - WD * 6 + SK * 5, tx - 3, ty], bd, 4.2);
  dot(-17 + SK * 8, -19 - WD * 2 + SK, 1.6, 1.6, lt); dot(-15.6 - WD * 2 + SK * 16, -30 - WD * 5 + SK * 5, 1.6, 1.6, lt);
  c.save(); c.translate(tx, ty); c.rotate(SK * .9 - WD * .3);
  bl([-4, -3, 3, -4, 9, 3, 1, 3.6], st);
  if (WD > .4 || SK > .3) dot(9.6, 5, 1.4, 2, '#a4ff4a');
  mark(9, 3);
  c.restore();
  J(0, -5, SK * .1 - WD * .05);
  el(0, -9.5, 11.4, 8.4, bd);
  ln([-6, -16, -5, -3], '#8a3fb0', 1.2); ln([-1, -17.6, -.4, -1.6], '#8a3fb0', 1.2);
  dot(3, -5, 6, 2.4, lt);
  cv([8, -12, 13, -16 - WD * 2, 15, -14 - WD * 3], bd, 2.6); cv([9, -6, 14, -5], bd, 2.6);
  const claw = (x, y, o) => { bl([x - 3, y, x, y - 4 - o, x + 6, y - 3 - o * .5, x + 2, y], bd); bl([x - 3, y, x, y + 4 + o, x + 6, y + 3 + o * .5, x + 2, y], bd); };
  claw(16, -14.6 - WD * 3, WD * 2.4); claw(15.6, -4.6, W * .5 + .5 + WD * 1.6);
  eye(3, -11.6, 1.05); eye(9, -11, .95);
  if (AT > 0) { brow(3, -15.6, 1, .9); brow(9, -14.8, -1, .8); }
  smile(7.4, -6.6, 1.5); blush(1, -7.4);
  U();
};

CREATURE_ART.hopdart = function () {           // poison-dart frog. Dart Leap: throat swells in the crouch, legs trail in the air, splats on
  INK = '#3a1f5a';
  const bd = '#ffd12e', lg = '#7d42c8', sp = '#5a2fa0';
  const cr = AT > 0 && AT < .12 ? AT / .12 : 0, j = AT > 0 ? Ease.seg(AT, .12, .4) : 0, air = j > 0 && j < 1 ? Math.sin(j * PI) : 0;
  const bk = AT > .55 ? Math.sin(Ease.seg(AT, .55, .95) * PI) : 0, fly = Math.max(air, bk);
  bl([-9, -5, -18 - fly * 5, -11 + fly * 8, -19 - fly * 9, -3 + fly * 7, -13 - fly * 5, fly * 4, -6, -1], lg);
  bl([9, -5, 18 - fly * 12, -11 + fly * 12, 19 - fly * 16, -3 + fly * 8, 13 - fly * 10, fly * 4, 6, -1], lg);
  dot(-16.6 - fly * 9, -.8 + fly * 6, 1.5, 1.5, '#b88af0'); dot(-13.6 - fly * 6, .2 + fly * 5, 1.5, 1.5, '#b88af0');
  dot(16.6 - fly * 16, -.8 + fly * 7, 1.5, 1.5, '#b88af0'); dot(13.6 - fly * 11, .2 + fly * 5, 1.5, 1.5, '#b88af0');
  c.save(); c.translate(0, cr * 3); c.scale(1 + cr * .1, 1 - cr * .16);
  bl([-10.5, -3, -11.5, -13, 0, -18.5, 11.5, -13, 10.5, -3, 0, -1], bd);
  dot(0, -4.6 + cr, 7 + cr * 2, 2.6 + cr * 2.6, '#fff3b0');
  el(-5.4, -18.4, 4.7, 4.7, bd); el(6, -18.8, 4.7, 4.7, bd);
  if (BK) { ln([-7.6, -18.6, -3.2, -18.6], INK, 1.5); ln([3.8, -19, 8.2, -19], INK, 1.5); }
  else { dot(-4.8, -18.6, 2.6, 3, '#17121f'); dot(6.6, -19, 2.6, 3, '#17121f'); dot(-5.6, -19.8, 1, 1, '#fff'); dot(5.8, -20.2, 1, 1, '#fff'); }
  dot(-7, -11, 1.7, 1.4, sp); dot(7.6, -9, 1.9, 1.5, sp); dot(-2, -14.4, 1.3, 1.1, sp); dot(3, -7.4, 1.2, 1, sp);
  if (air > .3) openMouth(.4, -9.4, 3.4, 1.8); else ln([-5.4, -10.4, .4, -8.4, 6.2, -10.6], INK, 1.4);
  blush(-7.6, -7.4); blush(8.4, -7.6);
  c.restore();
  cv([-5, -4, -6.6 + fly * 5, -.8 - fly * 4], lg, 2); cv([5, -4, 6.6 + fly * 7, -.8 - fly * 5], lg, 2);
  if (fly > .3) { dot(-1.6 + fly * 5, -.8 - fly * 4, 1.5, 1.5, '#b88af0'); dot(6.6 + fly * 7, -.8 - fly * 5, 1.5, 1.5, '#b88af0'); }
  mark(9, -8);
};

CREATURE_ART.hissyfit = function () {          // tiny cobra with a big attitude. Venom Spit: rears back with its hood flared, then lunges and spits
  INK = '#2a1f4a';
  const bd = '#8c6ce4', bel = '#ffeab0', pk = '#ff8ad0';
  cv([-12, -4, -19, -6, -21, -12 + TW * 2 + Math.sin(T * 30) * WD * 2], bd, 2.6);
  el(-1, -5, 13.4, 5.4, bd); el(0, -9.6, 9.4, 4.4, bd);
  ln([-9, -3.4, 0, -2, 9, -3.4], '#6a4cc0', 1.2);
  const lx = -WD * 5 + SK * 8, ly = -WD * 3 + SK * 4;
  cv([0, -10, 2 + lx * .5, -19, 4 + lx, -25 + ly], bd, 6.4);
  ln([1.6, -11, 3.6 + lx * .5, -19], bel, 3);
  c.save(); c.translate(lx, ly);
  const hw = 1 + WD * .22 + SK * .08;
  bl([4 - 12.6 * hw, -24, 4 - 13.6 * hw, -34.6, 0, -39, 4, -36.4, 8, -39, 4 + 13.6 * hw, -34.6, 4 + 12.6 * hw, -24, 4, -17.6], bd);
  dot(4 - 8.6 * hw, -27, 2.6, 3.6, pk, .3); dot(4 + 8.8 * hw, -27.4, 2.6, 3.6, pk, -.3);
  el(5, -29.6, 6.7 + WD * .7, 6.2, bd);
  eye(2.4, -30.6, .9, '#ffe14a'); eye(8.6, -31, .9, '#ffe14a');
  brow(2.2, -35, 1, .9); brow(9, -35.4, -1, .9);
  if (SK > .15) { openMouth(6.8, -25.8, 2.4, 1.7 + SK * 1.5); pg([5.2, -27.2, 5.8, -24.6, 6.6, -27.2], '#fff', .6); pg([7.4, -27.2, 8, -24.8, 8.8, -27.2], '#fff', .6); }
  else { ln([4.6, -26.4, 6.6, -25.6, 8.8, -26.6], INK, 1.3); const tg = Math.max(0, Math.sin(T * 6)); if (tg > .5 || WD > .3) ln([8, -25.6, 12.6, -24.6, 14, -26], '#ff4a6a', 1.2); }
  mark(9.6, -25.4);
  c.restore();
};

CREATURE_ART.bubbrew = function () {           // living cauldron. Hex Brew: rocks back as the brew boils over, then tips and flings a flask
  INK = '#1f0f33';
  const bd = '#55309a', gd = '#ffc93d', br = '#8fff5a';
  el(-8, -1.8, 3.4, 2.4, gd); el(8, -1.8, 3.4, 2.4, gd); el(0, -.8, 3.4, 2.4, gd);
  const tip = -WD * .2 + SK * .3;
  c.save(); c.translate(0, -12); c.rotate(tip); c.translate(0, 12);
  c.beginPath(); c.arc(-15, -17, 4, PI * .5, PI * 1.5); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = gd; c.lineWidth = 1.8; c.stroke();
  c.beginPath(); c.arc(15, -17, 4, -PI * .5, PI * .5); c.strokeStyle = INK; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = gd; c.lineWidth = 1.8; c.stroke();
  bl([-14, -6, -15.5, -18, -10, -24.6, 10, -24.6, 15.5, -18, 14, -6, 0, -1], bd);
  shine(-9, -16, 2.4, 6, .35, .22);
  el(0, -24.6, 13.2, 4.2, gd);
  dot(0, -24.8 - WD * .8, 10.6, 2.8 + WD * 1.2, br);
  for (let i = 0; i < 4; i++) { const k = (T * (.8 + WD * 1.6) + i * .27) % 1; el(-7 + i * 4.8 + Math.sin(T * 3 + i) * 1.4, -26 - k * (12 + WD * 9), 2.6 * (1 - k * .6), 2.6 * (1 - k * .6), 'rgba(160,255,110,' + (.75 * (1 - k)) + ')', 0, 1); }
  if (BK) { ln([-7, -14.4, -2.6, -14.4], br, 1.6); ln([3, -14.4, 7.4, -14.4], br, 1.6); }
  else { dot(-4.8, -14.6, 2.6, 3.4, br); dot(-5.6, -15.8, .9, .9, '#fff'); if (SK > .3) ln([3, -14.4, 7.4, -14.4], br, 1.6); else { dot(5.2, -14.6, 2.6, 3.4, br); dot(4.4, -15.8, .9, .9, '#fff'); } }
  if (SK > .2) el(.2, -9.2, 2, 1.6, br, 0, 0); else smile(.2, -9.6, 2.2, br);
  star(.2, -5, 2.2, gd, 5, 0, .9);
  mark(0, -29);
  c.restore();
};

// ===== MYSTIC =====
CREATURE_ART.monolit = function () {           // rune-carved monolith. Rune Pulse: its glyphs light one after another, then it thrusts both hands down
  INK = '#141a44';
  const bd = '#3d53bd', lt = '#5f7ae6', gd = '#ffd34a';
  const y = -3 + W * 1.4, g = clamp(.55 + W * .2 + WD * .3 + SK * .45, 0, 1);
  for (let i = 0; i < 2; i++) { const an = T * 1.6 + AT * 9 + i * PI; diamond(Math.cos(an) * 19, y - 18 + Math.sin(an) * 5, 2.4, 3.2, lt, 1.2); }
  const hx = 15 - WD * 3 + SK * 4, hy = y - 13 - WD * 9 + SK * 6;
  el(-hx, hy, 3.8, 4.2, bd); el(hx, hy, 3.8, 4.2, bd);
  if (SM && WD === 0) { streak(-hx, hy - 11, -hx, hy, 6, '#ffe9a8'); streak(hx, hy - 11, hx, hy, 6, '#ffe9a8'); }
  pg([-11, y, -12, y - 26, -6, y - 36, 7, y - 36, 12, y - 26, 11, y, 0, y + 3], bd);
  pg([-7, y - 4, -8, y - 25, -4, y - 32, 5, y - 32, 8, y - 25, 7, y - 4], SK > .5 ? '#8fa2f5' : lt, 0);
  const gl = k => { c.globalAlpha *= k; }, go = k => { c.globalAlpha /= k; };
  const a1 = clamp(g + (WD > .2 ? .3 : 0), .05, 1), a2 = clamp(g + (WD > .5 ? .3 : 0), .05, 1), a3 = clamp(g + (WD > .8 ? .3 : 0), .05, 1), gc = SK > .4 ? '#ffffff' : gd;
  gl(a1); ln([-5, y - 6, 5, y - 6], gc, 1.3); ln([-4, y - 9.6, 0, y - 13.6, 4, y - 9.6, -4, y - 9.6], gc, 1.3); go(a1);
  gl(a3); c.beginPath(); c.arc(0, y - 28, 2.3, 0, TAU); c.strokeStyle = gc; c.lineWidth = 1.3; c.stroke(); ln([0, y - 25.4, 0, y - 23], gc, 1.3); go(a3);
  if (SK > .1) glow(0, y - 18, 12 + SK * 12, '#ffe27a', .5 * SK);
  gl(a2);
  if (BK) { ln([-5.6, y - 19, -1.6, y - 19], gd, 1.6); ln([2, y - 19, 6, y - 19], gd, 1.6); }
  else { const ry = 3 - WD * 1.8 + SK * .8; dot(-3.6, y - 19, 2.2, ry, '#fff6c8'); dot(4, y - 19, 2.2, ry, '#fff6c8'); dot(-3.6, y - 18.6, 1.1, ry * .55, '#ffb52e'); dot(4, y - 18.6, 1.1, ry * .55, '#ffb52e'); }
  go(a2);
  mark(0, y - 18);
};

CREATURE_ART.chipmonk = function () {          // chipmunk monk. Chi Palm: draws its palm back to the hip, eyes closed, then opens them and thrusts
  INK = '#4a2a14';
  const fur = '#dc8c4c', dk = '#6e3d20', cr = '#fff0d6', rb = '#ff9a2e', bd2 = '#6c4bd8';
  const px = 13.6 - WD * 7 + SK * 13, py = -13.6 + WD * 4 - SK * .5, ps = 1 + SK * .45, gx = -11 + WD * 20 - SK * 2, gy = -11 - WD * 6;
  bl([-7, -3, -21, -8, -22 - SK * 2, -27 + TW * 2 - SK * 3, -11, -31 + TW * 2 - SK * 3, -10, -17], fur);
  ln([-13, -8, -17, -18, -14 - SK, -27 + TW * 2 - SK * 3], dk, 2.2);
  feet(-5, 6, -2, 4.6, 2.9, fur);
  J(0, -3, -WD * .08 + SK * .1);
  if (WD < .2) el(gx, gy, 3.2, 3.2, fur);
  bl([-10, -4, -11, -16, 0, -20, 10, -16, 9, -4, 0, -1], fur);
  bl([-10.6, -15, -4, -19.6, 8, -8, 9.6, -3.6, 0, -1, -6, -6], rb, 1.5);
  ln([-9, -11, 5, -3], '#e07a14', 1.1);
  el(-5, -32.6, 3, 3, fur); el(10, -33.2, 3, 3, fur);
  el(3, -25, 10.2, 9.2, fur);
  ln([-3, -32.6, 1, -28.6], dk, 1.9); ln([3.6, -33.8, 5.4, -29.4], cr, 1.6); ln([8, -33, 8.6, -29], dk, 1.9);
  dot(-2.6, -21.6, 4.6, 4, cr); dot(9.4, -22, 4.2, 3.8, cr);
  dot(4.4, -22, 2.6, 2, cr);
  if (BK || SK < .15) { smile(-.6, -26.4, 2.2); smile(8.4, -27, 2.2); } else { eye(-.6, -26.6); eye(8.4, -27.2); brow(-.6, -30.6, 1, .9); brow(8.4, -31.2, -1, .9); }
  dot(4.6, -23.2, 1.3, 1, INK);
  pg([3.6, -21.6, 5.6, -21.6, 5.4, -19.6, 3.8, -19.6], '#fff', .8);
  for (let i = 0; i < 6; i++) dot(-5 + i * 3.2, -17 + Math.sin(i / 5 * PI) * 2.2, 1.5, 1.5, bd2);
  if (WD >= .2) { cv([-6, -13, (gx - 6) / 2, gy + 2, gx, gy], fur, 2.4); el(gx, gy, 3.2, 3.8, cr); }
  cv([9, -12, (9 + px) / 2, py + 2.5, px - 2, py], fur, 2.6);
  streak(px - 13, py, px - 1, py, 8, '#e6dcff');
  if (SK > .3) glow(px + 2, py, 10 * SK, '#b9a4ff', .6);
  el(px, py, 3 * ps, 4 * ps, cr);
  if (SK > .3) { ln([px - 1, py - 2 * ps, px + 1.4, py - 2 * ps], '#e0b890', .8); ln([px - 1, py, px + 1.6, py], '#e0b890', .8); }
  mark(px + 4, py);
  U();
};

CREATURE_ART.telemur = function () {           // teleporting lemur. Blink Strike: vanishes, and reappears already swinging a claw
  INK = '#2a1f4a';
  const fur = '#bcacec', dk = '#3d2f66', gd = '#ffc93d';
  const ax = 10 - WD * 3 + SK * 9, ay = -10 - WD * 14 + SK * 3;
  const tp = [-7, -7, -21, -8, -20, -27, -9, -33 + TW * 2, -9, -42 + TW * 3];
  curvePath(tp); c.strokeStyle = INK; c.lineWidth = 4.8 + LW * 1.7; c.stroke();
  c.strokeStyle = '#ffffff'; c.lineWidth = 4.8; c.stroke();
  c.setLineDash([4.2, 4.2]); c.lineCap = 'butt'; c.strokeStyle = '#7d5fe0'; c.stroke(); c.setLineDash([]); c.lineCap = 'round';
  if (WD + SK > .1) glow(-9, -45 + TW * 3, 6 + (WD + SK) * 6, '#ffe27a', .6);
  star(-9, -45 + TW * 3, 4.6 + WD * 2 + SK * 1.5, gd, 5, T * 1.4 + AT * 6);
  feet(-4, 6, -2, 4.4, 2.8, dk);
  J(0, -3, -WD * .1 + SK * .12);
  el(-9, -10, 2.8, 2.8, dk);
  bl([-9, -4, -10, -15, 0, -19, 9, -15, 8, -4, 0, -1], fur);
  dot(1, -8.4, 4.6, 5, '#fff');
  pg([-5, -28, -8, -36, 0, -31], fur); pg([8, -31, 13, -37, 13, -28], fur);
  el(4, -23, 9.4, 8.4, '#fff');
  bl([-5.4, -25, -3, -31, 4, -32.4, 11, -31, 13.4, -25, 4, -28.6], fur, 1.4);
  dot(.2, -23.4, 4.2, 4.4, dk); dot(8.6, -23.8, 4, 4.3, dk);
  eye(.4, -23.4, .98, gd); eye(8.6, -23.8, .98, gd);
  dot(5.4, -19.2, 1.2, .9, INK);
  if (SK > .3) openMouth(5.4, -17.4, 1.9, 1.4); else smile(5.4, -18, 1.4);
  cv([6, -13, (6 + ax) / 2 + 2, (ay - 13) / 2 - 1, ax, ay], fur, 2.4);
  if (BI === 0 && WD === 0) swoosh(6, -13, 16, -1.6, .35, 6, '#ffe9a8');
  el(ax, ay, 2.8, 2.8, dk);
  if (WD > .4 || SK > .1) for (let i = -1; i <= 1; i++) ln([ax + 2, ay + i * 1.5, ax + 5, ay + i * 2 + 1], '#fff', 1);
  mark(ax + 4, ay);
  U();
};

CREATURE_ART.mageling = function () {          // apprentice in violet, gold and teal. Arcane Orb: circles its wand overhead, then snaps it forward
  INK = '#22103f';
  const rb = '#5d31ac', gd = '#ffc93d', tq = '#2fe0c8', fc = '#f4e8ff';
  const y = -2 + W * 1.4, tx = WD * 3 + SK * 9, ty = SK * 3;
  bl([-10.5, y, -9.5, y - 14, 0, y - 18, 9.5, y - 14, 10.5 + SK, y, 5, y + 2.4 + SK, 0, y, -5 - SK, y + 2.4 + SK], rb);
  ln([-9.6, y - 3, -5, y - .6, 0, y - 3, 5, y - .6, 9.6, y - 3], gd, 1.6);
  diamond(0, y - 10, 2, 2.6, tq, 1.1);
  el(1, y - 20, 8.6, 7.6, fc);
  eye(-2.2, y - 20, 1, '#7d42e8'); eye(5, y - 20.4, 1, '#7d42e8');
  if (SK > .25) { brow(-2.2, y - 24, 1, .8); brow(5, y - 24.4, -1, .8); openMouth(1.6, y - 15.8, 1.4, 1.2); } else smile(1.6, y - 16.2, 1.5);
  blush(-4.6, y - 16.8); blush(8, y - 17.2);
  el(1, y - 26, 13.4, 3.7, rb, -.08);
  bl([-7, y - 27, -4, y - 40, -11 - WD * 2 + tx, y - 47 + TW * 1.5 + ty, 1, y - 43, 8.6, y - 27.6], rb);
  bl([-6.6, y - 29.6, 1, y - 31, 8.4, y - 30.4, 8.2, y - 27.4, 1, y - 28, -6.8, y - 26.8], gd, 1.3);
  diamond(1, y - 29.4, 1.9, 1.9, tq, 1);
  star(-12 - WD * 2 + tx, y - 49 + TW * 1.5 + ty, 3.4, gd, 5, T * 1.2, 1.1);
  c.save(); c.translate(13 + SK * 2.5 + WD * 2, y - 9 - WD * 9); c.rotate(.18 - WD * .42 + Math.sin(AT * 38) * .08 * WD + SK * 1.15);   // raised high beside the hat, then thrust forward
  if (SM && WD === 0) swoosh(0, 0, 17, -2.4, -1.5, 5, '#bffff5');
  cv([0, 2, 0, -15], '#a8743c', 1.6);
  glow(0, -17.6, 6 + WD * 8 + SK * 5, tq, .45 + WD * .5);
  el(0, -17.6, 3.3 + WD * .5, 3.3 + WD * .5, WD > .6 || SK > .5 ? '#bffff5' : tq); dot(-1, -18.6, 1, 1, '#fff');
  mark(0, -17.6);
  c.restore();
  el(12.6 + SK * 2.5 + WD * 2, y - 8.6 - WD * 9, 2.6, 2.6, fc);
};

CREATURE_ART.lunafawn = function () {          // fawn crowned with a crescent moon. Moonbeam: bows its head, then lifts it and the moon blazes
  INK = '#3a3470';
  const bd = '#d2c7ff', hf = '#6c5bd0', mn = '#ffe680';
  const leg = (x, ph, up) => { const k = MV ? Math.sin(T * 13 + ph) * 3 : 0; cv([x, -11, x + k * .4 + up * .8, -5 - up * .5, x + k + up * .3, -1.4 - up], bd, 2.2); el(x + k + up * .3, -1.2 - up, 1.9, 1.5, hf, 0, 1.3); };
  leg(-9, 0, 0); leg(-4, PI, 0); leg(5, PI, 0); leg(9, 0, SK * 5);
  el(-12.4, -17 + TW - SK * 2, 2.6, 2.4, '#fff');
  bl([-12.5, -12, -11.5, -20.6, 0, -23.4, 9, -20.6, 10.5, -12, 0, -9], bd);
  dot(-6, -18, 1.5, 1.3, '#fff'); dot(-2, -20.4, 1.3, 1.1, '#fff'); dot(-8, -14.6, 1.2, 1, '#fff'); dot(2, -18.4, 1.2, 1, '#fff');
  dot(0, -11, 7, 2, '#fff');
  J(7, -17, WD * .38 - SK * .3, 0, -SK * 1.5);
  cv([7, -18, 10, -27], bd, 5.6);
  bl([6.6, -32, 1.6, -38.6, 8.6, -35.4], bd);
  el(11, -30.4, 7.2, 6.3, bd);
  dot(15.4, -28, 3.4, 2.6, '#fff'); dot(17.6, -28.8, 1.1, .9, hf);
  const b0 = BK; if (WD > .5) BK = true; eye(11, -31.4, 1.1); BK = b0;
  ln([8.4, -34.6, 7, -36], INK, 1.1);
  blush(12, -27);
  const gy = -43 + WD * 3 - SK * 6;
  glow(11, gy, 8 + WD * 3 + SK * 12, mn, .45 + SK * .45);
  crescent(11, gy, 5.6 + SK * 1.6, SK > .5 ? '#fff7c0' : mn, -.5 + W * .05, 1.5);
  mark(11, gy);
  U();
};

// ===== SHADOW =====
CREATURE_ART.cryptoise = function () {         // tortoise carrying a little crypt. Grave Rise: pulls its head in, then stamps and the stones answer
  INK = '#231a33';
  const sk = '#7462a0', sh = '#4d465e', stn = '#a29cb4', fl = '#b06aff';
  pg([-14, -6, -21, -3 + TW, -13, -3], sk);
  el(-8, -2 - Math.max(0, ST) * 3, 4.8, 3, sk); el(8 + WD * 2, -2 - Math.max(0, -ST) * 3 - WD * 5, 4.8, 3, sk);
  if (SM && WD === 0) streak(10, -9, 8.5, -2, 6, '#e8d0ff');
  bl([-15.5, -5, -15.5, -16, -4, -23.4, 8, -21, 13.5, -12, 12.5, -5, 0, -3], sh);
  ln([-10, -6, -8, -17], '#383244', 1.3); ln([-1, -4.6, 0, -21], '#383244', 1.3); ln([7, -5, 8, -18], '#383244', 1.3);
  const rise = WD * 2 + SK * 4, hot = Math.max(WD, SK);
  if (hot > .1) glow(-3, -27 - rise, 10 + hot * 8, '#b06aff', hot * .5);
  c.save(); c.translate(-3, -20 - rise); c.rotate(-.08);
  bl([-6.5, 0, -6.5, -12, 0, -17.6, 6.5, -12, 6.5, 0], stn);
  crescent(-.6, -9, 3, null, .4, 0); c.strokeStyle = hot > .4 ? '#b06aff' : '#5d566e'; c.lineWidth = 1.2; c.stroke();
  ln([-3, -3.4, 3, -3.4], '#5d566e', 1.1);
  c.restore();
  el(7, -22.6, 1.6, 2.6, '#f0e6d2', 0, 1.2); flame(7, -25, 1.9 + hot * .6, 5.4 + WD * 3 + SK * 4, 0, fl, '#e8d0ff');
  dot(-11, -9, 3, 1.6, '#6fc45a'); dot(10, -19.4, 2, 1.2, '#6fc45a');
  J(15, -11, 0, -WD * 5 + SK * 3.5, 0);
  el(15.4, -11, 7.2, 6.6, sk);
  if (BK) { ln([11.6, -12, 15, -12], INK, 1.5); ln([17, -12.4, 20, -12.4], INK, 1.5); }
  else { eye(13.4, -12, .9); eye(18.6, -12.4, .85); if (SK < .3) { ln([10.8, -14.4, 16, -13.8], INK, 1.5); ln([16.6, -14, 21, -14.6], INK, 1.5); } }
  smile(17, -7.6, 1.6); blush(12, -8);
  U();
  mark(15, -3);
};

CREATURE_ART.obsidrake = function () {         // black dragonet with crimson eyes. Night Fang: rears back with its jaws gaping, then lunges and bites
  INK = '#0f0a14';
  const bd = '#342f40', lt = '#524b62', rd = '#c42a3c', mb = '#8e2033';
  cv([-8, -6, -19, -4, -24, -12 + TW * 2 - SK * 6], bd, 4);
  pg([-24, -12 + TW * 2 - SK * 6, -31, -15 + TW * 2 - SK * 6, -25, -20 + TW * 2 - SK * 6, -21, -15 + TW * 2 - SK * 6], rd);
  const fl = W * 2.5 + WD * 7 - SK * 6;
  bl([-4, -19, -17, -35 - fl, -23, -23 - fl * .5, -17, -22, -15, -14, -9, -15], mb);
  ln([-4, -19, -17, -34 - fl], bd, 1.6); ln([-4, -19, -22, -23 - fl * .5], bd, 1.6);
  feet(-5, 6, -2, 5, 3, bd);
  pg([2, -.6, 4, -2.6, 6, -.6], '#fff', .8); pg([8, -.6, 10, -2.6, 11.6, -.8], '#fff', .8);
  bl([-10.5, -3, -12.5, -15, -4, -23.4, 6, -22, 11.5, -12, 9, -3, 0, -1], bd);
  dot(2, -9.4, 5.2, 6.2, rd); ln([-1.6, -12, 5.6, -12], '#e0566a', 1); ln([-2, -8.6, 6, -8.6], '#e0566a', 1); ln([-1, -5.4, 5, -5.4], '#e0566a', 1);
  J(5, -19, -WD * .34 + SK * .24, -WD * 3 + SK * 6.5, SK * 1.5);
  pg([1, -29, -8, -37, 3.6, -25], lt); pg([7, -32, 3, -43, 11.6, -31], lt);
  el(8, -25.6, 9.2, 8.2, bd);
  const op = WD;   // jaws gape through the wind-up and clamp shut as the bite lands
  if (op > .2) glow(17, -21.5, 9 * op, '#ff3a4a', .7 * op);
  bl([10, -28.6, 20.6, -27.4 - op * 3.5, 21, -23.6 - op * 3.5, 11, -22.6], bd);
  bl([10, -22.4, 19.6, -21.4 + op * 6, 11, -18.6 + op * 4.5], lt);
  pg([15, -23.4 - op * 2, 16.2, -20.4 - op * 2, 17.4, -23.4 - op * 2.2], '#fff', .8);
  if (op > .3) pg([13.6, -20.6 + op * 4.6, 14.6, -23 + op * 4.4, 15.6, -20.8 + op * 4.8], '#fff', .8);
  dot(19, -26.4 - op * 3, .7, .7, '#ff7a8a');
  if (BK) ln([5, -26.6, 10, -26], '#ff3a4a', 1.6);
  else { el(7.6, -26.4, 3.2, 3.4, '#fff', 0, 1.2); dot(8.2, -26.2, 2.2, 2.6, '#ff2a3c'); dot(8.5, -26, 1, 1.6, '#2a0a10'); dot(7, -27.6, .9, .9, '#fff'); }
  brow(7.6, -31, -1, 1.05);
  mark(21, -23);
  U();
  shine(-3, -19.4, 4, 1.4, -.4, .22);
};

CREATURE_ART.shinobat = function () {          // ninja bat. Echo Swoop: tucks its wings, then dives with them swept right back
  INK = '#1a1030';
  const bd = '#62529a', mb = '#3f3368', sc = '#ff3a5c';
  const tk = AT > 0 && AT < .12 ? AT / .12 : 0, ds = AT > 0 ? Ease.hump(Ease.seg(AT, .12, .55)) : 0;
  const y = -17 + W * 1.5 * (1 - ds), fl = Math.sin(T * 11) * 5 * (1 - ds) * (1 - tk) + tk * 7 - ds * 8, sw = ds * 9 + tk * 4;
  bl([-6, y - 2, -15 + sw * .3, y - 9 + fl, -25 + sw * .5, y - 3 + fl * 1.4, -20 + sw * .4, y + 1 + fl, -16 + sw * .3, y - 1 + fl * .6, -12 + sw * .2, y + 3 + fl * .5, -7, y + 3], mb);
  bl([6, y - 2, 15 - sw, y - 9 + fl, 25 - sw * 1.9, y - 3 + fl * 1.4, 20 - sw * 1.5, y + 1 + fl, 16 - sw * 1.1, y - 1 + fl * .6, 12 - sw * .7, y + 3 + fl * .5, 7, y + 3], mb);
  pg([-7, y - 5, -9 - ds * 4, y - 17 + ds * 4, -1, y - 8], bd); pg([7, y - 5, 9 - ds * 4, y - 17 + ds * 4, 1, y - 8], bd);
  dot(-6 - ds * 2, y - 10 + ds * 2, 1.3, 3, '#ff9ab8', -.25 - ds * .4); dot(6 - ds * 2, y - 10 + ds * 2, 1.3, 3, '#ff9ab8', .25 - ds * .4);
  el(0, y, 8.8, 8.3, bd);
  cv([-2.6, y + 8, -3 - ds * 4, y + 11], bd, 1.4); cv([2.6, y + 8, 3 - ds * 4, y + 11], bd, 1.4);
  eye(-3.4, y - 2, 1, '#b48aff'); eye(3.8, y - 2, 1, '#b48aff');
  if (ds > .2 || tk > .2) { brow(-3.4, y - 6.2, 1, .9); brow(3.8, y - 6.2, -1, .9); }
  bl([-8.6, y + 1.6, 0, y + 3.6, 8.6, y + 1.6, 8, y + 6, 0, y + 8.6, -8, y + 6], sc, 1.5);
  bl([-7, y + 4, -14 - ds * 6, y + 6 + TW * 2 * (1 - ds), -19 - ds * 9, y + 3 + TW * 3 * (1 - ds), -15 - ds * 7, y + 9 + TW * 2 * (1 - ds), -8, y + 7], sc, 1.4);
  pg([-1.6, y + 3.4, -.8, y + 5.6 + ds, 0, y + 3.6], '#fff', .6);
  if (ds > .3) pg([1.4, y + 3.4, 2.2, y + 5.8 + ds, 3, y + 3.4], '#fff', .6);
  mark(9, y + 2);
};

CREATURE_ART.lumbra = function () {            // hooded wisp with a lantern. Wisp Spiral: lifts its lantern high and swings a wisp out with each sway
  INK = '#1a1436';
  const ck = '#423878', lt = '#5f53a6', fc = '#c4ebff';
  const sw = BS[0] + BS[1] + BS[2], wn = Math.min(1, BW[0] + BW[1] + BW[2]);
  const y = -6 + W * 2;
  bl([-9, y - 2, -10.5, y - 18, -3, y - 27, 0 - sw * 2, y - 33 + TW, 5, y - 27, 10.5, y - 18, 9, y - 4, 3, y + 1, -3 - sw, y + 6 + TW * 2, -8 - sw * 2, y + 9 + TW * 3, -5, y + 1], ck);
  bl([-7, y - 6, -8, y - 16, 0, y - 12, 7, y - 7, 2, y - 3], lt, 0);
  el(2, y - 17.4, 6.7, 6.2, fc);
  eye(-.4, y - 18, .9); eye(5, y - 18.4, .9);
  if (sw > .3) openMouth(2.6, y - 14, 1.3, 1.2); else smile(2.6, y - 14.4, 1.4);
  blush(-2.6, y - 14.8);
  c.save(); c.translate(9, y - 9); c.rotate(-wn * .55 + sw * .5);
  glow(7, -10, 11 + W * 1.5 + wn * 5 + sw * 4, '#5ad0ff', .4 + wn * .3);
  cv([0, 0, 6, -17], '#8a7a5a', 1.5);
  ln([6, -17, 7, -14.6], INK, 1.1);
  el(7, -9.6, 4.1, 5.1, 'rgba(150,225,255,.45)');
  flame(7, -7.2, 2.1 + wn * .5, 5.6 + wn * 3, 0, '#5ad0ff', '#e6fbff');
  ln([3.6, -14.4, 10.4, -14.4], '#ffd34a', 1.9); ln([4.4, -4.6, 9.6, -4.6], '#ffd34a', 1.9);
  mark(7, -9.6);
  c.restore();
  el(9, y - 9, 2.5, 2.5, lt);
};

CREATURE_ART.omencrow = function () {          // fortune-telling crow. Nightfall: raises both wings like a cloak, then sweeps them down with a caw
  INK = '#120c22';
  const bd = '#332d52', sh = '#5d4fa6', gd = '#ffc93d', mg = '#ff4ad0';
  const up = WD * 11 - SK * 5, hot = Math.max(WD, SK);
  pg([-9, -9, -22, -11 + TW * 2 - SK * 4, -21, -5 + TW * 2, -9, -4], bd); pg([-9, -7, -20, -3 + TW + SK * 3, -9, -2.6], sh);
  cv([-3, -5, -3.4, -1.4], gd, 1.5); ln([-6, -.8, -1, -.8], INK, 2.2); cv([4, -5, 4.4, -1.4], gd, 1.5); ln([2, -.8, 7, -.8], INK, 2.2);
  if (WD + SK > .1) bl([-6, -16, -15 - WD * 4, -26 - WD * 11 + SK * 9, -21 - WD * 2, -17 - WD * 5 + SK * 7, -11, -10], bd);
  bl([-11, -4, -12.5, -17, -3, -24.4, 7, -22, 11, -12, 8, -4, 0, -2], bd);
  bl([-10, -9, -15 - up * .6 + SK * 6, -16 - up, -8 + SK * 3, -21 - up * .4, 0, -14, -3, -7], sh);
  ln([-11 + SK * 3, -13 - up * .5, -4, -14], '#8475d0', 1.1); ln([-9 + SK * 2, -10.4 - up * .3, -3, -11], '#8475d0', 1.1);
  J(4, -20, WD * .2 - SK * .12, SK * 1.5, 0);
  pg([2, -32, -2, -39, 5.6, -34], bd); pg([5, -33, 5, -41, 9, -33.6], bd);
  el(6, -26.4, 8.2, 7.7, bd);
  if (SK > .12) { pg([11, -29, 22, -26.4 - SK, 11, -25], gd); pg([11, -24.6, 19.5, -23.4 + SK * 3, 11, -22.2], gd); }
  else { pg([11, -29, 22, -25.6, 11, -22.4], gd); ln([11.6, -25.6, 19, -25.6], '#c98a00', 1); }
  eye(6.4, -27.4, 1.08, mg);
  diamond(4.4, -32.4, 1.6 + hot * .5, 2 + hot * .6, hot > .3 ? '#ffd0f4' : mg, 1);
  if (hot > .1) glow(4.4, -32.4, 4 + hot * 7, '#ff4ad0', hot * .8);
  mark(4.4, -32.4);
  U();
  ln([-1, -19, 3, -14.6, 8, -17.6], gd, 1.1);
  crescent(3.2, -12.6, 2.8, gd, .6, 1.1);
  shine(-5, -19.6, 4, 1.4, -.5, .25);
};
