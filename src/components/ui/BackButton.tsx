import Link from "next/link";

type BackButtonProps = {
  href: string;
  label: string;
  className?: string;
};

/** Pulsante grande e chiaro per tornare indietro: freccia, testo esplicito, area di tocco ampia. */
export function BackButton({ href, label, className = "" }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-12 items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] py-2 pr-6 pl-2 text-base font-semibold text-snow transition-colors hover:border-cyber hover:bg-cyber/10 ${className}`}
    >
      <span className="grid size-9 place-items-center rounded-full bg-snow text-ink transition-transform group-hover:-translate-x-1">
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
      </span>
      {label}
    </Link>
  );
}
