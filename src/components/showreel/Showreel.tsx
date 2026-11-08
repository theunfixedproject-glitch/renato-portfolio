"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Il film di 15 secondi: un volo sopra questo sito, dalla mattina alla notte.
 * Parte da solo e senza audio quando entra nello schermo; il suono si accende a richiesta.
 */
export function Showreel() {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !still) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };
  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <section aria-labelledby="showreel-title" id="showreel" className="section !pt-4">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">il mio lavoro in 15 secondi</p>
          <h2 id="showreel-title" className="mt-3 font-display text-3xl leading-tight font-bold md:text-4xl">
            Una giornata sopra questo sito. <span className="text-gradient">Fatta solo di codice.</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-mist">
          Animazione, luce e musica sono scritte a mano in codice: nessun programma di montaggio.
        </p>
      </div>

      <figure className="relative overflow-hidden rounded-[2rem] border border-line bg-ink">
        <video
          ref={video}
          className="block aspect-[5/4] w-full object-cover"
          src="/video/showreel.mp4"
          poster="/video/showreel-poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label="Video: la camera vola sopra il sito di Renato Manzotti, dalla mattina alla notte, e chiude con la frase: Siti, app e bot che lavorano per te, anche quando dormi."
        />
        <figcaption className="absolute right-4 bottom-4 left-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Metti in pausa il video" : "Riproduci il video"}
            className="grid size-11 place-items-center rounded-full border border-white/15 bg-ink/70 text-snow backdrop-blur transition-colors hover:border-cyber"
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
              {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={!muted}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-ink/70 px-4 font-mono text-xs text-snow backdrop-blur transition-colors hover:border-cyber"
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 10v4h4l5 4V6l-5 4z" />
              {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
            </svg>
            {muted ? "Attiva l'audio" : "Togli l'audio"}
          </button>
        </figcaption>
      </figure>
    </section>
  );
}
