import { profile } from "@/lib/data";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 font-mono text-xs text-mist sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name} · Siti web, app e bot su misura
        </p>
        <p className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-cyber" aria-hidden />
          Costruito a mano con Next.js, Three.js e Framer Motion
        </p>
      </div>
    </footer>
  );
}
