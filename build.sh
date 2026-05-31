#!/usr/bin/env bash
#
# Manual Android APK build pipeline (no Android Gradle Plugin, no aapt2).
#
# Google's Maven repo and dl.google.com are unreachable in this environment, so
# we cannot use the standard Android toolchain. Instead we build straight from
# artifacts on Maven Central:
#
#   compile : javac --release 8  (against the com.google.android:android stub)
#   dex     : dalvik-dx (com.jakewharton.android.repackaged:dalvik-dx)
#   manifest: a hand-written binary AndroidManifest.xml generator (tools/)
#   sign    : apksig (com.android.tools.build:apksig), v1 + v2
#
# The app is 100% Canvas-drawn, so it needs no resources / resources.arsc.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
TOOLS="$ROOT/.toolcache"
OUT="$ROOT/build/out"
APKDIR="$OUT/apk"
MINSDK=24

ANDROID_JAR="$TOOLS/android.jar"
DX_JAR="$TOOLS/dalvik-dx.jar"
APKSIG_JAR="$TOOLS/apksig.jar"

# ---- bootstrap toolchain from Maven Central (Google's repos are not needed) ----
MC="https://repo1.maven.org/maven2"
mkdir -p "$TOOLS"
fetch() { # url dest
  if [ ! -s "$2" ]; then echo "    fetch $(basename "$2")"; curl -fsSL -o "$2" "$1"; fi
}
echo "==> ensure build tools (Maven Central)"
fetch "$MC/com/google/android/android/4.1.1.4/android-4.1.1.4.jar"                         "$ANDROID_JAR"
fetch "$MC/com/jakewharton/android/repackaged/dalvik-dx/16.0.1/dalvik-dx-16.0.1.jar"       "$DX_JAR"
fetch "$MC/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar"                          "$APKSIG_JAR"

KEYSTORE="$ROOT/build/debug.p12"
KSPASS="android"
ALIAS="admirals"

echo "==> clean"
rm -rf "$OUT"
mkdir -p "$OUT/classes" "$APKDIR" "$OUT/toolclasses"

echo "==> compile app (java 8, against android stub)"
find "$ROOT/app/src/main/java" -name '*.java' > "$OUT/sources.txt"
javac --release 8 -nowarn -Xlint:none \
      -cp "$ANDROID_JAR" \
      -d "$OUT/classes" \
      @"$OUT/sources.txt" 2> >(grep -v 'obsolete' >&2 || true)

echo "==> dex"
java -cp "$DX_JAR" com.android.dx.command.Main \
     --dex --min-sdk-version=$MINSDK \
     --output="$APKDIR/classes.dex" "$OUT/classes"

echo "==> build binary AndroidManifest.xml"
javac -d "$OUT/toolclasses" "$ROOT/tools/MakeManifest.java"
java -cp "$OUT/toolclasses" MakeManifest "$APKDIR/AndroidManifest.xml"

echo "==> bundle web assets"
if [ -d "$ROOT/app/src/main/assets" ]; then
  rm -rf "$APKDIR/assets"
  cp -r "$ROOT/app/src/main/assets" "$APKDIR/assets"
fi

echo "==> package unsigned apk"
UNSIGNED="$OUT/app-unsigned.apk"
( cd "$APKDIR" && jar --create --no-manifest --file "$UNSIGNED" AndroidManifest.xml classes.dex assets )

echo "==> ensure debug keystore"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -storetype PKCS12 -keystore "$KEYSTORE" \
    -storepass "$KSPASS" -keypass "$KSPASS" -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Bombs and Admirals, O=Tabletop, C=GB" >/dev/null 2>&1
fi

echo "==> sign (v1 + v2)"
javac -cp "$APKSIG_JAR" -d "$OUT/toolclasses" "$ROOT/tools/SignApk.java"
FINAL="$ROOT/build/BroadsideAndBombs.apk"
java --add-exports java.base/sun.security.x509=ALL-UNNAMED \
     --add-exports java.base/sun.security.pkcs=ALL-UNNAMED \
     -cp "$OUT/toolclasses:$APKSIG_JAR" SignApk \
     "$UNSIGNED" "$FINAL" "$KEYSTORE" "$KSPASS" "$ALIAS" "$MINSDK"

echo "==> done: $FINAL"
ls -la "$FINAL"
