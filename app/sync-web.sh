#!/bin/bash
# copies the game into www/ for the app (drops .webm: iOS plays the .mp4 files)
set -e
SRC=${1:-..}
rm -rf www && mkdir -p www
cp -r "$SRC"/. www/ && rm -rf www/.git www/app && find www -name '*.webm' -delete && rm -f www/CNAME www/privacy.html
echo "www ready: $(du -sh www | cut -f1)"
