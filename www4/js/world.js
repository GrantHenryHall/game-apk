/* Critter Arena 4 — the overworld: walk the Sunshine Region tile by tile.
 * Tap to walk (or hold to steer), your lead critter follows you, trainers spot you,
 * tall grass hides wild critters, doors lead into houses, centers, marts and gyms. */
(function (root) {
  var CA = root.CA, Art = CA.Art, WA = CA.WorldArt, SP = CA.SPECIES;
  var TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos;
  var DX = [0, -1, 1, 0], DY = [1, 0, 0, -1];               // 0 down, 1 left, 2 right, 3 up
  function dirOf(dx, dy) { return dy > 0 ? 0 : dx < 0 ? 1 : dx > 0 ? 2 : 3; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var WALK_SPEED = 4.6, NPC_SPEED = 3.4, CHUNK = 8;

  function World(canvas, api) {
    this.cv = canvas; this.c = canvas.getContext('2d'); this.api = api;
    this.t = 0; this.map = null; this.npcs = []; this.fx = [];
    this.p = { x: 0, y: 0, px: 0, py: 0, dir: 0, mv: null, ph: 0, path: [], steps: 0, sinceBattle: 99, onArrive: null };
    this.f = { x: 0, y: 0, px: 0, py: 0, dir: 0, mv: null, ph: 0, hidden: true };
    this.dlg = null; this.menu = null; this.fade = null; this.trans = null; this.popup = null;
    this.hold = null; this.lock = 0; this.clouds = [];
    for (var i = 0; i < 3; i++) this.clouds.push({ x: Math.random() * 30, y: Math.random() * 40, s: 2.5 + Math.random() * 2, v: 0.25 + Math.random() * 0.2 });
  }
  CA.World = World;
  var P = World.prototype;

  // ---------------------------------------------------------------------------------------------
  // layout
  P.resize = function (W, Hh, dpr) {
    this.W = W; this.H = Hh; this.dpr = dpr;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(Hh * dpr);
    this.cv.style.width = W + 'px'; this.cv.style.height = Hh + 'px';
    var T = clamp(Math.min(W / 10.5, Hh / 16.5), 30, 66);
    this.Td = Math.round(T * dpr); this.T = this.Td / dpr;
    this.u = clamp(Math.min(W / 412, Hh / 915), 1, 1.7);
    WA.setTile(this.Td);
    if (this.map) this.map.chunks = {};
  };

  // ---------------------------------------------------------------------------------------------
  // maps
  P.load = function (id, x, y, dir, opts) {
    opts = opts || {};
    var def = CA.WORLD.get(id, this.api.save());
    var M = { id: id, def: def, name: def.name, w: def.rows[0].length, h: def.rows.length, rows: def.rows, theme: def.theme || null,
      indoor: !!def.indoor, gym: !!def.gym, wallDeco: !!def.indoor, shore: def.shore, sandBase: def.sandBase, heal: def.kind === 'center', ground: def.ground || null, chunks: {}, chunkOrder: [] };
    M.at = function (tx, ty) { tx = tx < 0 ? 0 : tx >= M.w ? M.w - 1 : tx; ty = ty < 0 ? 0 : ty >= M.h ? M.h - 1 : ty; return M.rows[ty].charAt(tx); };
    M.solid = new Uint8Array(M.w * M.h);
    M.doors = {}; M.sprites = []; M.buildings = [];
    for (var ty = 0; ty < M.h; ty++) for (var tx = 0; tx < M.w; tx++) {
      var ch = M.rows[ty].charAt(tx);
      if (!WA.walkable(ch)) M.solid[ty * M.w + tx] = 1;
      if (ch === 'T' || ch === 'P' || ch === 'A' || ch === 'b' || ch === 'r' || ch === 'n' || ch === 'F') M.sprites.push({ x: tx, y: ty, k: ch });
    }
    var self = this, sv = this.api.save();
    (def.buildings || []).forEach(function (b, bi) {
      var B = WA.BUILD[b.kind];
      for (var by = 0; by < B.h; by++) for (var bx = 0; bx < B.w; bx++) M.solid[(b.y + by) * M.w + b.x + bx] = 1;
      var door = b.door === undefined ? 1 : b.door;
      M.doors[(b.x + door) + ',' + (b.y + B.h - 1)] = { b: b, bi: bi };
      M.buildings.push({ b: b, B: B });
    });
    M.signs = {};
    (def.signs || []).forEach(function (s) { M.signs[s.x + ',' + s.y] = s; M.solid[s.y * M.w + s.x] = 1; });
    M.items = [];
    (def.items || []).forEach(function (it) { if (!self.flag(it.id)) { M.items.push(it); M.solid[it.y * M.w + it.x] = 1; } });
    this.map = M;
    // people and critters on this map
    this.npcs = [];
    (def.npcs || []).forEach(function (n) {
      if (n.hideIf && self.flag(n.hideIf)) return;
      if (n.showIf && !self.flag(n.showIf)) return;
      if (n.needChamp && !(sv && sv.champion)) return;
      var nx = n.x, ny = n.y, nd = n.dir || 0;
      if (n.moveIf && self.flag(n.moveIf[0])) { nx = n.moveIf[1]; ny = n.moveIf[2]; nd = n.moveIf[3] || nd; }
      self.npcs.push({ d: n, x: nx, y: ny, px: nx, py: ny, dir: nd, mv: null, ph: 0, homeX: nx, homeY: ny, wanderT: 1 + Math.random() * 3, emote: null, path: [], t0: Math.random() * 9 });
    });
    var p = this.p;
    p.x = p.px = x; p.y = p.py = y; p.dir = dir === undefined ? p.dir : dir; p.mv = null; p.path = []; this.hold = null;
    this.placeFollower();
    this.fx = [];
    if (!opts.quiet) {
      this.api.music(def.music || (M.indoor ? 'town' : 'route'));
      if (def.name && (!opts.prevName || opts.prevName !== def.name)) this.popup = { s: def.name, t: 0 };
    }
    var sv2 = this.api.save();
    if (sv2) { sv2.pos = { map: id, x: x, y: y, dir: p.dir }; if (!M.indoor && def.kind !== 'gym') sv2.lastOut = { map: id, x: x, y: y }; }
  };

  P.flag = function (k) { var sv = this.api.save(); return !!(sv && sv.flags && sv.flags[k]); };
  P.setFlag = function (k) { var sv = this.api.save(); if (!sv) return; sv.flags = sv.flags || {}; sv.flags[k] = 1; };

  P.placeFollower = function () {
    var f = this.f, p = this.p, id = this.api.lead();
    f.id = id;
    var bx = p.x - DX[p.dir], by = p.y - DY[p.dir];
    if (id && this.free(bx, by, true)) { f.x = f.px = bx; f.y = f.py = by; f.hidden = false; }
    else { f.x = f.px = p.x; f.y = f.py = p.y; f.hidden = true; }
    f.mv = null; f.dir = p.dir;
  };

  P.inb = function (x, y) { return x >= 0 && y >= 0 && x < this.map.w && y < this.map.h; };
  P.npcAt = function (x, y) {
    for (var i = 0; i < this.npcs.length; i++) {
      var n = this.npcs[i];
      if ((n.x === x && n.y === y) || (n.mv && n.mv.tx === x && n.mv.ty === y)) return n;
    }
    return null;
  };
  // walkable and nobody standing there (the follower never blocks you)
  P.free = function (x, y, ignorePlayer) {
    var M = this.map;
    if (!this.inb(x, y) || M.solid[y * M.w + x]) return false;
    if (this.npcAt(x, y)) return false;
    var p = this.p;
    if (!ignorePlayer && ((p.x === x && p.y === y) || (p.mv && p.mv.tx === x && p.mv.ty === y))) return false;
    return true;
  };

  // ---------------------------------------------------------------------------------------------
  // pathfinding: BFS over walkable tiles, with one-way ledges and doors as destinations
  P.bfs = function (tx, ty, opts) {
    var M = this.map, w = M.w, h = M.h, st = this.cur();
    var prev = new Int32Array(w * h).fill(-2), q = [st[1] * w + st[0]];
    prev[q[0]] = -1;
    var best = -1, bestD = 1e9, goal = ty * w + tx;
    for (var qi = 0; qi < q.length; qi++) {
      var cur = q[qi], cx = cur % w, cy = (cur / w) | 0;
      if (cur === goal) { best = cur; bestD = 0; break; }
      if (opts && opts.near) {
        var d = Math.abs(cx - tx) + Math.abs(cy - ty);
        if (d < bestD) { bestD = d; best = cur; }
      }
      if ((M.doors[cx + ',' + cy] || M.rows[cy].charAt(cx) === 'D') && cur !== q[0]) continue;     // doors and exit mats end a path
      for (var k = 0; k < 4; k++) {
        var nx = cx + DX[k], ny = cy + DY[k];
        if (!this.inb(nx, ny)) continue;
        var ni = ny * w + nx;
        if (M.rows[ny].charAt(nx) === 'L' && k === 0) {
          // jump down a ledge
          var ly = ny + 1;
          if (ly < h && !M.solid[ly * w + nx] && !this.npcAt(nx, ly) && prev[ly * w + nx] === -2) { prev[ly * w + nx] = cur; q.push(ly * w + nx); }
          continue;
        }
        if (prev[ni] !== -2) continue;
        if (M.doors[nx + ',' + ny]) { if (k === 3) { prev[ni] = cur; q.push(ni); } continue; }
        if (M.solid[ni] || this.npcAt(nx, ny)) continue;
        prev[ni] = cur; q.push(ni);
      }
    }
    if (best < 0) return null;
    var path = [];
    for (var n2 = best; prev[n2] !== -1 && n2 >= 0; n2 = prev[n2]) path.push([n2 % w, (n2 / w) | 0]);
    return path.reverse();
  };

  // the tile the player stands on, or is stepping onto
  P.cur = function () { var p = this.p; return p.mv ? [p.mv.tx, p.mv.ty] : [p.x, p.y]; };

  // things you can talk to or inspect at a tile
  P.thingAt = function (x, y) {
    var n = this.npcAt(x, y);
    if (n) return { kind: 'npc', n: n, x: n.x, y: n.y };
    var f = this.f;
    if (f.id && !f.hidden && !f.mv && f.x === x && f.y === y) return { kind: 'follower', x: x, y: y };
    var M = this.map, key = x + ',' + y;
    if (M.signs[key]) return { kind: 'sign', s: M.signs[key], x: x, y: y };
    for (var i = 0; i < M.items.length; i++) if (M.items[i].x === x && M.items[i].y === y) return { kind: 'item', it: M.items[i], x: x, y: y };
    var ch = this.inb(x, y) ? M.rows[y].charAt(x) : '';
    if (ch === 'O') return { kind: 'pc', x: x, y: y };
    if (ch === 'X' && M.gym) return { kind: 'statue', x: x, y: y };
    if (ch === 'B') return { kind: 'books', x: x, y: y };
    if (ch === 'V') return { kind: 'tv', x: x, y: y };
    return null;
  };
  // where you can stand to interact with a thing: next to it, or across a counter
  P.approaches = function (x, y) {
    var out = [], M = this.map;
    for (var k = 0; k < 4; k++) {
      var ax = x + DX[k], ay = y + DY[k];
      if (!this.inb(ax, ay)) continue;
      if (M.rows[ay].charAt(ax) === 'K') { var bx = ax + DX[k], by = ay + DY[k]; if (this.inb(bx, by)) out.push([bx, by, 3 - k]); }
      else out.push([ax, ay, 3 - k]);
    }
    return out;
  };

  // ---------------------------------------------------------------------------------------------
  // input
  P.screenTile = function (sx, sy) {
    var Td = this.Td, dpr = this.dpr;
    return { x: Math.floor((sx * dpr + this.camX) / Td), y: Math.floor((sy * dpr + this.camY) / Td) };
  };
  P.down = function (sx, sy, id) {
    if (this.fade || this.trans) return;
    if (this.dlg) { this.dlgTap(sx, sy); return; }
    if (this.menu) { this.menuTap(sx, sy); return; }
    var mb = this.menuBtn;
    if (mb && sx >= mb.x - 6 && sx <= mb.x + mb.w + 6 && sy >= mb.y - 6 && sy <= mb.y + mb.h + 6) { if (!this.lock) this.openMenu(); return; }
    if (this.lock) return;
    var t = this.screenTile(sx, sy);
    this.hold = { id: id, sx: sx, sy: sy, t0: this.t, tile: t, steer: false };
    this.tapTo(t.x, t.y);
  };
  P.move = function (sx, sy, id) {
    var h = this.hold;
    if (!h || h.id !== id) return;
    h.sx = sx; h.sy = sy; h.tile = this.screenTile(sx, sy);
  };
  P.up = function (id) { if (this.hold && this.hold.id === id) this.hold = null; };

  P.tapTo = function (tx, ty) {
    var p = this.p, cur = this.cur(), M = this.map;
    p.onArrive = null;
    // tapping below a room heads for its exit mat
    if (M.indoor && M.def.exit && ty >= M.h) { tx = M.def.spawn[0]; ty = M.def.spawn[1]; }
    if (tx === cur[0] && ty === cur[1]) { if (M.rows[ty] && M.rows[ty].charAt(tx) === 'D' && M.def.exit) this.exitInterior(); return; }
    var thing = this.thingAt(tx, ty);
    if (thing) {
      var self = this, best = null;
      this.approaches(tx, ty).forEach(function (a) {
        if (a[0] === cur[0] && a[1] === cur[1]) { best = { path: [], a: a }; return; }
        if (!self.free(a[0], a[1], true)) return;
        var path = self.bfs(a[0], a[1]);
        if (path && path.length && path[path.length - 1][0] === a[0] && path[path.length - 1][1] === a[1] && (!best || path.length < best.path.length)) best = { path: path, a: a };
      });
      if (best) {
        p.path = best.path;
        p.onArrive = function () { p.dir = best.a[2]; self.interact(thing); };
        if (!best.path.length && !p.mv) { p.onArrive(); p.onArrive = null; }
        this.marker = { x: tx, y: ty, t: 0 };
        return;
      }
    }
    var path = this.bfs(tx, ty, { near: true });
    if (path) { p.path = path; this.marker = { x: tx, y: ty, t: 0 }; }
  };

  // ---------------------------------------------------------------------------------------------
  // movement
  P.tryMove = function (dir) {
    var p = this.p, M = this.map, nx = p.x + DX[dir], ny = p.y + DY[dir];
    p.dir = dir;
    if (M.rows[p.y].charAt(p.x) === 'D' && dir === 0 && M.def.exit) { this.exitInterior(); return false; }
    // walking off the edge of the map
    if (!this.inb(nx, ny)) { this.edge(dir); return false; }
    var key = nx + ',' + ny;
    if (M.doors[key] && dir === 3) { this.enterDoor(M.doors[key]); return false; }
    var ch = M.rows[ny].charAt(nx);
    if (ch === 'L' && dir === 0) {
      var ly = ny + 1;
      if (this.inb(nx, ly) && this.free(nx, ly)) { this.startMove(nx, ly, true); this.api.sfx('ledge'); return true; }
    }
    if (!this.free(nx, ny)) { this.bump(); return false; }
    this.startMove(nx, ny, false);
    return true;
  };
  P.bump = function () {
    var p = this.p;
    p.path = []; p.onArrive = null;
    if (this.t - (this.lastBump || 0) > 0.35) { this.api.sfx('bump'); this.lastBump = this.t; }
  };
  P.startMove = function (nx, ny, jump) {
    var p = this.p, f = this.f;
    var fromX = p.x, fromY = p.y;
    // long walks (or holding to steer for a while) break into a jog
    var run = !jump && (p.path.length >= 4 || (this.hold && this.hold.steer && this.t - this.hold.t0 > 1.1));
    p.run = run;
    p.mv = { fx: p.x, fy: p.y, tx: nx, ty: ny, t: 0, dur: (jump ? 2.2 : 1) / WALK_SPEED / (run ? 1.55 : 1), jump: jump };
    // the follower takes the tile you just left
    if (f.id) {
      if (f.hidden) { f.x = f.px = fromX; f.y = f.py = fromY; f.hidden = false; f.appear = 0; }
      else if (!(f.x === fromX && f.y === fromY)) {
        var fd = Math.abs(f.x - fromX) + Math.abs(f.y - fromY);
        f.mv = { fx: f.x, fy: f.y, tx: fromX, ty: fromY, t: 0, dur: p.mv.dur, jump: fd > 1 };
        f.dir = dirOf(fromX - f.x, fromY - f.y);
      }
    }
  };
  P.stepMover = function (o, dt) {
    var m = o.mv;
    m.t += dt;
    var k = Math.min(1, m.t / m.dur);
    o.px = m.fx + (m.tx - m.fx) * k; o.py = m.fy + (m.ty - m.fy) * k;
    o.lift = m.jump ? Math.sin(k * Math.PI) * 0.55 : 0;
    o.ph = (o.ph + dt * (m.jump ? 1.2 : 0.5 / m.dur)) % 1;     // one stride per tile, faster when jogging
    if (k >= 1) { o.x = m.tx; o.y = m.ty; o.px = o.x; o.py = o.y; o.mv = null; o.lift = 0; return true; }
    return false;
  };

  P.updatePlayer = function (dt) {
    var p = this.p;
    if (p.mv) {
      var jumped = p.mv.jump;
      if (this.stepMover(p, dt)) {
        if (jumped) this.puff(p.x, p.y);
        if (this.arrived()) return;
      } else return;
    }
    // hold to steer: keep walking toward your finger
    var h = this.hold;
    if (h && !this.lock && this.t - h.t0 > 0.28) {
      h.steer = true;
      var t = h.tile;
      if (!(t.x === p.x && t.y === p.y)) {
        var dx = t.x - p.x, dy = t.y - p.y, dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);
        p.path = []; p.onArrive = null;
        if (!this.tryMove(dir)) {
          // slide around small obstacles by trying the other axis
          var alt = Math.abs(dx) > Math.abs(dy) ? (dy < 0 ? 3 : dy > 0 ? 0 : -1) : (dx < 0 ? 1 : dx > 0 ? 2 : -1);
          if (alt >= 0 && !this.lock && !this.fade) { var ax = p.x + DX[alt], ay = p.y + DY[alt]; if (this.inb(ax, ay) && this.free(ax, ay)) this.tryMove(alt); }
        }
        return;
      }
    }
    if (p.path.length && !this.lock) {
      var nx = p.path[0];
      var ddx = clamp(nx[0] - p.x, -1, 1), ddy = clamp(nx[1] - p.y, -1, 1);
      p.path.shift();
      if (!ddx && !ddy) return;
      this.tryMove(dirOf(ddx, ddy));
      return;
    }
    if (!p.path.length && p.onArrive && !p.mv) { var fn = p.onArrive; p.onArrive = null; fn(); }
  };

  // after each step: exits, mats, grass, trainers, scripted events
  P.arrived = function () {
    var p = this.p, M = this.map, def = M.def;
    p.steps++; p.sinceBattle++;
    var sv = this.api.save();
    if (sv) { sv.pos = { map: M.id, x: p.x, y: p.y, dir: p.dir }; if (sv.repel > 0) { sv.repel--; if (sv.repel === 0) { this.say(['The REPEL wore off.']); } } }
    if (M.rows[p.y].charAt(p.x) === 'D' && def.exit) { this.exitInterior(); return true; }
    // keep walking off the edge where the map continues
    var e = (p.y === 0 && p.dir === 3) || (p.y === M.h - 1 && p.dir === 0) || (p.x === 0 && p.dir === 1) || (p.x === M.w - 1 && p.dir === 2);
    var ek = { 3: 'n', 0: 's', 1: 'w', 2: 'e' }[p.dir];
    if (e && def.conns && def.conns[ek]) { this.edge(p.dir); return true; }
    // scripted triggers
    var evs = def.events || [];
    for (var i = 0; i < evs.length; i++) {
      var ev = evs[i];
      if (p.x >= ev.x && p.x < ev.x + (ev.w || 1) && p.y >= ev.y && p.y < ev.y + (ev.h || 1) && !(ev.flag && this.flag(ev.flag)) && !(ev.need && !this.flag(ev.need))) {
        p.path = []; p.onArrive = null;
        if (CA.WORLD.scripts[ev.run]) CA.WORLD.scripts[ev.run](this, ev);
        return true;
      }
    }
    if (this.checkSight()) return true;
    var here = M.rows[p.y].charAt(p.x);
    if (here === ',' || (def.wildTiles && def.wildTiles.indexOf(here) >= 0)) {
      if (here === ',') this.rustle(p.x, p.y);
      if (def.wild && p.sinceBattle > 3 && !(sv && sv.repel > 0) && Math.random() < (def.rate || 0.1)) {
        p.path = []; p.onArrive = null; this.hold = null;
        this.wildEncounter();
        return true;
      }
    }
    return false;
  };

  P.edge = function (dir) {
    var M = this.map, def = M.def, p = this.p;
    var k = { 3: 'n', 0: 's', 1: 'w', 2: 'e' }[dir], cn = def.conns && def.conns[k];
    if (!cn) { this.bump(); return; }
    var to = CA.WORLD.get(cn.to, this.api.save()), tw = to.rows[0].length, th = to.rows.length;
    var nx = p.x, ny = p.y;
    if (k === 'n' || k === 's') { nx += cn.off || 0; ny = k === 'n' ? th - 1 : 0; }
    else { ny += cn.off || 0; nx = k === 'w' ? tw - 1 : 0; }
    var self = this, name = def.name;
    this.fadeTo(function () { self.load(cn.to, nx, ny, dir, { prevName: name }); self.api.persist(); });
  };
  P.enterDoor = function (d) {
    var M = this.map, b = d.b, self = this, p = this.p;
    if (b.locked && !(b.unlock && this.flag(b.unlock))) { this.say(b.locked); return; }
    var id = M.id + '#' + d.bi;
    var inner = CA.WORLD.get(id, this.api.save());
    this.api.sfx('door');
    p.path = []; p.onArrive = null;
    this.fadeTo(function () { self.load(id, inner.spawn[0], inner.spawn[1], 3); self.api.persist(); });
  };
  P.exitInterior = function () {
    var ex = this.map.def.exit, self = this, town = this.map.def.townName;
    this.api.sfx('door');
    // stepping back outside doesn't re-announce the town you were already in
    this.fadeTo(function () { self.load(ex.map, ex.x, ex.y, 0, { prevName: town }); self.api.persist(); });
  };
  P.warp = function (map, x, y, dir, cb) {
    var self = this;
    this.fadeTo(function () { self.load(map, x, y, dir === undefined ? 0 : dir); self.api.persist(); if (cb) cb(); });
  };

  // ---------------------------------------------------------------------------------------------
  // NPCs
  P.updateNpcs = function (dt) {
    var self = this;
    this.npcs.forEach(function (n) {
      if (n.mv) { if (self.stepMover(n, dt) && n.path.length) self.npcStep(n); return; }
      if (n.path.length) { self.npcStep(n); return; }
      if (n.emote) { n.emote.t += dt; if (n.emote.t > n.emote.d) n.emote = null; }
      if (self.lock || self.dlg) return;
      var d = n.d;
      if (d.wander) {
        n.wanderT -= dt;
        if (n.wanderT <= 0) {
          n.wanderT = 1.5 + Math.random() * 3;
          var dir = (Math.random() * 4) | 0, nx = n.x + DX[dir], ny = n.y + DY[dir];
          n.dir = dir;
          if (Math.abs(nx - n.homeX) + Math.abs(ny - n.homeY) <= d.wander && self.free(nx, ny) && !(self.f.x === nx && self.f.y === ny)) n.mv = { fx: n.x, fy: n.y, tx: nx, ty: ny, t: 0, dur: 1 / (d.critter ? 2.4 : NPC_SPEED) };
        }
      } else if (d.spin) {
        n.wanderT -= dt;
        if (n.wanderT <= 0) { n.wanderT = 1.6 + Math.random() * 2.5; n.dir = d.spin[(Math.random() * d.spin.length) | 0]; }
      }
      if (d.emotes && !n.emote && Math.random() < dt * 0.08) n.emote = { k: d.emotes[(Math.random() * d.emotes.length) | 0], t: 0, d: 1.8 };
    });
  };
  P.npcStep = function (n) {
    var nx = n.path[0];
    var dx = clamp(nx[0] - n.x, -1, 1), dy = clamp(nx[1] - n.y, -1, 1);
    // one axis at a time, never diagonally, until the waypoint is reached
    if (dx && dy) dy = 0;
    if (!dx && !dy) { n.path.shift(); return; }
    if (n.x + dx === nx[0] && n.y + dy === nx[1]) n.path.shift();
    n.dir = dirOf(dx, dy);
    n.mv = { fx: n.x, fy: n.y, tx: n.x + dx, ty: n.y + dy, t: 0, dur: 1 / NPC_SPEED };
  };
  P.trainerReady = function (n) {
    var d = n.d;
    return (d.kind === 'trainer' || d.kind === 'rival') && !this.flag(d.id) && d.sight;
  };
  // undefeated trainers spot you when you walk into their line of sight
  P.checkSight = function () {
    var p = this.p, M = this.map;
    for (var i = 0; i < this.npcs.length; i++) {
      var n = this.npcs[i];
      if (!this.trainerReady(n) || n.mv) continue;
      var dirs = n.d.look360 ? [0, 1, 2, 3] : [n.dir];
      for (var di = 0; di < dirs.length; di++) {
        var dir = dirs[di];
        for (var r = 1; r <= n.d.sight; r++) {
          var sx = n.x + DX[dir] * r, sy = n.y + DY[dir] * r;
          if (!this.inb(sx, sy)) break;
          if (sx === p.x && sy === p.y) { n.dir = dir; this.spotted(n); return true; }
          if (M.solid[sy * M.w + sx] || this.npcAt(sx, sy)) break;
        }
      }
    }
    return false;
  };
  P.spotted = function (n) {
    var self = this, p = this.p;
    p.path = []; p.onArrive = null; this.hold = null;
    this.lock++;
    n.emote = { k: '!', t: 0, d: 0.9 };
    this.api.sfx('spotted');
    this.api.music(n.d.kind === 'rival' ? 'rival' : 'trainer');
    setTimeout(function () {
      // walk straight up until adjacent
      var path = [], x = n.x, y = n.y;
      while (Math.abs(p.x - x) + Math.abs(p.y - y) > 1 && path.length < 12) { x += DX[n.dir]; y += DY[n.dir]; path.push([x, y]); }
      n.path = path;
      self.waitFor(function () { return !n.mv && !n.path.length; }, function () {
        p.dir = dirOf(n.x - p.x, n.y - p.y);
        n.dir = dirOf(p.x - n.x, p.y - n.y);
        self.lock--;
        self.challenge(n);
      });
    }, 850);
  };
  P.challenge = function (n) {
    var d = n.d, self = this;
    var lines = typeof d.say === 'function' ? d.say(this.api.save()) : (d.say || ['Let\'s battle!']);
    this.lock++;
    this.say(lines, function () {
      self.lock--;
      self.battleTrainer(n);
    });
  };

  P.waitFor = function (cond, cb) { this.waits = this.waits || []; this.waits.push({ cond: cond, cb: cb }); };

  // ---------------------------------------------------------------------------------------------
  // interactions
  P.interact = function (th) {
    var self = this, sv = this.api.save(), p = this.p;
    if (th.kind === 'npc') {
      var n = th.n, d = n.d;
      if (!d.critter && !d.legend) n.dir = dirOf(p.x - n.x, p.y - n.y);
      if (CA.WORLD.talk[d.kind]) { CA.WORLD.talk[d.kind](this, n); return; }
      if ((d.kind === 'trainer' || d.kind === 'rival') && !this.flag(d.id)) { this.challenge(n); return; }
      var lines = this.flag(d.id) && d.after ? d.after : d.lines;
      if (typeof lines === 'function') lines = lines(sv, this);
      if (d.critter) { this.api.cry(d.critter); n.emote = { k: 'heart', t: 0, d: 1.2 }; }
      this.say(lines || ['...']);
      return;
    }
    if (th.kind === 'sign') { this.say(typeof th.s.text === 'function' ? th.s.text(sv) : th.s.text); return; }
    if (th.kind === 'item') {
      var it = th.it, M = this.map;
      this.setFlag(it.id);
      M.items.splice(M.items.indexOf(it), 1); M.solid[it.y * M.w + it.x] = 0;
      this.api.give(it.item, it.n || 1);
      this.api.sfx('item');
      this.say([sv.name + ' found ' + CA.WORLD.itemName(it.item, it.n || 1) + '!']);
      this.api.persist();
      return;
    }
    if (th.kind === 'pc') { this.say([sv.name + ' booted up the PC.', 'Accessed the CRITTER STORAGE system.'], function () { self.api.menu('team'); }); return; }
    if (th.kind === 'statue') { var g = this.map.def; this.say([(g.leaderName || 'This') + '\'s GYM', 'Winning trainers: ' + (this.flag(g.leaderId) ? sv.name : '...')]); return; }
    if (th.kind === 'books') { this.say(['It\'s crammed with books about critters.', CA.WORLD.trivia[(Math.random() * CA.WORLD.trivia.length) | 0]]); return; }
    if (th.kind === 'tv') { this.say(['There\'s a movie on TV.', 'Four kids are walking along a railroad track... Better go too!']); return; }
    if (th.kind === 'follower') {
      // say hi to your partner
      var f = this.f, nm = SP[f.id].name.toUpperCase(), M2 = this.map;
      f.dir = dirOf(p.x - f.x, p.y - f.y);
      var kinds = ['heart', 'note', 'heart'], lines = [nm + ' is happy to be walking with you!', nm + ' gave you a big smile!', nm + ' is humming a little tune.'];
      if (M2.rows[f.y].charAt(f.x) === ',') lines.push(nm + ' is rustling around in the tall grass!');
      if (M2.indoor) lines.push(nm + ' is looking around curiously.');
      if (!M2.indoor && !M2.def.noClouds) lines.push(nm + ' is enjoying the sunshine!');
      var k = (Math.random() * lines.length) | 0;
      f.emote = { k: kinds[k % kinds.length], t: 0, d: 1.6 };
      this.api.cry(f.id);
      this.say([lines[k]]);
      return;
    }
  };
  // after the team changes, the new lead takes over following you
  P.syncLead = function () {
    var id = this.api.lead(), f = this.f;
    if (id === f.id) return;
    f.id = id;
    if (!id) f.hidden = true;
  };

  // ---------------------------------------------------------------------------------------------
  // battles
  P.wildEncounter = function () {
    var def = this.map.def, self = this;
    var cfg = this.api.wildCfg(def.wild, def.env);
    if (!cfg) return;
    this.lock++;
    this.api.music('wild');
    this.transition('wild', function () { self.lock--; self.api.battle(cfg); });
  };
  P.battleTrainer = function (n) {
    var self = this;
    var cfg = this.api.trainerCfg(n.d, this.map.def);
    this.lock++;
    this.transition(n.d.kind === 'gym' || n.d.leader ? 'gym' : 'trainer', function () { self.lock--; self.api.battle(cfg); });
  };
  P.legendBattle = function (n) {
    var self = this, def = this.map.def;
    var cfg = this.api.wildCfg(def.wild || 'sky', def.env || 'sky', { sp: n.d.critter, legend: n.d.id });
    this.lock++;
    this.api.music('wild');
    this.transition('gym', function () { self.lock--; self.api.battle(cfg); });
  };
  // back from a battle: fade in, then whatever comes next
  P.resume = function (res) {
    var self = this, p = this.p;
    p.sinceBattle = 0;
    this.api.music(this.map.def.music || (this.map.indoor ? 'town' : 'route'));
    this.fade = { a: 1, dir: -1, cb: null };
    if (res && res.blackout) {
      var sv = this.api.save(), lc = sv.lastCenter;
      if (lc) this.load(lc.map, lc.x, lc.y, 3, { quiet: true });
      else this.load('sunny', 4, 6, 0, { quiet: true });
      this.api.music(this.map.def.music || 'town');
      var atCenter = this.map.def.kind === 'center';
      this.say([sv.name + ' is out of usable critters!', sv.name + ' blacked out!', '...', atCenter ? 'The nurse patched up your team. Be careful out there!' : 'You hurried home to rest. Mom made pancakes!']);
      this.api.persist();
      return;
    }
    if (res && res.legend) {
      for (var li = 0; li < this.npcs.length; li++) {
        var ln = this.npcs[li];
        if (ln.d.id !== res.legend) continue;
        this.npcs.splice(li, 1);
        if (res.caught) this.setFlag('caught_' + ln.d.critter);
        else this.say([SP[ln.d.critter].name.toUpperCase() + ' soared off into the clouds...', 'It might come back if you return later.']);
        break;
      }
      this.api.persist();
    }
    if (res && res.trainer) {
      var n = null;
      for (var i = 0; i < this.npcs.length; i++) if (this.npcs[i].d.id === res.trainer) n = this.npcs[i];
      if (res.win) {
        this.setFlag(res.trainer);
        if (n && n.d.post) { this.lock++; CA.WORLD.scripts[n.d.post](this, n, function () { self.lock--; }); }
        else if (n && n.d.moveIf && n.d.moveIf[0] === res.trainer) { n.path = [[n.d.moveIf[1], n.d.moveIf[2]]]; }
      }
      this.api.persist();
    }
    if (res && res.after) res.after(this);
  };

  // ---------------------------------------------------------------------------------------------
  // dialog: Gen-1 text box, typewriter, multiple pages, optional choices
  P.say = function (pages, cb, choices) {
    if (typeof pages === 'string') pages = [pages];
    var out = [];
    var self = this;
    pages.forEach(function (pg) { self.paginate(pg).forEach(function (q) { out.push(q); }); });
    this.dlg = { pages: out, i: 0, t: 0, cb: cb || null, choices: choices || null, sel: -1 };
    this.p.path = []; this.hold = null;
  };
  P.ask = function (pages, choices, cb) { this.say(pages, cb, choices); };
  P.dlgLayout = function () {
    var W = this.W, Hh = this.H, u = this.u;
    var px = 2 * u, w = Math.min(W - 16, 460 * u), h = px * 7 * 3 + px * 3 * 2 + 30 * u;
    return { x: (W - w) / 2, y: Hh - h - 12 * u - (Hh > 700 ? 14 : 0), w: w, h: h, px: px, maxc: Math.floor((w - 34 * u) / (6 * px)) };
  };
  P.paginate = function (s) {
    var L = this.dlgLayout(), words = String(s).toUpperCase().split(' '), lines = [], cur = '';
    words.forEach(function (w) { if ((cur + ' ' + w).trim().length > L.maxc) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; });
    lines.push(cur.trim());
    var pages = [];
    for (var i = 0; i < lines.length; i += 3) pages.push(lines.slice(i, i + 3));
    return pages;
  };
  P.dlgTap = function (sx, sy) {
    var d = this.dlg, pg = d.pages[d.i], len = pg.join(' ').length;
    if (d.t * 42 < len) { d.t = 99; return; }
    if (d.i < d.pages.length - 1) { d.i++; d.t = 0; this.api.sfx('tap'); return; }
    if (d.choices) {
      var cb2 = this.choiceBoxes || [];
      for (var i = 0; i < cb2.length; i++) {
        var r = cb2[i];
        if (sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h) {
          this.api.sfx('tap'); this.dlg = null;
          if (d.cb) d.cb(i);
          return;
        }
      }
      return;
    }
    this.api.sfx('tap');
    this.dlg = null;
    if (d.cb) d.cb();
  };

  // ---------------------------------------------------------------------------------------------
  // start menu
  P.menuItems = function () {
    var sv = this.api.save();
    return [['dex', 'CRITTERDEX'], ['team', 'TEAM'], ['bag', 'BAG'], ['card', (sv ? sv.name : 'YOU')], ['save', 'SAVE'], ['options', 'OPTIONS'], ['close', 'EXIT']];
  };
  P.openMenu = function () { this.menu = { t: 0 }; this.p.path = []; this.hold = null; this.api.sfx('menu'); };
  P.menuTap = function (sx, sy) {
    var bs = this.menuBoxes || [];
    for (var i = 0; i < bs.length; i++) {
      var r = bs[i];
      if (sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h) {
        var key = r.key;
        this.api.sfx('tap');
        if (key === 'close') { this.menu = null; return; }
        if (key === 'save') { this.menu = null; this.api.persist(); this.api.sfx('save'); this.say([this.api.save().name + ' saved the game!']); return; }
        this.menu = null;
        this.api.menu(key);
        return;
      }
    }
    this.menu = null;
  };

  // ---------------------------------------------------------------------------------------------
  // transitions
  P.fadeTo = function (mid, after) {
    this.p.path = []; this.hold = null;
    this.fade = { a: 0, dir: 1, cb: mid, after: after || null };
  };
  P.transition = function (kind, cb) {
    this.hold = null; this.p.path = [];
    this.trans = { kind: kind, t: 0, cb: cb };
  };

  // little effects
  P.rustle = function (x, y) {
    for (var i = 0; i < 4; i++) this.fx.push({ k: 'leaf', x: x + 0.5, y: y + 0.6, vx: (Math.random() - 0.5) * 2.2, vy: -1.4 - Math.random(), t: 0, d: 0.45 + Math.random() * 0.2, rot: Math.random() * 6 });
  };
  P.puff = function (x, y) {
    for (var i = 0; i < 6; i++) { var a = i / 6 * TAU; this.fx.push({ k: 'dust', x: x + 0.5, y: y + 0.9, vx: cos(a) * 1.4, vy: sin(a) * 0.5, t: 0, d: 0.4 }); }
  };

  // ---------------------------------------------------------------------------------------------
  // frame
  P.frame = function (dt) {
    this.t += dt;
    var t = this.t;
    if (this.popup) { this.popup.t += dt; if (this.popup.t > 2.6) this.popup = null; }
    if (this.marker) { this.marker.t += dt; if (this.marker.t > 0.5) this.marker = null; }
    if (this.fade) {
      var F = this.fade;
      F.a += F.dir * dt / 0.22;
      if (F.dir > 0 && F.a >= 1) { F.a = 1; var cb = F.cb; F.cb = null; F.dir = -1; if (cb) cb(); }
      else if (F.dir < 0 && F.a <= 0) { var af = F.after; this.fade = null; if (af) af(); }
    }
    if (this.trans) {
      this.trans.t += dt;
      if (this.trans.t >= 1.15) { var tc = this.trans.cb; this.trans = null; if (tc) tc(); }
    }
    if (this.dlg) this.dlg.t += dt;
    if (this.menu) this.menu.t += dt;
    if (!this.fade && !this.trans && !this.dlg && !this.menu && this.map) {
      this.updatePlayer(dt);
    }
    if (this.map) {
      if (this.f.mv) this.stepMover(this.f, dt);
      if (this.f.appear !== undefined) { this.f.appear += dt; if (this.f.appear > 0.3) this.f.appear = undefined; }
      if (this.f.emote) { this.f.emote.t += dt; if (this.f.emote.t > this.f.emote.d) this.f.emote = null; }
      this.updateNpcs(dt);
      if (this.waits && this.waits.length) {
        var ws = this.waits; this.waits = [];
        for (var i = 0; i < ws.length; i++) { if (ws[i].cond()) ws[i].cb(); else this.waits.push(ws[i]); }
      }
      for (i = 0; i < this.clouds.length; i++) { var cl = this.clouds[i]; cl.x += cl.v * dt; if (cl.x > this.map.w + 8) { cl.x = -8; cl.y = Math.random() * this.map.h; } }
      this.draw(dt, t);
    }
  };

  // ---------------------------------------------------------------------------------------------
  // rendering
  P.chunk = function (cx, cy) {
    var M = this.map, key = cx + ',' + cy, ch = M.chunks[key];
    if (ch) return ch;
    var Td = this.Td, cv = document.createElement('canvas');
    cv.width = CHUNK * Td; cv.height = CHUNK * Td;
    var c = cv.getContext('2d');
    for (var y = 0; y < CHUNK; y++) for (var x = 0; x < CHUNK; x++) {
      var tx = cx * CHUNK + x, ty = cy * CHUNK + y;
      // outdoors, the edge of the map carries on past it (forest, sea, a path leading off)
      if (M.indoor && (tx < 0 || ty < 0 || tx >= M.w || ty >= M.h)) continue;
      c.save(); WA.drawTile(c, M, tx, ty, x * Td, y * Td, Td); c.restore();
    }
    M.chunks[key] = cv; M.chunkOrder.push(key);
    if (M.chunkOrder.length > 30) delete M.chunks[M.chunkOrder.shift()];
    return cv;
  };

  P.walkerScale = function () { return this.Td / 32; };

  P.draw = function (dt, t) {
    var c = this.c, M = this.map, Td = this.Td, Wd = this.cv.width, Hd = this.cv.height, p = this.p;
    // camera follows the player, clamped to the map
    var mw = M.w * Td, mh = M.h * Td;
    var cx = (p.px + 0.5) * Td - Wd / 2, cy = (p.py + 0.5) * Td - Hd * 0.48;
    this.camX = Math.round(mw <= Wd ? (mw - Wd) / 2 : clamp(cx, 0, mw - Wd));
    this.camY = Math.round(mh <= Hd ? (mh - Hd) / 2 : clamp(cy, 0, mh - Hd));
    var ox = -this.camX, oy = -this.camY;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = M.indoor ? '#2a2230' : (M.def.border || '#3f9a37'); c.fillRect(0, 0, Wd, Hd);
    var x0 = Math.floor(this.camX / Td) - 1, x1 = Math.ceil((this.camX + Wd) / Td) + 1;
    var y0 = Math.floor(this.camY / Td) - 1, y1 = Math.ceil((this.camY + Hd) / Td) + 2;
    if (M.indoor) { x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(M.w - 1, x1); y1 = Math.min(M.h - 1, y1); }
    // ground
    for (var ccy = Math.floor(y0 / CHUNK); ccy <= Math.floor(y1 / CHUNK); ccy++)
      for (var ccx = Math.floor(x0 / CHUNK); ccx <= Math.floor(x1 / CHUNK); ccx++)
        c.drawImage(this.chunk(ccx, ccy), ccx * CHUNK * Td + ox, ccy * CHUNK * Td + oy);
    // animated water glints
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) if (M.at(x, y) === '~') WA.waterGlint(c, x * Td + ox, y * Td + oy, Td, t, x, y);
    // tap marker
    if (this.marker) {
      var mk = this.marker, mkk = mk.t / 0.5;
      c.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - mkk)) + ')'; c.lineWidth = Td * 0.06;
      c.beginPath(); c.ellipse((mk.x + 0.5) * Td + ox, (mk.y + 0.75) * Td + oy, Td * (0.2 + mkk * 0.25), Td * (0.08 + mkk * 0.1), 0, 0, TAU); c.stroke();
    }
    // y-sorted scene
    var list = [], i, s;
    for (i = 0; i < M.sprites.length; i++) {
      s = M.sprites[i];
      if (s.y < y0 - 1 || s.y > y1 || s.x < x0 - 1 || s.x > x1 + 1) continue;
      list.push({ key: s.y + 0.99, s: s });
    }
    // scenery beyond the map edges
    if (!M.indoor) {
      for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
        if (x >= 0 && y >= 0 && x < M.w && y < M.h) continue;
        var och = M.at(x, y);
        if (och === 'T' || och === 'P' || och === 'A' || och === 'b' || och === 'r') list.push({ key: y + 0.99, s: { x: x, y: y, k: och === 'A' ? 'T' : och } });
      }
    }
    for (i = 0; i < M.buildings.length; i++) {
      var bb = M.buildings[i];
      list.push({ key: bb.b.y + bb.B.h - 1 + 0.99, b: bb });
    }
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) if (M.at(x, y) === ',') list.push({ key: y + 0.95, g: [x, y] });
    for (i = 0; i < M.items.length; i++) list.push({ key: M.items[i].y + 0.6, it: M.items[i] });
    for (i = 0; i < this.npcs.length; i++) { var n = this.npcs[i]; list.push({ key: n.py + 0.5, n: n }); }
    list.push({ key: p.py + 0.5, pl: 1 });
    if (this.f.id && !this.f.hidden) list.push({ key: this.f.py + 0.49, fo: 1 });
    list.sort(function (a, b) { return a.key - b.key; });
    var ws = this.walkerScale(), look = this.api.look();
    for (i = 0; i < list.length; i++) {
      var o = list[i];
      if (o.s) {
        s = o.s;
        var X = s.x * Td + ox, Y = s.y * Td + oy;
        if (s.k === 'T' || s.k === 'P' || s.k === 'A') c.drawImage(WA.tree(Td, s.k), X - Td * 0.1, Y - Td);
        else if (s.k === 'b') c.drawImage(WA.bush(Td), X, Y);
        else if (s.k === 'r') c.drawImage(WA.rock(Td), X, Y);
        else if (s.k === 'n') c.drawImage(WA.sign(Td), X, Y - Td * 0.2);
        else if (s.k === 'F') c.drawImage(WA.fence(Td, M.at(s.x - 1, s.y) === 'F' && s.x > 0, M.at(s.x + 1, s.y) === 'F' && s.x < M.w - 1), X, Y);
      } else if (o.b) {
        var b = o.b.b, B = o.b.B;
        c.drawImage(WA.building(Td, b.kind, b), b.x * Td + ox - Td * 0.2, (b.y - B.top) * Td + oy);
      } else if (o.g) {
        var gx = o.g[0], gy = o.g[1];
        var near = (Math.abs(p.px - gx) < 0.9 && Math.abs(p.py - gy) < 0.9) || (Math.abs(this.f.px - gx) < 0.9 && Math.abs(this.f.py - gy) < 0.9);
        var fr = near ? ((t * 8) | 0) % 3 : ((t * 1.3 + gx * 0.37 + gy * 0.21) | 0) % 3;
        c.drawImage(WA.grassFront(Td, fr), gx * Td + ox - Td * 0.1, gy * Td + oy + Td * 0.3);
      } else if (o.it) {
        var ix = (o.it.x + 0.5) * Td + ox, iy = (o.it.y + 0.62) * Td + oy;
        c.fillStyle = 'rgba(20,40,20,0.2)'; c.beginPath(); c.ellipse(ix, iy + Td * 0.16, Td * 0.2, Td * 0.07, 0, 0, TAU); c.fill();
        Art.capsule(c, ix, iy + sin(t * 3 + o.it.x) * Td * 0.02, Td * 0.19, 1, 0);
      } else if (o.n) this.drawNpc(c, o.n, ox, oy, ws, t);
      else if (o.pl) {
        var lift = (p.lift || 0) * Td;
        Art.walker(c, look, (p.px + 0.5) * Td + ox, (p.py + 0.9) * Td + oy, ws, p.dir, p.ph, { moving: !!p.mv || (this.hold && this.hold.steer), t: t, lift: lift / ws });
      } else if (o.fo) this.drawFollower(c, ox, oy, t);
    }
    // effects
    for (i = this.fx.length - 1; i >= 0; i--) {
      var e = this.fx[i];
      e.t += dt; if (e.t > e.d) { this.fx.splice(i, 1); continue; }
      e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 5 * dt;
      var k = e.t / e.d, ex = e.x * Td + ox, ey = e.y * Td + oy;
      if (e.k === 'leaf') { c.save(); c.translate(ex, ey); c.rotate(e.rot + e.t * 8); c.globalAlpha = 1 - k; c.fillStyle = '#3f9a37'; c.beginPath(); c.ellipse(0, 0, Td * 0.08, Td * 0.035, 0, 0, TAU); c.fill(); c.restore(); }
      else { c.fillStyle = 'rgba(240,230,210,' + (0.7 * (1 - k)) + ')'; c.beginPath(); c.arc(ex, ey, Td * (0.06 + k * 0.08), 0, TAU); c.fill(); }
    }
    // emotes
    for (i = 0; i < this.npcs.length; i++) {
      n = this.npcs[i];
      if (n.emote) WA.emote(c, n.emote.k, (n.px + 0.5) * Td + ox, (n.py - 0.55) * Td + oy - (n.d.legend ? Td * 1.2 : 0), Td, n.emote.t / Math.min(1, n.emote.d));
    }
    var fe = this.f.emote;
    if (fe && !this.f.hidden) WA.emote(c, fe.k, (this.f.px + 0.5) * Td + ox, (this.f.py - 0.05) * Td + oy, Td, fe.t / Math.min(1, fe.d));
    // drifting cloud shadows on sunny days
    if (!M.indoor && !M.def.noClouds) {
      c.fillStyle = 'rgba(20,40,60,0.07)';
      for (i = 0; i < this.clouds.length; i++) {
        var cl = this.clouds[i], cxp = cl.x * Td + ox, cyp = cl.y * Td + oy, r = cl.s * Td;
        c.beginPath(); c.ellipse(cxp, cyp, r, r * 0.45, 0, 0, TAU); c.ellipse(cxp + r * 0.6, cyp - r * 0.2, r * 0.6, r * 0.35, 0, 0, TAU); c.ellipse(cxp - r * 0.6, cyp + r * 0.1, r * 0.55, r * 0.3, 0, 0, TAU); c.fill();
      }
    }
    // UI in CSS pixels
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawUI(c, t);
  };

  P.drawNpc = function (c, n, ox, oy, ws, t) {
    var d = n.d, Td = this.Td, x = (n.px + 0.5) * Td + ox, y = (n.py + 0.9) * Td + oy;
    if (d.critter) {
      var id = d.critter, sp = SP[id], h = Art.height(id), sc = Td * 0.82 / h * (0.8 + sp.r * 0.3) * (d.big || 1);
      var fly = sp.fly ? Td * 0.25 + sin(t * 3 + n.t0) * Td * 0.05 : 0;
      c.fillStyle = 'rgba(20,40,20,0.22)'; c.beginPath(); c.ellipse(x, y - Td * 0.04, Td * 0.3 * (d.big || 1), Td * 0.09, 0, 0, TAU); c.fill();
      var face = n.dir === 1 ? -1 : n.dir === 2 ? 1 : (n.lastFace || 1); if (n.dir === 1 || n.dir === 2) n.lastFace = face;
      if (d.shiny) c.filter = 'hue-rotate(150deg) saturate(1.3)';
      Art.creature(c, id, { t: t + n.t0, mv: n.mv ? 1 : 0, walk: (t + n.t0) * 9, atk: 0, hurt: 0, blink: ((t + n.t0) % 3.4) < 0.12, faint: 0 }, x, y - fly, sc, face);
      c.filter = 'none';
      return;
    }
    if (this.map.rows[n.y].charAt(n.x) === '~') {
      // swimmers: only head and shoulders above the water, bobbing
      var bob = sin(t * 2.5 + n.t0) * Td * 0.03;
      c.save(); c.beginPath(); c.rect(x - Td, y - Td * 2, Td * 2, Td * 1.48 + bob); c.clip();
      Art.walker(c, d.look || CA.LOOKS.youngster, x, y + Td * 0.42 + bob, ws, n.dir, 0, { moving: false, t: t + n.t0, noShadow: true });
      c.restore();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = Td * 0.04;
      c.beginPath(); c.ellipse(x, y - Td * 0.52 + bob, Td * (0.36 + sin(t * 3 + n.t0) * 0.03), Td * 0.1, 0, 0, TAU); c.stroke();
      return;
    }
    Art.walker(c, d.look || CA.LOOKS.youngster, x, y, ws, n.dir, n.ph, { moving: !!n.mv, t: t + n.t0 });
  };

  P.drawFollower = function (c, ox, oy, t) {
    var f = this.f, Td = this.Td, id = f.id;
    if (!id || !SP[id]) return;
    var sp = SP[id], h = Art.height(id), sc = Td * 0.78 / h * (0.78 + sp.r * 0.32);
    var x = (f.px + 0.5) * Td + ox, y = (f.py + 0.88) * Td + oy - (f.lift || 0) * Td;
    var fly = sp.fly ? Td * 0.28 + sin(t * 3) * Td * 0.05 : 0;
    var a = f.appear !== undefined ? Math.min(1, f.appear / 0.3) : 1;
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(20,40,20,0.22)'; c.beginPath(); c.ellipse(x, (f.py + 0.88) * Td + oy - Td * 0.03, Td * 0.28, Td * 0.08, 0, 0, TAU); c.fill();
    var face = f.dir === 1 ? -1 : f.dir === 2 ? 1 : (f.lastFace || 1); if (f.dir === 1 || f.dir === 2) f.lastFace = face;
    if (this.api.shiny(id)) c.filter = 'hue-rotate(150deg) saturate(1.3)';
    var idle = !f.mv && !this.p.mv;
    Art.creature(c, id, { t: t, mv: f.mv ? 1 : 0, walk: t * 10, atk: 0, hurt: 0, blink: (t % 3.3) < 0.12, faint: 0, cheer: idle && ((t * 0.25) % 4) < 0.3 }, x, y - fly, sc, face);
    c.restore();
  };

  // ---------------------------------------------------------------------------------------------
  P.drawUI = function (c, t) {
    var W = this.W, Hh = this.H, u = this.u;
    // menu button
    var mb = this.menuBtn = { x: W - 82 * u, y: 10 * u, w: 72 * u, h: 32 * u };
    if (!this.dlg && !this.menu) {
      CA.rr(c, mb.x, mb.y, mb.w, mb.h, 10 * u); c.fillStyle = 'rgba(255,255,255,0.94)'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#2b1f33'; c.stroke();
      c.fillStyle = '#2b1f33'; for (var i = 0; i < 3; i++) c.fillRect(mb.x + 10 * u, mb.y + (10 + i * 5.5) * u, 13 * u, 2.6 * u);
      Art.pixelText(c, 'MENU', mb.x + 47 * u, mb.y + mb.h / 2, 1.5 * u, '#2b1f33', 'center');
    }
    // location sign
    if (this.popup) {
      var pk = this.popup.t, slide = pk < 0.3 ? pk / 0.3 : pk > 2.2 ? 1 - (pk - 2.2) / 0.4 : 1;
      var pw = Art.pixelWidth(this.popup.s, 2 * u) + 34 * u, ph = 40 * u, px = 10 * u, py = -ph + (ph + 12 * u) * Math.max(0, slide);
      CA.rr(c, px, py, pw, ph, 8 * u); c.fillStyle = '#f7e4bd'; c.fill(); c.lineWidth = 4 * u; c.strokeStyle = '#a8703f'; c.stroke();
      CA.rr(c, px + 4 * u, py + 4 * u, pw - 8 * u, ph - 8 * u, 5 * u); c.lineWidth = 1.5; c.strokeStyle = '#d9a46a'; c.stroke();
      Art.pixelText(c, this.popup.s, px + pw / 2, py + ph / 2, 2 * u, '#5a3a1e', 'center');
    }
    if (this.menu) this.drawMenu(c, t);
    if (this.dlg) this.drawDialog(c, t);
    // transitions
    if (this.trans) this.drawTransition(c, this.trans);
    if (this.fade) { c.fillStyle = 'rgba(0,0,0,' + clamp(this.fade.a, 0, 1) + ')'; c.fillRect(0, 0, W, Hh); }
  };
  P.drawDialog = function (c, t) {
    var d = this.dlg, L = this.dlgLayout(), u = this.u;
    var pg = d.pages[d.i], full = pg.join(' '), n = Math.floor(d.t * 42);
    CA.rr(c, L.x, L.y, L.w, L.h, 8 * u); c.fillStyle = '#fbfbf4'; c.fill(); c.lineWidth = 4 * u; c.strokeStyle = '#2b1f33'; c.stroke();
    CA.rr(c, L.x + 6 * u, L.y + 6 * u, L.w - 12 * u, L.h - 12 * u, 5 * u); c.lineWidth = 2 * u; c.stroke();
    var shown = 0;
    for (var i = 0; i < pg.length; i++) {
      var line = pg[i].slice(0, Math.max(0, n - shown));
      shown += pg[i].length + 1;
      if (line) Art.pixelText(c, line, L.x + 18 * u, L.y + 15 * u + L.px * 3.5 + i * L.px * 10, L.px, '#2b1f33', 'left');
    }
    var done = n >= full.length;
    if (done && (d.i < d.pages.length - 1 || !d.choices) && ((t * 3) | 0) % 2 === 0) {
      c.fillStyle = '#2b1f33'; c.beginPath(); c.moveTo(L.x + L.w - 26 * u, L.y + L.h - 20 * u); c.lineTo(L.x + L.w - 14 * u, L.y + L.h - 20 * u); c.lineTo(L.x + L.w - 20 * u, L.y + L.h - 12 * u); c.closePath(); c.fill();
    }
    this.choiceBoxes = [];
    if (done && d.i === d.pages.length - 1 && d.choices) {
      var ch = d.choices, bw = Math.max.apply(null, ch.map(function (s) { return Art.pixelWidth(s, L.px); })) + 50 * u, bh = 40 * u;
      var bx = L.x + L.w - bw, by = L.y - ch.length * (bh + 6 * u) - 4 * u;
      for (var k = 0; k < ch.length; k++) {
        var y = by + k * (bh + 6 * u);
        CA.rr(c, bx, y, bw, bh, 8 * u); c.fillStyle = '#fbfbf4'; c.fill(); c.lineWidth = 3 * u; c.strokeStyle = '#2b1f33'; c.stroke();
        Art.pixelText(c, ch[k], bx + 30 * u, y + bh / 2, L.px, '#2b1f33', 'left');
        c.fillStyle = '#2b1f33'; c.beginPath(); c.moveTo(bx + 12 * u, y + bh / 2 - 6 * u); c.lineTo(bx + 21 * u, y + bh / 2); c.lineTo(bx + 12 * u, y + bh / 2 + 6 * u); c.closePath(); c.fill();
        this.choiceBoxes.push({ x: bx, y: y, w: bw, h: bh });
      }
    }
  };
  P.drawMenu = function (c, t) {
    var u = this.u, items = this.menuItems(), W = this.W;
    var px = 2 * u, rowH = 44 * u, w = Math.max(190 * u, Art.pixelWidth('CRITTERDEX', px) + 60 * u), h = items.length * rowH + 20 * u;
    var x = W - w - 10 * u, y = 10 * u;
    c.fillStyle = 'rgba(20,30,60,0.25)'; c.fillRect(0, 0, W, this.H);
    CA.rr(c, x, y, w, h, 10 * u); c.fillStyle = '#fbfbf4'; c.fill(); c.lineWidth = 4 * u; c.strokeStyle = '#2b1f33'; c.stroke();
    CA.rr(c, x + 6 * u, y + 6 * u, w - 12 * u, h - 12 * u, 6 * u); c.lineWidth = 2 * u; c.stroke();
    this.menuBoxes = [];
    for (var i = 0; i < items.length; i++) {
      var ry = y + 10 * u + i * rowH;
      Art.pixelText(c, items[i][1], x + 34 * u, ry + rowH / 2, px, '#2b1f33', 'left');
      this.menuBoxes.push({ x: x, y: ry, w: w, h: rowH, key: items[i][0] });
      if (i < items.length - 1) { c.fillStyle = 'rgba(43,31,51,0.08)'; c.fillRect(x + 20 * u, ry + rowH - 1, w - 40 * u, 1.5); }
    }
    // a bouncing cursor on the first item
    var by = y + 10 * u + rowH / 2 + sin(t * 6) * 1.5;
    c.fillStyle = '#2b1f33'; c.beginPath(); c.moveTo(x + 14 * u, by - 7 * u); c.lineTo(x + 25 * u, by); c.lineTo(x + 14 * u, by + 7 * u); c.closePath(); c.fill();
  };
  P.drawTransition = function (c, tr) {
    var W = this.W, Hh = this.H, k = tr.t;
    if (k < 0.5) {
      // three white flashes, like stepping into the grass in the classics
      var on = ((k / 0.5 * 6) | 0) % 2 === 0;
      if (on) { c.fillStyle = tr.kind === 'wild' ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,30,0.6)'; c.fillRect(0, 0, W, Hh); }
      return;
    }
    var q = Math.min(1, (k - 0.5) / 0.6);
    c.fillStyle = '#000';
    if (tr.kind === 'wild') {
      var bars = 10, bh = Hh / bars;
      for (var i = 0; i < bars; i++) { var w = W * q; if (i % 2) c.fillRect(W - w, i * bh, w + 1, bh + 1); else c.fillRect(0, i * bh, w + 1, bh + 1); }
    } else if (tr.kind === 'gym') {
      var r = Math.hypot(W, Hh) * (1 - q) * 0.6;
      c.beginPath(); c.rect(0, 0, W, Hh); c.arc(W / 2, Hh / 2, Math.max(0, r), 0, TAU, true); c.fill('evenodd');
    } else {
      var segs = 12;
      for (var s = 0; s < segs; s++) {
        var a0 = s / segs * TAU;
        c.beginPath(); c.moveTo(W / 2, Hh / 2); c.arc(W / 2, Hh / 2, Math.hypot(W, Hh), a0, a0 + TAU / segs * q); c.closePath(); c.fill();
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
