"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navLinks, profile } from "@/lib/data";

/** Sezione attualmente sullo schermo, per evidenziare la voce giusta del menu. */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = navLinks.map((l) => document.getElementById(l.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      // Conta come "attiva" la sezione che attraversa la fascia centrale dello schermo.
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    const onTop = () => window.scrollY < window.innerHeight * 0.5 && setActive(null);
    window.addEventListener("scroll", onTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onTop);
    };
  }, []);

  return active;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const pathname = usePathname();
  // Fuori dalla home: un "Indietro" sempre visibile che porta alla pagina superiore.
  const back = pathname === "/" ? null : pathname.startsWith("/lavori/") ? "/lavori" : "/";
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const floating = scrolled || open;

  // L'animazione di chiusura del menu mobile annulla lo scroll del browser:
  // ci si ricorda la destinazione e si scorre quando il menu è sparito del tutto.
  // Dalle altre pagine (es. /lavori/...) si torna alla home sulla sezione giusta.
  const pendingId = useRef<string | null>(null);
  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    pendingId.current = id;
    setOpen(false);
  };
  const scrollToPending = () => {
    const id = pendingId.current;
    pendingId.current = null;
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) {
      window.location.assign(`/#${id}`);
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10 focus:rounded-full focus:bg-cyber focus:px-4 focus:py-2 focus:text-ink"
      >
        Vai al contenuto
      </a>

      <div
        className={`relative mx-auto overflow-hidden border transition-[max-width,background-color,border-color,border-radius,box-shadow] duration-500 ${
          floating
            ? "max-w-5xl border-white/10 bg-ink/70 shadow-[0_10px_50px_-20px_rgba(162,89,255,0.45)] backdrop-blur-xl"
            : "max-w-7xl border-transparent"
        } ${open ? "rounded-3xl" : "rounded-full"}`}
      >
        <nav aria-label="Principale" className="flex h-14 items-center justify-between pr-2 pl-3 sm:pl-4">
          <a href="/" className="group flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet to-violet-soft font-mono text-sm text-ink shadow-[0_0_20px_-4px_var(--color-violet)] transition-transform duration-500 group-hover:rotate-[360deg]">
              RM
            </span>
            <span className={back ? "hidden lg:inline" : "hidden sm:inline"}>{profile.name}</span>
          </a>
          {back && (
            <Link
              href={back}
              className="ml-2 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] py-1.5 pr-4 pl-1.5 text-sm font-semibold text-snow transition-colors hover:border-cyber md:mr-auto md:ml-4"
            >
              <span className="grid size-7 place-items-center rounded-full bg-snow text-ink">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
              </span>
              Indietro
            </Link>
          )}

          <ul className="hidden items-center md:flex">
            {navLinks.map((link) => {
              const isActive = active === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={`/#${link.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={`relative block rounded-full px-4 py-2 font-mono text-xs tracking-wide transition-colors ${
                      isActive ? "text-snow" : "text-mist hover:text-snow"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.07]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative">{link.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href="/#contatti"
              className="shine hidden rounded-full bg-cyber px-5 py-2.5 font-mono text-xs font-medium text-ink transition-shadow hover:shadow-[0_0_30px_-4px_var(--color-cyber)] sm:inline-flex"
            >
              Parliamone
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Chiudi il menu" : "Apri il menu"}
              className="grid size-10 place-items-center rounded-full border border-line bg-ink/40 md:hidden"
            >
              <span className="relative block h-3 w-4">
                <span className={`absolute left-0 h-0.5 w-4 bg-snow transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-0.5 w-4 bg-snow transition-all ${open ? "top-1.5 -rotate-45" : "top-2.5"}`} />
              </span>
            </button>
          </div>
        </nav>

        <AnimatePresence onExitComplete={scrollToPending}>
          {open && (
            <motion.ul
              id="menu-mobile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-5 md:hidden"
            >
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.id}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <a
                    href={`/#${link.id}`}
                    onClick={(e) => goTo(e, link.id)}
                    className="flex items-baseline gap-3 border-b border-line/60 py-4 font-display text-2xl font-bold"
                  >
                    <span className="font-mono text-xs text-cyber">{String(i + 1).padStart(2, "0")}</span>
                    {link.label}
                  </a>
                </motion.li>
              ))}
              <li className="py-5">
                <a
                  href={profile.whatsappHref}
                  className="flex items-center justify-center rounded-full bg-whatsapp py-3 font-semibold text-ink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Scrivimi su WhatsApp
                </a>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>

        <motion.div
          aria-hidden
          style={{ scaleX: progress }}
          className={`absolute bottom-0 left-0 h-px w-full origin-left bg-gradient-to-r from-violet to-cyber transition-opacity ${
            floating ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </header>
  );
}
