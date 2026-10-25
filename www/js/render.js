/* Critter Arena — battle renderer: sunny stadium, cheering crowd, creatures, effects, HUD and hand. */
(function (root) {
  var CA = root.CA, Art = CA.Art, R = CA.RULES, SP = CA.SPECIES;
  var TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  var H = Art.helpers;
  var TEAM = ['#3d8bff', '#ff4d5e'], TEAM_L = ['#a8ccff', '#ffb0b8'], TEAM_D = ['#1d4fb0', '#b0202e'];
  // drawn creature scale: small critters are enlarged, big ones trimmed so tanks don't swallow the pitch
  function vscale(sp, tl) { return (1.15 + sp.r * 2.35) * tl / 100; }
  var FONT = '"Trebuchet MS", "Segoe UI", Roboto, system-ui, sans-serif';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function easeOutBack(k) { var s = 1.7; k -= 1; return k * k * ((s + 1) * k + s) + 1; }
  function text(c, str, x, y, size, fill, stroke, align, weight) {
    c.font = (weight || '900') + ' ' + size + 'px ' + FONT;
    c.textAlign = align || 'center'; c.textBaseline = 'middle';
    if (stroke) { c.lineJoin = 'round'; c.lineWidth = Math.max(2, size * 0.22); c.strokeStyle = stroke; c.strokeText(str, x, y); }
    c.fillStyle = fill; c.fillText(str, x, y);
  }
  CA.rr = rr; CA.text = text; CA.FONT = FONT;

  function Renderer(canvas) {
    this.cv = canvas;
    this.c = canvas.getContext('2d');
    this.bg = document.createElement('canvas');
    this.fx = [];        // particles & effects
    this.nums = [];      // floating numbers
    this.toasts = [];
    this.banners = [];
    this.shake = 0;
    this.time = 0;
    this.hype = 0.15;
    this.trainerAnim = [{ throwT: 9 }, { throwT: 9 }];
  }
  CA.Renderer = Renderer;
  var P = Renderer.prototype;

  // ---------------------------------------------------------------------------
  P.resize = function (W, Hh, dpr) {
    this.W = W; this.H = Hh; this.dpr = dpr;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(Hh * dpr);
    this.cv.style.width = W + 'px'; this.cv.style.height = Hh + 'px';
    var L = this.L = {};
    L.ui = clamp(Math.min(W / 412, Hh / 915), 1, 1.7);   // HUD scale on tablets
    L.hudH = 60 * L.ui;
    var cardW = Math.min(Hh * 0.105, (W - 14 - 5 * 6) / 4.62);
    L.cardW = cardW; L.cardH = cardW * 1.27;
    L.nextW = cardW * 0.62; L.nextH = L.nextW * 1.27;
    L.handH = 26 + L.cardH + 40;
    var standTop = 50, standBot = 36;
    var availW = W - 44, availH = Hh - L.hudH - L.handH - standTop - standBot;
    var tile = Math.min(availW / R.W, availH / R.H);
    L.tile = tile;
    L.fw = tile * R.W; L.fh = tile * R.H;
    L.fx = (W - L.fw) / 2;
    L.fy = L.hudH + standTop + Math.max(0, (availH - L.fh) / 2);
    L.handY = Hh - L.handH;
    // cards
    L.cards = [];
    var gap = 6, total = L.nextW + 4 * cardW + 4 * gap;
    var x0 = (W - total) / 2, cy = L.handY + 24;
    L.next = { x: x0, y: cy + L.cardH - L.nextH, w: L.nextW, h: L.nextH };
    for (var i = 0; i < 4; i++) L.cards.push({ x: x0 + L.nextW + gap + i * (cardW + gap), y: cy, w: cardW, h: L.cardH });
    L.energy = { x: x0 + L.nextW + gap, y: cy + L.cardH + 10, w: 4 * cardW + 3 * gap, h: 20 };
    this.c.__g = null; this._washG = null; this._shadowG = null;
    this.cardCache = {};
    this.buildBackground();
    this.buildCrowd();
  };

  P.toScreen = function (x, y) { var L = this.L; return { x: L.fx + x * L.tile, y: L.fy + y * L.tile }; };
  P.toField = function (sx, sy) { var L = this.L; return { x: (sx - L.fx) / L.tile, y: (sy - L.fy) / L.tile }; };

  // ---------------------------------------------------------------------------
  P.buildBackground = function () {
    var L = this.L, W = this.W, Hh = this.H, dpr = this.dpr;
    var bg = this.bg;
    bg.width = this.cv.width; bg.height = this.cv.height;
    var c = bg.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // stands base
    var g = c.createLinearGradient(0, 0, 0, Hh);
    g.addColorStop(0, '#d9e4f2'); g.addColorStop(1, '#c4d2e6');
    c.fillStyle = g; c.fillRect(0, 0, W, Hh);
    // seat rows ringing the pitch
    var tr = L.tile * 0.55;
    for (var k = 0; k < 24; k++) {
      var pad = tr + 8 + k * 9;
      c.strokeStyle = k % 2 ? 'rgba(255,255,255,0.55)' : 'rgba(150,170,200,0.35)';
      c.lineWidth = 4;
      rr(c, L.fx - pad, L.fy - pad, L.fw + pad * 2, L.fh + pad * 2, 18 + k * 4); c.stroke();
    }
    // sky band
    var skyH = L.hudH + 12;
    g = c.createLinearGradient(0, 0, 0, skyH);
    g.addColorStop(0, '#5fc3ff'); g.addColorStop(0.7, '#9fdcff'); g.addColorStop(1, '#d8f1ff');
    c.fillStyle = g; c.fillRect(0, 0, W, skyH);
    // stadium rim
    c.fillStyle = '#ffffff'; c.fillRect(0, skyH - 3, W, 5);
    c.fillStyle = '#3d8bff'; c.fillRect(0, skyH + 2, W, 3);
    // pennant flags along the rim
    for (var fx = 10; fx < W; fx += 26) {
      c.fillStyle = ['#ff4d5e', '#ffd23f', '#3d8bff', '#45c25a'][(fx / 26 | 0) % 4];
      c.beginPath(); c.moveTo(fx, skyH + 5); c.lineTo(fx + 14, skyH + 5); c.lineTo(fx + 7, skyH + 14); c.closePath(); c.fill();
    }
    // running track
    rr(c, L.fx - tr, L.fy - tr, L.fw + tr * 2, L.fh + tr * 2, tr * 1.4);
    c.fillStyle = '#e8875c'; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.7)';
    rr(c, L.fx - tr * 0.5, L.fy - tr * 0.5, L.fw + tr, L.fh + tr, tr); c.stroke();
    // grass with mowing stripes
    c.save();
    rr(c, L.fx, L.fy, L.fw, L.fh, 8); c.clip();
    g = c.createLinearGradient(0, L.fy, 0, L.fy + L.fh);
    g.addColorStop(0, '#78cf4f'); g.addColorStop(0.5, '#86d95a'); g.addColorStop(1, '#73c94b');
    c.fillStyle = g; c.fillRect(L.fx, L.fy, L.fw, L.fh);
    for (var s = 0; s < R.H; s += 2) {
      c.fillStyle = 'rgba(255,255,255,0.07)';
      c.fillRect(L.fx, L.fy + s * L.tile, L.fw, L.tile);
    }
    // grass speckles & tiny flowers
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 900; i++) {
      var px = L.fx + rnd() * L.fw, py = L.fy + rnd() * L.fh;
      c.fillStyle = rnd() < 0.5 ? 'rgba(40,120,40,0.18)' : 'rgba(220,255,180,0.22)';
      c.fillRect(px, py, 1.6, 2.4);
    }
    for (i = 0; i < 40; i++) {
      var ex = rnd() < 0.5 ? L.fx + rnd() * L.tile * 1.4 : L.fx + L.fw - rnd() * L.tile * 1.4;
      var ey = L.fy + rnd() * L.fh;
      c.fillStyle = ['#ffffff', '#ffe36a', '#ff9ad0'][i % 3];
      for (var p = 0; p < 4; p++) { H.C(c, ex + cos(p * PI / 2) * 1.6, ey + sin(p * PI / 2) * 1.6, 1.4); c.fill(); }
      c.fillStyle = '#ffb21f'; H.C(c, ex, ey, 0.9); c.fill();
    }
    // zones tint
    c.fillStyle = 'rgba(61,139,255,0.07)'; c.fillRect(L.fx, L.fy + R.MID * L.tile, L.fw, L.fh / 2);
    c.fillStyle = 'rgba(255,77,94,0.06)'; c.fillRect(L.fx, L.fy, L.fw, L.fh / 2);
    c.restore();
    // chalk lines
    c.strokeStyle = 'rgba(255,255,255,0.92)'; c.lineWidth = 2.5;
    rr(c, L.fx + 3, L.fy + 3, L.fw - 6, L.fh - 6, 6); c.stroke();
    var my = L.fy + R.MID * L.tile;
    c.beginPath(); c.moveTo(L.fx + 3, my); c.lineTo(L.fx + L.fw - 3, my); c.stroke();
    var cx = L.fx + L.fw / 2, cr = L.tile * 3;
    H.C(c, cx, my, cr); c.stroke();
    // centre emblem: a two-tone sun capsule
    c.save(); c.globalAlpha = 0.5;
    c.beginPath(); c.arc(cx, my, cr * 0.62, PI, TAU); c.closePath(); c.fillStyle = '#ff4d5e'; c.fill();
    c.beginPath(); c.arc(cx, my, cr * 0.62, 0, PI); c.closePath(); c.fillStyle = '#3d8bff'; c.fill();
    c.restore();
    H.C(c, cx, my, cr * 0.62); c.stroke();
    H.C(c, cx, my, cr * 0.22); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2.5; c.stroke();
    Art.star5(c, cx, my, cr * 0.15, 0.45); c.fillStyle = '#ffd23f'; c.fill();
    // deploy-zone edge dashes
    c.setLineDash([6, 6]); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.5)';
    var zy = L.fy + R.playerZone[0] * L.tile, ey2 = L.fy + R.enemyZone[1] * L.tile;
    c.beginPath(); c.moveTo(L.fx + 6, zy); c.lineTo(L.fx + L.fw - 6, zy); c.moveTo(L.fx + 6, ey2); c.lineTo(L.fx + L.fw - 6, ey2); c.stroke();
    c.setLineDash([]);
    // trainer boxes
    var bw = L.tile * 4, bh = L.tile * 1.1;
    c.fillStyle = 'rgba(255,77,94,0.55)'; rr(c, cx - bw / 2, L.fy - tr - bh * 0.5, bw, bh, 6); c.fill();
    c.fillStyle = 'rgba(61,139,255,0.55)'; rr(c, cx - bw / 2, L.fy + L.fh + tr - bh * 0.5, bw, bh, 6); c.fill();
  };

  P.buildCrowd = function () {
    var L = this.L, W = this.W, Hh = this.H;
    var crowd = this.crowd = [];
    var shirts = ['#ff4d5e', '#3d8bff', '#ffd23f', '#45c25a', '#ff8a3d', '#a45cff', '#ffffff', '#ff7ac8', '#38d3c8'];
    var skins = ['#ffd9b8', '#f2c193', '#c98d62', '#8a5a3a'];
    var hairs = ['#3a2a1e', '#6b3d1f', '#e8c060', '#1e1a20', '#b0502a'];
    var seed = 99;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var tr = L.tile * 0.55;
    var top = L.hudH + 22, botLimit = L.handY - 4;
    var step = 11;
    for (var y = top; y < botLimit; y += step * 0.82) {
      for (var x = 6 + ((y / step | 0) % 2) * step * 0.5; x < W - 4; x += step) {
        var inField = x > L.fx - tr - 5 && x < L.fx + L.fw + tr + 5 && y > L.fy - tr - 4 && y < L.fy + L.fh + tr + 9;
        if (inField) continue;
        var cx = L.fx + L.fw / 2;
        if (Math.abs(x - cx) < L.tile * 2.6 && (y < L.fy && y > L.fy - L.tile * 2.4)) continue; // enemy trainer spot
        if (rnd() < 0.08) continue;
        crowd.push({
          x: x + (rnd() - 0.5) * 3, y: y + (rnd() - 0.5) * 2, s: 0.85 + rnd() * 0.3,
          shirt: (rnd() * shirts.length) | 0, skin: (rnd() * skins.length) | 0, hair: (rnd() * hairs.length) | 0,
          ph: rnd() * TAU, sp: 2 + rnd() * 3, flag: rnd() < 0.05 ? (rnd() < 0.5 ? 0 : 1) : -1, arms: rnd() < 0.35
        });
      }
    }
    crowd.sort(function (a, b) { return a.y - b.y; });
    this.shirts = shirts; this.skins = skins; this.hairs = hairs;
  };

  P.drawCrowd = function (c, t) {
    var cr = this.crowd, hype = this.hype, i, p, n = cr.length;
    var amp = 0.6 + hype * 5;
    var off = this._off || (this._off = []);
    for (i = 0; i < n; i++) {
      p = cr[i];
      var wave = sin(t * p.sp * (0.6 + hype) + p.ph);
      off[i] = -Math.max(0, wave) * amp * p.s;
    }
    // arms up when excited
    if (hype > 0.25) {
      c.lineWidth = 2; c.lineCap = 'round';
      for (var si = 0; si < this.skins.length; si++) {
        c.strokeStyle = this.skins[si]; c.beginPath();
        for (i = 0; i < n; i++) {
          p = cr[i]; if (!p.arms || p.skin !== si) continue;
          var y0 = p.y + off[i], w = sin(t * 9 + p.ph) * 2;
          c.moveTo(p.x - 3 * p.s, y0 + 1); c.lineTo(p.x - 5 * p.s + w, y0 - 7 * p.s);
          c.moveTo(p.x + 3 * p.s, y0 + 1); c.lineTo(p.x + 5 * p.s - w, y0 - 7 * p.s);
        }
        c.stroke();
      }
    }
    for (var k = 0; k < this.shirts.length; k++) {
      c.fillStyle = this.shirts[k]; c.beginPath();
      for (i = 0; i < n; i++) {
        p = cr[i]; if (p.shirt !== k) continue;
        var yy = p.y + off[i] + 4 * p.s;
        c.moveTo(p.x + 5 * p.s, yy); c.ellipse(p.x, yy, 5 * p.s, 4 * p.s, 0, 0, TAU);
      }
      c.fill();
    }
    for (k = 0; k < this.skins.length; k++) {
      c.fillStyle = this.skins[k]; c.beginPath();
      for (i = 0; i < n; i++) {
        p = cr[i]; if (p.skin !== k) continue;
        var hy = p.y + off[i] - 2 * p.s;
        c.moveTo(p.x + 3.6 * p.s, hy); c.arc(p.x, hy, 3.6 * p.s, 0, TAU);
      }
      c.fill();
    }
    for (k = 0; k < this.hairs.length; k++) {
      c.fillStyle = this.hairs[k]; c.beginPath();
      for (i = 0; i < n; i++) {
        p = cr[i]; if (p.hair !== k) continue;
        var hy2 = p.y + off[i] - 2.6 * p.s;
        c.moveTo(p.x + 3.8 * p.s, hy2); c.arc(p.x, hy2, 3.8 * p.s, PI, TAU);
      }
      c.fill();
    }
    // flags
    for (i = 0; i < n; i++) {
      p = cr[i]; if (p.flag < 0) continue;
      var fy = p.y + off[i] - 4, wv = sin(t * 6 + p.ph) * 3;
      c.strokeStyle = '#5a4a3a'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(p.x + 4, fy + 6); c.lineTo(p.x + 4, fy - 12); c.stroke();
      c.fillStyle = TEAM[p.flag];
      c.beginPath(); c.moveTo(p.x + 4, fy - 12); c.quadraticCurveTo(p.x + 10, fy - 13 + wv, p.x + 16, fy - 11 + wv);
      c.lineTo(p.x + 16, fy - 4 + wv); c.quadraticCurveTo(p.x + 10, fy - 6 + wv, p.x + 4, fy - 5); c.closePath(); c.fill();
    }
    // camera flashes
    if (Math.random() < 0.08 + hype * 0.4) {
      p = cr[(Math.random() * n) | 0];
      this.fx.push({ k: 'flash', x: p.x, y: p.y - 4, t: 0, d: 0.18 });
    }
  };

  P.drawSky = function (c, t) {
    var W = this.W;
    // sun with rotating rays
    var sx = W - 34, sy = 18;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(sx, sy); c.rotate(t * 0.15);
    c.fillStyle = 'rgba(255,240,170,0.18)';
    for (var i = 0; i < 12; i++) {
      c.rotate(TAU / 12);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -70); c.lineTo(7, -70); c.closePath(); c.fill();
    }
    c.restore();
    var g = c.createRadialGradient(sx, sy, 2, sx, sy, 42);
    g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.35, 'rgba(255,236,140,0.95)'); g.addColorStop(1, 'rgba(255,220,120,0)');
    c.fillStyle = g; H.C(c, sx, sy, 42); c.fill();
    // drifting clouds
    for (i = 0; i < 3; i++) {
      var cx = ((t * (6 + i * 3) + i * 170) % (W + 120)) - 60, cy = 12 + i * 13;
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath();
      c.ellipse(cx, cy, 20, 7, 0, 0, TAU); c.moveTo(cx + 22, cy - 4);
      c.ellipse(cx + 10, cy - 5, 12, 8, 0, 0, TAU); c.moveTo(cx, cy - 6);
      c.ellipse(cx - 8, cy - 3, 10, 6, 0, 0, TAU);
      c.fill();
    }
  };

  P.drawSunlight = function (c, t) {
    var L = this.L;
    // soft drifting cloud shadows over the pitch
    c.save();
    rr(c, L.fx, L.fy, L.fw, L.fh, 8); c.clip();
    for (var i = 0; i < 2; i++) {
      var k = ((t * 0.018 + i * 0.5) % 1);
      var x = L.fx - L.fw * 0.4 + k * L.fw * 1.8, y = L.fy + L.fh * (0.25 + i * 0.45);
      var g = this._shadowG || (this._shadowG = (function () {
        var gg = c.createRadialGradient(0, 0, 4, 0, 0, 1);
        gg.addColorStop(0, 'rgba(20,60,40,0.13)'); gg.addColorStop(1, 'rgba(20,60,40,0)');
        return gg;
      })());
      c.save(); c.translate(x, y); c.scale(L.fw * 0.45, L.fw * 0.22);
      c.fillStyle = g; H.C(c, 0, 0, 1); c.fill(); c.restore();
    }
    c.restore();
    // warm sunlight wash from the top-right corner
    var wg = this._washG || (this._washG = (function (W, L) {
      var g = c.createRadialGradient(W, 0, 10, W, 0, L.fh * 0.9);
      g.addColorStop(0, 'rgba(255,240,170,0.22)'); g.addColorStop(1, 'rgba(255,240,170,0)');
      return g;
    })(this.W, L));
    c.fillStyle = wg; c.fillRect(L.fx, L.fy, L.fw, L.fh);
  };

  // ---------------------------------------------------------------------------
  // per-unit animation state
  P.anim = function (u, b, dt) {
    var a = u._a;
    if (!a) {
      a = u._a = { t: u.phase, mv: 0, walk: u.phase, atk: 0, hurt: 0, blink: false, blinkT: 1 + Math.random() * 3, faint: 0, look: 0 };
    }
    a.t += dt;
    var target = u.moving ? 1 : 0;
    a.mv += (target - a.mv) * Math.min(1, dt * 10);
    a.walk += dt * (4 + u.sp.spd * 3.2) * (u.charging ? 1.6 : 1) * (a.mv > 0.05 ? 1 : 0);
    var age = b.t - u.lastAtk;
    a.atk = age < 0.32 ? sin(age / 0.32 * PI) : 0;
    a.cast = (u.wind > 0 && u.sp.atk === 'beam') ? 1 - u.wind / 0.55 : 0;
    var ha = b.t - u.lastHurt;
    a.hurt = ha < 0.28 ? 1 - ha / 0.28 : 0;
    a.blinkT -= dt;
    if (a.blinkT < 0) { a.blinkT = 2 + Math.random() * 3.5; }
    a.blink = a.blinkT < 0.12;
    a.faint = u.st === 'dead' ? Math.min(1, u.deadT / 1.0) : 0;
    a.cheer = u.cheer;
    a.charging = u.charging;
    if (u.target && u.target.x !== undefined) a.look = clamp((u.target.x - u.x) * u.face * 0.3, -1, 1);
    return a;
  };

  // ---------------------------------------------------------------------------
  P.frame = function (dt, b, ui) {
    var c = this.c, L = this.L, dpr = this.dpr, t;
    this.time += dt;
    t = this.time;
    this.hype = Math.max(0.12, this.hype - dt * 0.35);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.drawImage(this.bg, 0, 0, this.W, this.H);
    this.drawSky(c, t);
    this.drawCrowd(c, t);

    var sh = this.shake > 0 ? this.shake : 0;
    this.shake = Math.max(0, this.shake - dt * 30);
    c.save();
    if (sh) c.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);

    this.drawSunlight(c, t);
    if (ui.drag && ui.drag.onField) this.drawZones(c, t, ui.drag.valid);

    this.drawTrainer(c, b, 1, ui, t);

    // ground: shadows, rings
    var units = b.units, i, u;
    var list = [];
    for (i = 0; i < units.length; i++) { u = units[i]; this.anim(u, b, dt); list.push(u); }
    list.sort(function (p, q) { return p.y - q.y; });
    for (i = 0; i < list.length; i++) this.drawGround(c, list[i], b, t);
    this.drawFx(c, dt, 'ground');

    // capsules in flight
    for (i = 0; i < b.throws.length; i++) this.drawThrow(c, b.throws[i]);

    for (i = 0; i < list.length; i++) if (!list[i].sp.fly || list[i].st === 'dead') this.drawUnit(c, list[i], b, t);
    for (i = 0; i < list.length; i++) if (list[i].sp.fly && list[i].st !== 'dead') this.drawUnit(c, list[i], b, t);

    this.drawTrainer(c, b, 0, ui, t);

    for (i = 0; i < b.projs.length; i++) this.drawProj(c, b.projs[i], t);
    this.drawFx(c, dt, 'air');
    for (i = 0; i < list.length; i++) this.drawBars(c, list[i], b);
    if (ui.drag && ui.drag.onField) this.drawGhost(c, ui.drag, b, t);
    this.drawNums(c, dt);
    c.restore();

    this.drawHUD(c, b, ui, t);
    this.drawHand(c, b, ui, t);
    this.drawToasts(c, dt);
    this.drawBanners(c, dt);
    if (ui.countdown !== null && ui.countdown !== undefined) this.drawCountdown(c, ui.countdown);
  };

  P.drawZones = function (c, t, valid) {
    var L = this.L;
    var pz = R.playerZone;
    var y0 = L.fy + pz[0] * L.tile, y1 = L.fy + pz[1] * L.tile;
    c.fillStyle = 'rgba(61,139,255,' + (0.16 + sin(t * 6) * 0.04) + ')';
    rr(c, L.fx + 2, y0, L.fw - 4, y1 - y0 + L.tile * 0.6, 6); c.fill();
    c.setLineDash([8, 6]); c.lineDashOffset = -t * 30;
    c.strokeStyle = valid ? 'rgba(255,255,255,0.95)' : 'rgba(255,90,90,0.9)'; c.lineWidth = 2.5; c.stroke();
    c.setLineDash([]);
    c.fillStyle = 'rgba(255,77,94,0.12)';
    rr(c, L.fx + 2, L.fy + 2, L.fw - 4, (R.MID * L.tile) - 4, 6); c.fill();
  };

  P.drawGround = function (c, u, b, t) {
    var L = this.L, p = this.toScreen(u.x, u.y), tl = L.tile;
    var a = u._a, alpha = u.st === 'dead' ? Math.max(0, 1 - a.faint) : 1;
    var spawnK = u.st === 'spawn' ? 1 - u.spawnT / R.spawnTime : 1;
    var rx = u.r * tl * 1.05 * Math.min(1, spawnK * 1.5);
    var z = (u.z || 0) * tl;
    c.globalAlpha = alpha * (u.sp.fly ? 0.55 : 1) * (u.veilT > 0 ? 0.5 : 1);
    c.fillStyle = 'rgba(30,60,20,0.28)';
    H.E(c, p.x, p.y + u.r * tl * 0.35, rx * (z ? 0.7 : 1), rx * 0.42 * (z ? 0.7 : 1)); c.fill();
    if (u.st !== 'dead') {
      c.lineWidth = 2.2; c.strokeStyle = TEAM[u.side];
      c.globalAlpha = alpha * 0.85;
      H.E(c, p.x, p.y + u.r * tl * 0.35, rx, rx * 0.42); c.stroke();
      if (u.slowT > 0) {
        c.fillStyle = 'rgba(176,79,201,0.35)';
        H.E(c, p.x, p.y + u.r * tl * 0.35, rx * 1.15, rx * 0.5); c.fill();
      }
    }
    c.globalAlpha = 1;
  };

  P.drawUnit = function (c, u, b, t) {
    var L = this.L, tl = L.tile, sp = u.sp, a = u._a;
    var p = this.toScreen(u.x, u.y);
    var s = vscale(sp, tl);
    var feet = p.y + sp.r * tl * 0.45 - (u.z || 0) * tl;
    if (u.st === 'spawn') {
      var k = clamp(1 - u.spawnT / R.spawnTime, 0, 1);
      s *= Math.max(0.01, easeOutBack(k));
      c.save(); c.globalAlpha = 0.4 + k * 0.6;
      Art.creature(c, sp.id, a, p.x, feet, s, u.face);
      c.restore();
      return;
    }
    c.save();
    if (u.veilT > 0) c.globalAlpha = 0.35 + 0.15 * sin(t * 12);
    if (u.leap) {
      // motion trail
      c.globalAlpha *= 0.3;
      Art.creature(c, sp.id, a, p.x - u.mvx * 8, feet + 6, s, u.face);
      c.globalAlpha = u.veilT > 0 ? 0.5 : 1;
    }
    Art.creature(c, sp.id, a, p.x, feet, s, u.face);
    c.restore();
    if (u.shield > 0 && u.st === 'act') {
      var hgt = Art.height(sp.id) * s * 0.55, cy = feet - hgt * (sp.fly ? 1.1 : 0.85);
      var br = Math.max(hgt * 0.9, sp.r * tl * 1.4);
      var pulse = 1 + sin(t * 5 + u.id) * 0.03;
      c.save(); c.globalAlpha = 0.85;
      var g = c.createRadialGradient(p.x - br * 0.3, cy - br * 0.4, br * 0.1, p.x, cy, br * pulse);
      g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(0.75, 'rgba(140,230,255,0.18)'); g.addColorStop(1, 'rgba(120,220,255,0.55)');
      c.fillStyle = g; H.C(c, p.x, cy, br * pulse); c.fill();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(200,245,255,0.9)'; c.stroke();
      c.beginPath(); c.arc(p.x, cy, br * 0.78, PI * 1.15, PI * 1.45); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
      c.restore();
    }
    if (u.charging && u.moving && Math.random() < 0.5) {
      this.fx.push({ k: 'dust', x: p.x - u.mvx * 10, y: p.y + sp.r * tl * 0.4, vx: -u.mvx * 20, vy: -10, t: 0, d: 0.5, r: 4 + Math.random() * 3, layer: 'ground' });
    }
  };

  P.drawBars = function (c, u, b) {
    if (u.st !== 'act' && u.st !== 'spawn') return;
    if (u.hp >= u.maxHp && u.shield <= 0) return;
    var L = this.L, tl = L.tile, sp = u.sp;
    var p = this.toScreen(u.x, u.y);
    var s = vscale(sp, tl);
    var top = p.y + sp.r * tl * 0.45 - (u.z || 0) * tl - Art.height(sp.id) * s * 0.92;
    var w = clamp(sp.r * tl * 2.2, 20, 46), h = 5;
    var x = p.x - w / 2, y = top - 4;
    c.fillStyle = TEAM_D[u.side]; rr(c, x - 1.5, y - 1.5, w + 3, h + 3, 3); c.fill();
    c.fillStyle = '#2b2b33'; rr(c, x, y, w, h, 2); c.fill();
    var f = clamp(u.hp / u.maxHp, 0, 1);
    c.fillStyle = f > 0.5 ? '#4fe36a' : f > 0.22 ? '#ffd23f' : '#ff4d4d';
    if (f > 0) { rr(c, x, y, w * f, h, 2); c.fill(); }
    if (u.shield > 0) {
      var sf = clamp(u.shield / u.maxHp, 0, 1);
      c.fillStyle = 'rgba(140,235,255,0.95)'; rr(c, x, y - 3, w * sf, 2.5, 1); c.fill();
    }
  };

  P.drawThrow = function (c, th) {
    var k = clamp(th.t / th.dur, 0, 1);
    var a = this.toScreen(th.fx, th.fy), bb = this.toScreen(th.x, th.y);
    var x = a.x + (bb.x - a.x) * k, y = a.y + (bb.y - a.y) * k - sin(k * PI) * this.L.tile * 4;
    c.fillStyle = 'rgba(30,60,20,0.22)';
    H.E(c, a.x + (bb.x - a.x) * k, a.y + (bb.y - a.y) * k, 6 * k + 2, 2.5 * k + 1); c.fill();
    Art.capsule(c, x, y, this.L.tile * 0.42, th.side, k * 9);
  };

  P.drawTrainer = function (c, b, side, ui, t) {
    var L = this.L, look = ui.looks[side];
    var cx = L.fx + L.fw / 2, tr = L.tile * 0.55;
    var ta = this.trainerAnim[side];
    ta.throwT += 1 / 60;
    var throwK = ta.throwT < 0.35 ? sin(ta.throwT / 0.35 * PI) : 0;
    var cheer = b.over && b.winner === side ? 1 : 0;
    var s = L.tile * 2.0 / 100;
    if (side === 1) Art.trainer(c, look, cx, L.fy - tr * 0.2, s, false, { t: t, throwK: throwK, cheer: cheer });
    else Art.trainer(c, look, cx, L.fy + L.fh + tr * 1.2, s * 1.1, true, { t: t, throwK: throwK, cheer: cheer });
  };

  P.drawProj = function (c, p, t) {
    var L = this.L, tl = L.tile;
    var s = this.toScreen(p.x, p.y);
    var total = Math.sqrt((p.tx - p.sx) * (p.tx - p.sx) + (p.ty - p.sy) * (p.ty - p.sy)) || 1;
    var done = Math.sqrt((p.x - p.sx) * (p.x - p.sx) + (p.y - p.sy) * (p.y - p.sy));
    var k = clamp(done / total, 0, 1);
    var z = (p.z * (1 - k) + 0.7 * k) * tl + (p.kind === 'spore' || p.kind === 'orb' ? sin(k * PI) * tl * 1.6 : 0);
    var x = s.x, y = s.y - z;
    switch (p.kind) {
      case 'bubble':
        H.C(c, x, y, tl * 0.32); c.fillStyle = 'rgba(120,200,255,0.75)'; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = '#e6f6ff'; c.stroke();
        H.C(c, x - tl * 0.1, y - tl * 0.1, tl * 0.08); c.fillStyle = '#fff'; c.fill();
        break;
      case 'seed':
        H.E(c, x, y, tl * 0.18, tl * 0.12, t * 10); c.fillStyle = '#8ee05a'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#2f7a34'; c.stroke();
        break;
      case 'orb':
        c.save(); c.globalCompositeOperation = 'lighter';
        H.C(c, x, y, tl * 0.5); c.fillStyle = 'rgba(224,79,160,0.35)'; c.fill();
        H.C(c, x, y, tl * 0.28); c.fillStyle = 'rgba(255,170,230,0.9)'; c.fill();
        c.restore();
        Art.star5(c, x, y, tl * 0.18, 0.45, t * 6); c.fillStyle = '#ffd23f'; c.fill();
        break;
      case 'spark':
        c.save(); c.globalCompositeOperation = 'lighter';
        Art.sparkleStar(c, x, y, tl * 0.38, 'rgba(255,240,170,0.95)');
        H.C(c, x, y, tl * 0.25); c.fillStyle = 'rgba(255,170,230,0.4)'; c.fill();
        c.restore();
        break;
      case 'star':
        c.save(); c.globalCompositeOperation = 'lighter';
        for (var i = 1; i <= 3; i++) {
          var bx = x - (p.tx - p.sx) / total * tl * 0.35 * i, by = y - (p.ty - p.sy) / total * tl * 0.35 * i;
          H.C(c, bx, by, tl * (0.25 - i * 0.05)); c.fillStyle = 'rgba(255,220,120,' + (0.4 - i * 0.1) + ')'; c.fill();
        }
        c.restore();
        Art.star5(c, x, y, tl * 0.38, 0.45, t * 8); c.fillStyle = '#ffd23f'; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = '#a45cff'; c.stroke();
        break;
      case 'spore':
        for (var j = 0; j < 3; j++) {
          H.C(c, x + cos(t * 5 + j * 2) * tl * 0.15, y + sin(t * 5 + j * 2) * tl * 0.15, tl * 0.2);
          c.fillStyle = 'rgba(190,110,230,0.75)'; c.fill();
        }
        break;
    }
  };

  P.drawGhost = function (c, d, b, t) {
    var sp = SP[d.card];
    var L = this.L, tl = L.tile;
    var p = this.toScreen(d.fx, d.fy);
    // range ring
    if (sp.range > 1) {
      c.setLineDash([5, 5]); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.75)';
      H.E(c, p.x, p.y, (sp.range + sp.r) * tl, (sp.range + sp.r) * tl); c.stroke(); c.setLineDash([]);
    }
    if (sp.taunt) {
      c.fillStyle = 'rgba(91,127,209,0.15)'; H.C(c, p.x, p.y, (sp.taunt + sp.r) * tl); c.fill();
    }
    var n = sp.n;
    for (var i = 0; i < n; i++) {
      var ox = 0, oy = 0;
      if (n > 1) { var ang = (i / n) * TAU + 0.6; ox = cos(ang) * 0.62 * tl; oy = sin(ang) * 0.5 * tl; }
      c.save(); c.globalAlpha = d.valid ? 0.75 : 0.35;
      c.lineWidth = 2; c.strokeStyle = d.valid ? '#fff' : '#ff5a5a';
      H.E(c, p.x + ox, p.y + oy + sp.r * tl * 0.35, sp.r * tl * 1.05, sp.r * tl * 0.45); c.stroke();
      Art.creature(c, sp.id, { t: t, mv: 0, walk: 0, atk: 0, hurt: 0, faint: 0 }, p.x + ox, p.y + oy + sp.r * tl * 0.45, vscale(sp, tl), 1);
      c.restore();
    }
  };

  // ---------------------------------------------------------------------------
  // events from the simulation -> visual effects
  P.onEvent = function (e, b) {
    var L = this.L, tl = L.tile, p, i;
    switch (e.k) {
      case 'throw':
        this.trainerAnim[e.side].throwT = 0;
        break;
      case 'pop':
        p = this.toScreen(e.x, e.y);
        this.fx.push({ k: 'ring', x: p.x, y: p.y, t: 0, d: 0.45, r: tl * 2.2, col: '255,255,255', layer: 'air' });
        this.fx.push({ k: 'flashc', x: p.x, y: p.y - tl * 0.6, t: 0, d: 0.3, r: tl * 1.6, layer: 'air' });
        for (i = 0; i < 10; i++) {
          var an = i / 10 * TAU;
          this.fx.push({ k: 'spark', x: p.x, y: p.y - tl * 0.5, vx: cos(an) * tl * 5, vy: sin(an) * tl * 4 - tl * 2, t: 0, d: 0.6, r: tl * 0.28, col: i % 2 ? '#ffffff' : TEAM_L[e.side], layer: 'air' });
        }
        this.hype = Math.max(this.hype, SP[e.sp].cost >= 6 ? 0.9 : 0.4);
        break;
      case 'hit':
        p = this.toScreen(e.u.x, e.u.y);
        var hy = p.y - e.u.r * tl * 1.5 - (e.u.sp.fly ? tl * 0.7 : 0);
        this.fx.push({ k: 'hitstar', x: p.x + (Math.random() - 0.5) * tl * 0.6, y: hy + (Math.random() - 0.5) * tl * 0.5, t: 0, d: 0.22, r: tl * (e.melee ? 0.6 : 0.45), layer: 'air' });
        // only the numbers that teach something: type matchups and big burst hits
        if (e.dmg >= 1 && (e.eff !== 0 || e.dmg >= 150)) {
          this.nums.push({
            x: p.x + (Math.random() - 0.5) * tl * 0.8, y: hy - tl * 0.6, t: 0,
            s: Math.round(e.dmg) + '', eff: e.eff, col: e.shielded ? '#9ff0ff' : e.eff > 0 ? '#ffd23f' : e.eff < 0 ? '#c9ccd3' : '#ffffff', big: e.eff > 0
          });
        }
        if (e.eff > 0 && (!e.u._se || this.time - e.u._se > 1.4) && (e.u._se = this.time)) this.nums.push({ x: p.x, y: hy - tl * 1.5, t: 0, s: 'Super effective!', col: '#ffe36a', small: true });
        break;
      case 'thorn':
        p = this.toScreen(e.u.x, e.u.y);
        this.nums.push({ x: p.x, y: p.y - tl * 1.6, t: 0, s: Math.round(e.dmg) + '', col: '#9be36b' });
        break;
      case 'heal':
        p = this.toScreen(e.to.x, e.to.y);
        var q = this.toScreen(e.from.x, e.from.y);
        this.fx.push({ k: 'healbeam', x: q.x, y: q.y - tl * 1.0, x2: p.x, y2: p.y - tl * 0.8, t: 0, d: 0.35, layer: 'air' });
        for (i = 0; i < 4; i++) this.fx.push({ k: 'plus', x: p.x + (Math.random() - 0.5) * tl, y: p.y - tl * 0.4, vx: 0, vy: -tl * 2.2, t: -i * 0.06, d: 0.7, r: tl * 0.22, layer: 'air' });
        if (e.amt >= 20 && (!e.to._hn || this.time - e.to._hn > 1.2) && (e.to._hn = this.time)) this.nums.push({ x: p.x, y: p.y - tl * 1.7, t: 0, s: '+' + Math.round(e.amt), col: '#7dff8a' });
        break;
      case 'shield':
        p = this.toScreen(e.to.x, e.to.y);
        this.fx.push({ k: 'ring', x: p.x, y: p.y - tl * 0.7, t: 0, d: 0.4, r: tl * 1.4, col: '160,235,255', layer: 'air' });
        break;
      case 'unshield':
        p = this.toScreen(e.u.x, e.u.y);
        for (i = 0; i < 6; i++) { var a2 = i / 6 * TAU; this.fx.push({ k: 'spark', x: p.x, y: p.y - tl * 0.8, vx: cos(a2) * tl * 4, vy: sin(a2) * tl * 4, t: 0, d: 0.35, r: tl * 0.2, col: '#bff4ff', layer: 'air' }); }
        break;
      case 'chain':
        var pts = e.pts.map(function (pt, ii) { var s = this.toScreen(pt.x, pt.y); return { x: s.x, y: s.y - tl * (ii === 0 ? (e.u.sp.fly ? 1.8 : 1.2) : 0.8) }; }, this);
        this.fx.push({ k: 'bolt', pts: pts, t: 0, d: 0.28, layer: 'air' });
        break;
      case 'beam':
        var b0 = this.toScreen(e.x0, e.y0), b1 = this.toScreen(e.x1, e.y1);
        this.fx.push({ k: 'beam', x: b0.x + e.u.face * tl * 0.6, y: b0.y - tl * 2.6, x2: b1.x, y2: b1.y - tl * 0.8, t: 0, d: 0.5, layer: 'air' });
        this.shake = 7; this.hype = Math.max(this.hype, 0.8);
        break;
      case 'cone':
        p = this.toScreen(e.u.x, e.u.y);
        for (i = 0; i < 26; i++) {
          var ang = Math.atan2(e.ay, e.ax) + (Math.random() - 0.5) * e.half * 2;
          var spd = (0.6 + Math.random() * 0.6) * e.reach * tl / 0.45;
          this.fx.push({ k: 'fire', x: p.x + e.ax * tl * 0.8, y: p.y - tl * 0.8, vx: cos(ang) * spd, vy: sin(ang) * spd, t: -Math.random() * 0.08, d: 0.45, r: tl * (0.25 + Math.random() * 0.25), layer: 'air' });
        }
        this.shake = Math.max(this.shake, 3);
        break;
      case 'burst':
        p = this.toScreen(e.x, e.y);
        var col = e.kind === 'spore' ? '190,110,230' : '255,120,210';
        this.fx.push({ k: 'ring', x: p.x, y: p.y, t: 0, d: 0.4, r: e.r * tl, col: col, layer: 'ground', fill: true });
        for (i = 0; i < 8; i++) {
          var a3 = i / 8 * TAU;
          this.fx.push({ k: 'puff', x: p.x + cos(a3) * e.r * tl * 0.5, y: p.y + sin(a3) * e.r * tl * 0.3, vx: cos(a3) * tl, vy: -tl * 0.8, t: 0, d: 0.7, r: tl * 0.4, col: col, layer: 'air' });
        }
        break;
      case 'pop2':
        p = this.toScreen(e.x, e.y);
        this.fx.push({ k: 'ring', x: p.x, y: p.y - tl * 0.7, t: 0, d: 0.25, r: tl * 0.7, col: e.kind === 'bubble' ? '150,215,255' : e.kind === 'star' ? '255,220,90' : '255,255,255', layer: 'air' });
        break;
      case 'leap':
        p = this.toScreen(e.u.x, e.u.y);
        this.fx.push({ k: 'ring', x: p.x, y: p.y, t: 0, d: 0.3, r: tl * 1.0, col: '255,255,255', layer: 'ground' });
        break;
      case 'land':
        p = this.toScreen(e.u.x, e.u.y);
        for (i = 0; i < 6; i++) this.fx.push({ k: 'dust', x: p.x, y: p.y + tl * 0.3, vx: (Math.random() - 0.5) * tl * 5, vy: -tl * Math.random() * 1.5, t: 0, d: 0.45, r: tl * 0.25, layer: 'ground' });
        break;
      case 'bash':
        p = this.toScreen(e.t.x, e.t.y);
        this.fx.push({ k: 'ring', x: p.x, y: p.y - tl * 0.6, t: 0, d: 0.35, r: tl * 1.6, col: '255,230,150', layer: 'air' });
        this.shake = Math.max(this.shake, 5);
        break;
      case 'faint':
        p = this.toScreen(e.u.x, e.u.y);
        for (i = 0; i < 3; i++) this.fx.push({ k: 'dizzy', x: p.x, y: p.y - tl * 1.6, t: -i * 0.1, d: 1.0, ph: i * TAU / 3, r: tl * 0.6, layer: 'air' });
        for (i = 0; i < 6; i++) this.fx.push({ k: 'dust', x: p.x, y: p.y + tl * 0.2, vx: (Math.random() - 0.5) * tl * 3, vy: -tl * Math.random(), t: 0.3, d: 0.9, r: tl * 0.35, layer: 'ground' });
        break;
      case 'ko':
        this.hype = 1;
        var nm = SP[e.sp].name;
        this.toast(e.side === 1 ? 'Foe ' + nm + ' fainted!' : nm + ' fainted!', e.side === 1 ? TEAM[0] : TEAM[1]);
        this.confetti(e.side === 1 ? 0 : 1);
        break;
      case 'double':
        this.banner('2× ENERGY!', '#ff8a1f');
        this.hype = 1;
        break;
      case 'overtime':
        this.banner('SUDDEN DEATH!', '#ff4d5e', 'Next KO wins!');
        this.hype = 1;
        break;
      case 'end':
        this.hype = 1;
        this.confetti(e.winner === 1 ? 1 : 0, 70);
        break;
    }
  };

  P.confetti = function (side, n) {
    var L = this.L;
    n = n || 26;
    for (var i = 0; i < n; i++) {
      var fromTop = Math.random() < 0.5;
      var x = Math.random() * this.W;
      var y = fromTop ? L.hudH + 20 + Math.random() * 20 : L.handY - 10;
      this.fx.push({
        k: 'confetti', x: x, y: y, vx: (Math.random() - 0.5) * 80, vy: (fromTop ? 1 : -1) * (60 + Math.random() * 140), t: -Math.random() * 0.3, d: 1.6,
        r: 3 + Math.random() * 2, col: ['#ff4d5e', '#ffd23f', '#3d8bff', '#45c25a', '#ff7ac8', '#ffffff'][(Math.random() * 6) | 0], rot: Math.random() * 6, layer: 'air'
      });
    }
  };

  P.toast = function (s, col) { this.toasts.push({ s: s, col: col, t: 0 }); if (this.toasts.length > 3) this.toasts.shift(); };
  P.banner = function (s, col, sub) { this.banners.push({ s: s, col: col, sub: sub, t: 0 }); };

  P.drawFx = function (c, dt, layer) {
    var fx = this.fx;
    for (var i = fx.length - 1; i >= 0; i--) {
      var f = fx[i];
      if ((f.layer || 'air') !== layer) continue;
      f.t += dt;
      if (f.t >= f.d) { fx.splice(i, 1); continue; }
      if (f.t < 0) continue;
      var k = f.t / f.d;
      switch (f.k) {
        case 'ring':
          c.lineWidth = 3 * (1 - k) + 0.5;
          c.strokeStyle = 'rgba(' + f.col + ',' + (1 - k) + ')';
          H.E(c, f.x, f.y, f.r * (0.3 + k * 0.7), f.r * (0.3 + k * 0.7) * (f.fill ? 0.55 : 1)); c.stroke();
          if (f.fill) { c.fillStyle = 'rgba(' + f.col + ',' + (0.3 * (1 - k)) + ')'; c.fill(); }
          break;
        case 'flashc':
          c.save(); c.globalCompositeOperation = 'lighter';
          H.C(c, f.x, f.y, f.r * (0.5 + k)); c.fillStyle = 'rgba(255,255,230,' + (0.8 * (1 - k)) + ')'; c.fill();
          c.restore();
          break;
        case 'flash':
          c.fillStyle = 'rgba(255,255,255,' + (1 - k) + ')';
          Art.sparkleStar(c, f.x, f.y, 5 * (1 - k * 0.5), c.fillStyle);
          break;
        case 'spark':
          f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 400 * dt * 0.3;
          Art.sparkleStar(c, f.x, f.y, f.r * (1 - k * 0.6), f.col);
          break;
        case 'hitstar':
          c.save(); c.globalAlpha = 1 - k;
          Art.sparkleStar(c, f.x, f.y, f.r * (0.6 + k * 0.8), '#ffffff');
          Art.sparkleStar(c, f.x, f.y, f.r * (0.3 + k * 0.4), '#ffe36a');
          c.restore();
          break;
        case 'plus':
          f.y += f.vy * dt;
          c.fillStyle = 'rgba(110,240,120,' + (1 - k) + ')';
          c.fillRect(f.x - f.r, f.y - f.r * 0.3, f.r * 2, f.r * 0.6);
          c.fillRect(f.x - f.r * 0.3, f.y - f.r, f.r * 0.6, f.r * 2);
          break;
        case 'healbeam':
          c.save(); c.globalCompositeOperation = 'lighter';
          c.strokeStyle = 'rgba(140,255,150,' + (0.7 * (1 - k)) + ')'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(f.x, f.y); c.quadraticCurveTo((f.x + f.x2) / 2, Math.min(f.y, f.y2) - 20, f.x2, f.y2); c.stroke();
          c.restore();
          break;
        case 'bolt':
          c.save(); c.globalCompositeOperation = 'lighter';
          for (var pass = 0; pass < 2; pass++) {
            c.strokeStyle = pass ? 'rgba(255,255,255,' + (1 - k) + ')' : 'rgba(92,200,255,' + (0.8 * (1 - k)) + ')';
            c.lineWidth = pass ? 1.8 : 6;
            c.beginPath();
            for (var j = 0; j < f.pts.length - 1; j++) {
              var p0 = f.pts[j], p1 = f.pts[j + 1];
              c.moveTo(p0.x, p0.y);
              for (var s = 1; s <= 5; s++) {
                var kk = s / 5;
                var jx = s < 5 ? (Math.random() - 0.5) * 10 : 0, jy = s < 5 ? (Math.random() - 0.5) * 10 : 0;
                c.lineTo(p0.x + (p1.x - p0.x) * kk + jx, p0.y + (p1.y - p0.y) * kk + jy);
              }
            }
            c.stroke();
          }
          c.restore();
          break;
        case 'beam':
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          var w = this.L.tile * (1 - k * 0.6);
          c.strokeStyle = 'rgba(60,130,255,' + (0.5 * (1 - k)) + ')'; c.lineWidth = w * 2.2;
          c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
          c.strokeStyle = 'rgba(150,210,255,' + (0.8 * (1 - k)) + ')'; c.lineWidth = w * 1.1; c.stroke();
          c.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; c.lineWidth = w * 0.45; c.stroke();
          c.restore();
          break;
        case 'fire':
          f.x += f.vx * dt; f.y += f.vy * dt;
          c.save(); c.globalCompositeOperation = 'lighter';
          var fr = f.r * (0.6 + k);
          H.C(c, f.x, f.y, fr);
          c.fillStyle = k < 0.3 ? 'rgba(255,240,150,' + (1 - k) + ')' : k < 0.6 ? 'rgba(255,150,40,' + (1 - k) + ')' : 'rgba(220,60,20,' + (1 - k) + ')';
          c.fill(); c.restore();
          break;
        case 'puff':
          f.x += f.vx * dt; f.y += f.vy * dt;
          H.C(c, f.x, f.y, f.r * (0.6 + k * 0.8)); c.fillStyle = 'rgba(' + f.col + ',' + (0.5 * (1 - k)) + ')'; c.fill();
          break;
        case 'dust':
          f.x += f.vx * dt; f.y += f.vy * dt;
          H.C(c, f.x, f.y, f.r * (0.6 + k)); c.fillStyle = 'rgba(235,225,200,' + (0.6 * (1 - k)) + ')'; c.fill();
          break;
        case 'dizzy':
          var an2 = f.ph + f.t * 7;
          Art.star5(c, f.x + cos(an2) * f.r, f.y + sin(an2) * f.r * 0.35, f.r * 0.35, 0.45, f.t * 5);
          c.fillStyle = 'rgba(255,220,60,' + (1 - k) + ')'; c.fill();
          break;
        case 'confetti':
          f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 120 * dt; f.vx *= 0.99; f.rot += dt * 8;
          c.save(); c.translate(f.x, f.y); c.rotate(f.rot); c.globalAlpha = Math.min(1, (1 - k) * 2);
          c.fillStyle = f.col; c.fillRect(-f.r, -f.r * 0.5, f.r * 2, f.r * Math.abs(cos(f.rot * 1.3)));
          c.restore();
          break;
      }
    }
  };

  P.drawNums = function (c, dt) {
    for (var i = this.nums.length - 1; i >= 0; i--) {
      var n = this.nums[i];
      n.t += dt;
      var d = n.small ? 1.0 : 0.85;
      if (n.t > d) { this.nums.splice(i, 1); continue; }
      var k = n.t / d;
      var pop = n.t < 0.12 ? 0.6 + n.t / 0.12 * 0.6 : 1.2 - Math.min(0.2, (n.t - 0.12));
      c.save(); c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      var size = n.small ? 10 : n.big ? 15 : 12;
      text(c, n.s, n.x, n.y - k * 22, size * pop, n.col, '#2b1f33');
      c.restore();
    }
  };

  P.drawToasts = function (c, dt) {
    var L = this.L;
    for (var i = this.toasts.length - 1; i >= 0; i--) {
      var o = this.toasts[i];
      o.t += dt;
      if (o.t > 2.0) { this.toasts.splice(i, 1); continue; }
      var idx = this.toasts.length - 1 - i;
      var a = o.t < 0.2 ? o.t / 0.2 : o.t > 1.7 ? (2.0 - o.t) / 0.3 : 1;
      c.save(); c.globalAlpha = a;
      c.font = '800 13px ' + FONT;
      var w = c.measureText(o.s).width + 26;
      var x = this.W / 2 - w / 2, y = L.fy + L.tile * 1.2 + idx * 30;
      rr(c, x, y, w, 24, 8); c.fillStyle = 'rgba(255,255,255,0.94)'; c.fill();
      c.lineWidth = 3; c.strokeStyle = '#2b1f33'; c.stroke();
      c.lineWidth = 1.5; c.strokeStyle = o.col; rr(c, x + 3, y + 3, w - 6, 18, 6); c.stroke();
      text(c, o.s, this.W / 2, y + 12.5, 13, '#2b1f33', null, 'center', '800');
      c.restore();
    }
  };

  P.drawBanners = function (c, dt) {
    if (!this.banners.length) return;
    var o = this.banners[0];
    o.t += dt;
    if (o.t > 2.2) { this.banners.shift(); return; }
    var k = o.t < 0.3 ? easeOutBack(o.t / 0.3) : o.t > 1.9 ? 1 - (o.t - 1.9) / 0.3 : 1;
    var cy = this.L.fy + this.L.fh * 0.5;
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, k));
    c.fillStyle = 'rgba(43,31,51,0.55)';
    c.fillRect(0, cy - 30, this.W, o.sub ? 66 : 54);
    c.translate(this.W / 2, cy - 2); c.scale(k, k);
    text(c, o.s, 0, 0, 30, o.col, '#ffffff');
    if (o.sub) text(c, o.sub, 0, 26, 14, '#ffffff', '#2b1f33', 'center', '800');
    c.restore();
  };

  P.drawCountdown = function (c, cd) {
    var n = Math.ceil(cd), k = n - cd;
    var s = n > 0 ? n + '' : 'BATTLE!';
    var sc = n > 0 ? 1.6 - k * 0.6 : 1 + Math.min(0.3, -cd);
    c.save();
    c.globalAlpha = n > 0 ? 1 : Math.max(0, 1 + cd * 1.5);
    c.translate(this.W / 2, this.L.fy + this.L.fh / 2);
    c.scale(sc, sc);
    text(c, s, 0, 0, n > 0 ? 54 : 40, '#ffd23f', '#1d4fb0');
    c.restore();
  };

  // ---------------------------------------------------------------------------
  P.drawPips = function (c, side, b, x, y, size) {
    var s = b.sides[side];
    var recs = s.records;
    for (var i = 0; i < R.capsules; i++) {
      var px = x + (i % 6) * (size * 2.3), py = y + ((i / 6) | 0) * (size * 2.2);
      var state = i < recs.length ? (recs[i].done ? 'ko' : 'out') : 'ready';
      c.save();
      if (state === 'ready') Art.capsule(c, px, py, size, side, 0);
      else if (state === 'out') {
        c.globalAlpha = 0.9;
        H.C(c, px, py, size); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill();
        c.lineWidth = 1.6; c.strokeStyle = TEAM[side]; c.stroke();
        H.C(c, px, py, size * 0.35); c.fillStyle = TEAM[side]; c.fill();
      } else {
        H.C(c, px, py, size); c.fillStyle = '#8a8f99'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#4a4f59'; c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(px - size * 0.45, py - size * 0.45); c.lineTo(px + size * 0.45, py + size * 0.45);
        c.moveTo(px + size * 0.45, py - size * 0.45); c.lineTo(px - size * 0.45, py + size * 0.45); c.stroke();
      }
      c.restore();
    }
  };

  P.drawHUD = function (c, b, ui, t) {
    var L = this.L, W = this.W / L.ui;
    c.save(); c.scale(L.ui, L.ui);
    // enemy plate
    var px = 8, py = 6, pw = Math.min(210, W * 0.52), ph = 48;
    rr(c, px, py, pw, ph, 12); c.fillStyle = 'rgba(255,255,255,0.92)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = TEAM[1]; c.stroke();
    // portrait
    c.save(); H.C(c, px + 24, py + 24, 18); c.fillStyle = '#ffe3e6'; c.fill(); c.clip();
    Art.trainer(c, ui.looks[1], px + 24, py + 52, 0.42, false, { t: t });
    c.restore();
    H.C(c, px + 24, py + 24, 18); c.lineWidth = 2.5; c.strokeStyle = TEAM[1]; c.stroke();
    text(c, ui.names[1].toUpperCase(), px + 48, py + 13, 12, '#2b1f33', null, 'left', '900');
    this.drawPips(c, 1, b, px + 54, py + 27, 4.6);
    // timer + score
    var tw = 92, tx = W - tw - 8, ty = 6;
    rr(c, tx, ty, tw, 48, 12); c.fillStyle = 'rgba(255,255,255,0.92)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#2b1f33'; c.stroke();
    var tm = Math.max(0, Math.ceil(b.time)), mm = (tm / 60) | 0, ss = tm % 60;
    var tcol = b.overtime ? '#ff4d5e' : b.time <= R.doubleAt ? '#ff8a1f' : '#2b1f33';
    text(c, mm + ':' + (ss < 10 ? '0' : '') + ss, tx + tw / 2, ty + 15, 17, tcol, null, 'center', '900');
    if (b.overtime || b.time <= R.doubleAt) {
      var tag = b.overtime ? '×3' : '×2';
      rr(c, tx + tw - 26, ty - 6, 28, 15, 7); c.fillStyle = '#ff8a1f'; c.fill();
      text(c, tag, tx + tw - 12, ty + 1.5, 10, '#fff', null, 'center', '900');
    }
    // KO score: you vs foe
    text(c, b.sides[0].ko + '', tx + 22, ty + 36, 16, TEAM[0], null, 'center', '900');
    text(c, 'KO', tx + tw / 2, ty + 36, 10, '#7a7f8a', null, 'center', '900');
    text(c, b.sides[1].ko + '', tx + tw - 22, ty + 36, 16, TEAM[1], null, 'center', '900');
    c.restore();
  };

  P.drawCard = function (c, id, x, y, w, h, t, state) {
    var sp = SP[id], role = CA.ROLES[sp.role];
    c.save();
    if (state.lift) c.translate(0, -state.lift);
    // frame
    rr(c, x, y, w, h, 8);
    var g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, role.frameL); g.addColorStop(0.5, role.frame); g.addColorStop(1, Art.shade(role.frame, -0.25));
    c.fillStyle = g; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = state.sel ? '#ffffff' : '#2b1f33'; c.stroke();
    if (sp.role === 'legend') { c.lineWidth = 1.5; c.strokeStyle = '#ffd76a'; rr(c, x + 2.5, y + 2.5, w - 5, h - 5, 6); c.stroke(); }
    // art window
    var ax = x + w * 0.09, ay = y + h * 0.08, aw = w * 0.82, ah = h * 0.64;
    rr(c, ax, ay, aw, ah, 4);
    var T = CA.TYPES[sp.type];
    var ag = c.createLinearGradient(ax, ay, ax, ay + ah);
    ag.addColorStop(0, '#e9f8ff'); ag.addColorStop(1, T.light);
    c.fillStyle = ag; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(43,31,51,0.7)'; c.stroke();
    c.save(); rr(c, ax, ay, aw, ah, 4); c.clip();
    var hgt = Art.height(id);
    var sc = (ah * 0.92) / hgt;
    var feetY = ay + ah * 0.96 + (sp.fly ? ah * 0.12 : 0);
    var a = { t: t + x * 0.01, mv: 0, walk: 0, atk: 0, hurt: 0, blink: ((t + x) % 4) < 0.12, faint: 0 };
    Art.creature(c, id, a, ax + aw * 0.5, feetY, sc, 1);
    if (sp.n > 1) text(c, '×' + sp.n, ax + aw - 4, ay + ah - 8, Math.max(10, w * 0.14), '#fff', '#2b1f33', 'right', '900');
    c.restore();
    // name strip
    var ny = ay + ah + h * 0.03, nh = h * 0.17;
    rr(c, ax, ny, aw, nh, 3); c.fillStyle = 'rgba(255,255,255,0.88)'; c.fill();
    var fsz = Math.min(w * 0.135, 12);
    text(c, sp.name, x + w / 2, ny + nh / 2 + 0.5, fsz, '#2b1f33', null, 'center', '800');
    // cost orb
    var or = Math.max(9, w * 0.15);
    var ox = x + or * 0.75, oy = y + or * 0.75;
    var og = c.createRadialGradient(ox - or * 0.3, oy - or * 0.35, 1, ox, oy, or);
    og.addColorStop(0, '#fff7b0'); og.addColorStop(0.5, '#ffc21f'); og.addColorStop(1, '#ff7a1f');
    H.C(c, ox, oy, or); c.fillStyle = og; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2b1f33'; c.stroke();
    text(c, sp.cost + '', ox, oy + 1, or * 1.15, '#ffffff', '#8a3a00', 'center', '900');
    Art.typeIcon(c, sp.type, x + w - or * 0.7, y + or * 0.7, or * 0.62);
    // can't afford: dim with a fill gauge
    if (state.dim) {
      rr(c, x, y, w, h, 8); c.fillStyle = 'rgba(40,40,55,0.55)'; c.fill();
      var f = clamp(state.progress || 0, 0, 1);
      c.save(); rr(c, x, y, w, h, 8); c.clip();
      c.fillStyle = 'rgba(255,200,60,0.25)'; c.fillRect(x, y + h * (1 - f), w, h * f);
      c.restore();
    }
    c.restore();
  };

  // hand cards are pre-rendered once per size; only the overlays change per frame
  P.cardImg = function (id, w, h) {
    var key = id + '|' + Math.round(w) + '|' + Math.round(h);
    var cv = this.cardCache[key];
    if (!cv) {
      cv = this.cardCache[key] = document.createElement('canvas');
      var d = this.dpr;
      cv.width = Math.ceil((w + 4) * d); cv.height = Math.ceil((h + 4) * d);
      var cc = cv.getContext('2d');
      cc.setTransform(d, 0, 0, d, 0, 0);
      this.drawCard(cc, id, 2, 2, w, h, 0.4, {});
    }
    return cv;
  };
  P.handCard = function (c, id, x, y, w, h, st) {
    c.save();
    if (st.lift) c.translate(0, -st.lift);
    if (st.alpha) c.globalAlpha = st.alpha;
    c.drawImage(this.cardImg(id, w, h), x - 2, y - 2, w + 4, h + 4);
    if (st.sel) { rr(c, x, y, w, h, 8); c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.stroke(); rr(c, x - 2, y - 2, w + 4, h + 4, 9); c.lineWidth = 1.5; c.strokeStyle = '#2b1f33'; c.stroke(); }
    if (st.dim) {
      rr(c, x, y, w, h, 8); c.fillStyle = 'rgba(40,40,55,0.55)'; c.fill();
      var f = clamp(st.progress || 0, 0, 1);
      if (f > 0) {
        c.save(); rr(c, x, y, w, h, 8); c.clip();
        c.fillStyle = 'rgba(255,200,60,0.25)'; c.fillRect(x, y + h * (1 - f), w, h * f);
        c.restore();
      }
    }
    c.restore();
  };

  P.drawHand = function (c, b, ui, t) {
    var L = this.L, W = this.W, s = b.sides[0];
    var y = L.handY;
    // tray
    rr(c, 4, y, W - 8, L.handH + 20, 18);
    var g = c.createLinearGradient(0, y, 0, y + L.handH);
    g.addColorStop(0, 'rgba(255,255,255,0.96)'); g.addColorStop(1, 'rgba(220,236,255,0.96)');
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = TEAM[0]; c.stroke();
    // label + pips
    text(c, 'YOU', 16, y + 12, 11, TEAM_D[0], null, 'left', '900');
    this.drawPips(c, 0, b, 52, y + 8, 4.2);
    text(c, s.capsules + ' left', W - 14, y + 12, 11, '#5a6170', null, 'right', '800');
    // next card
    var nx = L.next;
    text(c, 'NEXT', nx.x + nx.w / 2, nx.y - 8, 9, '#5a6170', null, 'center', '900');
    this.handCard(c, s.queue[0], nx.x, nx.y, nx.w, nx.h, { dim: true, progress: 0 });
    // the hand
    for (var i = 0; i < 4; i++) {
      var r = L.cards[i], id = s.hand[i];
      var sp = SP[id];
      var dragging = ui.drag && ui.drag.hi === i;
      var afford = s.energy >= sp.cost && s.capsules > 0;
      if (dragging && ui.drag.onField) {
        this.handCard(c, id, r.x, r.y, r.w, r.h, { dim: !afford, alpha: 0.35 });
        continue;
      }
      this.handCard(c, id, r.x, r.y, r.w, r.h, { dim: !afford, progress: s.energy / sp.cost, sel: ui.sel === i || dragging, lift: (ui.sel === i || dragging) ? 8 : 0 });
    }
    // energy bar
    var e = L.energy;
    rr(c, e.x, e.y, e.w, e.h, e.h / 2); c.fillStyle = '#2b1f33'; c.fill();
    var segW = (e.w - 30) / 10;
    var ex = e.x + 26;
    for (i = 0; i < 10; i++) {
      var f = clamp(s.energy - i, 0, 1);
      rr(c, ex + i * segW + 1, e.y + 3, segW - 2, e.h - 6, 4);
      c.fillStyle = '#463a52'; c.fill();
      if (f > 0) {
        c.save(); rr(c, ex + i * segW + 1, e.y + 3, (segW - 2) * f, e.h - 6, 4); c.clip();
        var eg = c.createLinearGradient(0, e.y, 0, e.y + e.h);
        eg.addColorStop(0, '#fff3a0'); eg.addColorStop(0.5, '#ffc21f'); eg.addColorStop(1, '#ff8a1f');
        c.fillStyle = f >= 1 ? eg : 'rgba(255,194,31,0.55)';
        c.fillRect(ex + i * segW, e.y, segW, e.h);
        c.restore();
      }
    }
    // sun orb with the count
    var sx = e.x + 12, sy = e.y + e.h / 2;
    c.save(); c.translate(sx, sy); c.rotate(t * 0.8);
    c.fillStyle = '#ffd23f';
    for (i = 0; i < 8; i++) { c.rotate(TAU / 8); c.beginPath(); c.moveTo(-3, -11); c.lineTo(0, -16); c.lineTo(3, -11); c.closePath(); c.fill(); }
    c.restore();
    var sg = c.createRadialGradient(sx - 3, sy - 3, 1, sx, sy, 13);
    sg.addColorStop(0, '#fff7b0'); sg.addColorStop(0.6, '#ffc21f'); sg.addColorStop(1, '#ff8a1f');
    H.C(c, sx, sy, 12.5); c.fillStyle = sg; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2b1f33'; c.stroke();
    text(c, Math.floor(s.energy) + '', sx, sy + 1, 14, '#ffffff', '#8a3a00', 'center', '900');
    // floating card under the finger while dragging over the tray
    if (ui.drag && !ui.drag.onField) {
      var d = ui.drag, cw = L.cardW * 0.9, ch = L.cardH * 0.9;
      this.handCard(c, s.hand[d.hi], d.sx - cw / 2, d.sy - ch * 0.8, cw, ch, { sel: true, alpha: 0.92 });
    }
  };

  P.cardAt = function (x, y) {
    var L = this.L;
    for (var i = 0; i < 4; i++) {
      var r = L.cards[i];
      if (x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 10 && y <= r.y + r.h + 6) return i;
    }
    return -1;
  };
})(typeof window !== 'undefined' ? window : globalThis);
