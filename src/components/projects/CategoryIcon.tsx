import type { CategoryId } from "@/lib/data";

const paths: Record<CategoryId, React.ReactNode> = {
  applicazioni: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10 18h4M9 7h6M9 11h4" />
    </>
  ),
  videogiochi: (
    <>
      <path d="M6 9h12a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L15 14H9l-1.6 1.8A3 3 0 0 1 2 14v-1a4 4 0 0 1 4-4Z" />
      <path d="M7 11v3M5.5 12.5h3M16 12h.01M18 13.5h.01" />
    </>
  ),
  "siti-web": (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01M9 14l-2 1.5L9 17M15 14l2 1.5-2 1.5" />
    </>
  ),
  "bot-dashboard": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 16v-4M11 16V8M15 16v-6M19 16v-2" />
    </>
  ),
};

export function CategoryIcon({ id, size = 26 }: { id: CategoryId; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[id]}
    </svg>
  );
}
