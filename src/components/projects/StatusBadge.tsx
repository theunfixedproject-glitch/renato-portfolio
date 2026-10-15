import type { ProjectStatus } from "@/lib/data";

export function StatusBadge({ status }: { status: ProjectStatus | "concept" }) {
  const styles = {
    online: { box: "border-cyber/40 bg-cyber/10 text-cyber", dot: "bg-cyber", label: "Online" },
    "in-sviluppo": { box: "border-violet/40 bg-violet/10 text-violet-soft", dot: "animate-pulse bg-violet", label: "In sviluppo" },
    concept: { box: "border-white/20 bg-white/5 text-snow", dot: "bg-snow", label: "Concept" },
  }[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] backdrop-blur ${styles.box}`}>
      <span className={`size-1.5 rounded-full ${styles.dot}`} aria-hidden />
      {styles.label}
    </span>
  );
}
