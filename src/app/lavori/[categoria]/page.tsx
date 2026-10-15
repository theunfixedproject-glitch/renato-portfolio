import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MakeoverCta, MakeoverList } from "@/components/makeovers/Makeovers";
import { CategoryIcon } from "@/components/projects/CategoryIcon";
import { CategorySwitcher } from "@/components/projects/CategorySwitcher";
import { BackButton } from "@/components/ui/BackButton";
import { ProjectShowcase } from "@/components/projects/ProjectShowcase";
import { categories, profile, projects } from "@/lib/data";
import { categorySummary, getCategory } from "@/lib/work";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const cat = getCategory((await params).categoria);
  if (!cat) return {};
  return { title: `${cat.label} · Lavori di Renato Manzotti`, description: cat.description };
}

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const cat = getCategory((await params).categoria);
  if (!cat) notFound();
  const list = projects.filter((p) => p.category === cat.id);
  const summary = categorySummary(cat.id);

  return (
    <main id="contenuto" className="section pt-28 md:pt-36">
      <BackButton href="/lavori" label="Tutti i lavori" />

      <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <h1 className="heading flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-violet/30 bg-violet/10 text-violet-soft md:size-16">
              <CategoryIcon id={cat.id} size={30} />
            </span>
            {cat.label}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-mist">{cat.description}</p>
        </div>
        <p className="rounded-full border border-line px-4 py-2 font-mono text-xs text-mist">{summary.label}</p>
      </div>

      <CategorySwitcher current={cat.id} />

      <div className="mt-20 space-y-28 md:space-y-36">
        {cat.id === "siti-web" ? (
          <>
            <p className="max-w-2xl text-mist">
              Restyling di siti di strutture ricettive: trascina la maniglia per confrontare il sito prima e dopo il mio
              intervento. Strutture, nomi e indirizzi sono di fantasia.
            </p>
            <MakeoverList />
            <MakeoverCta />
          </>
        ) : list.length > 0 ? (
          list.map((p, i) => <ProjectShowcase key={p.id} project={p} index={i} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center md:p-16">
            <p className="font-mono text-xs text-cyber">in arrivo</p>
            <p className="mt-4 font-display text-3xl font-bold">I primi progetti stanno per arrivare.</p>
            <p className="mx-auto mt-3 max-w-lg text-mist">
              Ti serve un bot che risponda ai clienti o un pannello per tenere d&apos;occhio la tua attività? Potrebbe
              essere il primo di questa pagina.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={profile.whatsappHref} target="_blank" rel="noopener noreferrer" className="shine rounded-full bg-whatsapp px-6 py-3 font-semibold text-ink">
                Parliamone su WhatsApp
              </a>
              <Link href="/#preventivo" className="rounded-full border border-line px-6 py-3 font-mono text-sm transition-colors hover:border-cyber hover:text-cyber">
                Calcola un preventivo
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-24 flex flex-col items-center gap-6 border-t border-line pt-14 text-center">
        <p className="font-display text-2xl font-bold">Hai visto tutto in questa categoria.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <BackButton href="/lavori" label="Torna a tutti i lavori" />
          <BackButton href="/" label="Torna alla home" />
        </div>
      </div>
    </main>
  );
}
