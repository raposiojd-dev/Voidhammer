#!/bin/bash
# copies the game into www/ for the app (drops .webm: iOS plays the .mp4 files)
set -e
SRC=${1:-..}
rm -rf www && mkdir -p www
for f in index.html manifest.webmanifest peerjs.min.js icons img fonts mus vo vid wk; do [ -e "$SRC/$f" ] && cp -r "$SRC/$f" www/; done
find www -name '*.webm' -delete
echo "www ready: $(du -sh www | cut -f1)"
