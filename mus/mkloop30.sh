#!/bin/bash
# seamless 26s loop from a 30s clip: A[2..28] + (A[28..30] fade out mixed with A[0..2] fade in)
G=${3:-0}
ffmpeg -y -loglevel error -i "$1" -vn -filter_complex "[0:a]atrim=2:28,asetpts=PTS-STARTPTS[mid];[0:a]atrim=28:30,asetpts=PTS-STARTPTS,afade=t=out:st=0:d=2:curve=tri[tail];[0:a]atrim=0:2,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=2:curve=tri[head];[tail][head]amix=inputs=2:normalize=0[xf];[mid][xf]concat=n=2:v=0:a=1,volume=${G}dB,alimiter=limit=0.95" -ac 2 -b:a 112k "$2"
