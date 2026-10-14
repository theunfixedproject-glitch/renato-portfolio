"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { profile } from "@/lib/data";
import { CheckIcon, CopyIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { ContactForm } from "./ContactForm";

const channels = [
  { label: "WhatsApp", value: "Scrivimi in chat", href: profile.whatsappHref, icon: WhatsAppIcon, external: true },
  { label: "Telefono", value: profile.phone, href: profile.phoneHref, icon: PhoneIcon, copy: profile.phone },
  { label: "Email", value: profile.email, href: profile.emailHref, icon: MailIcon, copy: profile.email },
];

export function Contact() {
  return (
    <section aria-labelledby="contatti-title" id="contatti" className="section">
      <SectionHeading
        id="contatti-title"
        eyebrow="// contatti"
        title={
          <>
            Hai un&apos;idea? <span className="text-gradient">Trasformiamola in clienti.</span>
          </>
        }
        intro="Raccontami la tua attività e cosa ti serve. Il primo confronto e il preventivo sono gratuiti e senza impegno."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr]">
        <Reveal className="space-y-4">
          {channels.map((c) => (
            <ContactChannel key={c.label} {...c} />
          ))}
          <div className="rounded-3xl border border-dashed border-line p-6 font-mono text-xs leading-relaxed text-mist">
            <p>
              <span className="text-cyber">●</span> Disponibile per nuovi progetti
            </p>
            <p className="mt-2">Rispondo entro 24 ore, di solito molto prima.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}

type ChannelProps = {
  label: string;
  value: string;
  href: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  external?: boolean;
  copy?: string;
};

function ContactChannel({ label, value, href, icon: Icon, external, copy }: ChannelProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!copy) return;
    try {
      await navigator.clipboard.writeText(copy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard non disponibile: il link resta comunque cliccabile */
    }
  };

  return (
    <div className="group flex items-center gap-3 rounded-3xl border border-line bg-coal p-3 transition-colors hover:border-violet/60">
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl p-2"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet/15 text-violet-soft transition-colors group-hover:bg-violet group-hover:text-ink">
          <Icon />
        </span>
        <span className="min-w-0">
          <span className="block font-mono text-xs text-mist">{label}</span>
          <span className="block truncate font-display text-lg font-bold">{value}</span>
        </span>
      </a>
      {copy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? `${label} copiato` : `Copia ${label.toLowerCase()}`}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-mist transition-colors hover:border-cyber hover:text-cyber"
        >
          <motion.span key={copied ? "y" : "n"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {copied ? <CheckIcon width={16} height={16} className="text-cyber" /> : <CopyIcon width={16} height={16} />}
          </motion.span>
        </button>
      )}
    </div>
  );
}
