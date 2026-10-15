import { categories, makeovers, projects, type CategoryId } from "./data";

/** Quanti lavori ci sono in una categoria, e come dirlo. */
export function categorySummary(id: CategoryId): { count: number; label: string } {
  if (id === "siti-web") {
    const count = makeovers.length;
    return { count, label: `${count} restyling` };
  }
  const count = projects.filter((p) => p.category === id).length;
  if (count === 0) return { count, label: "In arrivo" };
  return { count, label: `${count} ${count === 1 ? "progetto" : "progetti"}` };
}

/** Le immagini di anteprima per la card di una categoria. */
export function categoryPreviews(id: CategoryId): string[] {
  return projects
    .filter((p) => p.category === id)
    .map((p) => p.cover)
    .slice(0, 2);
}

export const getCategory = (id: string) => categories.find((c) => c.id === id);
