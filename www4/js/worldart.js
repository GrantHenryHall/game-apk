/* Critter Arena 4 — overworld art: ground tiles, trees, buildings, interiors and walking
 * trainers. Everything is drawn with canvas paths in device pixels at a whole-pixel tile size,
 * so cached chunks and sprites line up without seams. */
(function (root) {
  var CA = root.CA, Art = CA.Art;
  var TAU = Math.PI * 2, PI = Math.PI, sin = Math.sin, cos = Math.cos;
  var OUT = '#2b1f33';
  var WA = CA.WorldArt = {};

  function E(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
  function C(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  // rectangle with an individual radius per corner (tl, tr, br, bl)
  function rr4(c, x, y, w, h, a, b, d, e) {
    c.beginPath();
    c.moveTo(x + a, y); c.lineTo(x + w - b, y); if (b) c.arcTo(x + w, y, x + w, y + b, b); else c.lineTo(x + w, y);
    c.lineTo(x + w, y + h - d); if (d) c.arcTo(x + w, y + h, x + w - d, y + h, d); else c.lineTo(x + w, y + h);
    c.lineTo(x + e, y + h); if (e) c.arcTo(x, y + h, x, y + h - e, e); else c.lineTo(x, y + h);
    c.lineTo(x, y + a); if (a) c.arcTo(x, y, x + a, y, a); else c.lineTo(x, y);
    c.closePath();
  }
  function hash(x, y, k) {
    var h = (x * 374761393 + y * 668265263 + (k || 0) * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function mk(w, h) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; }
  WA.rr = rr; WA.hash = hash;

  // ---- palette ------------------------------------------------------------------------------
  var G = { grass: '#8ddd60', grassD: '#7acf52', tuft: '#62bd45', tuftL: '#b4ef8a', tall: '#55b843', tallD: '#3f9a37', tallL: '#86de5c',
    path: '#f3dfa8', pathE: '#e0c585', pebble: '#d7b97a', sand: '#f8e7b4', sandE: '#ecd394', water: '#53b9ff', waterD: '#3d9ff0', foam: '#e9f8ff',
    trunk: '#8a5a3a', leaf: '#45c25a', leafD: '#2f8a42', leafL: '#7ad65a', pine: '#2fa060', pineD: '#1f7a46', pineL: '#58c47a',
    rock: '#b9b1a6', rockD: '#8a8176', rockL: '#e2ddd4', cave: '#cdb091', caveD: '#b3957a', caveW: '#8c6c55', caveWL: '#a8876b', caveWD: '#6b5040',
    wood: '#f2cf91', woodD: '#ddb26c', wall: '#fff3dc', wallD: '#ead6b3', voidc: '#3b3044', sky: '#e9f0fa', skyD: '#cfdcef' };
  WA.G = G;

  // walkable ground characters; everything else blocks
  var WALK = { '.': 1, ',': 1, ':': 1, 's': 1, '=': 1, 'f': 1, 'c': 1, 'w': 1, 'D': 1, 'g': 1, 'G': 1, 'u': 1, 'y': 1 };
  WA.walkable = function (ch) { return !!WALK[ch]; };
  // ground characters that are drawn over plain grass
  var ON_GRASS = { '.': 1, ',': 1, 'f': 1, 'T': 1, 'P': 1, 'b': 1, 'r': 1, 'F': 1, 'n': 1, 'L': 1 };

  // ---- ground tiles (drawn into cached chunks) -----------------------------------------------
  function same(M, x, y, set) { return !!set[M.at(x, y)]; }
  // a patch of ground that rounds off its outer corners where it meets something else
  function patch(c, M, x, y, X, Y, T, set, col, edgeCol, inset) {
    var l = !same(M, x - 1, y, set), r = !same(M, x + 1, y, set), u = !same(M, x, y - 1, set), d = !same(M, x, y + 1, set);
    var R = T * 0.38;
    var a = l && u ? R : 0, b = r && u ? R : 0, e = r && d ? R : 0, f = l && d ? R : 0;
    if (edgeCol) {
      rr4(c, X, Y, T, T, a, b, e, f); c.fillStyle = edgeCol; c.fill();
      var i = inset || T * 0.07;
      var x0 = X + (l ? i : 0), y0 = Y + (u ? i : 0), x1 = X + T - (r ? i : 0), y1 = Y + T - (d ? i : 0);
      rr4(c, x0, y0, x1 - x0, y1 - y0, Math.max(0, a - i), Math.max(0, b - i), Math.max(0, e - i), Math.max(0, f - i));
    } else rr4(c, X, Y, T, T, a, b, e, f);
    c.fillStyle = col; c.fill();
    return { l: l, r: r, u: u, d: d };
  }
  var PATHS = { ':': 1 }, SANDS = { 's': 1 }, WATERS = { '~': 1 }, TALLS = { ',': 1 }, LEDGES = { 'L': 1 }, BRIDGE = { '=': 1 };

  function grassBase(c, x, y, X, Y, T) {
    c.fillStyle = G.grass; c.fillRect(X, Y, T, T);
    // mowing checker, very subtle
    if ((x + y) % 2) { c.fillStyle = 'rgba(255,255,255,0.035)'; c.fillRect(X, Y, T, T); }
    for (var k = 0; k < 3; k++) {
      var gx = X + hash(x, y, k) * T * 0.8 + T * 0.1, gy = Y + hash(x, y, k + 9) * T * 0.8 + T * 0.15;
      if (hash(x, y, k + 20) < 0.55) {
        c.strokeStyle = G.tuft; c.lineWidth = T * 0.035; c.lineCap = 'round';
        c.beginPath(); c.moveTo(gx - T * 0.05, gy); c.lineTo(gx - T * 0.07, gy - T * 0.08);
        c.moveTo(gx, gy); c.lineTo(gx, gy - T * 0.1); c.moveTo(gx + T * 0.05, gy); c.lineTo(gx + T * 0.07, gy - T * 0.08); c.stroke();
      } else { c.fillStyle = 'rgba(40,120,30,0.12)'; c.fillRect(gx, gy, T * 0.05, T * 0.05); }
    }
  }
  function flowers(c, x, y, X, Y, T) {
    var cols = ['#ffffff', '#ffe36a', '#ff9ad0', '#ff6a6a', '#a9c6ff'];
    for (var k = 0; k < 3; k++) {
      var fx = X + T * (0.18 + 0.64 * hash(x, y, k + 3)), fy = Y + T * (0.2 + 0.62 * hash(x, y, k + 7)), col = cols[(hash(x, y, k + 11) * cols.length) | 0];
      c.fillStyle = col;
      for (var p = 0; p < 5; p++) { C(c, fx + cos(p * TAU / 5) * T * 0.05, fy + sin(p * TAU / 5) * T * 0.05, T * 0.045); c.fill(); }
      C(c, fx, fy, T * 0.035); c.fillStyle = '#ffb21f'; c.fill();
    }
  }
  function water(c, M, x, y, X, Y, T) {
    c.fillStyle = G.water; c.fillRect(X, Y, T, T);
    var s = patch(c, M, x, y, X, Y, T, WATERS, G.water, null);
    // a lighter sand/foam band along every shore
    c.save(); rr4(c, X, Y, T, T, 0, 0, 0, 0); c.clip();
    c.strokeStyle = G.foam; c.lineWidth = T * 0.09;
    c.beginPath();
    if (s.u) { c.moveTo(X, Y + T * 0.05); c.lineTo(X + T, Y + T * 0.05); }
    if (s.d) { c.moveTo(X, Y + T * 0.95); c.lineTo(X + T, Y + T * 0.95); }
    if (s.l) { c.moveTo(X + T * 0.05, Y); c.lineTo(X + T * 0.05, Y + T); }
    if (s.r) { c.moveTo(X + T * 0.95, Y); c.lineTo(X + T * 0.95, Y + T); }
    c.stroke();
    c.strokeStyle = 'rgba(29,95,176,0.25)'; c.lineWidth = T * 0.05; c.beginPath();
    if (s.u) { c.moveTo(X, Y + T * 0.15); c.lineTo(X + T, Y + T * 0.15); }
    if (s.l) { c.moveTo(X + T * 0.15, Y); c.lineTo(X + T * 0.15, Y + T); }
    c.stroke();
    c.restore();
  }
  function ledge(c, M, x, y, X, Y, T) {
    var l = !same(M, x - 1, y, LEDGES), r = !same(M, x + 1, y, LEDGES);
    var x0 = X + (l ? T * 0.12 : 0), x1 = X + T - (r ? T * 0.12 : 0);
    rr4(c, x0, Y + T * 0.55, x1 - x0, T * 0.3, 0, 0, r ? T * 0.12 : 0, l ? T * 0.12 : 0); c.fillStyle = '#4f9f36'; c.fill();
    c.fillStyle = '#6cc24a'; c.fillRect(x0, Y + T * 0.5, x1 - x0, T * 0.08);
    c.fillStyle = 'rgba(30,70,20,0.18)'; c.fillRect(x0, Y + T * 0.85, x1 - x0, T * 0.1);
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = T * 0.03; c.beginPath(); c.moveTo(x0 + T * 0.05, Y + T * 0.52); c.lineTo(x1 - T * 0.05, Y + T * 0.52); c.stroke();
  }
  function bridge(c, M, x, y, X, Y, T) {
    var vert = !same(M, x - 1, y, BRIDGE) && !same(M, x + 1, y, BRIDGE);
    c.fillStyle = '#c98f58'; c.fillRect(X, Y, T, T);
    c.strokeStyle = '#9a6538'; c.lineWidth = Math.max(1, T * 0.04);
    c.beginPath();
    for (var k = 1; k < 4; k++) {
      if (vert) { c.moveTo(X, Y + k * T / 4); c.lineTo(X + T, Y + k * T / 4); }
      else { c.moveTo(X + k * T / 4, Y); c.lineTo(X + k * T / 4, Y + T); }
    }
    c.stroke();
    c.fillStyle = '#7a4a26';
    if (vert) { c.fillRect(X, Y, T * 0.1, T); c.fillRect(X + T * 0.9, Y, T * 0.1, T); }
    else { c.fillRect(X, Y, T, T * 0.1); c.fillRect(X, Y + T * 0.9, T, T * 0.1); }
  }
  function caveFloor(c, x, y, X, Y, T) {
    c.fillStyle = G.cave; c.fillRect(X, Y, T, T);
    for (var k = 0; k < 3; k++) {
      var px = X + hash(x, y, k) * T * 0.8 + T * 0.1, py = Y + hash(x, y, k + 5) * T * 0.8 + T * 0.1;
      E(c, px, py, T * 0.05, T * 0.035); c.fillStyle = G.caveD; c.fill();
    }
  }
  function caveWall(c, M, x, y, X, Y, T) {
    c.fillStyle = G.caveW; c.fillRect(X, Y, T, T);
    var below = M.at(x, y + 1);
    if (below !== 'C') {
      // the front face of the rock with a lit top
      c.fillStyle = G.caveWD; c.fillRect(X, Y + T * 0.55, T, T * 0.45);
      c.fillStyle = G.caveWL; c.fillRect(X, Y + T * 0.45, T, T * 0.12);
      c.strokeStyle = 'rgba(40,25,20,0.35)'; c.lineWidth = T * 0.03; c.beginPath();
      c.moveTo(X + T * (0.2 + hash(x, y, 1) * 0.3), Y + T * 0.6); c.lineTo(X + T * (0.3 + hash(x, y, 2) * 0.3), Y + T * 0.95); c.stroke();
    } else {
      for (var k = 0; k < 2; k++) { E(c, X + T * (0.2 + hash(x, y, k) * 0.6), Y + T * (0.2 + hash(x, y, k + 3) * 0.6), T * 0.12, T * 0.07); c.fillStyle = G.caveWL; c.fill(); }
    }
  }
  function crystal(c, X, Y, T, col) {
    var pts = [[0.3, 0.85, 0.12, 0.5], [0.55, 0.9, 0.16, 0.7], [0.75, 0.85, 0.1, 0.42]];
    for (var i = 0; i < 3; i++) {
      var p = pts[i], bx = X + T * p[0], by = Y + T * p[1], w = T * p[2], h = T * p[3];
      c.beginPath(); c.moveTo(bx - w, by); c.lineTo(bx - w * 0.6, by - h * 0.8); c.lineTo(bx, by - h); c.lineTo(bx + w * 0.6, by - h * 0.8); c.lineTo(bx + w, by); c.closePath();
      c.fillStyle = col; c.fill(); c.lineWidth = T * 0.03; c.strokeStyle = OUT; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(bx - w * 0.5, by - h * 0.1); c.lineTo(bx - w * 0.3, by - h * 0.75); c.lineTo(bx, by - h * 0.9); c.lineTo(bx - w * 0.1, by - h * 0.1); c.closePath(); c.fill();
    }
  }
  function skyTile(c, M, x, y, X, Y, T) {
    c.fillStyle = (x + y) % 2 ? G.sky : '#f4f8ff'; c.fillRect(X, Y, T, T);
    c.strokeStyle = G.skyD; c.lineWidth = Math.max(1, T * 0.03); c.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
  }
  function cloudTile(c, x, y, X, Y, T) {
    var g = c.createLinearGradient(0, Y, 0, Y + T); g.addColorStop(0, '#9fd6ff'); g.addColorStop(1, '#c9e9ff');
    c.fillStyle = g; c.fillRect(X, Y, T, T);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (var k = 0; k < 3; k++) { C(c, X + T * (0.15 + hash(x, y, k) * 0.7), Y + T * (0.3 + hash(x, y, k + 4) * 0.5), T * (0.18 + hash(x, y, k + 8) * 0.14)); c.fill(); }
  }
  // ---- indoor tiles --------------------------------------------------------------------------
  function floorWood(c, x, y, X, Y, T) {
    c.fillStyle = G.wood; c.fillRect(X, Y, T, T);
    c.strokeStyle = G.woodD; c.lineWidth = Math.max(1, T * 0.025);
    c.beginPath(); c.moveTo(X, Y + T * 0.5); c.lineTo(X + T, Y + T * 0.5); c.moveTo(X, Y + T); c.lineTo(X + T, Y + T);
    var o = (y % 2) * 0.5;
    c.moveTo(X + T * (0.3 + o * 0.4), Y); c.lineTo(X + T * (0.3 + o * 0.4), Y + T * 0.5); c.moveTo(X + T * (0.8 - o * 0.4), Y + T * 0.5); c.lineTo(X + T * (0.8 - o * 0.4), Y + T); c.stroke();
  }
  function wallTile(c, M, x, y, X, Y, T) {
    var below = M.at(x, y + 1);
    c.fillStyle = G.wall; c.fillRect(X, Y, T, T);
    if (below === 'W' || below === 'v') { c.fillStyle = '#f6e6c8'; c.fillRect(X, Y, T, T); return; }
    c.fillStyle = G.wallD; c.fillRect(X, Y + T * 0.55, T, T * 0.45);
    c.fillStyle = '#c9a77a'; c.fillRect(X, Y + T * 0.9, T, T * 0.1);
    c.fillStyle = 'rgba(0,0,0,0.06)'; c.fillRect(X, Y + T * 0.55, T, T * 0.04);
    if (M.wallDeco && hash(x, y, 77) < 0.28 && x % 2) {
      // a window or a framed picture
      if (hash(x, y, 78) < 0.6) { rr(c, X + T * 0.2, Y + T * 0.1, T * 0.6, T * 0.38, T * 0.04); c.fillStyle = '#bfe9ff'; c.fill(); c.lineWidth = T * 0.04; c.strokeStyle = '#ffffff'; c.stroke(); c.fillStyle = '#ffffff'; c.fillRect(X + T * 0.48, Y + T * 0.1, T * 0.04, T * 0.38); }
      else { rr(c, X + T * 0.3, Y + T * 0.12, T * 0.4, T * 0.32, T * 0.03); c.fillStyle = '#ffe9a8'; c.fill(); c.lineWidth = T * 0.04; c.strokeStyle = '#b07a3a'; c.stroke(); C(c, X + T * 0.5, Y + T * 0.3, T * 0.07); c.fillStyle = '#ff8a5b'; c.fill(); }
    }
  }
  function mat(c, X, Y, T) {
    rr(c, X + T * 0.1, Y + T * 0.25, T * 0.8, T * 0.6, T * 0.08); c.fillStyle = '#e8545e'; c.fill();
    rr(c, X + T * 0.18, Y + T * 0.33, T * 0.64, T * 0.44, T * 0.05); c.lineWidth = T * 0.04; c.strokeStyle = '#ffd23f'; c.stroke();
  }
  function counter(c, M, x, y, X, Y, T) {
    var l = M.at(x - 1, y) !== 'K', r = M.at(x + 1, y) !== 'K';
    c.fillStyle = '#e9b26e'; c.fillRect(X, Y + T * 0.35, T, T * 0.6);
    c.fillStyle = '#fff6e6'; c.fillRect(X, Y + T * 0.15, T, T * 0.28);
    c.strokeStyle = OUT; c.lineWidth = Math.max(1, T * 0.035);
    c.beginPath(); c.moveTo(X, Y + T * 0.15); c.lineTo(X + T, Y + T * 0.15); c.moveTo(X, Y + T * 0.43); c.lineTo(X + T, Y + T * 0.43); c.moveTo(X, Y + T * 0.95); c.lineTo(X + T, Y + T * 0.95);
    if (l) { c.moveTo(X + 1, Y + T * 0.15); c.lineTo(X + 1, Y + T * 0.95); }
    if (r) { c.moveTo(X + T - 1, Y + T * 0.15); c.lineTo(X + T - 1, Y + T * 0.95); }
    c.stroke();
  }
  function shelf(c, x, y, X, Y, T, books) {
    rr(c, X + T * 0.05, Y - T * 0.25, T * 0.9, T * 1.15, T * 0.06); c.fillStyle = '#a8703f'; c.fill(); c.lineWidth = Math.max(1, T * 0.035); c.strokeStyle = OUT; c.stroke();
    for (var s = 0; s < 3; s++) {
      var sy = Y - T * 0.15 + s * T * 0.33;
      c.fillStyle = '#7a4a26'; c.fillRect(X + T * 0.12, sy + T * 0.25, T * 0.76, T * 0.05);
      for (var b = 0; b < 5; b++) {
        var col = books ? ['#ff4d5e', '#3d8bff', '#45c25a', '#ffd23f', '#a45cff', '#ff8a3d'][((hash(x, y, s * 7 + b) * 6) | 0)] : ['#ff9ad0', '#ffd23f', '#9bd2ff', '#ff6a5e'][((hash(x, y, s * 5 + b) * 4) | 0)];
        if (books) c.fillStyle = col, c.fillRect(X + T * (0.14 + b * 0.145), sy + T * 0.02, T * 0.12, T * 0.23);
        else { rr(c, X + T * (0.14 + b * 0.145), sy + T * 0.08, T * 0.12, T * 0.17, T * 0.03); c.fillStyle = col; c.fill(); }
      }
    }
  }
  function plant(c, X, Y, T) {
    c.fillStyle = 'rgba(0,0,0,0.12)'; E(c, X + T / 2, Y + T * 0.88, T * 0.28, T * 0.08); c.fill();
    rr(c, X + T * 0.3, Y + T * 0.55, T * 0.4, T * 0.33, T * 0.05); c.fillStyle = '#d9773e'; c.fill(); c.lineWidth = Math.max(1, T * 0.03); c.strokeStyle = OUT; c.stroke();
    var lv = [[-0.18, -0.05], [0.18, -0.05], [0, -0.2], [-0.1, 0.05], [0.1, 0.05]];
    for (var i = 0; i < lv.length; i++) { E(c, X + T * (0.5 + lv[i][0]), Y + T * (0.4 + lv[i][1]), T * 0.14, T * 0.2, lv[i][0] * 4); c.fillStyle = i % 2 ? G.leafD : G.leaf; c.fill(); c.stroke(); }
  }
  function table(c, X, Y, T) {
    c.fillStyle = 'rgba(0,0,0,0.12)'; E(c, X + T / 2, Y + T * 0.85, T * 0.4, T * 0.1); c.fill();
    c.fillStyle = '#9a6538'; c.fillRect(X + T * 0.2, Y + T * 0.5, T * 0.08, T * 0.35); c.fillRect(X + T * 0.72, Y + T * 0.5, T * 0.08, T * 0.35);
    rr(c, X + T * 0.08, Y + T * 0.25, T * 0.84, T * 0.32, T * 0.08); c.fillStyle = '#c98f58'; c.fill(); c.lineWidth = Math.max(1, T * 0.03); c.strokeStyle = OUT; c.stroke();
    E(c, X + T * 0.62, Y + T * 0.38, T * 0.09, T * 0.05); c.fillStyle = '#ffffff'; c.fill();
  }
  function machine(c, X, Y, T, M) {
    rr(c, X + T * 0.06, Y - T * 0.15, T * 0.88, T * 1.05, T * 0.1); c.fillStyle = '#dfe6ef'; c.fill(); c.lineWidth = Math.max(1, T * 0.035); c.strokeStyle = OUT; c.stroke();
    rr(c, X + T * 0.18, Y - T * 0.02, T * 0.64, T * 0.32, T * 0.05); c.fillStyle = M && M.heal ? '#ff9ad0' : '#58c4ff'; c.fill(); c.stroke();
    for (var i = 0; i < 3; i++) { C(c, X + T * (0.3 + i * 0.2), Y + T * 0.55, T * 0.07); c.fillStyle = i === 1 ? '#ff4d5e' : '#ffd23f'; c.fill(); c.stroke(); }
  }
  function pc(c, X, Y, T) {
    table(c, X, Y, T);
    rr(c, X + T * 0.25, Y - T * 0.12, T * 0.5, T * 0.4, T * 0.05); c.fillStyle = '#dfe6ef'; c.fill(); c.lineWidth = Math.max(1, T * 0.03); c.strokeStyle = OUT; c.stroke();
    rr(c, X + T * 0.3, Y - T * 0.07, T * 0.4, T * 0.28, T * 0.03); c.fillStyle = '#3d8bff'; c.fill();
    c.fillStyle = '#bfe9ff'; c.fillRect(X + T * 0.34, Y - T * 0.02, T * 0.2, T * 0.04);
  }
  function sofa(c, X, Y, T) {
    rr(c, X + T * 0.05, Y + T * 0.15, T * 0.9, T * 0.7, T * 0.15); c.fillStyle = '#5c8dff'; c.fill(); c.lineWidth = Math.max(1, T * 0.03); c.strokeStyle = OUT; c.stroke();
    rr(c, X + T * 0.15, Y + T * 0.4, T * 0.7, T * 0.35, T * 0.1); c.fillStyle = '#8fb2ff'; c.fill();
  }
  function bed(c, X, Y, T) {
    rr(c, X + T * 0.08, Y - T * 0.1, T * 0.84, T * 1.0, T * 0.1); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = Math.max(1, T * 0.03); c.strokeStyle = OUT; c.stroke();
    rr(c, X + T * 0.08, Y + T * 0.35, T * 0.84, T * 0.55, T * 0.1); c.fillStyle = '#ff8a8a'; c.fill(); c.stroke();
    rr(c, X + T * 0.2, Y - T * 0.02, T * 0.6, T * 0.25, T * 0.08); c.fillStyle = '#fff6e6'; c.fill(); c.stroke();
  }
  function tv(c, X, Y, T) {
    rr(c, X + T * 0.15, Y + T * 0.55, T * 0.7, T * 0.3, T * 0.04); c.fillStyle = '#a8703f'; c.fill();
    rr(c, X + T * 0.12, Y - T * 0.05, T * 0.76, T * 0.6, T * 0.08); c.fillStyle = '#4a4f59'; c.fill(); c.lineWidth = Math.max(1, T * 0.03); c.strokeStyle = OUT; c.stroke();
    rr(c, X + T * 0.2, Y + T * 0.03, T * 0.6, T * 0.42, T * 0.05); c.fillStyle = '#8fd3ff'; c.fill();
  }
  function rug(c, M, x, y, X, Y, T) {
    patch(c, M, x, y, X, Y, T, { u: 1 }, '#ffb0b8', '#e8545e', T * 0.1);
  }
  function statue(c, X, Y, T, col) {
    c.fillStyle = 'rgba(0,0,0,0.15)'; E(c, X + T / 2, Y + T * 0.9, T * 0.4, T * 0.1); c.fill();
    rr(c, X + T * 0.15, Y + T * 0.55, T * 0.7, T * 0.35, T * 0.05); c.fillStyle = '#c9ccd3'; c.fill(); c.lineWidth = Math.max(1, T * 0.03); c.strokeStyle = OUT; c.stroke();
    // a stylised critter on the pedestal
    E(c, X + T * 0.5, Y + T * 0.3, T * 0.27, T * 0.3); c.fillStyle = '#e3e6ec'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(X + T * 0.3, Y + T * 0.12); c.lineTo(X + T * 0.34, Y - T * 0.12); c.lineTo(X + T * 0.44, Y + T * 0.05); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(X + T * 0.7, Y + T * 0.12); c.lineTo(X + T * 0.66, Y - T * 0.12); c.lineTo(X + T * 0.56, Y + T * 0.05); c.closePath(); c.fill(); c.stroke();
    Art.star5(c, X + T * 0.5, Y + T * 0.72, T * 0.1, 0.45); c.fillStyle = col || '#ffd23f'; c.fill();
  }
  function gymFloor(c, M, x, y, X, Y, T, alt) {
    var th = M.theme || {};
    c.fillStyle = alt ? (th.floorB || '#cfe3ff') : ((x + y) % 2 ? (th.floorA || '#e9f3ff') : (th.floorA2 || th.floorA || '#dfeeff')); c.fillRect(X, Y, T, T);
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = Math.max(1, T * 0.03); c.strokeRect(X + 1, Y + 1, T - 2, T - 2);
    if (alt) { Art.star5(c, X + T / 2, Y + T / 2, T * 0.18, 0.45); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fill(); }
  }

  WA.drawTile = function (c, M, x, y, X, Y, T) {
    var ch = M.at(x, y);
    if (ON_GRASS[ch]) {
      // rocks and signs in a cave sit on the cave floor, not on grass
      if (M.ground === 'cave') { caveFloor(c, x, y, X, Y, T); return; }
      grassBase(c, x, y, X, Y, T);
      if (ch === ',') {
        patch(c, M, x, y, X, Y, T, TALLS, G.tall, G.tallD, T * 0.05);
        // back row of blades
        c.fillStyle = G.tallD;
        for (var k = 0; k < 4; k++) {
          var bx = X + T * (0.12 + k * 0.25), by = Y + T * 0.45;
          c.beginPath(); c.moveTo(bx - T * 0.09, by); c.lineTo(bx, by - T * 0.3); c.lineTo(bx + T * 0.09, by); c.closePath(); c.fill();
        }
      } else if (ch === 'f') flowers(c, x, y, X, Y, T);
      else if (ch === 'L') ledge(c, M, x, y, X, Y, T);
      return;
    }
    switch (ch) {
      case ':': grassBase(c, x, y, X, Y, T); patch(c, M, x, y, X, Y, T, PATHS, G.path, G.pathE, T * 0.08);
        if (hash(x, y, 31) < 0.4) { E(c, X + T * hash(x, y, 32), Y + T * hash(x, y, 33), T * 0.04, T * 0.03); c.fillStyle = G.pebble; c.fill(); }
        break;
      case 's': c.fillStyle = M.sandBase || G.grass; c.fillRect(X, Y, T, T); if (!M.sandBase) grassBase(c, x, y, X, Y, T);
        patch(c, M, x, y, X, Y, T, SANDS, G.sand, G.sandE, T * 0.06);
        if (hash(x, y, 41) < 0.5) { c.fillStyle = 'rgba(200,160,90,0.35)'; c.fillRect(X + T * hash(x, y, 42) * 0.8, Y + T * hash(x, y, 43) * 0.8, T * 0.05, T * 0.05); }
        if (hash(x, y, 44) < 0.08) { Art.star5(c, X + T * 0.5, Y + T * 0.5, T * 0.12, 0.5, hash(x, y, 45) * 3); c.fillStyle = '#ff9a7a'; c.fill(); }
        break;
      case '~': c.fillStyle = M.shore || G.sand; c.fillRect(X, Y, T, T); water(c, M, x, y, X, Y, T); break;
      case '=': bridge(c, M, x, y, X, Y, T); break;
      case 'c': caveFloor(c, x, y, X, Y, T); break;
      case 'C': caveWall(c, M, x, y, X, Y, T); break;
      case 'k': caveFloor(c, x, y, X, Y, T); crystal(c, X, Y, T, hash(x, y, 3) < 0.5 ? '#a9c6ff' : '#e0b3ff'); break;
      case 'y': skyTile(c, M, x, y, X, Y, T); break;
      case 'Q': cloudTile(c, x, y, X, Y, T); break;
      case 'w': floorWood(c, x, y, X, Y, T); break;
      case 'W': wallTile(c, M, x, y, X, Y, T); break;
      case 'v': c.fillStyle = G.voidc; c.fillRect(X, Y, T, T); break;
      case 'D': floorWood(c, x, y, X, Y, T); mat(c, X, Y, T); break;
      case 'K': floorWood(c, x, y, X, Y, T); counter(c, M, x, y, X, Y, T); break;
      case 'B': floorWood(c, x, y, X, Y, T); shelf(c, x, y, X, Y, T, true); break;
      case 'S': floorWood(c, x, y, X, Y, T); shelf(c, x, y, X, Y, T, false); break;
      case 'p': (M.gym ? gymFloor(c, M, x, y, X, Y, T) : floorWood(c, x, y, X, Y, T)); plant(c, X, Y, T); break;
      case 't': floorWood(c, x, y, X, Y, T); table(c, X, Y, T); break;
      case 'M': floorWood(c, x, y, X, Y, T); machine(c, X, Y, T, M); break;
      case 'O': floorWood(c, x, y, X, Y, T); pc(c, X, Y, T); break;
      case 'Z': floorWood(c, x, y, X, Y, T); sofa(c, X, Y, T); break;
      case 'H': floorWood(c, x, y, X, Y, T); bed(c, X, Y, T); break;
      case 'V': floorWood(c, x, y, X, Y, T); tv(c, X, Y, T); break;
      case 'u': floorWood(c, x, y, X, Y, T); rug(c, M, x, y, X, Y, T); break;
      case 'g': gymFloor(c, M, x, y, X, Y, T, false); break;
      case 'G': gymFloor(c, M, x, y, X, Y, T, true); break;
      case 'X': (M.gym ? gymFloor(c, M, x, y, X, Y, T) : floorWood(c, x, y, X, Y, T)); statue(c, X, Y, T, M.theme && M.theme.col); break;
      default: grassBase(c, x, y, X, Y, T);
    }
  };

  // ---- sprites (cached per tile size) ---------------------------------------------------------
  var cache = {}, cacheT = 0;
  function cached(key, w, h, draw) {
    var k = key + '@' + cacheT;
    var s = cache[k];
    if (!s) { s = mk(w, h); draw(s.getContext('2d')); cache[k] = s; }
    return s;
  }
  WA.setTile = function (T) { if (T !== cacheT) { cache = {}; cacheT = T; } };

  // tree: trunk in its own tile, a fluffy crown that rises ~0.9 tile above it
  WA.tree = function (T, kind) {
    return cached('tree' + kind, T * 1.2, T * 2, function (c) {
      var cx = T * 0.6, base = T * 1.95;
      c.fillStyle = 'rgba(20,60,20,0.22)'; E(c, cx, base - T * 0.1, T * 0.45, T * 0.14); c.fill();
      c.lineWidth = Math.max(1, T * 0.035); c.strokeStyle = 'rgba(25,60,30,0.85)';
      if (kind === 'P') {
        rr(c, cx - T * 0.08, base - T * 0.35, T * 0.16, T * 0.3, T * 0.03); c.fillStyle = G.trunk; c.fill();
        var tiers = [[0.95, 0.5], [0.72, 0.85], [0.5, 1.18]];
        for (var i = 0; i < 3; i++) {
          var w = T * tiers[i][0] / 2, y0 = base - T * (0.25 + i * 0.38), y1 = y0 - T * 0.62;
          c.beginPath(); c.moveTo(cx - w, y0); c.quadraticCurveTo(cx, y0 + T * 0.1, cx + w, y0); c.lineTo(cx, y1); c.closePath();
          c.fillStyle = i % 2 ? G.pineD : G.pine; c.fill(); c.stroke();
          c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(cx - w * 0.6, y0 - T * 0.06); c.lineTo(cx - T * 0.03, y1 + T * 0.12); c.lineTo(cx - w * 0.15, y0 - T * 0.04); c.closePath(); c.fill();
        }
        return;
      }
      rr(c, cx - T * 0.1, base - T * 0.5, T * 0.2, T * 0.45, T * 0.05); c.fillStyle = G.trunk; c.fill(); c.stroke();
      var blobs = [[0, -0.95, 0.42], [-0.26, -0.72, 0.32], [0.26, -0.72, 0.32], [-0.15, -1.18, 0.3], [0.17, -1.16, 0.3]];
      for (var j = 0; j < blobs.length; j++) { C(c, cx + T * blobs[j][0], base + T * blobs[j][1] - T * 0.05, T * blobs[j][2]); c.fillStyle = G.leafD; c.fill(); c.stroke(); }
      for (j = 0; j < blobs.length; j++) { C(c, cx + T * blobs[j][0] - T * 0.03, base + T * blobs[j][1] - T * 0.09, T * blobs[j][2] * 0.86); c.fillStyle = G.leaf; c.fill(); }
      for (j = 0; j < 3; j++) { C(c, cx + T * (blobs[j + 2][0] * 0.6 - 0.08), base + T * (blobs[j + 2][1] - 0.12), T * 0.1); c.fillStyle = G.leafL; c.fill(); }
      if (kind === 'A') { for (j = 0; j < 4; j++) { C(c, cx + T * (-0.25 + j * 0.17), base - T * (0.85 + (j % 2) * 0.25), T * 0.06); c.fillStyle = '#ff5a5a'; c.fill(); } }
    });
  };
  WA.bush = function (T) {
    return cached('bush', T, T, function (c) {
      c.fillStyle = 'rgba(20,60,20,0.2)'; E(c, T / 2, T * 0.86, T * 0.42, T * 0.1); c.fill();
      c.lineWidth = Math.max(1, T * 0.035); c.strokeStyle = 'rgba(25,60,30,0.85)';
      var b = [[0.5, 0.52, 0.32], [0.28, 0.62, 0.22], [0.72, 0.62, 0.22]];
      for (var i = 0; i < 3; i++) { C(c, T * b[i][0], T * b[i][1], T * b[i][2]); c.fillStyle = '#4bb85a'; c.fill(); c.stroke(); }
      for (i = 0; i < 3; i++) { C(c, T * b[i][0] - T * 0.03, T * b[i][1] - T * 0.04, T * b[i][2] * 0.8); c.fillStyle = '#62cc6a'; c.fill(); }
      C(c, T * 0.42, T * 0.4, T * 0.07); c.fillStyle = G.leafL; c.fill();
    });
  };
  WA.rock = function (T) {
    return cached('rock', T, T, function (c) {
      c.fillStyle = 'rgba(20,40,20,0.2)'; E(c, T / 2, T * 0.84, T * 0.42, T * 0.1); c.fill();
      c.beginPath(); c.moveTo(T * 0.1, T * 0.82); c.quadraticCurveTo(T * 0.05, T * 0.35, T * 0.42, T * 0.22); c.quadraticCurveTo(T * 0.85, T * 0.18, T * 0.9, T * 0.55); c.quadraticCurveTo(T * 0.95, T * 0.85, T * 0.6, T * 0.86); c.closePath();
      c.fillStyle = G.rock; c.fill(); c.lineWidth = Math.max(1, T * 0.04); c.strokeStyle = '#5a5248'; c.stroke();
      c.fillStyle = G.rockL; E(c, T * 0.38, T * 0.38, T * 0.14, T * 0.07, -0.4); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.12)'; E(c, T * 0.6, T * 0.72, T * 0.22, T * 0.08); c.fill();
    });
  };
  WA.sign = function (T) {
    return cached('sign', T, T * 1.2, function (c) {
      var o = T * 0.2;
      c.fillStyle = 'rgba(20,40,20,0.2)'; E(c, T / 2, o + T * 0.88, T * 0.28, T * 0.08); c.fill();
      c.fillStyle = '#8a5a3a'; c.fillRect(T * 0.45, o + T * 0.4, T * 0.1, T * 0.5);
      rr(c, T * 0.1, o + T * 0.05 - T * 0.12, T * 0.8, T * 0.48, T * 0.06); c.fillStyle = '#d9a46a'; c.fill(); c.lineWidth = Math.max(1, T * 0.04); c.strokeStyle = OUT; c.stroke();
      c.strokeStyle = '#a8703f'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath();
      c.moveTo(T * 0.2, o + T * 0.05); c.lineTo(T * 0.8, o + T * 0.05); c.moveTo(T * 0.2, o + T * 0.17); c.lineTo(T * 0.7, o + T * 0.17); c.stroke();
    });
  };
  WA.fence = function (T, l, r) {
    return cached('fence' + (l ? 1 : 0) + (r ? 1 : 0), T, T, function (c) {
      c.lineWidth = Math.max(1, T * 0.035); c.strokeStyle = '#8a7a6a';
      c.fillStyle = '#ffffff';
      c.fillRect(l ? 0 : T * 0.3, T * 0.42, (r ? T : T * 0.7) - (l ? 0 : T * 0.3), T * 0.1);
      c.fillRect(l ? 0 : T * 0.3, T * 0.62, (r ? T : T * 0.7) - (l ? 0 : T * 0.3), T * 0.1);
      c.strokeRect(l ? 0 : T * 0.3, T * 0.42, (r ? T : T * 0.7) - (l ? 0 : T * 0.3), T * 0.1);
      c.strokeRect(l ? 0 : T * 0.3, T * 0.62, (r ? T : T * 0.7) - (l ? 0 : T * 0.3), T * 0.1);
      c.fillStyle = 'rgba(20,40,20,0.15)'; c.fillRect(0, T * 0.86, T, T * 0.06);
      rr(c, T * 0.38, T * 0.22, T * 0.24, T * 0.66, T * 0.08); c.fillStyle = '#ffffff'; c.fill(); c.stroke();
      c.fillStyle = '#e3ddd2'; c.fillRect(T * 0.52, T * 0.3, T * 0.08, T * 0.55);
    });
  };
  // tall grass front blades (drawn after anyone standing in it), three sway frames
  WA.grassFront = function (T, f) {
    return cached('gf' + f, T * 1.2, T * 0.75, function (c) {
      var sw = [-0.05, 0, 0.05][f], hs = [0.34, 0.46, 0.3, 0.44, 0.36];
      for (var k = 0; k < 5; k++) {
        var bx = T * (0.12 + k * 0.24), by = T * 0.72, h = T * hs[k];
        c.beginPath(); c.moveTo(bx - T * 0.1, by); c.quadraticCurveTo(bx - T * 0.02, by - h * 0.5, bx + T * sw * 2, by - h); c.quadraticCurveTo(bx + T * 0.02, by - h * 0.5, bx + T * 0.1, by); c.closePath();
        var g = c.createLinearGradient(0, by - h, 0, by);
        g.addColorStop(0, '#a6ec7a'); g.addColorStop(0.45, k % 2 ? G.tall : '#62c64c'); g.addColorStop(1, G.tallD);
        c.fillStyle = g; c.fill();
        c.lineWidth = Math.max(1, T * 0.022); c.strokeStyle = 'rgba(31,100,40,0.75)'; c.stroke();
      }
    });
  };
  // water sparkle overlay (animated)
  WA.waterGlint = function (c, X, Y, T, t, x, y) {
    var ph = (t * 0.6 + hash(x, y, 51)) % 1;
    var a = sin(ph * PI);
    if (a < 0.05) return;
    c.strokeStyle = 'rgba(255,255,255,' + (0.7 * a) + ')'; c.lineWidth = Math.max(1, T * 0.035); c.lineCap = 'round';
    var gx = X + T * (0.2 + hash(x, y, 52) * 0.5), gy = Y + T * (0.3 + hash(x, y, 53) * 0.4), w = T * 0.18;
    c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx + w / 2, gy - T * 0.06 * a, gx + w, gy); c.stroke();
  };

  // ---- buildings ----------------------------------------------------------------------------
  // footprint w x h tiles; the sprite starts `top` tiles above the footprint (roof overhang)
  var BUILD = {
    house: { w: 4, h: 3, top: 0.7 }, lab: { w: 6, h: 3, top: 0.8 }, center: { w: 5, h: 3, top: 0.9 }, mart: { w: 4, h: 3, top: 0.8 },
    gym: { w: 5, h: 4, top: 0.8 }, league: { w: 7, h: 5, top: 1.4 }, cave: { w: 3, h: 2, top: 0.6 }, tower: { w: 4, h: 4, top: 1.6 }, gate: { w: 4, h: 2, top: 0.6 }
  };
  WA.BUILD = BUILD;
  function window2(c, x, y, w, h, T) {
    rr(c, x, y, w, h, T * 0.05); c.fillStyle = '#bfe9ff'; c.fill(); c.lineWidth = Math.max(1, T * 0.05); c.strokeStyle = '#ffffff'; c.stroke();
    c.lineWidth = Math.max(1, T * 0.03); c.strokeStyle = OUT; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x + w * 0.15, y + h * 0.15, w * 0.2, h * 0.5);
    c.fillStyle = '#ffffff'; c.fillRect(x + w / 2 - T * 0.02, y, T * 0.04, h);
  }
  function door(c, x, y, w, h, T, col, glass) {
    rr4(c, x, y, w, h, w * 0.3, w * 0.3, 0, 0); c.fillStyle = glass ? '#8fd3ff' : (col || '#a8703f'); c.fill();
    c.lineWidth = Math.max(1, T * 0.04); c.strokeStyle = OUT; c.stroke();
    if (glass) { c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x + w * 0.2, y + h * 0.2, w * 0.15, h * 0.6); c.fillStyle = OUT; c.fillRect(x + w / 2 - T * 0.015, y + h * 0.1, T * 0.03, h * 0.9); }
    else { C(c, x + w * 0.78, y + h * 0.58, T * 0.04); c.fillStyle = '#ffd23f'; c.fill(); }
  }
  function roof(c, x0, y0, x1, y1, T, col, colD, stripes) {
    c.beginPath(); c.moveTo(x0 + T * 0.3, y0); c.lineTo(x1 - T * 0.3, y0); c.lineTo(x1, y1); c.lineTo(x0, y1); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = Math.max(1, T * 0.045); c.strokeStyle = OUT; c.stroke();
    c.save(); c.clip();
    c.strokeStyle = colD; c.lineWidth = Math.max(1, T * 0.04);
    for (var yy = y0 + T * 0.25; yy < y1; yy += T * 0.28) { c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); c.stroke(); }
    if (stripes) { c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x0, y0, x1 - x0, T * 0.14); }
    c.restore();
  }
  WA.building = function (T, kind, v) {
    var B = BUILD[kind];
    v = v || {};
    var key = 'b_' + kind + '_' + (v.roof || '') + (v.col || '') + (v.door || 0);
    return cached(key, B.w * T + T * 0.4, (B.h + B.top) * T + T * 0.2, function (c) {
      var ox = T * 0.2, oy = B.top * T, W = B.w * T, Hh = B.h * T;
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.fillStyle = 'rgba(20,50,20,0.22)'; E(c, ox + W / 2, oy + Hh - T * 0.02, W * 0.52, T * 0.18); c.fill();
      var dx = (v.door === undefined ? 1 : v.door);
      if (kind === 'house') {
        var rc = v.roof || '#ff6a5e';
        rr(c, ox + T * 0.15, oy + T * 1.1, W - T * 0.3, Hh - T * 1.1, T * 0.06); c.fillStyle = '#fff6e6'; c.fill(); c.lineWidth = Math.max(1, T * 0.045); c.strokeStyle = OUT; c.stroke();
        c.fillStyle = '#ecdcc0'; c.fillRect(ox + T * 0.17, oy + Hh - T * 0.3, W - T * 0.34, T * 0.25);
        roof(c, ox - T * 0.1, oy - B.top * T + T * 0.1, ox + W + T * 0.1, oy + T * 1.3, T, rc, Art.shade(rc, -0.25), true);
        rr(c, ox + W * 0.72, oy - B.top * T + T * 0.05, T * 0.35, T * 0.55, T * 0.04); c.fillStyle = '#b05a4a'; c.fill(); c.stroke();
        for (var wi = 0; wi < B.w; wi++) if (wi !== dx) window2(c, ox + wi * T + T * 0.2, oy + T * 1.45, T * 0.6, T * 0.55, T);
        door(c, ox + dx * T + T * 0.2, oy + Hh - T * 0.95, T * 0.6, T * 0.92, T, v.col || '#a8703f');
      } else if (kind === 'lab') {
        rr(c, ox + T * 0.1, oy + T * 0.9, W - T * 0.2, Hh - T * 0.9, T * 0.06); c.fillStyle = '#f7fbff'; c.fill(); c.lineWidth = Math.max(1, T * 0.045); c.strokeStyle = OUT; c.stroke();
        rr(c, ox - T * 0.1, oy - B.top * T + T * 0.2, W + T * 0.2, T * 1.3, T * 0.12); c.fillStyle = '#7d8fae'; c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(ox - T * 0.05, oy - B.top * T + T * 0.28, W + T * 0.1, T * 0.16);
        // satellite dish
        c.save(); c.translate(ox + W * 0.82, oy - B.top * T + T * 0.15); c.rotate(-0.5);
        c.beginPath(); c.arc(0, 0, T * 0.32, 0, PI); c.closePath(); c.fillStyle = '#dfe6ef'; c.fill(); c.stroke();
        c.restore();
        for (wi = 0; wi < B.w; wi++) if (wi !== dx) window2(c, ox + wi * T + T * 0.15, oy + T * 1.25, T * 0.7, T * 0.6, T);
        door(c, ox + dx * T + T * 0.15, oy + Hh - T * 0.95, T * 0.7, T * 0.92, T, null, true);
        rr(c, ox + W * 0.3, oy + T * 0.75, W * 0.4, T * 0.36, T * 0.05); c.fillStyle = '#ffffff'; c.fill(); c.stroke();
        Art.pixelText(c, 'LAB', ox + W / 2, oy + T * 0.93, Math.max(1, T * 0.045), '#3d6fb0', 'center');
      } else if (kind === 'center' || kind === 'mart') {
        var ctr = kind === 'center', rcol = ctr ? '#ff5a6a' : '#4f8dff';
        rr(c, ox + T * 0.1, oy + T * 1.0, W - T * 0.2, Hh - T * 1.0, T * 0.06); c.fillStyle = '#fffaf2'; c.fill(); c.lineWidth = Math.max(1, T * 0.045); c.strokeStyle = OUT; c.stroke();
        roof(c, ox - T * 0.1, oy - B.top * T + T * 0.1, ox + W + T * 0.1, oy + T * 1.15, T, rcol, Art.shade(rcol, -0.25), true);
        c.fillStyle = rcol; c.fillRect(ox + T * 0.12, oy + Hh - T * 0.35, W - T * 0.24, T * 0.3);
        for (wi = 0; wi < B.w; wi++) if (Math.abs(wi - dx) > 0) window2(c, ox + wi * T + T * 0.18, oy + T * 1.3, T * 0.64, T * 0.55, T);
        door(c, ox + dx * T + T * 0.08, oy + Hh - T * 1.05, T * 0.84, T * 1.02, T, null, true);
        // the sign on the roof
        var sx = ox + W / 2, sy = oy - B.top * T + T * 0.62;
        rr(c, sx - T * 1.15, sy - T * 0.3, T * 2.3, T * 0.6, T * 0.12); c.fillStyle = '#ffffff'; c.fill(); c.stroke();
        if (ctr) { Art.capsule(c, sx - T * 0.8, sy, T * 0.18, 1, 0); Art.pixelText(c, 'CENTER', sx + T * 0.22, sy, Math.max(1, T * 0.04), '#e23b4b', 'center'); }
        else { Art.pixelText(c, 'MART', sx, sy, Math.max(1, T * 0.07), '#2f6fe0', 'center'); }
      } else if (kind === 'gym') {
        var gc = v.roof || '#45c25a';
        rr(c, ox + T * 0.1, oy + T * 0.6, W - T * 0.2, Hh - T * 0.6, T * 0.08); c.fillStyle = Art.shade(gc, 0.75); c.fill(); c.lineWidth = Math.max(1, T * 0.05); c.strokeStyle = OUT; c.stroke();
        c.fillStyle = Art.shade(gc, 0.55); c.fillRect(ox + T * 0.12, oy + Hh - T * 0.5, W - T * 0.24, T * 0.45);
        // big domed roof
        c.beginPath(); c.moveTo(ox - T * 0.1, oy + T * 0.95); c.quadraticCurveTo(ox + W / 2, oy - B.top * T - T * 0.6, ox + W + T * 0.1, oy + T * 0.95); c.closePath();
        c.fillStyle = gc; c.fill(); c.stroke();
        c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,0.22)'; E(c, ox + W * 0.35, oy - T * 0.1, W * 0.3, T * 0.3, -0.2); c.fill(); c.restore();
        // pillars and the arched entrance
        for (var pi = 0; pi < 2; pi++) { var px = ox + (pi ? W - T * 0.75 : T * 0.4); rr(c, px, oy + T * 1.0, T * 0.35, Hh - T * 1.05, T * 0.05); c.fillStyle = '#ffffff'; c.fill(); c.stroke(); }
        var ax = ox + dx * T, aw = T * 2;
        rr4(c, ax - T * 0.5 + T * 0.5, oy + Hh - T * 1.5, aw - T, T * 1.48, T * 0.5, T * 0.5, 0, 0); c.fillStyle = '#3b3044'; c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,240,180,0.35)'; c.fillRect(ax + T * 0.15, oy + Hh - T * 0.5, aw - T * 1.3, T * 0.48);
        // emblem
        var ex = ox + W / 2, ey = oy + T * 0.55;
        C(c, ex, ey, T * 0.5); c.fillStyle = '#ffffff'; c.fill(); c.stroke();
        if (v.badge) Art.badge(c, v.badge, ex, ey, T * 0.36, true);
        rr(c, ox + T * 0.6, oy + T * 1.15, T * 1.0, T * 0.45, T * 0.06); c.fillStyle = '#ffffff'; c.fill(); c.stroke();
        Art.pixelText(c, 'GYM', ox + T * 1.1, oy + T * 1.38, Math.max(1, T * 0.05), Art.shade(gc, -0.35), 'center');
      } else if (kind === 'league') {
        rr(c, ox + T * 0.1, oy + T * 1.2, W - T * 0.2, Hh - T * 1.2, T * 0.08); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = Math.max(1, T * 0.05); c.strokeStyle = OUT; c.stroke();
        c.beginPath(); c.moveTo(ox - T * 0.2, oy + T * 1.3); c.lineTo(ox + W / 2, oy - B.top * T + T * 0.1); c.lineTo(ox + W + T * 0.2, oy + T * 1.3); c.closePath();
        c.fillStyle = '#ffd23f'; c.fill(); c.stroke();
        c.fillStyle = '#ffe98a'; c.beginPath(); c.moveTo(ox + T * 0.6, oy + T * 1.1); c.lineTo(ox + W / 2, oy - B.top * T + T * 0.6); c.lineTo(ox + W / 2, oy + T * 1.1); c.closePath(); c.fill();
        for (pi = 0; pi < 4; pi++) { var lx = ox + T * 0.6 + pi * (W - T * 1.6) / 3; rr(c, lx, oy + T * 1.4, T * 0.4, Hh - T * 1.45, T * 0.06); c.fillStyle = '#eef3fa'; c.fill(); c.stroke(); }
        door(c, ox + dx * T + T * 0.05, oy + Hh - T * 1.25, T * 0.9, T * 1.22, T, '#3d8bff');
        Art.star5(c, ox + W / 2, oy + T * 0.25, T * 0.4, 0.45); c.fillStyle = '#ff4d5e'; c.fill(); c.stroke();
        for (pi = 0; pi < 2; pi++) { var fx = ox + (pi ? W - T * 0.3 : T * 0.3); c.fillStyle = '#8a7a6a'; c.fillRect(fx - T * 0.03, oy - T * 0.9, T * 0.06, T * 1.6); c.fillStyle = pi ? '#3d8bff' : '#ff4d5e'; c.beginPath(); c.moveTo(fx, oy - T * 0.9); c.lineTo(fx + (pi ? -1 : 1) * T * 0.5, oy - T * 0.75); c.lineTo(fx, oy - T * 0.6); c.closePath(); c.fill(); }
      } else if (kind === 'cave') {
        c.beginPath(); c.moveTo(ox - T * 0.1, oy + Hh); c.quadraticCurveTo(ox - T * 0.05, oy - B.top * T, ox + W / 2, oy - B.top * T + T * 0.05); c.quadraticCurveTo(ox + W + T * 0.05, oy - B.top * T, ox + W + T * 0.1, oy + Hh); c.closePath();
        c.fillStyle = G.caveWL; c.fill(); c.lineWidth = Math.max(1, T * 0.05); c.strokeStyle = OUT; c.stroke();
        c.fillStyle = G.caveW; E(c, ox + W * 0.3, oy + T * 0.2, T * 0.5, T * 0.25); c.fill();
        rr4(c, ox + dx * T + T * 0.08, oy + Hh - T * 1.25, T * 0.84, T * 1.25, T * 0.42, T * 0.42, 0, 0); c.fillStyle = '#241c2a'; c.fill(); c.stroke();
      } else if (kind === 'tower') {
        rr(c, ox + T * 0.3, oy - B.top * T + T * 0.4, W - T * 0.6, Hh + B.top * T - T * 0.4, T * 0.15); c.fillStyle = '#e8eef7'; c.fill(); c.lineWidth = Math.max(1, T * 0.05); c.strokeStyle = OUT; c.stroke();
        for (var ty = 0; ty < 4; ty++) { c.fillStyle = 'rgba(120,140,170,0.25)'; c.fillRect(ox + T * 0.32, oy - B.top * T + T * (0.9 + ty * 0.9), W - T * 0.64, T * 0.08); }
        rr(c, ox + T * 0.1, oy - B.top * T + T * 0.2, W - T * 0.2, T * 0.4, T * 0.1); c.fillStyle = '#9fc6ff'; c.fill(); c.stroke();
        rr4(c, ox + dx * T + T * 0.1, oy + Hh - T * 1.3, T * 0.8, T * 1.28, T * 0.4, T * 0.4, 0, 0); c.fillStyle = '#3b3044'; c.fill(); c.stroke();
        Art.star5(c, ox + W / 2, oy - B.top * T + T * 1.1, T * 0.28, 0.45); c.fillStyle = '#3e7bff'; c.fill(); c.stroke();
      } else if (kind === 'gate') {
        rr(c, ox + T * 0.05, oy + T * 0.3, W - T * 0.1, Hh - T * 0.3, T * 0.06); c.fillStyle = '#f2ead8'; c.fill(); c.lineWidth = Math.max(1, T * 0.045); c.strokeStyle = OUT; c.stroke();
        roof(c, ox - T * 0.1, oy - B.top * T + T * 0.05, ox + W + T * 0.1, oy + T * 0.55, T, '#5aa36a', '#3f7f4f', true);
        door(c, ox + dx * T + T * 0.15, oy + Hh - T * 1.05, T * 0.7, T * 1.02, T, null, true);
      }
    });
  };

  // ---- walking trainers ---------------------------------------------------------------------
  // feet at (x, y); s = scale (a tile is ~32 units); dir 0 down, 1 left, 2 right, 3 up; ph = stride 0..1
  Art.walker = function (c, look, x, y, s, dir, ph, o) {
    o = o || {};
    var H = Art.helpers;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.lineJoin = 'round'; c.lineCap = 'round';
    var mv = o.moving ? 1 : 0, sw = mv ? sin(ph * TAU) : 0;
    var bob = mv ? -Math.abs(sin(ph * TAU)) * 1.6 : sin((o.t || 0) * 2.2) * 0.4;
    if (!o.noShadow) { H.E(c, 0, -1.5, 9.5, 3); c.fillStyle = 'rgba(30,40,20,0.25)'; c.fill(); }
    c.translate(0, bob - (o.lift || 0));
    var lw = 1.7, skin = look.skin, hair = look.hair, shirt = look.shirt, pants = look.pants;
    function st(col) { c.fillStyle = col; c.fill(); c.lineWidth = lw; c.strokeStyle = OUT; c.stroke(); }
    var side = dir === 1 || dir === 2;
    if (dir === 1) c.scale(-1, 1);
    // legs
    if (!side) {
      var l1 = sw > 0 ? sw * 3 : 0, l2 = sw < 0 ? -sw * 3 : 0;
      rr(c, -6, -11, 5, 10 - l1, 2); st(pants); rr(c, 1, -11, 5, 10 - l2, 2); st(pants);
      H.E(c, -3.5, -1.5 - l1, 3.2, 2); st('#3a2a2a'); H.E(c, 3.5, -1.5 - l2, 3.2, 2); st('#3a2a2a');
    } else {
      var a1 = sw * 4, a2 = -sw * 4;
      rr(c, -2.5 + a2, -11, 5, 10, 2); st(Art.shade(pants, -0.25)); H.E(c, a2 + 1, -1.5, 3.4, 2); st('#3a2a2a');
      rr(c, -2.5 + a1, -11, 5, 10, 2); st(pants); H.E(c, a1 + 1, -1.5, 3.4, 2); st('#3a2a2a');
    }
    // body
    if (dir === 3 && look.pack !== null) { rr(c, -7, -22, 14, 12, 3); st(look.pack || '#ffd23f'); }
    if (look.long && !side) { /* skirts/coats */ }
    rr(c, side ? -6 : -8, -22, side ? 12 : 16, 13, 4); st(shirt);
    if (look.coat) { c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(-0.6, -21, 1.2, 11); }
    if (dir === 0) { H.E(c, 0, -18, 3, 3.5); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fill(); }
    if (side) {
      if (look.pack !== null) { rr(c, -9.5, -21, 5, 10, 2); st(look.pack || '#ffd23f'); }
      var arm = -sw * 3;
      H.E(c, 0.5 + arm, -15, 2.8, 5.2); st(shirt); H.C(c, 0.8 + arm * 1.3, -10.5, 2.4); st(skin);
    } else {
      var ay = sw * 1.2;
      H.E(c, -9.5, -15 + ay, 2.6, 5); st(shirt); H.C(c, -9.8, -10.5 + ay, 2.3); st(skin);
      H.E(c, 9.5, -15 - ay, 2.6, 5); st(shirt); H.C(c, 9.8, -10.5 - ay, 2.3); st(skin);
    }
    // head
    var hy = -32, R = 11.5;
    if ((look.style === 'long' || look.style === 'twin') && dir !== 3) {
      c.beginPath(); c.moveTo(-12, hy - 2); c.lineTo(-12.5, hy + 13); c.quadraticCurveTo(0, hy + 16, 12.5, hy + 13); c.lineTo(12, hy - 2); c.closePath(); st(hair);
    }
    if (dir === 3) {
      if (look.style === 'long') { c.beginPath(); c.moveTo(-12, hy); c.lineTo(-12, hy + 14); c.quadraticCurveTo(0, hy + 17, 12, hy + 14); c.lineTo(12, hy); c.closePath(); st(hair); }
      H.C(c, 0, hy, R); st(hair);
      if (look.style === 'twin') { H.C(c, -12.5, hy + 2, 4.5); st(hair); H.C(c, 12.5, hy + 2, 4.5); st(hair); }
      if (look.style === 'bun') { H.C(c, 0, hy - 11, 5); st(hair); }
    } else if (side) {
      H.C(c, 0, hy, R); st(skin);
      // hair covers the back and top of the head
      c.beginPath(); c.arc(0, hy, R, PI * 0.55, PI * 1.85); c.quadraticCurveTo(2, hy - 6, -1, hy - 2); c.quadraticCurveTo(-4, hy + 4, -6, hy + 9); c.closePath(); st(hair);
      if (look.style === 'spiky') { c.beginPath(); c.moveTo(-10, hy - 6); c.lineTo(-15, hy - 9); c.lineTo(-9, hy - 10); c.lineTo(-12, hy - 15); c.lineTo(-4, hy - 12); c.closePath(); st(hair); }
      if (look.style === 'bun') { H.C(c, -4, hy - 11, 4.5); st(hair); }
      if (look.style === 'twin') { H.C(c, -10, hy + 4, 4.5); st(hair); }
      if (look.style === 'long') { c.beginPath(); c.moveTo(-6, hy + 6); c.lineTo(-11, hy + 14); c.lineTo(-3, hy + 13); c.closePath(); st(hair); }
      H.E(c, 5.5, hy + 1, 1.5, 2.2); c.fillStyle = OUT; c.fill();
      H.C(c, 5.1, hy, 0.6); c.fillStyle = '#fff'; c.fill();
      H.E(c, 6, hy + 5, 2.2, 1.3); c.fillStyle = 'rgba(255,120,140,0.5)'; c.fill();
      if (look.glasses) { c.lineWidth = 1.3; c.strokeStyle = OUT; H.C(c, 5.5, hy + 1, 3.4); c.stroke(); }
    } else {
      H.C(c, 0, hy, R); st(skin);
      if (look.style === 'spiky') { c.beginPath(); c.moveTo(-11.5, hy - 1); c.lineTo(-12, hy - 9); c.lineTo(-6, hy - 6); c.lineTo(-3, hy - 13); c.lineTo(1, hy - 6); c.lineTo(6, hy - 13); c.lineTo(7, hy - 6); c.lineTo(12, hy - 9); c.lineTo(11.5, hy - 1); c.quadraticCurveTo(6, hy - 5, 0, hy - 4); c.quadraticCurveTo(-6, hy - 5, -11.5, hy - 1); c.closePath(); st(hair); }
      else { c.beginPath(); c.arc(0, hy, R, PI * 1.02, PI * 1.98); c.quadraticCurveTo(6, hy - 3, 0, hy - 4.5); c.quadraticCurveTo(-6, hy - 3, -R, hy - 1); c.closePath(); st(hair); }
      if (look.style === 'bun') { H.C(c, 0, hy - 12, 5); st(hair); }
      if (look.style === 'twin') { H.C(c, -13, hy + 1, 4.5); st(hair); H.C(c, 13, hy + 1, 4.5); st(hair); }
      var blink = ((o.t || 0) % 3.6) < 0.12;
      if (blink) { c.lineWidth = 1.5; c.strokeStyle = OUT; c.beginPath(); c.moveTo(-6, hy + 1.5); c.lineTo(-2.6, hy + 1.5); c.moveTo(2.6, hy + 1.5); c.lineTo(6, hy + 1.5); c.stroke(); }
      else { H.E(c, -4.2, hy + 1.5, 1.6, 2.3); c.fillStyle = OUT; c.fill(); H.E(c, 4.2, hy + 1.5, 1.6, 2.3); c.fill(); H.C(c, -4.7, hy + 0.6, 0.6); c.fillStyle = '#fff'; c.fill(); H.C(c, 3.7, hy + 0.6, 0.6); c.fill(); }
      H.E(c, -7, hy + 5.5, 2.2, 1.3); c.fillStyle = 'rgba(255,120,140,0.5)'; c.fill(); H.E(c, 7, hy + 5.5, 2.2, 1.3); c.fill();
      c.lineWidth = 1.2; c.strokeStyle = OUT; c.beginPath(); c.moveTo(-1.6, hy + 6.5); c.quadraticCurveTo(0, hy + 7.8, 1.6, hy + 6.5); c.stroke();
      if (look.glasses) { c.lineWidth = 1.2; H.C(c, -4.2, hy + 1.5, 3.3); c.stroke(); H.C(c, 4.2, hy + 1.5, 3.3); c.stroke(); }
    }
    // headwear
    var cs = look.capStyle;
    if (look.cap && cs === 'straw') {
      H.E(c, 0, hy - 4, 16, 4.5); st(look.cap); c.beginPath(); c.arc(0, hy - 5, 9, PI, TAU); c.closePath(); st(look.cap);
      c.fillStyle = look.band || '#ff4d5e'; c.fillRect(-9, hy - 7, 18, 2.4);
    } else if (look.cap && cs === 'witch') {
      H.E(c, 0, hy - 6, 15, 3.5); st(look.cap); c.beginPath(); c.moveTo(-8, hy - 7); c.lineTo(3, hy - 26); c.lineTo(8, hy - 7); c.closePath(); st(look.cap);
    } else if (look.cap && cs === 'crown') {
      c.beginPath(); c.moveTo(-8, hy - 8); c.lineTo(-9, hy - 17); c.lineTo(-4, hy - 12); c.lineTo(0, hy - 19); c.lineTo(4, hy - 12); c.lineTo(9, hy - 17); c.lineTo(8, hy - 8); c.closePath(); st('#ffd23f');
    } else if (look.cap && cs === 'nurse') {
      c.beginPath(); c.moveTo(-7, hy - 8); c.lineTo(-6, hy - 14); c.lineTo(6, hy - 14); c.lineTo(7, hy - 8); c.closePath(); st('#ffffff');
      c.fillStyle = '#ff4d5e'; c.fillRect(-1, hy - 13, 2, 4); c.fillRect(-2, hy - 12, 4, 2);
    } else if (look.cap && cs === 'beanie') {
      c.beginPath(); c.arc(0, hy - 2, R + 0.5, PI, TAU); c.closePath(); st(look.cap); H.C(c, 0, hy - 14, 3); st('#ffffff');
    } else if (look.cap) {
      c.beginPath(); c.arc(0, hy - 2, R + 0.5, PI, TAU); c.closePath(); st(look.cap);
      if (dir === 0) { H.E(c, 0, hy - 2, 12.5, 3.2); st(look.cap); H.C(c, 0, hy - 8, 2.6); st('#ffffff'); }
      else if (side) { c.beginPath(); c.moveTo(4, hy - 4); c.quadraticCurveTo(14, hy - 4.5, 16, hy - 1.5); c.lineTo(5, hy - 1); c.closePath(); st(look.cap); }
      else { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-4, hy - 4, 8, 2); }
    }
    c.restore();
  };

  // little speech-bubble emotes over a walker's head
  WA.emote = function (c, kind, x, y, T, k) {
    var s = T / 32, sc = k < 0.25 ? 0.4 + k / 0.25 * 0.75 : k < 0.35 ? 1.15 - (k - 0.25) : 1.05;
    c.save(); c.translate(x, y); c.scale(s * sc, s * sc);
    rr(c, -8, -20, 16, 18, 4); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(-3, -2.5); c.lineTo(0, 3); c.lineTo(3, -2.5); c.closePath(); c.fillStyle = '#ffffff'; c.fill(); c.stroke();
    c.fillStyle = '#ffffff'; c.fillRect(-2.6, -3.5, 5.2, 2);
    if (kind === '!') { c.fillStyle = '#ff3b4b'; rr(c, -1.8, -17, 3.6, 9, 1.5); c.fill(); C(c, 0, -5.8, 1.9); c.fill(); }
    else if (kind === '?') Art.pixelText(c, '?', 0, -11, 1.6, '#3d8bff', 'center');
    else if (kind === 'heart') { c.fillStyle = '#ff5a8a'; c.beginPath(); c.moveTo(0, -5.5); c.bezierCurveTo(-8, -11, -4, -18, 0, -13.5); c.bezierCurveTo(4, -18, 8, -11, 0, -5.5); c.fill(); }
    else if (kind === 'note') { c.fillStyle = '#1d4fb0'; C(c, -2.5, -7.5, 2.4); c.fill(); c.fillRect(-0.6, -17, 1.6, 9.5); c.fillRect(-0.6, -17, 5, 2); }
    else if (kind === 'dots') { c.fillStyle = OUT; for (var i = 0; i < 3; i++) { C(c, -4.5 + i * 4.5, -11, 1.4); c.fill(); } }
    else if (kind === 'zzz') Art.pixelText(c, 'Z', 0, -11, 1.4, '#5a6170', 'center');
    else if (kind === 'sweat') { c.fillStyle = '#58c4ff'; c.beginPath(); c.moveTo(0, -18); c.quadraticCurveTo(5, -9, 0, -6); c.quadraticCurveTo(-5, -9, 0, -18); c.fill(); }
    c.restore();
  };
})(typeof window !== 'undefined' ? window : globalThis);
