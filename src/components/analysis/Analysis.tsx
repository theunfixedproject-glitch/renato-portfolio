"use client";

import { ANALYSIS_LABEL, analysisOffers, analysisPrinciples, analysisProof, profile, type AnalysisOffer } from "@/lib/data";
import { PREFILL_EVENT, type PrefillDetail } from "@/lib/events";
import { formatEuro } from "@/lib/quote";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { BeamBorder } from "../ui/BeamBorder";
import { ArrowIcon, WhatsAppIcon } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { Tilt } from "../ui/Tilt";
import { ReportStack } from "./ReportStack";

const thousands = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const whatsappAsk = (text: string) => `${profile.whatsappBase}?text=${encodeURIComponent(text)}`;

/** Porta al form contatti già compilato con la richiesta di analisi. */
function askInForm(offer?: AnalysisOffer) {
  const message = offer
    ? `Ciao Renato, mi interessa: ${offer.title}.\n\nIl mio settore e la mia zona: \nCosa vorrei sapere: `
    : "Ciao Renato, vorrei un'analisi su misura.\n\nIl mio settore e la mia zona: \nCosa vorrei sapere: ";
  window.dispatchEvent(new CustomEvent<PrefillDetail>(PREFILL_EVENT, { detail: { type: ANALYSIS_LABEL, message, raw: true } }));
  document.getElementById("contatti")?.scrollIntoView({ behavior: "smooth" });
}

export function Analysis() {
  return (
    <section aria-labelledby="analisi-title" id="analisi" className="section overflow-x-clip">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
        <div>
          <SectionHeading
            id="analisi-title"
            index="04"
            eyebrow="analisi & dati"
            title={
              <>
                Vuoi sapere <span className="text-gradient">tutto</span> sulla tua concorrenza?
              </>
            }
            intro="Chi c'è nella tua zona, quanto chiede, come si presenta e dove sbaglia. Ti preparo report su misura con dati raccolti da fonti pubbliche e controllati uno per uno: in pochi giorni, a prezzi pensati per le piccole attività."
          />
          <Reveal className="-mt-6 flex flex-wrap gap-3 md:-mt-10">
            <a
              href={whatsappAsk("Ciao Renato, vorrei sapere di più sulla mia concorrenza. Il mio settore è: ")}
              target="_blank"
              rel="noopener noreferrer"
              className="shine inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-4 text-base font-semibold text-ink shadow-[0_0_40px_-10px_var(--color-whatsapp)]"
            >
              <WhatsAppIcon width={22} height={22} strokeWidth={2.2} /> Chiedimi un report
            </a>
            <button
              type="button"
              onClick={() => askInForm()}
              className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-4 font-mono text-sm transition-colors hover:border-cyber hover:text-cyber"
            >
              Scrivimi cosa vuoi sapere <ArrowIcon width={16} height={16} />
            </button>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <ReportStack />
        </Reveal>
      </div>

      <Reveal className="mt-20">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
          {analysisProof.map((p) => (
            <div key={p.label} className="bg-ink/85 p-6 md:p-8">
              <dt className="sr-only">{p.label}</dt>
              <dd>
                <AnimatedNumber
                  value={p.value}
                  startOnView
                  duration={1.6}
                  format={thousands}
                  className="block font-display text-4xl font-bold text-cyber md:text-5xl"
                />
                <span aria-hidden className="mt-3 block text-sm leading-snug text-mist">
                  {p.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-center font-mono text-[11px] text-mist">Numeri presi dai report che ho già realizzato.</p>
      </Reveal>

      <div className="mt-20 grid grid-cols-1 gap-5 md:grid-cols-2">
        {analysisOffers.map((offer, i) => (
          <Reveal key={offer.id} delay={(i % 2) * 0.08} className="h-full">
            <Tilt max={4} className="h-full rounded-3xl">
              <article className="card group relative flex h-full flex-col overflow-hidden p-6 md:p-8">
                <BeamBorder onHover />
                <div
                  aria-hidden
                  className={`pointer-events-none absolute -top-40 -right-40 size-96 opacity-40 transition-opacity duration-500 group-hover:opacity-100 ${
                    offer.accent === "green" ? "glow-green" : "glow-violet"
                  }`}
                />
                <p className={`relative font-mono text-xs ${offer.accent === "green" ? "text-cyber" : "text-violet-soft"}`}>{offer.title}</p>
                <h3 className="relative mt-3 font-display text-2xl leading-tight font-bold md:text-3xl">{offer.question}</h3>
                <p className="relative mt-4 leading-relaxed text-mist">{offer.description}</p>
                <ul className="relative mt-6 mb-8 grid gap-2 text-sm sm:grid-cols-2">
                  {offer.deliverables.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span aria-hidden className="text-cyber">
                        ✓
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
                <div className="relative mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-line pt-6">
                  <div>
                    <p className="font-mono text-[11px] text-mist">a partire da</p>
                    <p className="font-display text-3xl font-bold">{formatEuro(offer.from)}</p>
                    <p className="font-mono text-[11px] text-mist">consegna in {offer.days}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => askInForm(offer)}
                    className="shine inline-flex items-center gap-2 rounded-full bg-snow px-5 py-3 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
                  >
                    Lo voglio <ArrowIcon width={16} height={16} />
                  </button>
                </div>
              </article>
            </Tilt>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-16">
        <div className="grid gap-4 md:grid-cols-3">
          {analysisPrinciples.map((p, i) => (
            <div key={p.title} className="rounded-3xl border border-dashed border-line p-6">
              <p className="font-mono text-xs text-violet-soft">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-3 font-display text-lg font-bold">{p.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-mist">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-mist">
          Ti serve qualcosa che non è in elenco? Un&apos;analisi si costruisce attorno alla tua domanda:{" "}
          <button type="button" onClick={() => askInForm()} className="text-cyber underline-offset-4 hover:underline">
            raccontamela
          </button>
          .
        </p>
      </Reveal>
    </section>
  );
}
