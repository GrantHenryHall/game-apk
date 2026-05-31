# Broadside &amp; Bombs ⚓💣

A 10×10 tactical naval war-game with a **Master &amp; Commander** colonial aesthetic —
think weathered sea-charts, brass medallions and cannon-smoke. Two fleets, hidden
sea-mines, and one goal: **capture the enemy Admiral.**

Ships as a fully-offline **Android APK** (a WebView shell around a single self-contained
HTML5/Canvas game) and also runs in any browser by opening `www/index.html`.

## How to play

1. **Deploy your fleet.** You command **12 unique units** — pick one from the tray and
   tap a square in your three home rows to land it (each arrives with a smoke-and-dust
   flourish). Or hit **Auto-deploy**.
2. **Lay your mines.** Bury **5 hidden sea-mines** anywhere in your own waters. They stay
   invisible to the enemy and detonate when an enemy hull crosses them — levelling the
   square and every neighbour, friend or foe.
3. **Sound the charge.** You and the AI move one unit per turn. Take the enemy Admiral —
   by blade or by blast — to win.

### The fleet (one of each, no plain chess pieces)

| Unit | Role | Movement |
|------|------|----------|
| **Admiral** 👑 | royal (capture to win) | 1 square, any direction |
| **Flagship** | heavy gun | any distance, 8 directions |
| **Man-o'-War** | line ship | any distance, ranks &amp; files |
| **Navigator** | scout | any distance, diagonals |
| **Dragoon** | marine cavalry | leaps in an L |
| **Sea Serpent** | beast | up to 2 squares, any direction |
| **Bombardier** | gunner | up to 2 squares, ranks &amp; files |
| **Harpooner** | skirmisher | up to 2 squares, diagonals |
| **Corsair** | raider | 1 diagonal, or leap exactly 2 straight |
| **Bosun** | officer | 1 square, any direction |
| **Marine** | infantry | 1 square forward / forward-diagonal |
| **Powder Monkey** | runner | 1 square, ranks &amp; files |

The custom pieces are deliberately short-ranged so the battle stays about position and
the mines, not one super-piece.

## Getting the APK

Every push to the development branch triggers the **Build Android APK** workflow, which:

- builds an installable **debug APK**, and
- publishes it to the **`apk-latest`** GitHub Release.

On your phone, open this repo's **Releases**, download `BroadsideAndBombs.apk`, and install
it (you may need to allow "install unknown apps" for your browser). The APK has no network
permissions — the whole game is bundled offline.

## Building locally

```bash
# requires JDK 17 + Android SDK (platform 34, build-tools 34.0.0)
gradle assembleDebug
# -> app/build/outputs/apk/debug/app-debug.apk
```

## Project layout

```
www/index.html         the entire game (Canvas + JS + synthesised audio, no assets)
app/                   minimal single-Activity WebView wrapper (zero third-party deps)
  src/main/assets ⇐    www/ is bundled here at build time (see app/build.gradle)
.github/workflows/     CI that builds the APK and attaches it to a Release
```
