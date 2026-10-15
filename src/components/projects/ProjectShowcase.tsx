"use client";

import Image from "next/image";
import type { Project } from "@/lib/data";
import { Reveal } from "../ui/Reveal";
import { PhoneFrame } from "./PhoneFrame";
import { StatusBadge } from "./StatusBadge";

/** Scheda completa di un progetto: testi, vantaggi, tecnologie e tutte le schermate. */
export function ProjectShowcase({ project, index }: { project: Project; index: number }) {
  const green = project.accent === "green";
  return (
    <article aria-labelledby={`p-${project.id}`} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-center lg:gap-14">
      <Reveal className={index % 2 ? "lg:order-2" : ""}>
        <div className="flex flex-wrap items-center gap-3">
          <p className={`font-mono text-xs ${green ? "text-cyber" : "text-violet-soft"}`}>{project.kind}</p>
          <StatusBadge status={project.status} />
        </div>
        <h2 id={`p-${project.id}`} className="mt-3 font-display text-5xl font-bold md:text-6xl">
          {project.name}
        </h2>
        <p className="mt-4 text-xl leading-relaxed text-snow/90">{project.tagline}</p>
        <p className="mt-4 leading-relaxed text-mist">{project.description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-coal/80 p-5">
            <p className="eyebrow mb-3">cosa dimostra</p>
            <ul className="space-y-2 text-sm">
              {project.benefits.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="text-cyber" aria-hidden>
                    +
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-coal/80 p-5">
            <p className="eyebrow mb-3">tecnologie</p>
            <ul className="flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <li key={s} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-mist">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="min-w-0">
        {project.orientation === "portrait" ? (
          <div className="relative">
            <div
              tabIndex={0}
              aria-label={`Schermate di ${project.name}, scorri di lato`}
              className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0"
            >
              {project.gallery.map((shot, i) => (
                <figure key={shot.src} className="w-[62%] shrink-0 snap-start sm:w-[220px]">
                  <PhoneFrame src={shot.src} alt={shot.alt} sizes="260px" priority={index === 0 && i < 2} />
                  <figcaption className="mt-3 text-xs leading-snug text-mist">{shot.alt.replace(`${project.name}: `, "")}</figcaption>
                </figure>
              ))}
            </div>
            {project.gallery.length > 2 && <p className="mt-2 font-mono text-[11px] text-mist">← scorri per vedere tutte le schermate →</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {project.gallery.map((shot) => (
              <figure key={shot.src}>
                <div className="overflow-hidden rounded-2xl border border-line bg-coal shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
                  <div className="relative aspect-[2412/1080]">
                    <Image src={shot.src} alt={shot.alt} fill sizes="(min-width: 1024px) 680px, 100vw" className="object-cover" />
                  </div>
                </div>
                <figcaption className="mt-3 text-xs text-mist">{shot.alt.replace(`${project.name}: `, "")}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </Reveal>
    </article>
  );
}
