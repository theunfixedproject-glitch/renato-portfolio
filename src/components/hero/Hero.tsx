"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef } from "react";
import { profile } from "@/lib/data";
import { ArrowIcon, WhatsAppIcon } from "../ui/Icons";
import { MagneticButton } from "../ui/MagneticButton";

const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });

const headline = ["Siti,", "app", "e", "bot", "che", "lavorano", "per", "te."];
const highlight = new Set(["lavorano"]);

const proofs = ["Preventivo gratuito", "Risposta entro 24h", "Zero template: tutto su misura"];

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={section} id="top" aria-labelledby="hero-title" className="relative isolate min-h-svh overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <ParticleField eventSource={section} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,var(--color-ink)_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
      </div>

      <div className="mx-auto grid min-h-svh max-w-7xl items-center gap-12 px-5 pt-28 pb-16 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
        {/* Sfuma solo il testo: la foto, che su mobile arriva dopo, resta sempre ben visibile. */}
        <motion.div style={{ opacity: fade }}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-coal/70 px-4 py-2 font-mono text-xs text-mist backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyber opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-cyber" />
            </span>
            {profile.name} · Web &amp; App Developer
          </motion.p>

          <h1 id="hero-title" className="font-display text-[clamp(2.7rem,7vw,5.6rem)] leading-[0.95] font-extrabold tracking-tight">
            {headline.map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
                <motion.span
                  className={`mr-[0.22em] inline-block ${highlight.has(word) ? "text-gradient" : ""}`}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-mist md:text-xl"
          >
            Aiuto <strong className="font-semibold text-snow">aziende e professionisti</strong> a trovare clienti online e a
            risparmiare tempo: siti veloci che si fanno trovare su Google, app su misura e bot che rispondono al posto
            tuo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.7 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <MagneticButton href="#preventivo">
              Calcola il preventivo <ArrowIcon width={16} height={16} />
            </MagneticButton>
            <MagneticButton href={profile.whatsappHref} external variant="whatsapp">
              <WhatsAppIcon width={22} height={22} strokeWidth={2.2} /> Scrivimi su WhatsApp
            </MagneticButton>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-mist"
          >
            {proofs.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="text-cyber" aria-hidden>
                  ✓
                </span>
                {p}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          style={{ y: photoY }}
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-violet/40 via-transparent to-cyber/30 blur-3xl" />
          <div className="group relative overflow-hidden rounded-[2rem] border border-line bg-coal p-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem]">
              <Image
                src={profile.photo}
                alt={`${profile.name} alla sua postazione di lavoro`}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="neon-green font-display text-3xl font-bold">{profile.firstName}</p>
                <p className="neon-violet mt-1 font-mono text-xs leading-relaxed">
                  {profile.age} anni · sviluppo su misura dal primo pixel all&apos;ultima riga
                </p>
              </div>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 -left-4 rounded-2xl border border-line bg-ink/80 px-4 py-3 font-mono text-xs backdrop-blur sm:-left-10"
          >
            <span className="text-mist">lighthouse</span> <span className="text-cyber">100</span>
            <span className="text-mist">/100</span>
          </motion.div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-3 bottom-24 rounded-2xl border border-violet/40 bg-ink/80 px-4 py-3 font-mono text-xs backdrop-blur sm:-right-8"
          >
            <span className="text-violet-soft">{"<"}</span>su misura<span className="text-violet-soft">{" />"}</span>
          </motion.div>
        </motion.div>
      </div>

      <a
        href="#chi-sono"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-mist uppercase md:flex"
      >
        Scorri
        <span className="h-10 w-px overflow-hidden bg-line">
          <motion.span
            className="block h-4 w-px bg-cyber"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </a>
    </section>
  );
}
