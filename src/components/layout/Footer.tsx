import { navLinks, profile } from "@/lib/data";
import { ArrowIcon, MailIcon, WhatsAppIcon } from "../ui/Icons";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line" data-hide-floating-wa>
      <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_bottom,#000,transparent_70%)]" />
      <div aria-hidden className="absolute -bottom-40 left-1/2 h-80 w-[80%] -translate-x-1/2 rounded-full bg-violet/20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-5 pt-24 pb-10 sm:px-8">
        <p className="eyebrow">il prossimo passo</p>
        <a href="/#contatti" className="group mt-6 block w-fit">
          <span className="block font-display text-[clamp(2rem,8.5vw,7.5rem)] leading-[0.9] font-extrabold tracking-tight">
            Parliamone<span className="text-cyber">.</span>
          </span>
          <span className="mt-4 inline-flex items-center gap-2 font-mono text-sm text-mist transition-colors group-hover:text-cyber">
            Il primo confronto è gratuito
            <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
        </a>

        <div className="mt-12 flex flex-wrap gap-3">
          <a
            href={profile.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shine inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 font-semibold text-ink"
          >
            <WhatsAppIcon width={20} height={20} strokeWidth={2.2} /> WhatsApp
          </a>
          <a
            href={profile.emailHref}
            className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-sm transition-colors hover:border-violet hover:text-violet-soft"
          >
            <MailIcon width={18} height={18} /> {profile.email}
          </a>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-line pt-8 font-mono text-xs text-mist md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {profile.name} · Siti web, app e bot su misura
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {navLinks.map((l) => (
              <li key={l.id}>
                <a href={`/#${l.id}`} className="transition-colors hover:text-snow">
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#" className="text-cyber transition-colors hover:text-snow">
                Torna su ↑
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
