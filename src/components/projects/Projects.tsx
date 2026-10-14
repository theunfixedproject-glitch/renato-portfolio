"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { projects, type Project } from "@/lib/data";
import { ArrowIcon } from "../ui/Icons";
import { SectionHeading } from "../ui/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";

export function Projects() {
  const [open, setOpen] = useState<Project | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section aria-labelledby="progetti-title" id="progetti" className="section">
      <SectionHeading
        id="progetti-title"
        index="02"
        eyebrow="lavori personali"
        title={
          <>
            Prodotti veri, <span className="text-gradient">costruiti da zero.</span>
          </>
        }
        intro="App e giochi che progetto e sviluppo in autonomia, dall'idea al telefono. Sono la prova pratica di quello che posso costruire per la tua attività."
      />

      <div className="grid grid-flow-dense grid-cols-1 gap-5 md:grid-cols-6 md:auto-rows-[290px]">
        {projects.slice(0, 2).map((project) => (
          <ProjectCard key={project.id} project={project} onOpen={setOpen} />
        ))}
        <motion.a
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
        {projects.slice(2).map((project) => (
          <ProjectCard key={project.id} project={project} onOpen={setOpen} />
        ))}
      </div>

      <ProjectModal project={open} onClose={close} />
    </section>
  );
}
