"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import type { Project } from "@/lib/data";
import { ArrowIcon } from "../ui/Icons";
import { PhoneFrame } from "./PhoneFrame";

const accent = {
  violet: { glow: "rgba(162,89,255,0.28)", text: "text-violet-soft", bg: "from-violet/25" },
  green: { glow: "rgba(61,255,154,0.2)", text: "text-cyber", bg: "from-cyber/20" },
};

type ProjectCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
};

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const a = accent[project.accent];
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, ${a.glow}, transparent 70%)`;

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    mx.set(x);
    my.set(y);
    if (e.pointerType === "mouse") {
      ry.set((x / r.width - 0.5) * 6);
      rx.set(-(y / r.height - 0.5) * 6);
    }
  };
  const onLeave = () => {
    mx.set(-200);
    my.set(-200);
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`beam-hover group relative isolate flex flex-col overflow-hidden rounded-3xl border border-line bg-coal md:block ${project.span}`}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20" style={{ background: spotlight }} />
      <div aria-hidden className={`absolute inset-0 -z-10 bg-gradient-to-br ${a.bg} via-transparent to-transparent`} />

      <ProjectVisual project={project} />

      <div
        className={`relative z-10 flex flex-col gap-5 p-6 md:h-full md:p-7 ${
          project.visual === "bottom" ? "md:justify-start" : "md:justify-between"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`font-mono text-xs ${a.text}`}>{project.kind}</p>
            <h3 className="mt-2 font-display text-3xl font-bold md:text-4xl">{project.name}</h3>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className={textWidth[project.visual]}>
          <p className="text-sm leading-relaxed text-snow/85">{project.tagline}</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Vantaggi">
            {project.benefits.slice(0, project.visual === "peek" ? 2 : 3).map((b, i) => (
              <li
                key={b}
                style={{ transitionDelay: `${i * 60}ms` }}
                className="rounded-full border border-line bg-ink/70 px-3 py-1 font-mono text-[11px] text-snow backdrop-blur transition-all duration-500 md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100"
              >
                <span className="text-cyber" aria-hidden>
                  +{" "}
                </span>
                {b}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onOpen(project)}
            className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-snow after:absolute after:inset-0 after:z-30 after:content-['']"
            aria-haspopup="dialog"
          >
            Scopri {project.name}
            <ArrowIcon width={14} height={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

const textWidth: Record<Project["visual"], string> = {
  side: "md:max-w-[48%]",
  peek: "md:max-w-[55%]",
  bottom: "",
  cover: "md:max-w-[55%]",
};

/** Dove stanno gli screenshot: su mobile sempre sotto al testo, da tablet in su dipende dalla card. */
const visualBox: Record<Exclude<Project["visual"], "cover">, string> = {
  side: "md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[55%]",
  bottom: "md:absolute md:inset-x-0 md:bottom-0 md:h-[40%]",
  peek: "md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[42%]",
};

const phoneBox: Record<Exclude<Project["visual"], "cover">, string> = {
  side: "md:top-[12%] md:h-[80%]",
  bottom: "md:top-[6%] md:h-[170%]",
  peek: "md:top-[30%] md:h-[115%]",
};

function ProjectVisual({ project }: { project: Project }) {
  if (project.visual === "cover") {
    return (
      <div aria-hidden className="relative order-last h-52 md:absolute md:inset-0 md:-z-10 md:h-auto">
        <Image
          src={project.cover}
          alt=""
          fill
          sizes="(min-width: 768px) 66vw, 100vw"
          className="object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-coal via-transparent to-transparent md:bg-gradient-to-r md:from-coal md:via-coal/70" />
      </div>
    );
  }

  const visual = project.visual;
  const shots = project.gallery.slice(0, visual === "peek" ? 1 : 3);
  return (
    <div aria-hidden className={`pointer-events-none relative order-last -z-10 h-64 ${visualBox[visual]}`}>
      {shots.map((shot, i) => {
        const fromCenter = i - (shots.length - 1) / 2;
        return (
          <div
            key={shot.src}
            style={{
              zIndex: 10 - Math.abs(fromCenter),
              ["--i" as string]: fromCenter,
              ["--r0" as string]: `${shots.length === 1 ? 6 : fromCenter * 7}deg`,
            }}
            className={`absolute top-4 left-1/2 aspect-[9/20] h-[130%] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] [--r:var(--r0)] [--x:calc(var(--i)*32%)] [--y:0%] [transform:translate(calc(-50%_+_var(--x)),var(--y))_rotate(var(--r))] group-hover:[--x:calc(var(--i)*70%)] group-hover:[--r:calc(var(--r0)*1.3)] group-hover:[--y:-8%] ${phoneBox[visual]}`}
          >
            <PhoneFrame src={shot.src} alt="" sizes="(min-width: 768px) 16vw, 40vw" className="h-full" />
          </div>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }: { status: Project["status"] }) {
  const done = status === "online";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] backdrop-blur ${
        done ? "border-cyber/40 bg-cyber/10 text-cyber" : "border-violet/40 bg-violet/10 text-violet-soft"
      }`}
    >
      <span className={`size-1.5 rounded-full ${done ? "bg-cyber" : "animate-pulse bg-violet"}`} aria-hidden />
      {done ? "Online" : "In sviluppo"}
    </span>
  );
}
