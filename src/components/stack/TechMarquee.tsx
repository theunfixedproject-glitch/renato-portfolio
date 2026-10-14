type TechMarqueeProps = {
  items: readonly string[];
  reverse?: boolean;
  duration?: number;
};

/** Nastro infinito: la lista è duplicata e scorre di metà della sua larghezza. */
export function TechMarquee({ items, reverse, duration = 40 }: TechMarqueeProps) {
  const row = [...items, ...items];
  return (
    <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <ul
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
        className={`flex w-max shrink-0 gap-4 py-2 group-hover:[animation-play-state:paused] ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
      >
        {row.map((item, i) => (
          <li
            key={`${item}-${i}`}
            aria-hidden={i >= items.length}
            className="flex items-center gap-3 rounded-full border border-line bg-coal px-6 py-3 font-mono text-sm whitespace-nowrap text-mist transition-colors hover:border-violet hover:text-snow"
          >
            <span className={`size-1.5 rounded-full ${i % 2 ? "bg-cyber" : "bg-violet"}`} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
