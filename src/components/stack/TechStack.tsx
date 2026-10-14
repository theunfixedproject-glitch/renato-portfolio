import { lighthouse, techStack } from "@/lib/data";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { LighthouseGauge } from "./LighthouseGauge";
import { TechMarquee } from "./TechMarquee";

const half = Math.ceil(techStack.length / 2);

export function TechStack() {
  return (
    <section aria-labelledby="stack-title" id="stack" className="relative py-24 md:py-32">
      <div aria-hidden className="bg-dots absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_70%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="stack-title"
          index="03"
        eyebrow="stack & metriche"
          title={
            <>
              Tecnologie moderne, <span className="text-gradient">risultati misurabili.</span>
            </>
          }
          intro="Uso gli stessi strumenti delle grandi aziende tech, scelti di volta in volta per il tuo progetto. Il risultato si vede nei punteggi di Google: un sito veloce piace ai clienti e sale nei risultati di ricerca."
        />
      </div>

      <div className="space-y-4">
        <TechMarquee items={techStack.slice(0, half)} duration={45} />
        <TechMarquee items={techStack.slice(half)} reverse duration={50} />
      </div>

      <div className="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
        <Reveal className="card beam p-8 md:p-12">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">google lighthouse</p>
              <h3 className="mt-3 font-display text-2xl font-bold md:text-3xl">L&apos;obiettivo su ogni sito che consegno</h3>
            </div>
            <p className="max-w-sm text-sm text-mist">
              Performance, accessibilità e SEO sono il punto di partenza, non un extra da pagare a parte.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {lighthouse.map((m, i) => (
              <LighthouseGauge key={m.label} label={m.label} value={m.value} delay={i * 0.15} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
