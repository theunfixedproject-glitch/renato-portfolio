"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PREFILL_EVENT, type PrefillDetail } from "@/lib/events";
import { profile, quoteExtras, quoteTypes, quoteUrgency } from "@/lib/data";
import { estimateQuote, formatEuro, quoteSummary, type QuoteInput } from "@/lib/quote";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { ArrowIcon, CheckIcon, WhatsAppIcon } from "../ui/Icons";
import { SectionHeading } from "../ui/SectionHeading";

export function QuoteEstimator() {
  const [input, setInput] = useState<QuoteInput>({ typeId: "vetrina", units: 5, extras: ["seo"], urgencyId: "normal" });
  const result = useMemo(() => estimateQuote(input), [input]);
  const type = result.type;

  const selectType = (typeId: string) => {
    const t = quoteTypes.find((q) => q.id === typeId)!;
    setInput((s) => ({ ...s, typeId, units: t.includedUnits }));
  };
  const toggleExtra = (id: string) =>
    setInput((s) => ({ ...s, extras: s.extras.includes(id) ? s.extras.filter((e) => e !== id) : [...s.extras, id] }));

  const summary = quoteSummary(input, result);

  const sendToForm = () => {
    window.dispatchEvent(new CustomEvent<PrefillDetail>(PREFILL_EVENT, { detail: { type: type.label, message: summary } }));
    document.getElementById("contatti")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section aria-labelledby="preventivo-title" id="preventivo" className="section">
      <SectionHeading
        id="preventivo-title"
        eyebrow="// preventivo rapido"
        title={
          <>
            Quanto costa il tuo progetto? <span className="text-gradient">Scoprilo ora.</span>
          </>
        }
        intro="Scegli cosa ti serve e ottieni subito una stima di costi e tempi. È indicativa: il preventivo definitivo, gratuito, lo facciamo insieme dopo una chiamata."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card space-y-10 p-6 md:p-8">
          <fieldset>
            <legend className="eyebrow mb-4">1 · Cosa ti serve?</legend>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quoteTypes.map((t) => {
                const active = t.id === input.typeId;
                return (
                  <label
                    key={t.id}
                    className={`relative cursor-pointer rounded-2xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cyber ${
                      active ? "border-violet bg-violet/10" : "border-line hover:border-mist/50"
                    }`}
                  >
                    <input type="radio" name="quote-type" value={t.id} checked={active} onChange={() => selectType(t.id)} className="sr-only" />
                    <span className="block font-display text-lg font-bold">{t.label}</span>
                    <span className="mt-1 block text-xs text-mist">{t.hint}</span>
                    {active && (
                      <motion.span layoutId="type-check" className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-violet text-ink">
                        <CheckIcon width={12} height={12} strokeWidth={3} />
                      </motion.span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <AnimatePresence initial={false}>
            {type.perUnit > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <label htmlFor="quote-units" className="eyebrow mb-4 flex justify-between">
                  <span>2 · Quante {type.unitLabel}?</span>
                  <span className="text-snow">{input.units}</span>
                </label>
                <input
                  id="quote-units"
                  type="range"
                  min={1}
                  max={type.includedUnits * 4}
                  value={input.units}
                  onChange={(e) => setInput((s) => ({ ...s, units: Number(e.target.value) }))}
                  className="w-full accent-[var(--color-violet)]"
                />
                <p className="mt-2 font-mono text-xs text-mist">
                  {type.includedUnits} {type.unitLabel} incluse nel prezzo base
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <fieldset>
            <legend className="eyebrow mb-4">{type.perUnit > 0 ? "3" : "2"} · Extra</legend>
            <div className="flex flex-wrap gap-2">
              {quoteExtras.map((extra) => {
                const on = input.extras.includes(extra.id);
                return (
                  <motion.button
                    key={extra.id}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleExtra(extra.id)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                      on ? "border-cyber bg-cyber/10 text-cyber" : "border-line text-mist hover:text-snow"
                    }`}
                  >
                    <span aria-hidden className="font-mono">
                      {on ? "✓" : "+"}
                    </span>
                    {extra.label}
                  </motion.button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4">{type.perUnit > 0 ? "4" : "3"} · Tempistica</legend>
            <div className="inline-flex rounded-full border border-line p-1">
              {quoteUrgency.map((u) => (
                <label
                  key={u.id}
                  className={`relative cursor-pointer rounded-full px-4 py-2 font-mono text-xs transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cyber ${
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
          <div className="relative overflow-hidden rounded-3xl border border-violet/40 bg-gradient-to-br from-violet/20 via-coal to-coal p-6 md:p-8">
            <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-cyber/20 blur-3xl" />
            <p className="eyebrow">la tua stima</p>
            <p className="sr-only" aria-live="polite">
              Stima da {formatEuro(result.min)} a {formatEuro(result.max)}, {result.weeksMin}-{result.weeksMax} settimane
            </p>
            <p className="mt-3 font-mono text-sm text-mist">{type.label}</p>
            <p aria-hidden className="mt-6 font-display text-4xl leading-none font-bold sm:text-5xl">
              <AnimatedNumber value={result.min} format={(n) => formatEuro(Math.round(n / 10) * 10)} />
            </p>
            <p aria-hidden className="mt-1 font-mono text-sm text-mist">
              fino a <AnimatedNumber value={result.max} format={(n) => formatEuro(Math.round(n / 10) * 10)} className="text-snow" />
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
                <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>
              <a
                href={`https://wa.me/${profile.phoneHref.replace(/\D/g, "")}?text=${encodeURIComponent(`Ciao Renato, ho fatto una stima sul tuo sito:\n${summary}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-6 py-4 font-mono text-sm transition-colors hover:border-cyber hover:text-cyber"
              >
                <WhatsAppIcon width={16} height={16} /> Mandala su WhatsApp
              </a>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-mist">
              Stima indicativa e non vincolante: il prezzo finale dipende dai dettagli del progetto.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
