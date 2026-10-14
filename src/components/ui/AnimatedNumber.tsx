"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

type AnimatedNumberProps = {
  value: number;
  format?: (n: number) => string;
  /** Se true parte da 0 e conta solo quando il numero entra nello schermo. */
  startOnView?: boolean;
  duration?: number;
  className?: string;
};

const defaultFormat = (n: number) => String(Math.round(n));

/**
 * Numero che scorre fino al valore indicato. Il testo iniziale è reso dal server,
 * poi viene aggiornato direttamente nel DOM per non ri-renderizzare a ogni frame.
 */
export function AnimatedNumber({ value, format = defaultFormat, startOnView, duration = 0.8, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const current = useRef(startOnView ? 0 : value);
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    if (startOnView && !inView) return;
    const controls = animate(current.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => {
        current.current = n;
        if (ref.current) ref.current.textContent = formatRef.current(n);
      },
    });
    return () => controls.stop();
  }, [value, inView, startOnView, duration]);

  return (
    <span ref={ref} className={className}>
      {format(startOnView ? 0 : value)}
    </span>
  );
}
