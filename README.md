# Renato Manzotti · Portfolio

Sito portfolio personale: siti web, app e bot su misura per PMI e professionisti.

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
│  ├─ page.tsx              compone le sezioni
│  ├─ globals.css           tema Tailwind (colori neon, font, marquee)
│  └─ api/contact/route.ts  invio del form (Resend, facoltativo)
├─ components/
│  ├─ hero/                 Hero + ParticleField (onde di particelle 3D che seguono il mouse)
│  ├─ about/                Chi sono, servizi, metodo di lavoro
│  ├─ projects/             Bento grid, card con spotlight/tilt, modale con galleria
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

- **Nuovo progetto:** aggiungi un oggetto a `projects` (screenshot in `public/img/projects/`).
  `status: "concluso"` lo fa comparire nel filtro "Conclusi".
  `span` decide la dimensione nella griglia, `visual` come vengono disposti gli screenshot.
- **Prezzi del preventivo:** `quoteTypes`, `quoteExtras`, `quoteUrgency`.
- **Punteggi Lighthouse:** `lighthouse` (sono valori dimostrativi: sostituiscili con le misure reali).

## Form contatti

Copia `.env.example` in `.env.local`. Con `RESEND_API_KEY` e `CONTACT_FROM` impostate le richieste
arrivano via email a manzottirenato@gmail.com; senza, il form apre il client email del visitatore
con il messaggio già compilato.

## Accessibilità

Navigazione da tastiera, link "Vai al contenuto", modale con focus intrappolato e chiusura con Esc,
errori del form collegati ai campi, `prefers-reduced-motion` rispettato (anche dalla scena 3D,
che si ferma quando esce dallo schermo).
