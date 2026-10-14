"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Project } from "@/lib/data";
import { CloseIcon } from "../ui/Icons";
import { StatusBadge } from "./ProjectCard";
import { PhoneFrame } from "./PhoneFrame";

type ProjectModalProps = {
  project: Project | null;
  onClose: () => void;
};

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Tiene il focus dentro la finestra mentre è aperta.
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button, a[href], [tabindex='0']");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/80 backdrop-blur-md sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92svh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-line bg-coal sm:rounded-3xl"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="sticky top-4 z-10 float-right mr-4 grid size-10 place-items-center rounded-full border border-line bg-ink/80 backdrop-blur transition-colors hover:border-cyber hover:text-cyber"
            >
              <CloseIcon />
            </button>

            <div className="p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-xs text-cyber">{project.kind}</p>
                <StatusBadge status={project.status} />
              </div>
              <h3 id="project-modal-title" className="mt-3 font-display text-5xl font-bold md:text-6xl">
                {project.name}
              </h3>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mist">{project.description}</p>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-ink/60 p-5">
                  <p className="eyebrow mb-3">Cosa porta a un cliente</p>
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
                <div className="rounded-2xl border border-line bg-ink/60 p-5">
                  <p className="eyebrow mb-3">Tecnologie</p>
                  <ul className="flex flex-wrap gap-2">
                    {project.stack.map((s) => (
                      <li key={s} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-mist">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div
              tabIndex={0}
              aria-label={`Schermate di ${project.name}`}
              className="flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto px-6 pb-10 md:scroll-px-10 md:px-10"
            >
              {project.gallery.map((shot, i) =>
                project.orientation === "portrait" ? (
                  <PhoneFrame
                    key={shot.src}
                    src={shot.src}
                    alt={shot.alt}
                    sizes="240px"
                    priority={i < 3}
                    className="w-[200px] shrink-0 snap-start md:w-[240px]"
                  />
                ) : (
                  <div key={shot.src} className="relative aspect-[2412/1080] w-full shrink-0 snap-start overflow-hidden rounded-2xl border border-line">
                    <Image src={shot.src} alt={shot.alt} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
                  </div>
                ),
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
