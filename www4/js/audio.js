/* Critter Arena 4 — synthesized audio: chiptune music, stadium crowd, creature cries and sfx.
 * Everything is generated with WebAudio at runtime; the game ships with zero sound files. */
(function (root) {
  var CA = root.CA;
  var A = CA.Audio = { ctx: null, musicOn: true, sfxOn: true, track: null };
  var NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(n) {
    var m = /^([A-G]#?)(\d)$/.exec(n);
    return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12);
  }

  A.init = function () {
    if (A.ctx) { A.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    var ctx = A.ctx = new AC();
    A.master = ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(ctx.destination);
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(A.master);
    A.musicBus = ctx.createGain(); A.musicBus.gain.value = A.musicOn ? 0.55 : 0;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
    A.musicBus.connect(lp); lp.connect(comp);
    A.sfxBus = ctx.createGain(); A.sfxBus.gain.value = A.sfxOn ? 0.8 : 0; A.sfxBus.connect(comp);
    A.crowdBus = ctx.createGain(); A.crowdBus.gain.value = A.sfxOn ? 1 : 0; A.crowdBus.connect(comp);
    // shared noise
    var len = ctx.sampleRate * 2;
    var buf = A.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.applause = makeApplause(ctx);
    A.resume();
    if (A.pending) { var p = A.pending; A.pending = null; A.music(p); }
  };
  A.resume = function () { if (A.ctx && A.ctx.state !== 'running') { try { A.ctx.resume(); } catch (e) { } } };
  A.suspend = function () { if (A.ctx && A.ctx.state === 'running') { try { A.ctx.suspend(); } catch (e) { } } };
  A.setMusic = function (on) {
    A.musicOn = on;
    if (A.ctx) A.musicBus.gain.setTargetAtTime(on ? 0.55 : 0, A.ctx.currentTime, 0.05);
  };
  A.setSfx = function (on) {
    A.sfxOn = on;
    if (A.ctx) {
      A.sfxBus.gain.setTargetAtTime(on ? 0.8 : 0, A.ctx.currentTime, 0.05);
      A.crowdBus.gain.setTargetAtTime(on ? 1 : 0, A.ctx.currentTime, 0.05);
    }
  };

  // applause: a two-second loop of hundreds of tiny decaying hand-claps
  function makeApplause(ctx) {
    var sr = ctx.sampleRate, len = sr * 2;
    var buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (var k = 0; k < 520; k++) {
      var start = (Math.random() * len) | 0, amp = 0.15 + Math.random() * 0.35, dec = 0.004 + Math.random() * 0.006;
      var n = (dec * 6 * sr) | 0, lp = 0;
      for (var i = 0; i < n; i++) {
        var j = (start + i) % len;
        var v = (Math.random() * 2 - 1);
        lp += (v - lp) * 0.55;
        d[j] += (v - lp * 0.6) * amp * Math.exp(-i / (dec * sr));
      }
    }
    return buf;
  }

  // ---- tiny synth voices ---------------------------------------------------------
  function tone(type, f0, f1, t0, dur, vol, bus, attack) {
    var ctx = A.ctx;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || A.sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  }
  function noise(t0, dur, vol, type, f0, f1, q, bus) {
    var ctx = A.ctx;
    var s = ctx.createBufferSource(); s.buffer = A.noise;
    var f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0 || 1000, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus || A.sfxBus);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.02);
  }

  var last = {};
  function throttle(key, gap) {
    var now = A.ctx.currentTime;
    if (last[key] && now - last[key] < gap) return false;
    last[key] = now; return true;
  }

  A.sfx = function (name, opt) {
    if (!A.ctx || !A.sfxOn) return;
    var t = A.ctx.currentTime + 0.005, i;
    switch (name) {
      case 'tap': tone('sine', 880, 1320, t, 0.06, 0.12); break;
      case 'card': tone('triangle', 660, 990, t, 0.05, 0.1); break;
      case 'deny': tone('square', 160, 120, t, 0.14, 0.06); tone('square', 120, 90, t + 0.08, 0.12, 0.05); break;
      case 'throw': noise(t, 0.32, 0.18, 'bandpass', 500, 2600, 1.5); break;
      case 'pop':
        tone('sine', 300, 1100, t, 0.09, 0.22);
        for (i = 0; i < 4; i++) tone('sine', 1800 + i * 420, 0, t + 0.05 + i * 0.035, 0.12, 0.05);
        break;
      case 'hit':
        if (!throttle('hit', 0.05)) return;
        tone('sine', 190, 55, t, 0.11, 0.25);
        noise(t, 0.05, 0.12, 'highpass', 2000, 0, 0.7);
        break;
      case 'super':
        if (!throttle('super', 0.12)) return;
        tone('square', 1400, 2200, t, 0.08, 0.05); break;
      case 'bubble': if (!throttle('bub', 0.06)) return; tone('sine', 380, 1250, t, 0.1, 0.12); break;
      case 'pew': if (!throttle('pew', 0.06)) return; tone('triangle', 1200, 500, t, 0.08, 0.08); break;
      case 'star': if (!throttle('star', 0.08)) return; tone('square', 1500, 3000, t, 0.12, 0.05); tone('sine', 2200, 4400, t + 0.03, 0.15, 0.05); break;
      case 'orb': if (!throttle('orb', 0.08)) return; tone('sine', 600, 300, t, 0.2, 0.12); tone('triangle', 900, 450, t, 0.2, 0.05); break;
      case 'twinkle': if (!throttle('tw', 0.08)) return; tone('sine', 2400, 3200, t, 0.08, 0.05); break;
      case 'puff': noise(t, 0.25, 0.12, 'lowpass', 900, 300, 1); break;
      case 'zap':
        if (!throttle('zap', 0.08)) return;
        var o = tone('sawtooth', 900, 300, t, 0.2, 0.08);
        var lfo = A.ctx.createOscillator(), lg = A.ctx.createGain();
        lfo.frequency.value = 60; lg.gain.value = 400; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 0.22);
        noise(t, 0.15, 0.08, 'highpass', 3000, 0, 0.8);
        break;
      case 'charge': tone('sawtooth', 200, 900, t, 0.55, 0.05, null, 0.3); break;
      case 'beam':
        tone('sawtooth', 300, 120, t, 0.6, 0.12);
        tone('square', 600, 240, t, 0.6, 0.05);
        noise(t, 0.6, 0.25, 'bandpass', 3000, 600, 0.6);
        break;
      case 'fire': noise(t, 0.45, 0.3, 'lowpass', 2500, 400, 0.8); tone('sawtooth', 120, 70, t, 0.4, 0.06); break;
      case 'heal':
        if (!throttle('heal', 0.25)) return;
        tone('sine', 880, 0, t, 0.12, 0.05); tone('sine', 1320, 0, t + 0.06, 0.14, 0.05); break;
      case 'shield': tone('sine', 1200, 1600, t, 0.25, 0.05); tone('sine', 1500, 2000, t + 0.03, 0.25, 0.04); break;
      case 'leap': noise(t, 0.2, 0.12, 'bandpass', 800, 3000, 2); break;
      case 'bash': tone('sine', 120, 40, t, 0.25, 0.35); noise(t, 0.15, 0.2, 'lowpass', 1200, 200, 0.7); break;
      case 'faint':
        if (!throttle('faint', 0.15)) return;
        tone('square', 700, 90, t, 0.55, 0.06); break;
      case 'beep': tone('square', 660, 0, t, 0.12, 0.07); break;
      case 'go': tone('square', 990, 0, t, 0.3, 0.08); tone('square', 1320, 0, t, 0.3, 0.05); break;
      case 'fanfare':
        ['G5', 'C6', 'E6', 'G6'].forEach(function (n, k) { tone('square', freq(n), 0, t + k * 0.08, 0.2, 0.06); });
        break;
      case 'victory':
        A.music(null);
        var v = [['C5', 0], ['E5', 1], ['G5', 2], ['C6', 3], ['G5', 5], ['C6', 6], ['E6', 7]], step = 0.11;
        v.forEach(function (n) { tone('square', freq(n[0]), 0, t + n[1] * step, step * 1.6, 0.07, A.sfxBus); });
        tone('square', freq('C6'), 0, t + 8 * step, 0.9, 0.07); tone('triangle', freq('C4'), 0, t + 8 * step, 0.9, 0.12);
        tone('triangle', freq('G3'), 0, t, 8 * step, 0.1);
        break;
      case 'evolve':
        // the classic rising evolution trill
        for (i = 0; i < 12; i++) {
          var f = 330 * Math.pow(2, i / 7);
          tone('square', f, 0, t + i * 0.1, 0.12, 0.05);
          tone('triangle', f / 2, 0, t + i * 0.1, 0.12, 0.08);
        }
        tone('sine', 1200, 2400, t, 1.2, 0.03, null, 0.6);
        break;
      case 'evolved':
        ['C5', 'E5', 'G5', 'C6'].forEach(function (n, k) { tone('square', freq(n), 0, t + k * 0.07, 0.6 - k * 0.07, 0.06); });
        tone('triangle', freq('C3'), 0, t, 0.7, 0.14);
        noise(t, 0.5, 0.12, 'highpass', 4000, 0, 0.6);
        break;
      case 'rustle': noise(t, 0.5, 0.25, 'bandpass', 2500, 900, 1.2); noise(t + 0.15, 0.35, 0.18, 'bandpass', 3200, 1200, 1.2); break;
      // ---- out in the world ----
      case 'bump': if (!throttle('bump', 0.25)) return; tone('square', 95, 70, t, 0.09, 0.08); break;
      case 'ledge': tone('square', 330, 660, t, 0.12, 0.05); tone('square', 660, 440, t + 0.12, 0.1, 0.04); break;
      case 'door': noise(t, 0.18, 0.12, 'bandpass', 1400, 500, 1); tone('triangle', 520, 380, t, 0.12, 0.08); tone('triangle', 390, 260, t + 0.09, 0.14, 0.07); break;
      case 'spotted': tone('square', 1320, 0, t, 0.07, 0.07); tone('square', 1760, 0, t + 0.08, 0.16, 0.07); break;
      case 'menu': tone('square', 880, 1180, t, 0.05, 0.06); break;
      case 'buy': tone('square', 1568, 0, t, 0.05, 0.06); tone('square', 2093, 0, t + 0.06, 0.12, 0.06); break;
      case 'save': ['C5', 'E5', 'G5', 'C6'].forEach(function (n, k) { tone('square', freq(n), 0, t + k * 0.07, 0.1, 0.05); }); break;
      case 'run': noise(t, 0.35, 0.18, 'bandpass', 2200, 500, 1.4); break;
      case 'item':
        [['C5', 0], ['E5', 0.1], ['G5', 0.2], ['C6', 0.3], ['G5', 0.45], ['C6', 0.55]].forEach(function (n) { tone('square', freq(n[0]), 0, t + n[1], n[1] >= 0.55 ? 0.4 : 0.1, 0.055); tone('triangle', freq(n[0]) / 2, 0, t + n[1], 0.1, 0.08); });
        break;
      case 'healjingle':
        [['C5', 0], ['C5', 0.18], ['C5', 0.36], ['A4', 0.54], ['E5', 0.72], ['C5', 0.9], ['E5', 1.08], ['C6', 1.26]].forEach(function (n) { tone('triangle', freq(n[0]), 0, t + n[1], 0.2, 0.09); tone('square', freq(n[0]), 0, t + n[1], 0.15, 0.03); });
        break;
      case 'shiny': for (var si = 0; si < 6; si++) tone('sine', 2200 + si * 300, 3600 + si * 300, t + si * 0.07, 0.12, 0.05); break;
      case 'wobble': tone('square', 220, 180, t, 0.07, 0.07); tone('square', 260, 200, t + 0.09, 0.07, 0.06); break;
      case 'breakfree': tone('square', 900, 1800, t, 0.18, 0.06); noise(t, 0.2, 0.2, 'highpass', 2500, 0, 0.8); break;
      case 'caught':
        A.music(null);
        // the click, then a jaunty little catch fanfare
        tone('square', 1600, 0, t, 0.05, 0.08);
        [['G5', 0.2], ['G5', 0.32], ['G5', 0.44], ['C6', 0.56], ['B5', 0.8], ['G5', 0.92], ['A5', 1.04], ['C6', 1.16]].forEach(function (n) {
          tone('square', freq(n[0]), 0, t + n[1], 0.14, 0.07); tone('triangle', freq(n[0]) / 2, 0, t + n[1], 0.14, 0.1);
        });
        tone('square', freq('E6'), 0, t + 1.3, 0.7, 0.07); tone('triangle', freq('C4'), 0, t + 1.3, 0.7, 0.12);
        break;
      case 'levelup':
        ['C5', 'E5', 'G5', 'C6'].forEach(function (n, k) { tone('square', freq(n), 0, t + k * 0.09, 0.12, 0.06); });
        tone('square', freq('E6'), 0, t + 0.36, 0.35, 0.06);
        break;
      case 'badge':
        [['E5', 0], ['G5', 0.15], ['C6', 0.3], ['E6', 0.45], ['G6', 0.6]].forEach(function (n) { tone('square', freq(n[0]), 0, t + n[1], 0.25, 0.06); tone('triangle', freq(n[0]) / 4, 0, t + n[1], 0.25, 0.1); });
        break;
      case 'defeat':
        A.music(null);
        ['E5', 'D5', 'C5', 'B4'].forEach(function (n, k) { tone('square', freq(n), 0, t + k * 0.18, 0.3, 0.06); });
        tone('square', freq('A4'), 0, t + 0.72, 1.0, 0.06); tone('triangle', freq('A2'), 0, t + 0.72, 1.0, 0.12);
        break;
    }
  };

  // creature cries: glides through the species' pitch contour, Gen-1 style
  A.cry = function (id, pitch) {
    if (!A.ctx || !A.sfxOn || !throttle('cry', 0.12)) return;
    var sp = CA.SPECIES[id], ctx = A.ctx, t = ctx.currentTime + 0.02;
    var fr = sp.cry, seg = 0.075, dur = seg * fr.length + 0.06;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = sp.cryWave || 'square';
    var k = pitch || 1;
    o.frequency.setValueAtTime(fr[0] * k, t);
    for (var i = 1; i < fr.length; i++) o.frequency.exponentialRampToValueAtTime(fr[i] * k, t + seg * i);
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 24; lg.gain.value = fr[0] * 0.03 * k;
    lfo.connect(lg); lg.connect(o.frequency);
    var vol = o.type === 'sine' || o.type === 'triangle' ? 0.12 : 0.05;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.setValueAtTime(vol, t + dur - 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.sfxBus);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
  };

  // ---- the crowd ------------------------------------------------------------------
  A.crowdStart = function () {
    if (!A.ctx || A.crowd) return;
    var ctx = A.ctx;
    var src = ctx.createBufferSource(); src.buffer = A.noise; src.loop = true;
    var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 0.5;
    var f2 = ctx.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 2200; f2.gain.value = 5;
    var g = ctx.createGain(); g.gain.value = 0.0001;
    src.connect(f1); f1.connect(f2); f2.connect(g); g.connect(A.crowdBus);
    var ap = ctx.createBufferSource(); ap.buffer = A.applause; ap.loop = true;
    var ag = ctx.createGain(); ag.gain.value = 0.0001;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    ap.connect(hp); hp.connect(ag); ag.connect(A.crowdBus);
    src.start(); ap.start();
    A.crowd = { src: src, g: g, ap: ap, ag: ag, f: f1, level: 0.25 };
    A.crowdTick();
  };
  A.crowdTick = function () {
    var cr = A.crowd;
    if (!cr) return;
    var t = A.ctx.currentTime;
    var murmur = 0.05 + cr.level * 0.22 + Math.random() * 0.02;
    cr.g.gain.setTargetAtTime(murmur, t, 0.25);
    cr.ag.gain.setTargetAtTime(0.02 + cr.level * 0.35, t, 0.2);
    cr.f.frequency.setTargetAtTime(650 + cr.level * 500 + Math.random() * 80, t, 0.3);
    cr.level = Math.max(0.2, cr.level * 0.9);
    A.crowdTimer = setTimeout(A.crowdTick, 220);
  };
  A.cheer = function (amt) {
    if (!A.ctx || !A.crowd) return;
    A.crowd.level = Math.min(1.2, A.crowd.level + (amt || 0.6));
    // a couple of rising "woo!" voices
    if (amt > 0.6 && A.sfxOn) {
      var t = A.ctx.currentTime;
      for (var i = 0; i < 3; i++) {
        var f0 = 260 + Math.random() * 180, st = t + Math.random() * 0.25;
        var o = A.ctx.createOscillator(), g = A.ctx.createGain(), lp = A.ctx.createBiquadFilter();
        o.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 1400;
        o.frequency.setValueAtTime(f0, st); o.frequency.exponentialRampToValueAtTime(f0 * 1.9, st + 0.35);
        o.frequency.exponentialRampToValueAtTime(f0 * 1.5, st + 0.8);
        g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.018, st + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.85);
        o.connect(lp); lp.connect(g); g.connect(A.crowdBus);
        o.start(st); o.stop(st + 0.9);
      }
    }
  };
  // rhythmic stadium clapping: clap clap, clap-clap-clap, "HEY!"
  A.chant = function (dur) {
    if (!A.ctx || !A.sfxOn) return;
    var t0 = A.ctx.currentTime + 0.05, beat = 0.24;
    var pat = [0, 1, 3, 4, 5], bar = 8 * beat;
    for (var b = 0; b * bar < dur; b++) {
      for (var i = 0; i < pat.length; i++) {
        var tt = t0 + b * bar + pat[i] * beat;
        for (var k = 0; k < 3; k++) noise(tt + Math.random() * 0.02, 0.06, 0.16, 'bandpass', 1400 + Math.random() * 900, 0, 1.2, A.crowdBus);
      }
      var ht = t0 + b * bar + 6.5 * beat;
      for (var v = 0; v < 3; v++) {
        var o = A.ctx.createOscillator(), g = A.ctx.createGain(), lp = A.ctx.createBiquadFilter();
        var f0 = 220 + Math.random() * 140;
        o.type = 'sawtooth'; lp.type = 'bandpass'; lp.frequency.value = 900; lp.Q.value = 1.5;
        o.frequency.setValueAtTime(f0, ht); o.frequency.exponentialRampToValueAtTime(f0 * 1.25, ht + 0.12);
        g.gain.setValueAtTime(0.0001, ht); g.gain.exponentialRampToValueAtTime(0.03, ht + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, ht + 0.25);
        o.connect(lp); lp.connect(g); g.connect(A.crowdBus); o.start(ht); o.stop(ht + 0.3);
      }
    }
  };
  // music intensity: 1 = final minute (extra hats + arps), 2 = sudden death (faster too)
  A.int = 0;
  A.intensity = function (lvl) { A.int = lvl; };

  // out in the wild: birdsong, or water dripping somewhere in a cave
  A.ambience = function (env) {
    clearInterval(A.ambT);
    if (!A.ctx) return;
    A.ambT = setInterval(function () {
      if (!A.ctx || Math.random() < 0.45) return;
      var t = A.ctx.currentTime + Math.random() * 0.4;
      if (env === 'cave') { tone('sine', 1500, 700, t, 0.12, 0.05, A.crowdBus); tone('sine', 900, 500, t + 0.25, 0.1, 0.02, A.crowdBus); return; }
      if (env === 'beach') { noise(t, 1.6, 0.05, 'lowpass', 700, 300, 0.5, A.crowdBus); if (Math.random() < 0.5) tone('sine', 1800, 1400, t + 0.3, 0.2, 0.025, A.crowdBus); return; }
      if (env === 'sky') { noise(t, 1.4, 0.04, 'bandpass', 600, 1200, 0.4, A.crowdBus); return; }
      var f0 = 2200 + Math.random() * 1600;
      for (var k = 0; k < 2 + ((Math.random() * 3) | 0); k++) tone('sine', f0, f0 * 1.35, t + k * 0.11, 0.07, 0.028, A.crowdBus);
    }, 700);
  };
  A.crowdStop = function () {
    clearInterval(A.ambT);
    if (!A.crowd) return;
    clearTimeout(A.crowdTimer);
    var cr = A.crowd, t = A.ctx.currentTime;
    cr.g.gain.setTargetAtTime(0.0001, t, 0.3); cr.ag.gain.setTargetAtTime(0.0001, t, 0.3);
    setTimeout(function () { try { cr.src.stop(); cr.ap.stop(); } catch (e) { } }, 1500);
    A.crowd = null;
  };

  // ---- music ------------------------------------------------------------------------
  // lead: [note, sixteenths] per bar; bass: one root per bar; arp: chord tones
  var SONGS = {
    battle: {
      bpm: 152,
      lead: [
        [['E5', 3], ['B4', 3], ['E5', 2], ['G5', 2], ['F#5', 2], ['E5', 2], ['D5', 2]],
        [['E5', 3], ['C5', 3], ['E5', 2], ['G5', 4], ['A5', 4]],
        [['F#5', 3], ['D5', 3], ['F#5', 2], ['A5', 2], ['G5', 2], ['F#5', 2], ['E5', 2]],
        [['D#5', 4], ['F#5', 4], ['B5', 6], ['A5', 2]],
        [['G5', 3], ['F#5', 3], ['E5', 2], ['B5', 4], ['G5', 4]],
        [['A5', 3], ['G5', 3], ['E5', 2], ['C6', 4], ['B5', 4]],
        [['A5', 2], ['B5', 2], ['C6', 4], ['B5', 2], ['A5', 2], ['G5', 2], ['E5', 2]],
        [['F#5', 4], ['D#5', 4], ['B4', 4], ['D#5', 2], ['F#5', 2]]
      ],
      bass: ['E2', 'C2', 'D2', 'B1', 'E2', 'C2', 'A1', 'B1'],
      chords: [['E4', 'G4', 'B4'], ['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'], ['B3', 'D#4', 'F#4'],
        ['E4', 'G4', 'B4'], ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['B3', 'D#4', 'F#4']],
      drums: true, bassPattern: 'pump'
    },
    menu: {
      bpm: 112,
      lead: [
        [['C5', 2], ['E5', 2], ['G5', 4], ['E5', 2], ['G5', 2], ['C6', 4]],
        [['A5', 4], ['G5', 2], ['E5', 2], ['C5', 4], ['E5', 4]],
        [['F5', 2], ['A5', 2], ['C6', 4], ['A5', 2], ['F5', 2], ['A5', 4]],
        [['G5', 6], ['F5', 2], ['E5', 4], ['D5', 4]],
        [['E5', 2], ['G5', 2], ['C6', 4], ['B5', 2], ['A5', 2], ['G5', 4]],
        [['A5', 4], ['C6', 2], ['A5', 2], ['E5', 4], ['G5', 4]],
        [['F5', 4], ['A5', 4], ['G5', 2], ['F5', 2], ['E5', 2], ['D5', 2]],
        [['D5', 4], ['E5', 2], ['F5', 2], ['G5', 8]]
      ],
      bass: ['C2', 'A1', 'F1', 'G1', 'C2', 'A1', 'F1', 'G1'],
      chords: [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
        ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']],
      drums: false, bassPattern: 'bounce'
    },
    // a sleepy, cheerful little town theme for the map and the lab
    town: {
      bpm: 100,
      lead: [
        [['E5', 4], ['G5', 2], ['A5', 2], ['G5', 4], ['E5', 4]],
        [['D5', 4], ['E5', 2], ['D5', 2], ['C5', 8]],
        [['E5', 4], ['G5', 2], ['A5', 2], ['C6', 4], ['A5', 4]],
        [['G5', 6], ['E5', 2], ['D5', 8]],
        [['C5', 2], ['D5', 2], ['E5', 4], ['G5', 4], ['E5', 4]],
        [['F5', 4], ['A5', 4], ['G5', 4], ['F5', 4]],
        [['E5', 4], ['C5', 4], ['D5', 2], ['E5', 2], ['D5', 4]],
        [['C5', 12], ['G4', 4]]
      ],
      bass: ['C2', 'G1', 'C2', 'G1', 'C2', 'F1', 'C2', 'C2'],
      chords: [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['C4', 'E4', 'G4']],
      drums: false, bassPattern: 'bounce'
    },
    // ---- the Sunshine Region ----
    route: {
      bpm: 126,
      lead: [
        [['G4', 2], ['C5', 2], ['E5', 4], ['D5', 2], ['C5', 2], ['D5', 4]],
        [['E5', 4], ['G5', 4], ['A5', 2], ['G5', 2], ['E5', 4]],
        [['F5', 4], ['A5', 2], ['G5', 2], ['F5', 2], ['E5', 2], ['D5', 4]],
        [['E5', 6], ['C5', 2], ['D5', 8]],
        [['G4', 2], ['C5', 2], ['E5', 4], ['D5', 2], ['C5', 2], ['G5', 4]],
        [['A5', 4], ['G5', 2], ['E5', 2], ['C6', 4], ['B5', 4]],
        [['A5', 2], ['G5', 2], ['F5', 2], ['E5', 2], ['D5', 4], ['G5', 4]],
        [['C5', 12], ['G4', 4]]
      ],
      bass: ['C2', 'E2', 'F2', 'G1', 'C2', 'A1', 'D2', 'G1'],
      chords: [['C4', 'E4', 'G4'], ['E4', 'G4', 'B4'], ['F4', 'A4', 'C5'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['D4', 'F4', 'A4'], ['G3', 'B3', 'D4']],
      drums: true, bassPattern: 'bounce'
    },
    forest: {
      bpm: 104,
      lead: [
        [['A4', 4], ['C5', 4], ['E5', 4], ['D5', 4]],
        [['C5', 6], ['B4', 2], ['A4', 8]],
        [['G4', 4], ['B4', 4], ['D5', 4], ['C5', 4]],
        [['B4', 6], ['A4', 2], ['G4', 8]],
        [['A4', 2], ['C5', 2], ['E5', 4], ['F#5', 4], ['E5', 4]],
        [['D5', 4], ['C5', 4], ['B4', 4], ['C5', 4]],
        [['A4', 4], ['E5', 4], ['D5', 2], ['C5', 2], ['B4', 4]],
        [['A4', 12], ['E4', 4]]
      ],
      bass: ['A1', 'A1', 'G1', 'G1', 'A1', 'F1', 'E1', 'A1'],
      chords: [['A3', 'C4', 'E4'], ['A3', 'C4', 'E4'], ['G3', 'B3', 'D4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['E3', 'G#3', 'B3'], ['A3', 'C4', 'E4']],
      drums: false, bassPattern: 'bounce'
    },
    center: {
      bpm: 96,
      lead: [
        [['F5', 4], ['A5', 4], ['C6', 4], ['A5', 4]],
        [['G5', 4], ['E5', 4], ['C5', 8]],
        [['D5', 4], ['F5', 4], ['A5', 4], ['G5', 4]],
        [['F5', 12], ['C5', 4]],
        [['A5', 4], ['G5', 4], ['F5', 4], ['A5', 4]],
        [['C6', 6], ['A5', 2], ['G5', 8]],
        [['F5', 4], ['E5', 4], ['D5', 4], ['E5', 4]],
        [['F5', 12], ['C5', 4]]
      ],
      bass: ['F1', 'C2', 'D2', 'F1', 'F1', 'C2', 'A#1', 'F1'],
      chords: [['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['D4', 'F4', 'A4'], ['F3', 'A3', 'C4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['A#3', 'D4', 'F4'], ['F3', 'A3', 'C4']],
      drums: false, bassPattern: 'bounce'
    },
    gym: {
      bpm: 132,
      lead: [
        [['D5', 2], ['D5', 2], ['F5', 2], ['A5', 2], ['G5', 4], ['F5', 4]],
        [['E5', 2], ['E5', 2], ['G5', 2], ['A#5', 2], ['A5', 8]],
        [['D5', 2], ['D5', 2], ['F5', 2], ['A5', 2], ['C6', 4], ['A#5', 4]],
        [['A5', 6], ['G5', 2], ['F5', 4], ['E5', 4]],
        [['F5', 4], ['A5', 4], ['D6', 4], ['C6', 4]],
        [['A#5', 4], ['A5', 4], ['G5', 4], ['F5', 4]],
        [['E5', 4], ['G5', 4], ['A#5', 4], ['A5', 2], ['G5', 2]],
        [['A5', 8], ['C#5', 4], ['E5', 4]]
      ],
      bass: ['D2', 'C2', 'D2', 'A1', 'D2', 'A#1', 'C2', 'A1'],
      chords: [['D4', 'F4', 'A4'], ['C4', 'E4', 'G4'], ['D4', 'F4', 'A4'], ['A3', 'C#4', 'E4'], ['D4', 'F4', 'A4'], ['A#3', 'D4', 'F4'], ['C4', 'E4', 'G4'], ['A3', 'C#4', 'E4']],
      drums: true, bassPattern: 'pump'
    },
    cave: {
      bpm: 88,
      lead: [
        [['E4', 8], ['G4', 8]],
        [['F#4', 8], ['D4', 8]],
        [['E4', 4], ['B4', 4], ['A4', 4], ['G4', 4]],
        [['F#4', 16]],
        [['E4', 8], ['B4', 8]],
        [['C5', 8], ['A4', 8]],
        [['G4', 4], ['F#4', 4], ['E4', 4], ['D#4', 4]],
        [['E4', 16]]
      ],
      bass: ['E2', 'D2', 'C2', 'B1', 'E2', 'A1', 'C2', 'B1'],
      chords: [['E3', 'G3', 'B3'], ['D3', 'F#3', 'A3'], ['C3', 'E3', 'G3'], ['B2', 'D#3', 'F#3'], ['E3', 'G3', 'B3'], ['A2', 'C3', 'E3'], ['C3', 'E3', 'G3'], ['B2', 'D#3', 'F#3']],
      drums: false, bassPattern: 'bounce'
    },
    league: {
      bpm: 116,
      lead: [
        [['C5', 4], ['G5', 4], ['E5', 4], ['C6', 4]],
        [['B5', 6], ['A5', 2], ['G5', 8]],
        [['A5', 4], ['F5', 4], ['C6', 4], ['A5', 4]],
        [['G5', 12], ['G5', 2], ['A5', 2]],
        [['A#5', 4], ['A5', 4], ['G5', 4], ['F5', 4]],
        [['E5', 4], ['G5', 4], ['C6', 8]],
        [['D6', 4], ['C6', 4], ['B5', 4], ['A5', 4]],
        [['C6', 12], ['G5', 4]]
      ],
      bass: ['C2', 'E2', 'F2', 'G1', 'A#1', 'C2', 'G1', 'C2'],
      chords: [['C4', 'E4', 'G4'], ['E4', 'G4', 'B4'], ['F4', 'A4', 'C5'], ['G3', 'B3', 'D4'], ['A#3', 'D4', 'F4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4']],
      drums: true, bassPattern: 'bounce'
    },
    sky: {
      bpm: 92,
      lead: [
        [['C6', 8], ['B5', 4], ['G5', 4]],
        [['A5', 8], ['F#5', 8]],
        [['G5', 4], ['A5', 4], ['B5', 4], ['D6', 4]],
        [['C6', 16]],
        [['E6', 8], ['D6', 4], ['B5', 4]],
        [['C6', 8], ['A5', 8]],
        [['B5', 4], ['G5', 4], ['F#5', 4], ['D5', 4]],
        [['G5', 16]]
      ],
      bass: ['C2', 'D2', 'G1', 'C2', 'E2', 'A1', 'D2', 'G1'],
      chords: [['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['E4', 'G4', 'B4'], ['A3', 'C4', 'E4'], ['D4', 'F#4', 'A4'], ['G3', 'B3', 'D4']],
      drums: false, bassPattern: 'bounce'
    },
    trainer: {
      bpm: 150, fast: true,
      lead: [
        [['C5', 2], ['E5', 2], ['G5', 2], ['C6', 2], ['B5', 2], ['G5', 2], ['E5', 4]],
        [['F5', 2], ['A5', 2], ['C6', 2], ['A5', 2], ['G5', 8]],
        [['E5', 2], ['G5', 2], ['C6', 2], ['E6', 2], ['D6', 4], ['C6', 4]],
        [['B5', 4], ['G5', 4], ['D5', 4], ['G5', 4]],
        [['A5', 3], ['A5', 3], ['G5', 2], ['F5', 4], ['E5', 4]],
        [['F5', 3], ['F5', 3], ['E5', 2], ['D5', 4], ['C5', 4]],
        [['D5', 2], ['E5', 2], ['F5', 2], ['G5', 2], ['A5', 4], ['B5', 4]],
        [['C6', 8], ['G5', 4], ['E5', 4]]
      ],
      bass: ['C2', 'F1', 'C2', 'G1', 'A1', 'F1', 'D2', 'C2'],
      chords: [['C4', 'E4', 'G4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['D4', 'F4', 'A4'], ['C4', 'E4', 'G4']],
      drums: true, bassPattern: 'pump'
    },
    rival: {
      bpm: 144, fast: true,
      lead: [
        [['E5', 2], ['E5', 2], ['G5', 2], ['E5', 2], ['A5', 4], ['G5', 4]],
        [['E5', 2], ['D5', 2], ['C5', 2], ['D5', 2], ['E5', 8]],
        [['E5', 2], ['E5', 2], ['G5', 2], ['E5', 2], ['B5', 4], ['A5', 4]],
        [['G5', 4], ['F#5', 4], ['E5', 4], ['D#5', 4]],
        [['E5', 2], ['G5', 2], ['B5', 4], ['A5', 2], ['G5', 2], ['E5', 4]],
        [['C6', 4], ['B5', 4], ['A5', 4], ['G5', 4]],
        [['F#5', 2], ['G5', 2], ['A5', 4], ['B5', 4], ['D#5', 4]],
        [['E5', 12], ['B4', 4]]
      ],
      bass: ['E2', 'C2', 'E2', 'B1', 'E2', 'A1', 'B1', 'E2'],
      chords: [['E4', 'G4', 'B4'], ['C4', 'E4', 'G4'], ['E4', 'G4', 'B4'], ['B3', 'D#4', 'F#4'], ['E4', 'G4', 'B4'], ['A3', 'C4', 'E4'], ['B3', 'D#4', 'F#4'], ['E4', 'G4', 'B4']],
      drums: true, bassPattern: 'pump'
    },
    champion: {
      bpm: 162, fast: true,
      lead: [
        [['A5', 2], ['G5', 2], ['A5', 2], ['C6', 2], ['E6', 4], ['D6', 4]],
        [['C6', 2], ['B5', 2], ['C6', 2], ['A5', 2], ['E5', 8]],
        [['F5', 2], ['A5', 2], ['C6', 2], ['F6', 2], ['E6', 4], ['D6', 4]],
        [['E6', 8], ['G#5', 4], ['B5', 4]],
        [['A5', 4], ['C6', 4], ['B5', 4], ['D6', 4]],
        [['C6', 4], ['E6', 4], ['D6', 4], ['F6', 4]],
        [['E6', 4], ['D6', 4], ['C6', 4], ['B5', 4]],
        [['A5', 8], ['E5', 4], ['A5', 4]]
      ],
      bass: ['A1', 'A1', 'F1', 'E2', 'A1', 'C2', 'G1', 'A1'],
      chords: [['A3', 'C4', 'E4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['E3', 'G#3', 'B3'], ['A3', 'C4', 'E4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4']],
      drums: true, bassPattern: 'pump'
    },
    hall: {
      bpm: 100,
      lead: [
        [['C5', 4], ['E5', 4], ['G5', 4], ['C6', 4]],
        [['D6', 6], ['C6', 2], ['B5', 8]],
        [['A5', 4], ['C6', 4], ['F6', 4], ['E6', 4]],
        [['D6', 12], ['G5', 4]],
        [['C6', 4], ['E6', 4], ['G6', 4], ['E6', 4]],
        [['F6', 4], ['D6', 4], ['B5', 4], ['G5', 4]],
        [['A5', 4], ['B5', 4], ['C6', 4], ['D6', 4]],
        [['C6', 16]]
      ],
      bass: ['C2', 'G1', 'F1', 'G1', 'C2', 'G1', 'F1', 'C2'],
      chords: [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4']],
      drums: false, bassPattern: 'bounce'
    },
    // wild encounters: urgent and jumpy
    wild: {
      bpm: 160,
      lead: [
        [['A5', 2], ['G#5', 2], ['A5', 2], ['E5', 2], ['A5', 2], ['B5', 2], ['C6', 4]],
        [['B5', 2], ['A5', 2], ['G#5', 2], ['E5', 2], ['F5', 4], ['E5', 4]],
        [['A5', 2], ['G#5', 2], ['A5', 2], ['E5', 2], ['C6', 2], ['D6', 2], ['E6', 4]],
        [['D6', 2], ['C6', 2], ['B5', 2], ['G#5', 2], ['A5', 8]],
        [['F5', 3], ['A5', 3], ['C6', 2], ['B5', 4], ['A5', 4]],
        [['G5', 3], ['B5', 3], ['D6', 2], ['C6', 4], ['B5', 4]],
        [['A5', 2], ['C6', 2], ['E6', 4], ['D6', 2], ['C6', 2], ['B5', 4]],
        [['G#5', 4], ['B5', 4], ['E6', 8]]
      ],
      bass: ['A1', 'E2', 'A1', 'E2', 'F1', 'G1', 'A1', 'E2'],
      chords: [['A3', 'C4', 'E4'], ['E3', 'G#3', 'B3'], ['A3', 'C4', 'E4'], ['E3', 'G#3', 'B3'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['E3', 'G#3', 'B3']],
      drums: true, bassPattern: 'pump'
    }
  };

  A.music = function (name) {
    if (!A.ctx) { A.pending = name; return; }
    if (A.track === name) return;
    A.track = name;
    clearInterval(A.seqTimer);
    if (!name) return;
    var song = SONGS[name];
    var stepDur = 60 / song.bpm / 4;
    A.int = 0;
    var seq = { step: 0, next: A.ctx.currentTime + 0.1 };
    // flatten lead into a step map
    var leadMap = {}, s = 0;
    song.lead.forEach(function (bar) { bar.forEach(function (n) { leadMap[s] = n; s += n[1]; }); });
    var total = song.lead.length * 16;
    function schedule() {
      var ctx = A.ctx;
      while (seq.next < ctx.currentTime + 0.15) {
        var st = seq.step % total, bar = (st / 16) | 0, inBar = st % 16, t = seq.next;
        var ln = leadMap[st];
        if (ln) {
          tone('square', freq(ln[0]), 0, t, stepDur * ln[1] * 0.95, 0.045, A.musicBus, 0.01);
          tone('square', freq(ln[0]) * 1.005, 0, t, stepDur * ln[1] * 0.9, 0.018, A.musicBus, 0.01);
        }
        var root = freq(song.bass[bar]);
        if (song.bassPattern === 'pump') {
          if (inBar % 2 === 0) tone('triangle', inBar % 4 === 0 ? root : root * 2, 0, t, stepDur * 1.8, 0.16, A.musicBus, 0.005);
        } else if (inBar % 4 === 0) {
          tone('triangle', inBar % 8 === 0 ? root : root * 1.5, 0, t, stepDur * 3.5, 0.16, A.musicBus, 0.005);
        }
        var ch = song.chords[bar];
        var fast = name === 'battle' || name === 'wild' || song.fast;
        if (fast || inBar % 2 === 0) {
          var an = ch[(inBar / (fast ? 1 : 2) | 0) % 3];
          tone('triangle', freq(an) * 2, 0, t, stepDur * 0.9, 0.022, A.musicBus, 0.004);
        }
        if (A.int > 0 && name === 'battle') {
          if (inBar % 2 === 0) noise(t, 0.03, 0.035, 'highpass', 9000, 0, 0.7, A.musicBus);
          var ch2 = song.chords[bar];
          tone('square', freq(ch2[(inBar + 1) % 3]) * 4, 0, t, stepDur * 0.7, 0.012, A.musicBus, 0.003);
        }
        if (song.drums) {
          if (inBar % 8 === 0) tone('sine', 150, 45, t, 0.12, 0.3, A.musicBus);
          if (inBar % 8 === 4) noise(t, 0.12, 0.12, 'bandpass', 1800, 900, 0.8, A.musicBus);
          if (inBar % 2 === 1) noise(t, 0.035, 0.05, 'highpass', 7000, 0, 0.7, A.musicBus);
        }
        seq.step++;
        seq.next += stepDur * (A.int > 1 && name === 'battle' ? 0.92 : 1);
      }
    }
    schedule();
    A.seqTimer = setInterval(schedule, 40);
  };
})(typeof window !== 'undefined' ? window : globalThis);
