#!/usr/bin/env bash
# Mixes one of our original music tracks (marketing/video/music/track-N.m4a) under a video,
# replacing its (silent) audio track. Video is copied, not re-encoded.
# Usage: marketing/video/add_music.sh in.mp4 out.mp4 [track-number]
# Without a track number, the track rotates by date (America/Edmonton): consecutive days never share a track,
# and the same track comes back only every N days (N = number of tracks in music/).
set -euo pipefail
in="$1"; out="$2"; dir="$(cd "$(dirname "$0")" && pwd)/music"
count=$(ls "$dir"/track-*.m4a | wc -l)
doy=$(TZ=America/Edmonton date +%j); doy=$((10#$doy))
n="${3:-$(( doy % count + 1 ))}"
track="$dir/track-$n.m4a"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
fade_start=$(awk -v d="$dur" 'BEGIN{s=d-1.5; if(s<0)s=0; print s}')
tmp="${out%.mp4}.music-tmp.mp4"
ffmpeg -y -loglevel error -i "$in" -i "$track" -map 0:v -map 1:a -c:v copy \
  -af "atrim=0:$dur,afade=t=in:d=0.02,afade=t=out:st=$fade_start:d=1.5,volume=-2dB" \
  -c:a aac -b:a 160k -ar 44100 -ac 2 -shortest -movflags +faststart "$tmp"
mv "$tmp" "$out"
echo "added music track-$n to $out"
