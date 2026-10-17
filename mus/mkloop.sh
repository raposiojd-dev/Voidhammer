#!/bin/bash
# seamless loop: A[2..8] + (A[8..10] fading out mixed with A[0..2] fading in); ends on the sample it starts on
G=${3:-0}
ffmpeg -y -loglevel error -i "$1" -filter_complex "[0:a]atrim=2:8,asetpts=PTS-STARTPTS[mid];[0:a]atrim=8:10,asetpts=PTS-STARTPTS,afade=t=out:st=0:d=2:curve=tri[tail];[0:a]atrim=0:2,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=2:curve=tri[head];[tail][head]amix=inputs=2:normalize=0[xf];[mid][xf]concat=n=2:v=0:a=1,volume=${G}dB,alimiter=limit=0.95" -b:a 128k "$2"
