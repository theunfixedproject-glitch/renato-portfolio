"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { MULTI_SERVICE_LABEL, PREFILL_EVENT, type PrefillDetail } from "@/lib/events";
import { profile, quoteTypes, quoteUrgency, type QuoteExtra } from "@/lib/data";
import { availableExtras, estimateQuote, formatEuro, quoteSummary, unitsFor, type QuoteInput } from "@/lib/quote";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { ArrowIcon, CheckIcon, WhatsAppIcon } from "../ui/Icons";
import { SectionHeading } from "../ui/SectionHeading";

const roundTens = (n: number) => formatEuro(Math.round(n / 10) * 10);

export function QuoteEstimator() {
  const [input, setInput] = useState<QuoteInput>({ typeIds: ["vetrina"], units: {}, extras: ["seo"], urgencyId: "normal" });
  const result = useMemo(() => estimateQuote(input), [input]);
  const extras = useMemo(() => availableExtras(input.typeIds), [input.typeIds]);
  const withUnits = quoteTypes.filter((t) => input.typeIds.includes(t.id) && t.perUnit > 0);

  const toggleType = (typeId: string) =>
    setInput((s) => {
      const typeIds = s.typeIds.includes(typeId) ? s.typeIds.filter((id) => id !== typeId) : [...s.typeIds, typeId];
      // Gli extra che non hanno più senso per i servizi rimasti vengono tolti.
      const allowed = new Set(availableExtras(typeIds).map((e) => e.id));
      return { ...s, typeIds, extras: s.extras.filter((id) => allowed.has(id)) };
    });
  const toggleExtra = (id: string) =>
    setInput((s) => ({ ...s, extras: s.extras.includes(id) ? s.extras.filter((e) => e !== id) : [...s.extras, id] }));

  const summary = result ? quoteSummary(input, result) : "";

  const sendToForm = () => {
    if (!result) return;
    const type = result.types.length === 1 ? result.types[0].label : MULTI_SERVICE_LABEL;
    window.dispatchEvent(new CustomEvent<PrefillDetail>(PREFILL_EVENT, { detail: { type, message: summary } }));
    document.getElementById("contatti")?.scrollIntoView({ behavior: "smooth" });
  };

  let step = 1;

  return (
    <section aria-labelledby="preventivo-title" id="preventivo" className="section">
      <SectionHeading
        id="preventivo-title"
        index="05"
        eyebrow="preventivo rapido"
        title={
          <>
            Quanto costa il tuo progetto? <span className="text-gradient">Scoprilo ora.</span>
          </>
        }
        intro="Scegli cosa ti serve e ottieni subito una stima di costi e tempi. È indicativa: il preventivo definitivo, gratuito, lo facciamo insieme dopo una chiamata."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card space-y-10 p-6 md:p-8">
          <fieldset className="min-w-0">
            <legend className="eyebrow mb-2">{step++} · Cosa ti serve?</legend>
            <p className="mb-4 text-sm text-mist">Puoi sceglierne più di uno.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quoteTypes.map((t) => {
                const active = input.typeIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`relative cursor-pointer rounded-2xl border p-4 pr-10 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cyber ${
                      active ? "border-violet bg-violet/10" : "border-line hover:border-mist/50"
                    }`}
                  >
                    <input type="checkbox" checked={active} onChange={() => toggleType(t.id)} className="sr-only" />
                    <span className="block font-display text-lg font-bold">{t.label}</span>
                    <span className="mt-1 block text-xs text-mist">{t.hint}</span>
                    <span
                      aria-hidden
                      className={`absolute top-3 right-3 grid size-5 place-items-center rounded-md border transition-colors ${
                        active ? "border-violet bg-violet text-ink" : "border-line"
                      }`}
                    >
                      {active && <CheckIcon width={12} height={12} strokeWidth={3} />}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <AnimatePresence initial={false}>
            {withUnits.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6">
                <p className="eyebrow">{step++} · Quanto è grande?</p>
                {withUnits.map((t) => {
                  const value = unitsFor(input, t);
                  return (
                    <div key={t.id}>
                      <label htmlFor={`quote-units-${t.id}`} className="mb-3 flex justify-between gap-4 text-sm">
                        <span>
                          {t.label}: quante {t.unitLabel}?
                        </span>
                        <span className="font-mono text-cyber">{value}</span>
                      </label>
                      <input
                        id={`quote-units-${t.id}`}
                        type="range"
                        min={1}
                        max={t.includedUnits * 4}
                        value={value}
                        onChange={(e) => setInput((s) => ({ ...s, units: { ...s.units, [t.id]: Number(e.target.value) } }))}
                        className="w-full accent-[var(--color-violet)]"
                      />
                      <p className="mt-1 font-mono text-xs text-mist">
                        {t.includedUnits} {t.unitLabel} incluse nel prezzo base
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <fieldset className="min-w-0">
            <legend className="eyebrow mb-2">{step++} · Extra</legend>
            <p className="mb-4 text-sm text-mist">
              {input.typeIds.length ? "Aggiungi le funzioni che vorresti: ne parliamo comunque insieme prima di iniziare." : "Scegli prima un servizio."}
            </p>
            <motion.div layout className="flex min-w-0 flex-wrap gap-2">
              <AnimatePresence initial={false} mode="popLayout">
                {input.typeIds.length > 0 &&
                  extras.map((extra) => (
                    <ExtraChip key={extra.id} extra={extra} on={input.extras.includes(extra.id)} onToggle={() => toggleExtra(extra.id)} />
                  ))}
              </AnimatePresence>
            </motion.div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="eyebrow mb-4">{step++} · Tempistica</legend>
            <div className="inline-flex rounded-full border border-line p-1">
              {quoteUrgency.map((u) => (
                <label
                  key={u.id}
                  className={`relative cursor-pointer rounded-full px-3 py-2 font-mono text-xs whitespace-nowrap transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cyber sm:px-4 ${
                    input.urgencyId === u.id ? "text-ink" : "text-mist"
                  }`}
                >
                  <input
                    type="radio"
                    name="quote-urgency"
                    value={u.id}
                    checked={input.urgencyId === u.id}
                    onChange={() => setInput((s) => ({ ...s, urgencyId: u.id }))}
                    className="sr-only"
                  />
                  {input.urgencyId === u.id && <motion.span layoutId="urgency-pill" className="absolute inset-0 rounded-full bg-snow" />}
                  <span className="relative">{u.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside aria-label="La tua stima" className="lg:sticky lg:top-24 lg:self-start">
          <div className="beam relative overflow-hidden rounded-3xl border border-violet/20 bg-gradient-to-br from-violet/20 via-coal to-coal p-6 md:p-8">
            <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-cyber/20 blur-3xl" />
            <p className="eyebrow">la tua stima</p>
            <p className="sr-only" aria-live="polite">
              {result
                ? `Stima da ${formatEuro(result.min)} a ${formatEuro(result.max)}, ${result.weeksMin}-${result.weeksMax} settimane`
                : "Scegli almeno un servizio per vedere la stima"}
            </p>

            {result ? (
              <>
                <p className="mt-3 font-mono text-sm text-mist">{result.types.map((t) => t.label).join(" + ")}</p>
                <p aria-hidden className="mt-6 font-display text-4xl leading-none font-bold sm:text-5xl">
                  <AnimatedNumber value={result.min} format={roundTens} />
                </p>
                <p aria-hidden className="mt-1 font-mono text-sm text-mist">
                  fino a <AnimatedNumber value={result.max} format={roundTens} className="text-snow" />
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-6 font-mono text-sm">
                  <div>
                    <p className="text-xs text-mist">tempi</p>
                    <p className="mt-1 text-lg text-cyber">
                      {result.weeksMin}–{result.weeksMax} sett.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-mist">preventivo</p>
                    <p className="mt-1 text-lg">gratuito</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={sendToForm}
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-cyber px-6 py-4 font-mono text-sm font-medium text-ink transition-shadow hover:shadow-[0_0_40px_-6px_var(--color-cyber)]"
                  >
                    Richiedi il preventivo definitivo
                    <ArrowIcon width={16} height={16} className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </button>
                  <a
                    href={`${profile.whatsappBase}?text=${encodeURIComponent(`Ciao Renato, ho fatto una stima sul tuo sito:\n${summary}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-4 text-base font-semibold text-ink transition-shadow hover:shadow-[0_0_40px_-6px_var(--color-whatsapp)]"
                  >
                    <WhatsAppIcon width={22} height={22} strokeWidth={2.2} /> Mandala su WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <p className="mt-6 font-display text-2xl font-bold text-mist">Scegli almeno un servizio per vedere la stima.</p>
            )}
            <p className="mt-5 text-xs leading-relaxed text-mist">
              Stima indicativa e non vincolante: il prezzo finale dipende dai dettagli del progetto.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ExtraChip({ extra, on, onToggle }: { extra: QuoteExtra; on: boolean; onToggle: () => void }) {
  const motionProps = {
    layout: true,
    initial: { opacity: 0, scale: 0.85 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.85 },
    whileTap: { scale: 0.95 },
  } as const;

  if (extra.featured) {
    return (
      <motion.button
        {...motionProps}
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={`beam relative w-full max-w-full overflow-hidden rounded-2xl border p-4 text-left transition-colors ${
          on ? "border-cyber bg-cyber/10" : "border-violet/60 bg-violet/10 hover:border-violet"
        }`}
      >
        <span className="mb-2 inline-block rounded-full bg-violet px-2.5 py-1 font-mono text-[10px] tracking-wider text-ink uppercase">
          Consigliato
        </span>
        <span className={`flex items-center gap-2 font-display text-lg font-bold ${on ? "text-cyber" : ""}`}>
          <span aria-hidden className="font-mono">
            {on ? "✓" : "+"}
          </span>
          {extra.label}
        </span>
        {extra.hint && <span className="mt-2 block text-sm leading-relaxed text-mist">{extra.hint}</span>}
      </motion.button>
    );
  }

  return (
    <motion.button
      {...motionProps}
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-left text-sm transition-colors ${
        on ? "border-cyber bg-cyber/10 text-cyber" : "border-line text-mist hover:text-snow"
      }`}
    >
      <span aria-hidden className="font-mono">
        {on ? "✓" : "+"}
      </span>
      {extra.label}
    </motion.button>
  );
}
