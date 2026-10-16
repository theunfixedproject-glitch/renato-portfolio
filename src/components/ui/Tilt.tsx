"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

type TiltProps = {
  children: React.ReactNode;
  className?: string;
  /** Inclinazione massima in gradi. */
  max?: number;
};

/**
 * Inclina il contenuto in 3D seguendo il mouse, con un riflesso di luce.
 * Solo col mouse: col dito non fa nulla, così non disturba lo scroll.
 */
export function Tilt({ children, className = "", max = 7 }: TiltProps) {
  const rx = useSpring(0, { stiffness: 180, damping: 18 });
  const ry = useSpring(0, { stiffness: 180, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 25 });
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.14), transparent 55%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
    glareOpacity.set(1);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100, transformStyle: "preserve-3d" }}
      className={`relative ${className}`}
    >
      {children}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]" style={{ background: glare, opacity: glareOpacity }} />
    </motion.div>
  );
}
