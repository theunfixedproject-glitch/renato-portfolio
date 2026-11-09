#!/bin/bash
# Rende il film in 4 pezzi paralleli da 225 fotogrammi (3,75 s), poi li unisce con l'audio.
# Ogni pezzo finito lascia un file .ok: se il contenitore si riavvia, si riparte da dove si era rimasti.
# uso: bash render.sh <nome>   (es. bozza1)
cd "$(dirname "$0")"
name=${1:-bozza}
mkdir -p "parts-$name"
curl -s -o /dev/null http://127.0.0.1:8833/reel.html || (python3 -m http.server 8833 --bind 127.0.0.1 > http.log 2>&1 &)
sleep 1
[ -f track.wav ] || node tool.mjs audio track.wav
for k in 0 1 2 3; do
  f="parts-$name/p$k.mp4"
  [ -f "$f.ok" ] && continue
  (node tool.mjs video "$f" $((k * 225)) $(((k + 1) * 225)) > "parts-$name/p$k.log" 2>&1 && touch "$f.ok") &
done
wait
ls parts-$name/*.ok | wc -l
for k in 0 1 2 3; do echo "file '$PWD/parts-$name/p$k.mp4'"; done > "parts-$name/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "parts-$name/list.txt" -i track.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$name.mp4"
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames,r_frame_rate -show_entries format=duration -of compact "$name.mp4"
