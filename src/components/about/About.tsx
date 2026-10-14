"use client";

import { motion } from "framer-motion";
import { profile, services } from "@/lib/data";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

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
        eyebrow="// chi sono"
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
            <motion.article
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="card group relative h-full overflow-hidden p-7"
            >
              <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-violet/0 blur-3xl transition-colors duration-500 group-hover:bg-violet/30" />
              <p className="font-mono text-xs text-mist">{service.tag}</p>
              <h3 className="mt-6 font-display text-3xl font-bold">{service.title}</h3>
              <p className="mt-4 leading-relaxed text-mist">{service.description}</p>
              <ul className="mt-6 space-y-2 border-t border-line pt-6 font-mono text-sm">
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
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-20">
        <h3 className="eyebrow mb-8">// come lavoro</h3>
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
