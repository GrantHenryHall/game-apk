'use strict';
// ---------- in-battle interface drawn on the canvas: scoreboard, creature tray, drag & drop ----------
const UI = {
  sel: 0,            // selected element tab
  press: null,       // finger down on a card, not yet a drag
  drag: null,        // { sp, x, y } in logical screen units
  info: null,        // { sp, t } creature card shown in the tray after a tap
  toast: null,       // { str, t }
  pop: [0, 0],       // scoreboard number pop
  tabs: [], cards: [], pauseBtn: null,

  reset() { this.press = this.drag = this.info = this.toast = null; this.pop = [0, 0]; },
  say(str) { this.toast = { str, t: 1.6 }; },

  // ----- geometry -----
  rects() {
    const V = App.V, ty = V.H - V.trayH, x0 = V.ox + 8, tw = 344 / 10;
    this.tabs = ELEMENTS.map((e, i) => ({ x: x0 + i * tw, y: ty + 4, w: tw, h: 36, cx: x0 + (i + .5) * tw, cy: ty + 22 }));
    const gap = 4, cw = (344 - gap * 4) / 5;
    this.cards = [0, 1, 2, 3, 4].map(j => ({ x: x0 + j * (cw + gap), y: ty + 44, w: cw, h: V.trayH - 52 }));
    this.pauseBtn = { x: V.ox + 8, y: 8 + V.safe, w: 30, h: 30 };
  },
  toField(lx, ly) { const V = App.V; return { x: (lx - V.fx) / V.fs, y: (ly - V.fy) / V.fs }; },
  dropPoint() { const p = this.toField(this.drag.x, this.drag.y - 34); return App.G.clampDeploy(0, p.x, p.y); },
  overField() { return this.drag && this.drag.y < App.V.H - App.V.trayH - 2; },

  // how well an element matches up against what the rival has out right now
  matchup(el) {
    let up = 0, down = 0;
    for (const u of App.G.units) {
      if (u.side !== 1 || (u.state !== 'active' && u.state !== 'deploy')) continue;
      if (BEATS[el].indexOf(u.sp.el) >= 0) up++;
      if (BEATS[u.sp.el].indexOf(el) >= 0) down++;
    }
    return { up, down };
  },
  whyNot(sp) {
    const G = App.G;
    if (G.state !== 'play') return G.state === 'intro' ? 'Wait for the whistle!' : null;
    if (G.has(0, sp.id)) return sp.name + ' is already out!';
    if (G.count(0) >= RULES.MAX_FIELD) return 'Field is full: 6 out';
    return null;
  },

  // ----- input (logical coordinates) -----
  down(p) {
    const V = App.V, G = App.G, ty = V.H - V.trayH;
    const hit = r => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    if (hit(this.pauseBtn)) { App.pause(); return; }
    if (p.y < ty) {
      // tap-to-place: with a creature selected, tapping your half sends it out
      if (this.info && G.canDeploy(0, this.info.sp.id)) {
        const f = this.toField(p.x, p.y);
        if (f.x > 0 && f.x < FW && f.y > 0 && f.y < FH) { G.deploy(0, this.info.sp.id, f.x, f.y); this.info = null; }
      } else this.info = null;
      return;
    }
    for (let i = 0; i < this.tabs.length; i++) if (hit(this.tabs[i])) { if (this.sel !== i) Sfx.play('ui'); this.sel = i; this.info = null; return; }
    // with a creature card open, the card itself can be dragged out (or tapped to close it)
    if (this.info) { this.press = { sp: this.info.sp, x: p.x, y: p.y, fromInfo: true }; return; }
    const list = BY_EL[ELEMENTS[this.sel].id];
    for (let j = 0; j < this.cards.length; j++) if (hit(this.cards[j])) { this.press = { sp: list[j], x: p.x, y: p.y }; return; }
  },
  move(p) {
    if (this.press && !this.drag) {
      const far = dist2(p.x, p.y, this.press.x, this.press.y) > 7 || p.y < App.V.H - App.V.trayH;
      if (far) {
        const why = this.whyNot(this.press.sp);
        if (why) { this.say(why); Sfx.play('penalty'); this.press = null; return; }
        this.drag = { sp: this.press.sp, x: p.x, y: p.y }; this.press = null; this.info = null; Sfx.play('ui');
      }
    }
    if (this.drag) { this.drag.x = p.x; this.drag.y = p.y; }
  },
  up(p) {
    if (this.drag) {
      this.drag.x = p.x; this.drag.y = p.y;
      if (this.overField()) { const d = this.dropPoint(); if (!App.G.deploy(0, this.drag.sp.id, d.x, d.y)) { const why = this.whyNot(this.drag.sp); if (why) this.say(why); } }
      this.drag = null;
    } else if (this.press) {
      // a tap: open that creature's card, or close it if it was already open
      this.info = this.press.fromInfo ? null : { sp: this.press.sp, t: 7 };
      Sfx.play('ui');
    }
    this.press = null;
  },
  cancel() { this.press = this.drag = null; },

  update(dt) {
    if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
    if (this.info) { this.info.t -= dt; if (this.info.t <= 0) this.info = null; }
    for (let s = 0; s < 2; s++) this.pop[s] = Math.max(0, this.pop[s] - dt * 3);
  },

  // ----- drawing -----
  drawScoreboard(ctx) {
    const V = App.V, G = App.G, w = 204, h = 46, x = V.W / 2 - w / 2, y = Math.max(5 + V.safe, V.skyH - 30);
    ctx.fillStyle = '#5b6686'; ctx.fillRect(x + 26, y + h - 2, 5, 12); ctx.fillRect(x + w - 31, y + h - 2, 5, 12);
    ctx.fillStyle = 'rgba(20,24,50,.25)'; roundRect(ctx, x, y + 3, w, h, 11); ctx.fill();
    ctx.fillStyle = '#ffffff'; roundRect(ctx, x, y, w, h, 11); ctx.fill();
    ctx.fillStyle = '#232a4d'; roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 8.5); ctx.fill();
    for (let s = 0; s < 2; s++) {
      const tm = G.teams[s], ex = s === 0 ? x + 23 : x + w - 23, nx = s === 0 ? x + 63 : x + w - 63;
      drawEmblem(ctx, tm, ex, y + h / 2 - 2, 13);
      chunkyText(ctx, s === 0 ? 'YOU' : 'RIVAL', ex, y + h - 8.5, 6.2, '#fff', '#232a4d', 2.2);
      const pop = 1 + Ease.hump(this.pop[s]) * .5;
      chunkyText(ctx, String(G.score[s]), nx, y + 19, 23 * pop, this.pop[s] > 0 ? '#ffe14a' : '#ffffff', null);
      const bw = 40, f = clamp(G.score[s] / G.target, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; roundRect(ctx, nx - bw / 2, y + 34, bw, 4, 2); ctx.fill();
      if (f > 0) { ctx.fillStyle = tm.c1 === '#3a2d50' ? tm.c2 : tm.c1; roundRect(ctx, s === 0 ? nx - bw / 2 : nx + bw / 2 - bw * f, y + 34, bw * f, 4, 2); ctx.fill(); }
    }
    chunkyText(ctx, 'KO', V.W / 2, y + 15, 10, '#ffd23d', null);
    chunkyText(ctx, 'first to ' + G.target, V.W / 2, y + 29, 6.4, '#aab4dc', null);
  },

  drawTray(ctx, time) {
    const V = App.V, G = App.G, ty = V.H - V.trayH;
    // panel
    ctx.fillStyle = 'rgba(20,24,50,.28)'; ctx.fillRect(0, ty - 4, V.W, 4);
    const pg2 = ctx.createLinearGradient(0, ty, 0, V.H); pg2.addColorStop(0, '#2c3566'); pg2.addColorStop(1, '#1d2347');
    ctx.fillStyle = pg2; ctx.fillRect(0, ty, V.W, V.trayH);
    ctx.fillStyle = '#ffd23d'; ctx.fillRect(0, ty, V.W, 2.5);

    // element tabs with a live matchup badge (hidden mid-drag: the row becomes the hint line)
    for (let i = 0; i < 10 && !this.drag; i++) {
      const e = ELEMENTS[i], r = this.tabs[i], on = i === this.sel, rr = on ? 15 : 12.5;
      if (on) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(r.cx, r.cy, rr + 2.4, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = on ? 1 : .8;
      ctx.fillStyle = e.col; ctx.beginPath(); ctx.arc(r.cx, r.cy, rr, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(r.cx, r.cy - rr * .25, rr * .8, PI, TAU); ctx.fill();
      elGlyph(ctx, e.id, r.cx, r.cy, rr * .56, '#fff');
      ctx.globalAlpha = 1;
      const m = this.matchup(e.id), net = m.up - m.down;
      if (net !== 0) {
        const bx = r.cx + 10, by = r.cy - 11;
        ctx.fillStyle = '#1d2347'; ctx.beginPath(); ctx.arc(bx, by, 6.4, 0, TAU); ctx.fill();
        ctx.fillStyle = net > 0 ? '#57e06a' : '#ff5d6c'; ctx.beginPath(); ctx.arc(bx, by, 5.2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath();
        if (net > 0) { ctx.moveTo(bx, by - 3); ctx.lineTo(bx + 3, by + 2); ctx.lineTo(bx - 3, by + 2); } else { ctx.moveTo(bx, by + 3); ctx.lineTo(bx + 3, by - 2); ctx.lineTo(bx - 3, by - 2); }
        ctx.closePath(); ctx.fill();
      }
    }

    const showInfo = this.drag ? this.drag.sp : this.info ? this.info.sp : null;
    if (showInfo) { this.drawInfo(ctx, showInfo, time); return; }

    // the five creatures of the selected element
    const e = ELEMENTS[this.sel], list = BY_EL[e.id], full = G.count(0) >= RULES.MAX_FIELD;
    for (let j = 0; j < 5; j++) {
      const sp = list[j], r = this.cards[j], out = G.has(0, sp.id), dim = out || full || G.state !== 'play';
      const pressed = this.press && this.press.sp === sp;
      ctx.save();
      if (pressed) { ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.scale(.95, .95); ctx.translate(-r.x - r.w / 2, -r.y - r.h / 2); }
      ctx.fillStyle = 'rgba(10,12,30,.45)'; roundRect(ctx, r.x, r.y + 3, r.w, r.h, 9); ctx.fill();
      const cg = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); cg.addColorStop(0, e.light); cg.addColorStop(1, '#ffffff');
      ctx.fillStyle = cg; roundRect(ctx, r.x, r.y, r.w, r.h, 9); ctx.fill();
      ctx.strokeStyle = e.col; ctx.lineWidth = 2.2; roundRect(ctx, r.x + 1.1, r.y + 1.1, r.w - 2.2, r.h - 2.2, 8); ctx.stroke();
      // portrait
      ctx.save(); roundRect(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 24, 7); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h - 31, 17, 4.5, 0, 0, TAU); ctx.fill();
      ctx.translate(r.x + r.w / 2 - 1, r.y + r.h - 31); const ps = 1.22 - (sp.role === 'tank' ? .06 : 0); ctx.scale(ps, ps);
      drawCreature(ctx, sp.id, time, { seed: sp.i * .13, moving: false });
      ctx.restore();
      // role chip
      ctx.fillStyle = e.dark; ctx.beginPath(); ctx.arc(r.x + 11, r.y + 11, 7.6, 0, TAU); ctx.fill();
      roleGlyph(ctx, sp.role, r.x + 11, r.y + 11, 4.2, '#fff');
      // name
      ctx.font = '900 9.6px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#232a4d';
      let nm = sp.name; const mw = r.w - 6; let fsz = 9.6; while (ctx.measureText(nm).width > mw && fsz > 7) { fsz -= .4; ctx.font = '900 ' + fsz + 'px ' + FONT; }
      ctx.fillText(nm, r.x + r.w / 2, r.y + r.h - 15.5);
      ctx.font = '800 6.2px ' + FONT; ctx.fillStyle = e.dark; ctx.fillText(ROLES[sp.role].name.toUpperCase(), r.x + r.w / 2, r.y + r.h - 6.5);
      if (dim) {
        ctx.fillStyle = out ? 'rgba(29,35,71,.62)' : 'rgba(29,35,71,.4)'; roundRect(ctx, r.x, r.y, r.w, r.h, 9); ctx.fill();
        if (out) chunkyText(ctx, 'OUT', r.x + r.w / 2, r.y + r.h / 2 - 8, 12, '#fff', '#1d2347', 3);
      }
      ctx.restore();
    }
    // how many are out
    const n = G.count(0), bx = V.ox + 360 - 30, by = ty - 12;
    ctx.fillStyle = full ? '#ff5d6c' : '#232a4d'; roundRect(ctx, bx - 21, by - 9, 46, 18, 9); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; roundRect(ctx, bx - 21, by - 9, 46, 18, 9); ctx.stroke();
    chunkyText(ctx, n + ' / ' + RULES.MAX_FIELD, bx + 2, by + .5, 10, '#fff', null);
  },

  drawInfo(ctx, sp, time) {
    const V = App.V, e = EL[sp.el], x = V.ox + 8, y = V.H - V.trayH + 44, w = 344, h = V.trayH - 52;
    ctx.fillStyle = 'rgba(10,12,30,.45)'; roundRect(ctx, x, y + 3, w, h, 10); ctx.fill();
    ctx.fillStyle = '#ffffff'; roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = e.col; ctx.lineWidth = 2.4; roundRect(ctx, x + 1.2, y + 1.2, w - 2.4, h - 2.4, 9); ctx.stroke();
    // portrait
    ctx.fillStyle = e.light; roundRect(ctx, x + 7, y + 7, 74, h - 14, 8); ctx.fill();
    ctx.save(); roundRect(ctx, x + 7, y + 7, 74, h - 14, 8); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.beginPath(); ctx.ellipse(x + 44, y + h - 20, 22, 5.5, 0, 0, TAU); ctx.fill();
    ctx.translate(x + 43, y + h - 20); ctx.scale(1.5, 1.5); drawCreature(ctx, sp.id, time, { seed: sp.i * .13 }); ctx.restore();
    const tx = x + 90;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '900 15px ' + FONT; ctx.fillStyle = '#232a4d'; ctx.fillText(sp.name, tx, y + 16);
    const nw = ctx.measureText(sp.name).width;
    ctx.fillStyle = e.col; roundRect(ctx, tx + nw + 7, y + 9, 52, 14, 7); ctx.fill();
    elGlyph(ctx, e.id, tx + nw + 15.5, y + 16, 4, '#fff');
    ctx.font = '900 8px ' + FONT; ctx.fillStyle = '#fff'; ctx.fillText(e.name.toUpperCase(), tx + nw + 22.5, y + 16.4);
    ctx.fillStyle = e.dark; ctx.beginPath(); ctx.arc(tx + 6, y + 33, 6.4, 0, TAU); ctx.fill(); roleGlyph(ctx, sp.role, tx + 6, y + 33, 3.6, '#fff');
    ctx.font = '800 8.6px ' + FONT; ctx.fillStyle = '#4a5280'; ctx.fillText(ROLES[sp.role].name + ' · ' + ROLES[sp.role].tip, tx + 16, y + 33.4, 158);
    ctx.font = '900 8.8px ' + FONT; ctx.fillStyle = '#232a4d'; ctx.fillText(sp.move, tx, y + 48.5);
    const mw = ctx.measureText(sp.move).width, room = 172 - mw - 6;
    ctx.font = '700 8.4px ' + FONT; ctx.fillStyle = '#6b739c'; ctx.fillText(sp.blurb, tx + mw + 6, y + 48.5, room);
    // stat bars
    const dps = sp.dmg * (sp.hits || 1) / sp.cd + (sp.back ? sp.back / sp.cd : 0);
    const stats = [['HP', sp.hp / 3450, '#57e06a'], ['ATK', dps / 110, '#ff7a5c'], ['SPD', sp.spd / 92, '#4fc3ff'], ['RNG', sp.range ? sp.range / 155 : .12, '#ffcf33']];
    stats.forEach((q, i) => {
      const bx = tx + (i % 2) * 86, by = y + 62 + Math.floor(i / 2) * 11;
      ctx.font = '900 6.6px ' + FONT; ctx.fillStyle = '#6b739c'; ctx.fillText(q[0], bx, by + .4);
      ctx.fillStyle = '#e4e7f3'; roundRect(ctx, bx + 19, by - 2.6, 58, 5.2, 2.6); ctx.fill();
      ctx.fillStyle = q[2]; roundRect(ctx, bx + 19, by - 2.6, Math.max(5, 58 * clamp(q[1], 0, 1)), 5.2, 2.6); ctx.fill();
    });
    // strong against / weak to
    const chips = (label, ids, col, cy) => {
      ctx.font = '900 6.6px ' + FONT; ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.fillText(label, x + w - 76, cy - 14.5);
      ids.forEach((id, i) => { const cx = x + w - 66 + i * 26; ctx.fillStyle = EL[id].col; ctx.beginPath(); ctx.arc(cx, cy, 9.4, 0, TAU); ctx.fill(); elGlyph(ctx, id, cx, cy, 5.2, '#fff'); });
    };
    chips('▲ STRONG VS', BEATS[sp.el], '#2fae48', y + 32);
    chips('▼ WEAK TO', ELEMENTS.filter(q => BEATS[q.id].indexOf(sp.el) >= 0).map(q => q.id), '#e0455a', y + h - 15);
    if (this.drag) {
      const ok = this.overField();
      chunkyText(ctx, ok ? 'RELEASE TO SEND OUT' : 'DROP HERE TO CANCEL', V.ox + 180, V.H - V.trayH + 22, 11, ok ? '#57e06a' : '#ffb1b8', '#1d2347', 3.4);
    }
  },

  // field-space extras while dragging: the legal zone, the ghost, matchup arrows over rivals
  dragGround(ctx, time) {
    if (!this.drag) return;
    const M = 6, a = .13 + Math.sin(time * 5) * .04;
    ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; roundRect(ctx, M, MID + 4, FW - M * 2, FH - MID - M - 4, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -time * 14;
    roundRect(ctx, M, MID + 4, FW - M * 2, FH - MID - M - 4, 8); ctx.stroke(); ctx.setLineDash([]);
    if (this.overField()) {
      const d = this.dropPoint(), sp = this.drag.sp, reach = sp.range || sp.r + 20;
      ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(d.x, d.y, reach, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(90,200,255,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(d.x, d.y + 1, sp.r * 1.1, sp.r * .44, 0, 0, TAU); ctx.stroke();
    }
  },
  dragAir(ctx, time) {
    if (!this.drag) return;
    const sp = this.drag.sp, G = App.G;
    for (const u of G.units) {
      if (u.side !== 1 || u.state !== 'active') continue;
      const good = BEATS[sp.el].indexOf(u.sp.el) >= 0, bad = BEATS[u.sp.el].indexOf(sp.el) >= 0;
      if (!good && !bad) continue;
      const x = u.x, y = u.y - 50 * u.vs - 8 + Math.sin(time * 6 + u.id) * 1.5;
      ctx.fillStyle = '#1d2347'; ctx.beginPath(); ctx.arc(x, y, 8.4, 0, TAU); ctx.fill();
      ctx.fillStyle = good && bad ? '#ffcf33' : good ? '#57e06a' : '#ff5d6c'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath();
      if (good && bad) { ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); }
      else if (good) { ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y + 2.6); ctx.lineTo(x - 4, y + 2.6); }
      else { ctx.moveTo(x, y + 4); ctx.lineTo(x + 4, y - 2.6); ctx.lineTo(x - 4, y - 2.6); }
      ctx.closePath(); ctx.fill();
    }
    if (this.overField()) {
      const d = this.dropPoint(), s = visScale(sp.r);
      ctx.save(); ctx.globalAlpha = .82; ctx.translate(d.x, d.y - 3 - Math.abs(Math.sin(time * 6)) * 2); ctx.scale(s, s);
      drawCreature(ctx, sp.id, time, { seed: .3 }); ctx.restore();
    }
  },
  // the creature riding under the finger while it is still over the tray
  drawDragLoose(ctx, time) {
    if (!this.drag || this.overField()) return;
    ctx.save(); ctx.globalAlpha = .9; ctx.translate(this.drag.x, this.drag.y - 22); ctx.scale(1.25, 1.25);
    drawCreature(ctx, this.drag.sp.id, time, { seed: .3 }); ctx.restore();
  },

  drawOverlays(ctx, time) {
    const V = App.V, G = App.G, cx = V.W / 2, cy = V.fy + V.fh / 2;
    // pause button
    const b = this.pauseBtn;
    ctx.fillStyle = 'rgba(20,24,50,.25)'; ctx.beginPath(); ctx.arc(b.x + 15, b.y + 17, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x + 15, b.y + 15, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#232a4d'; roundRect(ctx, b.x + 9, b.y + 8.5, 4.4, 13, 1.6); ctx.fill(); roundRect(ctx, b.x + 16.6, b.y + 8.5, 4.4, 13, 1.6); ctx.fill();

    if (G.state === 'intro') {
      const n = Math.ceil(G.introT), k = 1 - (G.introT - Math.floor(G.introT));
      chunkyText(ctx, 'VS ' + G.teams[1].name.toUpperCase(), cx, cy - 62, 15, '#fff', '#232a4d', 4.4);
      if (n >= 1 && n <= 3) { ctx.globalAlpha = k > .75 ? 1 - (k - .75) / .25 : 1; chunkyText(ctx, String(n), cx, cy, 78 * (1.25 - Ease.outCubic(Math.min(1, k * 2)) * .25), '#ffd23d', '#232a4d', 10); ctx.globalAlpha = 1; }
    } else if (G.state === 'play' && G.time - (G.t0 || 0) < 1) {
      const k = (G.time - (G.t0 || 0)) / 1;
      ctx.globalAlpha = k > .6 ? 1 - (k - .6) / .4 : 1;
      chunkyText(ctx, 'BATTLE!', cx, cy, 44 * (.7 + Ease.outBack(Math.min(1, k * 3)) * .3), '#ffd23d', '#232a4d', 8); ctx.globalAlpha = 1;
    }
    if (G.state === 'play' && G.count(0) === 0 && G.time - (G.t0 || 0) > 1) {
      const left = Math.max(0, G.grace(0) - G.empty[0]), pulse = 1 + Math.sin(time * 9) * .05, first = G.stats.sent[0] === 0;
      chunkyText(ctx, first ? 'DRAG A CREATURE UP HERE!' : 'SEND OUT A CREATURE!', cx, V.fy + V.fh * .76, 15 * pulse, '#fff', first ? '#232a4d' : '#e0455a', 4.6);
      if (!first || left < 6) chunkyText(ctx, 'rival scores in ' + Math.ceil(left), cx, V.fy + V.fh * .76 + 17, 9, '#ffe14a', '#232a4d', 3);
      if (first) { const by = V.fy + V.fh * .76 + 40 + Math.abs(Math.sin(time * 4)) * 8; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#232a4d'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cx, by - 12); ctx.lineTo(cx + 12, by + 2); ctx.lineTo(cx + 5, by + 2); ctx.lineTo(cx + 5, by + 14); ctx.lineTo(cx - 5, by + 14); ctx.lineTo(cx - 5, by + 2); ctx.lineTo(cx - 12, by + 2); ctx.closePath(); ctx.stroke(); ctx.fill(); }
    }
    if (G.over) {
      const k = Math.min(1, G.over.t / .5), won = G.over.winner === 0;
      chunkyText(ctx, won ? 'VICTORY!' : 'DEFEAT', cx, cy, 46 * (.6 + Ease.outBack(k) * .4), won ? '#ffd23d' : '#dfe4ff', won ? '#c2381a' : '#232a4d', 9);
    }
    if (this.toast) {
      const k = this.toast.t / 1.6; ctx.globalAlpha = Math.min(1, k * 4);
      ctx.font = '900 11px ' + FONT; const tw = ctx.measureText(this.toast.str).width + 22, ty = V.H - V.trayH - 34;
      ctx.fillStyle = '#232a4d'; roundRect(ctx, cx - tw / 2, ty - 11, tw, 22, 11); ctx.fill();
      chunkyText(ctx, this.toast.str, cx, ty + .5, 11, '#fff', null); ctx.globalAlpha = 1;
    }
  }
};
