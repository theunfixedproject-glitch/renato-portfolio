"use client";

import { MotionConfig } from "framer-motion";

/** Rispetta "riduci movimento" del sistema operativo in tutte le animazioni Framer Motion. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
