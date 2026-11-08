import { priceFactor, quoteUrgency, type QuoteType } from "./data";
import { availableExtras, sizeFor, unitsFor, type QuoteInput, type QuoteResult } from "./quote";

/**
 * Trasforma le scelte del preventivatore in un ecosistema di nodi:
 * al centro la tua attività, intorno i servizi scelti, poi le funzioni
 * (quelle incluse e gli extra) e, più fuori, i canali da cui arrivano i clienti.
 */

export type EcoKind = "core" | "service" | "base" | "feature" | "channel";

export type EcoNode = {
  id: string;
  kind: EcoKind;
  /** Anello: 0 centro, 1 servizi, 2 funzioni, 3 canali. */
  ring: 0 | 1 | 2 | 3;
  /** Testo breve, quello che si legge sulla mappa. */
  label: string;
  /** Nome dell'icona (vedi ecoIcons). */
  icon: string;
  /** Riga sotto il titolo (taglia, "incluso"...). */
  sub?: string;
  /** Nome completo e descrizione, nella scheda che si apre. */
  title: string;
  desc: string;
  price?: string;
  /** Pagine, schermate o video: diventano satelliti attorno al nodo. */
  units?: number;
};

export type EcoEdge = { from: string; to: string };

export type Ecosystem = {
  nodes: EcoNode[];
  edges: EcoEdge[];
  counts: Record<Exclude<EcoKind, "core">, number>;
  empty: boolean;
};

const thousands = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const round10 = (n: number) => Math.round(n / 10) * 10;
const priceRange = (a: number, b: number) => `${thousands(round10(a))}–${thousands(round10(b))} €`;

/** Pezzi compresi nel prezzo base di ogni servizio. */
const BASES: { id: string; label: string; desc: string; for: string[] }[] = [
  { id: "hosting", label: "Dominio e hosting", desc: "Il tuo indirizzo online e il server che lo tiene acceso, giorno e notte.", for: ["landing", "vetrina", "ecommerce", "webapp"] },
  { id: "contatti", label: "Modulo contatti", desc: "Le richieste dei clienti arrivano dritte nella tua casella.", for: ["landing", "vetrina"] },
  { id: "catalogo", label: "Catalogo prodotti", desc: "Schede, foto, varianti e prezzi, ordinati in categorie.", for: ["ecommerce"] },
  { id: "checkout", label: "Carrello e checkout", desc: "Dal carrello al pagamento in pochi passi, anche da telefono.", for: ["ecommerce"] },
  { id: "database", label: "Database", desc: "Dove vivono dati, utenti e contenuti, sempre aggiornati su ogni dispositivo.", for: ["webapp", "app"] },
  { id: "risposte", label: "Risposte automatiche", desc: "Il bot risponde alle domande frequenti al posto tuo, a ogni ora.", for: ["bot"] },
  { id: "colonna", label: "Colonna sonora", desc: "La musica scritta apposta, a tempo con ogni movimento del film.", for: ["motion"] },
  { id: "formati", label: "Formati social", desc: "In verticale per Reel e TikTok, in orizzontale per il sito e YouTube.", for: ["video"] },
];

/** Come appare ogni extra sulla mappa, e a cosa si aggancia oltre ai servizi. */
const FEATURES: Record<string, { label: string; desc: string; attach?: [service: string, base: string]; channel?: string }> = {
  quote: { label: "Preventivatore online", desc: "I clienti vedono subito costi e tempi, e ti contattano con le idee già chiare. Come questo." },
  design: { label: "Logo e identità", desc: "Logo, colori e stile: il volto riconoscibile di tutto quello che costruisci." },
  seo: { label: "SEO e Google Business", desc: "Il sito sale nelle ricerche di Google e la tua attività compare su Maps, con orari e recensioni.", channel: "google" },
  cms: { label: "Pannello contenuti", desc: "Cambi testi, foto e prezzi da solo, senza chiamare nessuno." },
  booking: { label: "Prenotazioni", desc: "Appuntamenti e prenotazioni online, con il calendario sempre aggiornato." },
  auth: { label: "Area clienti", desc: "Ogni cliente ha il suo accesso: ordini, documenti, storico." },
  pay: { label: "Pagamenti online", desc: "Carte, Apple Pay, Google Pay e bonifici: incassi direttamente online." },
  shipping: { label: "Spedizioni", desc: "Etichette, corrieri e tracciamento degli ordini.", attach: ["ecommerce", "checkout"] },
  dashboard: { label: "Statistiche", desc: "Vendite, visite e clienti a colpo d'occhio, per decidere con i numeri." },
  push: { label: "Notifiche push", desc: "Offerte e promemoria che arrivano direttamente sul telefono dei tuoi clienti." },
  stores: { label: "Pubblicazione sugli store", desc: "L'app su Play Store e App Store, pronta da scaricare.", channel: "store" },
  ai: { label: "Intelligenza artificiale", desc: "Il bot capisce le domande e risponde con parole sue, non solo con risposte fisse.", attach: ["bot", "risposte"] },
  integrations: { label: "CRM e gestionale", desc: "Il sito parla con gli strumenti che usi già: calendario, CRM, gestionale." },
  lang: { label: "Più lingue", desc: "Lo stesso progetto in più lingue, per i clienti e i turisti che arrivano da fuori." },
  maintenance: { label: "Manutenzione 12 mesi", desc: "Aggiornamenti, sicurezza e piccole modifiche per un anno: non ci pensi tu." },
  "promo-video": { label: "Video di lancio", desc: "Uno spot generato con l'AI per presentare il progetto sui social.", channel: "social" },
  voice: { label: "Voce narrante", desc: "Una voce professionale che racconta lo spot." },
  subs: { label: "Sottotitoli e inglese", desc: "Lo spot si capisce anche senza audio, e arriva anche a chi parla inglese." },
  music: { label: "Musica originale", desc: "Una colonna sonora creata su misura, solo per il tuo spot." },
};

function channelsFor(input: QuoteInput) {
  const has = (id: string) => input.typeIds.includes(id);
  const extra = (id: string) => input.extras.includes(id);
  const list: { id: string; label: string; desc: string; services: string[] }[] = [];
  const web = ["landing", "vetrina", "ecommerce"].filter(has);
  if (web.length)
    list.push({
      id: "google",
      label: extra("seo") ? "Google e Maps" : "Google",
      desc: extra("seo") ? "Chi ti cerca ti trova: nei risultati di Google e sulla mappa." : "Chi ti cerca ti trova: il sito è costruito per farsi leggere da Google.",
      services: web,
    });
  if (has("webapp")) list.push({ id: "browser", label: "Browser", desc: "Si usa da computer e telefono, senza installare niente.", services: ["webapp"] });
  if (has("app"))
    list.push({
      id: "store",
      label: extra("stores") ? "Play Store e App Store" : "Installazione diretta",
      desc: extra("stores") ? "I clienti scaricano l'app dagli store ufficiali." : "I clienti installano l'app con un link, senza passare dagli store.",
      services: ["app"],
    });
  if (has("bot")) list.push({ id: "chat", label: "WhatsApp e Telegram", desc: "Dove i tuoi clienti scrivono già ogni giorno: il bot risponde lì.", services: ["bot"] });
  const films = ["video", "motion"].filter(has);
  if (films.length || extra("promo-video"))
    list.push({ id: "social", label: "Social", desc: "Instagram, TikTok e Facebook: dove i video fanno conoscere la tua attività.", services: films });
  return list;
}

export function buildEcosystem(input: QuoteInput, result: QuoteResult | null): Ecosystem {
  const urgency = quoteUrgency.find((u) => u.id === input.urgencyId) ?? quoteUrgency[1];
  const factor = urgency.multiplier * priceFactor;
  const nodes: EcoNode[] = [];
  const edges: EcoEdge[] = [];
  const link = (from: string, to: string) => edges.push({ from, to });

  nodes.push({
    id: "core",
    kind: "core",
    ring: 0,
    label: "La tua attività",
    icon: "core",
    title: "La tua attività",
    desc: result
      ? "Qui arrivano clienti, richieste e ordini: tutto quello che vedi intorno lavora per questo."
      : "Scegli un servizio qui sopra: l'ecosistema prende forma intorno a te.",
    price: result ? `${thousands(result.min)}–${thousands(result.max)} €` : undefined,
    sub: result ? `${result.weeksMin}–${result.weeksMax} settimane` : undefined,
  });

  const types: QuoteType[] = result?.types ?? [];
  for (const t of types) {
    const units = unitsFor(input, t);
    const extraUnits = Math.max(0, units - t.includedUnits);
    const size = sizeFor(input, t);
    nodes.push({
      id: `s-${t.id}`,
      kind: "service",
      ring: 1,
      label: t.label,
      icon: t.id,
      sub: size ? `${size.label} · ${units} ${t.unitLabel}` : t.hint,
      title: t.label,
      desc: size ? `${size.label}: ${size.hint.charAt(0).toLowerCase()}${size.hint.slice(1)}.` : `${t.hint}.`,
      price: priceRange((t.base[0] + extraUnits * t.perUnit) * factor, (t.base[1] + extraUnits * t.perUnit * 1.4) * factor),
      units: t.perUnit > 0 ? Math.min(units, 24) : 0,
    });
    link(`s-${t.id}`, "core");
  }

  const selected = new Set(types.map((t) => t.id));
  for (const b of BASES) {
    const owners = b.for.filter((id) => selected.has(id));
    if (!owners.length) continue;
    nodes.push({ id: `b-${b.id}`, kind: "base", ring: 2, label: b.label, icon: b.id, title: b.label, desc: b.desc, price: "Incluso" });
    owners.forEach((o) => link(`b-${b.id}`, `s-${o}`));
  }

  const extras = availableExtras(input.typeIds).filter((e) => input.extras.includes(e.id));
  for (const e of extras) {
    const meta = FEATURES[e.id] ?? { label: e.label, desc: e.label };
    const id = `f-${e.id}`;
    const targets = e.for === "all" ? [...selected] : e.for.filter((s) => selected.has(s));
    // un extra che vale per tutti i servizi scelti si aggancia direttamente al centro
    const everywhere = selected.size > 1 && targets.length === selected.size && !meta.attach;
    nodes.push({
      id,
      kind: "feature",
      ring: 2,
      label: meta.label,
      icon: e.id,
      sub: everywhere ? "per tutto il progetto" : undefined,
      title: e.label,
      desc: meta.desc,
      price: priceRange(e.price[0] * factor, e.price[1] * factor),
    });
    if (meta.attach && selected.has(meta.attach[0])) link(id, `b-${meta.attach[1]}`);
    else if (everywhere) link(id, "core");
    else targets.forEach((s) => link(id, `s-${s}`));
  }

  for (const c of channelsFor(input)) {
    nodes.push({ id: `c-${c.id}`, kind: "channel", ring: 3, label: c.label, icon: c.id, title: c.label, desc: c.desc });
    c.services.forEach((s) => link(`c-${c.id}`, `s-${s}`));
  }
  // gli extra che aprono un canale ci si collegano
  for (const e of extras) {
    const ch = FEATURES[e.id]?.channel;
    if (ch && nodes.some((n) => n.id === `c-${ch}`)) link(`f-${e.id}`, `c-${ch}`);
  }

  const count = (k: EcoKind) => nodes.filter((n) => n.kind === k).length;
  return {
    nodes,
    edges,
    counts: { service: count("service"), base: count("base"), feature: count("feature"), channel: count("channel") },
    empty: types.length === 0,
  };
}
