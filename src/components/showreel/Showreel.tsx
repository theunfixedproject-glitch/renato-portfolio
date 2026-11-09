"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "../ui/Icons";

/** I film di graphic motion: fatti interamente in codice, anche la musica. */
const FILMS = [
  {
    id: "dentro-il-cursore",
    title: "Dentro il cursore",
    length: "20 s",
    text: "Uno zoom che non si ferma mai: ogni scena è nascosta in un dettaglio della precedente.",
    src: "/video/dentro-il-cursore.mp4",
    poster: "/video/dentro-il-cursore-poster.jpg",
    aspect: "16/9",
    label: "Video: un cursore lampeggiante, poi parole, forme, un telefono in 3D, i punteggi di Lighthouse e la rete del preventivatore, fino al nome Renato Manzotti.",
  },
  {
    id: "la-linea",
    title: "La linea",
    length: "15 s",
    text: "Una sola linea che non si stacca mai, dalla prima parola alla firma.",
    src: "/video/la-linea.mp4",
    poster: "/video/la-linea-poster.jpg",
    aspect: "9/16",
    label: "Video verticale: una penna scrive una sola linea in tre righe, poi AI, bot, app, sito; disegna un sito, un nodo, un telefono, una chat, una spirale e un grafico, e firma Renato Manzotti, siti, app e bot su misura.",
  },
  {
    id: "una-giornata",
    title: "Una giornata",
    length: "15 s",
    text: "Un volo sopra questo sito, dalla mattina alla notte.",
    src: "/video/showreel.mp4",
    poster: "/video/showreel-poster.jpg",
    aspect: "5/4",
    label: "Video: la camera vola sopra il sito di Renato Manzotti, dalla mattina alla notte, e chiude con la frase: Siti, app e bot che lavorano per te, anche quando dormi.",
  },
] as const;

/**
 * Parte da solo e senza audio quando entra nello schermo, si ferma quando esce.
 * Il suono si accende a richiesta; chi preferisce meno movimento vede solo la copertina.
 */
export function Showreel() {
  const video = useRef<HTMLVideoElement>(null);
  const mutedRef = useRef(true);
  const [film, setFilm] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const current = FILMS[film];

  // a ogni film il video è un elemento nuovo: riparte dall'inizio, con lo stesso stato dell'audio
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = mutedRef.current;
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
  }, [film]);

  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    mutedRef.current = v.muted;
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
          <p className="eyebrow">graphic motion · fatte in codice</p>
          <h2 id="showreel-title" className="mt-3 max-w-3xl font-display text-3xl leading-tight font-bold md:text-4xl">
            Film brevi per presentarti, <span className="text-gradient">scritti riga per riga.</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-mist">
          Animazione, luce e musica sono scritte a mano in codice: nessun programma di montaggio, nessun modello già pronto.
        </p>
      </div>

      <div role="tablist" aria-label="Scegli il film" className="mb-5 grid gap-3 sm:grid-cols-3">
        {FILMS.map((f, i) => {
          const on = i === film;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="showreel-video"
              onClick={() => setFilm(i)}
              className={`flex min-h-16 items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                on ? "border-cyber bg-cyber/10" : "border-line bg-coal/70 hover:border-violet/60"
              }`}
            >
              <span className={`mt-1 size-2.5 shrink-0 rounded-full ${on ? "bg-cyber" : "bg-line"}`} aria-hidden />
              <span>
                <span className="block font-display text-lg leading-tight font-bold">
                  {f.title} <span className="font-mono text-xs font-normal text-mist">· {f.length}</span>
                </span>
                <span className="mt-1 block text-sm leading-snug text-mist">{f.text}</span>
              </span>
            </button>
          );
        })}
      </div>

      <figure
        id="showreel-video"
        className={`relative overflow-hidden rounded-[2rem] border border-line bg-ink ${current.aspect === "9/16" ? "mx-auto max-w-[24rem]" : ""}`}
      >
        <video
          key={current.id}
          ref={video}
          className="block w-full object-cover"
          style={{ aspectRatio: current.aspect }}
          src={current.src}
          poster={current.poster}
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={current.label}
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

      <Link
        href="/lavori/graphic-motion"
        className="mt-5 inline-flex items-center gap-2 font-mono text-sm text-cyber transition-colors hover:text-snow"
      >
        Come sono fatti, nei lavori personali
        <ArrowIcon width={16} height={16} />
      </Link>
    </section>
  );
}
