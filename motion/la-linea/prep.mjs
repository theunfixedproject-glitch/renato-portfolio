// Trasforma le parole in una linea sola: i contorni delle lettere di Fira Code, appesi a un rigo.
// La penna corre sul rigo da sinistra a destra, sale in ogni lettera, ne fa il giro e ridiscende;
// buchi (o, a, e) e puntini (i) si raggiungono con un trattino che va e torna.
// uso: dalla cartella la-linea, node prep.mjs  → glyphs.json
import opentype from "opentype.js";
import fs from "node:fs";

const buf = fs.readFileSync("../node_modules/@fontsource/fira-code/files/fira-code-latin-700-normal.woff");
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));

// larghezza voluta di ogni parola, in pixel del fotogramma 1080×1920
const WORDS = { una: 900, sola: 900, linea: 900, AI: 880, bot: 900, app: 880, sito: 900, Renato: 900, Manzotti: 900 };

function contoursOf(text, size) {
  const cmds = font.getPath(text, 0, 0, size).commands;
  const out = [];
  let cur = null, x = 0, y = 0;
  const steps = (x0, y0, x1, y1) => Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
  for (const c of cmds) {
    if (c.type === "M") { if (cur && cur.length > 1) out.push(cur); cur = [[c.x, c.y]]; x = c.x; y = c.y; }
    else if (c.type === "L") {
      const n = steps(x, y, c.x, c.y);
      for (let i = 1; i <= n; i++) cur.push([x + (c.x - x) * (i / n), y + (c.y - y) * (i / n)]);
      x = c.x; y = c.y;
    } else if (c.type === "Q") {
      const n = Math.max(4, steps(x, y, c.x, c.y));
      for (let i = 1; i <= n; i++) { const u = i / n, m = 1 - u; cur.push([m * m * x + 2 * m * u * c.x1 + u * u * c.x, m * m * y + 2 * m * u * c.y1 + u * u * c.y]); }
      x = c.x; y = c.y;
    } else if (c.type === "C") {
      const n = Math.max(4, steps(x, y, c.x, c.y));
      for (let i = 1; i <= n; i++) {
        const u = i / n, m = 1 - u;
        cur.push([m * m * m * x + 3 * m * m * u * c.x1 + 3 * m * u * u * c.x2 + u * u * u * c.x, m * m * m * y + 3 * m * m * u * c.y1 + 3 * m * u * u * c.y2 + u * u * u * c.y]);
      }
      x = c.x; y = c.y;
    } else if (c.type === "Z") { if (cur) { out.push(cur); cur = null; } }
  }
  if (cur && cur.length > 1) out.push(cur);
  // anelli aperti: l'ultimo punto non ripete il primo
  return out.map((c) => {
    const a = c[0], b = c[c.length - 1];
    return Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5 ? c.slice(0, -1) : c;
  });
}

const bbox = (c) => {
  const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};
const inside = (a, b) => a.x0 > b.x0 && a.x1 < b.x1 && a.y0 > b.y0 && a.y1 < b.y1;
const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;

function oneLine(text, size) {
  const cs = contoursOf(text, size).map((pts) => ({ pts, bb: bbox(pts), kids: [] }));
  const rail = size * 0.08;
  // i contorni che toccano il rigo sono le lettere; gli altri (buchi, puntini) si appendono a una lettera
  const tops = [], rest = [];
  for (const c of cs) {
    const host = cs.find((o) => o !== c && inside(c.bb, o.bb));
    const near = c.bb.y1 > -size * 0.12;
    if (!host && near) tops.push(c); else rest.push(c);
  }
  for (const c of rest) {
    let best = null, bd = 1e18;
    for (const o of tops) for (const p of o.pts) for (const q of c.pts) { const d = d2(p, q); if (d < bd) { bd = d; best = o; } }
    best.kids.push(c);
  }
  tops.sort((a, b) => a.bb.x0 - b.bb.x0);

  const path = [];
  const x0 = Math.min(...tops.map((c) => c.bb.x0)), x1 = Math.max(...tops.map((c) => c.bb.x1));
  path.push([x0, rail]);
  for (const c of tops) {
    // si entra dal punto più vicino al rigo, il più a sinistra tra quelli quasi alla stessa altezza
    const dmin = Math.min(...c.pts.map((p) => Math.abs(p[1] - rail)));
    let k = 0, kx = 1e9;
    c.pts.forEach((p, i) => { if (Math.abs(p[1] - rail) <= dmin + 2 && p[0] < kx) { kx = p[0]; k = i; } });
    const loop = [...c.pts.slice(k), ...c.pts.slice(0, k)];
    // dove si stacca ciascun figlio: il punto della lettera più vicino a lui
    const spliceAt = new Map();
    for (const kid of c.kids) {
      let bi = 0, bj = 0, bd = 1e18;
      loop.forEach((p, i) => kid.pts.forEach((q, j) => { const d = d2(p, q); if (d < bd) { bd = d; bi = i; bj = j; } }));
      const kl = [...kid.pts.slice(bj), ...kid.pts.slice(0, bj), kid.pts[bj]];
      spliceAt.set(bi, [...(spliceAt.get(bi) ?? []), kl]);
    }
    path.push([loop[0][0], rail]);
    loop.forEach((p, i) => {
      path.push(p);
      for (const kl of spliceAt.get(i) ?? []) { path.push(...kl, p); }
    });
    path.push(loop[0], [loop[0][0], rail]);
  }
  path.push([x1, rail]);

  const xs = path.map((p) => p[0]), ys = path.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return {
    // il riempimento: i contorni veri del carattere, spostati come la linea
    fill: font.getPath(text, 0, 0, size).toPathData(2), ox: -cx, oy: -cy, size,
    pts: path.map(([x, y]) => [Math.round((x - cx) * 10) / 10, Math.round((y - cy) * 10) / 10]),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
    rail: Math.round((rail - cy) * 10) / 10,
  };
}

const out = {};
for (const [w, width] of Object.entries(WORDS)) {
  const probe = oneLine(w, 300);
  const size = Math.round((300 * width) / probe.w);
  out[w] = oneLine(w, size);
  console.log(w, out[w].pts.length, "punti", Math.round(out[w].w), "×", Math.round(out[w].h), "rigo", out[w].rail);
}
fs.writeFileSync("glyphs.json", JSON.stringify(out));
