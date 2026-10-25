# Critter Arena ☀️

A minimalist **real-time creature autobattler** for Android. Think a sunny-day creature stadium
crossed with Clash Royale, without the towers: drag cute critters onto the pitch while the
battle is live, and they fight on their own. **Knock out every creature your rival sends to win.**

Ships as a fully offline **Android APK** (a WebView shell around an HTML5/Canvas game) and also
runs in any browser. Every creature, trainer, effect and sound is generated in code: there are
no image or audio files.

There are four editions, kept as separate files and separate apps that install side by side:

| Edition | Files | App |
|---------|-------|-----|
| **Critter Arena** (original) | `www/` | `com.critterarena.game` |
| **Critter Arena 2** (stadium edition) | `www2/` | `com.critterarena.game2` |
| **Critter Arena 3** (journey edition) | `www3/` | `com.critterarena.game3` |
| **Critter Arena 4** (adventure edition) | `www4/` | `com.critterarena.game4` |

## What's new in Critter Arena 4

Critter Arena 4 is built on the Critter Arena 3 code (journey, levels, catching, evolution, the
stadium) and swaps the journey map for a whole **walkable world**:

- **The Sunshine Region on foot**: 9 towns, 8 routes, Victory Road, the Sunshine Plateau and the
  Sky Pillar, drawn tile by tile. **Tap** where you want to go, or **hold** your finger down to
  steer. Hop down one-way ledges, push through tall grass, wander into houses.
- **Your lead critter follows you** everywhere, hopping along behind. Tap it to say hi.
- **Trainers who spot you**: walk into a trainer's line of sight and a "!" pops up, they march
  over and challenge you. Nearly 60 trainers: 27 out on the routes, 2 in every gym, 8 gym leaders,
  3 rival battles, the Elite and the Champion, then the Hall of Fame.
- **Battles happen where you are**: wild and route battles are fought in meadows, forests, on the
  beach, in rocky passes, a starlit grove, a cave or above the clouds, with birdsong instead of a
  crowd. Gym battles keep the stadium, painted in each gym's colours.
- **Towns to explore**: Critter Centers (the nurse remembers you, so you wake up there if you black
  out), Marts, people to chat with, gifts to collect, critters lazing around town, signs, TVs and
  bookshelves full of trivia.
- **Prize money and a bag**: win money from trainers and spend it on Capsules, Great Capsules,
  Ultra Capsules, Rare Candies and Repels. Pick up items lying on the routes. Choose which capsule
  to throw right from the CATCH button.
- **Shiny critters**: about 1 in 40 wild critters comes in rare sparkly colours, and keeps them
  once caught.
- **Gen-1 style start menu**: Critterdex (with where to find each critter), Team, Bag, trainer
  card with your badges, money and play time, Save and Options.
- **New music**: route, forest, cave, Critter Center, gym, trainer, rival, League, Sky Pillar,
  Champion and Hall of Fame themes, plus footstep bumps, ledge hops, doors and item jingles.
- **Level-scaled XP**: critters above their opponents' level learn less and ones below catch up
  faster, so the adventure stays a challenge all the way to the Champion.

## What's new in Critter Arena 3

Critter Arena 3 is built on the Critter Arena 2 code (stadium, evolution, crowd boost, Sun Cup)
and adds a full **journey**:

- **Professor intro**: Prof. Hazel welcomes you in a sunny lab, you name yourself and your
  rival, and pick a starter from three capsules (Emberpup, Sproutle or Puddlefin). Your rival
  picks the one that beats yours.
- **Journey map**: 21 stops from Sunny Town through 6 wild routes (Meadow Path, Mushroom Woods,
  Seaside Cliffs, Rocky Pass, Starlit Grove, Victory Road), **8 gyms**, three rival battles, the
  Elite and **Champion Aurora**, then the legendary **Sky Pillar**.
- **Wild battles and catching**: a big wild critter stomps onto the pitch with its own HP box.
  Knock its HP into the red without fainting it, then tap **CATCH**. The capsule flies, wobbles
  up to three times and clicks shut ("GOTCHA!") or bursts open. Caught critters join your team.
- **Levels and XP**: every critter has a level (up to 40). Battles hand out XP, more for the ones
  that fought, with level-up bars on the results screen. Trainers and wild critters have levels
  too, and Quick Battle and the Sun Cup scale to your team's average level.
- **Small teams that grow**: you start with just your starter and build up to 8 by catching.
- **Living stadium**: critters show emotes when idle (Zzz, hearts, sparks, bubbles),
  butterflies drift over the pitch, fireworks go off at kick-off and on victory, and the camera
  sweeps in on your opponent before each battle.
- **New music and sounds**: a town theme, a wild-battle theme, capsule wobbles, catches,
  level-ups and badges.
- **Autosave**: progress is saved on the device, and the title screen shows your badges and
  how many critters you've caught.
- **Tablet friendly**: menus, map and intro scale up on big screens.

## What's new in Critter Arena 2

- **A real stadium**: a perspective pitch inside a bowl of ~500 cheering fans who jump, wave
  team flags and do the wave, an LED jumbotron scoreboard, a blimp, and your trainer's back
  view in the corner throwing capsules.
- **Evolution**: critters earn XP by fighting. Tap the gold ⬆ badge over a ready critter and
  spend a little energy to evolve it, with a Gen-1 style white-flash sequence. All 18 critters
  have evolved forms with new names and looks (Emberpup → Blazehound, Pebblump → Gemlump...).
- **Crowd boost**: KOs, super-effective hits and evolutions fill your crowd meter. Tap it to
  make your whole team attack 35% faster for 7 seconds while the stadium chants.
- **Lead send-out**: both trainers pick a lead critter at the same time ("GO! EMBERPUP!").
- **Gen-1 text box** and pixel font: "WHAT? PEBBLUMP IS EVOLVING!", "IT'S SUPER EFFECTIVE!",
  plus move callouts like "LAVA BREATH!" and "AZURE BURST!".
- **Game feel**: hit-stop on big hits, slow-motion zoom on the final KO.
- **Modes**: the Sunshine League, the **Sun Cup** (an 8-team tournament bracket where the other
  matches are simulated or can be watched), **Watch** any two league teams battle, Quick Battle.
- **Collection**: start with 10 critters; league trainers give you their signature critter
  when you beat them. Locked critters show as "?" in the Critterdex.
- **Hold a card** in battle to read what it does.

## How to play

- Each trainer brings **12 capsules**. Every creature you send out uses one.
- **Drag a card onto your (blue) half of the arena**, or tap a card and then tap the field.
- Cards cost **☀ sun energy**, which refills over time (2× speed in the final minute).
- Creatures march, pick targets and fight automatically. Your decisions are **what, where and when**.
- A side that's out of capsules with nobody left standing **loses**. If the 3-minute clock runs
  out, **most KOs wins**; if that's tied, it goes to sudden death (next KO wins).

### Roles

| Role | Job |
|------|-----|
| Tank | Huge HP, taunts nearby foes into attacking it |
| Brawler | Sturdy melee damage |
| Ranged | Fragile, hits from behind the front line |
| Splash | Area damage, shreds swarms |
| Support | Heals or shields allies |
| Assassin | Leaps over the front line onto backliners |
| Swarm | Many tiny bodies that melt big targets |
| Legend | Expensive, devastating |

### Types

Fire › Leaf › Stone › Spark › Water › Fire: each element hits the next one for **×1.5** and the
previous one for ×0.67. Mystic is strong against Mystic and Dragon; Dragons resist all five
elements.

### 18 critters, 10 rival teams

Build an 8-card team from 18 creatures, then climb the **Sunshine League**: ten trainers with
themed teams, from Rookie Pip to Champion Aurora. Win to earn their badges. Quick Battle picks a
random rival.

## Getting the APK

Every push to a development branch runs the **Build Android APK** workflow. It builds all four
editions and publishes **Critter Arena 4** to the **`critter-arena-4-apk`** GitHub Release
(`CritterArena4.apk`). The earlier releases, **`critter-arena-apk`**, **`critter-arena-2-apk`**
and **`critter-arena-3-apk`**, are left as they were.
On your phone, open this repo's Releases, download the APK and install it (you may need to
allow "install unknown apps"). The apps need no network permission.

## Building locally

```bash
# requires JDK 17 + Android SDK (platform 34, build-tools 34.0.0)
gradle assembleAdventureDebug # Critter Arena 4 -> app/build/outputs/apk/adventure/debug/
gradle assembleJourneyDebug   # Critter Arena 3 -> app/build/outputs/apk/journey/debug/
gradle assembleStadiumDebug   # Critter Arena 2 -> app/build/outputs/apk/stadium/debug/
gradle assembleClassicDebug   # original        -> app/build/outputs/apk/classic/debug/
```

## Project layout

```
www4/              Critter Arena 4: everything in www3/, plus the overworld:
  js/worldart.js     ground tiles, trees, buildings, interiors and walking trainers
  js/worlddata.js    the Sunshine Region: maps, buildings, people, trainers, items
  js/world.js        walking, pathfinding, trainers' sight lines, doors, dialog, start menu
  js/worldevents.js  nurses, shopkeepers, gifts, the rival, the Hall of Fame
www3/              Critter Arena 3 (same file layout as www2/, plus the journey, levels, catching)
www2/              Critter Arena 2 (same file layout as www/, plus evolution, stadium, modes)
www/index.html     menus, screens and styling
www/js/data.js     types, 18 species, 10 league trainers, battle rules
www/js/sim.js      deterministic real-time battle simulation + trainer AI (also runs in node)
www/js/art.js      procedural creature / trainer / badge art
www/js/render.js   stadium, crowd, effects, HUD and hand rendering
www/js/audio.js    synthesized chiptune music, crowd, creature cries and sfx
www/js/main.js     app flow, team builder, league, drag-and-drop input
app/               minimal single-Activity WebView wrapper (zero third-party deps);
                   product flavors 'classic' (www/), 'stadium' (www2/), 'journey' (www3/)
                   and 'adventure' (www4/)
```
