"use client";

import { makeovers, profile } from "@/lib/data";
import { ArrowIcon } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { BeforeAfter } from "./BeforeAfter";
import { makeoverSites } from "./sites";

export function Makeovers() {
  return (
    <section aria-labelledby="prima-dopo-title" id="prima-dopo" className="section">
      <SectionHeading
        id="prima-dopo-title"
        index="03"
        eyebrow="prima e dopo"
        title={
          <>
            Siti da incubo, <span className="text-gradient">rimessi a nuovo.</span>
          </>
        }
        intro="Come in quei programmi in cui un esperto rimette in piedi un ristorante, ma per siti web: prendo un sito che allontana i clienti e lo rifaccio da zero. Trascina la maniglia per vedere la differenza."
      />

      <MakeoverList />

      <MakeoverCta />
    </section>
  );
}

/** I tre casi "prima e dopo": in home e nella pagina dei siti web. */
export function MakeoverList() {
  return (
    <div className="space-y-24 md:space-y-32">
      {makeovers.map((m, i) => {
        const { Before, After } = makeoverSites[m.id];
        return (
          <article key={m.id} aria-labelledby={`mk-${m.id}`} className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
            <Reveal className={i % 2 ? "lg:order-2" : ""}>
              <BeforeAfter url={m.url} label={m.name} before={<Before />} after={<After />} />
            </Reveal>
            <Reveal delay={0.1}>
              <p className="font-mono text-xs text-mist">
                caso {String(i + 1).padStart(2, "0")} · {m.place}
              </p>
              <h3 id={`mk-${m.id}`} className="mt-3 font-display text-3xl font-bold md:text-4xl">
                {m.name}
              </h3>
              <p className="mt-4 border-l-2 border-violet pl-4 text-lg leading-relaxed text-snow/85 italic">{m.verdict}</p>
              <ul className="mt-7 space-y-4">
                {m.fixes.map((f) => (
                  <li key={f.before} className="rounded-2xl border border-line bg-coal/80 p-4">
                    <p className="flex gap-2 text-sm text-mist line-through decoration-red-400/70">
                      <span aria-hidden className="text-red-400 no-underline">✕</span>
                      <span className="sr-only">Prima: </span>
                      {f.before}
                    </p>
                    <p className="mt-2 flex gap-2 text-sm font-medium">
                      <span aria-hidden className="text-cyber">✓</span>
                      <span className="sr-only">Dopo: </span>
                      {f.after}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </article>
        );
      })}
    </div>
  );
}

/** Invito finale: "il tuo sito somiglia a un prima?". */
export function MakeoverCta() {
  return (
    <Reveal className="mt-24">
      <div className="beam relative overflow-hidden rounded-3xl border border-violet/20 bg-gradient-to-br from-violet/20 via-coal to-coal p-8 md:flex md:items-center md:justify-between md:gap-10 md:p-12">
        <div>
          <p className="font-display text-2xl font-bold md:text-3xl">Il tuo sito somiglia a un &ldquo;prima&rdquo;?</p>
          <p className="mt-3 max-w-xl text-mist">
            Mandami il link: ti dico gratis cosa sistemerei per primo e quanto costerebbe rifarlo.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
          <a
            href={`${profile.whatsappBase}?text=${encodeURIComponent("Ciao Renato, mi daresti un parere sul mio sito? Ecco il link: ")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shine inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-4 font-semibold text-ink"
          >
            Mandami il link su WhatsApp
          </a>
          <a href="/#preventivo" className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-4 font-mono text-sm transition-colors hover:border-cyber hover:text-cyber">
            Calcola un preventivo <ArrowIcon width={16} height={16} />
          </a>
        </div>
      </div>
      <p className="mt-6 text-center font-mono text-xs text-mist">
        Strutture, nomi e indirizzi sono di fantasia. I difetti, purtroppo, si trovano davvero in giro.
      </p>
    </Reveal>
  );
}
