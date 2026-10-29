#!/bin/bash
# Copies only what the game loads into pc/game (no .webm: Chromium plays the .mp4 files; no website or store files).
set -e
cd "$(dirname "$0")"
SRC=..
rm -rf game && mkdir -p game
for f in index.html manifest.webmanifest peerjs.min.js privacy.html icons img fonts vo vid wk; do cp -r "$SRC/$f" game/; done
mkdir -p game/mus && cp "$SRC"/mus/{world,town,dungeon,combat,boss,title}.mp3 game/mus/
find game -name '*.webm' -delete
mkdir -p build && cp "$SRC/icons/icon-1024.png" build/icon.png
echo "game ready: $(du -sh game | cut -f1)"
