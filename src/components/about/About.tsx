"use client";

import { motion } from "framer-motion";
import { profile, services } from "@/lib/data";
import { Reveal } from "../ui/Reveal";
import { Tilt } from "../ui/Tilt";
import { SectionHeading } from "../ui/SectionHeading";
import { BeamBorder } from "../ui/BeamBorder";

const serviceIcons: Record<string, React.ReactNode> = {
  web: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01M9 14l-2 1.5L9 17M15 14l2 1.5-2 1.5" />
    </>
  ),
  app: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10 18h4M9 7h6M9 11h4" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4M9 12h.01M15 12h.01M9.5 15.5h5M2 12v3M22 12v3" />
    </>
  ),
};

const steps = [
  { n: "01", title: "Ascolto", text: "Una chiamata per capire la tua attività, i tuoi clienti e l'obiettivo." },
  { n: "02", title: "Proposta", text: "Preventivo chiaro, tempi certi e un primo design da toccare con mano." },
  { n: "03", title: "Sviluppo", text: "Ti mostro i progressi ogni settimana: niente sorprese a fine lavoro." },
  { n: "04", title: "Lancio", text: "Messa online, formazione e assistenza anche dopo la consegna." },
];

export function About() {
  return (
    <section aria-labelledby="chi-sono-title" id="chi-sono" className="section">
      <SectionHeading
        id="chi-sono-title"
        index="01"
        eyebrow="chi sono"
        title={
          <>
            Uno sviluppatore, <span className="text-gradient">un referente</span>, zero intermediari.
          </>
        }
        intro={
          <>
            Sono {profile.firstName}, ho {profile.age} anni e scrivo codice su misura: ogni progetto parte da zero,
            costruito attorno a come lavori tu. Parli direttamente con chi sviluppa, quindi decisioni rapide, costi
            trasparenti e un prodotto che conosco riga per riga.
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {services.map((service, i) => (
          <Reveal key={service.id} delay={i * 0.1}>
            <Tilt className="h-full rounded-3xl">
            <motion.article
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="card group relative h-full overflow-hidden p-7"
            >
              <BeamBorder onHover />
              <div className="glow-violet pointer-events-none absolute -top-32 -right-32 size-80 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span
                aria-hidden
                className="text-outline pointer-events-none absolute -right-2 -bottom-6 font-display text-[9rem] leading-none font-extrabold opacity-40 transition-opacity duration-500 group-hover:opacity-80"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl border border-violet/30 bg-violet/10 text-violet-soft transition-colors duration-500 group-hover:border-cyber/50 group-hover:bg-cyber/10 group-hover:text-cyber">
                  <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {serviceIcons[service.id]}
                  </svg>
                </span>
                <p className="font-mono text-xs text-mist">{service.tag}</p>
              </div>
              <h3 className="mt-6 font-display text-3xl font-bold">{service.title}</h3>
              <p className="mt-4 leading-relaxed text-mist">{service.description}</p>
              <ul className="relative mt-6 space-y-2 border-t border-line pt-6 font-mono text-sm">
                {service.outcomes.map((o) => (
                  <li key={o} className="flex gap-3">
                    <span className="text-cyber" aria-hidden>
                      →
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
            </motion.article>
            </Tilt>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-20">
        <h3 className="eyebrow mb-8">come lavoro</h3>
        <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.n} className="group bg-ink p-7 transition-colors hover:bg-coal">
              <span className="font-mono text-sm text-violet-soft transition-colors group-hover:text-cyber">{step.n}</span>
              <p className="mt-4 font-display text-xl font-bold">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-mist">{step.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
