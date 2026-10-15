"use client";

import { useEffect, useRef, useState } from "react";

export const FRAME_W = 1280;
export const FRAME_H = 800;

/** Mostra un contenuto disegnato a 1280×800 rimpicciolendolo alla larghezza disponibile. */
export function ScaledFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / FRAME_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}` }}>
      <div
        className="absolute top-0 left-0 origin-top-left transition-opacity duration-300"
        style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale ?? 0})`, opacity: scale ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}
