import Link from "next/link";
import { categories, type CategoryId } from "@/lib/data";
import { categorySummary } from "@/lib/work";
import { CategoryIcon } from "./CategoryIcon";

/** Le quattro categorie come riquadri grandi: si vedono tutte, senza scorrere di lato. */
export function CategorySwitcher({ current }: { current: CategoryId }) {
  return (
    <nav aria-label="Categorie di lavori" className="mt-12">
      <p className="eyebrow mb-4">cambia categoria</p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((c) => {
          const active = c.id === current;
          return (
            <li key={c.id}>
              <Link
                href={`/lavori/${c.id}`}
                aria-current={active ? "page" : undefined}
                className={`flex h-full min-h-24 items-center gap-3 rounded-2xl border p-3 transition-colors sm:p-4 ${
                  active
                    ? "border-cyber bg-cyber/10 shadow-[0_0_30px_-12px_var(--color-cyber)]"
                    : "border-line bg-coal/80 hover:border-violet/60 hover:bg-coal"
                }`}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    active ? "bg-cyber text-ink" : "bg-violet/10 text-violet-soft"
                  }`}
                >
                  <CategoryIcon id={c.id} size={22} />
                </span>
                <span className="min-w-0">
                  <span className={`block font-display text-base leading-tight font-bold sm:text-lg ${active ? "text-cyber" : ""}`}>{c.label}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-mist">{active ? "Stai guardando" : categorySummary(c.id).label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
