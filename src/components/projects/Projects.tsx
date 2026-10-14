"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { projects, type Project, type ProjectStatus } from "@/lib/data";
import { ArrowIcon } from "../ui/Icons";
import { SectionHeading } from "../ui/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";

type Filter = "tutti" | ProjectStatus;

const filters: { id: Filter; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "in-sviluppo", label: "In sviluppo" },
  { id: "concluso", label: "Conclusi" },
];

export function Projects() {
  const [filter, setFilter] = useState<Filter>("tutti");
  const [open, setOpen] = useState<Project | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const visible = projects.filter((p) => filter === "tutti" || p.status === filter);
  const count = (f: Filter) => projects.filter((p) => f === "tutti" || p.status === f).length;

  return (
    <section aria-labelledby="progetti-title" id="progetti" className="section">
      <SectionHeading
        id="progetti-title"
        eyebrow="// lavori personali"
        title={
          <>
            Prodotti veri, <span className="text-gradient">costruiti da zero.</span>
          </>
        }
        intro="App e giochi che progetto e sviluppo in autonomia, dall'idea al telefono. Sono la prova pratica di quello che posso costruire per la tua attività."
      />

      <LayoutGroup>
        <div role="group" aria-label="Filtra i progetti" className="mb-8 inline-flex rounded-full border border-line bg-coal p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className="relative rounded-full px-4 py-2 font-mono text-xs transition-colors aria-pressed:text-ink sm:px-5"
            >
              {filter === f.id && (
                <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-cyber" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative">
                {f.label} <span className="opacity-60">{count(f.id)}</span>
              </span>
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-flow-dense grid-cols-1 gap-5 md:grid-cols-6 md:auto-rows-[290px]">
          <AnimatePresence mode="popLayout">
            {visible.slice(0, 2).map((project) => (
              <ProjectCard key={project.id} project={project} onOpen={setOpen} />
            ))}
            {filter === "concluso" && visible.length === 0 && (
              <motion.div
                key="empty"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid place-items-center rounded-3xl border border-dashed border-line p-10 text-center md:col-span-4"
              >
                <div>
                  <p className="font-mono text-xs text-cyber">case study in arrivo</p>
                  <p className="mt-3 font-display text-2xl font-bold">I lavori conclusi arrivano qui a breve.</p>
                  <p className="mt-2 text-mist">Nel frattempo dai un&apos;occhiata ai progetti in sviluppo.</p>
                </div>
              </motion.div>
            )}
            <motion.a
              key="cta"
              layout
              href="#preventivo"
              whileHover={{ scale: 1.02 }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-violet p-7 text-ink md:col-span-2"
            >
              <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-cyber/60 blur-2xl transition-transform duration-700 group-hover:scale-150" />
              <p className="relative font-mono text-xs">il prossimo progetto</p>
              <div className="relative">
                <p className="font-display text-3xl leading-tight font-bold">Potrebbe essere il tuo.</p>
                <p className="mt-3 inline-flex items-center gap-2 font-mono text-sm">
                  Calcola una stima in 30 secondi
                  <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </p>
              </div>
            </motion.a>
            {visible.slice(2).map((project) => (
              <ProjectCard key={project.id} project={project} onOpen={setOpen} />
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      <ProjectModal project={open} onClose={close} />
    </section>
  );
}
