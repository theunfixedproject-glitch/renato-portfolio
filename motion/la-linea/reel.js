"use strict";
/*
 * "La linea che non si stacca" (versione 2) — graphic motion di Renato Manzotti.
 * Una sola linea, tracciata con un pennino a punta larga, mai sollevata dal foglio: scrive, disegna, diventa 3D,
 * si fa grafico e firma; sui mezzi battiti le forme si riempiono d'inchiostro. Alla fine la penna riavvolge tutto
 * fino al punto da cui era partita: il primo fotogramma.
 * Tutto si calcola da t dentro window.seek(t): niente animazioni CSS, niente timer, nessuno stato tra un fotogramma e l'altro.
 */
const W = 1080, H = 1920, CX = 540, CY = 960, DUR = 15, BEAT = 0.5, N = 3000, F = 2000;
const RGB = { v: [162, 89, 255], g: [61, 255, 154], s: [199, 155, 255], w: [255, 255, 255], k: [6, 6, 8] };
const BG = "#060608";
const NIB = { w: 17, angle: -0.75, min: 0.3 };
const cv = document.getElementById("c");
let ctx = cv.getContext("2d");
const MAIN = ctx;
const offCanvas = document.createElement("canvas");
offCanvas.width = W;
offCanvas.height = H;
const OFF = offCanvas.getContext("2d");

/* ------------------------------------------------------------------ */
/* curve del tempo                                                     */
/* ------------------------------------------------------------------ */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const expoOut = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
const expoIn = (u) => (u <= 0 ? 0 : Math.pow(2, 10 * (u - 1)));
const smooth = (u) => u * u * (3 - 2 * u);
// molla a smorzamento critico: arriva senza rimbalzi
const spring = (t, t0, w = 24) => { const x = t - t0; return x <= 0 ? 0 : 1 - (1 + w * x) * Math.exp(-w * x); };
const kick = (t) => { const x = ((t % BEAT) + BEAT) % BEAT; return Math.exp(-x * 10); };
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const ink = (u, t0, d = 0.12) => expoOut(prog(u, t0, t0 + d));
// la penna che disegna: esponenziale più dolce, così il tratto si vede correre
const draw = (u, t0, d) => { const x = prog(u, t0, t0 + d); return (1 - Math.pow(2, -5 * x)) / (1 - Math.pow(2, -5)); };

/* ------------------------------------------------------------------ */
/* tracciati                                                           */
/* ------------------------------------------------------------------ */
class Pen {
  constructor(x = 0, y = 0, z = 0) { this.p = [[x, y, z]]; }
  get last() { return this.p[this.p.length - 1]; }
  to(x, y, z = 0) {
    const [x0, y0, z0] = this.last;
    const n = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0, z - z0) / 8));
    for (let i = 1; i <= n; i++) this.p.push([lerp(x0, x, i / n), lerp(y0, y, i / n), lerp(z0, z, i / n)]);
    return this;
  }
  arc(cx, cy, r, a0, a1, z = 0) {
    this.to(cx + r * Math.cos(a0), cy + r * Math.sin(a0), z);
    const n = Math.max(6, Math.ceil((Math.abs(a1 - a0) * r) / 8));
    for (let i = 1; i <= n; i++) { const a = lerp(a0, a1, i / n); this.p.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); }
    return this;
  }
  // rettangolo arrotondato in senso orario, dall'angolo in alto a sinistra; finisce dove comincia
  rr(x0, y0, x1, y1, r) {
    const P = Math.PI;
    this.to(x0 + r, y0).to(x1 - r, y0).arc(x1 - r, y0 + r, r, -P / 2, 0).to(x1, y1 - r).arc(x1 - r, y1 - r, r, 0, P / 2);
    this.to(x0 + r, y1).arc(x0 + r, y1 - r, r, P / 2, P).to(x0, y0 + r).arc(x0 + r, y0 + r, r, P, P * 1.5);
    return this;
  }
  // un pallino appeso al rigo: si entra dal basso, si fa il giro, si torna giù
  dot(cx, cy, r) { const P = Math.PI; return this.to(cx, cy + r).arc(cx, cy, r, P / 2, P * 2.5); }
  add(pts) { for (const q of pts) this.to(q[0], q[1], q[2] ?? 0); return this; }
}
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], (a[2] ?? 0) - (b[2] ?? 0));
const pathLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += dist3(pts[i - 1], pts[i]); return s; };

/** Un tracciato pronto da campionare: punti, lunghezze progressive, colori per punto se servono. */
function track(pts, cols = null) {
  const n = pts.length, p = new Float32Array(n * 3), len = new Float32Array(n);
  const c = cols ? new Float32Array(n * 3) : null;
  for (let i = 0; i < n; i++) {
    p[i * 3] = pts[i][0]; p[i * 3 + 1] = pts[i][1]; p[i * 3 + 2] = pts[i][2] ?? 0;
    if (i) len[i] = len[i - 1] + dist3(pts[i - 1], pts[i]);
    if (c) c.set(cols[i], i * 3);
  }
  return { p, len, c, n, L: len[n - 1] || 1 };
}
/** Il pezzo visibile [a, b] di un tracciato, ricampionato a N punti alla stessa distanza. */
function sample(T, a, b) {
  const out = new Float32Array(N * 3), oc = T.c ? new Float32Array(N * 3) : null;
  const A = a * T.L, B = b * T.L;
  let j = 0;
  for (let k = 0; k < N; k++) {
    const d = A + ((B - A) * k) / (N - 1);
    while (j < T.n - 2 && T.len[j + 1] < d) j++;
    const u = clamp((d - T.len[j]) / (T.len[j + 1] - T.len[j] || 1));
    for (let q = 0; q < 3; q++) {
      out[k * 3 + q] = lerp(T.p[j * 3 + q], T.p[(j + 1) * 3 + q], u);
      if (oc) oc[k * 3 + q] = lerp(T.c[j * 3 + q], T.c[(j + 1) * 3 + q], u);
    }
  }
  return { p: out, c: oc };
}
/** Le frazioni di lunghezza in cui finiscono i pezzi di un tracciato composto. */
const marks = (parts) => { const L = parts.map(pathLen), tot = L.reduce((a, b) => a + b, 0); let s = 0; return L.map((l) => (s += l) / tot); };

/* ------------------------------------------------------------------ */
/* le forme                                                            */
/* ------------------------------------------------------------------ */
let G = {};
const T = {}, GP = {}, FILL = {};
const word = (w, dx = 0, dy = 0, rev = false) => { const p = G[w].pts.map(([x, y]) => [x + dx, y + dy, 0]); return rev ? p.reverse() : p; };
// il rigo di una parola: dove sta nel mondo il primo punto, l'ultimo, il rigo
const rail = (w) => G[w].rail;
/** Un rettangolo arrotondato come poligono, per i riempimenti. */
function rrPoly(x0, y0, x1, y1, r, z = 0) {
  const b = new Pen(x0 + r, y0).rr(x0, y0, x1, y1, r);
  return b.p.map(([x, y]) => [x, y, z]);
}
const circlePoly = (cx, cy, r, z = 0) => Array.from({ length: 40 }, (_, i) => [cx + r * Math.cos((i / 40) * Math.PI * 2), cy + r * Math.sin((i / 40) * Math.PI * 2), z]);

// l'aggancio: "una / sola / linea" in tre righe giustificate; la penna va avanti e indietro come su un quaderno
const R1 = -225, R2 = 191, R3 = 560;
let HOOK = null, P0 = null;
function buildHook() {
  const una = word("una", 0, R1 - rail("una")), sola = word("sola", 0, R2 - rail("sola"), true), linea = word("linea", 0, R3 - rail("linea"));
  const parts = [una, sola, linea];
  const all = [...una, ...sola, ...linea];
  HOOK = { trk: track(all), marks: marks([una, [una[una.length - 1], ...sola], [sola[sola.length - 1], ...linea]]) };
  P0 = una[0];
  void parts;
}

function buildShapes() {
  for (const w of ["AI", "bot", "app", "sito"]) T[w] = track(word(w));
  const P = Math.PI;
  // il sito: una pagina verticale, con barra, puntini, blocco grande, righe di testo, due schede e un bottone
  const site = (full) => {
    const x0 = -470, x1 = 470, y0 = -650, y1 = 650, r = 36;
    const b = new Pen(x0, y0 + r).arc(x0 + r, y0 + r, r, P, P * 1.5).to(x1 - r, y0).arc(x1 - r, y0 + r, r, -P / 2, 0).to(x1, y1 - r).arc(x1 - r, y1 - r, r, 0, P / 2);
    b.to(x0 + r, y1).arc(x0 + r, y1 - r, r, P / 2, P).to(x0, -560).to(x1, -560).to(-300, -560);
    for (const cx of [-340, -380, -420]) b.to(cx + 12, -605).arc(cx, -605, 12, 0, P * 2);
    if (full) {
      b.to(-400, -480).rr(-400, -480, 400, -120, 24).to(-400, -40).to(300, -40).to(-400, -40).to(-400, 30).to(150, 30).to(-400, 30);
      b.to(-400, 100).rr(-400, 100, -20, 420, 22).to(20, 100).rr(20, 100, 400, 420, 22).to(40, 120).to(380, 400).to(380, 120).to(40, 400);
      b.to(-20, 420).to(-400, 420).to(-360, 500).rr(-400, 500, -60, 580, 40);
    } else b.to(-400, -480);
    return b.p;
  };
  T.siteA = track(site(false));
  T.siteB = track(site(true));
  FILL.site = [{ pts: rrPoly(-400, -480, 400, -120, 24), color: RGB.v }, { pts: rrPoly(-400, 500, -60, 580, 40), color: RGB.g }];
  // il telefono e la sua app
  const phone = (full) => {
    const b = new Pen(-210, -620).rr(-300, -620, 300, 620, 90).to(-63, -595).rr(-80, -595, 80, -560, 17);
    if (full) {
      b.to(-206, -480).rr(-240, -480, 240, -180, 34).to(-240, -110).to(160, -110).to(-240, -110).to(-240, -50).to(60, -50).to(-240, -50);
      b.to(-206, 30).rr(-240, 30, 240, 330, 34).to(-240, 520).to(-146, 520);
      for (const cx of [-120, 0, 120]) b.to(cx - 26, 520).arc(cx, 520, 26, P, P * 3);
    } else b.to(-206, -480);
    return b.p;
  };
  T.phoneA = track(phone(false));
  T.phoneB = track(phone(true));
  FILL.phone = [{ pts: rrPoly(-240, -480, 240, -180, 34), color: RGB.s }, { pts: rrPoly(-240, 30, 240, 330, 34), color: RGB.s }];
  // la nuvoletta della chat, con la coda e i tre puntini su un rigo
  const bubble = (dots) => {
    const x0 = -460, x1 = 460, y0 = -380, y1 = 260, r = 130;
    const b = new Pen(x0, y0 + r).arc(x0 + r, y0 + r, r, P, P * 1.5).to(x1 - r, y0).arc(x1 - r, y0 + r, r, -P / 2, 0).to(x1, y1 - r).arc(x1 - r, y1 - r, r, 0, P / 2);
    b.to(-290, y1).to(-410, 420).arc(x0 + r, y1 - r, r, P * 0.62, P).to(x0, -60);
    if (dots) for (const cx of [-180, 0, 180]) b.to(cx - 44, -60).arc(cx, -60, 44, P, P * 3);
    else b.to(-224, -60);
    return b.p;
  };
  T.bubbleA = track(bubble(false));
  T.bubbleB = track(bubble(true));
  {
    const x0 = -460, x1 = 460, y0 = -380, y1 = 260, r = 130;
    const body = new Pen(x0, y0 + r).arc(x0 + r, y0 + r, r, P, P * 1.5).to(x1 - r, y0).arc(x1 - r, y0 + r, r, -P / 2, 0).to(x1, y1 - r).arc(x1 - r, y1 - r, r, 0, P / 2);
    body.to(-290, y1).to(-410, 420).arc(x0 + r, y1 - r, r, P * 0.62, P).to(x0, y0 + r);
    FILL.bubble = [{ pts: body.p, color: RGB.s }, ...[-180, 0, 180].map((cx) => ({ pts: circlePoly(cx, -60, 44), color: RGB.k }))];
  }
  T.bubble = bubble;
}

// il nodo: un trifoglio vero, in 3D, che gira su se stesso
function knot(t) {
  const pts = [], s = 180, a = 0.5 + (t - 4.5) * 2.4, b = 0.45;
  for (let i = 0; i <= 900; i++) {
    const u = (i / 900) * Math.PI * 2;
    let x = s * (Math.sin(u) + 2 * Math.sin(2 * u)), y = s * (Math.cos(u) - 2 * Math.cos(2 * u)), z = -s * 1.4 * Math.sin(3 * u);
    [x, z] = [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
    [y, z] = [y * Math.cos(b) - z * Math.sin(b), y * Math.sin(b) + z * Math.cos(b)];
    pts.push([x, y + 40, z]);
  }
  return track(pts);
}

// la voce del bot: una sinusoide che, girando la camera, si scopre essere una spirale
function voice(t) { return 0.55 + 0.45 * Math.pow(Math.abs(Math.sin(((t - 6.0) / 0.25) * Math.PI)), 0.6); }
function wave(t, flat = 0) {
  const pts = [], cycles = lerp(3.5, 7, spring(t, 8.5, 16)), phase = -t * 2 * Math.PI * 0.9;
  const half = t >= 8 && t < 10 ? Math.exp(-(((t - 8) % 0.25) * 16)) : 0;
  const A = 270 * (t < 8 ? voice(t) : lerp(voice(8), 1.12, spring(t, 8, 10))) * (1 + 0.14 * half);
  for (let i = 0; i <= 1100; i++) {
    const u = i / 1100, x = lerp(-500, 500, u), th = u * cycles * Math.PI * 2 + phase;
    const R = A * Math.pow(Math.sin(Math.PI * u), 0.7);
    pts.push([x, R * Math.sin(th), R * Math.cos(th) * (1 - flat)]);
  }
  return pts;
}

// il grafico: assi e dati in un solo tratto, l'area sotto piena di viola
const LEVELS = {
  A: [0.1, 0.14, 0.12, 0.2, 0.24, 0.22, 0.3, 0.36],
  B: [0.1, 0.16, 0.18, 0.28, 0.34, 0.38, 0.5, 0.58],
  C: [0.12, 0.2, 0.26, 0.36, 0.46, 0.55, 0.7, 0.82],
  D: [0.12, 0.22, 0.3, 0.42, 0.55, 0.68, 0.86, 1.25],
};
const CHX = (i) => lerp(-430, 430, i / 7), CHY = (v) => 520 - v * 900;
function chartPts(vals, z = 0, sc = 1) {
  const b = new Pen(-430, -560).to(-430, 520).to(430, 520).to(430, CHY(vals[7]));
  for (let i = 6; i >= 0; i--) b.to(CHX(i), CHY(vals[i]));
  return b.p.map(([x, y]) => [x * sc, y * sc, z]);
}
const areaPts = (vals, z = 0, sc = 1) => [...vals.map((v, i) => [CHX(i), CHY(v)]), [430, 520], [-430, 520]].map(([x, y]) => [x * sc, y * sc, z]);
function chartVals(t) {
  const L = LEVELS;
  return L.A.map((a, i) => a + (L.B[i] - a) * spring(t, 10.5) + (L.C[i] - L.B[i]) * spring(t, 11.0) + (L.D[i] - L.C[i]) * spring(t, 11.5));
}

// la scultura: tutta la storia in profondità, pagine rilegate dallo stesso filo sul lato sinistro
const GAP = 900, PS = 0.72;
let STACK = null;
function buildStack() {
  const page = (pts, z, sc = PS) => pts.map(([x, y]) => [x * sc, y * sc, z]);
  const parts = [
    { pts: chartPts(LEVELS.D, 0, 1), c: RGB.g },
    { pts: page([...wave(7.6, 1), [-500, 0]], GAP * 1, 0.8), c: RGB.g },
    { pts: page([...T.bubble(true), [-460, -60]], GAP * 2), c: RGB.s },
    { pts: page([...[...Array(T.phoneB.n)].map((_, i) => [T.phoneB.p[i * 3], T.phoneB.p[i * 3 + 1]]), [-300, 520]], GAP * 3), c: RGB.v },
    { pts: page([...Array(T.siteB.n)].map((_, i) => [T.siteB.p[i * 3], T.siteB.p[i * 3 + 1]]), GAP * 4), c: RGB.w },
  ];
  const pts = [], cols = [];
  for (const q of parts) for (const p of q.pts) { pts.push(p); cols.push(q.c); }
  const ends = marks(parts.map((q, i) => (i ? [parts[i - 1].pts[parts[i - 1].pts.length - 1], ...q.pts] : q.pts)));
  const fills = [
    { pts: areaPts(LEVELS.D, 0, 1), color: RGB.v, after: 0 },
    ...FILL.bubble.map((f) => ({ pts: page(f.pts, GAP * 2), color: f.color, after: ends[2] })),
    ...FILL.phone.map((f) => ({ pts: page(f.pts, GAP * 3), color: f.color, after: ends[3] })),
    ...FILL.site.map((f) => ({ pts: page(f.pts, GAP * 4), color: f.color, after: ends[4] })),
  ];
  STACK = { trk: track(pts, cols), chartEnd: pathLen(parts[0].pts) / pathLen(pts), fills };
}

// la firma: Renato da sinistra a destra (comincia esattamente dove comincia "una"), Manzotti a ritroso, poi lo svolazzo
const S1 = R1, S2 = R1 + 259;
let SIGN = null;
function buildSignature() {
  const r = word("Renato", 0, S1 - rail("Renato")), m = word("Manzotti", 0, S2 - rail("Manzotti"), true);
  const name = [...r, ...m];
  const e = m[m.length - 1];
  const K = [[e[0], e[1]], [-500, S2 + 70], [-380, S2 + 125], [0, S2 + 135], [380, S2 + 118], [485, S2 + 75], [505, S2 + 20]];
  const curve = [];
  for (let i = 0; i < K.length - 1; i++) {
    const p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(K.length - 1, i + 2)];
    for (let s = 1; s <= 14; s++) {
      const u = s / 14, u2 = u * u, u3 = u2 * u;
      curve.push([0, 1].map((q) => 0.5 * (2 * p1[q] + (-p0[q] + p2[q]) * u + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * u2 + (-p0[q] + 3 * p1[q] - 3 * p2[q] + p3[q]) * u3)).concat(0));
    }
  }
  const all = [...name, ...curve];
  // stesso punto di partenza dell'aggancio, al decimo di pixel
  const dx = P0[0] - all[0][0], dy = P0[1] - all[0][1];
  const moved = all.map(([x, y, z]) => [x + dx, y + dy, z]);
  const cols = moved.map((_, i) => (i < name.length ? RGB.w : RGB.g));
  SIGN = { trk: track(moved, cols), split: pathLen(name) / pathLen(all), dx, dy };
}

/* ------------------------------------------------------------------ */
/* la sequenza                                                         */
/* ------------------------------------------------------------------ */
const accordion = (t) => 1 - 0.45 * spring(t, 13.0, 22) - 0.35 * spring(t, 13.25, 22);
const dotness = (t) => (t < 0.25 ? 1 : t < 1.5 ? 1 - spring(t, 0.25, 24) : t >= 14.5 ? Math.pow(prog(t, 14.5, 14.98), 2.2) : 0);
// riempimento di una parola: l'inchiostro entra da sinistra sul mezzo battito e se ne va di colpo sul battito dopo
const glyphFill = (w, color, from, to, dx = 0, dy = 0) => ({ glyph: w, color, from, to, dx, dy });
const polyFill = (list, from, to) => list.map((f) => ({ ...f, from, to }));
let KEYS = [];
// il contorno arriva sul battito; sul mezzo battito la penna, senza staccarsi, disegna i dettagli
const details = (name, t0) => {
  const f = T[name + "A"].L / T[name + "B"].L;
  return (t) => [0, f + (1 - f) * draw(t, t0, 0.2)];
};
function buildKeys() {
  const hookB = (t) => { const [m1, m2] = HOOK.marks; return m1 * ink(t, 0.25, 0.24) + (m2 - m1) * ink(t, 0.75, 0.24) + (1 - m2) * ink(t, 1.25, 0.24); };
  const signB = (t) => {
    const b = lerp(SIGN.split, 1, expoOut(prog(t, 13.75, 14.0)));
    return t >= 14.5 ? b * (1 - Math.pow(prog(t, 14.5, 14.98), 2.2)) : b;
  };
  KEYS = [
    {
      t: 0, trk: HOOK.trk, color: RGB.g, win: (t) => [0, hookB(t)],
      xf: (t) => ({ s: 1 - 0.04 * spring(t, 1.75), sx: 1 + 0.06 * spring(t, 1.75) }),
      fills: [glyphFill("una", RGB.g, 0.5, 2.0, 0, R1 - rail("una")), glyphFill("sola", RGB.g, 1.0, 2.0, 0, R2 - rail("sola")), glyphFill("linea", RGB.g, 1.5, 2.0, 0, R3 - rail("linea"))],
    },
    { t: 2.0, trk: () => T.AI, color: RGB.v, xf: (t) => ({ rot: -0.12 * spring(t, 2.25), s: 1 + 0.05 * spring(t, 2.25) }), fills: [glyphFill("AI", RGB.v, 2.25, 2.5)] },
    { t: 2.5, trk: () => T.bot, color: RGB.g, xf: (t) => ({ sx: 1 + 0.12 * spring(t, 2.75), sy: 1 - 0.08 * spring(t, 2.75) }), fills: [glyphFill("bot", RGB.g, 2.75, 3.0)] },
    { t: 3.0, trk: () => T.app, color: RGB.s, xf: (t) => ({ rot: 0.14 * spring(t, 3.25) }), fills: [glyphFill("app", RGB.s, 3.25, 3.5)] },
    { t: 3.5, trk: () => T.sito, color: RGB.w, xf: (t) => ({ sx: 1 + 0.1 * spring(t, 3.75), sy: 1 - 0.1 * spring(t, 3.75) }), fills: [glyphFill("sito", RGB.w, 3.75, 4.0)] },
    { t: 4.0, relay: true, trk: () => T.siteB, color: RGB.w, win: details("site", 4.25), fills: polyFill(FILL.site, 4.36, 4.5) },
    { t: 4.5, relay: true, trk: (t) => knot(t), color: RGB.g, d3: true },
    { t: 5.0, relay: true, trk: () => T.phoneB, color: RGB.v, win: details("phone", 5.25), fills: polyFill(FILL.phone, 5.36, 5.5) },
    { t: 5.5, relay: true, trk: () => T.bubbleB, color: RGB.s, win: details("bubble", 5.75), fills: polyFill(FILL.bubble, 5.86, 6.0) },
    { t: 6.0, relay: true, trk: (t) => track(wave(t, spring(t, 9.5, 14))), color: RGB.g, d3: true },
    { t: 10.0, relay: true, trk: (t) => track(chartPts(chartVals(t))), color: RGB.g, fills: [{ area: true, color: RGB.v, from: 10.25, to: 12.0 }] },
    { t: 12.0, trk: () => STACK.trk, color: RGB.w, d3: true, snap: true, win: (t) => [0, lerp(STACK.chartEnd, 1, smooth(prog(t, 12.0, 12.75)))], xf: (t) => ({ sz: accordion(t) }), stackFills: true },
    { t: 13.5, relay: true, trk: () => SIGN.trk, color: RGB.w, d3: true, w: 30, nib: 0.6, flatFrom: 13.95, win: (t) => [0, signB(t)], fills: [glyphFill("Renato", RGB.w, 13.75, 14.5, SIGN.dx, S1 - rail("Renato") + SIGN.dy), glyphFill("Manzotti", RGB.w, 13.85, 14.5, SIGN.dx, S2 - rail("Manzotti") + SIGN.dy)] },
  ];
}
function applyXf(f, xf, t) {
  if (!xf) return f;
  const o = xf(t);
  const sx = (o.s ?? 1) * (o.sx ?? 1), sy = (o.s ?? 1) * (o.sy ?? 1), sz = o.sz ?? 1, r = o.rot ?? 0, c = Math.cos(r), s = Math.sin(r);
  if (sx === 1 && sy === 1 && sz === 1 && r === 0) return f;
  const p = new Float32Array(f.p.length);
  for (let i = 0; i < p.length; i += 3) {
    const x = f.p[i] * sx, y = f.p[i + 1] * sy;
    p[i] = x * c - y * s;
    p[i + 1] = x * s + y * c;
    p[i + 2] = f.p[i + 2] * sz;
  }
  return { ...f, p };
}
/** Una chiave a un istante: il pezzo visibile del suo tracciato, già trasformato. */
function frameOf(K, t) {
  const trk = typeof K.trk === "function" ? K.trk(t) : K.trk;
  const [a, b] = K.win ? K.win(t) : [0, 1];
  const s = sample(trk, a, b);
  return applyXf({ p: s.p, c: s.c, color: K.color, d3: !!K.d3 && !(K.flatFrom && t >= K.flatFrom) }, K.xf, t);
}
const STAG = 0.08;
const settled = (K, t) => t - K.t > STAG + 0.55;
/** La linea a un istante: ogni chiave nasce dalla precedente, punto per punto, con una molla che corre dalla coda alla punta. */
function stateAt(i, t) {
  const K = KEYS[i], to = frameOf(K, t);
  if (i === 0 || K.snap) return to;
  if (K.relay) return relay(i, K, to, t);
  if (settled(K, t)) return to;
  const from = stateAt(i - 1, t), w = K.w ?? 30;
  const p = new Float32Array(N * 3);
  const c = from.c || to.c ? new Float32Array(N * 3) : null;
  let done = true;
  for (let k = 0; k < N; k++) {
    const m = spring(t, K.t + (STAG * k) / (N - 1), w);
    if (m < 0.9999) done = false;
    for (let q = 0; q < 3; q++) {
      p[k * 3 + q] = lerp(from.p[k * 3 + q], to.p[k * 3 + q], m);
      if (c) c[k * 3 + q] = lerp(from.c ? from.c[k * 3 + q] : from.color[q], to.c ? to.c[k * 3 + q] : to.color[q], m);
    }
  }
  if (done) return to;
  return { p, c, color: to.color, d3: to.d3 || from.d3 };
}
/**
 * Il passaggio a staffetta: la penna corre avanti e disegna la forma nuova, la coda la segue e si porta via la vecchia.
 * Vecchia e nuova sono un tracciato solo; si vede la finestra [a, b], che scorre dalla prima alla seconda.
 */
function relay(i, K, to, t) {
  if (t - K.t > 0.3) return to;
  const from = stateAt(i - 1, t), pts = [], cols = [];
  for (let k = 0; k < N; k++) { pts.push([from.p[k * 3], from.p[k * 3 + 1], from.p[k * 3 + 2]]); cols.push(from.c ? [from.c[k * 3], from.c[k * 3 + 1], from.c[k * 3 + 2]] : from.color); }
  // il salto dalla vecchia alla nuova è una curva, non una diagonale: la mano della penna
  const e = pts[N - 1], s0 = [to.p[0], to.p[1], to.p[2]], d = Math.hypot(s0[0] - e[0], s0[1] - e[1]) || 1;
  const ctl = [(e[0] + s0[0]) / 2 - ((s0[1] - e[1]) / d) * 0.32 * d, (e[1] + s0[1]) / 2 + ((s0[0] - e[0]) / d) * 0.32 * d];
  const LK = 24;
  for (let k = 1; k < LK; k++) {
    const u = k / LK, m = 1 - u;
    pts.push([m * m * e[0] + 2 * m * u * ctl[0] + u * u * s0[0], m * m * e[1] + 2 * m * u * ctl[1] + u * u * s0[1], lerp(e[2], s0[2], u)]);
    cols.push(u < 0.5 ? cols[N - 1] : to.c ? [to.c[0], to.c[1], to.c[2]] : to.color);
  }
  for (let k = 0; k < N; k++) { pts.push([to.p[k * 3], to.p[k * 3 + 1], to.p[k * 3 + 2]]); cols.push(to.c ? [to.c[k * 3], to.c[k * 3 + 1], to.c[k * 3 + 2]] : to.color); }
  const trk = track(pts, cols), endOld = trk.len[N - 1] / trk.L, startNew = trk.len[N - 1 + LK] / trk.L;
  const b = endOld + (1 - endOld) * draw(t, K.t, 0.24), a = startNew * draw(t, K.t + 0.06, 0.22);
  const s = sample(trk, Math.min(a, b), b);
  return { p: s.p, c: s.c, color: to.color, d3: to.d3 || from.d3 };
}
const keyIndex = (t) => { let i = 0; while (i < KEYS.length - 1 && t >= KEYS[i + 1].t) i++; return i; };
const lineAt = (t) => stateAt(keyIndex(t), t);

/* ------------------------------------------------------------------ */
/* la camera                                                           */
/* ------------------------------------------------------------------ */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function lookAt(pos, target) {
  const fw = norm(sub(target, pos));
  const right = norm(cross(fw, [0, -1, 0]));
  const up = cross(right, fw);
  const ref = Math.hypot(...sub(target, pos));
  return { pos, fw, right, up, ref, k: (ref / 2000) * Math.sqrt(2000 / ref) };
}
const orbit = (yaw, pitch, dist) => [Math.sin(yaw) * Math.cos(pitch) * -dist, -Math.sin(pitch) * dist, -Math.cos(yaw) * Math.cos(pitch) * dist];
// l'unica regola della camera: scivola sempre in avanti, e gira solo attorno alla linea
function camera(t) {
  const push = 1 + 0.05 * Math.sin((Math.PI * t) / DUR);
  const D = 2000 / push;
  if (t >= 6 && t < 10.2) {
    const back = 1 - spring(t, 9.5, 12);
    const yaw = (0.75 * spring(t, 8.25, 14) + 0.8 * spring(t, 9.0, 14)) * back;
    const pitch = (0.55 * spring(t, 8.75, 14) + 0.35 * spring(t, 9.25, 14)) * back;
    return lookAt(orbit(yaw, pitch, D), [0, 0, 0]);
  }
  if (t >= 12.0 && t < 14.6) {
    const k = spring(t, 12.0, 7) * (1 - spring(t, 13.45, 13));
    const pitch = 0.98 * k, yaw = (0.2 + 0.08 * prog(t, 12.0, 13.4) - 0.3 * spring(t, 12.75, 16)) * k, dist = lerp(D, STAGE.dist, k);
    const target = [STAGE.tx * k, STAGE.ty * k, GAP * 2 * accordion(t) * k];
    const o = orbit(yaw, pitch, dist);
    return lookAt([target[0] + o[0], target[1] + o[1], target[2] + o[2]], target);
  }
  return lookAt([0, 0, -D], [0, 0, 0]);
}
const STAGE = { dist: 4600, tx: 170, ty: 220 };
function project(cam, x, y, z) {
  const d = [x - cam.pos[0], y - cam.pos[1], z - cam.pos[2]];
  const zz = dot(d, cam.fw);
  return [CX + (F * dot(d, cam.right)) / zz, CY - (F * dot(d, cam.up)) / zz, zz];
}

/* ------------------------------------------------------------------ */
/* il disegno: un nastro di inchiostro con lo spessore del pennino      */
/* ------------------------------------------------------------------ */
const NEAR = 60;
function ribbon(P, ws, i0, i1, color, extra = 0, cap = true) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let k = i0; k < i1; k++) {
    const x0 = P[k * 3], y0 = P[k * 3 + 1], x1 = P[k * 3 + 3], y1 = P[k * 3 + 4];
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
    if (l < 0.01) continue;
    const nx = -dy / l, ny = dx / l, h0 = ws[k] / 2 + extra, h1 = ws[k + 1] / 2 + extra;
    ctx.moveTo(x0 + nx * h0, y0 + ny * h0);
    ctx.lineTo(x1 + nx * h1, y1 + ny * h1);
    ctx.lineTo(x1 - nx * h1, y1 - ny * h1);
    ctx.lineTo(x0 - nx * h0, y0 - ny * h0);
    ctx.closePath();
  }
  ctx.fill();
  // le giunture: un tondo dove la linea gira, e ai due capi
  ctx.beginPath();
  for (let k = i0; k <= i1; k++) {
    let bend = cap && (k === i0 || k === i1);
    if (!bend && k > i0 && k < i1) {
      const ax = P[k * 3] - P[k * 3 - 3], ay = P[k * 3 + 1] - P[k * 3 - 2], bx = P[k * 3 + 3] - P[k * 3], by = P[k * 3 + 4] - P[k * 3 + 1];
      const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
      bend = la > 0.01 && lb > 0.01 && (ax * bx + ay * by) / (la * lb) < 0.996;
    }
    if (!bend) continue;
    const r = ws[k] / 2 + extra;
    ctx.moveTo(P[k * 3] + r, P[k * 3 + 1]);
    ctx.arc(P[k * 3], P[k * 3 + 1], r, 0, Math.PI * 2);
  }
  ctx.fill();
}
/** Dal mondo allo schermo per le cose piatte sul piano z = 0, quando la camera guarda di fronte. */
function planeMatrix(cam) {
  const o = project(cam, 0, 0, 0), ex = project(cam, 100, 0, 0), ey = project(cam, 0, 100, 0);
  return [(ex[0] - o[0]) / 100, (ex[1] - o[1]) / 100, (ey[0] - o[0]) / 100, (ey[1] - o[1]) / 100, o[0], o[1]];
}
function drawFlatFill(f, K, cam, t) {
  if (t < f.from || t >= f.to) return;
  const u = ink(t, f.from, 0.1);
  ctx.save();
  ctx.setTransform(...planeMatrix(cam));
  if (K.xf) {
    const o = K.xf(t), sx = (o.s ?? 1) * (o.sx ?? 1), sy = (o.s ?? 1) * (o.sy ?? 1), r = o.rot ?? 0, c = Math.cos(r), s = Math.sin(r);
    ctx.transform(c * sx, s * sx, -s * sy, c * sy, 0, 0);
  }
  ctx.fillStyle = rgb(f.color);
  if (f.glyph) {
    const g = G[f.glyph];
    ctx.translate(f.dx, f.dy);
    ctx.beginPath();
    ctx.rect(-g.w / 2 - 20, -2000, (g.w + 40) * u, 4000);
    ctx.clip();
    ctx.fill(GP[f.glyph]);
  } else {
    const pts = f.area ? areaPts(chartVals(t)) : f.pts;
    let x0 = 1e9, x1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
    ctx.beginPath();
    ctx.rect(x0 - 10, -2000, (x1 - x0 + 20) * u, 4000);
    ctx.clip();
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function drawLine(L, cam, t, K) {
  const P = new Float32Array(N * 3), ws = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const q = project(cam, L.p[i * 3], L.p[i * 3 + 1], L.p[i * 3 + 2]);
    P[i * 3] = q[0]; P[i * 3 + 1] = q[1]; P[i * 3 + 2] = q[2];
  }
  // lo spessore del pennino: dipende dalla direzione del tratto sullo schermo e dalla distanza
  const seg = new Float32Array(N);
  let last = 0.7;
  for (let i = 0; i < N - 1; i++) {
    const dx = P[i * 3 + 3] - P[i * 3], dy = P[i * 3 + 4] - P[i * 3 + 1];
    if (Math.hypot(dx, dy) > 0.05) last = NIB.min + (1 - NIB.min) * Math.abs(Math.sin(Math.atan2(dy, dx) - NIB.angle));
    seg[i] = last;
  }
  seg[N - 1] = last;
  for (let pass = 0; pass < 3; pass++) for (let i = 1; i < N - 1; i++) seg[i] = (seg[i - 1] + 2 * seg[i] + seg[i + 1]) / 4;
  const nw = NIB.w * (K.nib ?? 1);
  for (let i = 0; i < N; i++) ws[i] = P[i * 3 + 2] > NEAR ? nw * seg[i] * clamp((2000 / P[i * 3 + 2]) * cam.k, 0.15, 12) : 0;
  const colAt = (i) => (L.c ? [L.c[i * 3], L.c[i * 3 + 1], L.c[i * 3 + 2]] : L.color);
  // i pezzi: dodici punti l'uno, con il loro colore e la loro profondità
  const CH = 12, items = [];
  for (let s = 0; s < N - 1; s += CH) {
    const e = Math.min(N - 1, s + CH);
    let z = 0, ok = true;
    for (let i = s; i <= e; i++) { z += P[i * 3 + 2]; if (P[i * 3 + 2] < NEAR) ok = false; }
    if (ok) items.push({ s, e, z: z / (e - s + 1), color: rgb(colAt((s + e) >> 1)) });
  }
  if (!L.d3) {
    for (const f of K.fills ?? []) drawFlatFill(f, K, cam, t);
    // pezzi consecutivi dello stesso colore: un nastro solo
    let run = null;
    const flush = () => { if (run) ribbon(P, ws, run.s, run.e, run.color); };
    for (const it of items) {
      if (run && run.color === it.color && run.e === it.s) run.e = it.e;
      else { flush(); run = { ...it }; }
    }
    flush();
  } else {
    // dal più lontano al più vicino, con un alone del colore di fondo: dove la linea passa sopra sé stessa si vede l'incrocio
    const all = [...items];
    if (K.stackFills && t < 13.5) {
      const sz = accordion(t), drawn = K.win(t)[1];
      for (const f of STACK.fills) {
        if (drawn < f.after - 1e-4) continue;
        const pts = f.pts.map(([x, y, z]) => project(cam, x, y, z * sz));
        if (pts.some((q) => q[2] < NEAR)) continue;
        all.push({ fill: pts, z: pts.reduce((a, q) => a + q[2], 0) / pts.length + 8, color: rgb(f.color) });
      }
    }
    all.sort((p, q) => q.z - p.z);
    for (const it of all) {
      if (it.fill) {
        ctx.fillStyle = it.color;
        ctx.beginPath();
        it.fill.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.closePath();
        ctx.fill();
        continue;
      }
      if (it.e - it.s > 2) ribbon(P, ws, it.s + 1, it.e - 1, BG, 5 + ws[it.s] * 0.45, false);
      ribbon(P, ws, it.s, it.e, it.color);
    }
  }
  // la punta della penna
  const h = N - 1;
  if (P[h * 3 + 2] > NEAR) {
    const sc = clamp((2000 / P[h * 3 + 2]) * cam.k, 0.15, 12), dt = dotness(t);
    ctx.fillStyle = rgb(colAt(h));
    ctx.beginPath();
    ctx.arc(P[h * 3], P[h * 3 + 1], (nw * 0.62 * (1 + 1.3 * dt) + 4 * kick(t) * dt) * sc, 0, Math.PI * 2);
    ctx.fill();
  }
}

// testi: ancorati a un punto del mondo, così volano insieme alla scena
function label(cam, text, x, y, z, size, color, align = "center", weight = 500) {
  const q = project(cam, x, y, z);
  if (q[2] < NEAR) return;
  const s = 2000 / q[2];
  if (size * s < 1 || !text) return;
  ctx.font = `${weight} ${(size * s).toFixed(1)}px "Fira Code"`;
  ctx.fillStyle = rgb(color);
  ctx.textAlign = align;
  ctx.fillText(text, q[0], q[1]);
  ctx.textAlign = "left";
}
/** Testo che si scrive e si cancella una lettera alla volta. */
function typed(str, tIn, tOut, t, rate = 0.025) {
  const n = Math.floor(clamp((t - tIn) / rate, 0, str.length));
  const del = tOut != null ? Math.floor(clamp((t - tOut) / (rate * 0.6), 0, str.length)) : 0;
  return str.slice(0, Math.max(0, n - del));
}
/** Una battuta del bot: una pillola piena che si apre sul battito, il testo che si scrive dentro. */
function pill(cam, text, tIn, tOut, t, x, y) {
  const k = spring(t, tIn, 26) * (1 - spring(t, tOut, 30));
  if (k < 0.01) return;
  const q = project(cam, x, y, 0);
  if (q[2] < NEAR) return;
  const s = (2000 / q[2]) * k, size = 104;
  ctx.font = `700 ${(size * s).toFixed(1)}px "Fira Code"`;
  const w = ctx.measureText(text).width + 110 * s, h = 170 * s;
  ctx.fillStyle = rgb(RGB.s);
  ctx.beginPath();
  ctx.roundRect(q[0] - w / 2, q[1] - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = rgb(RGB.k);
  ctx.textAlign = "center";
  ctx.fillText(typed(text, tIn + 0.04, null, t, 0.022), q[0], q[1] + size * s * 0.34);
  ctx.textAlign = "left";
}
function drawOverlays(cam, t) {
  // la voce del bot
  if (t >= 6.2 && t < 8.1) {
    const lines = [["ciao!", 6.25], ["prenoto io", 6.75], ["fatto.", 7.25]];
    lines.forEach(([s, a], i) => {
      const next = lines[i + 1] ? lines[i + 1][1] : 7.75;
      if (t >= next + (lines[i + 1] ? 0 : 0.2)) return;
      pill(cam, s, a, lines[i + 1] ? 99 : 7.75, t, 0, -560);
    });
  }
  // il grafico: etichette, punti, contatore, fumetto
  if (t >= 10.0 && t < 13.3) {
    const vals = chartVals(t), lab = t < 12.0;
    if (lab) {
      label(cam, typed("clienti", 10.05, null, t), -430, -860, 0, 54, RGB.s, "left");
      label(cam, typed("gen", 10.1, null, t), -430, 610, 0, 48, RGB.s, "left");
      label(cam, typed("giu", 10.1, null, t), 430, 610, 0, 48, RGB.s, "right");
      const pct = Math.round(38 + 58 * spring(t, 10.5) + 68 * spring(t, 11.0) + 148 * spring(t, 11.5));
      label(cam, `+${pct}%`, -430, -700, 0, 150 * spring(t, 10.0, 30), RGB.g, "left", 700);
    }
    vals.forEach((v, i) => {
      const k = spring(t, 10.25 + i * 0.03, 30);
      if (k < 0.01) return;
      const q = project(cam, CHX(i), CHY(v), 0);
      if (q[2] < NEAR) return;
      ctx.fillStyle = rgb(RGB.w);
      ctx.beginPath();
      ctx.arc(q[0], q[1], 15 * k * (2000 / q[2]), 0, Math.PI * 2);
      ctx.fill();
    });
    const tip = spring(t, 10.75, 26) * (lab ? 1 : 0);
    if (tip > 0.01) {
      const q = project(cam, CHX(7), CHY(vals[7]) - 90, 0);
      if (q[2] > NEAR) {
        const s = (2000 / q[2]) * tip;
        ctx.fillStyle = rgb(RGB.s);
        ctx.beginPath();
        ctx.roundRect(q[0] - 210 * s, q[1] - 44 * s, 180 * s, 82 * s, 41 * s);
        ctx.fill();
        ctx.font = `700 ${(46 * s).toFixed(1)}px "Fira Code"`;
        ctx.fillStyle = rgb(RGB.k);
        ctx.textAlign = "center";
        ctx.fillText("oggi", q[0] - 120 * s, q[1] + 12 * s);
        ctx.textAlign = "left";
      }
    }
  }
  // il titolo, sotto la firma
  if (t >= 13.95) {
    label(cam, typed("siti, app e bot", 14.0, 14.5, t, 0.016), 0, S2 + 300, 0, 78, RGB.w, "center", 500);
    label(cam, typed("su misura", 14.25, 14.5, t, 0.016), 0, S2 + 410, 0, 78, RGB.g, "center", 700);
  }
}

function drawFrame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const cam = camera(t), K = KEYS[keyIndex(t)];
  drawLine(lineAt(t), cam, t, K);
  drawOverlays(cam, t);
}

/* ------------------------------------------------------------------ */
/* il fotogramma, con il mosso che segue velocità e direzione           */
/* ------------------------------------------------------------------ */
function probe(t) {
  const L = lineAt(t), cam = camera(t), out = [];
  for (const f of [0, 0.2, 0.4, 0.6, 0.8, 1]) { const i = Math.round(f * (N - 1)) * 3; out.push(project(cam, L.p[i], L.p[i + 1], L.p[i + 2])); }
  return out;
}
function seek(t) {
  t = ((t % DUR) + DUR) % DUR;
  // quanto si sposta l'immagine in un sottofotogramma (1/180 s): se tanto, si media dentro il sottofotogramma
  const A = probe(t), B = probe(Math.max(0, t - 1 / 180));
  let px = 0;
  A.forEach((q, i) => { if (q[2] > NEAR && B[i][2] > NEAR) px = Math.max(px, Math.hypot(q[0] - B[i][0], q[1] - B[i][1])); });
  const n = Math.min(8, Math.max(1, Math.ceil(px / 3)));
  if (n === 1) { drawFrame(t); return; }
  for (let c = 0; c < n; c++) {
    ctx = OFF;
    drawFrame(Math.max(0, t - (c / n) * (1 / 180)));
    ctx = MAIN;
    MAIN.setTransform(1, 0, 0, 1, 0, 0);
    MAIN.globalAlpha = 1 / (c + 1);
    MAIN.drawImage(offCanvas, 0, 0);
    MAIN.globalAlpha = 1;
  }
}

window.REEL = {
  ready: (async () => {
    await Promise.all([document.fonts.load('500 40px "Fira Code"'), document.fonts.load('700 40px "Fira Code"')]);
    G = await (await fetch("glyphs.json")).json();
    for (const w of Object.keys(G)) { const p = new Path2D(); p.addPath(new Path2D(G[w].fill), new DOMMatrix([1, 0, 0, 1, G[w].ox, G[w].oy])); GP[w] = p; }
    buildHook();
    buildShapes();
    buildStack();
    buildSignature();
    buildKeys();
    return true;
  })(),
  seek,
  DUR,
  W,
  H,
  // il riquadro sullo schermo della linea visibile, per comporre l'inquadratura
  box(t) {
    const L = lineAt(t), cam = camera(t);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < N; i++) {
      const q = project(cam, L.p[i * 3], L.p[i * 3 + 1], L.p[i * 3 + 2]);
      x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
    }
    return [x0, y0, x1, y1].map(Math.round);
  },
  // dove corre la punta della penna sullo schermo: serve all'audio per il fruscio
  penSpeed(rate = 200) {
    const out = [];
    let prev = null;
    for (let i = 0; i <= DUR * rate; i++) {
      const t = i / rate, L = lineAt(t), cam = camera(t), k = (N - 1) * 3;
      const q = project(cam, L.p[k], L.p[k + 1], L.p[k + 2]);
      out.push(prev ? Math.min(20000, Math.hypot(q[0] - prev[0], q[1] - prev[1]) * rate) : 0);
      prev = q;
    }
    return out;
  },
};
