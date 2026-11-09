"use strict";
/*
 * "Dentro il cursore" (versione 2) — showreel di Renato Manzotti.
 * Sei manifesti, una porta ciascuno: un solo zoom in avanti, e in ogni manifesto c'è un dettaglio che contiene già,
 * dal vivo e in miniatura, il manifesto successivo. Alla fine il nome si cancella fino al cursore e il film ricomincia.
 * Tutto si calcola da t dentro window.seek(t): niente animazioni CSS, niente timer, nessuno stato tra un fotogramma e l'altro.
 */
const W = 1920, H = 1080, CX = 960, CY = 540, DUR = 20, BEAT = 0.5;
const COL = { v: "#a259ff", g: "#3dff9a", s: "#c79bff", k: "#060608", w: "#ffffff" };
const cv = document.getElementById("c");
// le scene disegnano sempre su "ctx": per il mosso lo si punta su una tela a parte, così le copie si mediano davvero
let ctx = cv.getContext("2d");
const MAIN = ctx;
const offCanvas = document.createElement("canvas");
offCanvas.width = W;
offCanvas.height = H;
const OFF = offCanvas.getContext("2d");

/* ------------------------------------------------------------------ */
/* tempo e curve                                                       */
/* ------------------------------------------------------------------ */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const expoOut = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
// molla con smorzamento critico: arriva senza rimbalzare
const spring = (t, t0, w = 24) => { const x = t - t0; return x <= 0 ? 0 : 1 - (1 + w * x) * Math.exp(-w * x); };
const kick = (t) => { const x = ((t % BEAT) + BEAT) % BEAT; return Math.exp(-x * 9); };
const font = (wgt, size) => `${Math.round(clamp(wgt, 400, 800))} ${Math.max(1, size).toFixed(1)}px Syne`;
function bg(c) { ctx.fillStyle = c; ctx.fillRect(-W * 40, -H * 40, W * 81, H * 81); }
function textW(str, wgt, size) { ctx.font = font(wgt, size); return ctx.measureText(str).width; }
const fit = (str, wgt, maxW, maxS) => Math.min(maxS, (maxS * maxW) / textW(str, wgt, maxS));
const capOf = (wgt, size) => { ctx.font = font(wgt, size); return ctx.measureText("H").actualBoundingBoxAscent; };
/** Avanza in un'altra scala attorno al centro dello schermo: la camera va sempre avanti. */
function zoomAt(s, cx = CX, cy = CY) { ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
function rr(x0, y0, x1, y1, r) { ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r); }
/** Più copie lungo una direzione, tutte con lo stesso peso: il mosso segue velocità e direzione. */
function smear(dx, dy, draw, max = 14) {
  const len = Math.hypot(dx, dy);
  if (len < 2) { draw(0, 0); return; }
  const n = Math.min(max, Math.ceil(len / 3) + 1), a0 = ctx.globalAlpha;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = a0 / (i + 1);
    const u = i / (n - 1) - 0.5;
    draw(dx * u, dy * u);
  }
  ctx.globalAlpha = a0;
}
/** Il sistema grafico dei manifesti: due righe di servizio in alto e una fascia che scorre in basso. */
function chrome(fg, left, right, t, marquee = true) {
  ctx.fillStyle = fg;
  ctx.font = font(600, 28);
  ctx.textAlign = "left";
  ctx.fillText(left, 96, 104);
  ctx.textAlign = "right";
  ctx.fillText(right, W - 96, 104);
  ctx.textAlign = "left";
  ctx.fillRect(96, 128, W - 192, 2);
  if (!marquee) return;
  ctx.fillRect(96, 962, W - 192, 2);
  const str = "siti · shop · app · bot · AI · motion · video · ";
  ctx.font = font(700, 30);
  const sw = ctx.measureText(str).width;
  ctx.save();
  ctx.beginPath();
  ctx.rect(96, 970, W - 192, 80);
  ctx.clip();
  let x = 96 - ((t * 260) % sw);
  while (x < W) { ctx.fillText(str, x, 1016); x += sw; }
  ctx.restore();
}
/** Cambio parola come un tabellone: le lettere vecchie salgono via, le nuove arrivano dal basso, una dopo l'altra. */
function roll(oldS, newS, x, base, size, wgt, color, t0, t, align = "center") {
  const top = base - size * 0.92, h = size * 1.2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-W, top, W * 4, h);
  ctx.clip();
  ctx.font = font(wgt, size);
  ctx.fillStyle = color;
  const draw = (s, out) => {
    if (!s) return;
    const tw = ctx.measureText(s).width;
    let xx = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x;
    for (let j = 0; j < s.length; j++) {
      const e = spring(t, t0 + j * 0.018, 30), e0 = spring(t - 1 / 180, t0 + j * 0.018, 30);
      const y = out ? -h * 1.1 * e : h * (1 - e), dy = (out ? -h * 1.1 : -h) * (e - e0);
      const adv = ctx.measureText(s.slice(0, j + 1)).width - ctx.measureText(s.slice(0, j)).width;
      if (Math.abs(y) < h * 1.2) smear(0, dy, (sx, sy) => ctx.fillText(s[j], xx + sx, base + y + sy));
      xx += adv;
    }
  };
  if (oldS && t < t0 + 0.4) draw(oldS, true);
  draw(newS, false);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* manifesto 1 e 6 · il campo di testo: la domanda, poi il nome         */
/* ------------------------------------------------------------------ */
const FIELD = { x0: 96, y0: 300, x1: 1824, y1: 780, r: 84 };
const SEND = { x: 1652, y: 540, r: 126 };
const TX = 196, CARET_H = 236, CARET_W = 18;
const HOOK = "Hai un'idea?";
const HOOK_T = HOOK.split("").map((_, i) => 0.5 + i * 0.042);
const CHIPS = ["un sito", "un'app", "un bot", "un video"];
const loopT = (t) => (t >= 18 ? t - 20 : t); // la stessa scena alla fine e all'inizio: il tempo attorno al giro
function fieldBase(t, opts) {
  bg(COL.k);
  chrome(COL.s, "Renato Manzotti", "siti · app · bot · AI · video", t, false);
  ctx.fillStyle = COL.s;
  rr(FIELD.x0, FIELD.y0, FIELD.x1, FIELD.y1, FIELD.r);
  ctx.fill();
  // l'invio: un disco verde con la freccia, che si preme sul battito
  const r = SEND.r * (opts.send ?? 1);
  ctx.fillStyle = COL.g;
  ctx.beginPath();
  ctx.arc(SEND.x, SEND.y, r, 0, Math.PI * 2);
  ctx.fill();
  if (!opts.open) {
    ctx.strokeStyle = COL.k;
    ctx.lineWidth = 18 * (opts.send ?? 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const a = r * 0.42;
    ctx.beginPath();
    ctx.moveTo(SEND.x - a, SEND.y); ctx.lineTo(SEND.x + a, SEND.y);
    ctx.moveTo(SEND.x + a * 0.15, SEND.y - a * 0.8); ctx.lineTo(SEND.x + a, SEND.y); ctx.lineTo(SEND.x + a * 0.15, SEND.y + a * 0.8);
    ctx.stroke();
  }
  // i suggerimenti sotto il campo
  ctx.font = font(600, 34);
  let x = FIELD.x0;
  CHIPS.forEach((c, i) => {
    const w = ctx.measureText(c).width + 64, on = opts.chip === i;
    ctx.lineWidth = 3;
    ctx.strokeStyle = on ? COL.g : COL.s;
    ctx.fillStyle = COL.g;
    rr(x, 836, x + w, 906, 35);
    if (on) ctx.fill(); else ctx.stroke();
    ctx.fillStyle = on ? COL.k : COL.w;
    ctx.fillText(c, x + 32, 883);
    x += w + 20;
  });
}
function caret(x, yc, h = CARET_H) { ctx.fillStyle = COL.k; ctx.fillRect(x, yc - h / 2, CARET_W, h); }
const HOOK_S = () => fit(HOOK, 800, 1260, 200);
function drawHook(t) {
  const u = loopT(t);
  ctx.save();
  zoomAt(1 + 0.02 * u);
  const press = spring(t, 1.5, 30) - spring(t, 1.62, 22);
  fieldBase(t, { send: 1 - 0.1 * press + 0.08 * spring(t, 1.62, 22), open: t >= 1.25, chip: t >= 1.25 ? 0 : -1 });
  const size = HOOK_S(), cap = capOf(800, size), base = CY + cap / 2;
  let x = TX, shown = 0;
  for (let i = 0; i < HOOK.length; i++) {
    if (t < HOOK_T[i]) break;
    shown = i + 1;
    // ogni lettera arriva sottile e dal basso, e diventa piena
    const e = spring(t, HOOK_T[i], 55), wg = lerp(620, 800, spring(t, HOOK_T[i], 50));
    ctx.font = font(wg, size);
    ctx.fillStyle = COL.k;
    ctx.fillText(HOOK[i], x, base + 40 * (1 - e));
    x += textW(HOOK.slice(0, i + 1), 800, size) - textW(HOOK.slice(0, i), 800, size);
  }
  const on = t >= 0.5 || t < 0.25;
  if (on) caret(shown ? x + 12 : TX, CY);
  ctx.restore();
}
const hookPortal = (t) => {
  const s = 1 + 0.02 * loopT(t), press = spring(t, 1.5, 30) - spring(t, 1.62, 22);
  return { kind: "circle", x: CX + (SEND.x - CX) * s, y: CY + (SEND.y - CY) * s, r: SEND.r * (1 - 0.1 * press + 0.08 * spring(t, 1.62, 22)) * s };
};
const TITLE = ["Renato", "Manzotti"], TAG = "siti, app e bot su misura";
function drawTitle(t) {
  ctx.save();
  // atterraggio a molla, poi avanti piano fino a ritrovarsi nel primo fotogramma
  zoomAt(1 + 0.02 * loopT(t) + 0.03 * (spring(t, 18, 10) - 1));
  fieldBase(t, { chip: t >= 19.0 && t < 19.5 ? 2 : -1 });
  const size = fit("Manzotti", 800, 1180, 196), cap = capOf(800, size), gap = cap * 0.42;
  const b1 = CY - (cap * 2 + gap) / 2 + cap, b2 = b1 + cap + gap;
  // il nome cambia peso sul battito: pieno, sottile, pieno
  const wg = 800 - 360 * spring(t, 18.75, 24) + 360 * spring(t, 19.0, 24);
  // la cancellazione: lettera per lettera dalla fine, alla velocità di un tasto tenuto premuto
  const total = TITLE[0].length + TITLE[1].length;
  const del = Math.floor(clamp((t - 19.5) / 0.03, 0, total));
  const keep = total - del;
  const l1 = TITLE[0].slice(0, Math.min(TITLE[0].length, keep)), l2 = TITLE[1].slice(0, Math.max(0, keep - TITLE[0].length));
  ctx.fillStyle = COL.k;
  ctx.font = font(wg, size);
  ctx.fillText(l1, TX, b1);
  ctx.fillText(l2, TX, b2);
  // il titolo di servizio sopra il campo
  const tagN = Math.floor(clamp((t - 18.25) / 0.012, 0, TAG.length)) - Math.floor(clamp((t - 19.5) / 0.016, 0, TAG.length));
  const tg = TAG.slice(0, Math.max(0, tagN));
  ctx.font = font(700, 64);
  const cut = Math.min(tg.length, 16);
  ctx.fillStyle = COL.w;
  ctx.fillText(tg.slice(0, cut), FIELD.x0, 262);
  if (tg.length > cut) { ctx.fillStyle = COL.g; ctx.fillText(tg.slice(cut), FIELD.x0 + ctx.measureText(tg.slice(0, cut)).width, 262); }
  // il cursore: in fondo a quello che resta; quando non resta niente torna dov'era all'inizio
  let cx, cy, ch = CARET_H;
  if (l2.length) { cx = TX + textW(l2, wg, size) + 12; cy = b2 - cap / 2; }
  else if (l1.length) { cx = TX + textW(l1, wg, size) + 12; cy = b1 - cap / 2; }
  else { cx = TX; cy = CY; }
  const home = spring(t, 19.88, 40);
  if (keep > 0 || t < 19.88) ch = lerp(cap * 1.32, CARET_H, home); else ch = CARET_H;
  caret(cx, lerp(cy, CY, keep === 0 ? home : 0), ch);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* manifesto 2 · tipografia: una parola, tutto lo schermo               */
/* ------------------------------------------------------------------ */
const POSTERS = [
  { t: 2.0, w: "SITI", bg: COL.g, fg: COL.k, acc: "track" },
  { t: 2.5, w: "SHOP", bg: COL.v, fg: COL.w, acc: "skew" },
  { t: 3.0, w: "APP", bg: COL.k, fg: COL.g, acc: "wide" },
  { t: 3.5, w: "BOT", bg: COL.w, fg: COL.v, acc: "bold" },
  { t: 4.0, w: "AI", bg: COL.s, fg: COL.k, acc: "scale" },
  { t: 4.5, w: "MOTION", bg: COL.g, fg: COL.k, acc: "thin" },
  { t: 5.0, w: "VIDEO", bg: COL.k, fg: COL.w, acc: "portal" },
];
function videoGeom(t) {
  const P = POSTERS[6], size = fit("VIDEO", 800, 1640, 700), cap = capOf(800, size);
  const tw = textW("VIDEO", 800, size), x0 = CX - tw / 2 - 30 * (t - P.t), base = CY + cap / 2 + 20;
  ctx.font = font(800, size);
  const m = ctx.measureText("O"), wv = textW("VIDE", 800, size);
  const rx = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / 2, ry = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2;
  const ox = x0 + wv - m.actualBoundingBoxLeft + rx, oy = base - m.actualBoundingBoxAscent + ry;
  // la O si apre: diventa un anello più largo e più sottile, e dentro c'è già la scena dopo
  const g = spring(t, 5.25, 22), th = lerp(rx * 0.42, rx * 0.16, g);
  return { size, base, x0, ox, oy, rx: rx * (1 + 0.12 * g), ry: ry * (1 + 0.12 * g), th };
}
function drawPoster(i, t) {
  const P = POSTERS[i];
  bg(P.bg);
  chrome(P.fg, `servizi — ${String(i + 1).padStart(2, "0")}/07`, "Renato Manzotti", t);
  const a = spring(t, P.t + 0.25, 24), drift = -30 * (t - P.t);
  ctx.fillStyle = P.fg;
  if (P.acc === "portal") {
    const v = videoGeom(t);
    ctx.font = font(800, v.size);
    ctx.fillText("VIDE", v.x0, v.base);
    ctx.beginPath();
    ctx.ellipse(v.ox, v.oy, v.rx, v.ry, 0, 0, Math.PI * 2);
    ctx.ellipse(v.ox, v.oy, v.rx - v.th, v.ry - v.th, 0, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    return;
  }
  let wgt = 800, ls = 0, sx = 1, sk = 0, sc = 1;
  if (P.acc === "track") { wgt = lerp(800, 430, a); ls = 1; }
  if (P.acc === "skew") sk = -0.26 * a;
  if (P.acc === "wide") { sx = lerp(1, 0.72, a); }
  if (P.acc === "bold") wgt = lerp(430, 800, a);
  if (P.acc === "scale") sc = 1 + 0.14 * a;
  if (P.acc === "thin") { wgt = lerp(800, 430, a); ls = 1; }
  const size = fit(P.w, 800, P.acc === "wide" ? 1500 : 1640, P.w.length <= 2 ? 760 : 700), cap = capOf(800, size);
  // più sottile ma larga uguale: la spaziatura compensa il peso che cala
  if (ls) ls = (textW(P.w, 800, size) - textW(P.w, wgt, size)) / P.w.length;
  ctx.letterSpacing = `${ls.toFixed(1)}px`;
  ctx.font = font(wgt, size);
  const tw = ctx.measureText(P.w).width;
  ctx.save();
  ctx.translate(CX + drift, CY + cap / 2 + 20);
  ctx.transform(sx * sc, 0, -sk * sc, sc, 0, 0);
  ctx.translate(0, -cap / 2 * (sc - 1) / sc);
  ctx.fillText(P.w, -tw / 2, 0);
  ctx.restore();
  ctx.letterSpacing = "0px";
}
/** Il manifesto nuovo arriva a fessure: dodici strisce orizzontali, ognuna con la sua molla, sfondo compreso. */
function drawType(t) {
  const T = Math.max(t, 2.0);
  let i = 0;
  while (i < POSTERS.length - 1 && T >= POSTERS[i + 1].t) i++;
  ctx.save();
  zoomAt(1 + 0.03 * spring(T, 2.0, 10) + 0.01 * (T - 2));
  const P = POSTERS[i], dir = i % 2 ? -1 : 1, n = 12;
  if (i === 0 || T - P.t > 0.3) { drawPoster(i, T); ctx.restore(); return; }
  drawPoster(i - 1, T);
  for (let j = 0; j < n; j++) {
    const k = dir > 0 ? j : n - 1 - j;
    const st = P.t + k * 0.009, off = (1 - spring(T, st, 34)) * W * 1.05 * dir, off0 = (1 - spring(T - 1 / 180, st, 34)) * W * 1.05 * dir;
    if (Math.abs(off) > W) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-W, (H * j) / n - 0.5, W * 3, H / n + 1);
    ctx.clip();
    smear(off - off0, 0, (sx) => { ctx.save(); ctx.translate(off + sx, 0); drawPoster(i, T); ctx.restore(); }, 7);
    ctx.restore();
  }
  ctx.restore();
}
const typePush = (t) => 1 + 0.03 * spring(t, 2.0, 10) + 0.01 * (t - 2);
const typePortal = (t) => {
  const v = videoGeom(t), s = typePush(t);
  return { kind: "ellipse", x: CX + (v.ox - CX) * s, y: CY + (v.oy - CY) * s, rx: (v.rx - v.th) * s, ry: (v.ry - v.th) * s };
};

/* ------------------------------------------------------------------ */
/* manifesto 3 · le forme piene, poi il telefono in 3D                  */
/* ------------------------------------------------------------------ */
const NPT = 240;
function resample(pts) {
  // parte dal punto più in alto al centro e gira in senso orario
  let start = 0, best = 1e9;
  pts.forEach((p, i) => { const s = Math.abs(p[0]) * 0.02 + p[1]; if (s < best) { best = s; start = i; } });
  const P = [...pts.slice(start), ...pts.slice(0, start)];
  P.push(P[0]);
  const len = [0];
  for (let i = 1; i < P.length; i++) len.push(len[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const total = len[len.length - 1], out = [];
  let j = 0;
  for (let k = 0; k < NPT; k++) {
    const d = (k / NPT) * total;
    while (len[j + 1] < d) j++;
    const u = (d - len[j]) / (len[j + 1] - len[j] || 1);
    out.push([lerp(P[j][0], P[j + 1][0], u), lerp(P[j][1], P[j + 1][1], u)]);
  }
  return out;
}
function arcPts(cx, cy, r, a0, a1, n = 18) { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
function rrect(w, h, r) {
  const x = w / 2, y = h / 2, P = Math.PI;
  return [...arcPts(x - r, -y + r, r, -P / 2, 0), ...arcPts(x - r, y - r, r, 0, P / 2), ...arcPts(-x + r, y - r, r, P / 2, P), ...arcPts(-x + r, -y + r, r, P, P * 1.5)];
}
function bag() {
  const tw = 520, bw = 680, h = 600, r = 44, P = Math.PI;
  return [...arcPts(tw / 2 - r, -h / 2 + r, r, -P / 2, -0.2), ...arcPts(bw / 2 - r, h / 2 - r, r, 0.1, P / 2), ...arcPts(-bw / 2 + r, h / 2 - r, r, P / 2, P - 0.1), ...arcPts(-tw / 2 + r, -h / 2 + r, r, P + 0.2, P * 1.5)].map(([x, y]) => [x, y + 60]);
}
function bubble() {
  const w = 940, h = 560, r = 130, x = w / 2, y = h / 2, P = Math.PI;
  return [...arcPts(x - r, -y + r, r, -P / 2, 0), ...arcPts(x - r, y - r, r, 0, P / 2), [-x + 300, y], [-x + 120, y + 170], [-x + 150, y], ...arcPts(-x + r, y - r, r, P / 2, P).slice(6), ...arcPts(-x + r, -y + r, r, P, P * 1.5)].map(([a, b]) => [a, b - 60]);
}
const circle = (r) => arcPts(0, 0, r, -Math.PI / 2, Math.PI * 1.5, 120).slice(0, -1);
function star(r) {
  const o = [];
  for (let i = 0; i < 200; i++) {
    const a = -Math.PI / 2 + (i / 200) * Math.PI * 2, k = Math.pow(Math.abs(Math.cos(2 * a)), 2.4);
    o.push([Math.cos(a) * lerp(r * 0.24, r, k), Math.sin(a) * lerp(r * 0.24, r, k)]);
  }
  return o;
}
const PHONE_W = 440, PHONE_H = 900, PHONE_R = 72;
const SHP = {
  web: resample(rrect(1000, 640, 44)),
  shop: resample(bag()),
  app: resample(rrect(430, 820, 70)),
  bot: resample(bubble()),
  video: resample(circle(390)),
  ai: resample(star(420)),
  phone: resample(rrect(PHONE_W, PHONE_H, PHONE_R)),
};
const MORPH = [
  { t: 6.0, sh: "web", col: COL.w, label: "web" },
  { t: 6.5, sh: "shop", col: COL.g, label: "shop" },
  { t: 7.0, sh: "app", col: COL.s, label: "app" },
  { t: 7.5, sh: "bot", col: COL.v, label: "bot" },
  { t: 8.0, sh: "video", col: COL.g, label: "video" },
  { t: 8.5, sh: "ai", col: COL.v, label: "AI" },
  { t: 9.0, sh: "phone", col: COL.w, label: "" },
];
const HERO = [700, 560];
function morphState(t) {
  let i = 0;
  while (i < MORPH.length - 1 && t >= MORPH[i + 1].t) i++;
  const K = MORPH[i], Pm = MORPH[Math.max(0, i - 1)], m = i === 0 ? 1 : spring(t, K.t, 26);
  const a = SHP[Pm.sh], b = SHP[K.sh];
  const pts = a.map((p, j) => [lerp(p[0], b[j][0], m), lerp(p[1], b[j][1], m)]);
  const c = spring(t, 9.0, 18);
  return { i, K, m, pts, cx: lerp(HERO[0], CX, c), cy: lerp(HERO[1], CY, c), center: c };
}
function heroPath(S, keep = false) {
  if (!keep) ctx.beginPath();
  S.pts.forEach(([x, y], j) => (j ? ctx.lineTo(S.cx + x, S.cy + y) : ctx.moveTo(S.cx + x, S.cy + y)));
  ctx.closePath();
}
// i dettagli ritagliati: entrano sul mezzo battito, quando la forma è arrivata
function details(S, t) {
  const K = S.K, d = spring(t, K.t + 0.25, 30), x = S.cx, y = S.cy;
  if (d < 0.01 && K.sh !== "phone") return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COL.k;
  const pop = (fn, k = d) => { ctx.save(); ctx.scale(k, k); fn(); ctx.restore(); };
  if (K.sh === "web") pop(() => {
    for (const cx of [-420, -370, -320]) { ctx.beginPath(); ctx.arc(cx, -250, 17, 0, Math.PI * 2); ctx.fill(); }
    rr(-260, -268, 440, -232, 18); ctx.fill();
    rr(-440, -170, 440, 60, 26); ctx.fill();
    rr(-440, 110, 120, 140, 15); ctx.fill();
    rr(-440, 180, -40, 210, 15); ctx.fill();
    rr(200, 110, 440, 250, 22); ctx.fill();
  });
  if (K.sh === "shop") {
    ctx.strokeStyle = COL.g; ctx.lineWidth = 46; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0, -240, 150 * d, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    pop(() => { ctx.beginPath(); ctx.arc(0, 80, 120, 0, Math.PI * 2); ctx.fill(); });
  }
  if (K.sh === "app") pop(() => { rr(-170, -360, 170, 360, 44); ctx.fill(); ctx.fillStyle = COL.s; rr(-130, -300, 130, -120, 26); ctx.fill(); rr(-130, -80, 130, 0, 20); ctx.fill(); rr(-130, 40, 40, 90, 20); ctx.fill(); });
  if (K.sh === "bot") pop(() => { for (const cx of [-200, 0, 200]) { ctx.beginPath(); ctx.arc(cx, -60, 54, 0, Math.PI * 2); ctx.fill(); } });
  if (K.sh === "video") pop(() => { ctx.beginPath(); ctx.moveTo(-100, -160); ctx.lineTo(180, 0); ctx.lineTo(-100, 160); ctx.closePath(); ctx.fill(); });
  if (K.sh === "ai") pop(() => { ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill(); });
  if (K.sh === "phone") {
    // lo schermo e la sua app: gli stessi strati che tra poco si staccheranno in 3D
    const s1 = spring(t, 9.25, 26), s2 = spring(t, 9.5, 26);
    if (s1 > 0.01) pop(() => { rr(-PHONE_W / 2 + 26, -PHONE_H / 2 + 26, PHONE_W / 2 - 26, PHONE_H / 2 - 26, PHONE_R - 22); ctx.fill(); }, s1);
    if (s2 > 0.01) for (const L of LAYERS) pop(() => drawLayer2D(L), s2);
  }
  ctx.restore();
}
const LAYERS = [
  { x0: -180, y0: -390, x1: 180, y1: -320, c: COL.v, z: 90 },
  { x0: -180, y0: -290, x1: 180, y1: -60, c: COL.g, z: 200 },
  { x0: -180, y0: -30, x1: 180, y1: 172, c: COL.s, z: 320, score: true },
  { x0: -180, y0: 210, x1: 180, y1: 290, c: COL.v, z: 430 },
  { x0: -110, y0: 340, x1: 110, y1: 380, c: COL.w, z: 150, dots: true },
];
function drawLayer2D(L) {
  ctx.fillStyle = L.c;
  if (L.dots) { for (const cx of [-80, 0, 80]) { ctx.beginPath(); ctx.arc(cx, 360, 18, 0, Math.PI * 2); ctx.fill(); } return; }
  rr(L.x0, L.y0, L.x1, L.y1, 22);
  ctx.fill();
  if (L.score) scoreText(L);
}
function scoreText(L) {
  ctx.fillStyle = COL.k;
  ctx.font = font(800, 120);
  ctx.textAlign = "center";
  ctx.fillText("100", (L.x0 + L.x1) / 2, L.y1 - 52);
  ctx.textAlign = "left";
}
/** La parola accanto alla forma: bianca sul nero, nera dove passa sopra la forma. */
function labelOverShape(S, t) {
  const K = S.K, prev = MORPH[Math.max(0, S.i - 1)], out = spring(t, 9.0, 22);
  if (out > 0.999) return;
  const x = 1060 + out * 900, base = 650, size = Math.min(300, fit(K.label || "app", 800, 760, 300));
  const draw = (color) => roll(S.i === 0 ? "" : prev.label, K.label, x, base, size, 800, color, K.t, t, "left");
  ctx.save();
  ctx.beginPath();
  ctx.rect(-W, -H, W * 3, H * 3);
  heroPath(S, true);
  ctx.clip("evenodd");
  draw(COL.w);
  ctx.restore();
  ctx.save();
  heroPath(S);
  ctx.clip();
  draw(COL.k);
  ctx.restore();
}
function tokens(S, t) {
  const out = spring(t, 9.0, 22);
  if (out > 0.999) return;
  ctx.save();
  ctx.translate(0, out * 260);
  MORPH.slice(0, 6).forEach((M, j) => {
    const on = j === Math.min(5, S.i), x = 1150 + j * 120, y = 1000, s = 0.075;
    ctx.beginPath();
    SHP[M.sh].forEach(([px, py], q) => (q ? ctx.lineTo(x + px * s, y + py * s) : ctx.moveTo(x + px * s, y + py * s)));
    ctx.closePath();
    if (on) { ctx.fillStyle = M.col; ctx.fill(); } else { ctx.strokeStyle = COL.s; ctx.lineWidth = 2.5; ctx.stroke(); }
  });
  ctx.restore();
}

// il 3D: proiezione prospettica, prismi estrusi e ombreggiatura a scalini di palette
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => mul(a, 1 / (Math.hypot(...a) || 1));
function camera3(target, az, el, dist, F) {
  const pos = addv(target, mul([Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)], dist));
  const fw = norm(sub(target, pos)), right = norm(cross(fw, [0, 1, 0])), up = cross(right, fw);
  return { pos, p(v) { const d = sub(v, pos), z = dot(d, fw); return [CX + (F * dot(d, right)) / z, CY - (F * dot(d, up)) / z, z]; } };
}
const LIGHT = norm([-0.5, 0.7, 0.55]);
// niente sfumature: ogni faccia prende un colore della palette secondo quanto guarda la luce
const tone = (n, lit, mid, dark) => { const d = dot(n, LIGHT); return d > 0.35 ? lit : d > -0.1 ? mid : dark; };
/** Un prisma: contorno 2D (y in basso) sul piano (U,V), spessore lungo N. Restituisce le facce da disegnare. */
function prismFaces(cam, c, U, V, N, outline, depth, front, tones) {
  const to3 = ([x, y], n) => addv(addv(addv(c, mul(U, x)), mul(V, -y)), mul(N, n));
  const F0 = outline.map((p) => to3(p, depth / 2)), B0 = outline.map((p) => to3(p, -depth / 2));
  const faces = [];
  if (depth > 0.5) {
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length, a = F0[i], b = F0[j], cc = B0[j], d = B0[i];
      const mid = mul(addv(addv(a, b), addv(cc, d)), 0.25);
      let n = norm(cross(sub(b, a), sub(d, a)));
      if (dot(n, sub(mid, c)) < 0) n = mul(n, -1);
      if (dot(n, sub(cam.pos, mid)) <= 0) continue;
      faces.push({ q: [a, b, cc, d], color: tone(n, ...tones) });
    }
  }
  const facing = dot(N, sub(cam.pos, c)) > 0;
  faces.push({ q: facing ? F0 : B0, color: front, cap: true });
  return faces;
}
function fillQuad(cam, q, color) {
  const P = q.map((v) => cam.p(v));
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  return P;
}
function cam3(t) {
  const az = -0.62 * spring(t, 10.0, 9) + 1.2 * spring(t, 11.5, 9) - 0.58 * spring(t, 12.75, 14);
  const el = 0.22 * spring(t, 10.0, 9) - 0.12 * spring(t, 11.5, 9) - 0.1 * spring(t, 12.75, 14);
  const dist = 2000 - 160 * spring(t, 10.0, 6) + 160 * spring(t, 12.75, 14);
  return camera3([0, 0, 0], az, el, dist, 2000);
}
const TILES = [
  [-980, -400, -600, 120, COL.g, "c"], [880, -380, -500, 150, COL.s, "r"], [-760, -460, 300, 90, COL.v, "r"], [820, 380, 260, 110, COL.w, "c"],
  [-1150, 60, 900, 170, COL.s, "r"], [1100, -40, 1000, 160, COL.g, "c"], [-420, 640, 1150, 120, COL.v, "c"], [500, -660, 1250, 130, COL.s, "r"],
];
function drawPhone3D(t) {
  bg(COL.k);
  const cam = cam3(t), depth = 76 * spring(t, 10.0, 14);
  const items = [];
  // la parola enorme dietro, su un piano lontano: si muove meno di tutto il resto
  items.push({ z: cam.p([0, 0, -1100])[2], draw: () => {
    const o = cam.p([0, 0, -1100]), ex = cam.p([100, 0, -1100]), ey = cam.p([0, -100, -1100]);
    ctx.save();
    ctx.transform((ex[0] - o[0]) / 100, (ex[1] - o[1]) / 100, (ey[0] - o[0]) / 100, (ey[1] - o[1]) / 100, o[0], o[1]);
    const wg = 800 - 380 * spring(t, 12.5, 22) + 380 * spring(t, 13.0, 22);
    ctx.font = font(wg, 800);
    ctx.fillStyle = COL.v;
    ctx.textAlign = "center";
    ctx.fillText(t < 11 ? "3D" : t < 12 ? "UI" : "APP", 0, 280);
    ctx.textAlign = "left";
    ctx.restore();
  } });
  // tessere che galleggiano, alcune passano davanti all'obiettivo
  TILES.forEach(([x, y, z, r, c, kind], i) => {
    const pop = spring(t, 10.25 + i * 0.04, 20);
    if (pop < 0.01) return;
    const a = t * 0.6 + i;
    const outline = kind === "c" ? circle(r * pop).filter((_, q) => q % 6 === 0) : rrect(r * 1.6 * pop, r * pop, 18);
    const N = norm([Math.sin(a) * 0.5, Math.cos(a * 0.7) * 0.4, 1]);
    const U = norm(cross([0, 1, 0], N)), V = cross(N, U);
    const c3 = [x, y + 40 * Math.sin(t * 1.3 + i), z];
    items.push({ z: cam.p(c3)[2], draw: () => prismFaces(cam, c3, U, V, N, outline, 34, c, [COL.w, COL.s, COL.v]).forEach((f) => fillQuad(cam, f.q, f.color)) });
  });
  // il telefono: corpo bianco, schermo nero, strati dell'app che si staccano in avanti
  const body = rrect(PHONE_W, PHONE_H, PHONE_R);
  items.push({ z: cam.p([0, 0, 0])[2], draw: () => {
    prismFaces(cam, [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], body, depth, COL.w, [COL.s, COL.v, COL.v]).forEach((f) => fillQuad(cam, f.q, f.color));
    const sc = rrect(PHONE_W - 52, PHONE_H - 52, PHONE_R - 22).map(([x, y]) => [x, y, depth / 2 + 1]);
    fillQuad(cam, sc.map(([x, y, z]) => [x, -y, z]), COL.k);
  } });
  LAYERS.forEach((L, i) => {
    const ex = spring(t, 11.0 + i * 0.05, 13) - spring(t, 12.75 + i * 0.03, 16);
    // sul mezzo battito gli strati si aprono anche di lato, a ventaglio
    const fan = (i - 2) * 80 * (spring(t, 12.25, 20) - spring(t, 12.75, 18));
    const z = depth / 2 + 4 + L.z * 0.75 * ex, cx = (L.x0 + L.x1) / 2 + fan, cy = (L.y0 + L.y1) / 2;
    const c3 = [cx, -cy, z];
    items.push({ z: cam.p(c3)[2] - 1, draw: () => {
      if (L.dots) {
        for (const dx of [-80, 0, 80]) prismFaces(cam, [dx, -360, z], [1, 0, 0], [0, 1, 0], [0, 0, 1], circle(18).filter((_, q) => q % 6 === 0), 12, L.c, [COL.w, COL.s, COL.v]).forEach((f) => fillQuad(cam, f.q, f.color));
        return;
      }
      const out = rrect(L.x1 - L.x0, L.y1 - L.y0, 22);
      const faces = prismFaces(cam, c3, [1, 0, 0], [0, 1, 0], [0, 0, 1], out, 14 + 10 * ex, L.c, [COL.w, COL.s, COL.v]);
      faces.forEach((f) => fillQuad(cam, f.q, f.color));
      if (L.score) {
        // il "100" sulla scheda, steso sul piano della scheda
        const o = cam.p([cx, -cy, z + 8]), ux = cam.p([cx + 100, -cy, z + 8]), uy = cam.p([cx, -cy - 100, z + 8]);
        ctx.save();
        ctx.transform((ux[0] - o[0]) / 100, (ux[1] - o[1]) / 100, (uy[0] - o[0]) / 100, (uy[1] - o[1]) / 100, o[0], o[1]);
        scoreText({ x0: L.x0 - cx, x1: L.x1 - cx, y1: L.y1 - cy });
        ctx.restore();
      }
    } });
  });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.draw();
}
function drawShapes(t) {
  const T = Math.max(t, 6.0);
  ctx.save();
  zoomAt(1 + 0.03 * spring(T, 6.0, 10) + 0.008 * (T - 6));
  if (T >= 10.0) { ctx.restore(); ctx.save(); zoomAt(1 + 0.03 + 0.008 * 4); drawPhone3D(T); ctx.restore(); return; }
  bg(COL.k);
  const S = morphState(T);
  chrome(COL.s, `cosa faccio — ${String(Math.min(6, S.i + 1)).padStart(2, "0")}/06`, "Renato Manzotti", T, false);
  // la forma, con il mosso del suo cambio
  ctx.fillStyle = S.K.sh === "phone" ? COL.w : S.m < 0.5 ? MORPH[Math.max(0, S.i - 1)].col : S.K.col;
  heroPath(S);
  ctx.fill();
  details(S, T);
  labelOverShape(S, T);
  tokens(S, T);
  ctx.restore();
}
const phonePush = () => 1 + 0.03 + 0.008 * 4;
const phonePortal = (t) => {
  const cam = cam3(t), depth = 76, L = LAYERS[2], s = phonePush();
  const ex = spring(t, 11.0 + 2 * 0.05, 13) - spring(t, 12.75 + 2 * 0.03, 16), z = depth / 2 + 4 + L.z * 0.75 * ex + 7 + 10 * ex;
  const a = cam.p([L.x0, -L.y0, z]), b = cam.p([L.x1, -L.y1, z]);
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
  return { kind: "rect", x: CX + (x0 - CX) * s, y: CY + (y0 - CY) * s, w: (x1 - x0) * s, h: (y1 - y0) * s, r: 22 * s };
};

/* ------------------------------------------------------------------ */
/* manifesto 4 · i dati: un 100 enorme e un anello che si riempie       */
/* ------------------------------------------------------------------ */
const METRICS = [{ t: 14.0, n: "velocità" }, { t: 14.25, n: "SEO" }, { t: 14.75, n: "accessibile" }];
const RING = { x: 1430, y: 520, R: 320, th: 104 };
const dataPush = (t) => 1 + 0.03 * spring(t, 14.0, 10) + 0.01 * (t - 14);
function drawData(t) {
  const T = Math.max(t, 14.0);
  ctx.save();
  zoomAt(dataPush(T));
  bg(COL.g);
  chrome(COL.k, "Lighthouse — risultati", "Renato Manzotti", T);
  let i = 0;
  while (i < METRICS.length - 1 && T >= METRICS[i + 1].t) i++;
  const M = METRICS[i];
  // ogni metrica riparte da zero e atterra sul 100 esattamente sul battito
  const f = i === 0 ? 1 : expoOut(prog(T, M.t, M.t + 0.25));
  const f0 = i === 0 ? 1 : expoOut(prog(T - 1 / 180, M.t, M.t + 0.25));
  const val = Math.round(100 * f);
  const size = fit("100", 800, 900, 560), base = 690;
  ctx.fillStyle = COL.k;
  ctx.font = font(800, size);
  smear(0, (f - f0) * -120, (sx, sy) => ctx.fillText(String(val), 104, base + sy));
  roll(i ? METRICS[i - 1].n : "", M.n, 112, 860, 116, 800, COL.k, i ? M.t : 13.0, T, "left");
  // l'anello: binario sottile, riempimento pieno viola
  ctx.strokeStyle = COL.k;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(RING.x, RING.y, RING.R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = COL.v;
  ctx.lineWidth = RING.th;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.arc(RING.x, RING.y, RING.R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.0001, f));
  ctx.stroke();
  // le tre barre in alto a destra: una per metrica
  METRICS.forEach((m, j) => {
    const v = j < i ? 1 : j === i ? f : 0, x = 1260, y = 176 + j * 34;
    ctx.fillStyle = COL.k;
    ctx.fillRect(x, y, 560, 4);
    ctx.fillRect(x, y - 8, 560 * v, 20);
  });
  ctx.restore();
}
const dataPortal = (t) => { const s = dataPush(t); return { kind: "circle", x: CX + (RING.x - CX) * s, y: CY + (RING.y - CY) * s, r: (RING.R - RING.th / 2) * s }; };

/* ------------------------------------------------------------------ */
/* manifesto 5 · la rete del preventivatore: il volo                    */
/* ------------------------------------------------------------------ */
const NAMES = ["sito", "shop", "app", "bot", "AI", "video", "SEO", "motion", "ordini", "chat", "prenota", "paga", "catalogo", "login", "recensioni", "newsletter", "dominio", "hosting", "Google", "WhatsApp", "Instagram", "Maps", "TikTok", "email"];
const PAL = [COL.v, COL.g, COL.s, COL.w];
const NODES = [{ id: "tu", p: [0, 0, 700], r: 120, c: COL.w }];
NAMES.forEach((id, i) => {
  // i primi quattro attorno a "tu", poi una spirale che si stringe verso il fondo
  const first = i < 4, a = first ? Math.PI / 4 + (i * Math.PI) / 2 : i * 2.39996 + 0.6;
  const z = first ? 980 : 1180 + (i - 4) * 135, rad = first ? 520 : 470 + 150 * Math.sin(i * 1.7);
  NODES.push({ id, p: [Math.cos(a) * rad * 1.25, Math.sin(a) * rad * 0.78, z], r: first ? 100 : 96 + (i % 4) * 14, c: PAL[i % 4], from: first ? "tu" : NAMES[i - 4] });
});
// il fondo: "clienti", con i canali attorno
NODES.push({ id: "clienti", p: [0, 0, 4150], r: 300, c: COL.g, from: "Maps" });
const DOTS = Array.from({ length: 44 }, (_, i) => {
  const a = i * 2.39996, d = 380 + ((i * 397) % 700);
  return { p: [Math.cos(a) * d * 1.3, Math.sin(a) * d * 0.8, 800 + i * 90], r: 14 + (i % 3) * 6, c: [COL.s, COL.v, COL.w][i % 3] };
});
const NODE = Object.fromEntries(NODES.map((n) => [n.id, n]));
const netPush = (t) => 1 + 0.025 * spring(t, 16.0, 10);
function netCam(t) {
  const z = 380 * spring(t, 16.0, 7) + 3420 * Math.pow(prog(t, 16.15, 17.75), 1.65);
  const roll = 0.15 * spring(t, 16.5, 10) - 0.3 * spring(t, 17.0, 10) + 0.15 * spring(t, 17.45, 12);
  const x = 110 * Math.sin((t - 16) * 2.4) * (1 - prog(t, 17.2, 17.6)), y = -60 * Math.sin((t - 16) * 1.7) * (1 - prog(t, 17.2, 17.6));
  return { x, y, z, roll, F: 1100 };
}
function pj(c, p) {
  const dz = p[2] - c.z;
  if (dz < 60) return null;
  const s = c.F / dz, x = (p[0] - c.x) * s, y = (p[1] - c.y) * s, cr = Math.cos(c.roll), sr = Math.sin(c.roll);
  return [CX + x * cr - y * sr, CY + x * sr + y * cr, s];
}
const popT = (n) => (n.p[2] <= 1300 ? 15.0 : 16.0 + (n.p[2] - 1300) * 0.0004);
function drawNet(t) {
  const T = Math.max(t, 16.0);
  ctx.save();
  zoomAt(netPush(T));
  bg(COL.k);
  const c = netCam(T);
  // i collegamenti: si tracciano dal genitore al figlio
  ctx.strokeStyle = COL.s;
  ctx.lineCap = "round";
  for (const n of NODES) {
    if (!n.from) continue;
    const a = pj(c, NODE[n.from].p), b = pj(c, n.p);
    if (!a || !b) continue;
    const g = n.p[2] <= 1300 ? spring(T, 16.25, 18) : spring(T, popT(n) + 0.08, 18);
    if (g < 0.01) continue;
    ctx.lineWidth = Math.max(1.5, 5 * Math.min(a[2], b[2]));
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(lerp(a[0], b[0], g), lerp(a[1], b[1], g));
    ctx.stroke();
  }
  // i nodi dal più lontano al più vicino: dischi pieni con l'etichetta dentro
  const all = [...DOTS.map((d) => ({ ...d, dot: true })), ...NODES];
  all.sort((a, b) => b.p[2] - a.p[2]);
  for (const n of all) {
    const q = pj(c, n.p);
    if (!q) continue;
    const pop = n.dot ? spring(T, 16.0 + (n.p[2] % 400) * 0.001, 16) : spring(T, popT(n), 22);
    const r = n.r * q[2] * pop;
    if (r < 0.5 || q[0] + r < -200 || q[0] - r > W + 200 || q[1] + r < -200 || q[1] - r > H + 200) continue;
    ctx.fillStyle = n.c;
    ctx.beginPath();
    ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
    ctx.fill();
    if (n.dot) continue;
    if (n.id === "clienti" && T >= 17.25) {
      // il disco diventa un anello: dentro c'è già il titolo
      ctx.fillStyle = COL.k;
      ctx.beginPath();
      ctx.arc(q[0], q[1], r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const fs = (n.id.length > 6 ? 0.34 : 0.44) * r;
    if (fs < 6) continue;
    ctx.font = font(800, fs);
    ctx.fillStyle = n.c === COL.v ? COL.w : COL.k;
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(q[0], q[1]);
    ctx.rotate(c.roll);
    ctx.fillText(n.id, 0, fs * 0.36);
    ctx.restore();
    ctx.textAlign = "left";
    if (n.id === "tu") {
      // il preventivo: un cartellino che si stacca dal nodo
      const k = spring(T, 16.25, 26);
      if (k > 0.01 && q[2] < 2.6) {
        const s = q[2] * k;
        ctx.save();
        ctx.translate(q[0], q[1]);
        ctx.rotate(c.roll);
        ctx.fillStyle = COL.g;
        rr(-150 * s, r + 26 * s, 150 * s, r + 106 * s, 40 * s);
        ctx.fill();
        ctx.fillStyle = COL.k;
        ctx.font = font(800, 46 * s);
        ctx.textAlign = "center";
        ctx.fillText("4.300 €", 0, r + 82 * s);
        ctx.textAlign = "left";
        ctx.restore();
      }
    }
  }
  chrome(COL.s, "il tuo preventivo — la rete", "Renato Manzotti", T, false);
  ctx.restore();
}
const netPortal = (t) => {
  const c = netCam(t), q = pj(c, NODE.clienti.p), s = netPush(t);
  return { kind: "circle", x: CX + (q[0] - CX) * s, y: CY + (q[1] - CY) * s, r: NODE.clienti.r * q[2] * 0.9 * s };
};

/* ------------------------------------------------------------------ */
/* le scene, le porte e il tuffo che le collega                         */
/* ------------------------------------------------------------------ */
const SCENES = [
  { start: 0, end: 2, draw: drawHook, portal: hookPortal, open: 1.25 },
  { start: 2, end: 6, draw: drawType, portal: typePortal, open: 5.25 },
  { start: 6, end: 14, draw: drawShapes, portal: phonePortal, open: 13.25 },
  { start: 14, end: 16, draw: drawData, portal: dataPortal, open: 15.25 },
  { start: 16, end: 18, draw: drawNet, portal: netPortal, open: 17.25, samples: (t) => (t > 16.9 ? 6 : 3) },
  { start: 18, end: 20, draw: drawTitle },
];
const ZOOM = 0.5;
// il tuffo: accelera in modo esponenziale, poi atterra frenando senza rimbalzi
const dive = (u) => (u <= 0.8 ? (0.7 * (Math.pow(2, (7 * u) / 0.8) - 1)) / 127 : 0.7 + 0.3 * (1 - Math.pow(1 - (u - 0.8) / 0.2, 3)));
function portalPath(p) {
  ctx.beginPath();
  if (p.kind === "circle") ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  else if (p.kind === "ellipse") ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
  else ctx.roundRect(p.x, p.y, p.w, p.h, p.r ?? 0);
}
/** Quanto bisogna ingrandire perché la porta copra tutto lo schermo. */
function coverZoom(p) {
  if (p.kind === "circle") return Math.hypot(W / 2, H / 2) / p.r;
  if (p.kind === "ellipse") return Math.hypot(W / 2 / p.rx, H / 2 / p.ry);
  return Math.max(W / p.w, H / p.h) * 1.02;
}
const pCenter = (p) => (p.kind === "rect" ? [p.x + p.w / 2, p.y + p.h / 2] : [p.x, p.y]);
/** La scena dopo, dentro la porta: rimpicciolita in modo da diventare tutto lo schermo alla fine del tuffo. */
function drawInside(p, Nx, t) {
  const pc = pCenter(p), k = 1 / coverZoom(p);
  ctx.save();
  portalPath(p);
  ctx.clip();
  ctx.translate(pc[0], pc[1]);
  ctx.scale(k, k);
  ctx.translate(-CX, -CY);
  Nx.draw(Math.max(Nx.start, t));
  ctx.restore();
}
function drawScene(S, Nx, t) {
  S.draw(t);
  if (Nx && S.open != null && t >= S.open) drawInside(S.portal(t), Nx, t);
}
function averaged(n, fn) {
  if (n <= 1) { fn(0); return; }
  for (let c = 0; c < n; c++) {
    ctx = OFF;
    OFF.setTransform(1, 0, 0, 1, 0, 0);
    OFF.globalAlpha = 1;
    fn(c / n);
    ctx = MAIN;
    MAIN.setTransform(1, 0, 0, 1, 0, 0);
    MAIN.globalAlpha = 1 / (c + 1);
    MAIN.drawImage(offCanvas, 0, 0);
    MAIN.globalAlpha = 1;
  }
}
function seek(t) {
  t = ((t % DUR) + DUR) % DUR;
  ctx = MAIN;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  let i = SCENES.findIndex((s) => t >= s.start && t < s.end);
  if (i < 0) i = SCENES.length - 1;
  const S = SCENES[i], Nx = SCENES[i + 1];
  const u = Nx && S.portal ? prog(t, S.end - ZOOM, S.end) : 0;
  if (u <= 0) {
    const n = S.samples ? S.samples(t) : 1;
    averaged(n, (f) => drawScene(S, Nx, t - f / 180));
    return;
  }
  // il tuffo dentro la porta: il dettaglio della scena diventa la scena successiva
  const p = S.portal(t), pc = pCenter(p), Zend = coverZoom(p), k = 1 / Zend;
  const Z = Math.exp(Math.log(Zend) * dive(u)), Z0 = Math.exp(Math.log(Zend) * dive(Math.max(0, u - 1 / 180 / ZOOM)));
  const f = [(CX - pc[0] / k) / (1 - 1 / k), (CY - pc[1] / k) / (1 - 1 / k)];
  // mosso radiale: tante copie quanto cresce lo zoom in un sottofotogramma
  const speed = Math.log(Z / Z0), copies = Math.min(12, Math.max(1, Math.ceil(speed / 0.004)));
  averaged(copies, (c) => {
    const zc = Math.exp(Math.log(Z) - speed * c);
    ctx.save();
    ctx.translate(f[0], f[1]); ctx.scale(zc, zc); ctx.translate(-f[0], -f[1]);
    S.draw(t);
    drawInside(p, Nx, t);
    ctx.restore();
  });
}

window.REEL = {
  ready: Promise.all([document.fonts.load("800 100px Syne"), document.fonts.load("400 100px Syne")]).then(() => true),
  seek,
  DUR,
};
