/** Icone dei nodi dell'ecosistema: tratti semplici su griglia 24×24. */
const PATHS: Record<string, string> = {
  // servizi
  landing: "M4 5h16v14H4zM4 9h16M8 13h8M8 16h5",
  vetrina: "M4 10v9h16v-9M3 10l2-5h14l2 5M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 19v-4h4v4",
  ecommerce: "M5 8h14l-1.2 12H6.2zM9 8V6.5a3 3 0 0 1 6 0V8",
  webapp: "M3 5h18v14H3zM3 9h18M9 9v10",
  app: "M7 3h10v18H7zM11 18h2",
  bot: "M12 4v4M7 8h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM9.5 13h.01M14.5 13h.01M10 16h4",
  video: "M3 5h18v14H3zM10 9l5 3-5 3z",
  // compresi
  hosting: "M4 4h16v7H4zM4 13h16v7H4zM8 7.5h.01M8 16.5h.01",
  contatti: "M3 5h18v14H3zM3 7l9 6 9-6",
  catalogo: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  checkout: "M3 4h2l2.4 11h11L21 7H6.2M9 20h.01M17 20h.01",
  database: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  risposte: "M4 5h16v11H9l-5 4zM8 10h8M8 13h5",
  formati: "M3 7h11v10H3zM17 4h4v16h-4z",
  // extra
  quote: "M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h6",
  design: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-.8-.6-1.2-.6-2s.6-1.5 1.6-1.5H17a4 4 0 0 0 4-4c0-4.4-4-9-9-9zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01",
  seo: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4",
  cms: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  booking: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3M8 17h6",
  auth: "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5",
  pay: "M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9",
  shipping: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  dashboard: "M5 20v-8M12 20V5M19 20v-5M3 20h18",
  push: "M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  stores: "M12 4v11M7 10l5 5 5-5M5 20h14",
  ai: "M12 3l1.8 4.6 4.7 1.9-4.7 1.9L12 16l-1.8-4.6-4.7-1.9 4.7-1.9zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  integrations: "M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5",
  lang: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z",
  maintenance: "M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6zM9 12l2 2 4-4",
  "promo-video": "M3 10v4h4l6 4V6l-6 4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
  voice: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  subs: "M3 6h18v12H3zM7 12h4M13 12h4M7 15h7",
  music: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  // canali
  google: "M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  browser: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z",
  store: "M7 3h10v18H7zM12 7v7M9.5 11.5 12 14l2.5-2.5",
  chat: "M3 21l1.65-3.8A9 9 0 1 1 8 20.1L3 21",
  social: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
};

export function EcoIcon({ name, size = 16, className, style }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      <path d={PATHS[name] ?? "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"} />
    </svg>
  );
}
