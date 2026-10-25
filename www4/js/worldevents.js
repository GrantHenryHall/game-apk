/* Critter Arena 4 — what people say and do in the overworld, and the scripted story moments. */
(function (root) {
  var CA = root.CA, SP = CA.SPECIES, W = CA.WORLD;
  var T = W.talk, S = W.scripts;
  var DX = [0, -1, 1, 0], DY = [1, 0, 0, -1];
  function itemName(id, n) { var s = CA.ITEMS[id].name.toUpperCase(); return (n > 1 ? n + ' ' : (/^[AEIOU]/.test(s) ? 'an ' : 'a ')) + s + (n > 1 ? 'S' : ''); }
  W.itemName = itemName;

  T.nurse = function (w, n) {
    var sv = w.api.save();
    w.ask(['Welcome to the CRITTER CENTER!', 'Shall I give your critters a quick check-up?'], ['YES', 'NO'], function (i) {
      if (i === 1) { w.say(['We hope to see you again!']); return; }
      w.lock++;
      n.dir = 1; w.api.sfx('healjingle');
      setTimeout(function () { n.dir = 0; n.emote = { k: 'heart', t: 0, d: 1.4 }; }, 1300);
      setTimeout(function () {
        w.lock--;
        sv.lastCenter = { map: w.map.id, x: w.p.x, y: w.p.y };
        w.api.persist();
        w.say(['Thank you for waiting! Your critters are fighting fit!', 'If you ever black out, you\'ll wake up right here.', 'We hope to see you again!']);
      }, 1900);
    });
  };

  T.clerk = function (w, n) {
    w.say(['Welcome to the MART! How may I help you?'], function () { w.api.shop(n.d.shop || w.map.def.shop || ['capsule', 'repel']); });
  };

  T.mom = function (w, n) {
    var sv = w.api.save(), b = sv.badges.length;
    var lines = !w.flag('start') ? ['MOM: Prof. HAZEL is waiting for you at the LAB!']
      : sv.champion ? ['MOM: My little CHAMPION! I always knew you could do it!', 'Now wash your hands. Dinner\'s almost ready!']
      : b ? ['MOM: ' + sv.name + '! ' + b + ' BADGE' + (b > 1 ? 'S' : '') + ' already? Oh my!', 'Remember to take breaks. Even critters need naps!']
      : ['MOM: Right. All kids leave home some day. It said so on TV.', 'Prof. HAZEL says you\'re off to collect GYM BADGES. Do your best, sweetie!'];
    w.say(lines);
  };

  var PROF_TIPS = [
    'Wild critters can only be caught while they\'re still standing. Weaken them, then throw!',
    'GREAT and ULTRA CAPSULES have much better odds than a plain CAPSULE.',
    'Critters that actually fight earn more XP than the ones waiting on the bench.',
    'Evolving a critter in battle is often cheaper than sending a new one out.',
    'Every trainer you beat pays you prize money. Spend it at the MART!',
    'Your lead critter follows you around. Change your lead from the TEAM screen!'
  ];
  T.prof = function (w, n) {
    var sv = w.api.save();
    if (!w.flag('start')) { S.labStart(w); return; }
    var own = Object.keys(sv.owned).length, b = sv.badges.length;
    var lines = sv.champion
      ? ['HAZEL: Our very own CHAMPION! You\'ve caught ' + own + ' of 18 critters.', own >= 18 ? 'A complete CRITTERDEX! You are a true critter master!' : 'Have you climbed the SKY PILLAR yet? I hear something wonderful lives up there.']
      : ['HAZEL: ' + sv.name + '! You\'ve caught ' + own + ' of 18 critters and earned ' + b + ' BADGE' + (b === 1 ? '' : 'S') + '.', PROF_TIPS[(Math.random() * PROF_TIPS.length) | 0]];
    w.say(lines);
  };

  T.gift = function (w, n) {
    var d = n.d, sv = w.api.save();
    if (w.flag(d.id)) { w.say(d.after || d.lines); return; }
    w.say(d.lines, function () {
      w.setFlag(d.id); w.api.give(d.gift, d.n || 1); w.api.sfx('item');
      w.say([sv.name + ' received ' + itemName(d.gift, d.n || 1) + '!'].concat(d.after || []), function () { w.api.persist(); });
    });
  };

  T.guard = function (w, n) {
    var sv = w.api.save();
    if (w.flag('vrpass')) { w.say(['Good luck on VICTORY ROAD, ' + sv.name + '!']); return; }
    if (sv.badges.length >= 8) {
      w.say(['Halt! Only trainers with all 8 BADGES may enter VICTORY ROAD.', '...', 'All 8! Very impressive. Go right ahead, ' + sv.name + '!'], function () {
        w.setFlag('vrpass'); w.api.persist();
        n.path = [[n.x - 1, n.y]];
        w.waitFor(function () { return !n.mv && !n.path.length; }, function () { n.dir = 2; });
      });
    } else w.say(['Halt! Only trainers with all 8 BADGES may enter VICTORY ROAD.', 'You have ' + sv.badges.length + '. Come back when you have them all!']);
  };

  T.legend = function (w, n) {
    w.lock++;
    w.api.cry(n.d.critter, 0.8);
    n.emote = { k: '!', t: 0, d: 1.2 };
    setTimeout(function () {
      w.say(['GYAOOOOH!', 'The legendary ' + SP[n.d.critter].name.toUpperCase() + ' woke up!'], function () { w.lock--; w.legendBattle(n); });
    }, 1000);
  };

  // ---- scripted moments ---------------------------------------------------------------------------
  // right after the intro: the professor hands over the first capsules
  S.labStart = function (w) {
    var sv = w.api.save(), sp = SP[sv.starter].name.toUpperCase();
    w.lock++;
    w.say(['HAZEL: ' + sv.name + '! ' + sp + ' already looks happy with you!', 'Critters love walking alongside their trainers. See? It\'s following you!', 'Oh, and take these. You\'ll need them!'], function () {
      w.api.give('capsule', 5); w.api.sfx('item');
      w.say([sv.name + ' received 5 CAPSULES!', 'HAZEL: Throw one at a weakened wild critter to catch it.', 'Wild critters hide in the TALL GRASS on ROUTE 1, just north of town.', 'Beat all 8 GYM LEADERS and the CHAMPION will be waiting for you. Off you go!',
        'TIP: Tap anywhere to walk there, or hold your finger down to steer. Tap people and signs to talk. The MENU button has your TEAM and BAG.'], function () {
        w.lock--; w.setFlag('start'); w.api.persist();
      });
    });
  };

  // the rival storms off after a battle
  S.rivalLeave = function (w, n, done) {
    var p = w.p, dx = n.x - p.x, dy = n.y - p.y, sv = w.api.save();
    var dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);
    w.say([sv.rival + ': Hmph! Smell ya later, ' + sv.name + '!'], function () {
      var path = [], x = n.x, y = n.y;
      for (var i = 0; i < 6; i++) { x += DX[dir]; y += DY[dir]; if (!w.inb(x, y) || w.map.solid[y * w.map.w + x]) break; path.push([x, y]); }
      n.path = path;
      w.api.music('rival');
      w.waitFor(function () { return !n.mv && !n.path.length; }, function () {
        var k = w.npcs.indexOf(n); if (k >= 0) w.npcs.splice(k, 1);
        w.api.music(w.map.def.music || 'route');
        if (done) done();
      });
    });
  };

  // the Hall of Fame
  S.hof = function (w, n, done) {
    var sv = w.api.save();
    sv.champion = true; w.setFlag('champion'); w.api.persist();
    w.say(['AURORA: ...Congratulations, ' + sv.name + '!', 'You are the new CHAMPION of the SUNSHINE LEAGUE!', 'Come. Let\'s enter you and your partners into the HALL OF FAME!'], function () {
      w.api.hallOfFame(function () {
        w.warp('plateau', 9, 7, 0, function () {
          w.say(['The SUNSHINE PLATEAU is bathed in sunlight.', 'Somewhere, a great door rumbles open... The SKY PILLAR awaits!'], function () { w.api.persist(); if (done) done(); });
        });
      });
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
