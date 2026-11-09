#!/usr/bin/env bash
# Mixes one of our original music tracks (marketing/video/music/track-N.m4a) under a video,
# mixed under the video's own audio (silent, or the outro ding). Video is copied, not re-encoded.
# Calm mix (owner request 2026-11-09): soft, low-passed music, normalized to -20 LUFS / -3 dBTP.
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
has_a=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$in" | head -1)
music="[1:a]atrim=0:$dur,afade=t=in:d=0.02,afade=t=out:st=$fade_start:d=1.5,lowpass=f=5000,volume=-10dB,aformat=channel_layouts=stereo"
if [ -n "$has_a" ]; then fc="$music[m];[0:a]aresample=44100,aformat=channel_layouts=stereo[o];[m][o]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-20:TP=-3:LRA=9[a]"
else fc="$music,loudnorm=I=-20:TP=-3:LRA=9[a]"; fi
ffmpeg -y -loglevel error -i "$in" -i "$track" -filter_complex "$fc" -map 0:v -map "[a]" -c:v copy \
  -c:a aac -b:a 160k -ar 44100 -ac 2 -t "$dur" -movflags +faststart "$tmp"
mv "$tmp" "$out"
echo "added music track-$n to $out"
