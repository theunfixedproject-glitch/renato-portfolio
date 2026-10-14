"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Sfondo di tutta la pagina: due macchie di luce (viola e verde) che si muovono piano
 * e, su computer, un alone che segue il cursore.
 */
export function Ambient() {
  const x = useSpring(useMotionValue(-1000), { stiffness: 120, damping: 25, mass: 0.6 });
  const y = useSpring(useMotionValue(-1000), { stiffness: 120, damping: 25, mass: 0.6 });
  const glow = useMotionTemplate`radial-gradient(520px circle at ${x}px ${y}px, rgba(162, 89, 255, 0.10), transparent 70%)`;
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setFinePointer(mq.matches);
    if (!mq.matches) return;
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-1/4 -left-1/4 size-[70vmax] rounded-full bg-violet/[0.07] blur-[120px] [animation:aurora-a_28s_ease-in-out_infinite]" />
      <div className="absolute -right-1/4 -bottom-1/4 size-[60vmax] rounded-full bg-cyber/[0.05] blur-[120px] [animation:aurora-b_34s_ease-in-out_infinite]" />
      {finePointer && <motion.div className="absolute inset-0" style={{ background: glow }} />}
    </div>
  );
}
