// Cattura della pagina per il film: taglio della pagina, pezzi che si sollevano, posizioni.
import { chromium } from "playwright";
import fs from "node:fs";

const URL = process.argv[2];
const OUT = process.argv[3];
const PAD = 28;
const CHUNK = 2048;
fs.mkdirSync(`${OUT}/pieces`, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(URL, { waitUntil: "networkidle" });

// il taglio va fatto subito, prima di scorrere
await p.evaluate(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const hide = (el) => {
    if (el) el.style.display = "none";
  };
  hide($("#stack"));
  const howTo = $$("#chi-sono h3").find((h) => /come lavoro/i.test(h.textContent));
  hide(howTo ? howTo.parentElement : null);
  $$("#prima-dopo article").slice(1).forEach(hide);
  const offers = $$("#analisi article.card");
  if (offers[0]) hide(offers[0].closest(".grid"));
});
// una configurazione ricca nel preventivatore, così l'ecosistema è pieno
const pick = (t) => p.locator("#preventivo label:has(input[type=checkbox])").filter({ hasText: t }).click();
await pick("E-commerce");
await pick("Bot / automazione");
for (const x of ["Preventivatore online", "Spedizioni", "Pagamenti online", "Più lingue"]) {
  const btn = p.locator("#preventivo button:not([data-node])", { hasText: x }).first();
  if (await btn.count()) await btn.click();
}
// una volta fino in fondo, piano, così immagini e animazioni d'ingresso finiscono
for (let y = 0; y < 20000; y += 250) {
  await p.evaluate((v) => window.scrollTo(0, v), y);
  await p.waitForTimeout(170);
  const sh = await p.evaluate(() => document.documentElement.scrollHeight);
  if (y > sh) break;
}
// l'ecosistema deve finire di aprirsi mentre è sullo schermo
await p.locator('[aria-label="Mappa del tuo ecosistema"]').scrollIntoViewIfNeeded();
await p.waitForTimeout(3500);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1500);

const info = await p.evaluate(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hide = (el) => {
    if (el) el.style.display = "none";
  };

  // --- taglio per il film ---
  $$("body *").forEach((e) => {
    const cs = getComputedStyle(e);
    if (cs.position === "fixed" && !e.matches("header, header *")) e.style.display = "none";
  });
  hide($("#stack"));
  const howTo = $$("#chi-sono h3").find((h) => /come lavoro/i.test(h.textContent));
  hide(howTo ? howTo.parentElement : null);
  $$("#prima-dopo article").slice(1).forEach(hide);
  const offers = $$("#analisi article.card");
  if (offers[0]) hide(offers[0].closest(".grid"));
  document.body.classList.remove("grain");

  // --- i pezzi che si sollevano ---
  const pieces = [];
  const mark = (el, name, role) => {
    if (!el || el.hasAttribute("data-layer")) return;
    el.setAttribute("data-layer", name);
    pieces.push({ name, role });
  };
  const hero = $("#top");
  // i titoli: si alzano e si girano verso l'obiettivo quando la camera passa
  mark($("h1", hero), "h-title", "herotitle");
  for (const [sel, name] of [["#chi-sono h2", "t-chi"], ["#prima-dopo h2", "t-prima"], ["#lavori h2", "t-lavori"], ["#analisi h2", "t-analisi"], ["#preventivo h2", "t-preventivo"], ["#contatti h2", "t-contatti"]]) mark($(sel), name, "title");
  mark($$("#preventivo h3").find((h) => /Ecco cosa stai/.test(h.textContent)), "t-eco", "title");
  mark($(".mb-6.inline-flex", hero), "h-status", "chip");
  const ctaRow = $(".mt-10.flex.flex-wrap.items-center", hero);
  const ctas = ctaRow ? [...ctaRow.children] : [];
  mark(ctas[0], "h-cta", "button");
  mark(ctas[1], "h-cta2", "button");
  $$("ul.mt-10 li", hero).forEach((li, i) => mark(li, `h-point${i}`, "chip"));
  mark($(".group.relative.overflow-hidden", hero), "h-photo", "mockup");
  mark($(".absolute.top-8", hero), "h-badge-lh", "chip");
  mark($$(".absolute", hero).find((e) => /su misura/.test(e.textContent) && String(e.className).includes("bottom-24")), "h-badge-sm", "chip");

  $$("#chi-sono .card").forEach((c, i) => mark(c, `s-card${i}`, "photo"));

  const mk = $("#prima-dopo article");
  if (mk) {
    const labels = $$("*", mk).filter((e) => e.children.length === 0 && /^(prima|dopo)$/i.test(e.textContent.trim()));
    labels.forEach((l, i) => mark(l, `m-label${i}`, "flychip"));
    mark($(".overflow-hidden.rounded-2xl", mk), "m-frame", "photo");
    $$("ul li", mk).forEach((li, i) => mark(li, `m-li${i}`, "card"));
  }

  const lav = $("#lavori");
  $$("ul.mt-8 li", lav).forEach((li, i) => mark(li, `l-chip${i}`, "chip"));
  mark($(".relative.mt-12", lav), "l-phones", "photo");

  const an = $("#analisi");
  const rs = $$("div", an).find((d) => String(d.className).includes("bg-[#fbfcfd]"));
  if (rs) {
    let box = rs;
    while (box.parentElement && box.parentElement !== an && box.parentElement.getBoundingClientRect().width < 700) box = box.parentElement;
    mark(box, "a-report", "photo");
  }
  const stats = $$(".font-display", an).filter((e) => /^[\d.]+$/.test(e.textContent.trim()) && e.getBoundingClientRect().height < 90);
  stats.forEach((s, i) => mark(s.parentElement, `a-stat${i}`, "card"));

  const pv = $("#preventivo");
  mark($("aside > div", pv), "q-estimate", "testimonial");
  mark($$("button[aria-pressed]", pv).find((e) => /Preventivatore online/.test(e.textContent) && !e.hasAttribute("data-node")), "q-featured", "card");
  mark($$("div", pv).find((d) => /^È questo il progetto/.test(d.textContent.trim()) && String(d.className).includes("rounded-3xl")), "q-cta", "card");

  const ct = $("#contatti");
  $$("a[href*='wa.me'], a[href^='tel:'], a[href^='mailto:']", ct).slice(0, 3).forEach((a, i) => mark(a, `c-chan${i}`, "card"));
  const form = $("form", ct);
  mark(form, "c-form", "card");

  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  };
  const H = document.documentElement.scrollHeight;
  const out = pieces
    .map((pc) => ({ ...pc, ...rect(document.querySelector(`[data-layer="${pc.name}"]`)) }))
    .filter((pc) => pc.w > 4 && pc.h > 4);
  const sections = $$("main > section, footer")
    .filter((s) => s.offsetHeight > 0)
    .map((s) => ({ id: s.id || "footer", ...rect(s) }));
  const titles = $$("main h2, footer p, footer h2")
    .filter((e) => e.offsetHeight > 30)
    .map((e) => ({ text: e.textContent.trim().slice(0, 40), ...rect(e) }));
  return { H, pieces: out, sections, titles };
});

console.log("H", info.H, "pieces", info.pieces.length);
console.log(info.sections.map((s) => `${s.id}:${Math.round(s.y)}+${Math.round(s.h)}`).join("  "));
console.log(info.titles.map((s) => `"${s.text}" y=${Math.round(s.y)} h=${Math.round(s.h)}`).join("\n"));
console.log(info.pieces.map((q) => `${q.name}[${q.role}] ${Math.round(q.x)},${Math.round(q.y)} ${Math.round(q.w)}x${Math.round(q.h)}`).join("\n"));

// --- pagina senza i pezzi, a fette ---
await p.addStyleTag({ content: "[data-layer]{visibility:hidden!important}" });
await p.waitForTimeout(400);
const chunks = [];
for (let y = 0, i = 0; y < info.H; y += CHUNK, i++) {
  const h = Math.min(CHUNK, info.H - y);
  await p.screenshot({ path: `${OUT}/page-${i}.png`, fullPage: true, clip: { x: 0, y, width: 1440, height: h }, animations: "disabled" });
  chunks.push({ file: `page-${i}.png`, y, h });
}

// --- ogni pezzo da solo, su fondo trasparente ---
await p.addStyleTag({
  content: [
    "html.iso, html.iso body { background: transparent !important; }",
    "html.iso body * { visibility: hidden !important; }",
    "html.iso [data-active], html.iso [data-active] * { visibility: visible !important; }",
    "html.iso [data-active] [data-layer], html.iso [data-active] [data-layer] * { visibility: hidden !important; }",
    "html.iso [data-active] { box-shadow: none !important; }",
  ].join("\n"),
});
await p.evaluate(() => document.documentElement.classList.add("iso"));
for (const pc of info.pieces) {
  await p.evaluate((n) => document.querySelector(`[data-layer="${n}"]`).setAttribute("data-active", ""), pc.name);
  const clip = { x: Math.max(0, pc.x - PAD), y: Math.max(0, pc.y - PAD), width: pc.w + PAD * 2, height: pc.h + PAD * 2 };
  await p.screenshot({ path: `${OUT}/pieces/${pc.name}.png`, fullPage: true, clip, omitBackground: true, animations: "disabled" });
  await p.evaluate((n) => document.querySelector(`[data-layer="${n}"]`).removeAttribute("data-active"), pc.name);
  pc.file = `pieces/${pc.name}.png`;
  pc.clip = clip;
}
fs.writeFileSync(`${OUT}/layout.json`, JSON.stringify({ width: 1440, dpr: 2, pad: PAD, ...info, chunks }, null, 1));
await b.close();
