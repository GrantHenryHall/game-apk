# Critter Arena ☀️

A minimalist **real-time creature autobattler** for Android. Think a sunny-day creature stadium
crossed with Clash Royale, without the towers: drag cute critters onto the pitch while the
battle is live, and they fight on their own. **Knock out every creature your rival sends to win.**

Ships as a fully offline **Android APK** (a WebView shell around an HTML5/Canvas game) and also
runs in any browser by opening `www/index.html`. Every creature, trainer, effect and sound is
generated in code: there are no image or audio files.

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

Every push to a development branch runs the **Build Android APK** workflow, which builds an
installable debug APK and publishes it to the **`critter-arena-apk`** GitHub Release. On your
phone, open this repo's Releases, download `CritterArena.apk` and install it (you may need to
allow "install unknown apps"). The app needs no network permission.

## Building locally

```bash
# requires JDK 17 + Android SDK (platform 34, build-tools 34.0.0)
gradle assembleDebug
# -> app/build/outputs/apk/debug/app-debug.apk
```

## Project layout

```
www/index.html     menus, screens and styling
www/js/data.js     types, 18 species, 10 league trainers, battle rules
www/js/sim.js      deterministic real-time battle simulation + trainer AI (also runs in node)
www/js/art.js      procedural creature / trainer / badge art
www/js/render.js   stadium, crowd, effects, HUD and hand rendering
www/js/audio.js    synthesized chiptune music, crowd, creature cries and sfx
www/js/main.js     app flow, team builder, league, drag-and-drop input
app/               minimal single-Activity WebView wrapper (zero third-party deps)
```
