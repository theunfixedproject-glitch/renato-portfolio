"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { profile } from "@/lib/data";
import { WhatsAppIcon } from "../ui/Icons";

/**
 * Pulsante WhatsApp sempre a portata di pollice: compare dopo l'hero
 * e si nasconde dove WhatsApp è già in primo piano (contatti e footer).
 */
export function FloatingWhatsApp() {
  const [pastHero, setPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Le zone dove WhatsApp è già in primo piano (contatti, footer) lo nascondono.
    const zones = document.querySelectorAll("[data-hide-floating-wa]");
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
        setHidden(visible.size > 0);
      },
      { threshold: 0.15 },
    );
    zones.forEach((z) => io.observe(z));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {pastHero && !hidden && (
        <motion.a
          href={profile.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Scrivimi su WhatsApp"
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="wa-pulse fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-whatsapp py-3 pr-5 pl-4 font-semibold text-ink shadow-[0_10px_40px_-8px_var(--color-whatsapp)] sm:right-6 sm:bottom-6"
        >
          <WhatsAppIcon width={26} height={26} strokeWidth={2.2} />
          WhatsApp
        </motion.a>
      )}
    </AnimatePresence>
  );
}
