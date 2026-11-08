#!/bin/bash
# Rende il film a segmenti da 60 fotogrammi, saltando quelli già finiti (resiste ai riavvii).
cd "$(dirname "$0")"
mkdir -p seg
curl -s -o /dev/null http://127.0.0.1:8811/film.html || (python3 -m http.server 8811 --bind 127.0.0.1 > http.log 2>&1 &)
sleep 2
worker() {
  for s in $(seq "$1" 2 14); do
    a=$((s * 60)); b=$(((s + 1) * 60)); [ $b -gt 870 ] && b=870
    f=seg/s$(printf %02d "$s").mp4
    [ -f "$f.ok" ] && continue
    node render.mjs "$f" 60 "$a" "$b" > "seg/s$s.log" 2>&1 && touch "$f.ok"
  done
}
worker 0 & worker 1 & wait
ls seg/*.ok | wc -l
