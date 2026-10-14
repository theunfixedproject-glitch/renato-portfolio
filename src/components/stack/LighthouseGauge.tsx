"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "../ui/AnimatedNumber";

const R = 52;
const C = 2 * Math.PI * R;

export function LighthouseGauge({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <figure className="flex flex-col items-center gap-4">
      <div className="relative size-36">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-line)" strokeWidth="6" />
          <motion.circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--color-cyber)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            whileInView={{ strokeDashoffset: C * (1 - value / 100) }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.8, delay, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: "drop-shadow(0 0 6px var(--color-cyber))" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-4xl font-bold text-cyber">
          <AnimatedNumber value={value} startOnView duration={1.8} />
        </span>
      </div>
      <figcaption className="font-mono text-xs tracking-wider text-mist uppercase">
        {label} <span className="sr-only">: {value} su 100</span>
      </figcaption>
    </figure>
  );
}
