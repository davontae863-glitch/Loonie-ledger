#!/usr/bin/env bash
# Appends the Loonie Ledger outro (outro/outro.mp4: coin, name, tagline, coin "ding") to a video.
# Run this BEFORE add_music.sh / voiceover.py, which mix music and voice over the whole thing, ding included.
# Usage: marketing/video/add_outro.sh in.mp4 out.mp4
set -euo pipefail
in="$1"; out="$2"; outro="$(cd "$(dirname "$0")" && pwd)/outro/outro.mp4"
tmp="${out%.mp4}.outro-tmp.mp4"
# give inputs without audio a silent track so concat works
has_a=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$in" | head -1)
if [ -z "$has_a" ]; then a=(-f lavfi -t 600 -i anullsrc=r=44100:cl=stereo); amap="[2:a]"; else a=(); amap="[0:a]"; fi
ffmpeg -y -loglevel error -i "$in" -i "$outro" "${a[@]}" -filter_complex \
  "[0:v]fps=30,scale=1080:1920,setsar=1[v0];${amap}aresample=44100,aformat=channel_layouts=stereo,atrim=0:$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")[a0];[1:v]setsar=1[v1];[1:a]aresample=44100,aformat=channel_layouts=stereo[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$tmp"
mv "$tmp" "$out"; echo "added outro to $out"
