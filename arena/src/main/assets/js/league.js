'use strict';
// ---------- the Sunny League: ten teams, nine rounds, everyone plays everyone ----------
const League = (() => {
  const KEY = 'sunlings.league.v1';
  let st = null, nextSeason = 1;

  // classic round-robin "circle" schedule: 9 rounds of 5 pairings
  function makeSchedule() {
    const ids = TEAMS.map(tm => tm.id), rounds = [];
    for (let r = 0; r < 9; r++) {
      const pairs = [];
      for (let i = 0; i < 5; i++) pairs.push([ids[i], ids[9 - i]]);
      rounds.push(pairs);
      ids.splice(1, 0, ids.pop());
    }
    return rounds;
  }
  function fresh(teamId, season) {
    const table = {}, power = {};
    TEAMS.forEach(tm => { table[tm.id] = { w: 0, l: 0, kf: 0, ka: 0 }; power[tm.id] = rnd(.35, .8); });
    // shuffle the order of rounds so each season feels different
    const sched = makeSchedule();
    for (let i = sched.length - 1; i > 0; i--) { const j = rndi(0, i), tmp = sched[i]; sched[i] = sched[j]; sched[j] = tmp; }
    return { team: teamId, season: season || 1, round: 0, table, power, sched, done: false };
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { st = JSON.parse(raw); if (!st || !st.sched || !TEAM[st.team]) st = null; } } catch (e) { st = null; }
    return st;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage may be unavailable */ } }
  function start(teamId) { st = fresh(teamId, nextSeason); save(); return st; }
  function reset() { nextSeason = st && st.done ? st.season + 1 : 1; st = null; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

  function nextRival() {
    if (!st || st.done) return null;
    const pair = st.sched[st.round].find(p => p[0] === st.team || p[1] === st.team);
    return TEAM[pair[0] === st.team ? pair[1] : pair[0]];
  }
  // rival coaches pick more sharply as the season goes on (nothing else about them changes)
  function rivalSkill() { return clamp(.15 + st.round * .085 + (st.season - 1) * .1, .15, .95); }

  function record(a, b, sa, sb) {
    const ta = st.table[a], tb = st.table[b];
    ta.kf += sa; ta.ka += sb; tb.kf += sb; tb.ka += sa;
    if (sa > sb) { ta.w++; tb.l++; } else { tb.w++; ta.l++; }
  }
  // call with the player's result; everyone else's matches are played out behind the scenes
  function finishRound(myScore, rivalScore) {
    const rival = nextRival(); if (!rival) return;
    for (const p of st.sched[st.round]) {
      if (p[0] === st.team || p[1] === st.team) continue;
      const pa = st.power[p[0]], pb = st.power[p[1]], aWins = Math.random() < pa / (pa + pb);
      const lose = rndi(4, RULES.KO_TARGET - 1);
      record(p[0], p[1], aWins ? RULES.KO_TARGET : lose, aWins ? lose : RULES.KO_TARGET);
    }
    record(st.team, rival.id, myScore, rivalScore);
    st.round++; if (st.round >= 9) st.done = true;
    save();
  }
  function standings() {
    return TEAMS.map(tm => Object.assign({ team: tm }, st.table[tm.id]))
      .sort((p, q) => q.w - p.w || (q.kf - q.ka) - (p.kf - p.ka) || q.kf - p.kf);
  }
  function place() { return standings().findIndex(r => r.team.id === st.team) + 1; }

  return { load, start, reset, nextRival, rivalSkill, finishRound, standings, place, get state() { return st; } };
})();
