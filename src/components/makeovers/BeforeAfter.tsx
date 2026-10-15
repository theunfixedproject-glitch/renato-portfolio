"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ScaledFrame } from "./ScaledFrame";

type BeforeAfterProps = {
  url: string;
  label: string;
  before: React.ReactNode;
  after: React.ReactNode;
};

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/** Confronto "prima/dopo" con una maniglia da trascinare, anche col dito o con le frecce. */
export function BeforeAfter({ url, label, before, after }: BeforeAfterProps) {
  const area = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const inView = useInView(area, { once: true, amount: 0.5 });

  // La prima volta che compare, la maniglia fa un piccolo giro per far capire che si muove.
  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const controls = animate(50, [50, 78, 22, 50], { duration: 2.2, ease: "easeInOut", onUpdate: setPos });
    return () => controls.stop();
  }, [inView]);

  const fromPointer = (clientX: number) => {
    const r = area.current?.getBoundingClientRect();
    if (r) setPos(clamp(((clientX - r.left) / r.width) * 100));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-coal shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
      <div aria-hidden className="flex items-center gap-3 border-b border-line bg-graphite px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="flex-1 truncate rounded-md bg-ink px-3 py-1 text-center font-mono text-[11px] text-mist">{url}</span>
      </div>

      <div
        ref={area}
        className="relative cursor-ew-resize touch-pan-y select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <div aria-hidden>
          <ScaledFrame>{after}</ScaledFrame>
        </div>
        <div aria-hidden className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <ScaledFrame>{before}</ScaledFrame>
        </div>

        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-0.5 font-mono text-[9px] tracking-widest text-white uppercase backdrop-blur transition-opacity sm:bottom-3 sm:left-3 sm:px-3 sm:py-1 sm:text-xs"
          style={{ opacity: pos > 12 ? 1 : 0 }}
        >
          Prima
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-cyber px-2 py-0.5 font-mono text-[9px] tracking-widest text-ink uppercase transition-opacity sm:right-3 sm:bottom-3 sm:px-3 sm:py-1 sm:text-xs"
          style={{ opacity: pos < 88 ? 1 : 0 }}
        >
          Dopo
        </span>

        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
          <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
          <div
            role="slider"
            tabIndex={0}
            aria-label={`Confronto prima e dopo: ${label}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={pos > 50 ? "Si vede soprattutto il sito prima" : "Si vede soprattutto il sito dopo"}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setPos((p) => clamp(p - 5));
              if (e.key === "ArrowRight") setPos((p) => clamp(p + 5));
              if (e.key === "Home") setPos(0);
              if (e.key === "End") setPos(100);
            }}
            className="pointer-events-auto absolute top-1/2 grid size-9 sm:size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-ink/80 text-white shadow-[0_0_24px_rgba(162,89,255,0.7)] backdrop-blur"
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
