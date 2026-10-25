/* Critter Arena 4 — game data: elemental types, creature species, league trainers.
 * Pure data, shared by the simulation (also runs headless in node) and the renderer. */
(function (root) {
  var CA = root.CA = root.CA || {};

  // ---- Elemental types -------------------------------------------------------
  // Five elements form a cycle: each one is strong against the next, weak to the previous.
  //   Fire > Leaf > Stone > Spark > Water > Fire
  // Mystic magic is strong against Mystic and Dragon; Dragons shrug off the elements.
  CA.TYPES = {
    fire:   { name: 'Fire',   color: '#ff7a2f', light: '#ffc08f', dark: '#b8430f' },
    leaf:   { name: 'Leaf',   color: '#45c25a', light: '#a6ec9c', dark: '#21803a' },
    stone:  { name: 'Stone',  color: '#b0946a', light: '#e2cfa8', dark: '#6e5735' },
    spark:  { name: 'Spark',  color: '#ffc61f', light: '#ffe789', dark: '#b88400' },
    water:  { name: 'Water',  color: '#3aa2ff', light: '#9bd2ff', dark: '#1a5fb0' },
    mystic: { name: 'Mystic', color: '#a45cff', light: '#d6b3ff', dark: '#5e2aa8' },
    normal: { name: 'Normal', color: '#c8b496', light: '#efe3cc', dark: '#86735a' },
    dragon: { name: 'Dragon', color: '#3e7bff', light: '#a9c6ff', dark: '#1b3fa8' }
  };
  var CYCLE = ['fire', 'leaf', 'stone', 'spark', 'water'];

  CA.typeMult = function (atk, def) {
    var a = CYCLE.indexOf(atk), d = CYCLE.indexOf(def);
    if (a >= 0 && d >= 0) {
      if ((a + 1) % 5 === d) return 1.5;
      if ((d + 1) % 5 === a) return 0.67;
      return 1;
    }
    if (atk === 'mystic' && (def === 'mystic' || def === 'dragon')) return 1.5;
    if (atk === 'dragon' && def === 'dragon') return 1.5;
    if (a >= 0 && def === 'dragon') return 0.67;
    return 1;
  };

  // ---- Roles (card frames borrow a trading-card-game palette) ----------------
  CA.ROLES = {
    tank:     { name: 'Tank',     frame: '#5b7fd1', frameL: '#a9c0f5', ink: '#fff', blurb: 'Huge HP. Taunts nearby foes into attacking it.' },
    brawler:  { name: 'Brawler',  frame: '#d9773e', frameL: '#f6b483', ink: '#fff', blurb: 'Sturdy melee fighter with strong hits.' },
    ranged:   { name: 'Ranged',   frame: '#1c9c80', frameL: '#6fdcc0', ink: '#fff', blurb: 'Fragile, but hits from far behind the front line.' },
    splash:   { name: 'Splash',   frame: '#b9478a', frameL: '#ea95c6', ink: '#fff', blurb: 'Area damage. Shreds swarms and clumps.' },
    support:  { name: 'Support',  frame: '#dfe6ef', frameL: '#ffffff', ink: '#2b3242', blurb: 'Heals or shields allies. Keep it protected.' },
    assassin: { name: 'Assassin', frame: '#2f2b36', frameL: '#6a6475', ink: '#ffd76a', blurb: 'Leaps over the front line to hunt fragile backliners.' },
    swarm:    { name: 'Swarm',    frame: '#d9b45b', frameL: '#f5dc96', ink: '#3a2a10', blurb: 'Many tiny bodies. Surrounds and melts big targets.' },
    legend:   { name: 'Legend',   frame: '#8e59b8', frameL: '#d2acef', ink: '#fff6c8', blurb: 'A legendary powerhouse. Expensive, devastating.' }
  };

  // ---- Species ---------------------------------------------------------------
  // Units are in arena tiles (field is 18 x 30). Times in seconds.
  //   hp, dmg, rate (seconds between attacks), range (edge-to-edge reach), spd (tiles/s),
  //   r (body radius), n (bodies per card), atk: melee|proj|chain|cone|beam|spore
  CA.SPECIES = {
    emberpup: {
      name: 'Emberpup', type: 'fire', role: 'brawler', cost: 3,
      hp: 760, dmg: 100, rate: 0.8, range: 0.35, spd: 2.1, r: 0.5, atk: 'melee',
      desc: 'A plucky fox pup with a tail of living flame. Quick on its paws and hits hard for its cost.',
      cry: [620, 900, 520], cryWave: 'square'
    },
    puddlefin: {
      name: 'Puddlefin', type: 'water', role: 'ranged', cost: 3,
      hp: 370, dmg: 78, rate: 1.0, range: 5.0, spd: 1.5, r: 0.5, atk: 'proj', proj: 'bubble', pspd: 9,
      desc: 'Puffs its cheeks and fires bouncy bubbles from a safe distance.',
      cry: [500, 760, 640, 820], cryWave: 'triangle'
    },
    sproutle: {
      name: 'Sproutle', type: 'leaf', role: 'support', cost: 3,
      hp: 460, dmg: 34, rate: 1.1, range: 3.5, spd: 1.5, r: 0.5, atk: 'proj', proj: 'seed', pspd: 8,
      heal: 52, healRate: 0.9, healRange: 4.2,
      desc: 'Its sprout glows with sunshine. Constantly heals the most wounded nearby ally.',
      cry: [700, 980, 860], cryWave: 'triangle'
    },
    zappip: {
      name: 'Zappip', type: 'spark', role: 'assassin', cost: 3,
      hp: 430, dmg: 64, rate: 0.62, range: 0.3, spd: 2.6, r: 0.45, atk: 'melee',
      leap: { range: 7, cd: 7, mult: 2.5 }, hunter: true,
      desc: 'A static-charged squirrel. Pounces over the front line onto fragile backliners. Ignores taunts.',
      cry: [1100, 1500, 900, 1600], cryWave: 'square'
    },
    pebblump: {
      name: 'Pebblump', type: 'stone', role: 'tank', cost: 5,
      hp: 2000, dmg: 112, rate: 1.6, range: 0.4, spd: 0.9, r: 0.95, atk: 'melee', taunt: 3.3,
      desc: 'A sleepy, mossy boulder. Taunts every foe within reach and simply refuses to fall over.',
      cry: [180, 140, 220], cryWave: 'sawtooth'
    },
    fuzzlets: {
      name: 'Fuzzlets', type: 'normal', role: 'swarm', cost: 2, n: 4,
      hp: 155, dmg: 40, rate: 0.8, range: 0.25, spd: 2.2, r: 0.33, atk: 'melee',
      desc: 'Four fluffy furballs with tiny claws. Individually harmless. Together, terrifying.',
      cry: [1300, 1700, 1400], cryWave: 'square'
    },
    hexmoth: {
      name: 'Hexmoth', type: 'mystic', role: 'splash', cost: 4,
      hp: 410, dmg: 102, rate: 1.5, range: 4.5, spd: 1.6, r: 0.55, atk: 'proj', proj: 'orb', pspd: 7, splash: 1.45, fly: true,
      desc: 'Its wing-eyes shimmer with hexes. Lobs arcane orbs that burst over a wide area.',
      cry: [880, 660, 990, 740], cryWave: 'sine'
    },
    shellbert: {
      name: 'Shellbert', type: 'water', role: 'tank', cost: 4,
      hp: 1320, dmg: 74, rate: 1.3, range: 0.4, spd: 0.95, r: 0.85, atk: 'melee', taunt: 3.0, armor: 0.27,
      desc: 'Hides behind a mighty shell that shrugs off 27% of all damage. Taunts nearby foes.',
      cry: [300, 380, 260], cryWave: 'triangle'
    },
    brambull: {
      name: 'Brambull', type: 'leaf', role: 'brawler', cost: 5,
      hp: 1750, dmg: 168, rate: 1.4, range: 0.4, spd: 1.25, r: 0.9, atk: 'melee', thorns: 0.3,
      desc: 'A thorny little bull. Melee attackers take 30% of their damage back as thorn pricks.',
      cry: [240, 320, 200, 280], cryWave: 'sawtooth'
    },
    voltwing: {
      name: 'Voltwing', type: 'spark', role: 'ranged', cost: 4,
      hp: 430, dmg: 92, rate: 1.3, range: 4.5, spd: 2.0, r: 0.5, atk: 'chain', chain: 2, chainRange: 2.6, fly: true,
      desc: 'A crackling songbird. Its lightning leaps between up to three foes.',
      cry: [1400, 1900, 1200, 2000], cryWave: 'square'
    },
    magmaw: {
      name: 'Magmaw', type: 'fire', role: 'splash', cost: 6,
      hp: 2050, dmg: 150, rate: 1.7, range: 1.6, spd: 0.85, r: 1.0, atk: 'cone', cone: 1.25,
      desc: 'A roly-poly lava toad. Breathes a wide cone of flame that scorches everything in front of it.',
      cry: [160, 120, 200, 90], cryWave: 'sawtooth'
    },
    lumisprite: {
      name: 'Lumisprite', type: 'mystic', role: 'support', cost: 3,
      hp: 360, dmg: 44, rate: 1.2, range: 3.5, spd: 1.8, r: 0.45, atk: 'proj', proj: 'spark', pspd: 10, fly: true,
      shield: 190, shieldRate: 4.5, shieldRange: 4.6, shieldN: 3,
      desc: 'A pixie of starlight. Every few seconds it wraps three allies in protective bubbles.',
      cry: [1200, 1600, 2000, 1800], cryWave: 'sine'
    },
    gloomcap: {
      name: 'Gloomcap', type: 'leaf', role: 'splash', cost: 3,
      hp: 560, dmg: 64, rate: 2.2, range: 3.5, spd: 1.15, r: 0.55, atk: 'spore', splash: 1.6, slow: 0.45, slowT: 2.6, pspd: 6,
      desc: 'A drowsy mushroom. Its spore puffs damage and slow every foe in the cloud.',
      cry: [420, 360, 480], cryWave: 'triangle'
    },
    rockhorn: {
      name: 'Rockhorn', type: 'stone', role: 'brawler', cost: 4,
      hp: 1260, dmg: 128, rate: 1.3, range: 0.4, spd: 1.4, r: 0.8, atk: 'melee', charge: { spd: 3.3, mult: 2.2, delay: 0.7, min: 2.5 },
      desc: 'Lowers its craggy horn and charges. The first hit after a charge deals double damage.',
      cry: [260, 200, 330], cryWave: 'sawtooth'
    },
    hootini: {
      name: 'Hootini', type: 'mystic', role: 'ranged', cost: 4,
      hp: 380, dmg: 176, rate: 1.9, range: 6.5, spd: 1.4, r: 0.5, atk: 'proj', proj: 'star', pspd: 11,
      desc: 'A tiny owl magus in a starry hat. Snipes with huge star bolts from extreme range.',
      cry: [700, 520, 700, 520], cryWave: 'sine'
    },
    azurion: {
      name: 'Azurion', type: 'dragon', role: 'legend', cost: 7,
      hp: 2350, dmg: 285, rate: 2.3, range: 6.0, spd: 1.15, r: 1.05, atk: 'beam', beamW: 0.95, fly: true,
      desc: 'A legendary pale dragon with sapphire eyes. Its Azure Burst beam pierces every foe in a line.',
      cry: [330, 500, 440, 660, 300], cryWave: 'sawtooth'
    },
    buzzlings: {
      name: 'Buzzlings', type: 'spark', role: 'swarm', cost: 3, n: 3,
      hp: 185, dmg: 40, rate: 0.6, range: 0.3, spd: 2.5, r: 0.34, atk: 'melee', fly: true,
      desc: 'Three fuzzy thunder-bees. They fly over the brawl and sting relentlessly.',
      cry: [1800, 1700, 1900, 1750], cryWave: 'sawtooth'
    },
    shadecat: {
      name: 'Shadecat', type: 'mystic', role: 'assassin', cost: 4,
      hp: 560, dmg: 92, rate: 0.75, range: 0.3, spd: 2.4, r: 0.5, atk: 'melee',
      leap: { range: 8, cd: 6, mult: 2.6 }, hunter: true, veil: 1.6,
      desc: 'A moon-shadow kitten. Arrives veiled and untargetable, then pounces on the weakest backliner.',
      cry: [900, 1200, 700], cryWave: 'triangle'
    }
  };
  CA.SPECIES_ORDER = ['emberpup', 'puddlefin', 'sproutle', 'zappip', 'fuzzlets', 'buzzlings',
    'shellbert', 'gloomcap', 'lumisprite', 'hexmoth', 'voltwing', 'hootini', 'rockhorn',
    'shadecat', 'pebblump', 'brambull', 'magmaw', 'azurion'];
  CA.SPECIES_ORDER.forEach(function (id) {
    var s = CA.SPECIES[id];
    s.id = id; s.n = s.n || 1; s.splash = s.splash || 0;
  });

  // ---- Evolution --------------------------------------------------------------
  // Creatures earn XP by fighting. Once ready, the trainer may spend energy to evolve them:
  // a 25% heal, +40% max HP, +30% power, a bigger body and a brand new name.
  CA.EVOS = {
    emberpup: { name: 'Blazehound', move: 'Inferno Fang', desc: 'Its flame tail has grown into a blazing mane. Bites leave the air shimmering.' },
    puddlefin: { name: 'Tidalfin', move: 'Bubble Barrage', desc: 'Wears a crown of three droplets and fires bubbles twice its old size.' },
    sproutle: { name: 'Bloomtle', move: 'Sunbloom', desc: 'Its sprout has burst into a great flower that soaks up sunshine to heal friends.' },
    zappip: { name: 'Thundertail', move: 'Thunder Pounce', desc: 'Two lightning tails crackle behind it. Its pounce hits like a storm.' },
    fuzzlets: { name: 'Fuzzkings', move: 'Royal Scratch', desc: 'Each furball now wears a tiny golden crown and fights with royal fury.' },
    buzzlings: { name: 'Buzzqueens', move: 'Volt Sting', desc: 'Crowned thunder-bees with sparking stingers.' },
    shellbert: { name: 'Fortoise', move: 'Shell Fortress', desc: 'Its shell sprouted golden spikes. Almost nothing gets through.' },
    gloomcap: { name: 'Gloomshroom', move: 'Sleepy Spores', desc: 'A towering cap that glows at night. Its spores hang in the air for ages.' },
    lumisprite: { name: 'Lumiseraph', move: 'Starlight Veil', desc: 'A halo and four shining wings. Its bubbles shrug off huge hits.' },
    hexmoth: { name: 'Arcanomoth', move: 'Hex Nova', desc: 'A second pair of rune-covered wings amplifies every hex orb.' },
    voltwing: { name: 'Stormwing', move: 'Chain Spark', desc: 'Storm clouds follow it. Its lightning arcs through even more foes.' },
    hootini: { name: 'Archowl', move: 'Star Volley', desc: 'Its hat now holds the crescent moon itself. Star bolts strike from the sky.' },
    rockhorn: { name: 'Cragoceros', move: 'Horn Rush', desc: 'A second horn and armour plates of granite. Unstoppable at full charge.' },
    shadecat: { name: 'Eclipsicat', move: 'Shadow Pounce', desc: 'Twin moon tails and eyes like eclipses. Vanishes, then strikes.' },
    pebblump: { name: 'Gemlump', move: 'Crystal Taunt', desc: 'Crystals grew from its mossy back. Still sleepy. Even harder to topple.' },
    brambull: { name: 'Thornox', move: 'Bramble Charge', desc: 'Roses bloom between its thorns, and its horns now curl like oak roots.' },
    magmaw: { name: 'Volcanaw', move: 'Lava Breath', desc: 'A tiny volcano erupts on its back. Its breath could melt a boulder.' },
    azurion: { name: 'Azurion Prime', move: 'Azure Burst', desc: 'The legend awakened: its sapphire eyes blaze and its wings shine like the sky.' }
  };
  CA.evoCost = function (sp) { return Math.ceil(sp.cost * 0.55); };
  CA.evoXp = function (sp) { return 380 * sp.cost; };
  // special move callouts shown above creatures
  CA.MOVES = {
    beam: 'Azure Burst', cone: 'Lava Breath', chain: 'Chain Spark', spore: 'Sleepy Spores', orb: 'Hex Orb',
    zappip: 'Thunder Pounce', shadecat: 'Shadow Pounce', rockhorn: 'Horn Rush', lumisprite: 'Starlight Veil'
  };

  // ---- Collection: ten starters, the rest are won from league trainers ---------
  CA.STARTERS = ['emberpup', 'puddlefin', 'sproutle', 'zappip', 'fuzzlets', 'buzzlings', 'shellbert', 'gloomcap', 'rockhorn', 'pebblump'];
  CA.DEFAULT_DECK = ['pebblump', 'emberpup', 'puddlefin', 'sproutle', 'fuzzlets', 'zappip', 'gloomcap', 'rockhorn'];

  // ---- The Sunshine League: ten rival teams ----------------------------------
  // skill 0..1 drives the AI: reaction speed, counter-play, placement smarts, patience.
  CA.TRAINERS = [
    {
      id: 'pip', reward: 'voltwing', name: 'Pip', title: 'Rookie Trainer', skill: 0.08,
      look: { skin: '#ffd2a6', hair: '#6b3d1f', style: 'spiky', cap: '#4ec36b', shirt: '#ffcf3a', pants: '#3b6cc9' },
      badge: { shape: 'circle', color: '#8ee07a' },
      deck: ['fuzzlets', 'emberpup', 'puddlefin', 'sproutle', 'buzzlings', 'zappip', 'shellbert', 'gloomcap'],
      intro: 'I just got my first critters! Let\'s battle!', lose: 'Aww... you\'re really good!', win: 'Wow, I actually won?!'
    },
    {
      id: 'coral', reward: 'lumisprite', name: 'Coral', title: 'Tidal Swimmer', skill: 0.22,
      look: { skin: '#f5c59c', hair: '#ff8a5b', style: 'long', cap: null, shirt: '#2fb4e8', pants: '#fff2c9' },
      badge: { shape: 'drop', color: '#3aa2ff' },
      deck: ['puddlefin', 'shellbert', 'voltwing', 'lumisprite', 'fuzzlets', 'gloomcap', 'hootini', 'emberpup'],
      intro: 'My team flows like the tide. Can you swim?', lose: 'Washed right out...', win: 'Splash! Swept away!'
    },
    {
      id: 'blaze', reward: 'magmaw', name: 'Blaze', title: 'Hothead Brawler', skill: 0.35,
      look: { skin: '#e8a679', hair: '#e8382b', style: 'spiky', cap: '#2b2b33', shirt: '#ff6a2a', pants: '#2b2b33' },
      badge: { shape: 'flame', color: '#ff6a2a' },
      deck: ['emberpup', 'magmaw', 'rockhorn', 'pebblump', 'fuzzlets', 'brambull', 'hexmoth', 'sproutle'],
      intro: 'Full speed ahead! Burn it ALL down!', lose: 'Tch... I burned out.', win: 'HA! Scorched!'
    },
    {
      id: 'ivy', reward: 'brambull', name: 'Ivy', title: 'Greenhouse Keeper', skill: 0.45,
      look: { skin: '#ffe0bd', hair: '#3f9a4a', style: 'bun', cap: null, shirt: '#9be36b', pants: '#7a4f2a' },
      badge: { shape: 'leaf', color: '#45c25a' },
      deck: ['sproutle', 'brambull', 'gloomcap', 'shellbert', 'puddlefin', 'lumisprite', 'buzzlings', 'fuzzlets'],
      intro: 'Patience grows the strongest roots. Shall we?', lose: 'You weeded me out. Lovely.', win: 'Everything blooms in time.'
    },
    {
      id: 'volt', reward: 'hexmoth', name: 'Volt', title: 'Speed Demon', skill: 0.55,
      look: { skin: '#f2c193', hair: '#ffd21f', style: 'spiky', cap: '#1f2a66', shirt: '#ffe14a', pants: '#1f2a66' },
      badge: { shape: 'bolt', color: '#ffc61f' },
      deck: ['zappip', 'voltwing', 'buzzlings', 'emberpup', 'rockhorn', 'hootini', 'lumisprite', 'shellbert'],
      intro: 'Blink and you\'ll miss it! Let\'s GO!', lose: 'Too slow... was it me?!', win: 'Zzzap! Too fast for ya!'
    },
    {
      id: 'granite', reward: 'hootini', name: 'Granite', title: 'The Iron Wall', skill: 0.62,
      look: { skin: '#c98d62', hair: '#3a3a3a', style: 'short', cap: '#8a7a5c', shirt: '#9c8460', pants: '#4a3f30' },
      badge: { shape: 'hex', color: '#b0946a' },
      deck: ['pebblump', 'rockhorn', 'shellbert', 'brambull', 'fuzzlets', 'hootini', 'gloomcap', 'voltwing'],
      intro: 'Nothing gets past my wall. Nothing.', lose: 'The wall... has crumbled.', win: 'Solid as stone.'
    },
    {
      id: 'mystica', reward: 'shadecat', name: 'Mystica', title: 'Dark Illusionist', skill: 0.7,
      look: { skin: '#f7d9c4', hair: '#f4e27a', style: 'long', cap: '#3b2a7a', capStyle: 'witch', shirt: '#5a3fb0', pants: '#e04fa0' },
      badge: { shape: 'star', color: '#a45cff' },
      deck: ['hootini', 'hexmoth', 'lumisprite', 'shadecat', 'gloomcap', 'shellbert', 'fuzzlets', 'brambull'],
      intro: 'I activate my trap card... just kidding. Or am I?', lose: 'My illusions... shattered.', win: 'Your fate was sealed.'
    },
    {
      id: 'twins', name: 'Kit & Kat', title: 'Swarm Twins', skill: 0.76,
      look: { skin: '#ffd6b0', hair: '#ff5fa2', style: 'twin', cap: null, shirt: '#ff9ad0', pants: '#5b49c9' },
      badge: { shape: 'twin', color: '#ff5fa2' },
      deck: ['fuzzlets', 'buzzlings', 'zappip', 'pebblump', 'sproutle', 'lumisprite', 'gloomcap', 'shadecat'],
      intro: 'Two of us! A hundred of them! Ready?!', lose: 'No fair! ...okay, it was fair.', win: 'Swarmed! Hee hee!'
    },
    {
      id: 'quartz', name: 'Dr. Quartz', title: 'Battle Scientist', skill: 0.86,
      look: { skin: '#f0c9a5', hair: '#dfe6ef', style: 'short', cap: null, shirt: '#ffffff', pants: '#3a7f8a', glasses: true },
      badge: { shape: 'gem', color: '#38d3c8' },
      deck: ['hootini', 'hexmoth', 'voltwing', 'gloomcap', 'pebblump', 'shellbert', 'lumisprite', 'magmaw'],
      intro: 'Fascinating. Let us test your hypothesis in battle.', lose: 'Remarkable data. You win.', win: 'As my calculations predicted.'
    },
    {
      id: 'aurora', reward: 'azurion', name: 'Aurora', title: 'League Champion', skill: 1.0,
      look: { skin: '#ffe3c8', hair: '#bfe6ff', style: 'long', cap: '#ffffff', capStyle: 'crown', shirt: '#3e7bff', pants: '#f2f6ff' },
      badge: { shape: 'crown', color: '#ffd23f' },
      deck: ['azurion', 'pebblump', 'hootini', 'shadecat', 'lumisprite', 'brambull', 'magmaw', 'fuzzlets'],
      intro: 'So you made it. Show me everything you\'ve learned!', lose: 'A new Champion is born. Congratulations!', win: 'Come back stronger. I\'ll be waiting.'
    }
  ];

  // Trainers further up the league draw extra energy from their home crowd.
  CA.crowdBonus = function (tr) { return 0.8 + 0.32 * tr.skill; };

  // ---- Levels -----------------------------------------------------------------------
  // Level 10 is the balance baseline (x1.0). Each level is worth 3% HP and power.
  CA.lvMult = function (lv) { return 0.7 + 0.03 * lv; };
  CA.xpNext = function (lv) { return 30 + 18 * lv; };
  CA.MAX_LV = 40;
  // XP each team critter earns from one battle. Like the later classics it scales with the level gap:
  // critters above the opponents' level learn less, ones below catch up faster.
  CA.battleXp = function (win, enemyLv, used, kills, myLv) {
    var base = win ? 30 + 7 * enemyLv : 12 + 3 * enemyLv;
    var scale = myLv ? Math.min(2, Math.max(0.06, Math.pow((2 * enemyLv + 10) / (enemyLv + myLv + 10), 5))) : 1;
    return Math.max(1, Math.round((base * (used ? 1.5 : 0.6) + kills * 3) * scale * 0.75));
  };

  // ---- The journey ------------------------------------------------------------------
  CA.PROF = { name: 'Prof. Hazel', look: { skin: '#f2c193', hair: '#dfe6ef', style: 'bun', cap: null, shirt: '#ffffff', pants: '#6a7a92', glasses: true } };
  CA.RIVAL_LOOK = { skin: '#ffd9b8', hair: '#8a5ad0', style: 'spiky', cap: null, shirt: '#2fb46a', pants: '#3a3a4a' };
  CA.STARTER_TRIO = ['emberpup', 'sproutle', 'puddlefin'];
  // the rival always picks the starter that has the edge on yours
  CA.rivalStarter = function (mine) { return { emberpup: 'puddlefin', sproutle: 'emberpup', puddlefin: 'zappip' }[mine]; };
  CA.RIVAL_TEAMS = [
    { lv: 5, skill: 0.25, deck: ['fuzzlets', 'buzzlings'] },
    { lv: 14, skill: 0.55, deck: ['zappip', 'gloomcap', 'shellbert', 'fuzzlets', 'hexmoth'] },
    { lv: 29, skill: 0.9, deck: ['pebblump', 'voltwing', 'hootini', 'shadecat', 'lumisprite', 'magmaw', 'brambull'] }
  ];
  // wild critters on each route of the Sunshine Region (every species can be caught somewhere)
  CA.ROUTES = {
    r1: { name: 'Route 1', wild: ['fuzzlets', 'buzzlings', 'zappip'], lv: [3, 5] },
    r2: { name: 'Mushroom Woods', wild: ['gloomcap', 'sproutle', 'hexmoth'], lv: [6, 8] },
    r3: { name: 'Seaside Cliffs', wild: ['shellbert', 'puddlefin', 'voltwing'], lv: [9, 11] },
    r4: { name: 'Bloom Trail', wild: ['sproutle', 'buzzlings', 'lumisprite', 'emberpup'], lv: [12, 14] },
    r5: { name: 'Rocky Pass', wild: ['pebblump', 'rockhorn', 'emberpup', 'zappip'], lv: [14, 16] },
    r6: { name: 'Quarry Road', wild: ['pebblump', 'rockhorn', 'voltwing'], lv: [16, 18] },
    r7: { name: 'Starlit Grove', wild: ['lumisprite', 'hootini', 'brambull', 'hexmoth'], lv: [18, 20] },
    r8: { name: 'Twin Bridges', wild: ['puddlefin', 'shellbert', 'voltwing', 'shadecat'], lv: [20, 22] },
    vr: { name: 'Victory Road', wild: ['shadecat', 'magmaw', 'zappip', 'rockhorn'], lv: [22, 25] },
    sky: { name: 'Sky Pillar', wild: ['azurion'], lv: [33, 33], legend: true }
  };

  // ---- Battle rules ------------------------------------------------------------
  CA.RULES = {
    W: 18, H: 30, MID: 15,
    leadTime: 7,           // seconds to pick a free lead creature before the battle
    hypeMax: 100, boostTime: 7, boostHaste: 1.35, boostSpeed: 1.2,
    evoTime: 1.3, evoHp: 1.4, evoDmg: 1.3, evoSize: 1.12,
    bossHp: 4.5, bossDmg: 1.3, legendHp: 2.6, legendDmg: 0.95,
    capsules: 12,          // creatures each trainer may send out per battle
    energyMax: 10, energyStart: 8, energyRegen: 2.8, // seconds per energy point
    time: 180, doubleAt: 60, overtime: 60,
    throwTime: 0.45, spawnTime: 0.6,
    playerZone: [16.2, 29.2], enemyZone: [0.8, 13.8]
  };
})(typeof window !== 'undefined' ? window : globalThis);
