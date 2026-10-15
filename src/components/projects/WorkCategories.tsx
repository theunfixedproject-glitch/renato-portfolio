"use client";

import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/data";
import { categoryPreviews, categorySummary } from "@/lib/work";
import { ArrowIcon } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { CategoryIcon } from "./CategoryIcon";

/** Sezione della home: il portfolio diviso in quattro porte d'ingresso. */
export function WorkCategories() {
  return (
    <section aria-labelledby="lavori-title" id="lavori" className="section">
      <SectionHeading
        id="lavori-title"
        index="02"
        eyebrow="lavori personali"
        title={
          <>
            Scopri i miei <span className="text-gradient">lavori personali.</span>
          </>
        }
        intro="App, giochi, siti e automazioni che progetto e sviluppo da zero. Scegli da dove cominciare."
      />
      <CategoryGrid />
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
            <Link
              href={`/lavori/${cat.id}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`beam-hover group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-colors md:min-h-[260px] md:p-8 ${
                isCurrent ? "border-cyber/60 bg-cyber/[0.06]" : "border-line bg-coal/80 hover:bg-coal"
              }`}
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl transition-opacity duration-500 ${
                  green ? "bg-cyber/15" : "bg-violet/20"
                } opacity-40 group-hover:opacity-100`}
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
          </Reveal>
        );
      })}
    </div>
  );
}
