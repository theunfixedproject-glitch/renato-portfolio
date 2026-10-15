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
    <div className="relative h-full w-full overflow-hidden bg-[#1f1712] text-[#fbf3ea]">
      <Scenery variant="vineyard" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1f1712]/85 via-[#1f1712]/35 to-transparent" />
      <div className="relative flex items-center justify-between px-14 pt-9 text-[15px]">
        <p className={`${fraunces.className} text-[30px] font-semibold`}>
          Da Rosa <span className="text-[14px] font-normal tracking-[0.3em] text-[#f6c99a] uppercase">B&amp;B</span>
        </p>
        <div className="flex items-center gap-9">
          {["Camere", "Colazione", "Dintorni", "Dove siamo"].map((m) => (
            <span key={m}>{m}</span>
          ))}
          <span className="rounded-full bg-[#f6c99a] px-6 py-3 font-semibold text-[#2b1d14]">Prenota</span>
        </div>
      </div>
      <div className="relative mt-24 max-w-[640px] px-14">
        <p className="text-[14px] tracking-[0.35em] text-[#f6c99a] uppercase">5 camere tra i vigneti · Trentino</p>
        <h3 className={`${fraunces.className} mt-5 text-[72px] leading-[1.02] font-semibold`}>
          Il silenzio dei vigneti, a un passo dalle <em className="text-[#f6c99a]">Dolomiti</em>.
        </h3>
        <p className="mt-6 max-w-[520px] text-[19px] leading-relaxed text-[#f3e6d8]">
          Camere luminose con bagno privato, colazione con prodotti del territorio e la Guest Card per muoverti gratis.
        </p>
      </div>
      <div className="absolute right-14 bottom-12 left-14 flex items-end gap-4 rounded-[28px] bg-[#fbf3ea] p-4 text-[#2b1d14] shadow-2xl">
        {[
          ["Arrivo", "Ven 12 giu"],
          ["Partenza", "Dom 14 giu"],
          ["Ospiti", "2 adulti"],
        ].map(([l, v]) => (
          <div key={l} className="flex-1 rounded-2xl bg-[#f1e4d3] px-5 py-3">
            <p className="text-[12px] tracking-wider text-[#8a6a52] uppercase">{l}</p>
            <p className="mt-1 text-[19px] font-semibold">{v}</p>
          </div>
        ))}
        <div className="rounded-2xl bg-[#7a2e2e] px-8 py-6 text-[18px] font-semibold text-white">Verifica disponibilità</div>
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
      <div className="flex w-[640px] flex-col justify-between p-14">
        <div className="flex items-center justify-between text-[15px]">
          <p className={`${fraunces.className} text-[28px] font-semibold`}>La Nosiola</p>
          <div className="flex gap-7 text-[#4c6a5a]">
            <span>Camere</span>
            <span>Trento</span>
            <span>Contatti</span>
          </div>
        </div>
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#e3ebe1] px-4 py-2 text-[14px] font-medium">
            <span className="size-2 rounded-full bg-[#2f7a4f]" /> Centro storico · 50 m dalla piazza
          </p>
          <h3 className={`${fraunces.className} mt-6 text-[70px] leading-[1.02] font-semibold`}>
            Dormi nel cuore di <em className="text-[#b5654b]">Trento</em>.
          </h3>
          <p className="mt-5 max-w-[470px] text-[18px] leading-relaxed text-[#4c6a5a]">
            Quattro camere con bagno privato, ascensore e biciclette a disposizione. Tutto il centro a piedi.
          </p>
          <div className="mt-8 flex gap-3 text-[16px] font-semibold">
            <span className="rounded-full bg-[#1f3b2d] px-7 py-4 text-[#f6f1e7]">Prenota direttamente</span>
            <span className="rounded-full border-2 border-[#1f3b2d] px-7 py-4">Scrivici su WhatsApp</span>
          </div>
        </div>
        <div className="flex gap-8 text-[14px] text-[#4c6a5a]">
          <span>✓ Senza commissioni</span>
          <span>✓ Check-in autonomo</span>
          <span>✓ Wi-Fi veloce</span>
        </div>
      </div>
      <div className="relative flex-1 p-8 pl-0">
        <div className="relative h-full overflow-hidden rounded-t-[320px] rounded-b-[40px]">
          <Scenery variant="city" className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute bottom-16 -left-10 w-[290px] rounded-3xl bg-white p-5 shadow-xl">
          <p className="text-[12px] tracking-wider text-[#8a9a8f] uppercase">Camera Duomo</p>
          <p className={`${fraunces.className} mt-1 text-[24px] font-semibold`}>Doppia con balcone</p>
          <p className="mt-2 text-[15px] text-[#4c6a5a]">
            da <b className="text-[22px] text-[#1f3b2d]">78 €</b> / notte
          </p>
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
  return (
    <div className="h-full w-full overflow-hidden bg-[#f4f6ee] p-6 text-[#23331f]" style={{ fontFamily: "var(--font-inter)" }}>
      <div className="relative h-full overflow-hidden rounded-[36px]">
        <Scenery variant="garden" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1d2a19]/80 via-[#1d2a19]/10 to-transparent" />
        <div className="relative m-6 flex items-center justify-between rounded-full bg-white/85 px-7 py-3.5 text-[15px] backdrop-blur">
          <p className="text-[22px] font-bold tracking-tight">
            arcadia<span className="text-[#5f8f4e]">.</span>
          </p>
          <div className="flex items-center gap-8 text-[#4a5a45]">
            <span>Il giardino</span>
            <span>Camere</span>
            <span>Colazione</span>
            <span className="rounded-full bg-[#5f8f4e] px-5 py-2.5 font-semibold text-white">Verifica le date</span>
          </div>
        </div>
        <div className="absolute right-12 bottom-12 left-12 flex items-end justify-between text-white">
          <div className="max-w-[640px]">
            <p className="w-fit rounded-full bg-white/20 px-4 py-1.5 text-[14px] backdrop-blur">🌿 B&amp;B con giardino privato · in città</p>
            <h3 className="mt-5 text-[76px] leading-[0.98] font-bold tracking-tight">Un giardino segreto, a due passi da tutto.</h3>
          </div>
          <div className="w-[300px] space-y-3">
            {[
              ["☕", "Colazione in terrazza"],
              ["🚲", "Deposito bici coperto"],
              ["📶", "Wi-Fi in tutta la casa"],
            ].map(([i, t]) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 text-[16px] font-medium text-[#23331f]">
                <span className="text-[20px]">{i}</span>
                {t}
              </div>
            ))}
            <div className="rounded-2xl bg-[#25d366] px-4 py-3.5 text-center text-[16px] font-semibold text-[#0b3d1e]">Scrivici su WhatsApp</div>
          </div>
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
