# Renato Manzotti · Portfolio

Sito portfolio personale: siti web, app e bot su misura per aziende e professionisti.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Three.js (React Three Fiber)

## Avvio

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Struttura

```
src/
├─ app/
│  ├─ layout.tsx            font (Syne, Inter, Fira Code), SEO, JSON-LD
│  ├─ page.tsx              compone le sezioni della home
│  ├─ lavori/               pagina /lavori e /lavori/[categoria]
│  ├─ globals.css           tema Tailwind (colori neon, font, marquee)
│  └─ api/contact/route.ts  invio del form (Resend, facoltativo)
├─ components/
│  ├─ hero/                 Hero + ParticleField (onde di particelle 3D che seguono il mouse)
│  ├─ about/                Chi sono, servizi, metodo di lavoro
│  ├─ projects/             Card delle categorie in home e schede complete dei progetti
│  ├─ makeovers/            "Prima e dopo": confronto con maniglia e mockup dei siti
│  ├─ stack/                Marquee delle tecnologie + indicatori Lighthouse
│  ├─ quote/                Preventivo rapido con stima di costi e tempi
│  ├─ contact/              Recapiti + form con animazione di invio
│  ├─ layout/               Navbar (con barra di avanzamento) e footer
│  └─ ui/                   Reveal, MagneticButton, AnimatedNumber, icone
└─ lib/
   ├─ data.ts               TUTTI i contenuti: profilo, servizi, progetti, stack, prezzi
   ├─ quote.ts              calcolo della stima
   └─ events.ts             evento preventivo → form contatti
public/img/                 foto e screenshot (WebP)
```

## Modificare i contenuti

Quasi tutto si cambia da `src/lib/data.ts`:

- **Nuovo progetto:** aggiungi un oggetto a `projects` (screenshot in `public/img/projects/`) con la sua
  `category` (`applicazioni`, `videogiochi`, `siti-web`, `bot-dashboard`): compare da solo nella pagina
  `/lavori/<categoria>` e nel conteggio della card in home.
- **Prima e dopo:** testi in `makeovers`; i mockup sono componenti in `src/components/makeovers/sites.tsx`
  (disegnati a 1280×800) e le illustrazioni al posto delle foto in `Scenery.tsx`.
- **Prezzi del preventivo:** `quoteTypes`, `quoteExtras`, `quoteUrgency`.
  `priceFactor` (ora `0.8`, cioè -20%) si applica a tutti i prezzi: con `1` tornano quelli pieni.
- **Extra del preventivo:** il campo `for` di ogni extra dice per quali servizi compare
  (`"all"` per tutti); `featured: true` lo mette in evidenza.
- **Punteggi Lighthouse:** `lighthouse` (sono valori dimostrativi: sostituiscili con le misure reali).

## Form contatti

Copia `.env.example` in `.env.local`. Con `RESEND_API_KEY` e `CONTACT_FROM` impostate le richieste
arrivano via email a manzottirenato@gmail.com; senza, il form apre il client email del visitatore
con il messaggio già compilato.

## Accessibilità

Navigazione da tastiera, link "Vai al contenuto", modale con focus intrappolato e chiusura con Esc,
errori del form collegati ai campi, `prefers-reduced-motion` rispettato (anche dalla scena 3D,
che si ferma quando esce dallo schermo).
