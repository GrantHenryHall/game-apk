/* Critter Arena 2 — stadium renderer.
 * A perspective pitch inside a bowl of cheering fans, an LED jumbotron, Gen-1 style text box,
 * evolution sequences, crowd boosts and all battle effects. */
(function (root) {
  var CA = root.CA, Art = CA.Art, R = CA.RULES, SP = CA.SPECIES;
  var TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  var H = Art.helpers;
  var TEAM = ['#3d8bff', '#ff4d5e'], TEAM_L = ['#a8ccff', '#ffb0b8'], TEAM_D = ['#1d4fb0', '#b0202e'];
  var FONT = '"Trebuchet MS", "Segoe UI", Roboto, system-ui, sans-serif';
  var SF = 0.6, CURVE = 0.32;   // far-edge scale and depth foreshortening of the pitch

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
  function vscale(sp, tl) { return (1.15 + sp.r * 2.35) * tl / 100; }
  CA.rr = rr; CA.text = text; CA.FONT = FONT;

  function Renderer(canvas) {
    this.cv = canvas;
    this.c = canvas.getContext('2d');
    this.bg = document.createElement('canvas');
    this.sil = document.createElement('canvas'); // silhouette scratch for evolutions
    this.fx = []; this.nums = []; this.callouts = []; this.banners = [];
    this.dialog = []; this.dlg = null;
    this.shake = 0; this.time = 0; this.hype = 0.15; this.wave = -1;
    this.trainerAnim = [{ throwT: 9 }, { throwT: 9 }];
    this.cam = { z: 1, fx: 0, fy: 0, tz: 1, tfx: 0, tfy: 0 };
    this.jumbo = { msg: null, t: 0, col: '#ffd23f' };
  }
  CA.Renderer = Renderer;
  var P = Renderer.prototype;

  // ---------------------------------------------------------------------------
  // layout & projection
  P.resize = function (W, Hh, dpr) {
    this.W = W; this.H = Hh; this.dpr = dpr;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(Hh * dpr);
    this.cv.style.width = W + 'px'; this.cv.style.height = Hh + 'px';
    var L = this.L = {};
    var ui = L.ui = clamp(Math.min(W / 412, Hh / 915), 1, 1.7);
    // hand
    var cardW = Math.min(Hh * 0.1, (W - 14 - 5 * 6) / 4.62);
    L.cardW = cardW; L.cardH = cardW * 1.27;
    L.nextW = cardW * 0.62; L.nextH = L.nextW * 1.27;
    L.handH = 30 * ui + L.cardH + 38;
    L.handY = Hh - L.handH;
    var gap = 6, total = L.nextW + 4 * cardW + 4 * gap;
    var x0 = (W - total) / 2, cy = L.handY + 28 * ui;
    L.next = { x: x0, y: cy + L.cardH - L.nextH, w: L.nextW, h: L.nextH };
    L.cards = [];
    for (var i = 0; i < 4; i++) L.cards.push({ x: x0 + L.nextW + gap + i * (cardW + gap), y: cy, w: cardW, h: L.cardH });
    L.energy = { x: x0 + L.nextW + gap, y: cy + L.cardH + 9, w: 4 * cardW + 3 * gap, h: 20 };
    L.boost = { x: W - 8 - 112 * ui, y: L.handY + 5 * ui, w: 104 * ui, h: 20 * ui };
    // jumbotron + pitch
    L.jw = Math.min(W * 0.38, 200 * ui); L.jh = L.jw * 0.44;
    L.jx = W / 2 - L.jw / 2; L.jy = 8 * ui;
    L.dlgY = L.jy + L.jh + 10 * ui;
    var nearY = L.handY - 40 * ui;
    var topMin = Math.max(L.dlgY + 64 * ui, Hh * 0.24);
    var tile = Math.min((W - 18) / R.W, (nearY - topMin) / 20);
    L.tile = tile;
    L.fh = 20 * tile;
    L.top = nearY - L.fh;
    L.near = nearY;
    L.cx = W / 2;
    // legacy names used by some effects
    L.fx = L.cx - 9 * tile; L.fy = L.top; L.fw = 18 * tile;
    this.cardCache = {};
    this.c.__g = null;
    this.cam.fx = this.cam.tfx = W / 2; this.cam.fy = this.cam.tfy = Hh / 2;
    this.buildBackground();
    this.buildCrowd();
  };

  // field (x across 0..18, y depth 0 far .. 30 near) -> screen
  P.proj = function (x, y, z) {
    var L = this.L, t = y / R.H;
    var s = SF + (1 - SF) * t;
    var sy = L.top + L.fh * (t + CURVE * t * t) / (1 + CURVE);
    var o = { x: L.cx + (x - R.W / 2) * L.tile * s, y: sy, s: s };
    if (z) o.y -= z * L.tile * s * 0.85;
    return o;
  };
  P.toScreen = function (x, y) { return this.proj(x, y); };
  P.unproj = function (sx, sy) {
    var L = this.L;
    var k = (sy - L.top) / L.fh * (1 + CURVE);
    var t = (-1 + Math.sqrt(Math.max(0, 1 + 4 * CURVE * k))) / (2 * CURVE);
    var s = SF + (1 - SF) * t;
    return { x: R.W / 2 + (sx - L.cx) / (L.tile * s), y: t * R.H };
  };
  P.toField = P.unproj;
  // vertical/horizontal size ratio of a ground patch at depth y (for ellipses)
  P.aspect = function (y) {
    var L = this.L, t = y / R.H;
    var vt = L.fh * (1 + 2 * CURVE * t) / ((1 + CURVE) * R.H);
    return vt / (L.tile * (SF + (1 - SF) * t));
  };

  // the stadium bowl: rings of tiers around three sides of the pitch
  function ringD(k) { return 1.35 + k * 0.92; }
  function ringZ(k) { return 0.55 + k * 0.58; }
  P.perimeter = function (d, z) {
    var pts = [], i, n;
    for (i = R.H + 1; i >= 0; i -= 1) pts.push(this.proj(-d, i, z));
    for (i = 1; i < 8; i++) { var a = PI + i / 8 * PI / 2; pts.push(this.proj(cos(a) * d, sin(a) * d, z)); }
    for (i = 0; i <= R.W; i += 1) pts.push(this.proj(i, -d, z));
    for (i = 1; i < 8; i++) { var b = PI * 1.5 + i / 8 * PI / 2; pts.push(this.proj(R.W + cos(b) * d, sin(b) * d, z)); }
    for (i = 0; i <= R.H + 1; i += 1) pts.push(this.proj(R.W + d, i, z));
    void n;
    return pts;
  };

  P.buildBackground = function () {
    var L = this.L, W = this.W, Hh = this.H, dpr = this.dpr, i, k;
    var bg = this.bg;
    bg.width = this.cv.width; bg.height = this.cv.height;
    var c = bg.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // how many rings until the bowl reaches the jumbotron
    var K = 0, target = L.jy + L.jh * 0.55;
    while (K < 22 && this.proj(R.W / 2, -ringD(K), ringZ(K)).y > target) K++;
    this.K = K;
    var rim = this.proj(R.W / 2, -ringD(K), ringZ(K)).y;
    this.rimY = rim;
    // sky
    var g = c.createLinearGradient(0, 0, 0, rim + 20);
    g.addColorStop(0, '#46b2ff'); g.addColorStop(0.7, '#9fdcff'); g.addColorStop(1, '#d6f0ff');
    c.fillStyle = g; c.fillRect(0, 0, W, Hh);
    // distant hills peeking over the rim
    c.fillStyle = '#9ed98a';
    c.beginPath(); c.moveTo(0, rim + 4);
    for (var hx = 0; hx <= W; hx += 20) c.lineTo(hx, rim - 6 - Math.abs(sin(hx * 0.013)) * 16 - sin(hx * 0.031) * 4);
    c.lineTo(W, rim + 4); c.closePath(); c.fill();
    // floodlight towers at the back corners
    for (k = 0; k < 2; k++) {
      var base = this.proj(k ? R.W + ringD(K) * 0.75 : -ringD(K) * 0.75, -ringD(K) * 0.75, ringZ(K));
      var top = base.y - L.tile * 4.2;
      c.fillStyle = '#8c9ab0'; c.fillRect(base.x - 2, top, 4, base.y - top);
      rr(c, base.x - 17, top - 12, 34, 18, 4); c.fillStyle = '#5a6a82'; c.fill();
      c.fillStyle = '#fffbe0';
      for (var q = 0; q < 8; q++) { c.beginPath(); c.arc(base.x - 12 + (q % 4) * 8, top - 7 + ((q / 4) | 0) * 8, 2.8, 0, TAU); c.fill(); }
    }
    // stand tiers, back to front
    var rings = [];
    for (k = 0; k <= K; k++) rings.push(this.perimeter(ringD(k), ringZ(k)));
    for (k = K - 1; k >= 0; k--) {
      var a = rings[k], b = rings[k + 1];
      c.beginPath(); c.moveTo(a[0].x, a[0].y);
      for (i = 1; i < a.length; i++) c.lineTo(a[i].x, a[i].y);
      for (i = b.length - 1; i >= 0; i--) c.lineTo(b[i].x, b[i].y);
      c.closePath();
      c.fillStyle = k % 2 ? '#d9e3f1' : '#eef3fa'; c.fill();
      c.strokeStyle = 'rgba(140,160,190,0.35)'; c.lineWidth = 1; c.stroke();
    }
    // rim
    var rp = rings[K];
    c.beginPath(); c.moveTo(rp[0].x, rp[0].y);
    for (i = 1; i < rp.length; i++) c.lineTo(rp[i].x, rp[i].y);
    c.lineWidth = 6; c.strokeStyle = '#3d8bff'; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#ffffff'; c.stroke();
    // track + wall
    var tr = this.perimeter(1.05, 0), wt = this.perimeter(1.05, 0.55);
    c.beginPath(); c.moveTo(tr[0].x, tr[0].y);
    for (i = 1; i < tr.length; i++) c.lineTo(tr[i].x, tr[i].y);
    c.closePath(); c.fillStyle = '#e8875c'; c.fill();
    c.beginPath(); c.moveTo(tr[0].x, tr[0].y);
    for (i = 1; i < tr.length; i++) c.lineTo(tr[i].x, tr[i].y);
    for (i = wt.length - 1; i >= 0; i--) c.lineTo(wt[i].x, wt[i].y);
    c.closePath(); c.fillStyle = '#2f74e0'; c.fill();
    // banner panels on the wall
    var cols = ['#ffd23f', '#ff4d5e', '#45c25a', '#ffffff', '#ff8a3d'];
    for (i = 2; i < tr.length - 3; i += 3) {
      var p0 = tr[i], p1 = tr[i + 2], u0 = wt[i], u1 = wt[i + 2];
      c.beginPath();
      c.moveTo(p0.x + (p1.x - p0.x) * 0.1, p0.y + (p1.y - p0.y) * 0.1 - (p0.y - u0.y) * 0.2);
      c.lineTo(p0.x + (p1.x - p0.x) * 0.9, p0.y + (p1.y - p0.y) * 0.9 - (p1.y - u1.y) * 0.2);
      c.lineTo(u0.x + (u1.x - u0.x) * 0.9, u0.y + (u1.y - u0.y) * 0.9 + (p1.y - u1.y) * 0.2);
      c.lineTo(u0.x + (u1.x - u0.x) * 0.1, u0.y + (u1.y - u0.y) * 0.1 + (p0.y - u0.y) * 0.2);
      c.closePath(); c.fillStyle = cols[(i / 3 | 0) % cols.length]; c.fill();
    }
    c.beginPath(); c.moveTo(wt[0].x, wt[0].y);
    for (i = 1; i < wt.length; i++) c.lineTo(wt[i].x, wt[i].y);
    c.lineWidth = 2; c.strokeStyle = '#ffffff'; c.stroke();
    // inner track lane line
    var ln = this.perimeter(0.5, 0);
    c.beginPath(); c.moveTo(ln[0].x, ln[0].y);
    for (i = 1; i < ln.length; i++) c.lineTo(ln[i].x, ln[i].y);
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,0.65)'; c.stroke();
    // pitch rows with mowing stripes
    for (var y = 0; y < R.H; y++) {
      var a0 = this.proj(0, y), a1 = this.proj(R.W, y), b0 = this.proj(0, y + 1), b1 = this.proj(R.W, y + 1);
      c.beginPath(); c.moveTo(a0.x, a0.y); c.lineTo(a1.x, a1.y); c.lineTo(b1.x, b1.y + 0.6); c.lineTo(b0.x, b0.y + 0.6); c.closePath();
      var sh = (y >> 1) % 2;
      c.fillStyle = sh ? '#7fd355' : '#8ddd60'; c.fill();
    }
    // speckles & flowers
    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < 1300; i++) {
      var sp = this.proj(rnd() * R.W, rnd() * R.H);
      c.fillStyle = rnd() < 0.5 ? 'rgba(40,120,40,0.16)' : 'rgba(225,255,190,0.22)';
      c.fillRect(sp.x, sp.y, 1.5 * sp.s + 0.4, 2.2 * sp.s + 0.4);
    }
    for (i = 0; i < 50; i++) {
      var fp = this.proj(rnd() < 0.5 ? rnd() * 1.2 : R.W - rnd() * 1.2, rnd() * R.H);
      c.fillStyle = ['#ffffff', '#ffe36a', '#ff9ad0'][i % 3];
      for (var pq = 0; pq < 4; pq++) { H.C(c, fp.x + cos(pq * PI / 2) * 1.6 * fp.s, fp.y + sin(pq * PI / 2) * 1.2 * fp.s, 1.3 * fp.s + 0.3); c.fill(); }
    }
    // the stand's shadow falls across the far-left of the pitch (sun from the right)
    var s0 = this.proj(0, 0), s1 = this.proj(8.5, 0), s2 = this.proj(0, 13);
    var sg = c.createLinearGradient(s0.x, s0.y, (s1.x + s2.x) / 2, (s1.y + s2.y) / 2);
    sg.addColorStop(0, 'rgba(20,50,60,0.2)'); sg.addColorStop(1, 'rgba(20,50,60,0.1)');
    c.beginPath(); c.moveTo(s0.x, s0.y); c.lineTo(s1.x, s1.y); c.quadraticCurveTo(this.proj(4, 4).x, this.proj(4, 4).y, s2.x, s2.y); c.closePath();
    c.fillStyle = sg; c.fill();
    // team halves tint
    this.fieldPoly(c, 0, 0, R.W, R.MID); c.fillStyle = 'rgba(255,77,94,0.05)'; c.fill();
    this.fieldPoly(c, 0, R.MID, R.W, R.H); c.fillStyle = 'rgba(61,139,255,0.06)'; c.fill();
    // chalk
    c.strokeStyle = 'rgba(255,255,255,0.92)'; c.lineJoin = 'round';
    this.fieldPoly(c, 0.15, 0.15, R.W - 0.15, R.H - 0.15); c.lineWidth = 2.4; c.stroke();
    var m0 = this.proj(0.15, R.MID), m1 = this.proj(R.W - 0.15, R.MID);
    c.beginPath(); c.moveTo(m0.x, m0.y); c.lineTo(m1.x, m1.y); c.stroke();
    this.groundCircle(c, R.W / 2, R.MID, 3); c.stroke();
    // centre emblem
    this.groundCircle(c, R.W / 2, R.MID, 1.9);
    c.save(); c.clip();
    var mc = this.proj(R.W / 2, R.MID);
    c.fillStyle = 'rgba(255,77,94,0.55)'; c.fillRect(mc.x - 200, mc.y - 200, 400, 200);
    c.fillStyle = 'rgba(61,139,255,0.55)'; c.fillRect(mc.x - 200, mc.y, 400, 200);
    c.restore();
    this.groundCircle(c, R.W / 2, R.MID, 1.9); c.stroke();
    this.groundCircle(c, R.W / 2, R.MID, 0.7); c.fillStyle = '#fff'; c.fill(); c.stroke();
    c.save(); c.translate(mc.x, mc.y); c.scale(1, this.aspect(R.MID));
    Art.star5(c, 0, 0, L.tile * 0.5 * mc.s, 0.45); c.fillStyle = '#ffd23f'; c.fill(); c.restore();
    // deploy-zone dashes
    c.setLineDash([6, 6]); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.5)';
    var z0 = this.proj(0.3, R.playerZone[0]), z1 = this.proj(R.W - 0.3, R.playerZone[0]);
    var e0 = this.proj(0.3, R.enemyZone[1]), e1 = this.proj(R.W - 0.3, R.enemyZone[1]);
    c.beginPath(); c.moveTo(z0.x, z0.y); c.lineTo(z1.x, z1.y); c.moveTo(e0.x, e0.y); c.lineTo(e1.x, e1.y); c.stroke();
    c.setLineDash([]);
    // enemy trainer platform beyond the far line
    var tp = this.proj(R.W / 2, -0.55);
    c.fillStyle = '#ff4d5e'; H.E(c, tp.x, tp.y, L.tile * 1.6 * tp.s, L.tile * 0.55 * tp.s); c.fill();
    c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
  };

  P.fieldPoly = function (c, x0, y0, x1, y1) {
    var a = this.proj(x0, y0), b = this.proj(x1, y0), d = this.proj(x1, y1), e = this.proj(x0, y1);
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(e.x, e.y); c.closePath();
  };
  P.groundCircle = function (c, x, y, r, z) {
    c.beginPath();
    for (var i = 0; i <= 40; i++) {
      var a = i / 40 * TAU, p = this.proj(x + cos(a) * r, y + sin(a) * r, z);
      if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y);
    }
    c.closePath();
  };

  P.buildCrowd = function () {
    var crowd = this.crowd = [], K = this.K, W = this.W;
    var shirts = ['#ff4d5e', '#3d8bff', '#ffd23f', '#45c25a', '#ff8a3d', '#a45cff', '#ffffff', '#ff7ac8', '#38d3c8'];
    var skins = ['#ffd9b8', '#f2c193', '#c98d62', '#8a5a3a'];
    var hairs = ['#3a2a1e', '#6b3d1f', '#e8c060', '#1e1a20', '#b0502a', '#ff8a5b'];
    var seed = 99;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var L = this.L;
    for (var k = K - 1; k >= 0; k--) {
      var d = (ringD(k) + ringD(k + 1)) / 2, z = (ringZ(k) + ringZ(k + 1)) / 2 - 0.1;
      // walk the perimeter at ~1 tile spacing
      var segs = [];
      var len = 0;
      var pts = [];
      for (var y = R.H + 1; y >= 0; y -= 0.95) pts.push([-d, y]);
      for (var i = 1; i < 6; i++) { var a = PI + i / 6 * PI / 2; pts.push([cos(a) * d, sin(a) * d]); }
      for (var x = 0; x <= R.W; x += 0.95) pts.push([x, -d]);
      for (i = 1; i < 6; i++) { var b = PI * 1.5 + i / 6 * PI / 2; pts.push([R.W + cos(b) * d, sin(b) * d]); }
      for (y = 0; y <= R.H + 1; y += 0.95) pts.push([R.W + d, y]);
      void segs; void len;
      for (i = 0; i < pts.length; i++) {
        if (rnd() < 0.06) continue;
        var px = pts[i][0] + (rnd() - 0.5) * 0.3, py = pts[i][1] + (rnd() - 0.5) * 0.3;
        var p = this.proj(px, py, z);
        if (p.x < -12 || p.x > W + 12 || p.y < this.rimY - 4 || p.y > L.near) continue;
        var near = py > R.MID;
        crowd.push({
          x: p.x, y: p.y, s: p.s * L.tile / 21, pu: i / pts.length,
          shirt: (rnd() * shirts.length) | 0, skin: (rnd() * skins.length) | 0, hair: (rnd() * hairs.length) | 0,
          ph: rnd() * TAU, sp: 2 + rnd() * 3, flag: rnd() < 0.06 ? (near && py > 0 ? 0 : 1) : -1, arms: rnd() < 0.4
        });
      }
    }
    this.shirts = shirts; this.skins = skins; this.hairs = hairs;
  };

  // ---------------------------------------------------------------------------
  P.drawCrowd = function (c, t, b) {
    var cr = this.crowd, hype = this.hype, i, p, n = cr.length;
    var amp = 0.8 + hype * 5;
    var off = this._off || (this._off = new Float32Array(4096));
    if (off.length < n) off = this._off = new Float32Array(n * 2);
    var wave = this.wave;
    var boost = b ? [b.sides[0].boostT > 0, b.sides[1].boostT > 0] : [false, false];
    for (i = 0; i < n; i++) {
      p = cr[i];
      var j = -Math.max(0, sin(t * p.sp * (0.6 + hype) + p.ph)) * amp;
      if (wave >= 0) { var dw = (p.pu - wave) * 14; j -= Math.exp(-dw * dw) * 9; }
      off[i] = j * p.s;
    }
    var excited = hype > 0.3 || boost[0] || boost[1];
    if (excited) {
      c.lineCap = 'round';
      for (var si = 0; si < this.skins.length; si++) {
        c.strokeStyle = this.skins[si]; c.lineWidth = 2 * Math.max(0.6, cr.length ? cr[0].s : 1); c.beginPath();
        for (i = 0; i < n; i++) {
          p = cr[i]; if (!p.arms || p.skin !== si) continue;
          var y0 = p.y + off[i], w = sin(t * 9 + p.ph) * 2 * p.s;
          c.moveTo(p.x - 3 * p.s, y0 + 1); c.lineTo(p.x - 5 * p.s + w, y0 - 7 * p.s);
          c.moveTo(p.x + 3 * p.s, y0 + 1); c.lineTo(p.x + 5 * p.s - w, y0 - 7 * p.s);
        }
        c.stroke();
      }
    }
    var k;
    for (k = 0; k < this.shirts.length; k++) {
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
    // waving team flags (more of them during a boost)
    for (i = 0; i < n; i++) {
      p = cr[i];
      var fl = p.flag;
      if (fl < 0 && !(boost[0] && i % 9 === 0) && !(boost[1] && i % 9 === 4)) continue;
      if (fl < 0) fl = boost[0] && i % 9 === 0 ? 0 : 1;
      var fy = p.y + off[i] - 4 * p.s, wv = sin(t * 6 + p.ph) * 3 * p.s, s = p.s;
      c.strokeStyle = '#5a4a3a'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(p.x + 4 * s, fy + 6 * s); c.lineTo(p.x + 4 * s, fy - 12 * s); c.stroke();
      c.fillStyle = TEAM[fl];
      c.beginPath(); c.moveTo(p.x + 4 * s, fy - 12 * s); c.quadraticCurveTo(p.x + 10 * s, fy - 13 * s + wv, p.x + 16 * s, fy - 11 * s + wv);
      c.lineTo(p.x + 16 * s, fy - 4 * s + wv); c.quadraticCurveTo(p.x + 10 * s, fy - 6 * s + wv, p.x + 4 * s, fy - 5 * s); c.closePath(); c.fill();
    }
    if (Math.random() < 0.1 + hype * 0.5 && n) {
      p = cr[(Math.random() * n) | 0];
      this.fx.push({ k: 'flash', x: p.x, y: p.y - 4 * p.s, t: 0, d: 0.18 });
    }
  };

  P.drawSky = function (c, t) {
    var W = this.W, L = this.L;
    // sun with slow rays
    var sx = W - 30 * L.ui, sy = 26 * L.ui;
    c.save(); c.globalCompositeOperation = 'lighter';
    c.translate(sx, sy); c.rotate(t * 0.12);
    c.fillStyle = 'rgba(255,240,170,0.16)';
    for (var i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(0, 0); c.lineTo(-8, -90); c.lineTo(8, -90); c.closePath(); c.fill(); }
    c.restore();
    var g = this._sunG || (this._sunG = (function () {
      var gg = c.createRadialGradient(0, 0, 2, 0, 0, 44);
      gg.addColorStop(0, 'rgba(255,255,235,1)'); gg.addColorStop(0.35, 'rgba(255,236,140,0.95)'); gg.addColorStop(1, 'rgba(255,220,120,0)');
      return gg;
    })());
    c.save(); c.translate(sx, sy); c.fillStyle = g; H.C(c, 0, 0, 44); c.fill(); c.restore();
    // clouds
    for (i = 0; i < 3; i++) {
      var cx = ((t * (5 + i * 3) + i * 170) % (W + 140)) - 70, cy = (16 + i * 16) * L.ui;
      c.fillStyle = 'rgba(255,255,255,0.88)';
      c.beginPath();
      c.ellipse(cx, cy, 22, 7.5, 0, 0, TAU); c.moveTo(cx + 22, cy - 4);
      c.ellipse(cx + 10, cy - 5, 13, 8.5, 0, 0, TAU); c.moveTo(cx, cy - 6);
      c.ellipse(cx - 9, cy - 3, 11, 6.5, 0, 0, TAU);
      c.fill();
    }
    // the stadium blimp drifting across
    var bx = ((t * 9) % (W + 260)) - 130, by = 30 * L.ui + sin(t * 0.6) * 3;
    c.save(); c.translate(bx, by);
    H.E(c, 0, 0, 34, 12); c.fillStyle = '#f2f6ff'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2b1f33'; c.stroke();
    c.beginPath(); c.moveTo(-30, 0); c.lineTo(-42, -9); c.lineTo(-42, 9); c.closePath(); c.fillStyle = '#ff4d5e'; c.fill(); c.stroke();
    rr(c, -8, 10, 16, 6, 2); c.fillStyle = '#2b3242'; c.fill();
    c.beginPath(); c.rect(-22, -5, 44, 10); c.fillStyle = '#3d8bff'; c.fill();
    Art.pixelText(c, 'CRITTER', 0, 0, 1, '#ffffff', 'center');
    c.restore();
  };

  // LED jumbotron: clock and KOs, flashing big moments
  P.drawJumbo = function (c, b, ui, t) {
    var L = this.L, j = { x: L.jx, y: L.jy, w: L.jw, h: L.jh };
    // housing in front of the back rows of fans
    c.fillStyle = '#5a6a82'; c.fillRect(j.x + j.w * 0.2, j.y + j.h, 5, this.rimY - j.y - j.h + 6); c.fillRect(j.x + j.w * 0.8 - 5, j.y + j.h, 5, this.rimY - j.y - j.h + 6);
    rr(c, j.x - 5, j.y - 5, j.w + 10, j.h + 10, 8); c.fillStyle = '#2b3242'; c.fill();
    c.lineWidth = 2; c.strokeStyle = '#8aa0c0'; c.stroke();
    c.fillStyle = '#ffd23f'; c.fillRect(j.x - 5, j.y + j.h + 2, j.w + 10, 3);
    c.save();
    rr(c, j.x, j.y, j.w, j.h, 4); c.fillStyle = '#0b1220'; c.fill(); c.clip();
    // scanlines
    c.fillStyle = 'rgba(255,255,255,0.03)';
    for (var y = j.y; y < j.y + j.h; y += 3) c.fillRect(j.x, y, j.w, 1);
    // pixel sizes chosen so each row fits the screen's width
    var pxBig = Math.max(1.5, Math.floor(Math.min(j.h * 0.5 / 7, j.w * 0.5 / 23) * 2) / 2);
    var pxSm = Math.max(1, Math.floor(Math.min(j.h * 0.24 / 7, j.w / 120) * 2) / 2);
    var J = this.jumbo;
    if (J.msg && J.t > 0) {
      J.t -= 1 / 60;
      var on = ((J.t * 5) | 0) % 2 === 0 || J.t < 0.6;
      var pm = Math.max(1, Math.floor(Math.min(j.h * 0.42 / 7, (j.w - 10) / Art.pixelWidth(J.msg, 1)) * 2) / 2);
      if (on) Art.pixelText(c, J.msg, j.x + j.w / 2, j.y + j.h * 0.5, pm, J.col, 'center', null, true);
    } else if (b) {
      var tm = Math.max(0, Math.ceil(b.time)), mm = (tm / 60) | 0, ss = tm % 60;
      var tc = b.overtime ? '#ff5a5a' : b.time <= R.doubleAt ? '#ffb21f' : '#ffe36a';
      Art.pixelText(c, mm + ':' + (ss < 10 ? '0' : '') + ss, j.x + j.w / 2, j.y + j.h * 0.34, pxBig, tc, 'center', null, true);
      var lab = ui.spectate ? [ui.names[0], ui.names[1]] : ['YOU', ui.names[1]];
      var row = j.y + j.h * 0.8;
      Art.pixelText(c, lab[0].slice(0, 6) + ' ' + b.sides[0].ko, j.x + 5, row, pxSm, '#7fb2ff', 'left', null, true);
      Art.pixelText(c, b.sides[1].ko + ' ' + lab[1].slice(0, 6), j.x + j.w - 5, row, pxSm, '#ff8a95', 'right', null, true);
      var tag = b.overtime ? 'SD' : b.time <= R.doubleAt ? 'X2' : 'KO';
      Art.pixelText(c, tag, j.x + j.w / 2, row, pxSm, tag === 'KO' ? '#6a7a92' : '#ffb21f', 'center', null, true);
    }
    c.restore();
  };
  P.jumboFlash = function (msg, col, dur) { this.jumbo.msg = msg; this.jumbo.col = col || '#ffd23f'; this.jumbo.t = dur || 1.6; };

  // ---------------------------------------------------------------------------
  P.anim = function (u, b, dt) {
    var a = u._a;
    if (!a) a = u._a = { t: u.phase, mv: 0, walk: u.phase, atk: 0, hurt: 0, blink: false, blinkT: 1 + Math.random() * 3, faint: 0, look: 0, evo: 0 };
    a.t += dt;
    a.mv += ((u.moving ? 1 : 0) - a.mv) * Math.min(1, dt * 10);
    var boosted = b.sides[u.side].boostT > 0;
    a.walk += dt * (4 + u.sp.spd * 3.2) * (u.charging ? 1.6 : 1) * (boosted ? 1.25 : 1) * (a.mv > 0.05 ? 1 : 0);
    var age = b.t - u.lastAtk;
    a.atk = age < 0.32 ? sin(age / 0.32 * PI) : 0;
    a.cast = (u.wind > 0 && u.sp.atk === 'beam') ? 1 - u.wind / 0.55 : 0;
    var ha = b.t - u.lastHurt;
    a.hurt = ha < 0.28 ? 1 - ha / 0.28 : 0;
    a.blinkT -= dt;
    if (a.blinkT < 0) a.blinkT = 2 + Math.random() * 3.5;
    a.blink = a.blinkT < 0.12;
    a.faint = u.st === 'dead' ? Math.min(1, u.deadT / 1.0) : 0;
    a.cheer = u.cheer;
    a.charging = u.charging;
    a.evo = u.evo;
    if (u.target && u.target.x !== undefined) a.look = clamp((u.target.x - u.x) * u.face * 0.3, -1, 1);
    return a;
  };

  P.unitGeom = function (u) {
    var p = this.proj(u.x, u.y);
    var sc = vscale(u.sp, this.L.tile) * p.s * (u.evo ? 1.18 : 1);
    var feet = p.y + u.r * this.L.tile * p.s * this.aspect(u.y) * 0.45 - (u.z || 0) * this.L.tile * p.s;
    var hgt = Art.height(u.sp.id) * sc;
    return { x: p.x, y: p.y, s: p.s, sc: sc, feet: feet, top: feet - hgt * 0.92, mid: feet - hgt * (u.sp.fly ? 0.62 : 0.45), hgt: hgt };
  };

  // ---------------------------------------------------------------------------
  P.frame = function (dt, b, ui) {
    var c = this.c, L = this.L, dpr = this.dpr;
    this.time += dt;
    var t = this.time;
    this.hype = Math.max(0.12, this.hype - dt * 0.35);
    if (this.wave >= 0) { this.wave += dt * 0.32; if (this.wave > 1.2) this.wave = -1; }
    else if (Math.random() < dt * 0.02) this.wave = 0;
    // camera
    var cam = this.cam;
    cam.z += (cam.tz - cam.z) * Math.min(1, dt * 4);
    cam.fx += (cam.tfx - cam.fx) * Math.min(1, dt * 4);
    cam.fy += (cam.tfy - cam.fy) * Math.min(1, dt * 4);

    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#46b2ff'; c.fillRect(0, 0, this.W, this.H);
    c.save();
    if (Math.abs(cam.z - 1) > 0.002) {
      c.translate(this.W / 2, this.H * 0.45); c.scale(cam.z, cam.z); c.translate(-cam.fx, -cam.fy);
    }
    var sh = this.shake > 0 ? this.shake : 0;
    this.shake = Math.max(0, this.shake - dt * 30);
    if (sh) c.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    c.drawImage(this.bg, 0, 0, this.W, this.H);
    this.drawSky(c, t);
    this.drawCrowd(c, t, b);
    this.drawJumbo(c, b, ui, t);
    this.drawSunlight(c, t);
    if ((ui.drag && ui.drag.onField) || ui.phase === 'lead') this.drawZones(c, t, ui.drag ? ui.drag.valid : true);

    var units = b.units, i, list = [];
    for (i = 0; i < units.length; i++) { this.anim(units[i], b, dt); list.push(units[i]); }
    list.sort(function (p, q) { return p.y - q.y; });

    this.drawTrainer(c, b, 1, ui, t);
    for (i = 0; i < list.length; i++) this.drawGround(c, list[i], b, t);
    this.drawFx(c, dt, 'ground');
    this.drawTrainer(c, b, 0, ui, t);
    for (i = 0; i < list.length; i++) if (!list[i].sp.fly || list[i].st === 'dead') this.drawUnit(c, list[i], b, t, ui);
    for (i = 0; i < list.length; i++) if (list[i].sp.fly && list[i].st !== 'dead') this.drawUnit(c, list[i], b, t, ui);
    for (i = 0; i < b.throws.length; i++) this.drawThrow(c, b.throws[i], ui);
    for (i = 0; i < b.projs.length; i++) this.drawProj(c, b.projs[i], t);
    this.drawFx(c, dt, 'air');
    for (i = 0; i < list.length; i++) this.drawBars(c, list[i], b, ui, t);
    if (ui.drag && ui.drag.onField) this.drawGhost(c, ui.drag, b, t);
    this.drawCallouts(c, dt);
    this.drawNums(c, dt);
    c.restore();

    this.drawHUD(c, b, ui, t);
    if (ui.spectate) this.drawSpectate(c, b, ui, t); else this.drawHand(c, b, ui, t);
    this.drawDialog(c, dt);
    this.drawBanners(c, dt);
    if (ui.phase === 'lead') this.drawLeadPrompt(c, ui, t);
    if (ui.info >= 0 && !ui.spectate) this.drawInfo(c, b, ui, t);
  };

  P.drawSunlight = function (c, t) {
    var L = this.L;
    c.save();
    this.fieldPoly(c, 0, 0, R.W, R.H); c.clip();
    for (var i = 0; i < 2; i++) {
      var k = ((t * 0.016 + i * 0.5) % 1);
      var p = this.proj(-8 + k * 34, 6 + i * 14);
      var g = this._shadowG || (this._shadowG = (function () {
        var gg = c.createRadialGradient(0, 0, 2, 0, 0, 1);
        gg.addColorStop(0, 'rgba(20,60,40,0.12)'); gg.addColorStop(1, 'rgba(20,60,40,0)');
        return gg;
      })());
      c.save(); c.translate(p.x, p.y); c.scale(L.tile * 7 * p.s, L.tile * 3.4 * p.s);
      c.fillStyle = g; H.C(c, 0, 0, 1); c.fill(); c.restore();
    }
    c.restore();
  };

  P.drawZones = function (c, t, valid) {
    var pz = R.playerZone;
    this.fieldPoly(c, 0.2, pz[0], R.W - 0.2, pz[1] + 0.6);
    c.fillStyle = 'rgba(61,139,255,' + (0.17 + sin(t * 6) * 0.04) + ')'; c.fill();
    c.setLineDash([8, 6]); c.lineDashOffset = -t * 30;
    c.strokeStyle = valid ? 'rgba(255,255,255,0.95)' : 'rgba(255,90,90,0.9)'; c.lineWidth = 2.5; c.stroke();
    c.setLineDash([]);
    this.fieldPoly(c, 0.2, 0.2, R.W - 0.2, R.MID); c.fillStyle = 'rgba(255,77,94,0.12)'; c.fill();
  };

  P.drawGround = function (c, u, b, t) {
    var L = this.L, p = this.proj(u.x, u.y), tl = L.tile * p.s, asp = this.aspect(u.y);
    var a = u._a, alpha = u.st === 'dead' ? Math.max(0, 1 - a.faint) : 1;
    var spawnK = u.st === 'spawn' ? 1 - u.spawnT / R.spawnTime : 1;
    var rx = u.r * tl * 1.05 * Math.min(1, spawnK * 1.5);
    var z = u.z || 0;
    c.globalAlpha = alpha * (u.sp.fly ? 0.55 : 1) * (u.veilT > 0 ? 0.5 : 1);
    c.fillStyle = 'rgba(30,60,20,0.28)';
    var shrink = z ? 0.7 : 1;
    H.E(c, p.x - rx * 0.18, p.y + u.r * tl * asp * 0.35, rx * shrink * 1.08, rx * asp * 0.9 * shrink); c.fill();
    if (u.st !== 'dead') {
      if (b.sides[u.side].boostT > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        H.E(c, p.x, p.y + u.r * tl * asp * 0.35, rx * 1.5, rx * asp * 1.3); c.fillStyle = 'rgba(255,210,80,' + (0.22 + 0.1 * sin(t * 10 + u.id)) + ')'; c.fill();
        c.restore();
      }
      c.lineWidth = 2.2 * Math.max(0.7, p.s); c.strokeStyle = TEAM[u.side];
      c.globalAlpha = alpha * 0.85;
      H.E(c, p.x, p.y + u.r * tl * asp * 0.35, rx, rx * asp); c.stroke();
      if (u.slowT > 0) { c.fillStyle = 'rgba(176,79,201,0.35)'; H.E(c, p.x, p.y + u.r * tl * asp * 0.35, rx * 1.15, rx * asp * 1.1); c.fill(); }
    }
    c.globalAlpha = 1;
  };

  P.drawUnit = function (c, u, b, t, ui) {
    var sp = u.sp, a = u._a, g = this.unitGeom(u);
    if (u.st === 'spawn') {
      var k = clamp(1 - u.spawnT / R.spawnTime, 0, 1);
      c.save(); c.globalAlpha = 0.4 + k * 0.6;
      Art.creature(c, sp.id, a, g.x, g.feet, g.sc * Math.max(0.01, easeOutBack(k)), u.face);
      c.restore();
      return;
    }
    if (u.evolving > 0) { this.drawEvolving(c, u, g, t); return; }
    c.save();
    if (u.veilT > 0) c.globalAlpha = 0.35 + 0.15 * sin(t * 12);
    if (u.leap) {
      c.globalAlpha *= 0.3;
      Art.creature(c, sp.id, a, g.x - u.mvx * 8 * g.s, g.feet + 6 * g.s, g.sc, u.face);
      c.globalAlpha = u.veilT > 0 ? 0.5 : 1;
    }
    Art.creature(c, sp.id, a, g.x, g.feet, g.sc, u.face);
    c.restore();
    if (u.shield > 0 && u.st === 'act') {
      var br = Math.max(g.hgt * 0.5, sp.r * this.L.tile * g.s * 1.4), cy = g.mid;
      var pulse = 1 + sin(t * 5 + u.id) * 0.03;
      c.save(); c.globalAlpha = 0.85;
      var gr = c.createRadialGradient(g.x - br * 0.3, cy - br * 0.4, br * 0.1, g.x, cy, br * pulse);
      gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.75, 'rgba(140,230,255,0.18)'); gr.addColorStop(1, 'rgba(120,220,255,0.55)');
      c.fillStyle = gr; H.C(c, g.x, cy, br * pulse); c.fill();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(200,245,255,0.9)'; c.stroke();
      c.restore();
    }
    if (b.sides[u.side].boostT > 0 && u.st === 'act' && Math.random() < 0.15) {
      this.fx.push({ k: 'spark', x: g.x + (Math.random() - 0.5) * g.hgt * 0.6, y: g.mid, vx: 0, vy: -40, t: 0, d: 0.5, r: 3 * g.s + 1, col: '#ffe36a', layer: 'air' });
    }
    if (u.charging && u.moving && Math.random() < 0.5) {
      this.fx.push({ k: 'dust', x: g.x - u.mvx * 10 * g.s, y: g.y + sp.r * this.L.tile * g.s * 0.4, vx: -u.mvx * 20, vy: -10, t: 0, d: 0.5, r: (4 + Math.random() * 3) * g.s, layer: 'ground' });
    }
  };

  // Gen-1 evolution: the creature flickers between old and new silhouettes, faster and faster
  P.drawEvolving = function (c, u, g, t) {
    var k = clamp(1 - u.evolving / R.evoTime, 0, 1);
    var cycles = k * k * 9;
    var showNew = ((cycles * 2) | 0) % 2 === 1;
    var size = Math.ceil(g.hgt * 2.4 + 20);
    var cv = this.sil, d = this.dpr;
    if (cv.width < size * d) { cv.width = cv.height = Math.ceil(size * d); }
    var sc = cv.getContext('2d');
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, cv.width, cv.height);
    sc.setTransform(d, 0, 0, d, 0, 0);
    var a = { t: t, mv: 0, walk: 0, atk: 0, hurt: 0, blink: false, faint: 0, evo: showNew ? 1 : 0 };
    Art.creature(sc, u.sp.id, a, size / 2, size * 0.8, g.sc * (showNew ? 1.18 : 1) / (u.evo ? 1.18 : 1), u.face);
    sc.globalCompositeOperation = 'source-in';
    sc.fillStyle = k > 0.85 ? '#ffffff' : 'rgba(255,255,255,' + (0.75 + 0.25 * sin(t * 30)) + ')';
    sc.fillRect(0, 0, size, size);
    sc.globalCompositeOperation = 'source-over';
    // glow pillar
    c.save(); c.globalCompositeOperation = 'lighter';
    var pg = c.createLinearGradient(g.x, g.feet - g.hgt * 2.2, g.x, g.feet);
    pg.addColorStop(0, 'rgba(255,240,170,0)'); pg.addColorStop(1, 'rgba(255,240,170,' + (0.25 + k * 0.35) + ')');
    c.fillStyle = pg; c.fillRect(g.x - g.hgt * 0.45, g.feet - g.hgt * 2.2, g.hgt * 0.9, g.hgt * 2.2);
    c.restore();
    c.drawImage(cv, 0, 0, size * d, size * d, g.x - size / 2, g.feet - size * 0.8, size, size);
    // sparkles spiralling in
    for (var i = 0; i < 6; i++) {
      var ang = t * 4 + i * TAU / 6, rad = g.hgt * (1.1 - k * 0.8);
      Art.sparkleStar(c, g.x + cos(ang) * rad, g.mid + sin(ang) * rad * 0.5, 4 * g.s + 2, 'rgba(255,245,180,0.95)');
    }
  };

  P.drawBars = function (c, u, b, ui, t) {
    if (u.st !== 'act' && u.st !== 'spawn') return;
    var g = this.unitGeom(u), sp = u.sp;
    var ready = b.evoReady(u.rec) && u.rec.units[0] === u && !(u.evolving > 0);
    if (ready && (u.side === 0 && !ui.spectate)) {
      // tap-to-evolve badge
      var can = b.canEvolve(0, u.rec), bob = sin(t * 5) * 2;
      var bx = g.x + g.hgt * 0.32, by = g.top - 12 * Math.max(0.8, g.s) + bob;
      var r = 9 * Math.max(0.85, g.s);
      c.save();
      if (can) { c.globalCompositeOperation = 'lighter'; H.C(c, bx, by, r * 1.7); c.fillStyle = 'rgba(255,220,90,' + (0.3 + 0.2 * sin(t * 8)) + ')'; c.fill(); c.globalCompositeOperation = 'source-over'; }
      H.C(c, bx, by, r); c.fillStyle = can ? '#ffd23f' : '#c9ccd3'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2b1f33'; c.stroke();
      c.fillStyle = '#2b1f33';
      c.beginPath(); c.moveTo(bx, by - r * 0.62); c.lineTo(bx + r * 0.55, by); c.lineTo(bx + r * 0.22, by); c.lineTo(bx + r * 0.22, by + r * 0.55);
      c.lineTo(bx - r * 0.22, by + r * 0.55); c.lineTo(bx - r * 0.22, by); c.lineTo(bx - r * 0.55, by); c.closePath(); c.fill();
      Art.pixelText(c, CA.evoCost(sp) + '', bx + r * 1.15, by + r * 0.6, 1.5, '#ffe36a', 'center', '#2b1f33');
      c.restore();
    }
    if (u.hp >= u.maxHp && u.shield <= 0) return;
    var w = clamp(sp.r * this.L.tile * g.s * 2.2, 16, 46), h = Math.max(3.5, 5 * g.s);
    var x = g.x - w / 2, y = g.top - 4;
    c.fillStyle = TEAM_D[u.side]; rr(c, x - 1.5, y - 1.5, w + 3, h + 3, 3); c.fill();
    c.fillStyle = '#2b2b33'; rr(c, x, y, w, h, 2); c.fill();
    var f = clamp(u.hp / u.maxHp, 0, 1);
    c.fillStyle = f > 0.5 ? '#4fe36a' : f > 0.22 ? '#ffd23f' : '#ff4d4d';
    if (f > 0) { rr(c, x, y, w * f, h, 2); c.fill(); }
    if (u.shield > 0) { c.fillStyle = 'rgba(140,235,255,0.95)'; rr(c, x, y - 3, w * clamp(u.shield / u.maxHp, 0, 1), 2.5, 1); c.fill(); }
    if (u.evo) { Art.star5(c, x - 4, y + h / 2, 3.6, 0.45); c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#2b1f33'; c.stroke(); }
  };

  P.trainerPos = function (side) {
    var L = this.L;
    if (side === 1) { var p = this.proj(R.W / 2, -0.55); return { x: p.x, y: p.y, s: L.tile * 2.2 * p.s / 100, hand: { x: p.x + 10 * p.s, y: p.y - L.tile * 2 * p.s } }; }
    var s = 1.0 * L.ui, x = Math.max(36 * L.ui, L.cx - 9 * L.tile + 14), fy = L.handY + 14 * L.ui;
    return { x: x, y: fy, s: s, hand: { x: x + 24 * s, y: fy - 92 * s } };
  };

  P.drawTrainer = function (c, b, side, ui, t) {
    var look = ui.looks[side], tp = this.trainerPos(side);
    var ta = this.trainerAnim[side];
    ta.throwT += 1 / 60;
    var throwK = ta.throwT < 0.35 ? sin(ta.throwT / 0.35 * PI) : 0;
    var cheer = (b.over && b.winner === side) || b.sides[side].boostT > 0 ? 1 : 0;
    Art.trainer(c, look, tp.x, tp.y, tp.s, side === 0, { t: t, throwK: throwK, cheer: cheer });
  };

  P.drawThrow = function (c, th, ui) {
    var k = clamp(th.t / th.dur, 0, 1);
    var from = this.trainerPos(th.side).hand, to = this.proj(th.x, th.y);
    var x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k - sin(k * PI) * this.L.tile * (th.side === 0 ? 5 : 3);
    var sc = th.side === 0 ? 1 - k * (1 - to.s) * 0.6 : 0.6 + k * 0.4;
    c.fillStyle = 'rgba(30,60,20,0.22)';
    H.E(c, to.x, to.y, (6 * k + 2) * to.s, (2.5 * k + 1) * to.s); c.fill();
    Art.capsule(c, x, y, this.L.tile * 0.46 * sc * (th.side === 0 ? 1.2 : to.s), th.side, k * 9);
  };

  P.drawProj = function (c, p, t) {
    var tl = this.L.tile;
    var total = Math.sqrt((p.tx - p.sx) * (p.tx - p.sx) + (p.ty - p.sy) * (p.ty - p.sy)) || 1;
    var done = Math.sqrt((p.x - p.sx) * (p.x - p.sx) + (p.y - p.sy) * (p.y - p.sy));
    var k = clamp(done / total, 0, 1);
    var z = (p.z * (1 - k) + 0.7 * k) + (p.kind === 'spore' || p.kind === 'orb' ? sin(k * PI) * 1.6 : 0);
    var s = this.proj(p.x, p.y, z), sc = s.s;
    var x = s.x, y = s.y, u = tl * sc;
    switch (p.kind) {
      case 'bubble':
        H.C(c, x, y, u * 0.34); c.fillStyle = 'rgba(120,200,255,0.75)'; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = '#e6f6ff'; c.stroke();
        H.C(c, x - u * 0.1, y - u * 0.1, u * 0.08); c.fillStyle = '#fff'; c.fill();
        break;
      case 'seed':
        H.E(c, x, y, u * 0.2, u * 0.13, t * 10); c.fillStyle = '#8ee05a'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#2f7a34'; c.stroke();
        break;
      case 'orb':
        c.save(); c.globalCompositeOperation = 'lighter';
        H.C(c, x, y, u * 0.55); c.fillStyle = 'rgba(224,79,160,0.35)'; c.fill();
        H.C(c, x, y, u * 0.3); c.fillStyle = 'rgba(255,170,230,0.9)'; c.fill();
        c.restore();
        Art.star5(c, x, y, u * 0.2, 0.45, t * 6); c.fillStyle = '#ffd23f'; c.fill();
        break;
      case 'spark':
        c.save(); c.globalCompositeOperation = 'lighter';
        Art.sparkleStar(c, x, y, u * 0.4, 'rgba(255,240,170,0.95)');
        c.restore();
        break;
      case 'star':
        c.save(); c.globalCompositeOperation = 'lighter';
        for (var i = 1; i <= 3; i++) {
          var tp = this.proj(p.x - (p.tx - p.sx) / total * 0.35 * i, p.y - (p.ty - p.sy) / total * 0.35 * i, z);
          H.C(c, tp.x, tp.y, u * (0.27 - i * 0.05)); c.fillStyle = 'rgba(255,220,120,' + (0.4 - i * 0.1) + ')'; c.fill();
        }
        c.restore();
        Art.star5(c, x, y, u * 0.4, 0.45, t * 8); c.fillStyle = '#ffd23f'; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = '#a45cff'; c.stroke();
        break;
      case 'spore':
        for (var j = 0; j < 3; j++) {
          H.C(c, x + cos(t * 5 + j * 2) * u * 0.15, y + sin(t * 5 + j * 2) * u * 0.15, u * 0.22);
          c.fillStyle = 'rgba(190,110,230,0.75)'; c.fill();
        }
        break;
    }
  };

  P.drawGhost = function (c, d, b, t) {
    var sp = SP[d.card];
    var p = this.proj(d.fx, d.fy), tl = this.L.tile * p.s, asp = this.aspect(d.fy);
    if (sp.range > 1) {
      c.setLineDash([5, 5]); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.8)';
      this.groundCircle(c, d.fx, d.fy, sp.range + sp.r); c.stroke(); c.setLineDash([]);
    }
    if (sp.taunt) { this.groundCircle(c, d.fx, d.fy, sp.taunt + sp.r); c.fillStyle = 'rgba(91,127,209,0.16)'; c.fill(); }
    var n = sp.n;
    for (var i = 0; i < n; i++) {
      var ox = 0, oy = 0;
      if (n > 1) { var ang = (i / n) * TAU + 0.6; ox = cos(ang) * 0.62; oy = sin(ang) * 0.5; }
      var q = this.proj(d.fx + ox, d.fy + oy);
      c.save(); c.globalAlpha = d.valid ? 0.78 : 0.35;
      c.lineWidth = 2; c.strokeStyle = d.valid ? '#fff' : '#ff5a5a';
      H.E(c, q.x, q.y + sp.r * tl * asp * 0.35, sp.r * tl * 1.05, sp.r * tl * asp); c.stroke();
      Art.creature(c, sp.id, { t: t, mv: 0, walk: 0, atk: 0, hurt: 0, faint: 0 }, q.x, q.y + sp.r * tl * asp * 0.45, vscale(sp, this.L.tile) * q.s, 1);
      c.restore();
    }
  };

  // ---------------------------------------------------------------------------
  // events -> effects, text box, jumbotron
  P.say = function (msg, prio) {
    if (this.dialog.length >= 3 && !prio) return;
    if (prio) this.dialog = this.dialog.filter(function (m) { return m.prio; });
    this.dialog.push({ s: msg.toUpperCase(), prio: !!prio });
  };
  P.callout = function (u, text, col) {
    if (u.lastCall && this.time - u.lastCall < 3.5) return;
    u.lastCall = this.time;
    this.callouts.push({ u: u, s: text.toUpperCase() + '!', t: 0, col: col || '#ffffff' });
  };

  P.onEvent = function (e, b, ui) {
    var tl = this.L.tile, p, g, i, nm;
    var who = function (side) { return ui && ui.spectate ? ui.names[side].toUpperCase() + "'S " : side === 1 ? 'FOE ' : ''; };
    switch (e.k) {
      case 'throw':
        this.trainerAnim[e.side].throwT = 0;
        if (e.lead) {
          nm = SP[e.sp].name.toUpperCase();
          if (e.side === 1 || (ui && ui.spectate)) this.say(ui.names[e.side].toUpperCase() + ' SENT OUT ' + nm + '!', true);
          else this.say('GO! ' + nm + '!', true);
        }
        break;
      case 'pop':
        p = this.proj(e.x, e.y); var s = p.s;
        this.fx.push({ k: 'ring', x: p.x, y: p.y, t: 0, d: 0.45, r: tl * 2.2 * s, col: '255,255,255', layer: 'air' });
        this.fx.push({ k: 'flashc', x: p.x, y: p.y - tl * 0.6 * s, t: 0, d: 0.3, r: tl * 1.6 * s, layer: 'air' });
        for (i = 0; i < 10; i++) {
          var an = i / 10 * TAU;
          this.fx.push({ k: 'spark', x: p.x, y: p.y - tl * 0.5 * s, vx: cos(an) * tl * 5 * s, vy: sin(an) * tl * 4 * s - tl * 2 * s, t: 0, d: 0.6, r: tl * 0.28 * s, col: i % 2 ? '#ffffff' : TEAM_L[e.side], layer: 'air' });
        }
        this.hype = Math.max(this.hype, SP[e.sp].cost >= 6 ? 0.9 : 0.4);
        break;
      case 'hit':
        g = this.unitGeom(e.u);
        this.fx.push({ k: 'hitstar', x: g.x + (Math.random() - 0.5) * g.hgt * 0.4, y: g.mid + (Math.random() - 0.5) * g.hgt * 0.3, t: 0, d: 0.22, r: tl * g.s * (e.melee ? 0.6 : 0.45), layer: 'air' });
        if (e.dmg >= 1 && (e.eff !== 0 || e.dmg >= 150)) {
          this.nums.push({ x: g.x + (Math.random() - 0.5) * 10, y: g.top - 8, t: 0, s: Math.round(e.dmg) + '', col: e.shielded ? '#9ff0ff' : e.eff > 0 ? '#ffd23f' : e.eff < 0 ? '#c9ccd3' : '#ffffff', big: e.eff > 0 });
        }
        if (e.eff > 0 && (!this._se || this.time - this._se > 1.1) && (!e.u._se || this.time - e.u._se > 2.5)) {
          this._se = e.u._se = this.time;
          this.nums.push({ x: g.x, y: g.mid + 6, t: 0, s: "IT'S SUPER EFFECTIVE!", col: '#ffe36a', pix: true });
          if (Math.random() < 0.3) this.jumboFlash('SUPER!', '#ffe36a', 1.0);
        }
        break;
      case 'thorn':
        g = this.unitGeom(e.u);
        this.nums.push({ x: g.x, y: g.top - 8, t: 0, s: Math.round(e.dmg) + '', col: '#9be36b' });
        break;
      case 'heal':
        g = this.unitGeom(e.to); var gf = this.unitGeom(e.from);
        this.fx.push({ k: 'healbeam', x: gf.x, y: gf.mid, x2: g.x, y2: g.mid, t: 0, d: 0.35, layer: 'air' });
        for (i = 0; i < 4; i++) this.fx.push({ k: 'plus', x: g.x + (Math.random() - 0.5) * g.hgt * 0.5, y: g.mid, vx: 0, vy: -tl * 2.2 * g.s, t: -i * 0.06, d: 0.7, r: tl * 0.22 * g.s + 1, layer: 'air' });
        if (e.amt >= 20 && (!e.to._hn || this.time - e.to._hn > 1.2) && (e.to._hn = this.time)) this.nums.push({ x: g.x, y: g.top - 10, t: 0, s: '+' + Math.round(e.amt), col: '#7dff8a' });
        break;
      case 'shield':
        g = this.unitGeom(e.to);
        this.fx.push({ k: 'ring', x: g.x, y: g.mid, t: 0, d: 0.4, r: g.hgt * 0.7, col: '160,235,255', layer: 'air' });
        if (e.from.sp.id === 'lumisprite') this.callout(e.from, CA.MOVES.lumisprite, '#bff4ff');
        break;
      case 'unshield':
        g = this.unitGeom(e.u);
        for (i = 0; i < 6; i++) { var a2 = i / 6 * TAU; this.fx.push({ k: 'spark', x: g.x, y: g.mid, vx: cos(a2) * tl * 4 * g.s, vy: sin(a2) * tl * 4 * g.s, t: 0, d: 0.35, r: tl * 0.2 * g.s + 1, col: '#bff4ff', layer: 'air' }); }
        break;
      case 'chain':
        var self = this;
        var pts = e.pts.map(function (pt, ii) { var q = self.proj(pt.x, pt.y, ii === 0 ? (e.u.sp.fly ? 2 : 1.3) : 0.9); return { x: q.x, y: q.y }; });
        this.fx.push({ k: 'bolt', pts: pts, t: 0, d: 0.28, layer: 'air' });
        this.callout(e.u, CA.MOVES.chain, '#bff4ff');
        break;
      case 'beam':
        var b0 = this.proj(e.x0, e.y0, 2.6), b1 = this.proj(e.x1, e.y1, 0.8);
        this.fx.push({ k: 'beam', x: b0.x + e.u.face * tl * 0.6 * b0.s, y: b0.y, x2: b1.x, y2: b1.y, t: 0, d: 0.5, w: tl * (b0.s + b1.s) / 2, layer: 'air' });
        this.shake = 7; this.hype = Math.max(this.hype, 0.8);
        this.callout(e.u, e.u.evo ? CA.EVOS.azurion.move : CA.MOVES.beam, '#a9d4ff');
        this.jumboFlash('AZURE BURST!', '#7fb2ff', 1.2);
        break;
      case 'cone':
        p = this.proj(e.u.x, e.u.y, 0.8);
        for (i = 0; i < 26; i++) {
          var ang = Math.atan2(e.ay * this.aspect(e.u.y), e.ax) + (Math.random() - 0.5) * e.half * 2;
          var spd = (0.6 + Math.random() * 0.6) * e.reach * tl * p.s / 0.45;
          this.fx.push({ k: 'fire', x: p.x + e.ax * tl * 0.8 * p.s, y: p.y, vx: cos(ang) * spd, vy: sin(ang) * spd, t: -Math.random() * 0.08, d: 0.45, r: tl * p.s * (0.25 + Math.random() * 0.25), layer: 'air' });
        }
        this.shake = Math.max(this.shake, 3);
        this.callout(e.u, CA.MOVES.cone, '#ffb070');
        break;
      case 'burst':
        p = this.proj(e.x, e.y);
        var col = e.kind === 'spore' ? '190,110,230' : '255,120,210';
        this.fx.push({ k: 'ring', x: p.x, y: p.y, t: 0, d: 0.4, r: e.r * tl * p.s, col: col, layer: 'ground', fill: true, asp: this.aspect(e.y) });
        for (i = 0; i < 8; i++) {
          var a3 = i / 8 * TAU;
          this.fx.push({ k: 'puff', x: p.x + cos(a3) * e.r * tl * p.s * 0.5, y: p.y + sin(a3) * e.r * tl * p.s * 0.3, vx: cos(a3) * tl * p.s, vy: -tl * 0.8 * p.s, t: 0, d: 0.7, r: tl * 0.4 * p.s, col: col, layer: 'air' });
        }
        break;
      case 'shoot':
        if (e.kind === 'orb') this.callout(e.u, e.u.evo ? CA.EVOS.hexmoth.move : CA.MOVES.orb, '#ffb3dc');
        if (e.kind === 'spore') this.callout(e.u, CA.MOVES.spore, '#e0b3ff');
        break;
      case 'pop2':
        p = this.proj(e.x, e.y, 0.8);
        this.fx.push({ k: 'ring', x: p.x, y: p.y, t: 0, d: 0.25, r: tl * 0.7 * p.s, col: e.kind === 'bubble' ? '150,215,255' : e.kind === 'star' ? '255,220,90' : '255,255,255', layer: 'air' });
        break;
      case 'leap':
        p = this.proj(e.u.x, e.u.y);
        this.fx.push({ k: 'ring', x: p.x, y: p.y, t: 0, d: 0.3, r: tl * p.s, col: '255,255,255', layer: 'ground', asp: this.aspect(e.u.y) });
        this.callout(e.u, CA.MOVES[e.u.sp.id] || 'Pounce', '#ffe36a');
        break;
      case 'land':
        p = this.proj(e.u.x, e.u.y);
        for (i = 0; i < 6; i++) this.fx.push({ k: 'dust', x: p.x, y: p.y + tl * 0.3 * p.s, vx: (Math.random() - 0.5) * tl * 5 * p.s, vy: -tl * Math.random() * 1.5 * p.s, t: 0, d: 0.45, r: tl * 0.25 * p.s, layer: 'ground' });
        break;
      case 'charge':
        this.callout(e.u, CA.MOVES.rockhorn, '#ffe0a0');
        break;
      case 'bash':
        g = this.unitGeom(e.t);
        this.fx.push({ k: 'ring', x: g.x, y: g.mid, t: 0, d: 0.35, r: tl * 1.6 * g.s, col: '255,230,150', layer: 'air' });
        this.shake = Math.max(this.shake, 5);
        break;
      case 'faint':
        g = this.unitGeom(e.u);
        for (i = 0; i < 3; i++) this.fx.push({ k: 'dizzy', x: g.x, y: g.top, t: -i * 0.1, d: 1.0, ph: i * TAU / 3, r: tl * 0.6 * g.s, layer: 'air' });
        for (i = 0; i < 6; i++) this.fx.push({ k: 'dust', x: g.x, y: g.feet, vx: (Math.random() - 0.5) * tl * 3 * g.s, vy: -tl * Math.random() * g.s, t: 0.3, d: 0.9, r: tl * 0.35 * g.s, layer: 'ground' });
        this.lastFaint = { x: g.x, y: g.mid };
        break;
      case 'ko':
        this.hype = 1;
        nm = (e.evo ? CA.EVOS[e.sp].name : SP[e.sp].name).toUpperCase();
        this.say(who(e.side) + nm + ' FAINTED!');
        this.jumboFlash('KO!', e.side === 1 ? '#7fb2ff' : '#ff8a95', 1.2);
        this.confetti(e.side === 1 ? 0 : 1);
        break;
      case 'evolve':
        nm = SP[e.rec.sp].name.toUpperCase();
        this.say('WHAT? ' + (e.side === 1 && !(ui && ui.spectate) ? 'FOE ' : '') + nm + ' IS EVOLVING!', true);
        this.jumboFlash('EVOLUTION!', '#ffe36a', 1.6);
        this.hype = 1;
        break;
      case 'evolved':
        g = this.unitGeom(e.u);
        this.fx.push({ k: 'flashc', x: g.x, y: g.mid, t: 0, d: 0.4, r: g.hgt * 0.75, layer: 'air' });
        this.fx.push({ k: 'ring', x: g.x, y: g.mid, t: 0, d: 0.6, r: g.hgt * 1.5, col: '255,240,170', layer: 'air' });
        for (i = 0; i < 16; i++) { var a4 = i / 16 * TAU; this.fx.push({ k: 'spark', x: g.x, y: g.mid, vx: cos(a4) * tl * 7 * g.s, vy: sin(a4) * tl * 5 * g.s, t: 0, d: 0.8, r: tl * 0.32 * g.s + 1, col: i % 2 ? '#ffe36a' : '#ffffff', layer: 'air' }); }
        if (e.u.rec.units[0] === e.u) this.say(SP[e.u.sp.id].name.toUpperCase() + ' EVOLVED INTO ' + CA.EVOS[e.u.sp.id].name.toUpperCase() + '!', true);
        this.shake = Math.max(this.shake, 4);
        break;
      case 'boost':
        this.hype = 1; this.wave = 0;
        this.banner('THE CROWD GOES WILD!', e.side === 0 ? '#3d8bff' : '#ff4d5e');
        this.jumboFlash(e.side === 0 ? 'GO GO GO!' : 'BOO!', e.side === 0 ? '#7fb2ff' : '#ff8a95', 2);
        this.confetti(e.side, 40);
        break;
      case 'double':
        this.say('2X ENERGY! THE FINAL MINUTE!');
        this.jumboFlash('2X ENERGY', '#ffb21f', 2);
        this.hype = 1;
        break;
      case 'overtime':
        this.banner('SUDDEN DEATH!', '#ff4d5e', 'NEXT KO WINS!');
        this.jumboFlash('SUDDEN DEATH', '#ff5a5a', 2.2);
        this.hype = 1;
        break;
      case 'end':
        this.hype = 1; this.wave = 0;
        this.confetti(e.winner === 1 ? 1 : 0, 80);
        this.jumboFlash(e.winner === -1 ? 'DRAW!' : 'WINNER!', '#ffe36a', 4);
        break;
    }
  };

  P.confetti = function (side, n) {
    var L = this.L;
    n = n || 26;
    for (var i = 0; i < n; i++) {
      var x = Math.random() * this.W;
      var y = this.rimY + (0.3 + Math.random() * 0.7) * (L.top - this.rimY);
      this.fx.push({
        k: 'confetti', x: x, y: y, vx: (Math.random() - 0.5) * 80, vy: -20 - Math.random() * 90, t: -Math.random() * 0.3, d: 1.8,
        r: 3 + Math.random() * 2, col: i % 3 === 0 ? TEAM[side] : ['#ff4d5e', '#ffd23f', '#3d8bff', '#45c25a', '#ff7ac8', '#ffffff'][(Math.random() * 6) | 0], rot: Math.random() * 6, layer: 'air'
      });
    }
  };
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
          H.E(c, f.x, f.y, f.r * (0.3 + k * 0.7), f.r * (0.3 + k * 0.7) * (f.asp ? f.asp : f.fill ? 0.55 : 1)); c.stroke();
          if (f.fill) { c.fillStyle = 'rgba(' + f.col + ',' + (0.3 * (1 - k)) + ')'; c.fill(); }
          break;
        case 'flashc':
          c.save(); c.globalCompositeOperation = 'lighter';
          H.C(c, f.x, f.y, f.r * (0.5 + k)); c.fillStyle = 'rgba(255,255,230,' + (0.8 * (1 - k)) + ')'; c.fill();
          c.restore();
          break;
        case 'flash':
          Art.sparkleStar(c, f.x, f.y, 5 * (1 - k * 0.5), 'rgba(255,255,255,' + (1 - k) + ')');
          break;
        case 'spark':
          f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 120 * dt;
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
                var kk = s / 5, jx = s < 5 ? (Math.random() - 0.5) * 10 : 0, jy = s < 5 ? (Math.random() - 0.5) * 10 : 0;
                c.lineTo(p0.x + (p1.x - p0.x) * kk + jx, p0.y + (p1.y - p0.y) * kk + jy);
              }
            }
            c.stroke();
          }
          c.restore();
          break;
        case 'beam':
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          var w = f.w * (1 - k * 0.6);
          c.strokeStyle = 'rgba(60,130,255,' + (0.5 * (1 - k)) + ')'; c.lineWidth = w * 2.2;
          c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke();
          c.strokeStyle = 'rgba(150,210,255,' + (0.8 * (1 - k)) + ')'; c.lineWidth = w * 1.1; c.stroke();
          c.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; c.lineWidth = w * 0.45; c.stroke();
          c.restore();
          break;
        case 'fire':
          f.x += f.vx * dt; f.y += f.vy * dt;
          c.save(); c.globalCompositeOperation = 'lighter';
          H.C(c, f.x, f.y, f.r * (0.6 + k));
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
          if (f.y < this.rimY) break;
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
      var d = n.pix ? 1.1 : 0.85;
      if (n.t > d) { this.nums.splice(i, 1); continue; }
      var k = n.t / d;
      c.save(); c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      if (n.pix) Art.pixelText(c, n.s, n.x, n.y - k * 18, 1.5 * this.L.ui, n.col, 'center', '#2b1f33');
      else {
        var pop = n.t < 0.12 ? 0.6 + n.t / 0.12 * 0.6 : 1.2 - Math.min(0.2, (n.t - 0.12));
        text(c, n.s, n.x, n.y - k * 22, (n.big ? 15 : 12) * pop * this.L.ui, n.col, '#2b1f33');
      }
      c.restore();
    }
  };

  P.drawCallouts = function (c, dt) {
    for (var i = this.callouts.length - 1; i >= 0; i--) {
      var o = this.callouts[i];
      o.t += dt;
      if (o.t > 1.2 || o.u.st === 'dead') { this.callouts.splice(i, 1); continue; }
      var g = this.unitGeom(o.u);
      var pop = o.t < 0.12 ? o.t / 0.12 : 1;
      c.save(); c.globalAlpha = o.t > 0.9 ? (1.2 - o.t) / 0.3 : 1;
      Art.pixelText(c, o.s, g.x, g.top - 16 - o.t * 6, Math.max(1, Math.round(1.5 * pop * this.L.ui * 2) / 2), o.col, 'center', '#2b1f33');
      c.restore();
    }
  };

  // Gen-1 text box with a typewriter, under the jumbotron
  P.drawDialog = function (c, dt) {
    if (!this.dlg && this.dialog.length) { this.dlg = this.dialog.shift(); this.dlg.t = 0; }
    var d = this.dlg;
    if (!d) return;
    d.t += dt;
    var hold = d.prio ? 1.5 : 1.0, typeT = d.s.length / 42;
    if (d.t > typeT + hold + (this.dialog.length ? 0 : 0.6)) { this.dlg = null; return; }
    var L = this.L, W = this.W, px = 1.5 * L.ui;
    var w = Math.min(W - 16, 420 * L.ui), h = 18 * px + 12, x = (W - w) / 2, y = L.dlgY;
    var a = d.t < 0.12 ? d.t / 0.12 : 1;
    c.save(); c.globalAlpha = a;
    rr(c, x, y, w, h, 6); c.fillStyle = '#fbfbf4'; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#2b1f33'; c.stroke();
    rr(c, x + 4, y + 4, w - 8, h - 8, 4); c.lineWidth = 1.5; c.stroke();
    var shown = d.s.slice(0, Math.floor(d.t * 42));
    // wrap into two lines
    var maxc = Math.floor((w - 24) / (6 * px)), lines = [], cur = '';
    shown.split(' ').forEach(function (word) {
      if ((cur + ' ' + word).trim().length > maxc) { lines.push(cur.trim()); cur = word; } else cur += ' ' + word;
    });
    lines.push(cur.trim());
    for (var i = 0; i < Math.min(2, lines.length); i++) Art.pixelText(c, lines[i], x + 12, y + 6 + px * 4.5 + i * px * 10, px, '#2b1f33', 'left');
    if (shown.length >= d.s.length && ((d.t * 3) | 0) % 2 === 0) {
      c.fillStyle = '#2b1f33'; c.beginPath(); c.moveTo(x + w - 18, y + h - 12); c.lineTo(x + w - 10, y + h - 12); c.lineTo(x + w - 14, y + h - 7); c.closePath(); c.fill();
    }
    c.restore();
  };

  P.drawBanners = function (c, dt) {
    if (!this.banners.length) return;
    var o = this.banners[0];
    o.t += dt;
    if (o.t > 2.0) { this.banners.shift(); return; }
    var k = o.t < 0.3 ? easeOutBack(o.t / 0.3) : o.t > 1.7 ? 1 - (o.t - 1.7) / 0.3 : 1;
    var L = this.L, cy = L.top + L.fh * 0.42;
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, k));
    c.fillStyle = 'rgba(43,31,51,0.55)';
    c.fillRect(0, cy - 28, this.W, o.sub ? 62 : 52);
    c.translate(this.W / 2, cy - 2); c.scale(k, k);
    Art.pixelText(c, o.s, 0, 0, Math.min(4, (this.W - 30) / Art.pixelWidth(o.s, 1)), o.col, 'center', '#ffffff');
    if (o.sub) Art.pixelText(c, o.sub, 0, 24, 2, '#ffffff', 'center', '#2b1f33');
    c.restore();
  };

  P.drawLeadPrompt = function (c, ui, t) {
    var L = this.L, cy = L.top + L.fh * 0.3;
    var k = clamp(ui.leadT / R.leadTime, 0, 1);
    c.save();
    rr(c, this.W / 2 - 130 * L.ui, cy - 30 * L.ui, 260 * L.ui, 60 * L.ui, 12);
    c.fillStyle = 'rgba(255,255,255,0.94)'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#2b1f33'; c.stroke();
    Art.pixelText(c, 'CHOOSE YOUR LEAD!', this.W / 2, cy - 10 * L.ui, 2.5 * L.ui, '#1d4fb0', 'center');
    Art.pixelText(c, 'DRAG A CRITTER ONTO THE FIELD', this.W / 2, cy + 7 * L.ui, 1.2 * L.ui, '#5a6170', 'center');
    rr(c, this.W / 2 - 110 * L.ui, cy + 16 * L.ui, 220 * L.ui, 6 * L.ui, 3); c.fillStyle = '#dfe6ef'; c.fill();
    rr(c, this.W / 2 - 110 * L.ui, cy + 16 * L.ui, 220 * L.ui * k, 6 * L.ui, 3); c.fillStyle = k > 0.3 ? '#3d8bff' : '#ff4d5e'; c.fill();
    c.restore();
  };

  // ---------------------------------------------------------------------------
  // HUD & hand
  P.drawPips = function (c, side, b, x, y, size) {
    var recs = b.sides[side].records;
    for (var i = 0; i < R.capsules; i++) {
      var px = x + (i % 6) * (size * 2.3), py = y + ((i / 6) | 0) * (size * 2.2);
      var state = i < recs.length ? (recs[i].done ? 'ko' : 'out') : 'ready';
      c.save();
      if (state === 'ready') Art.capsule(c, px, py, size, side, 0);
      else if (state === 'out') {
        H.C(c, px, py, size); c.fillStyle = recs[i].evo ? '#ffe36a' : 'rgba(255,255,255,0.7)'; c.fill();
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
    var L = this.L, u = L.ui;
    // rival plate (top-left), clear of the jumbotron
    var pw = Math.min(L.jx - 14, 170 * u), ph = 50 * u, px = 6, py = 6;
    c.save();
    rr(c, px, py, pw, ph, 12); c.fillStyle = 'rgba(255,255,255,0.93)'; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = TEAM[1]; c.stroke();
    var pr = 15 * u;
    c.save(); H.C(c, px + pr + 5, py + pr + 4, pr); c.fillStyle = '#ffe3e6'; c.fill(); c.clip();
    Art.trainer(c, ui.looks[1], px + pr + 5, py + pr * 2 + 20 * u, 0.36 * u, false, { t: t });
    c.restore();
    H.C(c, px + pr + 5, py + pr + 4, pr); c.lineWidth = 2; c.strokeStyle = TEAM[1]; c.stroke();
    var nx = px + pr * 2 + 10;
    Art.pixelText(c, ui.names[1], nx, py + 10 * u, 1.3 * u, '#2b1f33', 'left');
    var ps = Math.min(4 * u, (px + pw - nx - 6) / 13.6);
    this.drawPips(c, 1, b, nx + ps, py + 22 * u, ps);
    // their crowd meter
    var s1 = b.sides[1], hw = pw - 12, hy = py + ph - 7 * u;
    rr(c, px + 6, hy, hw, 4 * u, 2); c.fillStyle = '#e3e8f0'; c.fill();
    var hf = s1.boostT > 0 ? s1.boostT / R.boostTime : s1.hype / R.hypeMax;
    rr(c, px + 6, hy, hw * hf, 4 * u, 2); c.fillStyle = s1.boostT > 0 ? '#ffb21f' : TEAM[1]; c.fill();
    c.restore();
  };

  P.drawCard = function (c, id, x, y, w, h, t, state) {
    var sp = SP[id], role = CA.ROLES[sp.role];
    c.save();
    rr(c, x, y, w, h, 8);
    var g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, role.frameL); g.addColorStop(0.5, role.frame); g.addColorStop(1, Art.shade(role.frame, -0.25));
    c.fillStyle = g; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = '#2b1f33'; c.stroke();
    if (sp.role === 'legend') { c.lineWidth = 1.5; c.strokeStyle = '#ffd76a'; rr(c, x + 2.5, y + 2.5, w - 5, h - 5, 6); c.stroke(); }
    var ax = x + w * 0.09, ay = y + h * 0.08, aw = w * 0.82, ah = h * 0.64;
    rr(c, ax, ay, aw, ah, 4);
    var T = CA.TYPES[sp.type];
    var ag = c.createLinearGradient(ax, ay, ax, ay + ah);
    ag.addColorStop(0, '#e9f8ff'); ag.addColorStop(1, T.light);
    c.fillStyle = ag; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(43,31,51,0.7)'; c.stroke();
    c.save(); rr(c, ax, ay, aw, ah, 4); c.clip();
    var hgt = Art.height(id), sc = (ah * 0.92) / hgt;
    Art.creature(c, id, { t: t, mv: 0, walk: 0, atk: 0, hurt: 0, blink: false, faint: 0 }, ax + aw * 0.5, ay + ah * 0.96 + (sp.fly ? ah * 0.12 : 0), sc, 1);
    if (sp.n > 1) text(c, '×' + sp.n, ax + aw - 4, ay + ah - 8, Math.max(10, w * 0.14), '#fff', '#2b1f33', 'right', '900');
    c.restore();
    var ny = ay + ah + h * 0.03, nh = h * 0.17;
    rr(c, ax, ny, aw, nh, 3); c.fillStyle = 'rgba(255,255,255,0.88)'; c.fill();
    text(c, sp.name, x + w / 2, ny + nh / 2 + 0.5, Math.min(w * 0.135, 12), '#2b1f33', null, 'center', '800');
    var or = Math.max(9, w * 0.15), ox = x + or * 0.75, oy = y + or * 0.75;
    var og = c.createRadialGradient(ox - or * 0.3, oy - or * 0.35, 1, ox, oy, or);
    og.addColorStop(0, '#fff7b0'); og.addColorStop(0.5, '#ffc21f'); og.addColorStop(1, '#ff7a1f');
    H.C(c, ox, oy, or); c.fillStyle = og; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2b1f33'; c.stroke();
    text(c, sp.cost + '', ox, oy + 1, or * 1.15, '#ffffff', '#8a3a00', 'center', '900');
    Art.typeIcon(c, sp.type, x + w - or * 0.7, y + or * 0.7, or * 0.62);
    c.restore();
  };

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
      if (f > 0) { c.save(); rr(c, x, y, w, h, 8); c.clip(); c.fillStyle = 'rgba(255,200,60,0.25)'; c.fillRect(x, y + h * (1 - f), w, h * f); c.restore(); }
    }
    c.restore();
  };

  P.drawHand = function (c, b, ui, t) {
    var L = this.L, W = this.W, s = b.sides[0], u = L.ui;
    var y = L.handY;
    rr(c, 4, y, W - 8, L.handH + 20, 18);
    var g = c.createLinearGradient(0, y, 0, y + L.handH);
    g.addColorStop(0, 'rgba(255,255,255,0.97)'); g.addColorStop(1, 'rgba(220,236,255,0.97)');
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = TEAM[0]; c.stroke();
    Art.pixelText(c, 'YOU', 14, y + 15 * u, 1.5 * u, TEAM_D[0], 'left');
    this.drawPips(c, 0, b, 14 + 34 * u, y + 10 * u, 4 * u);
    // crowd boost button
    var B = L.boost, ready = b.canBoost(0), boosting = s.boostT > 0;
    var f = boosting ? s.boostT / R.boostTime : s.hype / R.hypeMax;
    c.save();
    if (ready) { c.translate(B.x + B.w / 2, B.y + B.h / 2); c.scale(1 + sin(t * 8) * 0.04, 1 + sin(t * 8) * 0.04); c.translate(-B.x - B.w / 2, -B.y - B.h / 2); }
    rr(c, B.x, B.y, B.w, B.h, B.h / 2); c.fillStyle = '#2b3242'; c.fill();
    c.save(); rr(c, B.x, B.y, B.w, B.h, B.h / 2); c.clip();
    var bg2 = c.createLinearGradient(B.x, 0, B.x + B.w, 0);
    bg2.addColorStop(0, '#ffb21f'); bg2.addColorStop(1, '#ffe36a');
    c.fillStyle = ready || boosting ? bg2 : '#5a7cc0'; c.fillRect(B.x, B.y, B.w * f, B.h);
    c.restore();
    rr(c, B.x, B.y, B.w, B.h, B.h / 2); c.lineWidth = 2; c.strokeStyle = '#2b1f33'; c.stroke();
    Art.pixelText(c, boosting ? 'CROWD WILD!' : ready ? 'CROWD BOOST!' : 'CROWD ' + Math.floor(f * 100) + '%', B.x + B.w / 2, B.y + B.h / 2, 1.2 * u, ready || boosting ? '#2b1f33' : '#ffffff', 'center');
    c.restore();
    var nx = L.next;
    Art.pixelText(c, 'NEXT', nx.x + nx.w / 2, nx.y - 8, 1.2 * u, '#5a6170', 'center');
    this.handCard(c, s.queue[0], nx.x, nx.y, nx.w, nx.h, { dim: true, progress: 0 });
    for (var i = 0; i < 4; i++) {
      var r = L.cards[i], id = s.hand[i], sp = SP[id];
      var dragging = ui.drag && ui.drag.hi === i;
      var afford = s.energy >= sp.cost && s.capsules > 0 && ui.phase !== 'intro';
      if (dragging && ui.drag.onField) { this.handCard(c, id, r.x, r.y, r.w, r.h, { dim: !afford, alpha: 0.35 }); continue; }
      this.handCard(c, id, r.x, r.y, r.w, r.h, { dim: !afford, progress: s.energy / sp.cost, sel: ui.sel === i || dragging, lift: (ui.sel === i || dragging) ? 8 : 0 });
    }
    var e = L.energy;
    rr(c, e.x, e.y, e.w, e.h, e.h / 2); c.fillStyle = '#2b1f33'; c.fill();
    var segW = (e.w - 30) / 10, ex = e.x + 26;
    for (i = 0; i < 10; i++) {
      var ef = clamp(s.energy - i, 0, 1);
      rr(c, ex + i * segW + 1, e.y + 3, segW - 2, e.h - 6, 4); c.fillStyle = '#463a52'; c.fill();
      if (ef > 0) {
        c.save(); rr(c, ex + i * segW + 1, e.y + 3, (segW - 2) * ef, e.h - 6, 4); c.clip();
        var eg = c.createLinearGradient(0, e.y, 0, e.y + e.h);
        eg.addColorStop(0, '#fff3a0'); eg.addColorStop(0.5, '#ffc21f'); eg.addColorStop(1, '#ff8a1f');
        c.fillStyle = ef >= 1 ? eg : 'rgba(255,194,31,0.55)'; c.fillRect(ex + i * segW, e.y, segW, e.h);
        c.restore();
      }
    }
    var sx = e.x + 12, sy = e.y + e.h / 2;
    c.save(); c.translate(sx, sy); c.rotate(t * 0.8); c.fillStyle = '#ffd23f';
    for (i = 0; i < 8; i++) { c.rotate(TAU / 8); c.beginPath(); c.moveTo(-3, -11); c.lineTo(0, -16); c.lineTo(3, -11); c.closePath(); c.fill(); }
    c.restore();
    var sg = c.createRadialGradient(sx - 3, sy - 3, 1, sx, sy, 13);
    sg.addColorStop(0, '#fff7b0'); sg.addColorStop(0.6, '#ffc21f'); sg.addColorStop(1, '#ff8a1f');
    H.C(c, sx, sy, 12.5); c.fillStyle = sg; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2b1f33'; c.stroke();
    text(c, Math.floor(s.energy) + '', sx, sy + 1, 14, '#ffffff', '#8a3a00', 'center', '900');
    if (ui.drag && !ui.drag.onField && ui.drag.moved) {
      var d = ui.drag, cw = L.cardW * 0.9, ch = L.cardH * 0.9;
      this.handCard(c, s.hand[d.hi], d.sx - cw / 2, d.sy - ch * 0.8, cw, ch, { sel: true, alpha: 0.92 });
    }
  };

  // long-press a card: what does it do?
  P.drawInfo = function (c, b, ui, t) {
    var L = this.L, id = b.sides[0].hand[ui.info], sp = SP[id], role = CA.ROLES[sp.role], T = CA.TYPES[sp.type], u = L.ui;
    var w = Math.min(this.W - 16, 380 * u), h = 128 * u, x = (this.W - w) / 2, y = L.handY - h - 8;
    c.save();
    rr(c, x, y, w, h, 12); c.fillStyle = 'rgba(255,255,255,0.97)'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#2b1f33'; c.stroke();
    rr(c, x + 8, y + 8, 76 * u, h - 16, 8); c.fillStyle = T.light; c.fill();
    Art.creature(c, id, { t: t, mv: 0, walk: 0, atk: 0, hurt: 0, blink: (t % 3) < 0.1, faint: 0 }, x + 8 + 38 * u, y + h - 14 + (sp.fly ? 14 : 0), (h - 30) / Art.height(id), 1);
    var tx = x + 92 * u;
    Art.pixelText(c, sp.name, tx, y + 16 * u, 2 * u, '#2b1f33', 'left');
    Art.pixelText(c, T.name + ' / ' + role.name + ' / ' + sp.cost + ' ENERGY', tx, y + 32 * u, 1.1 * u, T.dark, 'left');
    // description, wrapped
    c.font = '700 ' + (11 * u) + 'px ' + FONT; c.fillStyle = '#2b1f33'; c.textAlign = 'left'; c.textBaseline = 'top';
    var words = sp.desc.split(' '), line = '', ly = y + 42 * u, maxW = x + w - tx - 10;
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + ' ';
      if (c.measureText(test).width > maxW && line) { c.fillText(line, tx, ly); ly += 13 * u; line = words[i] + ' '; } else line = test;
    }
    c.fillText(line, tx, ly);
    Art.pixelText(c, 'EVOLVES INTO ' + CA.EVOS[id].name, tx, y + h - 12 * u, 1.1 * u, '#b0202e', 'left');
    c.restore();
  };

  P.drawSpectate = function (c, b, ui, t) {
    var L = this.L, W = this.W, y = L.handY, u = L.ui;
    rr(c, 4, y, W - 8, L.handH + 20, 18); c.fillStyle = 'rgba(255,255,255,0.96)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#2b1f33'; c.stroke();
    Art.pixelText(c, 'SPECTATING', W / 2, y + 16 * u, 2 * u, '#5a6170', 'center');
    Art.pixelText(c, ui.names[0], W * 0.25, y + 42 * u, 2 * u, TEAM_D[0], 'center');
    Art.pixelText(c, 'VS', W / 2, y + 42 * u, 2 * u, '#2b1f33', 'center');
    Art.pixelText(c, ui.names[1], W * 0.75, y + 42 * u, 2 * u, TEAM_D[1], 'center');
    this.drawPips(c, 0, b, W * 0.25 - 6 * 4.6 * u, y + 60 * u, 4 * u);
    this.drawPips(c, 1, b, W * 0.75 - 6 * 4.6 * u, y + 60 * u, 4 * u);
    var bw = (W - 40) / 3, by = y + L.handH - 54 * u, bh = 36 * u;
    this.specBtns = [];
    var labels = ['SPEED X' + ui.speed, 'SKIP', 'LEAVE'];
    for (var i = 0; i < 3; i++) {
      var bx = 12 + i * (bw + 8);
      rr(c, bx, by, bw, bh, 10); c.fillStyle = i === 0 ? '#3d8bff' : i === 1 ? '#ffd23f' : '#ffffff'; c.fill();
      c.lineWidth = 2.5; c.strokeStyle = '#2b1f33'; c.stroke();
      Art.pixelText(c, labels[i], bx + bw / 2, by + bh / 2, 1.6 * u, i === 0 ? '#ffffff' : '#2b1f33', 'center');
      this.specBtns.push({ x: bx, y: by, w: bw, h: bh });
    }
  };

  // ---------------------------------------------------------------------------
  // hit tests
  P.cardAt = function (x, y) {
    var L = this.L;
    for (var i = 0; i < 4; i++) {
      var r = L.cards[i];
      if (x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 10 && y <= r.y + r.h + 6) return i;
    }
    return -1;
  };
  P.boostAt = function (x, y) { var B = this.L.boost; return x >= B.x - 6 && x <= B.x + B.w + 6 && y >= B.y - 8 && y <= B.y + B.h + 8; };
  P.specAt = function (x, y) {
    var bs = this.specBtns || [];
    for (var i = 0; i < bs.length; i++) { var r = bs[i]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i; }
    return -1;
  };
  // your evolve-ready creature under a tap (generous hit area around body and badge)
  P.evoAt = function (b, x, y) {
    var best = null, bd = 1e9;
    for (var i = 0; i < b.units.length; i++) {
      var u = b.units[i];
      if (u.side !== 0 || u.st !== 'act' || !b.evoReady(u.rec)) continue;
      var g = this.unitGeom(u);
      var bx = g.x + g.hgt * 0.32, by = g.top - 12;
      var d1 = Math.hypot(x - g.x, y - g.mid), d2 = Math.hypot(x - bx, y - by);
      var r1 = Math.max(26, g.hgt * 0.6), d = Math.min(d1 / r1, d2 / 22);
      if (d < 1 && d < bd) { bd = d; best = u; }
    }
    return best;
  };
})(typeof window !== 'undefined' ? window : globalThis);
