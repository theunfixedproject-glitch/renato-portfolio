"use strict";
/*
 * "La linea che non si stacca" — terzo film di graphic motion di Renato Manzotti.
 * Una sola linea, mai sollevata dal foglio: diventa parole, oggetti, una spirale in 3D, un grafico
 * e infine la firma; poi si riavvolge fino a un punto, il primo fotogramma.
 * Tutto si calcola da t dentro window.seek(t): niente animazioni CSS, niente timer, nessuno stato tra un fotogramma e l'altro.
 */
const W = 1080, H = 1920, CX = 540, CY = 960, DUR = 15, BEAT = 0.5, N = 2400, F = 2000;
const RGB = { v: [162, 89, 255], g: [61, 255, 154], s: [199, 155, 255], w: [255, 255, 255], k: [6, 6, 8] };
const BG = "#060608";
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

/* ------------------------------------------------------------------ */
/* una penna che non si alza mai: costruisce tracciati continui         */
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
  circle(cx, cy, r, z = 0) { return this.arc(cx, cy, r, 0, Math.PI * 2, z); }
  // rettangolo arrotondato, percorso in senso orario a partire dall'angolo in alto a sinistra
  rr(x0, y0, x1, y1, r, z = 0) {
    this.to(x0 + r, y0, z).to(x1 - r, y0, z).arc(x1 - r, y0 + r, r, -Math.PI / 2, 0, z).to(x1, y1 - r, z).arc(x1 - r, y1 - r, r, 0, Math.PI / 2, z);
    this.to(x0 + r, y1, z).arc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, z).to(x0, y0 + r, z).arc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, z);
    return this;
  }
  add(pts) { for (const q of pts) this.to(q[0], q[1], q[2] ?? 0); return this; }
}
/** Ricampiona un tracciato a N punti alla stessa distanza: così due forme qualsiasi si trasformano l'una nell'altra. */
function resample(pts, n = N) {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], (pts[i][2] ?? 0) - (pts[i - 1][2] ?? 0)));
  const total = len[len.length - 1] || 1, out = new Float32Array(n * 3);
  let j = 0;
  for (let k = 0; k < n; k++) {
    const d = (k / (n - 1)) * total;
    while (j < pts.length - 2 && len[j + 1] < d) j++;
    const u = clamp((d - len[j]) / (len[j + 1] - len[j] || 1));
    for (let c = 0; c < 3; c++) out[k * 3 + c] = lerp(pts[j][c] ?? 0, pts[j + 1]?.[c] ?? pts[j][c] ?? 0, u);
  }
  return out;
}
const shape = (pts, color, extra = {}) => ({ p: resample(pts), color, ...extra });

/* ------------------------------------------------------------------ */
/* le forme                                                            */
/* ------------------------------------------------------------------ */
let G = {};
const S = {};
function buildShapes() {
  const word = (w, dy = 0) => G[w].pts.map(([x, y]) => [x, y + dy, 0]);
  S.dot = shape([[0, 0, 0], [0, 0, 0]], RGB.g);
  S.line = shape([[-450, 0, 0], [450, 0, 0]], RGB.g);
  for (const w of ["una", "sola", "linea", "AI", "bot", "app", "sito"]) S[w] = shape(word(w), RGB.g);

  // il sito: finestra del browser, barra, puntini, poi i contenuti
  const site = (full) => {
    const b = new Pen(-430, -250).to(-430, -320).to(430, -320).to(430, 240).to(-430, 240).to(-430, -250).to(430, -250).to(-300, -250);
    b.circle(-385, -285, 10).circle(-350, -285, 10).circle(-315, -285, 10).to(-360, -200);
    if (full) {
      b.rr(-360, -200, 60, -140, 14).to(-360, -90).to(300, -90).to(300, -50).to(-360, -50).to(-360, -10).to(200, -10);
      b.to(120, 30).rr(120, 30, 360, 190, 16).to(360, 190).to(120, 30).to(360, 30).to(120, 190).to(-120, 170).rr(-360, 110, -120, 170, 30);
    } else b.to(-360, -160);
    return b.p;
  };
  S.siteA = shape(site(false), RGB.w);
  S.siteB = shape(site(true), RGB.w);
  // il telefono, poi la sua app
  const phone = (full) => {
    const b = new Pen(-160, -460).rr(-230, -460, 230, 460, 70).to(-60, -430).rr(-60, -430, 60, -400, 15);
    if (full) {
      b.rr(-170, -330, 170, -110, 30).to(-170, -60).to(150, -60).to(150, -20).to(-170, -20).rr(-170, 40, 40, 110, 35);
      b.circle(-110, 330, 22).circle(0, 330, 22).circle(110, 330, 22);
    } else b.to(0, -380);
    return b.p;
  };
  S.phoneA = shape(phone(false), RGB.v);
  S.phoneB = shape(phone(true), RGB.v);
  // la nuvoletta della chat, con la coda
  // in senso orario dall'angolo in alto a sinistra, come il sito e il telefono: le forme si scambiano senza incrociarsi
  const bubble = (dots) => {
    const x0 = -380, x1 = 380, y0 = -280, y1 = 160, r = 90, P = Math.PI;
    const b = new Pen(x0, y0 + r).arc(x0 + r, y0 + r, r, P, P * 1.5).to(x1 - r, y0).arc(x1 - r, y0 + r, r, -P / 2, 0).to(x1, y1 - r).arc(x1 - r, y1 - r, r, 0, P / 2);
    b.to(-250, y1).to(-330, 260).arc(x0 + r, y1 - r, r, P * 0.62, P).to(x0, -60);
    if (dots) for (const cx of [-130, 0, 130]) b.to(cx - 26, -60).arc(cx, -60, 26, P, P * 3);
    else b.to(-156, -60);
    return b.p;
  };
  S.bubbleA = shape(bubble(false), RGB.s);
  S.bubbleB = shape(bubble(true), RGB.s);
}

// il nodo: un trifoglio vero, in 3D, che gira su se stesso
function knot(t) {
  const pts = [], s = 135, a = 0.5 + (t - 4.5) * 2.2, b = 0.4;
  for (let i = 0; i <= 720; i++) {
    const u = (i / 720) * Math.PI * 2;
    let x = s * (Math.sin(u) + 2 * Math.sin(2 * u)), y = s * (Math.cos(u) - 2 * Math.cos(2 * u)), z = -s * 1.4 * Math.sin(3 * u);
    [x, z] = [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
    [y, z] = [y * Math.cos(b) - z * Math.sin(b), y * Math.sin(b) + z * Math.cos(b)];
    pts.push([x, y + 40, z]);
  }
  return { p: resample(pts), color: RGB.g };
}

// la voce del bot: una sinusoide che, girando la camera, si scopre essere una spirale
function voice(t) { return 0.55 + 0.45 * Math.pow(Math.abs(Math.sin(((t - 6.0) / 0.25) * Math.PI)), 0.6); }
function wave(t, flat = 0) {
  const pts = [], cycles = lerp(3.5, 7, spring(t, 8.5, 16)), phase = -t * 2 * Math.PI * 0.9;
  const half = t >= 8 && t < 10 ? Math.exp(-(((t - 8) % 0.25) * 16)) : 0;
  const A = 160 * (t < 8 ? voice(t) : lerp(voice(8), 1, spring(t, 8, 10))) * (1 + 0.14 * half);
  for (let i = 0; i <= 900; i++) {
    const u = i / 900, x = lerp(-460, 460, u), th = u * cycles * Math.PI * 2 + phase;
    const R = A * Math.pow(Math.sin(Math.PI * u), 0.7);
    pts.push([x, R * Math.sin(th), R * Math.cos(th) * (1 - flat)]);
  }
  return pts;
}
const waveShape = (t) => ({ p: resample(wave(t, spring(t, 9.5, 14))), color: RGB.g });

// il grafico: assi e area in un solo tratto
const LEVELS = {
  A: [0.1, 0.14, 0.12, 0.2, 0.24, 0.22, 0.3, 0.36],
  B: [0.1, 0.16, 0.18, 0.28, 0.34, 0.38, 0.5, 0.58],
  C: [0.12, 0.2, 0.26, 0.36, 0.46, 0.55, 0.7, 0.82],
  D: [0.12, 0.22, 0.3, 0.42, 0.55, 0.68, 0.86, 1.25],
};
const CHX = (i) => lerp(-420, 420, i / 7), CHY = (v) => 300 - v * 700;
function chartPts(vals, z = 0) {
  const b = new Pen(-420, -430, z).to(-420, 300, z).to(420, 300, z).to(420, CHY(vals[7]), z);
  for (let i = 6; i >= 0; i--) b.to(CHX(i), CHY(vals[i]), z);
  return b.p;
}
function chartVals(t) {
  const L = LEVELS;
  return L.A.map((a, i) => a + (L.B[i] - a) * spring(t, 10.5) + (L.C[i] - L.B[i]) * spring(t, 11.0) + (L.D[i] - L.C[i]) * spring(t, 11.5));
}

// la scultura: tutta la storia in profondità, un solo filo dal grafico al sito
const PLANES = [0, 700, 1400, 2100, 2800];
let TUNNEL = null;
function buildTunnel() {
  const parts = [
    { pts: chartPts(LEVELS.D, PLANES[0]), c: RGB.g },
    // ogni pagina comincia e finisce sul lato sinistro: il filo le rilega come il dorso di un quaderno
    { pts: [...wave(7.6, 1), [-460, 0]].map(([x, y]) => [x * 0.9, y, PLANES[1]]), c: RGB.g },
    { pts: [...unpack(S.bubbleB.p), [-380, -60]].map(([x, y]) => [x * 0.85, y * 0.85, PLANES[2]]), c: RGB.s },
    { pts: [...unpack(S.phoneB.p), [-230, 330]].map(([x, y]) => [x * 0.75, y * 0.75, PLANES[3]]), c: RGB.v },
    { pts: unpack(S.siteB.p).map(([x, y]) => [x * 0.9, y * 0.9, PLANES[4]]), c: RGB.w },
  ];
  // ogni parte riceve punti in proporzione alla sua lunghezza, i raccordi in profondità compresi
  const lens = parts.map((q) => pathLen(q.pts));
  const links = parts.slice(1).map((q, i) => dist3(parts[i].pts[parts[i].pts.length - 1], q.pts[0]));
  const total = lens.reduce((a, b) => a + b, 0) + links.reduce((a, b) => a + b, 0);
  const p = new Float32Array(N * 3), c = new Float32Array(N * 3), ranges = [];
  let k = 0;
  parts.forEach((q, i) => {
    const n = i === parts.length - 1 ? N - k : Math.round(((lens[i] + (links[i] ?? 0)) / total) * N);
    const seg = i < parts.length - 1 ? [...q.pts, parts[i + 1].pts[0]] : q.pts;
    const r = resample(seg, n);
    p.set(r, k * 3);
    for (let j = 0; j < n; j++) c.set(q.c, (k + j) * 3);
    ranges.push([k, k + n, k + n * (lens[i] / (lens[i] + (links[i] ?? 0)))]);
    k += n;
  });
  TUNNEL = { p, c, ranges, color: RGB.w };
}
const unpack = (f) => { const o = []; for (let i = 0; i < f.length; i += 3) o.push([f[i], f[i + 1], f[i + 2]]); return o; };
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], (a[2] ?? 0) - (b[2] ?? 0));
const pathLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += dist3(pts[i - 1], pts[i]); return s; };

// la firma: il nome tracciato da Fira Code, una sottolineatura, e la fine al centro dello schermo
let SIGN = null;
function buildSignature() {
  const r = G.Renato.pts.map(([x, y]) => [x, y - 420, 0]).reverse(), m = G.Manzotti.pts.map(([x, y]) => [x, y - 200, 0]);
  const b = new Pen(...r[0]).add(r).add(m);
  const e = b.last;
  // la sottolineatura: scende a destra, corre a sinistra, si arriccia e torna al centro
  const curve = [];
  const P = [[e[0], e[1]], [455, -95], [380, -55], [0, -48], [-380, -40], [-462, -12], [-420, 12], [-220, 8], [0, 0]];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let s = 1; s <= 12; s++) {
      const u = s / 12, u2 = u * u, u3 = u2 * u;
      curve.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
        0,
      ]);
    }
  }
  const nameLen = pathLen(b.p), flLen = pathLen([e, ...curve]);
  b.add(curve);
  const p = resample(b.p);
  const split = nameLen / (nameLen + flLen);
  const c = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) c.set(i / (N - 1) < split ? RGB.w : RGB.g, i * 3);
  SIGN = { p, c, color: RGB.w, split };
}

/* ------------------------------------------------------------------ */
/* la sequenza: una forma per ogni mezzo battito                       */
/* ------------------------------------------------------------------ */
const xf = (o) => o;
let KEYS = [];
function buildKeys() {
  KEYS = [
    { t: 0, get: () => S.dot },
    { t: 0.25, get: () => S.line },
    { t: 0.5, get: () => S.una, xf: (t) => ({ sx: 1 - 0.14 * spring(t, 0.75), sy: 1 + 0.12 * spring(t, 0.75) }) },
    { t: 1.0, get: () => S.sola, xf: (t) => ({ rot: -0.1 * spring(t, 1.25), s: 1 + 0.08 * spring(t, 1.25) }) },
    { t: 1.5, get: () => S.linea, xf: (t) => ({ sx: 1 + 0.16 * spring(t, 1.75), sy: 1 - 0.1 * spring(t, 1.75) }) },
    { t: 2.0, get: () => ({ ...S.AI, color: RGB.v }), xf: (t) => ({ rot: -0.16 * spring(t, 2.25), s: 1 + 0.06 * spring(t, 2.25) }) },
    { t: 2.5, get: () => ({ ...S.bot, color: RGB.g }), xf: (t) => ({ sx: 1 + 0.32 * spring(t, 2.75) }) },
    { t: 3.0, get: () => ({ ...S.app, color: RGB.s }), xf: (t) => ({ rot: 0.22 * spring(t, 3.25) }) },
    { t: 3.5, get: () => ({ ...S.sito, color: RGB.w }), xf: (t) => ({ sx: 1 + 0.18 * spring(t, 3.75), sy: 1 - 0.12 * spring(t, 3.75) }) },
    { t: 4.0, get: () => S.siteA },
    { t: 4.25, get: () => S.siteB },
    { t: 4.5, get: (t) => knot(t), d3: true },
    { t: 5.0, get: () => S.phoneA },
    { t: 5.25, get: () => S.phoneB },
    { t: 5.5, get: () => S.bubbleA },
    { t: 5.75, get: () => S.bubbleB },
    { t: 6.0, get: (t) => waveShape(t), d3: true },
    { t: 10.0, get: () => ({ p: resample(chartPts(LEVELS.A)), color: RGB.g }) },
    { t: 10.5, get: () => ({ p: resample(chartPts(LEVELS.B)), color: RGB.g }) },
    { t: 11.0, get: () => ({ p: resample(chartPts(LEVELS.C)), color: RGB.g }) },
    { t: 11.5, get: () => ({ p: resample(chartPts(LEVELS.D)), color: RGB.g }) },
    { t: 12.0, get: () => TUNNEL, d3: true, snap: true, xf: (t) => ({ sz: accordion(t) }) },
    { t: 13.5, get: () => SIGN, d3: true, w: 28 },
  ];
  void xf;
}
const accordion = (t) => 1 - 0.45 * spring(t, 13.0, 22) - 0.35 * spring(t, 13.25, 22);
function applyXf(sh, f, t) {
  if (!f) return sh;
  const o = f(t);
  const sx = (o.s ?? 1) * (o.sx ?? 1), sy = (o.s ?? 1) * (o.sy ?? 1), sz = o.sz ?? 1, r = o.rot ?? 0, c = Math.cos(r), s = Math.sin(r);
  if (sx === 1 && sy === 1 && sz === 1 && r === 0) return sh;
  const p = new Float32Array(sh.p.length);
  for (let i = 0; i < p.length; i += 3) {
    const x = sh.p[i] * sx, y = sh.p[i + 1] * sy;
    p[i] = x * c - y * s;
    p[i + 1] = x * s + y * c;
    p[i + 2] = sh.p[i + 2] * sz;
  }
  return { ...sh, p };
}
/** La linea a un istante: la forma di arrivo e quella di partenza, mescolate con una molla. */
function lineAt(t) {
  let i = 0;
  while (i < KEYS.length - 1 && t >= KEYS[i + 1].t) i++;
  const K = KEYS[i], P = KEYS[Math.max(0, i - 1)];
  const to = applyXf(K.get(t), K.xf, t);
  const m = i === 0 || K.snap ? 1 : spring(t, K.t, K.w ?? 24);
  // la firma, una volta tornata di fronte, è piatta: niente aloni
  const flat = K.get === KEYS[KEYS.length - 1].get && t >= 13.95;
  if (m >= 0.9999) return { ...to, d3: !flat && (K.d3 || (P.d3 && m < 1)) };
  const from = applyXf(P.get(t), P.xf, t);
  const p = new Float32Array(N * 3);
  for (let j = 0; j < p.length; j++) p[j] = lerp(from.p[j], to.p[j], m);
  let c = null;
  if (from.c || to.c) {
    c = new Float32Array(N * 3);
    for (let j = 0; j < c.length; j++) c[j] = lerp(from.c ? from.c[j] : from.color[j % 3], to.c ? to.c[j] : to.color[j % 3], m);
  }
  const color = [0, 1, 2].map((k) => lerp(from.color[k], to.color[k], m));
  return { p, c, color, d3: !flat && (K.d3 || P.d3) };
}
/** Quanto della linea si vede: [coda, testa], in frazioni della sua lunghezza. */
function trim(t) {
  let a = 0, b = 1;
  if (t >= 12.0 && t < 13.5 && TUNNEL) {
    // la penna corre avanti e disegna la storia in profondità, la camera la insegue
    const R = TUNNEL.ranges, f = (k) => k / (N - 1);
    b = lerp(f(R[0][2]), 1, smooth(prog(t, 12.0, 12.75)));
  }
  if (t >= 13.5 && SIGN) {
    // la scultura si raccoglie nel nome, poi la penna firma la sottolineatura
    b = lerp(SIGN.split, 1, expoOut(prog(t, 13.75, 14.0)));
  }
  if (t >= 14.5) a = Math.pow(prog(t, 14.5, 14.98), 2.2);
  return [a, b];
}

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
    // l'onda è una spirale vista di fianco: la camera le gira attorno a scatti, sul mezzo battito
    const back = 1 - spring(t, 9.5, 12);
    const yaw = (0.75 * spring(t, 8.25, 14) + 0.8 * spring(t, 9.0, 14)) * back;
    const pitch = (0.55 * spring(t, 8.75, 14) + 0.35 * spring(t, 9.25, 14)) * back;
    return lookAt(orbit(yaw, pitch, D), [0, 0, 0]);
  }
  if (t >= 12.0 && t < 14.6) {
    // sale sopra la scultura mentre la penna la disegna, gira piano, poi torna di fronte per la firma
    const k = spring(t, 12.0, 7) * (1 - spring(t, 13.45, 13));
    const pitch = 0.98 * k, yaw = (0.2 + 0.08 * prog(t, 12.0, 13.4) - 0.3 * spring(t, 12.75, 16)) * k, dist = lerp(D, 4300, k);
    const target = [140 * k, 200 * k, 1400 * accordion(t) * k];
    const o = orbit(yaw, pitch, dist);
    return lookAt([target[0] + o[0], target[1] + o[1], target[2] + o[2]], target);
  }
  return lookAt([0, 0, -D], [0, 0, 0]);
}
function project(cam, x, y, z) {
  const d = [x - cam.pos[0], y - cam.pos[1], z - cam.pos[2]];
  const zz = dot(d, cam.fw);
  return [CX + (F * dot(d, cam.right)) / zz, CY - (F * dot(d, cam.up)) / zz, zz];
}

const dotness = (t) => (t < 0.25 ? 1 : t < 1.5 ? 1 - spring(t, 0.25, 24) : t >= 14.5 ? Math.pow(prog(t, 14.5, 14.98), 2.2) : 0);
/* ------------------------------------------------------------------ */
/* il disegno                                                          */
/* ------------------------------------------------------------------ */
const NEAR = 60;
function drawLine(L, cam, t) {
  const [a, b] = trim(t);
  const i0 = Math.floor(a * (N - 1)), i1 = Math.ceil(b * (N - 1));
  const w = 8;
  const P = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const q = project(cam, L.p[i * 3], L.p[i * 3 + 1], L.p[i * 3 + 2]);
    P[i * 3] = q[0]; P[i * 3 + 1] = q[1]; P[i * 3 + 2] = q[2];
  }
  // i capi esatti, a metà fra due punti
  const at = (f) => { const x = f * (N - 1), k = Math.min(N - 2, Math.floor(x)), u = x - k; return [lerp(P[k * 3], P[k * 3 + 3], u), lerp(P[k * 3 + 1], P[k * 3 + 4], u), lerp(P[k * 3 + 2], P[k * 3 + 5], u)]; };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const colAt = (i) => (L.c ? [L.c[i * 3], L.c[i * 3 + 1], L.c[i * 3 + 2]] : L.color);
  if (!L.d3 && !L.c) {
    ctx.strokeStyle = rgb(L.color);
    ctx.lineWidth = w;
    ctx.beginPath();
    const s = at(a);
    ctx.moveTo(s[0], s[1]);
    for (let i = i0 + 1; i < i1; i++) ctx.lineTo(P[i * 3], P[i * 3 + 1]);
    const e = at(b);
    ctx.lineTo(e[0], e[1]);
    ctx.stroke();
  } else {
    // a pezzi, dal più lontano al più vicino: ogni pezzo ha il suo spessore e un alone del colore di fondo,
    // così dove la linea passa sopra sé stessa si vede l'incrocio
    const CH = 10, chunks = [];
    for (let s = i0; s < i1; s += CH) {
      const e = Math.min(i1, s + CH);
      let z = 0, ok = true;
      for (let i = s; i <= e; i++) { z += P[i * 3 + 2]; if (P[i * 3 + 2] < NEAR) ok = false; }
      if (!ok) continue;
      chunks.push({ s, e, z: z / (e - s + 1) });
    }
    chunks.sort((p, q) => q.z - p.z);
    for (const ch of chunks) {
      const scale = clamp((2000 / ch.z) * cam.k, 0.15, 12);
      const lw = w * scale;
      const pts = [];
      for (let i = ch.s; i <= ch.e; i++) pts.push(i === i0 ? at(a) : i === i1 ? at(b) : [P[i * 3], P[i * 3 + 1]]);
      if (L.d3) {
        ctx.strokeStyle = BG;
        ctx.lineWidth = lw * 2.4;
        ctx.lineCap = "butt";
        ctx.beginPath();
        pts.slice(1, -1).forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        if (pts.length > 3) ctx.stroke();
        ctx.lineCap = "round";
      }
      ctx.strokeStyle = rgb(colAt(Math.min(N - 1, (ch.s + ch.e) >> 1)));
      ctx.lineWidth = lw;
      ctx.beginPath();
      pts.forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.stroke();
    }
  }
  // la punta della penna
  const h = at(b);
  if (h[2] > NEAR) {
    const sc = clamp((2000 / h[2]) * cam.k, 0.15, 12);
    ctx.fillStyle = rgb(colAt(Math.min(N - 1, Math.round(b * (N - 1)))));
    ctx.beginPath();
    // all'inizio e alla fine la linea è solo la punta: un punto pieno che batte sulla cassa
    const dt = dotness(t);
    ctx.arc(h[0], h[1], (w * 0.95 * (1 + 1.3 * dt) + 4 * kick(t) * dt) * sc, 0, Math.PI * 2);
    ctx.fill();
  }
}

// testi piccoli: ancorati a un punto del mondo, così volano insieme alla scena
function label(cam, text, x, y, z, size, color, align = "center", weight = 500, alpha = 1) {
  const q = project(cam, x, y, z);
  if (q[2] < NEAR || alpha <= 0.01) return;
  const s = 2000 / q[2];
  if (size * s < 1) return;
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${(size * s).toFixed(1)}px "Fira Code"`;
  ctx.fillStyle = rgb(color);
  ctx.textAlign = align;
  ctx.fillText(text, q[0], q[1]);
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
}
/** Testo che si scrive e si cancella una lettera alla volta. */
function typed(str, tIn, tOut, t, rate = 0.025) {
  const n = Math.floor(clamp((t - tIn) / rate, 0, str.length));
  const del = tOut != null ? Math.floor(clamp((t - tOut) / (rate * 0.6), 0, str.length)) : 0;
  return str.slice(0, Math.max(0, n - del));
}
function drawOverlays(cam, t) {
  // la voce del bot
  if (t >= 6.3 && t < 8.1) {
    const lines = [["ciao!", 6.25, 6.62], ["prenoto io", 6.75, 7.08], ["fatto.", 7.25, 7.75]];
    lines.forEach(([s, a, b], i) => {
      if (lines[i + 1] && t >= lines[i + 1][1]) return;
      const txt = typed(s, a, b, t, 0.022);
      if (txt) label(cam, txt, 0, -330, 0, 80, RGB.w, "center", 700);
    });
  }
  // il grafico: etichette, punti, contatore e fumetto
  if (t >= 10.0 && t < 13.3) {
    const vals = chartVals(t);
    if (t >= 13.25) return;
    // sul colpo di 12 le etichette se ne vanno: nella scultura resta solo la linea, con i suoi punti
    const minor = t < 12.0 ? 1 : 0;
    label(cam, typed("clienti", 10.05, null, t), -420, -660, 0, 46, RGB.s, "left", 500, minor);
    label(cam, typed("gen", 10.1, null, t), -420, 370, 0, 40, RGB.s, "left", 500, minor);
    label(cam, typed("giu", 10.1, null, t), 420, 370, 0, 40, RGB.s, "right", 500, minor);
    const pct = Math.round(38 + 58 * spring(t, 10.5) + 68 * spring(t, 11.0) + 148 * spring(t, 11.5));
    label(cam, `+${pct}%`, -420, -545, 0, 104 * spring(t, 10.0, 30), RGB.g, "left", 700, minor);
    vals.forEach((v, i) => {
      const k = spring(t, 10.25 + i * 0.03, 30);
      if (k < 0.01) return;
      const q = project(cam, CHX(i), CHY(v), 0);
      if (q[2] < NEAR) return;
      ctx.fillStyle = rgb(RGB.w);
      ctx.beginPath();
      ctx.arc(q[0], q[1], 11 * k * (2000 / q[2]), 0, Math.PI * 2);
      ctx.fill();
    });
    const tip = spring(t, 10.75, 26) * minor;
    if (tip > 0.01) {
      const q = project(cam, CHX(7), CHY(vals[7]) - 70, 0);
      if (q[2] > NEAR) {
        const s = (2000 / q[2]) * tip;
        ctx.fillStyle = rgb(RGB.s);
        ctx.beginPath();
        ctx.roundRect(q[0] - 150 * s, q[1] - 34 * s, 130 * s, 60 * s, 30 * s);
        ctx.fill();
        ctx.font = `700 ${(34 * s).toFixed(1)}px "Fira Code"`;
        ctx.fillStyle = rgb(RGB.k);
        ctx.textAlign = "center";
        ctx.fillText("oggi", q[0] - 85 * s, q[1] + 8 * s);
        ctx.textAlign = "left";
      }
    }
  }
  // il titolo: sotto la firma
  if (t >= 13.95) {
    const out = 14.5;
    label(cam, typed("siti, app e bot", 14.0, out, t, 0.016), 0, 160, 0, 58, RGB.w);
    label(cam, typed("su misura", 14.25, out, t, 0.016), 0, 240, 0, 58, RGB.g, "center", 700);
  }
}

function drawFrame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const cam = camera(t);
  drawLine(lineAt(t), cam, t);
  drawOverlays(cam, t);
}

/* ------------------------------------------------------------------ */
/* il fotogramma, con il mosso che segue velocità e direzione           */
/* ------------------------------------------------------------------ */
function headScreen(t) {
  const L = lineAt(t), cam = camera(t), [, b] = trim(t);
  const out = [];
  for (const f of [0.05, 0.3, 0.55, 0.8, b]) { const i = Math.round(f * (N - 1)) * 3; out.push(project(cam, L.p[i], L.p[i + 1], L.p[i + 2])); }
  return out;
}
function seek(t) {
  t = ((t % DUR) + DUR) % DUR;
  // quanto si sposta l'immagine in un sottofotogramma (1/180 s): se tanto, si media dentro il sottofotogramma
  const A = headScreen(t), B = headScreen(Math.max(0, t - 1 / 180));
  let px = 0;
  A.forEach((q, i) => { if (q[2] > NEAR && B[i][2] > NEAR) px = Math.max(px, Math.hypot(q[0] - B[i][0], q[1] - B[i][1])); });
  const n = Math.min(10, Math.max(1, Math.ceil(px / 2.5)));
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
    buildShapes();
    buildTunnel();
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
    const L = lineAt(t), cam = camera(t), [a, b] = trim(t);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = Math.floor(a * (N - 1)); i <= Math.ceil(b * (N - 1)); i++) {
      const q = project(cam, L.p[i * 3], L.p[i * 3 + 1], L.p[i * 3 + 2]);
      x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
    }
    return [x0, y0, x1, y1].map(Math.round);
  },
  // dove si trova la punta della penna sullo schermo: serve all'audio per il fruscio
  penSpeed(rate = 200) {
    const out = [];
    let prev = null;
    for (let i = 0; i <= DUR * rate; i++) {
      const t = i / rate, L = lineAt(t), cam = camera(t), [, b] = trim(t), k = Math.round(b * (N - 1)) * 3;
      const q = project(cam, L.p[k], L.p[k + 1], L.p[k + 2]);
      out.push(prev ? Math.min(20000, Math.hypot(q[0] - prev[0], q[1] - prev[1]) * rate) : 0);
      prev = q;
    }
    return out;
  },
};
