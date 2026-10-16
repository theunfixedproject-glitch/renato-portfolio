"use client";

import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/data";
import { categoryPreviews, categorySummary } from "@/lib/work";
import { ArrowIcon } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { Tilt } from "../ui/Tilt";
import { CategoryIcon } from "./CategoryIcon";
import { BeamBorder } from "../ui/BeamBorder";

/** Sezione della home: un unico grande pulsante che apre la pagina con tutti i lavori. */
export function WorkCategories() {
  const shots = ["/img/projects/rivvo-home.webp", "/img/projects/distretto-centrale.webp", "/img/projects/ritmo.webp"];
  return (
    <section aria-labelledby="lavori-title" id="lavori" className="section">
      <Reveal>
        <Tilt max={3} className="rounded-[2rem]">
        <Link
          href="/lavori"
          className="group relative grid overflow-hidden rounded-[2rem] border border-violet/20 bg-gradient-to-br from-violet/15 via-coal to-coal p-7 md:grid-cols-[1.3fr_1fr] md:p-12"
        >
          <BeamBorder />
          <div aria-hidden className="glow-violet pointer-events-none absolute -top-48 -left-48 size-[36rem]" />
          <div className="relative">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-snow">03</span>
              <span aria-hidden className="block h-px w-12 bg-gradient-to-r from-cyber to-violet" />
              lavori personali
            </p>
            <h2 id="lavori-title" className="heading mt-6">
              Scopri i miei <span className="text-gradient">lavori personali.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
              App, giochi, siti e automazioni che progetto e sviluppo da zero. Scegli da dove cominciare.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1.5 font-mono text-xs text-mist">
                  <CategoryIcon id={c.id} size={14} />
                  {c.label}
                </li>
              ))}
            </ul>
            <span className="shine mt-10 inline-flex items-center gap-3 rounded-full bg-violet px-7 py-4 font-mono text-sm font-medium text-ink shadow-[0_0_40px_-8px_var(--color-violet)] transition-shadow group-hover:shadow-[0_0_60px_-4px_var(--color-violet)]">
              Apri i lavori
              <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </span>
          </div>

          <div aria-hidden className="relative mt-12 h-64 md:mt-0 md:h-auto">
            {shots.map((src, i) => (
              <div
                key={src}
                style={{ zIndex: i === 1 ? 3 : 1 }}
                className={`absolute top-1/2 left-1/2 aspect-[9/19] w-28 -translate-y-1/2 overflow-hidden rounded-2xl border-4 border-[#1c1c24] shadow-2xl transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] md:w-36 ${
                  ["-translate-x-[120%] -rotate-12 group-hover:-translate-x-[135%] group-hover:-rotate-[16deg]", "-translate-x-1/2 group-hover:-translate-y-[56%]", "translate-x-[20%] rotate-12 group-hover:translate-x-[35%] group-hover:rotate-[16deg]"][i]
                }`}
              >
                <Image src={src} alt="" fill sizes="150px" className="object-cover object-top" />
              </div>
            ))}
          </div>
        </Link>
        </Tilt>
      </Reveal>
    </section>
  );
}

export function CategoryGrid({ current }: { current?: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categories.map((cat, i) => {
        const summary = categorySummary(cat.id);
        const previews = categoryPreviews(cat.id);
        const isCurrent = current === cat.id;
        const green = cat.accent === "green";
        return (
          <Reveal key={cat.id} delay={i * 0.06}>
            <Tilt className="h-full rounded-3xl">
            <Link
              href={`/lavori/${cat.id}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-colors md:min-h-[260px] md:p-8 ${
                isCurrent ? "border-cyber/60 bg-cyber/[0.06]" : "border-line bg-coal/80 hover:bg-coal"
              }`}
            >
              <BeamBorder onHover />
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-32 -right-32 size-96 transition-opacity duration-500 ${
                  green ? "glow-green" : "glow-violet"
                } opacity-50 group-hover:opacity-100`}
              />

              {previews.length > 0 && (
                <div aria-hidden className="pointer-events-none absolute -right-4 -bottom-16 hidden gap-3 sm:flex md:-bottom-10">
                  {previews.map((src, j) => (
                    <div
                      key={src}
                      className={`relative w-20 overflow-hidden rounded-xl border-4 border-[#1c1c24] shadow-xl transition-transform duration-500 md:w-24 ${
                        j === 0 ? "rotate-[-8deg] group-hover:-translate-y-4" : "rotate-[6deg] group-hover:-translate-y-6"
                      } ${src.includes("vicarius") ? "aspect-[16/10] w-36 md:w-44" : "aspect-[9/19]"}`}
                    >
                      <Image src={src} alt="" fill sizes="180px" className="object-cover object-top" />
                    </div>
                  ))}
                </div>
              )}

              <div className="relative flex items-start justify-between gap-4">
                <span
                  className={`grid size-14 place-items-center rounded-2xl border transition-colors duration-500 ${
                    green ? "border-cyber/30 bg-cyber/10 text-cyber" : "border-violet/30 bg-violet/10 text-violet-soft"
                  }`}
                >
                  <CategoryIcon id={cat.id} />
                </span>
                <span className="rounded-full border border-line bg-ink/60 px-3 py-1 font-mono text-[11px] text-mist backdrop-blur">
                  {summary.label}
                </span>
              </div>

              <div className="relative mt-8 sm:mt-10 sm:max-w-[70%]">
                <p className="font-mono text-xs text-mist">{cat.tagline}</p>
                <p className="mt-2 font-display text-3xl font-bold md:text-4xl">{cat.label}</p>
                <p className="mt-4 inline-flex items-center gap-2 font-mono text-sm text-snow">
                  {isCurrent ? "Stai guardando questa" : "Apri la categoria"}
                  <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </p>
              </div>
            </Link>
            </Tilt>
          </Reveal>
        );
      })}
    </div>
  );
}
