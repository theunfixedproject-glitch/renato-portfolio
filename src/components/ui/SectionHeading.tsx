"use client";

import { motion } from "framer-motion";

type SectionHeadingProps = {
  id: string;
  /** Numero della sezione, es. "01". */
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
};

const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-80px" } as const;

export function SectionHeading({ id, index, eyebrow, title, intro }: SectionHeadingProps) {
  return (
    <div className="mb-14 max-w-3xl md:mb-20">
      <motion.p
        className="eyebrow mb-6 flex items-center gap-3"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6 } } }}
      >
        <span className="text-snow">{index}</span>
        <motion.span
          aria-hidden
          className="block h-px w-12 shrink-0 origin-left bg-gradient-to-r from-cyber to-violet"
          variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.9, delay: 0.1, ease } } }}
        />
        {eyebrow}
      </motion.p>
      <div className="overflow-hidden pb-2">
        <motion.h2
          id={id}
          className="heading"
          initial={{ y: "60%", opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.9, delay: 0.1, ease }}
        >
          {title}
        </motion.h2>
      </div>
      {intro && (
        <motion.p
          className="mt-6 max-w-2xl text-lg leading-relaxed text-mist"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.8, delay: 0.25, ease }}
        >
          {intro}
        </motion.p>
      )}
    </div>
  );
}
