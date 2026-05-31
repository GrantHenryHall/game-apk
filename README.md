# Bombs & Admirals

A 10×10 turn-based battle game for Android with a 19th‑century, *Master and
Commander* naval/colonial aesthetic — weathered teak, brass, parchment, the
Royal Navy in blue against a crimson foe. Deploy your own army piece by piece,
sow hidden mines, and capture the enemy **Admiral**.

> 📦 **Install it:** download **[`build/BombsAndAdmirals.apk`](build/BombsAndAdmirals.apk)**,
> copy it to your phone, and tap it. You'll need to allow "install from unknown
> sources" for your browser/file manager. Requires Android 7.0 (API 24) or newer.

## How to play

1. **Deploy.** A tray of your twelve units sits beneath the board. Tap a unit,
   then tap a square in your back three ranks to drop it in (watch it slam down
   with a dust ring). You also get **5 hidden mines** — place them anywhere on
   the forward ground to trap the enemy. Tap a placed unit/mine to pick it back
   up. When all twelve are down, **Begin the Battle**.
2. **Fight.** Players alternate one move at a time. Tap one of your units to see
   its legal moves, then tap a destination. Land on an enemy unit to capture it.
3. **Win** by capturing the enemy Admiral (no check/checkmate — just take the
   king). Lose your own Admiral and the colours are struck.

### Mines
Hidden from the enemy, a mine **detonates the first enemy unit that steps on
it** — a beautiful explosion, debris, smoke and a screen shake. The **Sapper**
is special: it *defuses* a mine instead of dying.

### The twelve units (one of each — no doubles)
Five are re-themed classics; the other seven are original and kept deliberately
modest so nothing dominates the line.

| Unit | Move |
|------|------|
| **Admiral** *(king)* | 1 square any direction — royal, protect it |
| **Frigate** *(queen)* | slides any distance, any direction |
| **Bombard** *(rook)* | slides any distance, orthogonally |
| **Navigator** *(bishop)* | slides any distance, diagonally |
| **Dragoon** *(knight)* | leaps in an L |
| **Grenadier** | 1 square orthogonally |
| **Fusilier** | 1 square diagonally |
| **Hussar** | charges up to 3 squares in a rank/file |
| **Ranger** | ranges up to 3 squares diagonally |
| **Sapper** | 1 square any direction; **defuses mines** |
| **Lancer** | leaps exactly 2 squares orthogonally |
| **Scout** | leaps exactly 2 squares diagonally |

The enemy is driven by an alpha‑beta search (it cannot see your hidden mines —
so good mining is rewarded).

## Building from source

The whole game is one `Activity` drawn entirely on a `Canvas` (no XML layouts,
no resources, no app icon asset — the art is all vector code), so it builds with
an unusually small toolchain.

```bash
./build.sh
# -> build/BombsAndAdmirals.apk
```

`build.sh` downloads three jars from **Maven Central** on first run
(`com.google.android:android` framework stub, `dalvik-dx` dexer,
`com.android.tools.build:apksig` signer) into `.toolcache/`, then:

1. `javac --release 8` compiles `app/src/main/java` against the framework stub,
2. `dalvik-dx` turns the classes into `classes.dex`,
3. `tools/MakeManifest.java` emits a binary `AndroidManifest.xml` directly
   (no `aapt`/`aapt2` required),
4. the entries are zipped and **v2‑signed** with `apksig`.

This deliberately avoids the Android Gradle Plugin / `dl.google.com`, which are
unreachable in some sandboxed CI environments.

### Layout
```
app/src/main/java/com/grant/admirals/
  MainActivity.java   fullscreen host
  GameView.java       state machine, input, animation engine, AI threading
  Game.java           board, rules, mines, alpha-beta AI
  Pieces.java         the twelve unit definitions
  Art.java            board / medallions / emblems / mine / explosion drawing
tools/
  MakeManifest.java   hand-written binary AndroidManifest.xml generator
  SignApk.java        apksig v2 signer
build.sh              the full pipeline
```
