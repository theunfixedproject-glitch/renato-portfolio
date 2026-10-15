"use client";

import { Fraunces } from "next/font/google";
import { Scenery } from "./Scenery";

/**
 * Mockup dei siti "prima" e "dopo". Strutture e nomi sono di fantasia:
 * i difetti dei "prima" sono quelli che si incontrano più spesso nei siti
 * delle strutture ricettive. Ogni mockup è disegnato a 1280×800 e poi scalato.
 */

const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "600", "700"], style: ["normal", "italic"] });

const oldSerif = { fontFamily: '"Times New Roman", Times, serif' };
const oldSans = { fontFamily: "Verdana, Tahoma, Arial, sans-serif" };
const blurryPhoto = { filter: "blur(1.2px) saturate(0.55) contrast(0.85) sepia(0.35)" };

/* ------------------------------------------------------------------ */
/* 1. B&B Da Rosa · paesino tra i vigneti                              */
/* ------------------------------------------------------------------ */

function RosaBefore() {
  return (
    <div className="h-full w-full overflow-hidden" style={{ ...oldSans, background: "repeating-linear-gradient(45deg,#efe2bd 0 12px,#e9d9ad 12px 24px)" }}>
      <div className="mx-auto h-full w-[900px] border-x-4 border-[#8b5a2b] bg-[#fffbe9]">
        <div className="border-b-4 border-double border-[#8b5a2b] py-5 text-center">
          <p className="text-[46px] font-bold text-[#9b1c1c]" style={{ ...oldSerif, textShadow: "3px 3px 0 #e0b973" }}>
            Bed &amp; Breakfast DA ROSA
          </p>
          <p className="mt-1 text-[15px] text-[#5a3b1a] italic" style={oldSerif}>
            Benvenuti nel nostro B&amp;B!!! Tranquillità e relax tra i vigneti
          </p>
          <p className="mt-2 text-[12px] text-[#5a3b1a]">🇮🇹 Italiano | 🇩🇪 Deutsch | 🇬🇧 English (in costruzione)</p>
        </div>
        <div className="flex justify-center gap-1 bg-[#d8c9a3] p-1.5">
          {["Home", "Le camere", "Dove siamo", "Prezzi", "Contatti", "Link utili", "Guestbook"].map((m) => (
            <span key={m} className="border-2 border-t-white border-l-white border-r-[#7d6b45] border-b-[#7d6b45] bg-[#ece2c6] px-3 py-1 text-[12px] text-[#00c] underline">
              {m}
            </span>
          ))}
        </div>
        <div className="flex gap-4 p-4">
          <div className="w-[560px] text-justify text-[11px] leading-[1.35] text-[#333]">
            <div className="float-left mr-3 mb-1 h-[130px] w-[190px] overflow-hidden border-4 border-[#8b5a2b]">
              <Scenery variant="vineyard" className="h-full w-full" style={blurryPhoto} />
            </div>
            <p className="mb-2 text-[16px] font-bold text-[#9b1c1c]" style={oldSerif}>
              Chi siamo
            </p>
            <p>
              Il nostro Bed &amp; Breakfast si trova in un piccolo e tranquillo paese al confine tra due province, circondato
              dai vigneti e a pochi minuti dalle montagne. Disponiamo di 5 camere con bagno privato e televisore. La
              colazione viene servita solo nel periodo estivo. Siamo raggiungibili in auto e con i mezzi pubblici. Per
              informazioni sulle camere, sui prezzi e sulla disponibilità vi preghiamo di telefonare preferibilmente
              negli orari dei pasti oppure di inviare una e-mail all&apos;indirizzo indicato nella pagina contatti. Vi
              aspettiamo!!! Il B&amp;B è aperto tutto l&apos;anno tranne nei periodi di chiusura. Animali ammessi su
              richiesta. Si accettano solo contanti.
            </p>
            <p className="mt-3 font-bold text-[#c00]">*** NOVITÀ: dal 2014 abbiamo il WI-FI gratuito!!! ***</p>
          </div>
          <div className="flex-1 space-y-3 text-[11px]">
            <div className="border-2 border-[#8b5a2b]">
              <p className="bg-[#8b5a2b] px-2 py-1 font-bold text-white">PREZZI 2014</p>
              <table className="w-full border-collapse">
                <tbody>
                  {[
                    ["Singola", "35,00 €"],
                    ["Doppia", "60,00 €"],
                    ["Tripla", "75,00 €"],
                    ["Letto agg.", "15,00 €"],
                  ].map(([a, b]) => (
                    <tr key={a}>
                      <td className="border border-[#c9b98f] px-2 py-1">{a}</td>
                      <td className="border border-[#c9b98f] px-2 py-1 text-right">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-2 border-[#8b5a2b] p-2 text-center">
              Per prenotare telefonare
              <br />
              <b>ore pasti</b>
            </div>
            <div className="text-center">
              Sei il visitatore n°
              <div className="mx-auto mt-1 w-fit bg-black px-2 font-mono text-[14px] tracking-widest text-[#0f0]">004517</div>
            </div>
            <p className="text-center text-[10px] text-[#777]">Ultimo aggiornamento: 12/03/2014</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RosaAfter() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1f1712] text-[#fbf3ea]" style={{ fontFamily: "var(--font-inter)" }}>
      <Scenery variant="vineyard" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a120d]/90 via-[#1a120d]/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#1a120d]/80 to-transparent" />

      <div className="relative flex items-center justify-between px-14 pt-8 text-[15px]">
        <div className="flex items-center gap-3">
          <span className={`${fraunces.className} grid size-12 place-items-center rounded-full border border-[#f6c99a]/60 text-[24px] text-[#f6c99a] italic`}>R</span>
          <div className="leading-tight">
            <p className={`${fraunces.className} text-[26px] font-semibold`}>Da Rosa</p>
            <p className="text-[11px] tracking-[0.35em] text-[#f6c99a] uppercase">Bed &amp; Breakfast</p>
          </div>
        </div>
        <div className="flex items-center gap-8 text-[#f3e6d8]">
          {["Camere", "Colazione", "Dintorni", "Dove siamo"].map((m) => (
            <span key={m}>{m}</span>
          ))}
          <span className="text-[13px] text-[#f6c99a]">IT · DE · EN</span>
          <span className="rounded-full bg-[#f6c99a] px-6 py-3 font-semibold text-[#2b1d14] shadow-[0_10px_30px_-8px_rgba(246,201,154,0.7)]">Prenota</span>
        </div>
      </div>

      <div className="relative mt-16 max-w-[640px] px-14">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#f6c99a]/40 bg-black/25 px-4 py-2 text-[13px] text-[#ffe3c2] backdrop-blur">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#7ee08a] opacity-75" />
            <span className="relative size-2 rounded-full bg-[#7ee08a]" />
          </span>
          2 camere libere questo weekend
        </p>
        <h3 className={`${fraunces.className} mt-6 text-[76px] leading-[0.98] font-semibold tracking-[-0.01em]`}>
          Il silenzio dei vigneti, a un passo dalle <em className="font-normal text-[#f6c99a]">Dolomiti</em>.
        </h3>
        <p className="mt-6 max-w-[500px] text-[18px] leading-relaxed text-[#f3e6d8]/90">
          Cinque camere luminose, colazione con i prodotti dei vicini e la Guest Card per muoverti gratis in tutta la valle.
        </p>
      </div>

      <div className="absolute top-[190px] right-14 w-[270px] overflow-hidden rounded-[22px] bg-[#fbf3ea]/95 text-[#2b1d14] shadow-2xl">
        <div className="relative h-[130px] overflow-hidden">
          <Scenery variant="vineyard" className="absolute inset-0 h-full w-full scale-150" style={{ objectPosition: "right" }} />
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold">Vista vigneto</span>
        </div>
        <div className="p-4">
          <p className={`${fraunces.className} text-[20px] font-semibold`}>Camera Teroldego</p>
          <p className="mt-1 text-[13px] text-[#8a6a52]">Matrimoniale · balcone · bagno privato</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-[13px] text-[#8a6a52]">
              da <b className="text-[24px] text-[#2b1d14]">85 €</b> / notte
            </p>
            <span className="rounded-full bg-[#7a2e2e] px-3 py-1.5 text-[12px] font-semibold text-white">Vedi</span>
          </div>
        </div>
      </div>

      <div className="absolute right-14 bottom-10 left-14 flex items-stretch gap-3 rounded-[26px] border border-white/30 bg-[#fbf3ea]/92 p-3 text-[#2b1d14] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
        {[
          ["📅", "Arrivo", "Ven 12 giugno"],
          ["📅", "Partenza", "Dom 14 giugno"],
          ["👥", "Ospiti", "2 adulti"],
        ].map(([i, l, v]) => (
          <div key={l} className="flex flex-1 items-center gap-3 rounded-2xl bg-[#f1e4d3] px-5 py-3">
            <span className="text-[22px]">{i}</span>
            <div>
              <p className="text-[11px] tracking-wider text-[#8a6a52] uppercase">{l}</p>
              <p className="mt-0.5 text-[18px] font-semibold">{v}</p>
            </div>
          </div>
        ))}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#7a2e2e] px-8 text-white">
          <p className="text-[18px] font-semibold">Verifica disponibilità</p>
          <p className="text-[12px] text-white/75">Prenotazione diretta, senza commissioni</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. B&B La Nosiola · centro storico                                  */
/* ------------------------------------------------------------------ */

function NosiolaBefore() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#dfe6ee] text-[12px] text-[#222]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="mx-auto w-[1000px] bg-white shadow">
        <div className="relative h-[120px] overflow-hidden bg-gradient-to-b from-[#3a6ea5] to-[#1d3f66]">
          <Scenery variant="city" className="absolute right-0 h-full w-[520px] opacity-60" style={blurryPhoto} />
          <p className="absolute top-8 left-6 text-[34px] font-bold text-white" style={{ textShadow: "2px 2px 2px #000" }}>
            B&amp;B La Nosiola
          </p>
          <p className="absolute top-[74px] left-7 text-[13px] text-[#cfe1f5]">bed and breakfast trento centro storico camere economiche</p>
        </div>
        <div className="flex bg-[#1d3f66] text-[12px] text-white">
          {["Home", "Le Camere", "Servizi", "Galleria", "Tariffe", "Come arrivare", "Contatti", "Area Riservata"].map((m, i) => (
            <span key={m} className={`border-r border-[#3a6ea5] px-4 py-2 ${i === 0 ? "bg-[#3a6ea5]" : ""}`}>
              {m}
            </span>
          ))}
        </div>
        <p className="px-4 py-2 text-[11px] text-[#666]">Ti trovi qui: Home » it » index.php » Benvenuti</p>
        <div className="flex gap-4 px-4 pb-4">
          <div className="w-[200px] space-y-3">
            <div className="border border-[#bbb]">
              <p className="bg-[#e8e8e8] px-2 py-1 font-bold">Menu principale</p>
              {["Home", "Camere", "Prezzi", "Offerte", "News", "Mappa del sito"].map((m) => (
                <p key={m} className="border-t border-[#ddd] px-2 py-1 text-[#1d3f66]">
                  » {m}
                </p>
              ))}
            </div>
            <div className="space-y-1 border border-[#bbb] p-2">
              <p className="font-bold">Login</p>
              <p>Nome utente</p>
              <div className="h-5 border border-[#999]" />
              <p>Password</p>
              <div className="h-5 border border-[#999]" />
              <p className="w-fit border border-[#999] bg-[#eee] px-2">Accedi</p>
              <p className="text-[10px] text-[#1d3f66]">Password dimenticata? · Registrati</p>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[20px] font-bold text-[#1d3f66]">Benvenuti</p>
            <p className="mb-2 text-[10px] text-[#888]">Scritto da Administrator · Visite: 2341</p>
            <div className="float-right ml-3 h-[110px] w-[160px] overflow-hidden border border-[#999]">
              <Scenery variant="city" className="h-full w-full" style={blurryPhoto} />
            </div>
            <p className="leading-[1.45]">
              Il B&amp;B La Nosiola si trova in pieno centro storico, a soli 50 metri dalla piazza principale. Le camere
              sono dotate di bagno privato, TV, Wi-Fi. È disponibile un ascensore. Possibilità di noleggio biciclette. Per
              le tariffe consultare la sezione Tariffe. Per le prenotazioni utilizzare il modulo nella sezione Contatti
              compilando tutti i campi obbligatori (*). Riceverete risposta appena possibile.
            </p>
            <p className="mt-2 text-[#1d3f66] underline">Leggi tutto...</p>
          </div>
          <div className="w-[190px] space-y-3">
            <div className="border border-[#bbb] p-2 text-center text-[#999]">
              <p className="font-bold text-[#222]">Meteo</p>
              <p className="mt-6 mb-6">⚠ Modulo non disponibile</p>
            </div>
            <div className="border border-[#bbb] p-2 text-center">
              <p className="font-bold">Seguici su Facebook</p>
              <div className="mt-2 h-16 bg-[#eee]" />
            </div>
          </div>
        </div>
        <p className="border-t border-[#ccc] py-2 text-center text-[10px] text-[#888]">Powered by Joomla! · Valid XHTML and CSS · P.IVA ...</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[230px] bg-[#fff6b3] p-6 text-[14px] text-[#333] shadow-[0_-4px_10px_rgba(0,0,0,0.25)]">
        <p className="text-[18px] font-bold">INFORMATIVA COOKIE</p>
        <p className="mt-2 max-w-[1100px]">
          Questo sito utilizza cookie tecnici e di terze parti per migliorare la tua esperienza di navigazione. Proseguendo
          nella navigazione, scorrendo la pagina o cliccando su qualsiasi elemento acconsenti all&apos;uso dei cookie. Per
          maggiori informazioni consulta la nostra cookie policy completa ai sensi del Regolamento...
        </p>
        <span className="mt-4 inline-block border border-[#999] bg-[#eee] px-4 py-1">OK, ho capito</span>
      </div>
    </div>
  );
}

function NosiolaAfter() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#f6f1e7] text-[#1f3b2d]" style={{ fontFamily: "var(--font-inter)" }}>
      <div className="flex w-[640px] flex-col justify-between p-12 pr-6">
        <div className="flex items-center justify-between text-[14px]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#1f3b2d] text-[#f6f1e7]">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3c3 3 4 6 4 9a4 4 0 0 1-8 0c0-3 1-6 4-9Z" />
                <path d="M12 21v-7" />
              </svg>
            </span>
            <p className={`${fraunces.className} text-[26px] font-semibold`}>La Nosiola</p>
          </div>
          <div className="flex gap-6 text-[#4c6a5a]">
            <span>Camere</span>
            <span>Esperienze</span>
            <span>Contatti</span>
            <span className="font-semibold text-[#1f3b2d]">IT</span>
          </div>
        </div>

        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#e3ebe1] px-4 py-2 text-[13px] font-medium">
            <span className="size-2 rounded-full bg-[#2f7a4f]" /> Centro storico · 50 m dalla piazza del Duomo
          </p>
          <h3 className={`${fraunces.className} mt-6 text-[74px] leading-[0.98] font-semibold tracking-[-0.01em]`}>
            Dormi nel cuore di <em className="font-normal text-[#b5654b]">Trento</em>.
          </h3>
          <p className="mt-5 max-w-[470px] text-[18px] leading-relaxed text-[#4c6a5a]">
            Quattro camere con bagno privato, ascensore e biciclette in prestito. Musei, ristoranti e mercatini: tutto a piedi.
          </p>
          <div className="mt-8 flex gap-3 text-[16px] font-semibold">
            <span className="rounded-full bg-[#1f3b2d] px-7 py-4 text-[#f6f1e7] shadow-[0_14px_30px_-12px_rgba(31,59,45,0.7)]">Prenota direttamente</span>
            <span className="rounded-full border-2 border-[#1f3b2d]/80 px-7 py-4">Scrivici su WhatsApp</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-[13px]">
          {[
            ["Senza commissioni", "prenoti con noi"],
            ["Check-in autonomo", "arrivi quando vuoi"],
            ["Bici incluse", "per girare la città"],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-[#1f3b2d]/10 bg-white/60 px-4 py-3">
              <p className="font-semibold">{t}</p>
              <p className="text-[#8a9a8f]">{d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex-1 py-8 pr-8">
        <div className="relative h-full overflow-hidden rounded-t-[320px] rounded-b-[40px] shadow-[0_40px_80px_-30px_rgba(31,59,45,0.6)]">
          <Scenery variant="city" className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute top-36 right-14 w-[220px] rounded-2xl bg-white p-3 shadow-xl">
          <svg viewBox="0 0 200 110" className="h-[100px] w-full rounded-xl bg-[#eef1e8]">
            <path d="M0 70 H200 M60 0 V110 M140 0 V110 M0 25 L200 95" stroke="#fff" strokeWidth="8" />
            <path d="M0 70 H200 M60 0 V110 M140 0 V110 M0 25 L200 95" stroke="#dfe4d7" strokeWidth="1" />
            <rect x="80" y="30" width="44" height="28" rx="4" fill="#d8c3a0" />
            <circle cx="102" cy="44" r="5" fill="#b5654b" />
            <path d="M150 52 c0-9 14-9 14 0 c0 7-7 13-7 13 s-7-6-7-13Z" fill="#2f7a4f" />
            <path d="M157 52 L118 46" stroke="#2f7a4f" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
          <p className="mt-2 px-1 text-[13px] font-semibold">Duomo a 50 metri</p>
          <p className="px-1 text-[12px] text-[#8a9a8f]">1 minuto a piedi</p>
        </div>
        <div className="absolute bottom-16 -left-10 w-[300px] rounded-3xl bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] tracking-wider text-[#8a9a8f] uppercase">Camera Duomo</p>
            <p className="text-[12px] font-semibold text-[#2f7a4f]">Libera stasera</p>
          </div>
          <p className={`${fraunces.className} mt-1 text-[24px] font-semibold`}>Doppia con balcone</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-[14px] text-[#4c6a5a]">
              da <b className="text-[24px] text-[#1f3b2d]">78 €</b> / notte
            </p>
            <span className="rounded-full bg-[#b5654b] px-4 py-2 text-[13px] font-semibold text-white">Prenota</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. B&B Arcadia · il giardino in città                               */
/* ------------------------------------------------------------------ */

function ArcadiaBefore() {
  return (
    <div className="h-full w-full overflow-hidden bg-black text-[#7CFC00]" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="mx-auto w-[820px] pt-4 text-center">
        <p className="text-[52px] font-bold italic" style={{ color: "#ff00ff", textShadow: "0 0 6px #ff00ff, 3px 3px 0 #00ffff" }}>
          ~ B&amp;B Arcadia ~
        </p>
        <div className="mt-2 overflow-hidden border-y-2 border-[#ff0] bg-[#300] py-1 text-[16px] font-bold whitespace-nowrap text-[#ff0]">
          ★★★ OFFERTA SPECIALE!!! PRENOTA ORA E RISPARMIA ★★★ WI-FI GRATIS ★★★ PARCHEGGIO BICI ★★★ OFFERTA SPECIALE!!!
        </div>
        <div className="mt-3 flex justify-center gap-3 text-[14px] underline">
          {["HOME", "FOTO", "CAMERE", "DOVE SIAMO", "LIBRO OSPITI", "CONTATTI"].map((m) => (
            <span key={m} className="text-[#00ffff]">
              [{m}]
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-6 gap-1.5 px-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="aspect-[4/3] overflow-hidden border-2 border-[#7CFC00]">
              <Scenery variant={i % 2 ? "garden" : "city"} className="h-full w-full" style={{ filter: "blur(2px) saturate(1.8) hue-rotate(20deg)" }} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[#999]">Clicca sulle miniature per ingrandire (apre una nuova finestra)</p>
        <div className="mx-auto mt-4 flex h-[200px] w-[560px] flex-col items-center justify-center border border-[#555] bg-[#222] text-[13px] text-[#aaa]">
          <div className="mb-3 grid size-12 place-items-center rounded-full border-2 border-[#777] text-[22px] text-[#777]">?</div>
          Per visualizzare questo contenuto è necessario
          <br />
          <span className="text-[#ccc] underline">Adobe Flash Player</span>
        </div>
        <p className="mt-4 text-[13px]">
          <span className="mr-2 rounded bg-[#f00] px-1.5 text-[11px] font-bold text-[#ff0]">NEW!</span>
          Sito ottimizzato per Internet Explorer 6 a 800x600
        </p>
      </div>
    </div>
  );
}

function ArcadiaAfter() {
  const days = Array.from({ length: 14 }, (_, i) => i + 8);
  return (
    <div className="grid h-full w-full grid-cols-[1.55fr_1fr] gap-4 overflow-hidden bg-[#eef2e6] p-5 text-[#23331f]" style={{ fontFamily: "var(--font-inter)" }}>
      <div className="relative overflow-hidden rounded-[32px]">
        <Scenery variant="garden" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16220f]/85 via-[#16220f]/10 to-transparent" />
        <div className="relative m-5 flex items-center justify-between rounded-full bg-white/80 px-6 py-3 text-[14px] backdrop-blur">
          <p className="text-[22px] font-bold tracking-tight">
            arcadia<span className="text-[#5f8f4e]">.</span>
          </p>
          <div className="flex gap-6 text-[#4a5a45]">
            <span>Il giardino</span>
            <span>Camere</span>
            <span>Colazione</span>
          </div>
        </div>
        <div className="absolute right-8 bottom-8 left-8 text-white">
          <p className="w-fit rounded-full bg-white/20 px-4 py-1.5 text-[13px] backdrop-blur">🌿 B&amp;B con giardino privato, in città</p>
          <h3 className="mt-4 text-[68px] leading-[0.95] font-bold tracking-[-0.03em]">Un giardino segreto, a due passi da tutto.</h3>
          <div className="mt-6 flex gap-3 text-[15px] font-semibold">
            <span className="rounded-full bg-white px-6 py-3.5 text-[#23331f]">Scopri le camere</span>
            <span className="rounded-full bg-[#25d366] px-6 py-3.5 text-[#0b3d1e]">Scrivici su WhatsApp</span>
          </div>
        </div>
      </div>

      <div className="grid grid-rows-[auto_1fr_auto] gap-4">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold">Giugno</p>
            <p className="text-[12px] text-[#7a8a74]">Seleziona le date</p>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[13px]">
            {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
              <span key={i} className="text-[11px] text-[#9aa894]">
                {d}
              </span>
            ))}
            {days.map((d) => {
              const inRange = d >= 12 && d <= 14;
              const edge = d === 12 || d === 14;
              const full = d === 9 || d === 17 || d === 18;
              return (
                <span
                  key={d}
                  className={`rounded-lg py-1.5 ${edge ? "bg-[#5f8f4e] font-semibold text-white" : inRange ? "bg-[#dfead4]" : full ? "text-[#c3cbbf] line-through" : ""}`}
                >
                  {d}
                </span>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f3f6ee] px-4 py-3">
            <p className="text-[13px] text-[#4a5a45]">
              2 notti · <b className="text-[#23331f]">176 €</b>
            </p>
            <span className="rounded-full bg-[#5f8f4e] px-4 py-2 text-[13px] font-semibold text-white">Prenota</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px]">
          <Scenery variant="garden" className="absolute inset-0 h-full w-full scale-[1.8]" style={{ transformOrigin: "35% 75%" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-[12px] tracking-wider uppercase opacity-80">Dalle 7:30 alle 10:30</p>
            <p className="text-[22px] font-bold">Colazione sotto il glicine</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-[12px] font-medium">
          {[
            ["☕", "Torte fatte in casa"],
            ["🚲", "Bici al coperto"],
            ["📶", "Wi-Fi veloce"],
          ].map(([i, t]) => (
            <div key={t} className="rounded-2xl bg-white px-2 py-3 shadow-sm">
              <p className="text-[20px]">{i}</p>
              <p className="mt-1">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const makeoverSites = {
  rosa: { Before: RosaBefore, After: RosaAfter },
  nosiola: { Before: NosiolaBefore, After: NosiolaAfter },
  arcadia: { Before: ArcadiaBefore, After: ArcadiaAfter },
} as const;

export type MakeoverId = keyof typeof makeoverSites;
