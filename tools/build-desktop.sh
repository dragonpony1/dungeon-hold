#!/bin/sh
# Steam pipeline phase 1: builds Rootgate as a Windows app (Electron, the same Chromium the tests run on).
#   sh tools/build-desktop.sh            -> ../rootgate-desktop/Rootgate-win32-x64/Rootgate.exe
# The shell is desktop/ (main.js: serves the packed game files at the game's real address). The game files are the same
# build the website gets (assemble.mjs, plain .glb), so every update is just this command again.
# Electron + electron-packager come from ../steam/node_modules (installed for the VIGILO desktop build); the Electron zip
# comes from the local Electron cache, so nothing is downloaded.
set -e
cd "$(dirname "$0")/.."
OUT=../rootgate-desktop
STAGE=$OUT/app
rm -rf "$STAGE"
mkdir -p "$STAGE"
DIST=$STAGE/game RAWGLB=1 EXTRA=./parts/staging node assemble.mjs
if [ -d trailer/hd ]; then cp trailer/hd/* "$STAGE/game/assets/"; fi
cp desktop/main.js desktop/package.json desktop/icon.png "$STAGE/"
cp -r desktop/fonts "$STAGE/fonts"
ZIPDIR=$(dirname "$(ls "$LOCALAPPDATA"/electron/Cache/*/electron-v43.2.0-win32-x64.zip | head -1)")
BUILD=$(grep -o "const BUILD=[0-9]*" parts/game.js | head -1 | grep -o "[0-9]*$")
../steam/node_modules/.bin/electron-packager "$STAGE" Rootgate --platform=win32 --arch=x64 --electron-version=43.2.0 \
  --electron-zip-dir="$ZIPDIR" --out="$OUT" --overwrite --icon=desktop/icon.ico --no-asar \
  --app-version="0.1.$BUILD" --win32metadata.ProductName=Rootgate --win32metadata.FileDescription=Rootgate --win32metadata.CompanyName=Rootgate
echo "built: $OUT/Rootgate-win32-x64/Rootgate.exe (game build $BUILD)"
