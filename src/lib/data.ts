/**
 * Tutti i contenuti del sito in un posto solo: per aggiornare testi,
 * progetti o prezzi basta modificare questo file.
 */

export const profile = {
  name: "Renato Manzotti",
  firstName: "Renato",
  age: 23,
  role: "Web & App Developer",
  phone: "+39 338 863 7995",
  phoneHref: "tel:+393388637995",
  whatsappBase: "https://wa.me/393388637995",
  whatsappHref:
    "https://wa.me/393388637995?text=" +
    encodeURIComponent("Ciao Renato, ho visto il tuo portfolio e vorrei parlarti di un progetto."),
  email: "manzottirenato@gmail.com",
  emailHref: "mailto:manzottirenato@gmail.com",
  photo: "/img/renato.webp",
} as const;

/** Voci del menu: puntano alle sezioni della home, quindi funzionano anche dalle altre pagine. */
export const navLinks = [
  { id: "chi-sono", label: "Chi sono" },
  { id: "prima-dopo", label: "Prima e dopo" },
  { id: "lavori", label: "Lavori" },
  { id: "analisi", label: "Analisi" },
  { id: "preventivo", label: "Preventivo" },
  { id: "contatti", label: "Contatti" },
] as const;

/* ------------------------------------------------------------------ */
/* Lavori personali, divisi per categoria                              */
/* ------------------------------------------------------------------ */

export type CategoryId = "applicazioni" | "videogiochi" | "siti-web" | "video-ai" | "bot-dashboard";

export type Category = {
  id: CategoryId;
  label: string;
  tagline: string;
  description: string;
  accent: "violet" | "green";
};

export const categories: Category[] = [
  {
    id: "applicazioni",
    label: "Applicazioni",
    tagline: "Social, produttività, strumenti",
    description: "App per telefono e browser: chat in tempo reale, profili, notifiche, dati che restano sincronizzati.",
    accent: "violet",
  },
  {
    id: "videogiochi",
    label: "Videogiochi",
    tagline: "Gestionali, carte, mondi isometrici",
    description: "Giochi completi, dalla grafica all'economia di gioco: la prova che so tenere in piedi progetti complessi.",
    accent: "green",
  },
  {
    id: "siti-web",
    label: "Siti web",
    tagline: "Vetrine, prenotazioni, restyling",
    description: "Siti veloci e curati, pensati per farti trovare su Google e trasformare le visite in richieste.",
    accent: "green",
  },
  {
    id: "video-ai",
    label: "Video AI",
    tagline: "Spot per social, sito e vetrine",
    description: "Video promozionali generati con l'intelligenza artificiale: brevi, curati ed economici, pensati per le piccole e medie imprese.",
    accent: "violet",
  },
  {
    id: "bot-dashboard",
    label: "Bot & dashboard",
    tagline: "Automazioni, pannelli, statistiche",
    description: "Bot che rispondono ai clienti e pannelli di controllo per tenere tutto sotto controllo da un'unica schermata.",
    accent: "violet",
  },
];

export type Service = {
  id: string;
  title: string;
  tag: string;
  description: string;
  outcomes: string[];
};

export const services: Service[] = [
  {
    id: "web",
    title: "Siti web",
    tag: "01 / web",
    description:
      "Siti vetrina, landing page ed e-commerce costruiti per farti trovare su Google e trasformare le visite in richieste.",
    outcomes: ["Caricamento sotto il secondo", "SEO tecnica inclusa", "Gestibile in autonomia"],
  },
  {
    id: "app",
    title: "App su misura",
    tag: "02 / app",
    description:
      "Web app e app mobile installabili: prenotazioni, gestionali, aree clienti. Pensate attorno a come lavori tu.",
    outcomes: ["Android, iOS e browser", "Dati sincronizzati in tempo reale", "Notifiche push"],
  },
  {
    id: "bot",
    title: "Bot & automazioni",
    tag: "03 / bot",
    description:
      "Bot per WhatsApp, Telegram e sito che rispondono ai clienti, raccolgono ordini e ti tolgono il lavoro ripetitivo.",
    outcomes: ["Risposte 24/7", "Integrazione con i tuoi strumenti", "Ore di lavoro risparmiate"],
  },
  {
    id: "video",
    title: "Video promozionali AI",
    tag: "04 / video",
    description:
      "Spot da 15-30 secondi generati con l'intelligenza artificiale: il modo più economico per avere un video curato per social, sito e vetrine digitali.",
    outcomes: ["Pronti in pochi giorni", "Formati verticale e orizzontale", "Una frazione del costo di una troupe"],
  },
];

export type ProjectStatus = "in-sviluppo" | "online" | "realizzato";

export type Project = {
  id: string;
  category: CategoryId;
  name: string;
  kind: string;
  status: ProjectStatus;
  tagline: string;
  description: string;
  /** Cosa dimostra il progetto in termini utili a un cliente. */
  benefits: string[];
  stack: string[];
  accent: "violet" | "green";
  cover: string;
  /** Orientamento delle immagini: decide come vengono impaginate. */
  orientation: "portrait" | "landscape";
  gallery: { src: string; alt: string }[];
  /** Indirizzo del progetto online, se c'è. */
  url?: string;
  urlLabel?: string;
  /** Video da mostrare nella scheda del progetto. */
  videos?: ProjectVideo[];
};

export type ProjectVideo = {
  src: string;
  poster: string;
  aspect: "16/9" | "9/16";
  title: string;
  caption: string;
};

export const projects: Project[] = [
  {
    id: "rivvo",
    category: "applicazioni",
    name: "Rivvo",
    kind: "App social · mobile",
    status: "in-sviluppo",
    tagline: "Sfide tra amici, chat e minigiochi in un'unica app.",
    description:
      "Un social network dove si lanciano sfide agli amici, si stringe la scommessa in chat e si gioca. Feed, storie da 24 ore, profili con livelli ed esperienza, chat in tempo reale e minigiochi integrati.",
    benefits: ["Chat in tempo reale", "Gamification che fa tornare gli utenti", "Onboarding guidato in 3 passi"],
    stack: ["React", "TypeScript", "Realtime DB", "PWA"],
    accent: "violet",
    cover: "/img/projects/rivvo-home.webp",
    orientation: "portrait",
    gallery: [
      { src: "/img/projects/rivvo-home.webp", alt: "Rivvo: home con flash, sfide e bozze" },
      { src: "/img/projects/rivvo-chat.webp", alt: "Rivvo: chat con una sfida ai dadi" },
      { src: "/img/projects/rivvo-sfida.webp", alt: "Rivvo: creazione guidata di una nuova sfida" },
      { src: "/img/projects/rivvo-profilo.webp", alt: "Rivvo: profilo con livello, XP e statistiche" },
    ],
  },
  {
    id: "ritmo",
    category: "applicazioni",
    name: "Ritmo",
    kind: "Produttività · mobile",
    status: "in-sviluppo",
    tagline: "Abitudini, attività e focus. Una cosa alla volta.",
    description:
      "Un'app per organizzare la giornata: abitudini con percentuale di costanza, attività, calendario settimanale, diario e timer per il lavoro concentrato.",
    benefits: ["Interfaccia pulita e leggibile", "Funziona anche offline", "Report sull'andamento"],
    stack: ["React", "TypeScript", "Local-first", "PWA"],
    accent: "green",
    cover: "/img/projects/ritmo.webp",
    orientation: "portrait",
    gallery: [{ src: "/img/projects/ritmo.webp", alt: "Ritmo: la giornata di oggi con abitudini e attività" }],
  },
  {
    id: "distretto",
    category: "videogiochi",
    name: "Distretto",
    kind: "Gioco gestionale · mobile",
    status: "in-sviluppo",
    tagline: "Costruisci la centrale, rispondi al 112, smonta le bande.",
    description:
      "Un city builder isometrico in cui si gestisce un distretto di polizia: costruzione degli edifici, risorse, agenti da addestrare, indagini a più fasi e chiamate al 112 sulla mappa della città.",
    benefits: ["Grafica isometrica fluida", "Economia e progressione bilanciate", "Gira bene anche su telefoni economici"],
    stack: ["TypeScript", "Canvas 2D", "Game loop", "Android"],
    accent: "green",
    cover: "/img/projects/distretto-centrale.webp",
    orientation: "portrait",
    gallery: [
      { src: "/img/projects/distretto-centrale.webp", alt: "Distretto: la centrale vista dall'alto" },
      { src: "/img/projects/distretto-citta.webp", alt: "Distretto: la città con i quartieri e le chiamate" },
      { src: "/img/projects/distretto-indagini.webp", alt: "Distretto: il pannello delle indagini" },
      { src: "/img/projects/distretto-agenti.webp", alt: "Distretto: addestramento degli agenti" },
      { src: "/img/projects/distretto-personale.webp", alt: "Distretto: elenco del personale" },
      { src: "/img/projects/distretto-splash.webp", alt: "Distretto: schermata di avvio" },
    ],
  },
  {
    id: "vicarius",
    category: "videogiochi",
    name: "Vicarius",
    kind: "Gioco di carte · web",
    status: "in-sviluppo",
    tagline: "The Propaganda Deck: 90 carte illustrate, regia anni '70.",
    description:
      "Un gioco di carte satirico ambientato in una regia televisiva d'epoca. Interfaccia fortemente illustrata, tre mazzi, novanta carte, regolamento interattivo e statistiche delle partite.",
    benefits: ["Interfaccia illustrata su misura", "Animazioni curate", "Installabile come app"],
    stack: ["JavaScript", "HTML/CSS", "PWA", "Android"],
    accent: "violet",
    cover: "/img/projects/vicarius.webp",
    orientation: "landscape",
    gallery: [{ src: "/img/projects/vicarius.webp", alt: "Vicarius: la regia con i cinque monitor del menu" }],
  },
  {
    id: "tritabottega",
    category: "siti-web",
    name: "Tritabottega",
    kind: "E-commerce · online",
    status: "online",
    tagline: "Palline di Natale fatte a mano con gli scarti di potatura, in Trentino.",
    description:
      "Il mio negozio online: un e-commerce vero, con catalogo, schede prodotto e carrello, costruito per vendere un prodotto artigianale. È anche l'esempio concreto di come imposto un e-commerce per una piccola attività: racconto del prodotto in primo piano, acquisto in pochi passi.",
    benefits: ["Negozio online funzionante", "Racconto del prodotto, non solo un catalogo", "Acquisto in pochi passi, anche da telefono", "Spot promozionale AI abbinato"],
    stack: ["E-commerce", "Pagamenti online", "Responsive", "Video AI"],
    accent: "green",
    cover: "/img/projects/tritabottega-albero.webp",
    orientation: "landscape",
    gallery: [
      { src: "/img/projects/tritabottega-albero.webp", alt: "Tritabottega: le palline appese all'albero" },
      { src: "/img/projects/tritabottega-pallina.webp", alt: "Tritabottega: una pallina appena finita" },
      { src: "/img/projects/tritabottega-trucioli.webp", alt: "Tritabottega: i trucioli degli scarti di potatura" },
    ],
    url: "https://ramaglia.weareunfixed.chatgpt.site/",
    urlLabel: "Visita il negozio",
  },
  {
    id: "spot-tritabottega",
    category: "video-ai",
    name: "Il ramo ritorna",
    kind: "Spot · Video AI",
    status: "realizzato",
    tagline: "Uno spot da 15 secondi per Tritabottega, in verticale e in orizzontale.",
    description:
      "Dalla potatura all'albero di Natale in sei inquadrature. Le immagini sono generate con l'intelligenza artificiale seguendo uno storyboard; poi aggiungo testi, marchio, musica e invito all'acquisto, e lo preparo nei formati per social, sito e vetrine digitali.",
    benefits: ["Pronto in pochi giorni", "Formato verticale per Reel, TikTok e Storie", "Formato orizzontale per sito e YouTube", "Costo da piccola impresa"],
    stack: ["Video generativo", "Storyboard", "Montaggio", "Motion graphics"],
    accent: "violet",
    cover: "/video/tritabottega-16x9.webp",
    orientation: "landscape",
    gallery: [],
    videos: [
      { src: "/video/tritabottega-16x9.mp4", poster: "/video/tritabottega-16x9.webp", aspect: "16/9", title: "Lo spot finito", caption: "Orizzontale 16:9, per sito, YouTube e schermi" },
      { src: "/video/tritabottega-9x16.mp4", poster: "/video/tritabottega-9x16.webp", aspect: "9/16", title: "Versione verticale", caption: "9:16, per Reel, TikTok e Storie" },
      { src: "/video/tritabottega-grezzo.mp4", poster: "/video/tritabottega-grezzo.webp", aspect: "16/9", title: "Il girato AI, prima del montaggio", caption: "Le inquadrature generate dallo storyboard, senza testi né marchio" },
    ],
  },
];

export const techStack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Three.js",
  "Framer Motion",
  "PostgreSQL",
  "Firebase",
  "Supabase",
  "Stripe",
  "WordPress",
  "Android",
  "PWA",
  "Telegram Bot API",
  "WhatsApp Cloud API",
  "Vercel",
  "Git",
] as const;

/** Punteggi Lighthouse mostrati nella sezione metriche. */
export const lighthouse = [
  { label: "Performance", value: 100 },
  { label: "Accessibilità", value: 100 },
  { label: "Best Practices", value: 100 },
  { label: "SEO", value: 100 },
] as const;

/* ------------------------------------------------------------------ */
/* Preventivo rapido: tutti i prezzi in euro, modificabili qui.        */
/* ------------------------------------------------------------------ */

/** Moltiplicatore applicato a tutti i prezzi: 0.8 = sconto del 20%. Con 1 tornano i prezzi pieni. */
export const priceFactor = 0.8;

export type QuoteType = {
  id: string;
  label: string;
  hint: string;
  base: [number, number];
  weeks: [number, number];
  /** Costo di ogni pagina/schermata oltre quelle incluse. */
  perUnit: number;
  includedUnits: number;
  unitLabel: string;
  /** Le tre taglie proposte al cliente, descritte a parole invece che in numero di pagine. */
  sizes?: QuoteSize[];
};

export type QuoteSize = { id: "s" | "m" | "l"; label: string; hint: string; units: number };

export const quoteTypes: QuoteType[] = [
  { id: "landing", label: "Landing page", hint: "Una pagina, un obiettivo", base: [450, 800], weeks: [1, 2], perUnit: 0, includedUnits: 1, unitLabel: "sezioni" },
  { id: "vetrina", label: "Sito vetrina", hint: "Presenta la tua attività", base: [900, 1600], weeks: [2, 4], perUnit: 120, includedUnits: 5, unitLabel: "pagine", sizes: [{ id: "s", label: "Piccolo", hint: "Home, chi siamo, servizi e contatti", units: 5 }, { id: "m", label: "Medio", hint: "Anche galleria, recensioni e pagine dei servizi", units: 9 }, { id: "l", label: "Grande", hint: "Una pagina per ogni servizio, più news o blog", units: 15 }] },
  { id: "ecommerce", label: "E-commerce", hint: "Vendi online", base: [2200, 4000], weeks: [4, 7], perUnit: 150, includedUnits: 8, unitLabel: "pagine", sizes: [{ id: "s", label: "Piccolo", hint: "Fino a 30 prodotti", units: 8 }, { id: "m", label: "Medio", hint: "Fino a 200 prodotti, divisi in categorie", units: 14 }, { id: "l", label: "Grande", hint: "Catalogo ampio, con varianti e filtri", units: 22 }] },
  { id: "webapp", label: "Web app", hint: "Gestionali, prenotazioni, aree clienti", base: [3000, 6500], weeks: [5, 10], perUnit: 250, includedUnits: 6, unitLabel: "schermate", sizes: [{ id: "s", label: "Piccola", hint: "Una funzione principale, es. le prenotazioni", units: 6 }, { id: "m", label: "Media", hint: "Più funzioni e un pannello di gestione", units: 12 }, { id: "l", label: "Grande", hint: "Un gestionale completo, con utenti e report", units: 20 }] },
  { id: "app", label: "App mobile", hint: "Android e iOS", base: [3500, 8000], weeks: [6, 12], perUnit: 300, includedUnits: 6, unitLabel: "schermate", sizes: [{ id: "s", label: "Piccola", hint: "Poche schermate, una funzione principale", units: 6 }, { id: "m", label: "Media", hint: "Profili, notifiche e più sezioni", units: 12 }, { id: "l", label: "Grande", hint: "App completa, con pagamenti e pannello di gestione", units: 20 }] },
  { id: "bot", label: "Bot / automazione", hint: "WhatsApp, Telegram, sito", base: [400, 1500], weeks: [1, 3], perUnit: 80, includedUnits: 3, unitLabel: "flussi", sizes: [{ id: "s", label: "Base", hint: "Risponde alle domande frequenti", units: 3 }, { id: "m", label: "Avanzato", hint: "Raccoglie anche ordini o prenotazioni", units: 6 }, { id: "l", label: "Completo", hint: "Collegato al tuo gestionale o calendario", units: 10 }] },
  { id: "video", label: "Video promozionale AI", hint: "Spot per social e sito", base: [190, 350], weeks: [1, 1], perUnit: 150, includedUnits: 1, unitLabel: "video", sizes: [{ id: "s", label: "Piccolo", hint: "Uno spot da 15 secondi, in un formato", units: 1 }, { id: "m", label: "Medio", hint: "Lo spot in verticale e orizzontale, più una versione senza testi", units: 2 }, { id: "l", label: "Grande", hint: "Fino a tre spot da 15-30 secondi per una campagna", units: 4 }] },
];

export type QuoteExtra = {
  id: string;
  label: string;
  price: [number, number];
  weeks: number;
  /** Per quali servizi ha senso: compare solo se ne è selezionato almeno uno. */
  for: string[] | "all";
  /** Spiegazione breve mostrata sotto agli extra in evidenza. */
  hint?: string;
  featured?: boolean;
};

/** Siti, app e bot: gli extra "per tutti" valgono per questi, non per i video. */
const DIGITAL = ["landing", "vetrina", "ecommerce", "webapp", "app", "bot"];

export const quoteExtras: QuoteExtra[] = [
  {
    id: "quote",
    label: "Preventivatore online",
    hint: "Come quello che stai usando adesso: i tuoi clienti vedono subito costi e tempi, e ti contattano con le idee già chiare.",
    price: [350, 800],
    weeks: 1,
    for: DIGITAL,
    featured: true,
  },
  { id: "design", label: "Logo e identità visiva", price: [300, 700], weeks: 1, for: ["landing", "vetrina", "ecommerce", "webapp", "app"] },
  { id: "seo", label: "SEO avanzata e scheda Google Business", price: [250, 500], weeks: 0.5, for: ["landing", "vetrina", "ecommerce"] },
  { id: "cms", label: "Pannello per modificare i contenuti", price: [300, 600], weeks: 1, for: ["vetrina", "ecommerce"] },
  { id: "booking", label: "Prenotazioni e appuntamenti online", price: [350, 800], weeks: 1, for: ["vetrina", "webapp", "app", "bot"] },
  { id: "auth", label: "Area clienti con login", price: [400, 900], weeks: 1, for: ["vetrina", "ecommerce", "app"] },
  { id: "pay", label: "Pagamenti online", price: [300, 650], weeks: 1, for: ["webapp", "app", "bot"] },
  { id: "shipping", label: "Spedizioni e tracciamento ordini", price: [300, 700], weeks: 1, for: ["ecommerce"] },
  { id: "dashboard", label: "Dashboard con statistiche", price: [350, 800], weeks: 1, for: ["ecommerce", "webapp", "app"] },
  { id: "push", label: "Notifiche push", price: [200, 450], weeks: 0.5, for: ["webapp", "app"] },
  { id: "stores", label: "Pubblicazione su Play Store e App Store", price: [250, 500], weeks: 0.5, for: ["app"] },
  { id: "ai", label: "Risposte con intelligenza artificiale", price: [300, 800], weeks: 1, for: ["bot"] },
  { id: "integrations", label: "Integrazioni (CRM, calendario, gestionale)", price: [350, 900], weeks: 1, for: ["vetrina", "ecommerce", "webapp", "app", "bot"] },
  { id: "lang", label: "Più lingue", price: [200, 450], weeks: 0.5, for: DIGITAL },
  { id: "maintenance", label: "Manutenzione per 12 mesi", price: [300, 600], weeks: 0, for: DIGITAL },
  { id: "promo-video", label: "Video promozionale AI per il lancio", price: [150, 300], weeks: 0.5, for: DIGITAL },
  { id: "voice", label: "Voce narrante", price: [60, 150], weeks: 0, for: ["video"] },
  { id: "subs", label: "Sottotitoli e versione in inglese", price: [50, 120], weeks: 0, for: ["video"] },
  { id: "music", label: "Musica originale su misura", price: [80, 200], weeks: 0.5, for: ["video"] },
];

export const quoteUrgency = [
  { id: "relaxed", label: "Con calma", multiplier: 0.9, weekFactor: 1.3 },
  { id: "normal", label: "Normale", multiplier: 1, weekFactor: 1 },
  { id: "rush", label: "Urgente", multiplier: 1.25, weekFactor: 0.7 },
] as const;

/* ------------------------------------------------------------------ */
/* Prima e dopo: restyling di siti di strutture ricettive (di fantasia) */
/* ------------------------------------------------------------------ */

export type Makeover = {
  id: "rosa" | "nosiola" | "arcadia";
  name: string;
  place: string;
  /** Indirizzo di fantasia mostrato nella barra del browser. */
  url: string;
  verdict: string;
  fixes: { before: string; after: string }[];
};

export const makeovers: Makeover[] = [
  {
    id: "rosa",
    name: "B&B Da Rosa",
    place: "Paesino tra i vigneti",
    url: "darosatraivigneti.it",
    verdict: "Un posto bellissimo, raccontato da un sito fermo al 2014.",
    fixes: [
      { before: "Foto minuscola e sgranata", after: "Paesaggio a tutto schermo: si vende da solo" },
      { before: "\"Per prenotare telefonare ore pasti\"", after: "Date e ospiti in primo piano, si prenota in 3 tocchi" },
      { before: "Muro di testo in corpo 11", after: "Tre righe chiare: cosa offri e perché sceglierti" },
    ],
  },
  {
    id: "nosiola",
    name: "B&B La Nosiola",
    place: "Centro storico",
    url: "lanosiola.it",
    verdict: "La posizione è il punto forte, ma era sepolta sotto moduli e banner.",
    fixes: [
      { before: "Banner cookie che copre metà pagina", after: "Consenso discreto, a norma e fuori dai piedi" },
      { before: "\"Area riservata\" e login che nessuno usa", after: "Solo quello che serve all'ospite: camere, prezzi, contatti" },
      { before: "\"50 metri dalla piazza\" nascosto nel testo", after: "La posizione è il titolo, con il prezzo in vista" },
    ],
  },
  {
    id: "arcadia",
    name: "B&B Arcadia",
    place: "Giardino in città",
    url: "arcadiagiardinosegreto.it",
    verdict: "Scritte che scorrono, verde su nero e un video che non si apre più.",
    fixes: [
      { before: "Contenuto in Flash: oggi non si apre su nessun dispositivo", after: "Immagini e testi che funzionano ovunque, telefono compreso" },
      { before: "Dodici miniature sfocate", after: "Il giardino, cioè il motivo per cui ti scelgono, protagonista" },
      { before: "\"OFFERTA SPECIALE!!!\" che scorre", after: "Tono calmo, servizi chiari e WhatsApp a portata di mano" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Analisi, report e dati su commissione                                */
/* ------------------------------------------------------------------ */

/** Valore del campo "Tipo di progetto" del form per le richieste di analisi. */
export const ANALYSIS_LABEL = "Analisi, report o dati";

export type AnalysisOffer = {
  id: "concorrenza" | "siti" | "mercato" | "operatori";
  title: string;
  question: string;
  description: string;
  deliverables: string[];
  /** Prezzo "a partire da", in euro. */
  from: number;
  days: string;
  accent: "violet" | "green";
};

export const analysisOffers: AnalysisOffer[] = [
  {
    id: "concorrenza",
    title: "Analisi della concorrenza",
    question: "Chi sono i tuoi concorrenti, e cosa fanno meglio di te?",
    description:
      "Prendo i concorrenti diretti della tua zona e li metto a confronto: servizi, prezzi pubblicati, come si presentano online, dove sono forti e dove lasciano spazio a te.",
    deliverables: ["Fino a 10 concorrenti a confronto", "Prezzi e offerte pubblicate", "Punti deboli da sfruttare", "Tre mosse concrete per distinguerti"],
    from: 190,
    days: "5-7 giorni",
    accent: "violet",
  },
  {
    id: "siti",
    title: "Report dei siti di un settore",
    question: "Come si presentano online i siti della tua zona?",
    description:
      "Un sistema automatico raccoglie e legge decine di siti di un settore o di un territorio. Ognuno riceve un punteggio su 100, i difetti osservati e l'intervento consigliato.",
    deliverables: ["Da 30 a 100 siti analizzati", "Punteggio su 20 criteri", "Classifica con note sito per sito", "Versione consultabile con filtri e ricerca"],
    from: 290,
    days: "5-10 giorni",
    accent: "green",
  },
  {
    id: "mercato",
    title: "Analisi di mercato",
    question: "C'è davvero spazio per la tua idea?",
    description:
      "Prima di aprire un'attività o lanciare un servizio: quanta domanda c'è, chi la serve già, a che prezzi, e dove resta un buco da occupare. Con numeri ufficiali e fonti cliccabili.",
    deliverables: ["Dimensione del bacino con dati ufficiali", "Mappa dell'offerta esistente", "Prezzi praticati", "Opportunità e rischi, con livello di confidenza"],
    from: 390,
    days: "7-10 giorni",
    accent: "violet",
  },
  {
    id: "operatori",
    title: "Mappatura degli operatori",
    question: "Chi lavora nel tuo settore, comune per comune?",
    description:
      "L'elenco ordinato degli operatori di un settore in una zona, ricostruito da albi, elenchi pubblici e siti ufficiali: per trovare partner, fornitori o capire quanto è affollato il mercato.",
    deliverables: ["Da 50 a 200 schede", "Recapiti professionali pubblici", "Fonte indicata per ogni dato", "Foglio Excel con filtri per comune"],
    from: 150,
    days: "3-5 giorni",
    accent: "green",
  },
];

/** Numeri reali dai report già consegnati, mostrati come prova (senza nomi delle attività). */
export const analysisProof = [
  { value: 490, suffix: "", label: "siti interrogati per un solo report sull'Alto Garda" },
  { value: 24600, suffix: "", label: "studenti contati nel bacino di un'analisi di mercato" },
  { value: 38, suffix: "", label: "comuni coperti in una mappatura di 100 professionisti" },
  { value: 151, suffix: "", label: "pagine lette e valutate per 50 siti di B&B" },
];

export const analysisPrinciples = [
  { title: "Ogni dato ha la sua fonte", text: "Accanto a ogni numero c'è il link da cui viene. Puoi controllare tutto, riga per riga." },
  { title: "Dati, letture e ipotesi separati", text: "Ti dico cosa è un fatto, cosa è una mia interpretazione e cosa resta da verificare." },
  { title: "Pronto da usare", text: "PDF da leggere, versione web con ricerca e filtri, foglio Excel da lavorare." },
];
