"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "../ui/AnimatedNumber";

const R = 46;

export function LighthouseGauge({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <figure className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-36">
        {/* Alone dietro al cerchio: sta fuori dall'SVG, così non viene tagliato ai bordi. */}
        <div aria-hidden className="absolute inset-[12%] rounded-full bg-cyber/15 blur-xl" />
        <svg viewBox="0 0 120 120" overflow="visible" className="relative size-full -rotate-90 overflow-visible" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-line)" strokeWidth="5" />
          <motion.circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--color-cyber)"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: value / 100, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.8, delay, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: "drop-shadow(0 0 4px var(--color-cyber))" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-3xl font-bold text-cyber sm:text-4xl">
          <AnimatedNumber value={value} startOnView duration={1.8} />
        </span>
      </div>
      <figcaption className="flex min-h-[2.5em] items-start justify-center text-center font-mono text-[11px] leading-tight tracking-wider text-mist uppercase sm:text-xs">
        <span>
          {label}
          <span className="sr-only">: {value} su 100</span>
        </span>
      </figcaption>
    </figure>
  );
}
