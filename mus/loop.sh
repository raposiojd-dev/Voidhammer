#!/bin/bash
# usage: loop.sh in.mp3 out.mp3  -> 3 copies crossfaded 1.5s, then loopable tail fade
ffmpeg -y -loglevel error -i "$1" -i "$1" -i "$1" -filter_complex "[0][1]acrossfade=d=1.5:c1=tri:c2=tri[a];[a][2]acrossfade=d=1.5:c1=tri:c2=tri,afade=t=in:d=0.3,afade=t=out:st=24:d=0.8" -b:a 112k "$2"
