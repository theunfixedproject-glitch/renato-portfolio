# Graphic motion

Tre film brevi fatti solo di codice: niente programmi di montaggio. Ogni fotogramma si calcola dal tempo `t` dentro `seek(t)`,
si rende in un browser (Playwright + Chromium), si media per il mosso e si codifica con ffmpeg. Anche la musica è scritta in codice.

I video finiti che usa il sito stanno in `public/video/` (`showreel.mp4`, `dentro-il-cursore.mp4`, `la-linea.mp4`).
Questa cartella contiene quello che serve per rifarli o ritoccarli; non fa parte del sito e non entra nella build.

## Cosa serve

- Node 20 o più recente, `ffmpeg`, Python 3 (solo per un piccolo server locale)
- `npm install` in questa cartella (installa Playwright e, per l'ultimo film, opentype.js e Fira Code), poi la prima volta `npx playwright install chromium`
- I caratteri sono già nelle cartelle `fonts/` (Geist, Instrument Serif, Fira Code e Syne, tutti con licenza SIL Open Font License)

## Una giornata — `una-giornata/`

14,5 s, 1440×1152, 60 fps. Volo in 3D sopra il portfolio, dalla mattina alla notte, che chiude su
"Siti, app e bot che lavorano per te. *anche quando dormi.*"

1. **Cattura della pagina.** Con il sito acceso (per esempio `npm run build && npx next start -p 3180` nella cartella del progetto):
   `node una-giornata/capture.mjs http://localhost:3180/ una-giornata/cap3`
   Accorcia la pagina per il film, segna i pezzi che si sollevano e salva schermate e posizioni in `cap3/`.
   Se il sito cambia, va rifatta prima del render: i tempi dipendono dall'altezza della pagina.
2. **Server.** `cd una-giornata && python3 -m http.server 8811`
3. **Controlli.** `node stills.mjs fermi` (fotogrammi a 0, 1,6, 2,5, 5, 6,5, 9,3, 11 s) e `node check.mjs`
   (la velocità giù per la pagina non cala mai e la camera non si avvicina mai durante il volo).
4. **Render.** `bash render-all.sh` (15 segmenti da 60 fotogrammi; quelli già finiti vengono saltati).
5. **Audio.** `node audio.mjs track.wav`, poi si uniscono i segmenti con l'audio:
   ```
   for f in seg/s*.mp4; do echo "file '$PWD/$f'"; done > seg/list.txt
   ffmpeg -f concat -safe 0 -i seg/list.txt -i track.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest film.mp4
   ```

In `film.js` c'è tutto il film: la camera (una sola curva di velocità, poi salita, vista dall'alto e picchiata), la luce dalla
mattina alla notte, i pezzi che si alzano e si girano verso l'obiettivo, le tessere RM, la profondità di campo e il testo finale.

## Dentro il cursore — `dentro-il-cursore/`

20 s, 1920×1080, 60 fps, in loop (l'ultimo fotogramma coincide con il primo). Un cursore lampeggiante e uno zoom che si tuffa
ogni volta in un dettaglio della scena precedente.

1. **Server.** `cd dentro-il-cursore && python3 -m http.server 8822`
2. **Controlli.** `node tool.mjs stills fermi` (un fotogramma per battito) oppure `node tool.mjs stills fermi 1.6,5.7,13.7` per tempi precisi.
3. **Audio.** `node tool.mjs audio track.wav` (Web Audio API, OfflineAudioContext).
4. **Render.** `bash render.sh finale`: 4 pezzi paralleli da 5 secondi a 180 fotogrammi al secondo, mediati tre alla volta con
   `tmix` di ffmpeg fino a 60 fps, poi uniti con l'audio (portato a −16 LUFS) in `finale.mp4`.

In `reel.js` ci sono le scene (aggancio, tipografia cinetica, forme e 3D, dati di Lighthouse, rete del preventivatore, titolo)
e lo zoom che le collega; in `audio.js` la colonna sonora.

## La linea che non si stacca — `la-linea/`

15 s, 1080×1920 (verticale), 60 fps, 120 bpm, in loop. Una sola linea, mai sollevata: scrive "una sola linea", poi AI, bot,
app, sito; diventa un sito, un nodo in 3D, un telefono, una chat, la voce del bot (una spirale vista di fianco), un grafico;
nell'ultima battuta tutta la storia appare come pagine in profondità rilegate dallo stesso filo, che si chiude nella firma.

1. **Lettere.** `cd la-linea && node prep.mjs` trasforma le parole in un tracciato unico (`glyphs.json`, già pronto):
   i contorni di Fira Code appesi a un rigo, con buchi e puntini raggiunti da un trattino che va e torna.
2. **Server.** `python3 -m http.server 8833`
3. **Controlli.** `node tool.mjs stills fermi` (un fotogramma per battito), poi `python3 sheet.py fermi fermi.jpg` per il provino.
4. **Audio.** `node tool.mjs audio track.wav`: la colonna è resa su due giri e si tiene il secondo, così il loop non ha cuciture;
   il fruscio della penna segue la velocità della punta, letta dall'animazione.
5. **Render.** `bash render.sh finale`: 4 pezzi paralleli da 225 fotogrammi, mosso con `tmix`, audio a −16 LUFS.

In `reel.js` ci sono le forme, la sequenza (una forma per mezzo battito), la camera e il mosso che segue la velocità.

## Versioni per il sito

I video in `public/video/` sono ricodificati più leggeri:
```
ffmpeg -i finale.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart dentro-il-cursore.mp4
```
