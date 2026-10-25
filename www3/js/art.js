/* Critter Arena 2 — procedural art. Every creature, trainer and icon is drawn with canvas paths.
 * Creature design space: feet at (0,0), ~100 units tall, facing right (+x). */
(function (root) {
  var CA = root.CA;
  var Art = CA.Art = {};
  var TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  var OUT = '#2b1f33';

  // ---- path helpers -----------------------------------------------------------
  function E(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
  function C(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); }
  function fs(c, fill, stroke, lw) {
    c.fillStyle = fill; c.fill();
    if (stroke !== null) { c.lineWidth = lw || 3.6; c.strokeStyle = stroke || OUT; c.stroke(); }
  }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); }
  // smooth closed curve through a list of [x,y,...] points
  function blob(c, pts) {
    var n = pts.length / 2;
    c.beginPath();
    var mx = (pts[0] + pts[2 * (n - 1)]) / 2, my = (pts[1] + pts[2 * (n - 1) + 1]) / 2;
    c.moveTo(mx, my);
    for (var i = 0; i < n; i++) {
      var x = pts[2 * i], y = pts[2 * i + 1];
      var nx = pts[2 * ((i + 1) % n)], ny = pts[2 * ((i + 1) % n) + 1];
      c.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
    }
    c.closePath();
  }
  function grad(c, key, x0, y0, r1, stops, x1, y1) {
    var cache = c.__g || (c.__g = {});
    var g = cache[key];
    if (!g) {
      g = c.createRadialGradient(x0, y0, 1, x1 === undefined ? x0 : x1, y1 === undefined ? y0 : y1, r1);
      for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
      cache[key] = g;
    }
    return g;
  }
  function lin(c, key, x0, y0, x1, y1, stops) {
    var cache = c.__g || (c.__g = {});
    var g = cache[key];
    if (!g) {
      g = c.createLinearGradient(x0, y0, x1, y1);
      for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
      cache[key] = g;
    }
    return g;
  }
  // body gradient: highlight up-left, base, shade down-right
  function bodyG(c, key, cx, cy, r, light, base, dark) {
    return grad(c, key, cx - r * 0.45, cy - r * 0.55, r * 1.55, [0, light, 0.45, base, 1, dark], cx, cy);
  }
  Art.helpers = { E: E, C: C, fs: fs, poly: poly, blob: blob, grad: grad, lin: lin };

  // ---- faces --------------------------------------------------------------------
  // two eyes; (x1,y1) is the near eye, (x2,y2) the far eye. s = eye radius.
  function eyes(c, a, x1, y1, x2, y2, s, o) {
    o = o || {};
    var lx = (a.look || 0) * s * 0.25;
    if (a.faint > 0) { swirl(c, x1, y1, s); swirl(c, x2, y2, s * 0.92); return; }
    if (a.cheer || a.happy) { happyEye(c, x1, y1, s); happyEye(c, x2, y2, s * 0.92); return; }
    if (a.hurt > 0.45) { squint(c, x1, y1, s, 1); squint(c, x2, y2, s * 0.92, -1); return; }
    if (a.blink) { shut(c, x1, y1, s); shut(c, x2, y2, s * 0.92); return; }
    eye(c, x1 + lx, y1, s, o);
    eye(c, x2 + lx, y2, s * 0.92, o);
    if (o.brow) {
      c.lineCap = 'round'; c.lineWidth = s * 0.42; c.strokeStyle = o.browC || OUT;
      c.beginPath(); c.moveTo(x1 - s * 0.9, y1 - s * 1.55); c.lineTo(x1 + s * 0.7, y1 - s * 1.15 - o.brow * s * 0.3); c.stroke();
      c.beginPath(); c.moveTo(x2 + s * 0.85, y2 - s * 1.5); c.lineTo(x2 - s * 0.6, y2 - s * 1.12 - o.brow * s * 0.3); c.stroke();
    }
  }
  function eye(c, x, y, s, o) {
    var ry = s * (o.tall || 1.18), rx = s * 0.9;
    E(c, x, y, rx, ry); c.fillStyle = o.sclera ? '#fff' : '#1e1626'; c.fill();
    if (o.sclera) { c.lineWidth = s * 0.28; c.strokeStyle = OUT; c.stroke(); }
    if (o.iris) {
      E(c, x + (o.sclera ? s * 0.12 : 0), y + ry * (o.sclera ? 0.05 : 0.25), rx * (o.sclera ? 0.68 : 0.82), ry * (o.sclera ? 0.72 : 0.62));
      c.fillStyle = o.iris; c.fill();
      E(c, x + (o.sclera ? s * 0.16 : 0), y + ry * (o.sclera ? 0.08 : 0.2), rx * (o.slit ? 0.16 : 0.42), ry * (o.slit ? 0.62 : 0.42));
      c.fillStyle = '#140d1c'; c.fill();
    }
    if (o.lid) {
      c.save(); E(c, x, y, rx, ry); c.clip();
      c.fillStyle = o.lid; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 0.95);
      c.lineWidth = s * 0.3; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(x - rx, y - ry * 0.06); c.quadraticCurveTo(x, y + ry * 0.04, x + rx, y - ry * 0.06); c.stroke();
      c.restore();
    }
    C(c, x - rx * 0.32, y - ry * 0.42, s * 0.36); c.fillStyle = '#fff'; c.fill();
    C(c, x + rx * 0.35, y + ry * 0.35, s * 0.17); c.fill();
  }
  function shut(c, x, y, s) {
    c.lineCap = 'round'; c.lineWidth = s * 0.42; c.strokeStyle = '#1e1626';
    c.beginPath(); c.moveTo(x - s * 0.85, y); c.quadraticCurveTo(x, y + s * 0.55, x + s * 0.85, y); c.stroke();
  }
  function happyEye(c, x, y, s) {
    c.lineCap = 'round'; c.lineWidth = s * 0.45; c.strokeStyle = '#1e1626';
    c.beginPath(); c.moveTo(x - s * 0.85, y + s * 0.25); c.quadraticCurveTo(x, y - s * 0.9, x + s * 0.85, y + s * 0.25); c.stroke();
  }
  function squint(c, x, y, s, d) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s * 0.42; c.strokeStyle = '#1e1626';
    c.beginPath(); c.moveTo(x - s * 0.8 * d, y - s * 0.6); c.lineTo(x + s * 0.6 * d, y); c.lineTo(x - s * 0.8 * d, y + s * 0.6); c.stroke();
  }
  function swirl(c, x, y, s) {
    c.lineCap = 'round'; c.lineWidth = s * 0.3; c.strokeStyle = '#1e1626';
    c.beginPath();
    for (var i = 0; i <= 26; i++) { var k = i / 26, ang = k * TAU * 2.2, rr = k * s; c.lineTo(x + cos(ang) * rr, y + sin(ang) * rr); }
    c.stroke();
  }
  function cheeks(c, x1, y1, x2, y2, r, col) {
    c.fillStyle = col || 'rgba(255,110,140,0.55)';
    E(c, x1, y1, r, r * 0.62); c.fill();
    E(c, x2, y2, r * 0.9, r * 0.56); c.fill();
  }
  // mouth: open (0..1) widens into an "o" / shout
  function mouth(c, a, x, y, w, kind) {
    var open = Math.max(a.atk || 0, a.cheer ? 0.8 : 0, a.faint > 0 ? 0.35 : 0);
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (open > 0.15) {
      c.beginPath();
      c.moveTo(x - w, y - w * 0.1);
      c.quadraticCurveTo(x, y + w * (0.5 + open * 1.1), x + w, y - w * 0.1);
      c.quadraticCurveTo(x, y + w * 0.1, x - w, y - w * 0.1);
      c.closePath();
      c.fillStyle = '#7a1f35'; c.fill();
      c.lineWidth = w * 0.32; c.strokeStyle = OUT; c.stroke();
      E(c, x, y + w * (0.25 + open * 0.55), w * 0.45, w * 0.22 * (0.6 + open)); c.fillStyle = '#ff7f9a'; c.fill();
      return;
    }
    c.lineWidth = w * 0.34; c.strokeStyle = OUT;
    c.beginPath();
    if (kind === 'w') {
      c.moveTo(x - w, y - w * 0.15); c.quadraticCurveTo(x - w * 0.5, y + w * 0.55, x, y);
      c.quadraticCurveTo(x + w * 0.5, y + w * 0.55, x + w, y - w * 0.15);
    } else if (kind === 'flat') {
      c.moveTo(x - w * 0.7, y); c.quadraticCurveTo(x, y + w * 0.25, x + w * 0.7, y);
    } else {
      c.moveTo(x - w, y - w * 0.15); c.quadraticCurveTo(x, y + w * 0.75, x + w, y - w * 0.15);
    }
    c.stroke();
    if (kind === 'fang') {
      poly(c, [x + w * 0.2, y + w * 0.18, x + w * 0.6, y + w * 0.1, x + w * 0.42, y + w * 0.62]);
      c.fillStyle = '#fff'; c.fill(); c.lineWidth = w * 0.18; c.stroke();
    }
  }
  function sparkleStar(c, x, y, r, col) {
    c.beginPath();
    for (var i = 0; i < 8; i++) {
      var ang = i * PI / 4, rr = i % 2 ? r * 0.32 : r;
      c.lineTo(x + cos(ang) * rr, y + sin(ang) * rr);
    }
    c.closePath(); c.fillStyle = col; c.fill();
  }
  function star5(c, x, y, r, inner, rot) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var ang = -PI / 2 + i * PI / 5 + (rot || 0), rr = i % 2 ? r * (inner || 0.45) : r;
      c.lineTo(x + cos(ang) * rr, y + sin(ang) * rr);
    }
    c.closePath();
  }
  function flame(c, x, y, w, h, t, cols) {
    // layered teardrop flame rising from (x,y)
    for (var k = 0; k < cols.length; k++) {
      var s = 1 - k * 0.28;
      var fl = sin(t * 13 + k * 1.7) * 0.12 + sin(t * 7.3 + k) * 0.08;
      var hh = h * s * (1 + fl), ww = w * s;
      c.beginPath();
      c.moveTo(x - ww, y);
      c.bezierCurveTo(x - ww * 1.1, y - hh * 0.45, x - ww * 0.2 + fl * w, y - hh * 0.7, x + fl * w * 1.5, y - hh);
      c.bezierCurveTo(x + ww * 0.35 + fl * w, y - hh * 0.6, x + ww * 1.15, y - hh * 0.4, x + ww, y);
      c.quadraticCurveTo(x, y + ww * 0.75, x - ww, y);
      c.closePath();
      c.fillStyle = cols[k]; c.fill();
      if (k === 0) { c.lineWidth = 3; c.strokeStyle = '#a3280f'; c.stroke(); }
    }
  }
  function zig(c, pts, fill, stroke, lw) {
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath(); c.lineJoin = 'round'; fs(c, fill, stroke, lw);
  }
  Art.star5 = star5; Art.sparkleStar = sparkleStar; Art.flame = flame;

  // ---- creatures ----------------------------------------------------------------
  var D = {};

  D.emberpup = function (c, a) {
    var t = a.t, wag = sin(t * 6) * 0.15 + a.mv * sin(a.walk * 2) * 0.2;
    // flame tail
    c.save(); c.translate(-24, -26); c.rotate(-0.5 + wag);
    blob(c, [0, 6, -18, -2, -30, -24, -22, -40, -6, -28, 6, -6]);
    fs(c, bodyG(c, 'ep_t', -14, -18, 26, '#ffc27a', '#ff8a3d', '#d9541a'));
    flame(c, -24, -32, 13, 40, t, ['#ff5a1f', '#ffa21f', '#ffe36a']);
    c.restore();
    // legs
    var st = a.mv * sin(a.walk);
    E(c, -16 - st * 4, -5, 9, 7); fs(c, '#e8661f');
    E(c, 18 + st * 4, -5, 9, 7); fs(c, '#e8661f');
    // body
    E(c, 0, -30, 31, 25); fs(c, bodyG(c, 'ep_b', 0, -30, 31, '#ffc685', '#ff8a3d', '#d9541a'));
    E(c, 10, -24, 15, 14); fs(c, '#ffe9c4', null);
    // front paws
    E(c, 4 - st * 3, -5, 8, 6); fs(c, '#fff0d6');
    E(c, 24 + st * 3, -5, 8, 6); fs(c, '#fff0d6');
    // ears
    c.lineJoin = 'round';
    zig(c, [-16, -74, -26, -112, 4, -86], '#ff8a3d');
    zig(c, [-14, -80, -21, -103, -4, -88], '#ffc4c4', null);
    zig(c, [-26, -112, -24, -101, -18, -104], OUT, null);
    zig(c, [14, -88, 34, -116, 38, -80], '#ff8a3d');
    zig(c, [18, -88, 32, -107, 33, -84], '#ffc4c4', null);
    zig(c, [34, -116, 30, -106, 36, -105], OUT, null);
    // head
    C(c, 8, -62, 30); fs(c, bodyG(c, 'ep_h', 8, -62, 30, '#ffcf96', '#ff8a3d', '#e0601f'));
    // forehead flame tuft
    flame(c, 6, -88, 7, 18, t + 1, ['#ff6a1f', '#ffd23f']);
    // muzzle
    E(c, 24, -50, 15, 11); fs(c, '#fff0d6', null);
    E(c, 36, -56, 4.5, 3.5); fs(c, OUT, null);
    eyes(c, a, 0, -66, 25, -66, 7.2);
    cheeks(c, -8, -52, 36, -46, 6);
    mouth(c, a, 30, -46, 5, 'fang');
  };

  D.puddlefin = function (c, a) {
    var t = a.t, fl = sin(t * 5);
    // tail fin
    c.save(); c.translate(-30, -10); c.rotate(0.3 + fl * 0.2);
    blob(c, [0, 0, -18, -14, -26, -4, -20, 6, -26, 14, -14, 10]);
    fs(c, '#7cc4ff'); c.restore();
    // body (teardrop)
    blob(c, [0, -2, 30, -6, 36, -30, 24, -64, 0, -78, -24, -64, -36, -30, -30, -6]);
    fs(c, bodyG(c, 'pf_b', 0, -42, 40, '#bfe6ff', '#3aa2ff', '#1f63c0'));
    E(c, 6, -26, 21, 17); fs(c, '#e6f6ff', null);
    // side fins / ears
    c.save(); c.translate(-28, -50); c.rotate(-0.6 - fl * 0.12);
    blob(c, [0, 0, -10, -18, -2, -28, 8, -8]); fs(c, '#8fd0ff'); c.restore();
    c.save(); c.translate(26, -52); c.rotate(0.55 + fl * 0.12);
    blob(c, [0, 0, 10, -18, 2, -28, -8, -8]); fs(c, '#8fd0ff'); c.restore();
    // flippers
    E(c, -14, -5, 10, 5, -0.3); fs(c, '#2f86e0');
    E(c, 20, -5, 10, 5, 0.3); fs(c, '#2f86e0');
    // droplet crest
    var bob = sin(t * 3) * 2;
    c.beginPath(); c.moveTo(2, -100 + bob); c.quadraticCurveTo(12, -84 + bob, 2, -76 + bob); c.quadraticCurveTo(-8, -84 + bob, 2, -100 + bob);
    fs(c, '#9fdcff'); E(c, -1, -84 + bob, 2, 3); fs(c, '#fff', null);
    var puff = a.atk || 0;
    eyes(c, a, -6, -50, 16, -50, 7.4);
    cheeks(c, -18, -38, 28, -36, 6 + puff * 4, 'rgba(255,120,170,' + (0.45 + puff * 0.3) + ')');
    mouth(c, a, 6, -36, 4.5, 'w');
  };

  D.sproutle = function (c, a) {
    var t = a.t, sw = sin(t * 2.4) * 0.18, bloom = Math.max(a.atk || 0, a.cheer ? 1 : 0);
    var st = a.mv * sin(a.walk);
    E(c, -14 - st * 3, -5, 10, 7); fs(c, '#3a9a3e');
    E(c, 16 + st * 3, -5, 10, 7); fs(c, '#3a9a3e');
    // leaf arms
    c.save(); c.translate(-30, -30); c.rotate(-0.9 + sw);
    E(c, -6, 0, 10, 5); fs(c, '#58c24a'); c.restore();
    c.save(); c.translate(30, -30); c.rotate(0.9 - sw);
    E(c, 6, 0, 10, 5); fs(c, '#58c24a'); c.restore();
    // body
    E(c, 0, -34, 33, 30); fs(c, bodyG(c, 'sp_b', 0, -34, 33, '#d4ffb8', '#73d65a', '#3a9a3e'));
    c.fillStyle = 'rgba(40,130,60,0.35)';
    E(c, -18, -46, 6, 4.5, -0.4); c.fill(); E(c, 22, -52, 4.5, 3.4, 0.4); c.fill(); E(c, -22, -24, 4, 3); c.fill();
    // sprout
    c.save(); c.translate(0, -62); c.rotate(sw * 0.6);
    c.lineWidth = 4.5; c.strokeStyle = '#2f7a34'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-3, -10, 0, -20); c.stroke();
    c.save(); c.translate(0, -20); c.rotate(-0.7 + sw);
    E(c, -14, 0, 15, 7.5); fs(c, lin(c, 'sp_l', -28, 0, 0, 0, [0, '#9cf27a', 1, '#45b84a']));
    c.lineWidth = 1.8; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-3, 0); c.stroke();
    c.restore();
    c.save(); c.translate(0, -20); c.rotate(0.7 - sw);
    E(c, 14, 0, 15, 7.5); fs(c, lin(c, 'sp_l2', 0, 0, 28, 0, [0, '#45b84a', 1, '#9cf27a']));
    c.lineWidth = 1.8; c.beginPath(); c.moveTo(3, 0); c.lineTo(26, 0); c.stroke();
    c.restore();
    // bud / bloom
    var br = 5 + bloom * 5;
    for (var i = 0; i < 5; i++) {
      var ang = i * TAU / 5 + t;
      E(c, cos(ang) * br * 0.8, -22 + sin(ang) * br * 0.8, br * 0.7, br * 0.5, ang); c.fillStyle = '#ff8fc8'; c.fill();
    }
    C(c, 0, -22, br * 0.55); fs(c, '#ffe36a', OUT, 2);
    c.restore();
    eyes(c, a, -6, -40, 16, -40, 7);
    cheeks(c, -18, -28, 28, -26, 6);
    mouth(c, a, 6, -27, 5);
  };

  D.zappip = function (c, a) {
    var t = a.t, wag = sin(t * 8) * 0.12 + a.mv * 0.2;
    // lightning tail
    c.save(); c.translate(-16, -20); c.rotate(0.12 + wag); c.scale(0.9, 0.9);
    zig(c, [0, 4, -16, -16, -6, -22, -30, -44, -18, -48, -34, -78, -4, -54, -14, -50, 6, -26, -2, -22, 12, -4],
      lin(c, 'zp_t', 0, 0, -30, -78, [0, '#d48a1a', 0.35, '#ffd23f', 1, '#fff27a']));
    c.restore();
    var st = a.mv * sin(a.walk * 1.3);
    E(c, -12 - st * 4, -5, 8, 6); fs(c, '#e8a800');
    E(c, 14 + st * 4, -5, 8, 6); fs(c, '#e8a800');
    // body
    E(c, 0, -28, 23, 22); fs(c, bodyG(c, 'zp_b', 0, -28, 23, '#fff6a8', '#ffc61f', '#d99500'));
    E(c, 6, -22, 12, 12); fs(c, '#fff4cc', null);
    E(c, 16, -14, 6, 5); fs(c, '#ffe27a');
    // ears
    zig(c, [-12, -70, -20, -108, 2, -80], '#ffc61f');
    zig(c, [-11, -76, -16, -98, -3, -82], '#ff9a3a', null);
    zig(c, [12, -80, 26, -110, 32, -74], '#ffc61f');
    zig(c, [16, -80, 25, -100, 28, -78], '#ff9a3a', null);
    // head
    C(c, 6, -56, 26); fs(c, bodyG(c, 'zp_h', 6, -56, 26, '#fff7b0', '#ffc61f', '#e0a000'));
    // forehead stripe
    zig(c, [-2, -82, 8, -82, 4, -72, 10, -72, -2, -62, 2, -72, -4, -72], '#ff8a1f', null);
    eyes(c, a, -2, -58, 19, -58, 7);
    // electric cheeks
    var zap = Math.max(a.atk || 0, 0.25 + 0.25 * sin(t * 9));
    C(c, -12, -46, 6); fs(c, 'rgba(92,225,255,' + (0.55 + zap * 0.45) + ')', null);
    C(c, 30, -44, 5.4); fs(c, 'rgba(92,225,255,' + (0.55 + zap * 0.45) + ')', null);
    if (a.atk > 0.2) {
      c.strokeStyle = '#bff4ff'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(-16, -50); c.lineTo(-24, -54); c.lineTo(-20, -46); c.lineTo(-28, -44); c.stroke();
    }
    E(c, 24, -50, 3.5, 2.8); fs(c, OUT, null);
    mouth(c, a, 20, -43, 4);
    // buck teeth
    if (!(a.atk > 0.15)) { c.fillStyle = '#fff'; c.fillRect(17.5, -42, 5, 5); c.lineWidth = 1.4; c.strokeStyle = OUT; c.strokeRect(17.5, -42, 5, 5); }
  };

  D.pebblump = function (c, a) {
    var t = a.t, pound = a.atk || 0;
    var st = a.mv * sin(a.walk * 0.8);
    // feet
    E(c, -20 - st * 3, -6, 13, 8); fs(c, '#8a7a66');
    E(c, 22 + st * 3, -6, 13, 8); fs(c, '#8a7a66');
    // arms
    c.save(); c.translate(-40, -38); c.rotate(-0.3 - pound * 0.9);
    E(c, -4, 6, 11, 14, 0.2); fs(c, '#9c8c76'); c.restore();
    c.save(); c.translate(42, -38); c.rotate(0.3 + pound * 0.9);
    E(c, 4, 6, 11, 14, -0.2); fs(c, '#9c8c76'); c.restore();
    // boulder body
    blob(c, [0, -2, 30, -4, 44, -26, 42, -56, 22, -80, -6, -84, -32, -72, -46, -46, -40, -12]);
    fs(c, bodyG(c, 'pb_b', 0, -44, 48, '#e8dccb', '#a8977f', '#6a5c4b'), OUT, 4);
    // cracks & speckles
    c.lineWidth = 2.4; c.strokeStyle = 'rgba(60,45,35,0.55)'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-34, -30); c.lineTo(-26, -26); c.lineTo(-28, -18); c.stroke();
    c.beginPath(); c.moveTo(34, -20); c.lineTo(28, -14); c.stroke();
    c.fillStyle = 'rgba(80,65,50,0.3)';
    C(c, -18, -60, 3); c.fill(); C(c, 26, -62, 2.5); c.fill(); C(c, -30, -50, 2); c.fill();
    // moss cap with a little flower
    blob(c, [-24, -74, -10, -86, 10, -86, 26, -76, 14, -72, 0, -76, -12, -70]);
    fs(c, bodyG(c, 'pb_m', 0, -80, 22, '#a8ec7a', '#5cb84a', '#3a8a34'), OUT, 3);
    C(c, 14, -86, 4); fs(c, '#fff', OUT, 1.8); C(c, 14, -86, 1.8); fs(c, '#ffd23f', null);
    // sleepy eyes
    eyes(c, a, -6, -48, 20, -48, 7.4, { lid: '#a8977f' });
    cheeks(c, -20, -36, 34, -34, 6.5);
    mouth(c, a, 8, -34, 5);
  };

  D.fuzzlets = function (c, a) {
    var t = a.t, st = a.mv * sin(a.walk * 1.4);
    E(c, -10 - st * 3, -3, 8, 5.5); fs(c, '#f2d7a8');
    E(c, 13 + st * 3, -3, 8, 5.5); fs(c, '#f2d7a8');
    // fuzzy ball
    var pts = [], n = 22;
    for (var i = 0; i < n; i++) {
      var ang = i / n * TAU, rr = (i % 2 ? 26 : 32) + sin(t * 6 + i) * 0.8;
      pts.push(cos(ang) * rr, -32 + sin(ang) * rr * 0.95);
    }
    poly(c, pts); c.lineJoin = 'round';
    fs(c, bodyG(c, 'fz_b', 0, -32, 32, '#e0b083', '#9a6a3e', '#5e3a1e'), OUT, 3.2);
    // tiny claws
    c.save(); c.translate(-28, -24); c.rotate(-0.4 + (a.atk || 0) * 0.8);
    E(c, 0, 0, 6, 5); fs(c, '#f2d7a8', OUT, 2.4);
    c.restore();
    c.save(); c.translate(30, -24); c.rotate(0.4 - (a.atk || 0) * 0.8);
    E(c, 0, 0, 6, 5); fs(c, '#f2d7a8', OUT, 2.4);
    c.restore();
    eyes(c, a, -7, -36, 13, -36, 9, { sclera: true, iris: '#b4791f', brow: 1, tall: 1.25 });
    mouth(c, a, 4, -18, 4.5, 'fang');
  };

  D.hexmoth = function (c, a) {
    var t = a.t, fl = sin(t * 9), hov = sin(t * 2.2) * 4 - 22;
    c.save(); c.translate(0, hov);
    // wings
    function wing(sx, big) {
      c.save(); c.translate(-2, -52); c.scale(sx, 1 + (big ? fl * 0.12 : -fl * 0.1)); c.rotate(big ? -0.2 : 0.35);
      if (big) {
        blob(c, [0, 0, -14, -30, -42, -46, -56, -30, -46, -6, -18, 4]);
        fs(c, grad(c, 'hm_w', -30, -26, 34, [0, '#d8b8ff', 0.5, '#8b5cf6', 1, '#4a2a9a']));
        C(c, -36, -24, 10); fs(c, '#e04fa0', OUT, 2.4);
        C(c, -36, -24, 5.2); fs(c, '#ffd23f', null);
        C(c, -37, -25, 2.2); fs(c, '#2b1f33', null);
      } else {
        blob(c, [0, 4, -24, 12, -36, 30, -20, 34, -4, 18]);
        fs(c, grad(c, 'hm_w2', -20, 20, 22, [0, '#ffb3dc', 1, '#c2368a']));
        C(c, -21, 23, 4.5); fs(c, '#ffd23f', OUT, 1.8);
      }
      c.restore();
    }
    wing(1, true); wing(1, false);
    // body
    E(c, 0, -42, 15, 22); fs(c, bodyG(c, 'hm_b', 0, -42, 20, '#ffffff', '#d9c6ff', '#9a7ad9'));
    c.lineWidth = 2; c.strokeStyle = 'rgba(110,70,170,0.5)';
    c.beginPath(); c.moveTo(-12, -36); c.quadraticCurveTo(0, -31, 12, -36); c.stroke();
    c.beginPath(); c.moveTo(-11, -28); c.quadraticCurveTo(0, -23, 11, -28); c.stroke();
    // fluffy collar
    blob(c, [-18, -58, -10, -66, 0, -60, 10, -66, 20, -58, 10, -52, 0, -56, -10, -52]);
    fs(c, '#ffffff', OUT, 2.6);
    // head
    C(c, 6, -72, 16); fs(c, bodyG(c, 'hm_h', 6, -72, 16, '#c9a8ff', '#8b5cf6', '#5a33b0'));
    // feathery antennae
    c.lineWidth = 2.6; c.strokeStyle = OUT; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -86); c.quadraticCurveTo(-8, -102, -16, -104 + fl); c.stroke();
    c.beginPath(); c.moveTo(12, -86); c.quadraticCurveTo(18, -102, 28, -104 - fl); c.stroke();
    C(c, -16, -104 + fl, 4); fs(c, '#ffd23f', OUT, 2);
    C(c, 28, -104 - fl, 4); fs(c, '#ffd23f', OUT, 2);
    // front wing on top
    c.save(); c.translate(6, -52); c.scale(1, 1 - fl * 0.12); c.rotate(0.15);
    blob(c, [0, 0, 12, -24, 34, -36, 46, -22, 38, -2, 14, 4]);
    fs(c, grad(c, 'hm_w3', 26, -18, 26, [0, '#e6d0ff', 0.55, '#9b6cf6', 1, '#5a33b0']));
    C(c, 30, -18, 7); fs(c, '#e04fa0', OUT, 2); C(c, 30, -18, 3.4); fs(c, '#ffd23f', null);
    c.restore();
    eyes(c, a, 2, -74, 15, -74, 5.4, { iris: '#ff4fb8' });
    cheeks(c, -4, -66, 20, -65, 3.6);
    mouth(c, a, 10, -65, 3);
    c.restore();
  };

  D.shellbert = function (c, a) {
    var t = a.t, st = a.mv * sin(a.walk * 0.9), lunge = (a.atk || 0) * 6;
    // legs
    E(c, -26 - st * 3, -7, 10, 8); fs(c, '#4fb8c8');
    E(c, 20 + st * 3, -7, 10, 8); fs(c, '#4fb8c8');
    // tail
    poly(c, [-40, -16, -54, -10, -40, -8]); fs(c, '#5cc8d8');
    // shell
    blob(c, [-44, -12, -46, -42, -28, -70, 0, -78, 24, -68, 34, -42, 30, -12]);
    fs(c, bodyG(c, 'sb_s', -6, -46, 46, '#9ccaff', '#2e6fb0', '#173d73'), OUT, 4);
    // plates
    c.lineWidth = 2.6; c.strokeStyle = 'rgba(190,225,255,0.65)'; c.lineJoin = 'round';
    poly(c, [-14, -54, -2, -64, 12, -56, 10, -40, -4, -34, -16, -40]); c.stroke();
    c.beginPath(); c.moveTo(-14, -54); c.lineTo(-32, -58); c.moveTo(-16, -40); c.lineTo(-36, -32);
    c.moveTo(12, -56); c.lineTo(24, -62); c.moveTo(10, -40); c.lineTo(26, -32); c.moveTo(-2, -64); c.lineTo(-2, -76);
    c.moveTo(-4, -34); c.lineTo(-4, -16); c.stroke();
    // golden rim
    c.beginPath(); c.moveTo(-45, -16); c.quadraticCurveTo(-8, -2, 31, -16);
    c.lineWidth = 7; c.strokeStyle = '#ffd76a'; c.stroke();
    c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    // shell shine
    E(c, -18, -62, 9, 4.5, -0.5); fs(c, 'rgba(255,255,255,0.45)', null);
    // head pokes out in front
    c.save(); c.translate(lunge, 0);
    E(c, 30, -30, 9, 12, 0.5); fs(c, '#5cc8d8');
    C(c, 40, -42, 19); fs(c, bodyG(c, 'sb_h', 40, -42, 19, '#c8fbff', '#5cc8d8', '#2a8a9a'));
    eyes(c, a, 36, -47, 51, -47, 5.8);
    cheeks(c, 29, -36, 54, -35, 4.4);
    mouth(c, a, 46, -35, 4);
    c.restore();
  };

  D.brambull = function (c, a) {
    var t = a.t, st = a.mv * sin(a.walk * 0.9), charge = a.atk || 0;
    E(c, -26 - st * 4, -7, 9, 8); fs(c, '#2f7a3a');
    E(c, 18 + st * 4, -7, 9, 8); fs(c, '#2f7a3a');
    E(c, -26 - st * 4, -1, 9, 3); fs(c, '#4a3020', null);
    E(c, 18 + st * 4, -1, 9, 3); fs(c, '#4a3020', null);
    // tail with leaf tip
    c.lineWidth = 3.5; c.strokeStyle = OUT; c.beginPath(); c.moveTo(-40, -36); c.quadraticCurveTo(-54, -40, -52, -54); c.stroke();
    E(c, -52, -58, 5, 8, 0.4); fs(c, '#58c24a', OUT, 2);
    // body
    E(c, -4, -38, 40, 29); fs(c, bodyG(c, 'bb_b', -4, -38, 40, '#b8f2a0', '#4faf5a', '#25703a'), OUT, 4);
    E(c, 2, -22, 26, 10); fs(c, 'rgba(220,255,190,0.55)', null);
    // thorns
    var th = [[-32, -58, -0.9], [-18, -66, -0.4], [-2, -68, 0], [12, -64, 0.4]];
    for (var i = 0; i < th.length; i++) {
      c.save(); c.translate(th[i][0], th[i][1]); c.rotate(th[i][2]);
      poly(c, [-6, 3, 0, -15, 6, 3]); fs(c, '#a8743a', OUT, 2.6);
      poly(c, [-2, -6, 0, -15, 2, -6]); fs(c, '#fff0c8', null);
      c.restore();
    }
    // head
    c.save(); c.translate(charge * 6, charge * 3);
    // leafy mane
    for (i = 0; i < 6; i++) {
      var ang = -2.4 + i * 0.55;
      E(c, 26 + cos(ang) * 22, -50 + sin(ang) * 22, 9, 5, ang); fs(c, i % 2 ? '#7ad65a' : '#58c24a', OUT, 2.2);
    }
    C(c, 28, -48, 21); fs(c, bodyG(c, 'bb_h', 28, -48, 21, '#c8f7b0', '#5cbc62', '#2f8a42'));
    // horns
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(16, -64); c.quadraticCurveTo(8, -82, 18, -88); c.lineWidth = 9; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 5.5; c.strokeStyle = '#fff2d0'; c.stroke();
    c.beginPath(); c.moveTo(38, -64); c.quadraticCurveTo(48, -80, 42, -88); c.lineWidth = 9; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 5.5; c.strokeStyle = '#fff2d0'; c.stroke();
    // flower
    for (i = 0; i < 5; i++) { var fa = i * TAU / 5; C(c, 27 + cos(fa) * 5, -70 + sin(fa) * 5, 4); fs(c, '#ff8fc8', OUT, 1.5); }
    C(c, 27, -70, 3); fs(c, '#ffe36a', null);
    // muzzle
    E(c, 36, -38, 13, 9); fs(c, '#e6ffcc');
    C(c, 32, -40, 1.8); fs(c, OUT, null); C(c, 41, -40, 1.8); fs(c, OUT, null);
    eyes(c, a, 20, -54, 37, -54, 5.6, { brow: 0.5 });
    cheeks(c, 12, -42, 47, -46, 4.4);
    mouth(c, a, 36, -33, 4);
    c.restore();
  };

  D.voltwing = function (c, a) {
    var t = a.t, fl = sin(t * 14), hov = sin(t * 3) * 4 - 22;
    c.save(); c.translate(0, hov);
    // tail feathers
    zig(c, [-14, -40, -34, -32, -30, -40, -42, -42, -26, -52, -12, -52], '#3ab0ff');
    // back wing
    c.save(); c.translate(-8, -56); c.rotate(-0.35 - fl * 0.45);
    blob(c, [0, 2, -6, -22, -16, -36, -22, -28, -28, -32, -30, -20, -38, -16, -26, -2]);
    fs(c, lin(c, 'vw_w', 0, 0, -30, -30, [0, '#ffe14a', 1, '#3ab0ff']));
    c.restore();
    // body
    C(c, 0, -48, 22); fs(c, bodyG(c, 'vw_b', 0, -48, 22, '#ffffff', '#ffe14a', '#e0a800'));
    E(c, 6, -40, 13, 11); fs(c, '#fffbe8', null);
    // crest
    zig(c, [-4, -66, -12, -88, -2, -80, 2, -98, 8, -82, 16, -90, 12, -66], '#3ab0ff');
    // feet
    c.lineWidth = 2.6; c.strokeStyle = '#d48a1a'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4, -27); c.lineTo(-6, -18); c.moveTo(6, -27); c.lineTo(8, -18); c.stroke();
    // beak
    poly(c, [18, -52, 30, -48, 18, -44]); fs(c, '#ff9a2a', OUT, 2.4);
    eyes(c, a, 2, -54, 15, -54, 5.6);
    cheeks(c, -6, -44, 20, -42, 4, 'rgba(92,200,255,0.6)');
    // front wing
    c.save(); c.translate(-4, -46); c.rotate(-0.1 + fl * 0.5);
    blob(c, [2, 0, -18, -6, -32, -2, -28, 5, -36, 10, -26, 14, -30, 20, -8, 12]);
    fs(c, lin(c, 'vw_w2', 0, 0, -32, 12, [0, '#fff6a0', 1, '#2f8ae0']));
    zig(c, [-6, 2, -14, 0, -12, 4, -22, 4, -14, 7, -16, 9, -6, 6], '#ffffff', null);
    c.restore();
    if (a.atk > 0.2) {
      c.strokeStyle = '#bff4ff'; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(24, -68); c.lineTo(30, -76); c.lineTo(26, -78); c.lineTo(34, -88); c.stroke();
    }
    c.restore();
  };

  D.magmaw = function (c, a) {
    var t = a.t, st = a.mv * sin(a.walk * 0.7), open = a.atk || 0;
    // feet
    E(c, -28 - st * 3, -7, 15, 8); fs(c, '#b8321f');
    E(c, 30 + st * 3, -7, 15, 8); fs(c, '#b8321f');
    // body
    E(c, 0, -40, 48, 37); fs(c, bodyG(c, 'mm_b', 0, -40, 48, '#ffb27a', '#e2452b', '#8a1f12'), OUT, 4.2);
    // belly
    E(c, 8, -24, 30, 16); fs(c, '#ffcf8a', null);
    c.lineWidth = 1.8; c.strokeStyle = 'rgba(180,80,30,0.45)';
    for (var i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-14, -30 + i * 7); c.quadraticCurveTo(8, -26 + i * 7, 30, -30 + i * 7); c.stroke(); }
    // rocky crust with glowing cracks
    blob(c, [-44, -50, -36, -70, -14, -80, 10, -80, 32, -72, 42, -56, 24, -60, 4, -64, -18, -60]);
    fs(c, bodyG(c, 'mm_c', 0, -70, 40, '#8a5a4a', '#5a2f2a', '#2e1614'), OUT, 3.4);
    var glow = 0.6 + 0.4 * sin(t * 4);
    c.lineWidth = 3; c.strokeStyle = 'rgba(255,210,63,' + glow + ')'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-30, -66); c.lineTo(-20, -70); c.lineTo(-14, -64); c.moveTo(4, -76); c.lineTo(8, -68); c.lineTo(18, -70);
    c.moveTo(28, -66); c.lineTo(34, -60); c.stroke();
    // smoke vent puffs
    for (i = 0; i < 3; i++) {
      var k = ((t * 0.6 + i / 3) % 1);
      C(c, -20 + sin(k * 5 + i) * 4, -80 - k * 30, 4 + k * 7);
      c.fillStyle = 'rgba(120,110,110,' + (0.45 * (1 - k)) + ')'; c.fill();
    }
    // eye bumps
    C(c, -10, -74, 13); fs(c, '#e8502e'); C(c, 20, -74, 12); fs(c, '#e8502e');
    eyes(c, a, -10, -75, 20, -75, 6.4);
    // horns
    poly(c, [-22, -82, -28, -98, -14, -86]); fs(c, '#ffe0a0', OUT, 2.4);
    poly(c, [30, -84, 38, -98, 24, -88]); fs(c, '#ffe0a0', OUT, 2.4);
    // wide toad mouth
    c.beginPath();
    c.moveTo(-18, -50); c.quadraticCurveTo(14, -40 + open * 18, 44, -52);
    if (open > 0.1) {
      c.quadraticCurveTo(14, -46 - open * 2, -18, -50); c.closePath();
      c.fillStyle = '#5a0f12'; c.fill();
      E(c, 16, -46 + open * 6, 12 * open, 5 * open); c.fillStyle = '#ffd23f'; c.fill();
      c.beginPath(); c.moveTo(-18, -50); c.quadraticCurveTo(14, -40 + open * 18, 44, -52);
    }
    c.lineWidth = 3.4; c.strokeStyle = OUT; c.stroke();
    cheeks(c, -26, -50, 46, -58, 7, 'rgba(255,200,60,0.55)');
  };

  D.lumisprite = function (c, a) {
    var t = a.t, fl = sin(t * 16), hov = sin(t * 2.6) * 5 - 22;
    c.save(); c.translate(0, hov); c.scale(1.25, 1.25);
    // aura stars
    for (var i = 0; i < 3; i++) {
      var ang = t * 1.6 + i * TAU / 3;
      sparkleStar(c, cos(ang) * 30, -46 + sin(ang) * 14, 4 + sin(t * 5 + i) * 1.5, 'rgba(255,240,150,0.9)');
    }
    // wings (translucent)
    c.save(); c.globalAlpha = 0.88;
    c.save(); c.translate(-4, -50); c.rotate(-0.6 - fl * 0.25);
    E(c, -14, -10, 18, 9, -0.5); fs(c, grad(c, 'ls_w', -14, -10, 18, [0, '#ffffff', 1, '#8fe8ff']), '#4aa8d8', 2);
    E(c, -12, 8, 12, 6, 0.6); fs(c, grad(c, 'ls_w', -14, -10, 18, [0, '#ffffff', 1, '#8fe8ff']), '#4aa8d8', 2);
    c.restore();
    c.save(); c.translate(4, -50); c.rotate(0.6 + fl * 0.25);
    E(c, 14, -10, 18, 9, 0.5); fs(c, grad(c, 'ls_w2', 14, -10, 18, [0, '#ffffff', 1, '#ffb8ea']), '#c46aa8', 2);
    E(c, 12, 8, 12, 6, -0.6); fs(c, grad(c, 'ls_w2', 14, -10, 18, [0, '#ffffff', 1, '#ffb8ea']), '#c46aa8', 2);
    c.restore();
    c.restore();
    // dress body
    blob(c, [-16, -26, -10, -50, 10, -50, 16, -26, 0, -22]);
    fs(c, bodyG(c, 'ls_b', 0, -38, 20, '#ffe6f6', '#f49ad2', '#b4568f'), OUT, 3);
    E(c, 0, -26, 14, 4); fs(c, '#7ad0ff', OUT, 2);
    // head
    C(c, 2, -62, 17); fs(c, bodyG(c, 'ls_h', 2, -62, 17, '#ffffff', '#ffeef4', '#f2c6d8'));
    // hair swoop
    blob(c, [-16, -64, -14, -78, 2, -82, 18, -76, 20, -62, 12, -72, 0, -70, -8, -72]);
    fs(c, bodyG(c, 'ls_hr', 2, -76, 18, '#fff6c2', '#ffe27a', '#e8b23a'), OUT, 2.6);
    // antenna star
    c.lineWidth = 2.2; c.strokeStyle = OUT; c.beginPath(); c.moveTo(4, -80); c.quadraticCurveTo(10, -92, 6, -100); c.stroke();
    star5(c, 6, -102, 7, 0.45, t); fs(c, '#ffd23f', OUT, 1.8);
    eyes(c, a, -2, -61, 11, -61, 5, { iris: '#3ab0ff' });
    cheeks(c, -9, -54, 15, -53, 3.6);
    mouth(c, a, 5, -53, 2.8);
    c.restore();
  };

  D.gloomcap = function (c, a) {
    var t = a.t, puff = a.atk || 0, st = a.mv * sin(a.walk);
    E(c, -12 - st * 3, -4, 9, 6); fs(c, '#d8bf94');
    E(c, 14 + st * 3, -4, 9, 6); fs(c, '#d8bf94');
    // stem body
    blob(c, [-20, -4, -24, -30, -16, -50, 16, -50, 24, -30, 20, -4]);
    fs(c, bodyG(c, 'gc_s', 0, -28, 26, '#ffffff', '#fff0d8', '#d8bf94'), OUT, 3.4);
    // cap
    c.save(); c.translate(0, -50); c.scale(1 + puff * 0.12, 1 - puff * 0.15);
    blob(c, [-44, 4, -40, -16, -22, -34, 0, -38, 22, -34, 40, -16, 44, 4, 0, 10]);
    fs(c, bodyG(c, 'gc_c', 0, -14, 44, '#f2b6f6', '#b04fc9', '#6a2a8a'), OUT, 3.6);
    c.fillStyle = '#ffffff';
    E(c, -20, -16, 7, 5, -0.3); c.fill(); E(c, 6, -26, 6, 4.5); c.fill(); E(c, 26, -10, 5, 4, 0.3); c.fill(); E(c, -34, -2, 3.5, 3); c.fill();
    c.restore();
    // drifting spores
    for (var i = 0; i < 4; i++) {
      var k = ((t * 0.4 + i / 4) % 1);
      C(c, -30 + i * 20 + sin(k * 6 + i) * 6, -60 - k * 36, 2.4 + puff * 2);
      c.fillStyle = 'rgba(200,130,240,' + (0.8 * (1 - k)) + ')'; c.fill();
    }
    eyes(c, a, -6, -30, 12, -30, 5.8, { lid: '#fff0d8' });
    cheeks(c, -15, -21, 20, -20, 4.4);
    mouth(c, a, 4, -19, 3.4, 'w');
  };

  D.rockhorn = function (c, a) {
    var t = a.t, st = a.mv * sin(a.walk * 1.1), dip = a.charging ? 0.25 : 0;
    E(c, -28 - st * 4, -7, 9, 8); fs(c, '#8a7552');
    E(c, 18 + st * 4, -7, 9, 8); fs(c, '#8a7552');
    E(c, -16 + st * 4, -6, 9, 7); fs(c, '#a08a62');
    E(c, 28 - st * 4, -6, 9, 7); fs(c, '#a08a62');
    // tail
    c.lineWidth = 3.2; c.strokeStyle = OUT; c.beginPath(); c.moveTo(-42, -38); c.quadraticCurveTo(-52, -36, -50, -26); c.stroke();
    // body
    E(c, -6, -36, 40, 27); fs(c, bodyG(c, 'rh_b', -6, -36, 40, '#f4e6c4', '#b9a37e', '#76603f'), OUT, 4);
    // armour plates
    c.lineWidth = 2.4; c.strokeStyle = 'rgba(90,70,40,0.55)';
    c.beginPath(); c.moveTo(-20, -62); c.quadraticCurveTo(-26, -36, -18, -12); c.stroke();
    c.beginPath(); c.moveTo(0, -63); c.quadraticCurveTo(-4, -38, 2, -12); c.stroke();
    // head
    c.save(); c.translate(26, -40); c.rotate(dip);
    C(c, 6, -2, 20); fs(c, bodyG(c, 'rh_h', 6, -2, 20, '#f8ecd0', '#c2ad86', '#866f4a'));
    // ears
    E(c, -6, -20, 5, 8, -0.4); fs(c, '#c2ad86', OUT, 2.4);
    // big rock horn
    blob(c, [14, -12, 22, -30, 30, -46, 32, -30, 28, -10]);
    fs(c, lin(c, 'rh_hn', 22, -46, 26, -10, [0, '#e6ecf5', 0.5, '#9aa6b8', 1, '#5f6a7e']), OUT, 3);
    poly(c, [8, -16, 10, -26, 15, -15]); fs(c, '#c8d0de', OUT, 2);
    E(c, 18, 6, 10, 7); fs(c, '#e8dabc');
    C(c, 22, 4, 1.6); fs(c, OUT, null);
    eyes(c, a, 0, -6, 13, -6, 4.6, { brow: 0.6 });
    cheeks(c, -6, 4, 18, -2, 3.6);
    mouth(c, a, 14, 10, 3.2);
    c.restore();
  };

  D.hootini = function (c, a) {
    var t = a.t, st = a.mv * sin(a.walk), cast = a.atk || 0;
    // talons
    c.lineWidth = 3; c.strokeStyle = '#d48a1a'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-10 - st * 3, -6); c.lineTo(-14 - st * 3, 0); c.moveTo(-10 - st * 3, -6); c.lineTo(-8 - st * 3, 0);
    c.moveTo(12 + st * 3, -6); c.lineTo(8 + st * 3, 0); c.moveTo(12 + st * 3, -6); c.lineTo(15 + st * 3, 0); c.stroke();
    // wings
    c.save(); c.translate(-28, -40); c.rotate(-0.2 - cast * 0.9);
    E(c, -2, 6, 10, 18, 0.2); fs(c, '#3b2d7a'); c.restore();
    c.save(); c.translate(30, -40); c.rotate(0.2 + cast * 0.9);
    E(c, 2, 6, 10, 18, -0.2); fs(c, '#3b2d7a'); c.restore();
    // body
    E(c, 0, -38, 30, 32); fs(c, bodyG(c, 'ho_b', 0, -38, 32, '#9a8af0', '#4b3b8f', '#241a55'), OUT, 3.8);
    E(c, 4, -28, 18, 18); fs(c, '#d9d2ff', null);
    c.lineWidth = 2; c.strokeStyle = 'rgba(80,60,160,0.6)';
    for (var i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-6 + i * 6, -30 + (i % 2) * 6); c.lineTo(-3 + i * 6, -26 + (i % 2) * 6); c.lineTo(0 + i * 6, -30 + (i % 2) * 6); c.stroke(); }
    // face disc
    blob(c, [-22, -48, -16, -66, 4, -60, 24, -66, 30, -48, 18, -36, 4, -40, -10, -36]);
    fs(c, '#efeaff', OUT, 2.6);
    eyes(c, a, -6, -52, 17, -52, 8, { sclera: true, iris: '#ffc21f', tall: 1.05 });
    poly(c, [3, -46, 9, -46, 6, -38]); fs(c, '#ffb21f', OUT, 2);
    // wizard hat
    var tip = sin(t * 2.2) * 4 + a.mv * sin(a.walk) * 3;
    c.beginPath();
    c.moveTo(-26, -64); c.quadraticCurveTo(-6, -76, 28, -66);
    c.quadraticCurveTo(14, -86, 10 + tip, -112);
    c.quadraticCurveTo(-4, -90, -26, -64); c.closePath();
    fs(c, lin(c, 'ho_hat', 0, -112, 0, -64, [0, '#7a5ad0', 1, '#3b2a7a']), OUT, 3.2);
    c.beginPath(); c.moveTo(-22, -68); c.quadraticCurveTo(-4, -78, 24, -70); c.lineWidth = 5; c.strokeStyle = '#ffd23f'; c.stroke();
    E(c, 2, -66, 32, 6); fs(c, '#4a37a0', OUT, 2.8);
    star5(c, 4, -86, 6, 0.45); fs(c, '#ffd23f', OUT, 1.6);
    if (cast > 0.15) { sparkleStar(c, 10 + tip, -116, 9 * cast + 3, 'rgba(255,240,150,0.95)'); }
  };

  D.azurion = function (c, a) {
    var t = a.t, fl = sin(t * 4), hov = sin(t * 1.8) * 4 - 26, cast = a.cast || 0;
    c.save(); c.translate(0, hov);
    // tail
    c.beginPath(); c.moveTo(-18, -28); c.quadraticCurveTo(-52, -20, -58, -44); c.quadraticCurveTo(-46, -30, -14, -40);
    fs(c, bodyG(c, 'az_t', -36, -32, 24, '#ffffff', '#e2ecff', '#9fb4e0'), OUT, 3);
    poly(c, [-58, -44, -66, -54, -52, -50]); fs(c, '#3e7bff', OUT, 2.2);
    // back wing
    c.save(); c.translate(-8, -60); c.rotate(-0.25 - fl * 0.3);
    blob(c, [0, 0, -10, -30, -34, -54, -60, -50, -48, -30, -58, -18, -36, -12, -40, 0, -16, 4]);
    fs(c, lin(c, 'az_w', 0, 0, -50, -50, [0, '#a9c6ff', 1, '#3e7bff']), OUT, 3);
    c.lineWidth = 2.4; c.strokeStyle = '#ffffff';
    c.beginPath(); c.moveTo(-6, -4); c.lineTo(-34, -50); c.moveTo(-10, -4); c.lineTo(-48, -28); c.stroke();
    c.restore();
    // body
    E(c, 0, -42, 28, 28); fs(c, bodyG(c, 'az_b', 0, -42, 28, '#ffffff', '#e6eeff', '#9fb4e0'), OUT, 3.8);
    // belly plates
    E(c, 8, -36, 15, 19); fs(c, '#cfe0ff', null);
    c.lineWidth = 1.8; c.strokeStyle = 'rgba(80,120,200,0.45)';
    for (var i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-4, -46 + i * 9); c.quadraticCurveTo(8, -42 + i * 9, 20, -46 + i * 9); c.stroke(); }
    // chest gem
    var gl = 0.6 + 0.4 * sin(t * 3) + cast * 0.6;
    poly(c, [8, -58, 14, -52, 8, -46, 2, -52]); fs(c, 'rgba(60,140,255,' + Math.min(1, gl) + ')', OUT, 2);
    // legs
    E(c, -12, -16, 8, 9); fs(c, '#dce6ff'); E(c, 14, -16, 8, 9); fs(c, '#dce6ff');
    // front wing (sweeps up and back, clear of the face)
    c.save(); c.translate(-4, -54); c.rotate(0.1 + fl * 0.22);
    blob(c, [0, 0, -4, -26, -16, -50, -36, -54, -28, -36, -40, -26, -22, -18, -26, -4, -10, 4]);
    fs(c, lin(c, 'az_w2', 0, 0, -30, -50, [0, '#d6e4ff', 1, '#4a86ff']), OUT, 3);
    c.lineWidth = 2.2; c.strokeStyle = '#ffffff';
    c.beginPath(); c.moveTo(-2, -2); c.lineTo(-30, -50); c.moveTo(-4, -2); c.lineTo(-34, -28); c.stroke();
    c.restore();
    // neck + head
    E(c, 12, -66, 11, 14, 0.3); fs(c, '#eef3ff', OUT, 3.4);
    c.save(); c.translate(20, -82); c.scale(1.15, 1.15); c.translate(-20, 82);
    // horns
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(10, -86); c.quadraticCurveTo(-4, -98, -12, -100); c.lineWidth = 8; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 4.6; c.strokeStyle = '#bcd4ff'; c.stroke();
    c.beginPath(); c.moveTo(22, -88); c.quadraticCurveTo(14, -104, 6, -108); c.lineWidth = 8; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 4.6; c.strokeStyle = '#bcd4ff'; c.stroke();
    blob(c, [0, -80, 6, -94, 24, -96, 40, -84, 44, -74, 30, -68, 10, -68]);
    fs(c, bodyG(c, 'az_h', 20, -82, 24, '#ffffff', '#eef3ff', '#a9bce6'), OUT, 3.4);
    // spines
    poly(c, [-2, -76, -10, -78, -4, -70]); fs(c, '#3e7bff', OUT, 1.8);
    poly(c, [-12, -60, -20, -60, -12, -54]); fs(c, '#3e7bff', OUT, 1.8);
    // glowing sapphire eyes
    eyes(c, a, 19, -84, 33, -84, 6, { iris: '#2f7bff', brow: 0.8, browC: '#3a5aa8' });
    C(c, 44, -78, 1.6); fs(c, OUT, null);
    // mouth & beam charge
    if (cast > 0) {
      c.globalCompositeOperation = 'lighter';
      C(c, 46, -74, 6 + cast * 10); c.fillStyle = 'rgba(120,190,255,' + (0.35 + cast * 0.4) + ')'; c.fill();
      C(c, 46, -74, 3 + cast * 5); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
      c.globalCompositeOperation = 'source-over';
    } else mouth(c, a, 36, -72, 3.6);
    c.restore();
    c.restore();
  };

  D.buzzlings = function (c, a) {
    var t = a.t, fl = sin(t * 30), hov = sin(t * 4) * 3 - 22;
    c.save(); c.translate(0, hov);
    // wings
    c.save(); c.globalAlpha = 0.75;
    c.save(); c.translate(-4, -50); c.rotate(-0.5 - fl * 0.4); E(c, -8, -10, 9, 15, -0.3); fs(c, 'rgba(220,245,255,0.9)', '#7ab8d8', 2); c.restore();
    c.save(); c.translate(6, -50); c.rotate(0.4 + fl * 0.4); E(c, 8, -10, 9, 15, 0.3); fs(c, 'rgba(220,245,255,0.9)', '#7ab8d8', 2); c.restore();
    c.restore();
    // stinger
    poly(c, [-20, -30, -32, -26, -20, -24]); fs(c, '#2b1f33', OUT, 2);
    // fuzzy body
    C(c, 0, -32, 21); fs(c, bodyG(c, 'bz_b', 0, -32, 21, '#fff2a0', '#ffc61f', '#d99500'), OUT, 3.2);
    c.save(); C(c, 0, -32, 19.5); c.clip();
    c.fillStyle = '#2b2238';
    c.fillRect(-26, -26, 52, 6); c.fillRect(-26, -14, 52, 6);
    c.restore();
    // antennae with bolt tips
    c.lineWidth = 2.2; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(0, -50); c.quadraticCurveTo(-4, -62, -10, -64); c.moveTo(8, -50); c.quadraticCurveTo(12, -62, 18, -64); c.stroke();
    zig(c, [-10, -70, -14, -64, -10, -64, -12, -58, -6, -66, -10, -66], '#5ce1ff', OUT, 1.4);
    zig(c, [18, -70, 14, -64, 18, -64, 16, -58, 22, -66, 18, -66], '#5ce1ff', OUT, 1.4);
    eyes(c, a, 0, -38, 13, -38, 6.4);
    cheeks(c, -8, -30, 18, -29, 3.6);
    mouth(c, a, 7, -29, 3);
    c.restore();
  };

  D.shadecat = function (c, a) {
    var t = a.t, sw = sin(t * 3) * 0.2, st = a.mv * sin(a.walk * 1.2);
    // tail with crescent tip
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(-18, -18); c.bezierCurveTo(-44, -14, -40 + sw * 10, -52, -26 + sw * 14, -60);
    c.lineWidth = 11; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 7; c.strokeStyle = '#3a2f6a'; c.stroke();
    c.save(); c.translate(-26 + sw * 14, -64); c.rotate(sw);
    c.beginPath(); c.arc(0, 0, 9, 0.6, PI * 1.9); c.arc(4, -2, 7, PI * 1.9, 0.6, true); c.closePath();
    fs(c, '#ffd76a', OUT, 2); c.restore();
    E(c, -12 - st * 4, -5, 8, 6); fs(c, '#2a2150');
    E(c, 14 + st * 4, -5, 8, 6); fs(c, '#2a2150');
    // body
    E(c, 0, -28, 25, 22); fs(c, bodyG(c, 'sc_b', 0, -28, 25, '#8a7ad8', '#3a2f6a', '#1a1438'), OUT, 3.6);
    E(c, 8, -22, 12, 13); fs(c, '#6a5ab8', null);
    E(c, 4 - st * 3, -5, 7, 5); fs(c, '#4a3d8a'); E(c, 22 + st * 3, -5, 7, 5); fs(c, '#4a3d8a');
    // ears
    zig(c, [-14, -66, -20, -96, 4, -76], '#3a2f6a');
    zig(c, [-12, -72, -16, -88, -2, -77], '#ff5fb0', null);
    zig(c, [14, -76, 30, -100, 34, -66], '#3a2f6a');
    zig(c, [18, -76, 28, -92, 30, -70], '#ff5fb0', null);
    // head
    C(c, 9, -56, 24); fs(c, bodyG(c, 'sc_h', 9, -56, 24, '#9a8ae8', '#40347a', '#1f1844'));
    // crescent moon mark
    c.beginPath(); c.arc(8, -72, 5.5, 0.3, PI * 1.7); c.arc(10, -73, 4.4, PI * 1.7, 0.3, true); c.closePath(); fs(c, '#ffd76a', null);
    eyes(c, a, 0, -56, 21, -56, 7, { iris: '#ff4fd0', slit: true });
    E(c, 28, -48, 2.8, 2); fs(c, '#ff8fc8', null);
    // whiskers
    c.lineWidth = 1.4; c.strokeStyle = 'rgba(220,210,255,0.8)';
    c.beginPath(); c.moveTo(30, -46); c.lineTo(42, -50); c.moveTo(30, -44); c.lineTo(42, -42); c.stroke();
    mouth(c, a, 24, -43, 3.4, 'w');
  };


  // ---- evolved forms: extra features drawn behind (B) and in front of (F) the base body --------
  var EB = {}, EF = {};
  function crown(c, x, y, w, gem) {
    zig(c, [x - w, y, x - w * 1.1, y - w * 1.1, x - w * 0.45, y - w * 0.55, x, y - w * 1.4, x + w * 0.45, y - w * 0.55, x + w * 1.1, y - w * 1.1, x + w, y], '#ffd23f', OUT, Math.max(1.5, w * 0.22));
    C(c, x, y - w * 0.45, w * 0.22); fs(c, gem || '#ff4d5e', null);
  }
  function crystal(c, x, y, h, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    poly(c, [-h * 0.22, 0, -h * 0.26, -h * 0.65, 0, -h, h * 0.26, -h * 0.65, h * 0.22, 0]);
    fs(c, lin(c, 'cry' + col, 0, -h, 0, 0, [0, '#ffffff', 0.35, col, 1, shade(col, -0.35)]), OUT, 2.4);
    poly(c, [-h * 0.06, -h * 0.15, -h * 0.1, -h * 0.6, 0, -h * 0.85, h * 0.02, -h * 0.55]); fs(c, 'rgba(255,255,255,0.6)', null);
    c.restore();
  }
  function brows(c, x1, y1, x2, y2, s) {
    c.lineCap = 'round'; c.lineWidth = s * 0.45; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(x1 - s, y1 - s * 0.5); c.lineTo(x1 + s * 0.8, y1 + s * 0.15);
    c.moveTo(x2 + s, y2 - s * 0.5); c.lineTo(x2 - s * 0.8, y2 + s * 0.15); c.stroke();
  }
  EB.emberpup = function (c, a) {
    var t = a.t;
    for (var i = 0; i < 11; i++) {
      var ang = -PI / 2 + i / 11 * TAU, fl = 1 + sin(t * 12 + i * 2) * 0.08;
      c.save(); c.translate(8 + cos(ang) * 22, -62 + sin(ang) * 22); c.rotate(ang + PI / 2);
      flame(c, 0, 0, 9, 22 * fl, t + i, ['#ff3d1f', '#ff9a1f', '#ffe36a']);
      c.restore();
    }
  };
  EF.emberpup = function (c, a) { if (!a.faint && !a.blink) brows(c, 0, -78, 25, -77, 5.5); };
  EB.puddlefin = function (c, a) {
    var t = a.t;
    for (var i = -1; i <= 1; i++) {
      var bob = sin(t * 3 + i) * 2;
      c.beginPath(); c.moveTo(2 + i * 18, -104 + Math.abs(i) * 10 + bob);
      c.quadraticCurveTo(12 + i * 18, -88 + Math.abs(i) * 10 + bob, 2 + i * 18, -80 + Math.abs(i) * 10 + bob);
      c.quadraticCurveTo(-8 + i * 18, -88 + Math.abs(i) * 10 + bob, 2 + i * 18, -104 + Math.abs(i) * 10 + bob);
      fs(c, '#6fc4ff', OUT, 2.6);
    }
  };
  EF.puddlefin = function (c, a) {
    c.beginPath(); c.moveTo(-18, -70); c.quadraticCurveTo(2, -80, 22, -70); c.lineWidth = 5; c.strokeStyle = '#ffd23f'; c.stroke();
    c.lineWidth = 1.6; c.strokeStyle = OUT; c.stroke();
    poly(c, [2, -82, 7, -76, 2, -70, -3, -76]); fs(c, '#3aa2ff', OUT, 1.6);
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.moveTo(-8, -20); c.quadraticCurveTo(-2, -24, 4, -20); c.quadraticCurveTo(10, -16, 16, -20); c.stroke();
  };
  EB.sproutle = function (c, a) {
    for (var i = 0; i < 5; i++) {
      var ang = PI * (0.1 + i * 0.2);
      E(c, cos(ang) * 30, -12 + sin(ang) * 6, 14, 6, ang * 0.3); fs(c, i % 2 ? '#58c24a' : '#7ad65a', OUT, 2.2);
    }
  };
  EF.sproutle = function (c, a) {
    var t = a.t, sw = sin(t * 2.4) * 0.1;
    c.save(); c.translate(0, -86); c.rotate(sw);
    for (var i = 0; i < 7; i++) {
      var ang = i * TAU / 7 + t * 0.3;
      E(c, cos(ang) * 11, sin(ang) * 8, 10, 6.5, ang); fs(c, i % 2 ? '#ff8fc8' : '#ffb3dc', OUT, 2);
    }
    C(c, 0, 0, 7); fs(c, grad(c, 'bt_c', -2, -2, 8, [0, '#fff6a8', 1, '#ffb21f']), OUT, 2);
    c.restore();
  };
  EB.zappip = function (c, a) {
    var t = a.t, wag = sin(t * 8 + 1) * 0.14;
    c.save(); c.translate(-14, -18); c.rotate(-0.55 + wag); c.scale(0.8, 0.8);
    zig(c, [0, 4, -16, -16, -6, -22, -30, -44, -18, -48, -34, -78, -4, -54, -14, -50, 6, -26, -2, -22, 12, -4],
      lin(c, 'zp_t2', 0, 0, -30, -78, [0, '#1a7ad0', 0.4, '#5ce1ff', 1, '#e0fbff']));
    c.restore();
  };
  EF.zappip = function (c, a) {
    zig(c, [-8, -80, -4, -94, 2, -82, 8, -98, 12, -82, 18, -92, 18, -78], '#ffe14a', OUT, 2.4);
    if (!a.faint && !a.blink) brows(c, -2, -69, 19, -69, 5);
  };
  EF.fuzzlets = function (c, a) { crown(c, 2, -60, 10); };
  EF.buzzlings = function (c, a) {
    var hov = sin(a.t * 4) * 3 - 22;
    c.save(); c.translate(0, hov); crown(c, 6, -54, 7, '#3d8bff');
    poly(c, [-20, -32, -36, -27, -20, -22]); fs(c, '#ffd23f', OUT, 2);
    c.restore();
  };
  EF.shellbert = function (c, a) {
    var sp = [[-32, -60, -0.7], [-16, -74, -0.25], [4, -76, 0.2], [20, -66, 0.6]];
    for (var i = 0; i < sp.length; i++) {
      c.save(); c.translate(sp[i][0], sp[i][1]); c.rotate(sp[i][2]);
      poly(c, [-6, 2, 0, -14, 6, 2]); fs(c, lin(c, 'sb_sp', 0, -14, 0, 2, [0, '#fff6c2', 1, '#e8a800']), OUT, 2.2);
      c.restore();
    }
  };
  EB.gloomcap = function (c, a) {
    E(c, 0, -94, 22, 14); fs(c, bodyG(c, 'gc_c2', 0, -98, 22, '#f2b6f6', '#b04fc9', '#6a2a8a'), OUT, 3);
    C(c, 4, -98, 3.5); fs(c, '#fff', null);
  };
  EF.gloomcap = function (c, a) {
    var t = a.t, gl = 0.45 + 0.35 * sin(t * 3);
    c.save(); c.globalCompositeOperation = 'lighter';
    var spots = [[-20, -66, 9], [6, -76, 8], [26, -60, 7], [-34, -52, 5]];
    for (var i = 0; i < spots.length; i++) { C(c, spots[i][0], spots[i][1], spots[i][2]); c.fillStyle = 'rgba(160,255,240,' + gl + ')'; c.fill(); }
    c.restore();
  };
  EB.lumisprite = function (c, a) {
    var t = a.t, fl = sin(t * 16 + 1), hov = sin(t * 2.6) * 5 - 22;
    c.save(); c.translate(0, hov); c.scale(1.25, 1.25); c.globalAlpha *= 0.85;
    c.save(); c.translate(-4, -44); c.rotate(-1.1 - fl * 0.2); E(c, -16, -4, 20, 8, -0.3); fs(c, 'rgba(255,240,170,0.85)', '#e8b23a', 2); c.restore();
    c.save(); c.translate(4, -44); c.rotate(1.1 + fl * 0.2); E(c, 16, -4, 20, 8, 0.3); fs(c, 'rgba(255,240,170,0.85)', '#e8b23a', 2); c.restore();
    c.restore();
  };
  EF.lumisprite = function (c, a) {
    var t = a.t, hov = sin(t * 2.6) * 5 - 22;
    c.save(); c.translate(0, hov); c.scale(1.25, 1.25);
    c.save(); c.globalCompositeOperation = 'lighter';
    E(c, 2, -86, 13, 4); c.lineWidth = 3.5; c.strokeStyle = 'rgba(255,230,120,' + (0.7 + 0.3 * sin(t * 4)) + ')'; c.stroke();
    c.restore();
    c.restore();
  };
  EB.hexmoth = function (c, a) {
    var t = a.t, fl = sin(t * 9 + 0.6), hov = sin(t * 2.2) * 4 - 22;
    c.save(); c.translate(0, hov);
    c.save(); c.translate(-2, -50); c.scale(1, 1 + fl * 0.12); c.rotate(-0.75);
    blob(c, [0, 0, -12, -34, -34, -60, -58, -52, -56, -26, -20, -2]);
    fs(c, grad(c, 'hm_w4', -34, -34, 36, [0, '#c8fff6', 0.5, '#38d3c8', 1, '#1f6f8a']));
    C(c, -38, -36, 7); fs(c, '#ffd23f', OUT, 2); star5(c, -38, -36, 5, 0.45, t); fs(c, '#e04fa0', null);
    c.restore();
    c.restore();
  };
  EF.hexmoth = function (c, a) {
    var hov = sin(a.t * 2.2) * 4 - 22;
    c.save(); c.translate(0, hov); crown(c, 7, -88, 7, '#38d3c8'); c.restore();
  };
  EB.voltwing = function (c, a) {
    var t = a.t, hov = sin(t * 3) * 4 - 22;
    c.save(); c.translate(-6 + sin(t) * 3, hov - 82);
    blob(c, [-22, 6, -26, -6, -14, -14, -2, -18, 12, -14, 22, -4, 18, 6]); fs(c, '#7f8fb0', OUT, 2.4);
    if ((t * 3 % 2) < 0.4) zig(c, [0, 6, -6, 18, 0, 18, -4, 30, 6, 14, 0, 14, 4, 6], '#ffe14a', null);
    c.restore();
  };
  EF.voltwing = function (c, a) {
    var hov = sin(a.t * 3) * 4 - 22;
    c.save(); c.translate(0, hov);
    zig(c, [-10, -76, -26, -94, -14, -88, -16, -106, -4, -90, 4, -112, 10, -88, 20, -98, 14, -74], '#ffd23f', OUT, 2.4);
    c.restore();
  };
  EB.hootini = function (c, a) {
    blob(c, [-30, -62, -40, -30, -44, -4, 0, -10, 44, -4, 40, -30, 30, -62, 0, -58]);
    fs(c, lin(c, 'ho_cape', 0, -60, 0, -4, [0, '#2a1f5a', 1, '#5a3fb0']), OUT, 3);
    c.beginPath(); c.moveTo(-44, -4); c.quadraticCurveTo(0, -14, 44, -4); c.lineWidth = 3; c.strokeStyle = '#ffd23f'; c.stroke();
  };
  EF.hootini = function (c, a) {
    var tip = sin(a.t * 2.2) * 4;
    c.beginPath(); c.arc(6 + tip * 0.5, -98, 7, 0.4, PI * 1.6); c.arc(9 + tip * 0.5, -99, 5.5, PI * 1.6, 0.4, true); c.closePath();
    fs(c, '#ffe36a', OUT, 1.6);
  };
  EB.rockhorn = function (c, a) {
    var pl = [[-34, -56, -0.5], [-16, -62, -0.15], [2, -60, 0.2]];
    for (var i = 0; i < pl.length; i++) {
      c.save(); c.translate(pl[i][0], pl[i][1]); c.rotate(pl[i][2]);
      blob(c, [-10, 4, -8, -8, 0, -14, 8, -8, 10, 4]); fs(c, lin(c, 'rh_pl', 0, -14, 0, 4, [0, '#d8dee8', 1, '#7a8698']), OUT, 2.4);
      c.restore();
    }
  };
  EF.rockhorn = function (c, a) {
    var dip = a.charging ? 0.25 : 0;
    c.save(); c.translate(26, -40); c.rotate(dip);
    blob(c, [4, -14, 4, -30, 10, -40, 14, -28, 12, -12]);
    fs(c, lin(c, 'rh_hn2', 8, -40, 10, -12, [0, '#e6ecf5', 1, '#5f6a7e']), OUT, 2.6);
    if (!a.faint && !a.blink) brows(c, 0, -14, 13, -14, 4);
    c.restore();
  };
  EB.shadecat = function (c, a) {
    var t = a.t, sw = sin(t * 3 + 1.4) * 0.2;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(-16, -14); c.bezierCurveTo(-50, -6, -54 + sw * 10, -36, -44 + sw * 14, -48);
    c.lineWidth = 10; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#2a2150'; c.stroke();
    c.save(); c.translate(-44 + sw * 14, -52); c.rotate(sw - 0.6);
    c.beginPath(); c.arc(0, 0, 8, 0.6, PI * 1.9); c.arc(4, -2, 6, PI * 1.9, 0.6, true); c.closePath(); fs(c, '#ff8fd8', OUT, 2);
    c.restore();
  };
  EF.shadecat = function (c, a) {
    star5(c, 18, -76, 4, 0.45, a.t); fs(c, '#ffd76a', null);
    c.save(); c.globalCompositeOperation = 'lighter';
    C(c, 0, -56, 9); c.fillStyle = 'rgba(255,79,208,0.25)'; c.fill(); C(c, 21, -56, 8); c.fill();
    c.restore();
  };
  EF.pebblump = function (c, a) {
    crystal(c, -26, -66, 26, -0.55, '#a45cff');
    crystal(c, -6, -80, 32, -0.1, '#38d3c8');
    crystal(c, 16, -78, 22, 0.4, '#ff7ac8');
  };
  EF.brambull = function (c, a) {
    var ro = [[-25, -62], [-10, -67], [5, -66]];
    for (var i = 0; i < ro.length; i++) {
      C(c, ro[i][0], ro[i][1], 5.5); fs(c, '#ff5f8f', OUT, 1.8);
      c.lineWidth = 1.3; c.strokeStyle = '#a0204a'; c.beginPath(); c.arc(ro[i][0], ro[i][1], 2.6, 0, PI * 1.5); c.stroke();
    }
    var ch = a.atk || 0;
    c.save(); c.translate(ch * 6, ch * 3); c.lineCap = 'round';
    c.beginPath(); c.moveTo(18, -88); c.quadraticCurveTo(26, -100, 12, -102); c.lineWidth = 8; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 4.6; c.strokeStyle = '#fff2d0'; c.stroke();
    c.beginPath(); c.moveTo(42, -88); c.quadraticCurveTo(36, -102, 50, -102); c.lineWidth = 8; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 4.6; c.strokeStyle = '#fff2d0'; c.stroke();
    if (!a.faint && !a.blink) brows(c, 20, -62, 37, -62, 4.5);
    c.restore();
  };
  EF.magmaw = function (c, a) {
    var t = a.t;
    poly(c, [-30, -76, -22, -100, -6, -100, 2, -76]);
    fs(c, lin(c, 'mm_v', -14, -100, -14, -76, [0, '#6a3a2a', 1, '#3a1a14']), OUT, 3);
    c.beginPath(); c.moveTo(-22, -99); c.quadraticCurveTo(-26, -88, -20, -82); c.lineTo(-17, -99); c.closePath(); fs(c, '#ff8a1f', null);
    flame(c, -14, -98, 9, 26, t * 1.3, ['#ff3d1f', '#ffa21f', '#fff3a0']);
    for (var i = 0; i < 3; i++) {
      var k = ((t * 0.9 + i / 3) % 1);
      C(c, -14 + sin(i * 2.4) * k * 18, -104 - k * 28 + k * k * 30, 2.4 * (1 - k) + 1); c.fillStyle = 'rgba(255,' + (140 + i * 30) + ',40,' + (1 - k) + ')'; c.fill();
    }
  };
  EB.azurion = function (c, a) {
    var t = a.t, hov = sin(t * 1.8) * 4 - 26;
    c.save(); c.translate(0, hov);
    c.globalCompositeOperation = 'lighter';
    var g = grad(c, 'az_aura', 10, -60, 70, [0, 'rgba(120,190,255,0.35)', 1, 'rgba(120,190,255,0)']);
    C(c, 10, -60, 70 + sin(t * 3) * 4); c.fillStyle = g; c.fill();
    c.restore();
  };
  EF.azurion = function (c, a) {
    var hov = sin(a.t * 1.8) * 4 - 26;
    c.save(); c.translate(0, hov);
    crystal(c, -14, -56, 16, -0.8, '#3e7bff'); crystal(c, -6, -70, 14, -0.5, '#3e7bff');
    c.save(); c.translate(20, -82); c.scale(1.15, 1.15); c.translate(-20, 82);
    crystal(c, 14, -96, 14, -0.15, '#7fb2ff'); crystal(c, 24, -98, 11, 0.2, '#7fb2ff');
    c.restore();
    c.restore();
  };
  Art.EB = EB; Art.EF = EF;

  // ---- Gen-1 style 5x7 pixel font -----------------------------------------------------------
  var GLYPHS = {
    A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110',
    D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000',
    G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110',
    J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111',
    M: '10001110111010110101100011000110001', N: '10001100011100110101100111000110001', O: '01110100011000110001100011000101110',
    P: '11110100011000111110100001000010000', Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001',
    S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110',
    V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001',
    Y: '10001100011000101010001000010000100', Z: '11111000010001000100010001000011111',
    0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111',
    3: '11111000100010000010000011000101110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110',
    6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110',
    9: '01110100011000101111000010001001100',
    '!': '00100001000010000100001000000000100', '?': '01110100010000100010001000000000100', '.': '00000000000000000000000000110001100',
    ',': '00000000000000000000011000010001000', "'": '00100001000100000000000000000000000', '-': '00000000000000011111000000000000000',
    ':': '00000011000110000000011000110000000', '/': '00001000010001000100010001000010000', '+': '00000001000010011111001000010000000',
    '&': '01100100101010001000101011001001101', '(': '00010001000100001000010000010000010', ')': '01000001000001000010000100010001000',
    '*': '00100001001111101110010101000100000', '"': '01010010100000000000000000000000000', '=': '00000000001111100000111110000000000',
    '%': '11001110100001000100010000101110011', '#': '01010111110101001010111110101000000', '>': '01000001000001000001000100010001000',
    '<': '00010001000100010000010000010000010', ' ': '00000000000000000000000000000000000'
  };
  var pixCache = {};
  // draws text with a 5x7 font; px = size of one font pixel. Returns width.
  Art.pixelText = function (c, str, x, y, px, color, align, outline, led) {
    str = String(str).toUpperCase().replace(/[×]/g, 'X').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[é]/g, 'E');
    var key = str + '|' + px + '|' + color + '|' + (outline || '') + '|' + (led ? 1 : 0);
    var cv = pixCache[key];
    var o = outline ? Math.max(1, Math.round(px * 0.6)) : 0;
    if (!cv) {
      var n = str.length, w = n * 6 * px - px + o * 2, h = 7 * px + o * 2;
      cv = document.createElement('canvas');
      var sc = Math.min(2, (root.devicePixelRatio || 1));
      cv.width = Math.max(1, Math.ceil(w * sc)); cv.height = Math.ceil(h * sc); cv._w = w; cv._h = h;
      var g = cv.getContext('2d'); g.scale(sc, sc);
      function paint(col, dx, dy) {
        g.fillStyle = col;
        for (var i = 0; i < n; i++) {
          var gl = GLYPHS[str[i]] || GLYPHS['?'];
          for (var r = 0; r < 7; r++) for (var q = 0; q < 5; q++) {
            if (gl.charCodeAt(r * 5 + q) !== 49) continue;
            var gx = o + dx + (i * 6 + q) * px, gy = o + dy + r * px;
            if (led) { g.beginPath(); g.arc(gx + px / 2, gy + px / 2, px * 0.42, 0, TAU); g.fill(); }
            else g.fillRect(gx, gy, px + 0.02, px + 0.02);
          }
        }
      }
      if (outline) { for (var dx = -o; dx <= o; dx += o) for (var dy = -o; dy <= o; dy += o) if (dx || dy) paint(outline, dx, dy); }
      paint(color, 0, 0);
      pixCache[key] = cv;
      var keys = Object.keys(pixCache);
      if (keys.length > 400) delete pixCache[keys[0]];
    }
    var ox = align === 'center' ? cv._w / 2 : align === 'right' ? cv._w : 0;
    c.drawImage(cv, Math.round(x - ox), Math.round(y - cv._h / 2), cv._w, cv._h);
    return cv._w;
  };
  Art.pixelWidth = function (str, px) { return String(str).length * 6 * px - px; };

  Art.D = D;

  // Draw a creature with its shared body motion (bob, squash, lunge, hurt shake, faint).
  //   a: { t, mv, walk, atk, hurt, blink, faint, cheer, cast, charging }
  Art.creature = function (c, id, a, x, y, s, face) {
    var fn = D[id];
    if (!fn) return;
    c.save();
    c.translate(x, y);
    c.scale(s * (face || 1), s);
    var t = a.t || 0, bob = 0, sx = 1, sy = 1, rot = 0, lx = 0;
    if (a.faint > 0) {
      var f = a.faint;
      rot = -Math.min(1, f * 1.6) * 1.35;
      sy = 1 - f * 0.25; lx = -f * 10;
      c.globalAlpha *= Math.max(0, 1 - Math.max(0, f - 0.45) / 0.55);
    } else {
      var br = sin(t * 3.1);
      sy = 1 + br * 0.03; sx = 1 - br * 0.02;
      if (a.mv > 0.05) {
        var hop = Math.abs(sin(a.walk));
        bob = -hop * 9 * a.mv;
        var land = 1 - hop;
        sy *= 1 - land * 0.07 * a.mv; sx *= 1 + land * 0.06 * a.mv;
        rot = sin(a.walk) * 0.05 * a.mv;
      }
      if (a.cheer) { var j = Math.abs(sin(t * 7)); bob -= j * 18; sy *= 1 + j * 0.06; }
      if (a.atk > 0) { lx += a.atk * 9; sx *= 1 + a.atk * 0.08; sy *= 1 - a.atk * 0.05; }
      if (a.hurt > 0) { lx += sin(t * 70) * 3.5 * a.hurt; sy *= 1 - a.hurt * 0.08; sx *= 1 + a.hurt * 0.06; }
    }
    c.translate(lx, bob);
    c.rotate(rot);
    c.scale(sx, sy);
    c.lineJoin = 'round'; c.lineCap = 'round';
    if (a.evo && EB[id]) EB[id](c, a);
    fn(c, a);
    if (a.evo && EF[id]) EF[id](c, a);
    c.restore();
  };

  // A still, smiling portrait pose (cards, menus)
  Art.portrait = function (c, id, x, y, s, t, evo) {
    Art.creature(c, id, { t: t || 0, mv: 0, walk: 0, atk: 0, hurt: 0, blink: false, faint: 0, evo: evo ? 1 : 0 }, x, y, s * (evo ? 1.12 : 1), 1);
  };

  // vertical extent of each design (for framing portraits), flying ones hover higher
  Art.height = function (id) {
    var sp = CA.SPECIES[id];
    return sp.fly ? 128 : id === 'pebblump' || id === 'magmaw' ? 100 : 112;
  };

  // ---- capsule ------------------------------------------------------------------
  Art.capsule = function (c, x, y, r, team, spin) {
    c.save(); c.translate(x, y); c.rotate(spin || 0);
    var top = team === 0 ? '#3d8bff' : '#ff4d5e', topL = team === 0 ? '#a8ccff' : '#ffb0b8';
    c.beginPath(); c.arc(0, 0, r, PI, TAU); c.closePath();
    c.fillStyle = grad(c, 'cap' + team, -r * 0.4, -r * 0.5, r * 1.4, [0, topL, 0.5, top, 1, top]);
    c.fill();
    c.beginPath(); c.arc(0, 0, r, 0, PI); c.closePath(); c.fillStyle = '#f7f4ee'; c.fill();
    c.fillStyle = '#2b1f33'; c.fillRect(-r, -r * 0.11, r * 2, r * 0.22);
    C(c, 0, 0, r * 0.34); c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = r * 0.12; c.strokeStyle = '#2b1f33'; c.stroke();
    C(c, 0, 0, r * 0.16); c.fillStyle = '#fff'; c.fill();
    C(c, 0, 0, r); c.lineWidth = r * 0.14; c.strokeStyle = '#2b1f33'; c.stroke();
    E(c, -r * 0.4, -r * 0.55, r * 0.22, r * 0.12, -0.6); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();
    c.restore();
  };

  // ---- type icons -----------------------------------------------------------------
  Art.typeIcon = function (c, type, x, y, r) {
    var T = CA.TYPES[type];
    c.save(); c.translate(x, y);
    C(c, 0, 0, r); c.fillStyle = T.color; c.fill();
    c.lineWidth = Math.max(1, r * 0.16); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.stroke();
    c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.lineCap = 'round';
    var s = r / 10;
    c.scale(s, s);
    switch (type) {
      case 'fire':
        c.beginPath(); c.moveTo(0, -7); c.bezierCurveTo(6, -2, 6, 6, 0, 6.5); c.bezierCurveTo(-6, 6, -6, 0, -2, -3);
        c.quadraticCurveTo(-1, 0, 0, 1); c.quadraticCurveTo(2, -3, 0, -7); c.fill(); break;
      case 'leaf':
        c.beginPath(); c.moveTo(-6, 6); c.quadraticCurveTo(-6, -6, 6, -6); c.quadraticCurveTo(6, 6, -6, 6); c.fill();
        c.strokeStyle = T.color; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-5, 5); c.lineTo(3, -3); c.stroke(); break;
      case 'stone':
        poly(c, [-6, 3, -3, -5, 4, -6, 7, 1, 2, 6, -4, 6]); c.fill(); break;
      case 'spark':
        poly(c, [2, -8, -5, 1, 0, 1, -2, 8, 5, -1, 0, -1]); c.fill(); break;
      case 'water':
        c.beginPath(); c.moveTo(0, -7); c.quadraticCurveTo(6, 1, 0, 6.5); c.quadraticCurveTo(-6, 1, 0, -7); c.fill(); break;
      case 'mystic':
        star5(c, 0, 0.5, 7, 0.45); c.fill(); break;
      case 'normal':
        C(c, 0, 0, 4.5); c.fill(); break;
      case 'dragon':
        c.beginPath(); c.moveTo(-6, 5); c.quadraticCurveTo(-4, -6, 6, -6); c.quadraticCurveTo(1, -3, 2, 1); c.quadraticCurveTo(-1, 0, -6, 5); c.fill();
        break;
    }
    c.restore();
  };

  // ---- trainers -------------------------------------------------------------------
  // chibi trainer, 'front' (facing camera) or back view. Feet at (0,0), ~100 units tall.
  Art.trainer = function (c, look, x, y, s, back, a) {
    a = a || {};
    var t = a.t || 0, throwK = a.throwK || 0, cheer = a.cheer || 0;
    c.save(); c.translate(x, y); c.scale(s, s);
    var jump = cheer ? -Math.abs(sin(t * 8)) * 10 : 0;
    c.translate(0, jump + sin(t * 2.5) * 1.2);
    c.lineJoin = 'round'; c.lineCap = 'round';
    // legs
    E(c, -9, -10, 7, 12); fs(c, look.pants); E(c, 9, -10, 7, 12); fs(c, look.pants);
    E(c, -9, -1, 8, 4); fs(c, '#3a2a2a'); E(c, 9, -1, 8, 4); fs(c, '#3a2a2a');
    // throwing arm (behind when back view)
    var armA = -0.4 - throwK * 2.6 - cheer * 1.8 * Math.abs(sin(t * 8));
    function arm(side, ang) {
      c.save(); c.translate(side * 17, -40); c.rotate(side * ang);
      E(c, side * 2, 10, 6, 13); fs(c, look.shirt);
      C(c, side * 3, 22, 5); fs(c, look.skin);
      c.restore();
    }
    // torso
    blob(c, [-18, -18, -20, -40, -12, -50, 12, -50, 20, -40, 18, -18]);
    fs(c, look.shirt);
    if (!back) { E(c, 0, -36, 6, 8); fs(c, 'rgba(255,255,255,0.35)', null); }
    else {
      blob(c, [-12, -22, -14, -42, 14, -42, 12, -22]); fs(c, 'rgba(0,0,0,0.12)', null);
      // backpack
      CA.rr && CA.rr(c, -13, -48, 26, 26, 6);
      fs(c, look.pack || '#ffd23f');
      CA.rr && CA.rr(c, -8, -32, 16, 8, 3); fs(c, 'rgba(0,0,0,0.12)', null);
    }
    arm(-1, back ? 0.35 : 0.35);
    arm(1, back ? -armA : 0.35 + throwK * 1.2);
    // head
    var hy = -66;
    if (look.style === 'long' || look.style === 'twin') {
      blob(c, [-22, -64, -24, -40, -14, -44, 14, -44, 24, -40, 22, -64]); fs(c, look.hair);
    }
    C(c, 0, hy, 21); fs(c, back ? look.hair : look.skin);
    if (!back) {
      // hair fringe
      if (look.style === 'spiky') zig(c, [-21, -70, -18, -88, -8, -80, 0, -92, 8, -80, 18, -88, 21, -70, 10, -78, 0, -72, -10, -78], look.hair);
      else if (look.style === 'bun') { C(c, 0, -90, 9); fs(c, look.hair); blob(c, [-21, -66, -16, -86, 16, -86, 21, -66, 8, -76, -8, -76]); fs(c, look.hair); }
      else blob(c, [-22, -62, -18, -86, 18, -86, 22, -62, 10, -76, -10, -76]), fs(c, look.hair);
      if (look.style === 'twin') { C(c, -24, -78, 8); fs(c, look.hair); C(c, 24, -78, 8); fs(c, look.hair); }
      // face
      var bl = (t % 3.7) < 0.12;
      if (bl) {
        c.lineWidth = 2.6; c.strokeStyle = OUT;
        c.beginPath(); c.moveTo(-10, -64); c.lineTo(-4, -64); c.moveTo(4, -64); c.lineTo(10, -64); c.stroke();
      } else {
        E(c, -7, -64, 3, 4.2); fs(c, OUT, null); E(c, 7, -64, 3, 4.2); fs(c, OUT, null);
        C(c, -8, -66, 1.1); fs(c, '#fff', null); C(c, 6, -66, 1.1); fs(c, '#fff', null);
      }
      if (look.glasses) {
        c.lineWidth = 2; c.strokeStyle = OUT;
        C(c, -7, -64, 6); c.stroke(); C(c, 7, -64, 6); c.stroke();
        c.beginPath(); c.moveTo(-1, -64); c.lineTo(1, -64); c.stroke();
      }
      c.fillStyle = 'rgba(255,120,140,0.5)'; E(c, -12, -57, 4, 2.5); c.fill(); E(c, 12, -57, 4, 2.5); c.fill();
      c.lineWidth = 2.2; c.strokeStyle = OUT;
      c.beginPath();
      if (cheer) { c.moveTo(-5, -55); c.quadraticCurveTo(0, -48, 5, -55); c.closePath(); fs(c, '#7a1f35', OUT, 2); }
      else { c.moveTo(-4, -55); c.quadraticCurveTo(0, -52, 4, -55); c.stroke(); }
    } else {
      if (look.style === 'spiky') zig(c, [-21, -60, -24, -76, -12, -72, -14, -90, 0, -80, 14, -90, 12, -72, 24, -76, 21, -60], look.hair);
      if (look.style === 'bun') { C(c, 0, -90, 9); fs(c, look.hair); }
      if (look.style === 'twin') { C(c, -24, -78, 8); fs(c, look.hair); C(c, 24, -78, 8); fs(c, look.hair); }
    }
    // headwear
    if (look.cap && look.capStyle === 'witch') {
      E(c, 0, -80, 30, 6); fs(c, look.cap);
      poly(c, [-16, -82, 4, -122, 16, -82]); fs(c, look.cap);
      star5(c, 2, -94, 5, 0.45); fs(c, '#ffd23f', OUT, 1.4);
    } else if (look.cap && look.capStyle === 'crown') {
      zig(c, [-16, -80, -18, -98, -9, -88, 0, -102, 9, -88, 18, -98, 16, -80], '#ffd23f');
      C(c, 0, -94, 2.6); fs(c, '#3e7bff', null);
    } else if (look.cap) {
      c.beginPath(); c.arc(0, -72, 22, PI, TAU); c.closePath(); fs(c, look.cap);
      if (!back) { E(c, 0, -73, 24, 6); fs(c, look.cap); }
      else { E(c, 0, -72, 12, 4); fs(c, 'rgba(255,255,255,0.3)', null); }
      C(c, 0, -86, 5); fs(c, '#fff', OUT, 2);
    }
    c.restore();
  };

  // ---- badges -----------------------------------------------------------------------
  Art.badge = function (c, b, x, y, r, earned) {
    c.save(); c.translate(x, y);
    var col = earned ? b.color : '#9aa3ad';
    var sh = b.shape;
    c.lineJoin = 'round';
    c.beginPath();
    if (sh === 'circle') c.arc(0, 0, r, 0, TAU);
    else if (sh === 'drop') { c.moveTo(0, -r); c.quadraticCurveTo(r, 0, 0, r); c.quadraticCurveTo(-r, 0, 0, -r); }
    else if (sh === 'flame') { c.moveTo(0, -r); c.bezierCurveTo(r, -r * 0.2, r * 0.8, r, 0, r); c.bezierCurveTo(-r * 0.8, r, -r, -r * 0.2, 0, -r); }
    else if (sh === 'leaf') { c.moveTo(-r * 0.8, r * 0.8); c.quadraticCurveTo(-r * 0.8, -r * 0.8, r * 0.8, -r * 0.8); c.quadraticCurveTo(r * 0.8, r * 0.8, -r * 0.8, r * 0.8); }
    else if (sh === 'bolt') { c.moveTo(r * 0.3, -r); c.lineTo(-r * 0.6, r * 0.1); c.lineTo(0, r * 0.1); c.lineTo(-r * 0.3, r); c.lineTo(r * 0.6, -r * 0.1); c.lineTo(0, -r * 0.1); c.closePath(); }
    else if (sh === 'hex') { for (var i = 0; i < 6; i++) { var an = i * PI / 3 + PI / 6; c.lineTo(cos(an) * r, sin(an) * r); } c.closePath(); }
    else if (sh === 'star') { star5(c, 0, r * 0.1, r * 1.05, 0.48); }
    else if (sh === 'twin') { c.arc(-r * 0.4, 0, r * 0.62, 0, TAU); c.moveTo(r * 1.02, 0); c.arc(r * 0.4, 0, r * 0.62, 0, TAU); }
    else if (sh === 'gem') { c.moveTo(0, -r); c.lineTo(r * 0.85, -r * 0.2); c.lineTo(0, r); c.lineTo(-r * 0.85, -r * 0.2); c.closePath(); }
    else if (sh === 'crown') { c.moveTo(-r, r * 0.6); c.lineTo(-r, -r * 0.5); c.lineTo(-r * 0.5, 0); c.lineTo(0, -r * 0.8); c.lineTo(r * 0.5, 0); c.lineTo(r, -r * 0.5); c.lineTo(r, r * 0.6); c.closePath(); }
    var g = c.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, earned ? '#ffffff' : '#d5dbe1'); g.addColorStop(0.35, col); g.addColorStop(1, earned ? shade(col, -0.35) : '#6e7780');
    c.fillStyle = g; c.fill();
    c.lineWidth = Math.max(1.5, r * 0.14); c.strokeStyle = earned ? '#2b1f33' : '#5a6068'; c.stroke();
    // inner emblem: a faceted gem with a little star
    var ir = r * 0.36, iy = sh === 'drop' || sh === 'flame' ? r * 0.18 : 0;
    C(c, 0, iy, ir);
    c.fillStyle = earned ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)'; c.fill();
    c.lineWidth = Math.max(1, r * 0.08); c.strokeStyle = earned ? 'rgba(43,31,51,0.6)' : 'rgba(80,86,94,0.6)'; c.stroke();
    star5(c, 0, iy, ir * 0.7, 0.45);
    c.fillStyle = earned ? '#fff6c2' : '#e6e9ec'; c.fill();
    if (earned) { E(c, -r * 0.3, -r * 0.35, r * 0.25, r * 0.12, -0.6); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fill(); }
    c.restore();
  };

  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  Art.shade = shade;
})(typeof window !== 'undefined' ? window : globalThis);
