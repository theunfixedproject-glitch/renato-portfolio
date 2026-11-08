import { categories, makeovers, projects, type CategoryId } from "./data";

/** Quanti lavori ci sono in una categoria, e come dirlo. */
export function categorySummary(id: CategoryId): { count: number; label: string } {
  const count = projects.filter((p) => p.category === id).length;
  if (id === "siti-web") {
    const parts = [count ? `${count} ${count === 1 ? "e-commerce" : "siti"}` : null, `${makeovers.length} restyling`].filter(Boolean);
    return { count: count + makeovers.length, label: parts.join(" + ") };
  }
  if (count === 0) return { count, label: "In arrivo" };
  const noun = id === "video-ai" ? "spot" : id === "graphic-motion" ? "film" : count === 1 ? "progetto" : "progetti";
  return { count, label: `${count} ${noun}` };
}

/** Le immagini di anteprima per la card di una categoria. */
export function categoryPreviews(id: CategoryId): { src: string; landscape: boolean }[] {
  return projects
    .filter((p) => p.category === id)
    .map((p) => ({ src: p.cover, landscape: p.orientation === "landscape" }))
    .slice(0, 2);
}

export const getCategory = (id: string) => categories.find((c) => c.id === id);
