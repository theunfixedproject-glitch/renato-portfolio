"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

type MagneticButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "whatsapp";
  external?: boolean;
  className?: string;
};

const styles = {
  primary:
    "bg-violet text-ink shadow-[0_0_40px_-8px_var(--color-violet)] hover:shadow-[0_0_60px_-4px_var(--color-violet)]",
  ghost: "border border-line bg-white/[0.03] text-snow backdrop-blur hover:border-cyber/60 hover:text-cyber",
  // Il verde di WhatsApp: riconoscibile a colpo d'occhio anche da chi non è pratico.
  whatsapp:
    "bg-whatsapp text-ink text-base font-semibold shadow-[0_0_40px_-8px_var(--color-whatsapp)] hover:shadow-[0_0_60px_-4px_var(--color-whatsapp)]",
};

/** Link a forma di bottone che viene "attirato" dal cursore. */
export function MagneticButton({ href, children, variant = "primary", external, className = "" }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.4);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      className={`shine inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 font-mono text-sm font-medium transition-[box-shadow,border-color,color] duration-300 ${styles[variant]} ${className}`}
    >
      {children}
    </motion.a>
  );
}
