'use strict';
// ---------- elements, type chart, roles, teams, the 50 creatures ----------
const ELEMENTS = [
  { id: 'fire',   name: 'Fire',   col: '#ff6a3c', dark: '#c2381a', light: '#ffd9b8' },
  { id: 'water',  name: 'Water',  col: '#3fa2ff', dark: '#1c64c4', light: '#cfe9ff' },
  { id: 'leaf',   name: 'Leaf',   col: '#4fc85e', dark: '#24803a', light: '#d6f7c8' },
  { id: 'spark',  name: 'Spark',  col: '#ffcf33', dark: '#c98a00', light: '#fff3bf' },
  { id: 'stone',  name: 'Stone',  col: '#c2925f', dark: '#7d5530', light: '#f0dcc0' },
  { id: 'frost',  name: 'Frost',  col: '#7fdcf5', dark: '#2f8fb8', light: '#e4f9ff' },
  { id: 'sky',    name: 'Sky',    col: '#9aaeff', dark: '#5566cc', light: '#e3e9ff' },
  { id: 'venom',  name: 'Venom',  col: '#b45fe0', dark: '#6f2aa0', light: '#ecd2ff' },
  { id: 'mystic', name: 'Mystic', col: '#6a5cf0', dark: '#3524a8', light: '#ddd6ff' },
  { id: 'shadow', name: 'Shadow', col: '#57466e', dark: '#241a35', light: '#d2c6e6' }
];
const EL = {}; ELEMENTS.forEach((e, i) => { e.i = i; EL[e.id] = e; });

// each element beats exactly two others and is beaten by exactly two
const BEATS = {
  fire: ['leaf', 'frost'], water: ['fire', 'stone'], leaf: ['water', 'stone'],
  spark: ['water', 'sky'], stone: ['fire', 'spark'], frost: ['leaf', 'sky'],
  sky: ['venom', 'shadow'], venom: ['mystic', 'frost'], mystic: ['venom', 'shadow'],
  shadow: ['mystic', 'spark']
};
const STRONG = 1.5, WEAK = 0.7;
function typeMult(att, def) {
  if (BEATS[att].indexOf(def) >= 0) return STRONG;
  if (BEATS[def].indexOf(att) >= 0) return WEAK;
  return 1;
}

const ROLES = {
  tank:    { name: 'Guardian', tip: 'Tough front-liner' },
  brawler: { name: 'Brawler',  tip: 'Melee damage' },
  dasher:  { name: 'Dasher',   tip: 'Hunts Snipers and Casters' },
  sniper:  { name: 'Sniper',   tip: 'Long range, fragile' },
  caster:  { name: 'Caster',   tip: 'Area magic & support' }
};
const ROLE_ORDER = ['tank', 'brawler', 'dasher', 'sniper', 'caster'];

// [id, name, element, role, hp, dmg, cooldown, range(0 = melee), speed, radius, move name, blurb, extra]
const SPECIES_RAW = [
  // ---- FIRE ----
  ['furnox', 'Furnox', 'fire', 'tank', 980, 58, 1.4, 0, 30, 20, 'Furnace Ram', 'Burns on hit', { burn: 3 }],
  ['blazaroo', 'Blazaroo', 'fire', 'brawler', 600, 33, 1.0, 0, 44, 16, 'Blaze Jabs', 'Two fast punches', { hits: 2, burnCh: .3 }],
  ['flarret', 'Flarret', 'fire', 'dasher', 400, 88, 1.1, 70, 80, 13, 'Comet Dash', 'Dashes through foes', { burn: 2 }],
  ['solcub', 'Solcub', 'fire', 'sniper', 330, 72, 1.4, 145, 36, 14, 'Solar Flare', 'Searing sun beam', { burn: 2 }],
  ['campyre', 'Campyre', 'fire', 'caster', 380, 74, 1.9, 115, 34, 14, 'Bonfire Ring', 'Area burn', { aoe: 40, burn: 3 }],
  // ---- WATER ----
  ['walrump', 'Walrump', 'water', 'tank', 1100, 46, 1.6, 0, 26, 21, 'Tidal Flop', 'Splash hits nearby foes', { aoe: 36 }],
  ['snipclaw', 'Snipclaw', 'water', 'brawler', 680, 74, 1.15, 0, 38, 16, 'Bubble Clamp', 'Heavy single pinch', {}],
  ['zipfin', 'Zipfin', 'water', 'dasher', 420, 92, 1.2, 80, 76, 13, 'Jet Lance', 'Water-jet charge', {}],
  ['inkjet', 'Inkjet', 'water', 'sniper', 320, 22, 1.3, 135, 36, 13, 'Ink Burst', 'Three shots, slows foes', { hits: 3, chill: 1.2 }],
  ['drizzelly', 'Drizzelly', 'water', 'caster', 400, 60, 2.0, 110, 34, 14, 'Bubble Bloom', 'Area pop + heals allies', { aoe: 38, heal: 26 }],
  // ---- LEAF ----
  ['stumply', 'Stumply', 'leaf', 'tank', 1050, 62, 1.35, 46, 25, 20, 'Root Rise', 'Roots foes in place', { root: 1.2 }],
  ['brambear', 'Brambear', 'leaf', 'brawler', 660, 22, 1.05, 0, 40, 16, 'Thorn Swipe', 'Triple claw, self-heals', { hits: 3, selfHeal: 7 }],
  ['cloverbun', 'Cloverbun', 'leaf', 'dasher', 410, 80, 1.0, 64, 78, 13, 'Lucky Kick', 'May land a double-damage kick', { crit: .25 }],
  ['bloomerang', 'Bloomerang', 'leaf', 'sniper', 340, 44, 1.5, 130, 36, 13, 'Petal-rang', 'Hits out and back', { back: 34 }],
  ['sporel', 'Sporel', 'leaf', 'caster', 420, 58, 1.9, 105, 34, 14, 'Healing Spores', 'Heals all nearby allies', { heal: 34, healR: 72 }],
  // ---- SPARK ----
  ['ohmadillo', 'Ohmadillo', 'spark', 'tank', 900, 72, 1.5, 70, 32, 19, 'Static Roll', 'Rolls in, may paralyze', { stunCh: .45, stun: .6 }],
  ['zapcoon', 'Zapcoon', 'spark', 'brawler', 580, 66, .95, 0, 46, 16, 'Tail Taser', 'May paralyze', { stunCh: .25, stun: .6 }],
  ['dynafly', 'Dynafly', 'spark', 'dasher', 400, 86, 1.0, 76, 88, 12, 'Zigzag Strike', 'Fastest creature', {}],
  ['teslowl', 'Teslowl', 'spark', 'sniper', 310, 68, 1.25, 140, 36, 14, 'Arc Bolt', 'Lightning sniper', { stunCh: .15, stun: .5 }],
  ['nimbolt', 'Nimbolt', 'spark', 'caster', 350, 66, 1.8, 118, 34, 14, 'Thunderclap', 'Chains to 2 more foes', { chain: 2, stunCh: .25, stun: .5 }],
  // ---- STONE ----
  ['cobblem', 'Cobblem', 'stone', 'tank', 1150, 42, 1.6, 0, 24, 21, 'Quake Stomp', 'Stomp hits all around', { aoe: 42, stunCh: .2, stun: .7 }],
  ['quarrilla', 'Quarrilla', 'stone', 'brawler', 700, 72, 1.25, 0, 38, 17, 'Rock Uppercut', 'Launches its target', { stun: .45, stunCh: 1 }],
  ['jerboing', 'Jerboing', 'stone', 'dasher', 420, 96, 1.3, 90, 70, 12, 'Burrow Pop', 'Tunnels under the fight', {}],
  ['glintgecko', 'Glintgecko', 'stone', 'sniper', 330, 80, 1.6, 155, 36, 13, 'Prism Shard', 'Longest range, hardest hit', {}],
  ['ankhat', 'Ankhat', 'stone', 'caster', 370, 70, 2.0, 118, 34, 14, 'Pyramid Seal', 'Area slow', { aoe: 42, chill: 2.5 }],
  // ---- FROST ----
  ['yetuff', 'Yetuff', 'frost', 'tank', 1020, 56, 1.5, 0, 27, 20, 'Snowball Smash', 'Chills its target', { chill: 2.5 }],
  ['slapguin', 'Slapguin', 'frost', 'brawler', 600, 32, .9, 0, 44, 16, 'Flipper Slap', 'Double slap, chills', { hits: 2, chill: 1.5 }],
  ['lynxicle', 'Lynxicle', 'frost', 'dasher', 430, 90, 1.2, 80, 76, 13, 'Blizzard Pounce', 'Leaping ice claws', { chill: 1.5 }],
  ['rimeling', 'Rimeling', 'frost', 'sniper', 330, 62, 1.4, 145, 36, 14, 'Frost Ray', 'Freezing beam, chills', { chill: 2 }],
  ['auroseal', 'Auroseal', 'frost', 'caster', 390, 64, 2.2, 112, 34, 14, 'Aurora Veil', 'Area freeze', { aoe: 46, stun: .7, stunCh: 1 }],
  // ---- SKY ----
  ['wooloft', 'Wooloft', 'sky', 'tank', 940, 70, 1.2, 0, 31, 20, 'Cloud Bump', 'Knocks foes back', { knock: 30 }],
  ['kickadee', 'Kickadee', 'sky', 'brawler', 540, 70, .9, 0, 50, 15, 'Gale Kick', 'Wind kick hits a small arc', { aoe: 26 }],
  ['hummingblur', 'Hummingblur', 'sky', 'dasher', 370, 20, 1.0, 40, 92, 11, 'Needle Flurry', 'Five lightning jabs', { hits: 5 }],
  ['pelicannon', 'Pelicannon', 'sky', 'sniper', 360, 70, 1.4, 138, 36, 15, 'Air Cannon', 'Blasts foes backward', { knock: 36 }],
  ['zephyray', 'Zephyray', 'sky', 'caster', 370, 76, 2.0, 115, 34, 15, 'Twister', 'Pulls foes together', { aoe: 40, pull: 22 }],
  // ---- VENOM ----
  ['snoxious', 'Snoxious', 'venom', 'tank', 1000, 36, 1.5, 0, 22, 20, 'Shell Spray', 'Poisons everything close', { aoe: 42, poison: 4 }],
  ['scorplet', 'Scorplet', 'venom', 'brawler', 590, 58, 1.0, 0, 42, 16, 'Tail Sting', 'Strong poison', { poison: 5 }],
  ['hopdart', 'Hopdart', 'venom', 'dasher', 400, 70, 1.1, 70, 74, 13, 'Dart Leap', 'Leaps in, poisons', { poison: 4 }],
  ['hissyfit', 'Hissyfit', 'venom', 'sniper', 310, 46, 1.5, 130, 36, 14, 'Venom Spit', 'Leaves a toxic puddle', { puddle: 3 }],
  ['bubbrew', 'Bubbrew', 'venom', 'caster', 360, 60, 2.0, 115, 34, 15, 'Hex Brew', 'Area poison cloud', { aoe: 42, poison: 5 }],
  // ---- MYSTIC ----
  ['monolit', 'Monolit', 'mystic', 'tank', 900, 36, 1.6, 0, 24, 20, 'Rune Pulse', 'Area pulse, shields itself', { aoe: 42, shield: 26 }],
  ['chipmonk', 'Chipmonk', 'mystic', 'brawler', 600, 68, 1.0, 0, 44, 16, 'Chi Palm', 'Pushes foes away', { knock: 22 }],
  ['telemur', 'Telemur', 'mystic', 'dasher', 400, 98, 1.3, 110, 70, 13, 'Blink Strike', 'Teleports behind its target', {}],
  ['mageling', 'Mageling', 'mystic', 'sniper', 300, 80, 1.45, 150, 36, 14, 'Arcane Orb', 'Big magic blast', {}],
  ['lunafawn', 'Lunafawn', 'mystic', 'caster', 390, 76, 1.8, 118, 36, 15, 'Moonbeam', 'Heals the weakest ally', { healOne: 55 }],
  // ---- SHADOW ----
  ['cryptoise', 'Cryptoise', 'shadow', 'tank', 1080, 42, 1.6, 60, 23, 20, 'Grave Rise', 'Curses: foes take more damage', { curse: 3 }],
  ['obsidrake', 'Obsidrake', 'shadow', 'brawler', 640, 76, 1.2, 0, 40, 17, 'Night Fang', 'Drains life', { leech: .2 }],
  ['shinobat', 'Shinobat', 'shadow', 'dasher', 410, 82, 1.05, 72, 82, 12, 'Echo Swoop', 'Swoops and drains life', { leech: .3 }],
  ['lumbra', 'Lumbra', 'shadow', 'sniper', 310, 24, 1.35, 138, 36, 14, 'Wisp Spiral', 'Three spiralling wisps', { hits: 3 }],
  ['omencrow', 'Omencrow', 'shadow', 'caster', 350, 66, 2.0, 118, 34, 14, 'Nightfall', 'Area curse', { aoe: 42, curse: 4 }]
];
// Fights are tuned to be long enough to read and react to: health (and healing) is scaled up
// from the base table so a creature usually lasts a good while on the field.
const HP_SCALE = 3, HEAL_SCALE = 2, AOE_SCALE = 1.28;
const SPECIES = SPECIES_RAW.map((r, i) => {
  const s = Object.assign({
    i, id: r[0], name: r[1], el: r[2], role: r[3], hp: Math.round(r[4] * HP_SCALE), dmg: r[5], cd: r[6],
    range: r[7], spd: r[8], r: r[9], move: r[10], blurb: r[11]
  }, r[12]);
  ['heal', 'healOne', 'selfHeal', 'shield'].forEach(k => { if (s[k]) s[k] = Math.round(s[k] * HEAL_SCALE); });
  if (s.aoe) s.aoe = Math.round(s.aoe * AOE_SCALE);   // creatures stand further apart now, so blasts reach further too
  return s;
});
// Dashers hit the fragile back line extra hard
const BACKSTAB = 1.5;
const SP = {}; SPECIES.forEach(s => { SP[s.id] = s; });
const BY_EL = {}; ELEMENTS.forEach(e => { BY_EL[e.id] = SPECIES.filter(s => s.el === e.id); });

// ---------- the ten league teams ----------
const TEAMS = [
  { id: 'aces',      name: 'Ember Aces',       el: 'fire',   c1: '#ff5a36', c2: '#ffd23d' },
  { id: 'riders',    name: 'Tide Riders',      el: 'water',  c1: '#2f8fff', c2: '#bfe6ff' },
  { id: 'guardians', name: 'Grove Guardians',  el: 'leaf',   c1: '#3dba55', c2: '#f6e27a' },
  { id: 'vanguard',  name: 'Volt Vanguard',    el: 'spark',  c1: '#ffc61a', c2: '#3a3f5c' },
  { id: 'titans',    name: 'Stone Titans',     el: 'stone',  c1: '#b07a45', c2: '#f3e3c7' },
  { id: 'guild',     name: 'Glacier Guild',    el: 'frost',  c1: '#55cdea', c2: '#ffffff' },
  { id: 'wings',     name: 'Gale Wings',       el: 'sky',    c1: '#8296ff', c2: '#fff0a8' },
  { id: 'fangs',     name: 'Venom Fangs',      el: 'venom',  c1: '#a44ee0', c2: '#9dff5a' },
  { id: 'order',     name: 'Mystic Order',     el: 'mystic', c1: '#5747e6', c2: '#ffcf4a' },
  { id: 'court',     name: 'Shadow Court',     el: 'shadow', c1: '#3a2d50', c2: '#ff3d5e' }
];
const TEAM = {}; TEAMS.forEach((tm, i) => { tm.i = i; TEAM[tm.id] = tm; });

const RULES = {
  FW: 300, FH: 440,          // battlefield size in field units
  MAX_FIELD: 6,              // creatures per side
  KO_TARGET: 15,             // first to this many knockouts wins
  STINT: 60,                 // seconds a creature stays out before it is called back
  SPREAD: 1.22,              // how far apart creatures settle, in combined body radii
  DEPLOY: 0.55,              // pop-in time before a fresh creature acts
  EMPTY_GRACE: 5,            // seconds with an empty side before the rival is awarded a point
  FIRST_GRACE: 12,           // ...but the opening send-out gets longer
  MARGIN: 16
};
