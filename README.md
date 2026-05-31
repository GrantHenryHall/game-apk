# Broadside & Bombs

A 10×10 turn-based naval battle game for Android with a 19th-century
*Master and Commander* aesthetic — engraved brass tokens, sea mines, and a
crimson enemy fleet. Deploy your own ships, lay hidden mines, and **sink the
entire enemy fleet** to win.

The game itself is a self-contained offline HTML5 canvas game
(`app/src/main/assets/index.html`) wrapped in a thin Android `WebView`
(`MainActivity`).

> 📦 **Install it:** download **[`build/BroadsideAndBombs.apk`](build/BroadsideAndBombs.apk)**,
> copy it to your phone, and tap it. You'll need to allow "install from unknown
> sources." If an older build is installed, **uninstall it first**. Requires
> Android 7.0 (API 24) or newer.

## How to play

1. **Deploy.** Place your twelve unique units on your back three rows and lay
   your sea mines — or tap **Auto** to deploy for you. Tap **Start** when ready;
   the enemy musters its own fleet.
2. **Fight.** Players alternate one move at a time. Tap a unit, then a
   highlighted square to move/capture.
3. **Win by annihilation.** The side with the **last ship standing** takes the
   sea. The Admiral is just another unit now — there's no king to protect and
   no king to hunt; you must clear the whole board.

### Sea mines
Hidden from the enemy, a mine detonates when stepped on and **levels its square
and every neighbour, friend or foe** — so mind your own advance.

## Building

This repo builds the APK **without** the Android Gradle Plugin or `aapt2`
(Google's Maven/`dl.google.com` are unreachable in the sandbox it was authored
in). `build.sh` pulls three jars from **Maven Central** (`com.google.android:android`
framework stub, `dalvik-dx` dexer, `apksig` signer) into `.toolcache/`, then:

```bash
./build.sh           # -> build/BroadsideAndBombs.apk
```

1. `javac --release 8` compiles `MainActivity` against the framework stub,
2. `dalvik-dx` produces `classes.dex`,
3. `tools/MakeManifest.java` emits a binary `AndroidManifest.xml` directly,
4. `app/src/main/assets/` (the HTML5 game) is bundled in, and the APK is zipped
   and **v2-signed** with `apksig`.

### Layout
```
app/src/main/assets/index.html              the whole game (HTML/CSS/JS canvas)
app/src/main/java/com/broadside/bombs/
  MainActivity.java                         fullscreen WebView host
tools/MakeManifest.java                     binary AndroidManifest.xml generator
tools/SignApk.java                          apksig v2 signer
build.sh                                    the full pipeline
```
