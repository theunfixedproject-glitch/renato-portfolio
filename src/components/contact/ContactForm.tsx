"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cloneElement, useEffect, useId, useRef, useState } from "react";
import { profile, quoteTypes } from "@/lib/data";
import { MULTI_SERVICE_LABEL, PREFILL_EVENT, type PrefillDetail } from "@/lib/events";
import { ArrowIcon } from "../ui/Icons";

type Status = "idle" | "sending" | "sent" | "mailto" | "error";
type Fields = { name: string; email: string; phone: string; type: string; message: string; website: string };
type Errors = Partial<Record<keyof Fields, string>>;

const empty: Fields = { name: "", email: "", phone: "", type: "", message: "", website: "" };
const projectTypes = [...quoteTypes.map((t) => t.label), MULTI_SERVICE_LABEL, "Altro / non lo so ancora"];

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Dimmi come ti chiami";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Serve un'email valida per risponderti";
  if (f.message.trim().length < 10) e.message = "Raccontami qualcosa in più (almeno 10 caratteri)";
  return e;
}

function mailtoHref(f: Fields) {
  const body = `${f.message}\n\n— ${f.name}\n${f.email}${f.phone ? `\n${f.phone}` : ""}`;
  return `${profile.emailHref}?subject=${encodeURIComponent(`Nuovo progetto: ${f.type || "richiesta"} — ${f.name}`)}&body=${encodeURIComponent(body)}`;
}

export function ContactForm() {
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [flash, setFlash] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  // Il preventivo rapido può precompilare il form.
  useEffect(() => {
    const onPrefill = (e: Event) => {
      const { type, message } = (e as CustomEvent<PrefillDetail>).detail;
      setFields((f) => ({ ...f, type, message: `Ciao Renato, ecco la stima che ho calcolato sul sito:\n\n${message}\n\n` }));
      setStatus("idle");
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1400);
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setStatus("sent");
        setFields(empty);
        return;
      }
      if (res.status === 503) {
        // Invio via server non configurato: si apre il client email già compilato.
        window.location.href = mailtoHref(fields);
        setStatus("mailto");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  const done = status === "sent" || status === "mailto";

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {done ? (
          <SuccessState key="success" viaMail={status === "mailto"} onReset={() => setStatus("idle")} />
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, boxShadow: flash ? "0 0 0 2px var(--color-cyber)" : "0 0 0 0px transparent" }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="card space-y-6 p-6 md:p-8"
            aria-describedby={`${id}-required`}
          >
            <p id={`${id}-required`} className="font-mono text-xs text-mist">
              I campi con * sono obbligatori.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Nome *" name="name" error={errors.name} id={id}>
                <input value={fields.name} onChange={set("name")} autoComplete="name" />
              </Field>
              <Field label="Email *" name="email" error={errors.email} id={id}>
                <input type="email" value={fields.email} onChange={set("email")} autoComplete="email" inputMode="email" />
              </Field>
              <Field label="Telefono" name="phone" id={id}>
                <input type="tel" value={fields.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" />
              </Field>
              <Field label="Tipo di progetto" name="type" id={id}>
                <select value={fields.type} onChange={set("type")}>
                  <option value="">Scegli…</option>
                  {projectTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Raccontami il progetto *" name="message" error={errors.message} id={id}>
              <textarea rows={5} value={fields.message} onChange={set("message")} placeholder="Che attività hai, cosa ti serve, entro quando…" />
            </Field>

            {/* Campo trappola per i bot: invisibile alle persone. */}
            <div aria-hidden className="absolute -left-[9999px]">
              <label>
                Lascia vuoto
                <input tabIndex={-1} autoComplete="off" value={fields.website} onChange={set("website")} name="website" />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <motion.button
                type="submit"
                disabled={status === "sending"}
                whileTap={{ scale: 0.96 }}
                className="group relative inline-flex min-w-48 items-center justify-center gap-2 overflow-hidden rounded-full bg-violet px-7 py-4 font-mono text-sm font-medium text-ink transition-shadow hover:shadow-[0_0_40px_-6px_var(--color-violet)] disabled:cursor-wait"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {status === "sending" ? (
                    <motion.span key="s" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-ink border-t-transparent" aria-hidden />
                      Invio in corso…
                    </motion.span>
                  ) : (
                    <motion.span key="i" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                      Invia il messaggio
                      <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <p role="status" className="text-sm text-mist">
                {status === "error" && (
                  <span className="text-red-400">
                    Qualcosa è andato storto. Riprova o scrivimi a{" "}
                    <a href={profile.emailHref} className="underline">
                      {profile.email}
                    </a>
                    .
                  </span>
                )}
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: keyof Fields;
  error?: string;
  id: string;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLElement>>;
};

/** Etichetta, campo e messaggio d'errore collegati per gli screen reader. */
function Field({ label, name, error, id, children }: FieldProps) {
  const inputId = `${id}-${name}`;
  const errorId = `${inputId}-error`;
  const control = cloneElement(children, {
    id: inputId,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    className:
      "peer w-full rounded-xl border bg-ink/60 px-4 py-3 text-snow placeholder:text-mist/50 outline-none transition-[border-color,box-shadow] focus:border-violet focus:shadow-[0_0_0_4px_rgba(162,89,255,0.15)] " +
      (error ? "border-red-400/70" : "border-line"),
  });
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block font-mono text-xs tracking-wide text-mist">
        {label}
      </label>
      {control}
      <AnimatePresence>
        {error && (
          <motion.p id={errorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-xs text-red-400">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const sparks = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return { x: Math.cos(angle) * 90, y: Math.sin(angle) * 90, color: i % 2 ? "var(--color-cyber)" : "var(--color-violet)" };
});

function SuccessState({ viaMail, onReset }: { viaMail: boolean; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      role="status"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="card flex min-h-[460px] flex-col items-center justify-center p-8 text-center outline-none"
    >
      <div className="relative grid size-24 place-items-center">
        {sparks.map((s, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute size-2 rounded-full"
            style={{ background: s.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.2 }}
            transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="grid size-24 place-items-center rounded-full bg-cyber shadow-[0_0_60px_-6px_var(--color-cyber)]"
        >
          <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="var(--color-ink)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <motion.path d="m5 12 5 5L20 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
          </svg>
        </motion.div>
      </div>
      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 font-display text-3xl font-bold">
        {viaMail ? "Quasi fatto!" : "Messaggio inviato!"}
      </motion.h3>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="mt-3 max-w-sm text-mist">
        {viaMail
          ? "Si è aperta la tua app email con il messaggio già pronto: premi invia e ti rispondo entro 24 ore."
          : "Grazie! Ti rispondo entro 24 ore. Se hai fretta, scrivimi su WhatsApp."}
      </motion.p>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        type="button"
        onClick={onReset}
        className="mt-8 font-mono text-xs text-cyber underline-offset-4 hover:underline"
      >
        Scrivi un altro messaggio
      </motion.button>
    </motion.div>
  );
}
