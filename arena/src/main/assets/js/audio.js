'use strict';
// ---------- all sound is synthesised with WebAudio: crowd, moves, jingles, a chiptune loop ----------
const Sfx = (() => {
  let ac = null, master, sfxG, musG, crowdG, noiseBuf, last = {}, musTimer = null, step = 0, nextT = 0;
  const S = { sound: true, music: true };
  try { const sv = JSON.parse(localStorage.getItem('sunlings.audio') || '{}'); if (sv.sound === false) S.sound = false; if (sv.music === false) S.music = false; } catch (e) { /* ignore */ }

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = S.sound ? .55 : 0; sfxG.connect(master);
    musG = ac.createGain(); musG.gain.value = S.music ? .13 : 0; musG.connect(master);
    crowdG = ac.createGain(); crowdG.gain.value = 0; crowdG.connect(sfxG);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // constant stadium murmur: two filtered noise layers
    for (const [f, q, v] of [[650, .5, 1], [1700, .9, .45]]) {
      const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      const g = ac.createGain(); g.gain.value = v; src.connect(bp); bp.connect(g); g.connect(crowdG); src.start();
    }
    startMusic();
  }
  function unlock() { init(); if (ac && ac.state === 'suspended') ac.resume(); }

  function tone(type, f0, f1, dur, vol, delay, dest) {
    const t0 = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .006); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t0); o.stop(t0 + dur + .03);
  }
  function noise(dur, vol, f0, f1, q, type, delay, attack) {
    const t0 = ac.currentTime + (delay || 0), src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; src.loop = true; f.type = type || 'bandpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + (attack || .008)); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxG); src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + .05);
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  const SOUNDS = {
    ui() { tone('square', 880, 1320, .07, .12); },
    deploy() { tone('sine', 380, 980, .15, .3); tone('triangle', 1200, 1900, .1, .14, .08); },
    hit() { noise(.07, .16, 900, 300, 1); tone('sine', 170, 60, .09, .2); },
    superhit() { tone('square', 740, 1480, .1, .1); tone('sine', 190, 60, .12, .26); noise(.09, .2, 1400, 400, 1); },
    ko() { [84, 79, 76, 72, 67].forEach((m, i) => tone('square', hz(m), hz(m - 1), .1, .16, i * .07)); noise(.3, .14, 1200, 300, .8, 'bandpass', .05); },
    recall() { tone('sine', 900, 320, .28, .2); tone('triangle', 1400, 500, .22, .08, .04); },
    count() { tone('square', 660, 660, .12, .16); },
    go() { tone('square', 990, 990, .28, .16); tone('square', 1320, 1320, .28, .1, .02); },
    penalty() { tone('sawtooth', 300, 150, .34, .16); },
    win() { [72, 76, 79, 84, 88, 91].forEach((m, i) => { tone('square', hz(m), hz(m), .22, .14, i * .11); tone('triangle', hz(m - 12), hz(m - 12), .26, .16, i * .11); }); },
    lose() { [76, 72, 69, 65, 60].forEach((m, i) => tone('triangle', hz(m), hz(m), .3, .2, i * .17)); },
    fire() { noise(.2, .16, 2600, 500, .7, 'lowpass'); },
    water() { tone('sine', 420, 820, .08, .16); tone('sine', 620, 1150, .07, .12, .05); },
    leaf() { noise(.11, .1, 3200, 5200, .8, 'highpass'); tone('triangle', 520, 720, .09, .1); },
    spark() { tone('square', 1500, 280, .1, .1); noise(.05, .1, 4000, 6000, 1, 'highpass'); },
    stone() { tone('sine', 125, 48, .18, .32); noise(.09, .16, 700, 200, .8, 'lowpass'); },
    frost() { tone('sine', 1800, 2700, .1, .1); tone('sine', 2400, 3300, .09, .07, .04); },
    sky() { noise(.22, .13, 600, 2200, .9, 'bandpass', 0, .06); },
    venom() { tone('sawtooth', 300, 170, .13, .09); tone('sine', 720, 300, .11, .12, .02); },
    mystic() { tone('sine', 880, 884, .28, .11); tone('sine', 1320, 1326, .24, .07, .02); },
    shadow() { tone('sawtooth', 185, 88, .22, .1); noise(.14, .1, 500, 150, .8, 'lowpass'); }
  };
  const GAP = { hit: .06, superhit: .09, ui: .03 };
  function play(name) {
    if (!ac || !S.sound || ac.state !== 'running' || !SOUNDS[name]) return;
    const now = ac.currentTime, gap = GAP[name] === undefined ? .075 : GAP[name];
    if (last[name] && now - last[name] < gap) return;
    last[name] = now; SOUNDS[name]();
  }
  // crowd roar: amount 0..1
  function cheer(amount) {
    if (!ac || !S.sound || ac.state !== 'running') return;
    const now = ac.currentTime; if (last.cheer && now - last.cheer < .25) return; last.cheer = now;
    noise(1.7, .3 * amount, 900, 1800, .6, 'bandpass', 0, .16);
    noise(1.3, .16 * amount, 2000, 3000, .9, 'bandpass', .05, .2);
    for (let i = 0; i < 2; i++) tone('sine', 1700 + i * 300, 2500 + i * 300, .3, .03 * amount, .15 + i * .22);
  }
  // steady murmur level follows the match excitement
  function crowd(level) { if (ac && crowdG) crowdG.gain.setTargetAtTime(.05 + level * .09, ac.currentTime, .4); }

  // ----- music: an original bouncy 8-bar loop -----
  const LEAD = [
    [76, 0, 79, 0, 84, 0, 79, 76], [74, 0, 79, 0, 83, 0, 79, 74], [72, 0, 76, 0, 81, 0, 76, 72], [77, 0, 81, 0, 84, 81, 77, 0],
    [76, 79, 84, 0, 88, 0, 86, 84], [83, 0, 86, 0, 79, 0, 83, 0], [81, 0, 84, 81, 83, 0, 86, 83], [84, 0, 0, 0, 79, 0, 84, 0]];
  const ROOT = [[48], [47], [45], [41], [48], [43], [41, 43], [48]];
  const BEAT = 60 / 132 / 2;
  function schedule() {
    if (!ac || ac.state !== 'running') return;
    while (nextT < ac.currentTime + .25) {
      const bar = Math.floor(step / 8) % 8, i = step % 8, t = Math.max(0, nextT - ac.currentTime);
      const m = LEAD[bar][i]; if (m) tone('square', hz(m), hz(m), BEAT * 1.5, .5, t, musG);
      const r = ROOT[bar][ROOT[bar].length > 1 && i >= 4 ? 1 : 0], b = [0, 12, 7, 12, 0, 12, 7, 12][i];
      tone('triangle', hz(r + b), hz(r + b), BEAT * .9, .9, t, musG);
      if (i % 2 === 1) { const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t0 = ac.currentTime + t; src.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.22, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .05); src.connect(f); f.connect(g); g.connect(musG); src.start(t0, Math.random()); src.stop(t0 + .07); }
      if (i % 4 === 0) tone('sine', 150, 50, .12, 1.1, t, musG);
      step++; nextT += BEAT;
    }
  }
  function startMusic() { if (musTimer || !ac) return; nextT = ac.currentTime + .1; musTimer = setInterval(schedule, 90); }

  function save() { try { localStorage.setItem('sunlings.audio', JSON.stringify(S)); } catch (e) { /* ignore */ } }
  function setSound(v) { S.sound = v; if (sfxG) sfxG.gain.value = v ? .55 : 0; save(); }
  function setMusic(v) { S.music = v; if (musG) musG.gain.value = v ? .13 : 0; save(); }
  // pause audio entirely when the app is backgrounded
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });

  return { unlock, play, cheer, crowd, setSound, setMusic, get sound() { return S.sound; }, get music() { return S.music; } };
})();
