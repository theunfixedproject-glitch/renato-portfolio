"use strict";
/*
 * "Dentro il cursore" — showreel di Renato Manzotti.
 * Un cursore lampeggiante e uno zoom che non si ferma: ogni scena è nascosta in un dettaglio della precedente.
 * Tutto si calcola da t dentro window.seek(t): niente animazioni CSS, niente timer, nessuno stato tra un fotogramma e l'altro.
 */
const W = 1920, H = 1080, CX = 960, CY = 540, DUR = 20, BEAT = 0.5;
const COL = { v: "#a259ff", g: "#3dff9a", s: "#c79bff", k: "#060608", w: "#ffffff" };
const cv = document.getElementById("c");
// le scene disegnano sempre su "ctx": durante lo zoom lo si punta su una tela a parte, così le copie si mediano davvero
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
const expoInOut = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2);
// molla con smorzamento critico: arriva senza rimbalzare
const spring = (t, t0, w = 24) => { const x = t - t0; return x <= 0 ? 0 : 1 - (1 + w * x) * Math.exp(-w * x); };
// spinta sul battere: 1 sul colpo di cassa, poi scende in fretta
const kick = (t) => { const x = ((t % BEAT) + BEAT) % BEAT; return Math.exp(-x * 9); };
const font = (wgt, size) => `${Math.round(wgt)} ${size.toFixed(1)}px Syne`;
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixCol = (a, b, u) => { const A = hexRgb(a), B = hexRgb(b); return `rgb(${A.map((x, i) => Math.round(lerp(x, B[i], clamp(u)))).join(",")})`; };
function bg(c) { ctx.fillStyle = c; ctx.fillRect(-W * 60, -H * 60, W * 121, H * 121); }

/** Disegna più copie lungo una direzione: il mosso segue velocità e direzione dei movimenti veloci. */
function smear(dx, dy, draw) {
  const len = Math.hypot(dx, dy);
  if (len < 3) { draw(0, 0); return; }
  // ogni copia pesa uguale: la k-esima si disegna con opacità 1/k sopra le precedenti
  const n = Math.min(20, Math.ceil(len / 2) + 1);
  const a0 = ctx.globalAlpha;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = a0 / (i + 1);
    const u = i / (n - 1) - 0.5;
    draw(dx * u, dy * u);
  }
  ctx.globalAlpha = a0;
}

/* ------------------------------------------------------------------ */
/* testo                                                               */
/* ------------------------------------------------------------------ */
function textW(str, wgt, size) { ctx.font = font(wgt, size); return ctx.measureText(str).width; }
/** Una parola tagliata in strisce orizzontali che arrivano una dopo l'altra (effetto slit-scan). */
function sliceText(str, x, base, size, wgt, color, t0, t, dir = 1, opts = {}) {
  const n = opts.slices ?? 12, top = base - size * 0.82, hh = size * 0.98, dist = opts.dist ?? 1700;
  ctx.font = font(wgt, size);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const k = dir > 0 ? i : n - 1 - i;
    const st = t0 + k * (opts.stagger ?? 0.014);
    const out = opts.out != null ? spring(t, opts.out + k * 0.012, 26) : 0;
    const off = (1 - spring(t, st, 22)) * dist * dir - out * dist * (opts.outDir ?? -dir);
    const v = ((1 - spring(t - 1 / 120, st, 22)) - (1 - spring(t, st, 22))) * dist * dir * 120 / 60 + (opts.vx ?? 0);
    if (Math.abs(off) > W * 1.5) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-W * 4, top + (hh * i) / n, W * 9, hh / n + 0.6);
    ctx.clip();
    smear(-v * 0.7, 0, (sx) => ctx.fillText(str, x + off + sx, base));
    ctx.restore();
  }
}
/** Cambio parola come un tabellone: ogni lettera rotola in verticale. */
function rollText(oldS, newS, cx, base, size, wOld, wNew, color, t0, t, extra = {}) {
  const top = base - size * 0.86, bandH = size * 1.14;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-W, top, W * 4, bandH);
  ctx.clip();
  ctx.fillStyle = color;
  const draw = (s, wgt, sign) => {
    ctx.font = font(wgt, size);
    const sp = sign < 0 ? extra.spOld ?? 0 : 0;
    const tw = ctx.measureText(s).width + sp * (s.length - 1);
    let x = cx - tw / 2;
    for (let j = 0; j < s.length; j++) {
      const e = spring(t, t0 + j * 0.035, 26), ePrev = spring(t - 1 / 120, t0 + j * 0.035, 26);
      const y = sign < 0 ? -bandH * 1.25 * e : bandH * (1 - e);
      const vy = (sign < 0 ? -bandH : -bandH) * (e - ePrev) * 2;
      const ch = s[j], cw = ctx.measureText(s.slice(0, j + 1)).width - ctx.measureText(s.slice(0, j)).width;
      smear(0, -vy * 0.6, (sx, sy) => ctx.fillText(ch, x + sx, base + y + sy));
      x += cw + sp;
    }
  };
  if (oldS) draw(oldS, wOld, -1);
  draw(newS, wNew, 1);
  ctx.restore();
  void extra;
}
/** Testo che si digita, con il blocco che resta centrato man mano che cresce. */
function typeLayout(str, times, wgt, size, t) {
  ctx.font = font(wgt, size);
  let shift = 0;
  for (let i = 0; i < str.length; i++) {
    const adv = ctx.measureText(str.slice(0, i + 1)).width - ctx.measureText(str.slice(0, i)).width;
    shift += (adv / 2) * spring(t, times[i], 40);
  }
  let n = 0;
  for (const x of times) if (t >= x) n++;
  return { n, x0: CX - shift };
}
function caret(x, yTop, h, w, color) { ctx.fillStyle = color; ctx.fillRect(x, yTop, w, h); }

/* ------------------------------------------------------------------ */
/* forme per il morphing: contorni campionati per lunghezza d'arco      */
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
function arcPts(cx, cy, r, a0, a1, n = 16) { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
function rrect(w, h, r) {
  const x = w / 2, y = h / 2;
  return [
    ...arcPts(x - r, -y + r, r, -Math.PI / 2, 0),
    ...arcPts(x - r, y - r, r, 0, Math.PI / 2),
    ...arcPts(-x + r, y - r, r, Math.PI / 2, Math.PI),
    ...arcPts(-x + r, -y + r, r, Math.PI, Math.PI * 1.5),
  ];
}
const circle = (r) => arcPts(0, 0, r, -Math.PI / 2, Math.PI * 1.5, 120).slice(0, -1);
function bag() {
  // sacchetto: trapezio arrotondato, più largo in basso
  const tw = 300, bw = 380, h = 340, r = 26;
  return [
    ...arcPts(tw / 2 - r, -h / 2 + r, r, -Math.PI / 2, -0.2),
    ...arcPts(bw / 2 - r, h / 2 - r, r, 0.1, Math.PI / 2),
    ...arcPts(-bw / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI - 0.1),
    ...arcPts(-tw / 2 + r, -h / 2 + r, r, Math.PI + 0.2, Math.PI * 1.5),
  ].map(([x, y]) => [x, y + 40]);
}
function bubble() {
  const w = 520, h = 330, r = 70, x = w / 2, y = h / 2;
  return [
    ...arcPts(x - r, -y + r, r, -Math.PI / 2, 0),
    ...arcPts(x - r, y - r, r, 0, Math.PI / 2),
    [-x + 170, y], [-x + 70, y + 90], [-x + 95, y],
    ...arcPts(-x + r, y - r, r, Math.PI / 2, Math.PI).slice(4),
    ...arcPts(-x + r, -y + r, r, Math.PI, Math.PI * 1.5),
  ].map(([a, b]) => [a, b - 30]);
}
function tri(r) {
  // triangolo "play" con gli spigoli arrotondati
  const v = [0, 1, 2].map((i) => [Math.cos(-Math.PI / 2 + i * 2.0944) * r, Math.sin(-Math.PI / 2 + i * 2.0944) * r]).map(([x, y]) => [y * -1, x]);
  const out = [];
  for (let i = 0; i < 3; i++) {
    const a = v[i], b = v[(i + 1) % 3];
    for (let k = 0; k < 30; k++) out.push([lerp(a[0], b[0], k / 30), lerp(a[1], b[1], k / 30)]);
  }
  return out.map(([x, y]) => [x + 24, y]);
}
function star(r) {
  const o = [];
  for (let i = 0; i < 160; i++) {
    const a = -Math.PI / 2 + (i / 160) * Math.PI * 2;
    const k = Math.pow(Math.abs(Math.cos(2 * a)), 2.6);
    const rr = lerp(r * 0.26, r, k);
    o.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return o;
}
const SH = {
  dot: resample(circle(120)),
  web: resample(rrect(660, 420, 28)),
  bag: resample(bag()),
  phone: resample(rrect(300, 600, 52)),
  bubble: resample(bubble()),
  play: resample(tri(230)),
  star: resample(star(250)),
};
function fillPts(pts, ox, oy, sc, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(ox + x * sc, oy + y * sc) : ctx.moveTo(ox + x * sc, oy + y * sc)));
  ctx.closePath();
  ctx.fill();
}

/* ------------------------------------------------------------------ */
/* 3D minimo: proiezione prospettica e prismi estrusi                   */
/* ------------------------------------------------------------------ */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => mul(a, 1 / (Math.hypot(...a) || 1));
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const rotX = (p, a) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
function camera3(target, az, el, dist, F, ox = CX, oy = CY) {
  el = clamp(el, -1.55, 1.5605);
  const pos = addv(target, mul([Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)], dist));
  const fw = norm(sub(target, pos));
  const right = norm(cross(fw, [0, 1, 0]));
  const up = cross(right, fw);
  return {
    pos,
    p(v) { const d = sub(v, pos), z = dot(d, fw); return [ox + (F * dot(d, right)) / z, oy - (F * dot(d, up)) / z, z]; },
  };
}
const LIGHT = norm([-0.4, 0.8, 0.6]);
const shade = (hex, n) => mixCol("#000000", hex, 0.5 + 0.5 * clamp(dot(n, LIGHT) * 0.6 + 0.45));
/** Un prisma: contorno 2D (y verso il basso) sul piano (U,V), spessore lungo N. */
function prism(cam, c, U, V, N, outline, depth, colFront, colSide, scale = 1) {
  const to3 = ([x, y], n) => addv(addv(addv(c, mul(U, x * scale)), mul(V, -y * scale)), mul(N, n));
  const front = outline.map((p) => to3(p, depth / 2)), back = outline.map((p) => to3(p, -depth / 2));
  const facing = dot(N, sub(cam.pos, c)) > 0;
  const capNear = facing ? front : back;
  if (depth > 0.5) {
    const faces = [];
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const a = front[i], b = front[j], cc = back[j], d = back[i];
      const mid = mul(addv(addv(a, b), addv(cc, d)), 0.25);
      let n = norm(cross(sub(b, a), sub(d, a)));
      if (dot(n, sub(mid, c)) < 0) n = mul(n, -1); // verso l'esterno
      if (dot(n, sub(cam.pos, mid)) <= 0) continue;
      faces.push({ q: [a, b, cc, d], n, z: cam.p(mid)[2] });
    }
    faces.sort((p, q) => q.z - p.z);
    for (const f of faces) {
      const P = f.q.map((v) => cam.p(v));
      ctx.fillStyle = shade(colSide, f.n);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;
      ctx.beginPath();
      P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  const P = capNear.map((v) => cam.p(v));
  ctx.fillStyle = colFront;
  ctx.beginPath();
  P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.fill();
  return P;
}

/* ------------------------------------------------------------------ */
/* scena 1 · l'aggancio: il cursore scrive una domanda                  */
/* ------------------------------------------------------------------ */
const HOOK = "Hai un'idea?";
const HOOK_T = [0.5, 0.54, 0.58, 0.75, 0.77, 0.8, 0.83, 0.86, 0.89, 0.92, 0.95, 1.0];
const CARET_H = 150;
function hookState(t) {
  const size = 168;
  const L = typeLayout(HOOK, HOOK_T, 700, size, t);
  const wgt = 700 + (t >= 0.5 ? 100 * kick(t) : 0) - 260 * spring(t, 1.25, 20) * 0;
  const shown = HOOK.slice(0, L.n);
  const tw = shown ? textW(shown, wgt, size) : 0;
  const block = spring(t, 1.25, 30);
  const cw = lerp(7, 96, block);
  const cx = shown ? L.x0 + tw + 14 : CX - 3.5;
  return { size, wgt, shown, L, cx, cw, block };
}
function drawHook(t) {
  bg(COL.k);
  const s = hookState(t);
  const base = CY + 58;
  if (s.shown) {
    ctx.font = font(s.wgt, s.size);
    ctx.fillStyle = COL.w;
    // l'ultima lettera arriva dal basso; le altre sono già ferme
    const last = s.L.n - 1, pLast = spring(t, HOOK_T[last], 50);
    const before = s.shown.slice(0, last);
    ctx.fillText(before, s.L.x0, base);
    const bx = s.L.x0 + ctx.measureText(before).width;
    ctx.fillText(s.shown[last], bx, base + 40 * (1 - pLast));
  }
  const on = t >= 0.5 || Math.floor(t / 0.25) % 2 === 0;
  if (on) caret(s.cx, CY - CARET_H / 2, CARET_H, s.cw, mixCol(COL.w, COL.v, s.block));
}
const hookPortal = (t) => { const s = hookState(t); return { kind: "rect", x: s.cx, y: CY - CARET_H / 2, w: s.cw, h: CARET_H, color: COL.v }; };

/* ------------------------------------------------------------------ */
/* scena 2 · tipografia cinetica                                        */
/* ------------------------------------------------------------------ */
const GRID = [["SITI", "SHOP", "APP"], ["BOT", "AI", "VIDEO"]];
const CELL_W = 640;
function drawType(t) {
  bg(COL.v);
  const base = CY + 130, big = 360;
  const w800 = (tt) => 760 + 40 * kick(tt);
  if (t < 4.0) {
    if (t < 2.5) {
      // SITI arriva a strisce, poi si stringe e si allarga
      const sq = spring(t, 2.25, 22);
      const wgt = lerp(w800(t), 480, sq);
      ctx.letterSpacing = `${(60 * sq).toFixed(1)}px`;
      const tw = textW("SITI", wgt, big);
      sliceText("SITI", CX - tw / 2, base, big, wgt, COL.k, 1.9, t, 1);
      ctx.letterSpacing = "0px";
    } else {
      // inclinazione e allungamento: arrivano sul mezzo battito, se ne vanno col cambio di parola
      const sk = 0.28 * (spring(t, 2.75, 22) - spring(t, 3.0, 30));
      const sx = 1 + 0.42 * (spring(t, 3.25, 22) - spring(t, 3.5, 30));
      ctx.save();
      ctx.translate(CX, base);
      ctx.transform(sx, 0, -sk, 1, 0, 0);
      if (t < 3.0) rollText(t < 2.75 ? "SITI" : null, "SHOP", 0, 0, big, 480, w800(t), COL.k, 2.5, t, { spOld: 60 });
      else if (t < 3.5) rollText(t < 3.25 ? "SHOP" : null, "APP", 0, 0, big, w800(t), w800(t), COL.k, 3.0, t);
      else rollText(t < 3.75 ? "APP" : null, "BOT", 0, 0, big, w800(t), w800(t), COL.k, 3.5, t);
      ctx.restore();
    }
    if (t >= 3.5) {
      ctx.save();
      ctx.translate(CX, base);
      const ai = spring(t, 3.75, 30);
      if (ai > 0) {
        const tw = textW("BOT", w800(t), big);
        ctx.font = font(800, 150);
        ctx.fillStyle = COL.w;
        ctx.save();
        ctx.translate(tw / 2 + 30, -big * 0.42);
        ctx.scale(ai, ai);
        ctx.fillText("+AI", 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }
    return;
  }
  // la griglia: sei parole che scorrono e si scambiano peso e colore
  const maxW = Math.max(...GRID.flat().map((w) => textW(w, 800, 100))) / 100;
  const gs = Math.min(200, 500 / maxW);
  const cellW = CELL_W, rowY = [CY - 40, CY + 230];
  const shiftR0 = -spring(t, 4.25, 22), shiftR1 = spring(t, 4.25, 22);
  const leave = spring(t, 5.0, 30);
  const leaveV = (spring(t, 5.0, 30) - spring(t - 1 / 60, 5.0, 30)) * 2200;
  GRID.forEach((row, r) =>
    row.forEach((word, c) => {
      const idx = r * 3 + c;
      if (word === "VIDEO" && t >= 5.0) return;
      const sh = r === 0 ? shiftR0 : shiftR1;
      const col = c + sh;
      const wgt = lerp(800, idx % 2 ? 800 : 420, spring(t, 4.5, 22)) + 30 * kick(t);
      const color = word === "AI" ? mixCol(COL.k, COL.w, spring(t, 4.75, 26)) : COL.k;
      const tw = textW(word, wgt, gs);
      // la parola che esce da un lato rientra dall'altro
      for (const wrap of sh < -0.001 ? [0, 3] : sh > 0.001 ? [0, -3] : [0]) {
        const cx = CX + (col + wrap - 1) * cellW;
        if (Math.abs(cx - CX) > 1500) continue;
        let x = cx - tw / 2;
        if (word === "BOT") {
          // BOT arriva dal centro della scena prima
          const m = spring(t, 4.0, 20);
          const sz = lerp(big, gs, m), w0 = textW("BOT", wgt, sz);
          const fromX = CX - w0 / 2;
          ctx.font = font(wgt, sz);
          ctx.fillStyle = color;
          if (wrap === 0) {
            const bx = lerp(fromX, x, m), by = lerp(base, rowY[r], m);
            smear(-(r === 0 ? -1 : 1) * leaveV * 0.7, 0, (sx) => ctx.fillText(word, bx + (r === 0 ? -1 : 1) * leave * 2200 + sx, by));
          }
          continue;
        }
        sliceText(word, x + (r === 0 ? -1 : 1) * leave * 2200, rowY[r], gs, wgt, color, 4.0 + idx * 0.04, t, r === 0 ? 1 : -1, { dist: 1600, vx: (r === 0 ? -1 : 1) * leaveV });
      }
    }),
  );
  if (t >= 5.0) drawVideoWord(t, gs, cellW, rowY);
}
function videoState(t, gs, cellW, rowY) {
  const m = spring(t, 5.07, 22);
  const sz = lerp(gs, 300, m);
  // VIDEO dopo lo scorrimento della seconda riga sta nella prima colonna
  const startX = CX - cellW - textW("VIDEO", 800, gs) / 2;
  const fullW = textW("VIDEO", 800, sz), tw = textW("VIDE", 800, sz);
  const x0 = lerp(startX, CX - fullW / 2, m);
  const y = lerp(rowY[1], CY + 110, m);
  ctx.font = font(800, sz);
  const mo = ctx.measureText("O");
  // l'anello prende le misure della O: centro, larghezza, altezza, spessore del tratto
  const rx = (mo.actualBoundingBoxLeft + mo.actualBoundingBoxRight) / 2, ry = (mo.actualBoundingBoxAscent + mo.actualBoundingBoxDescent) / 2;
  const ox = x0 + tw - mo.actualBoundingBoxLeft + rx, oy = y - mo.actualBoundingBoxAscent + ry;
  const split = spring(t, 5.25, 20);
  const R = lerp(ry, 190, split);
  return { sz, x0, y, tw, split, rx: lerp(rx, R, split), ry: R, ocx: lerp(ox, CX + 260, split), ocy: lerp(oy, CY, split), thick: lerp(sz * 0.15, R, spring(t, 5.25, 16)) };
}
function drawVideoWord(t, gs, cellW, rowY) {
  const s = videoState(t, gs, cellW, rowY);
  ctx.font = font(800, s.sz * (1 - 0.45 * s.split));
  ctx.fillStyle = COL.k;
  ctx.fillText("VIDE", lerp(s.x0, CX - 420, s.split), lerp(s.y, CY + 60, s.split));
  ctx.beginPath();
  ctx.ellipse(s.ocx, s.ocy, s.rx, s.ry, 0, 0, Math.PI * 2);
  const ir = Math.max(0, s.ry - s.thick);
  if (ir > 0.5) ctx.ellipse(s.ocx, s.ocy, Math.max(0, s.rx - s.thick), ir, 0, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
}
function typePortal(t) {
  const maxW = Math.max(...GRID.flat().map((w) => textW(w, 800, 100))) / 100;
  const gs = Math.min(200, 500 / maxW);
  const s = videoState(t, gs, CELL_W, [CY - 40, CY + 230]);
  return { kind: "circle", x: s.ocx, y: s.ocy, r: s.ry, color: COL.k };
}

/* ------------------------------------------------------------------ */
/* scena 3 · le forme, poi il 3D                                        */
/* ------------------------------------------------------------------ */
const SHAPES = [
  { t: 6.0, pts: SH.dot, col: COL.w, label: "idea" },
  { t: 6.5, pts: SH.web, col: COL.w, label: "web" },
  { t: 7.0, pts: SH.bag, col: COL.g, label: "shop" },
  { t: 7.5, pts: SH.phone, col: COL.w, label: "app" },
  { t: 8.0, pts: SH.bubble, col: COL.s, label: "bot" },
  { t: 8.5, pts: SH.play, col: COL.g, label: "video" },
  { t: 9.0, pts: SH.star, col: COL.v, label: "AI" },
  { t: 9.5, pts: SH.phone, col: COL.w, label: "" },
];
const SHAPE_Y = CY - 50;
function shapeAt(t) {
  let i = 0;
  while (i < SHAPES.length - 1 && t >= SHAPES[i + 1].t) i++;
  const a = SHAPES[Math.max(0, i - 1)], b = SHAPES[i];
  const m = i === 0 ? 1 : spring(t, b.t, 22);
  const pts = b.pts.map((p, k) => [lerp(a.pts[k][0], b.pts[k][0], m), lerp(a.pts[k][1], b.pts[k][1], m)]);
  return { i, pts, col: mixCol(a.col, b.col, m), m };
}
function drawShapes(t) {
  bg(COL.k);
  const push = 1 + 0.025 * Math.max(0, t - 6);
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(push, push);
  ctx.translate(-CX, -CY);
  const s = shapeAt(t);
  const cur = SHAPES[s.i];
  // la forma gira appena durante il passaggio, nel verso del cambio
  const turn = (1 - s.m) * 0.25 * (s.i % 2 ? 1 : -1);
  ctx.save();
  ctx.translate(CX, SHAPE_Y);
  ctx.rotate(turn);
  fillPts(s.pts, 0, 0, 1, s.col);
  // dettagli: compaiono sul mezzo battito, spariscono al cambio successivo
  const next = SHAPES[s.i + 1]?.t ?? 99;
  const a = spring(t, cur.t + 0.25, 28) * (1 - spring(t, next, 40));
  if (a > 0.01) shapeDetails(cur.label, a, t, cur.t);
  ctx.restore();
  // l'etichetta rotola sul mezzo battito
  const at = (k) => SHAPES[k].t + 0.04;
  let li = 0;
  while (li < SHAPES.length - 1 && t >= at(li + 1)) li++;
  const lt = at(li);
  const label = SHAPES[li].label;
  const prev = li > 0 && t < lt + 0.4 ? SHAPES[li - 1].label : null;
  if (label || prev) rollText(prev, label, CX, CY + 420, 84, 600, 600, COL.s, lt, t);
  ctx.restore();
}
function shapeDetails(label, a, t, t0) {
  ctx.save();
  ctx.scale(a, a);
  if (label === "web") {
    ctx.fillStyle = COL.k;
    ctx.fillRect(-330, -150, 660, 6);
    [COL.v, COL.g, COL.s].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-290 + i * 34, -180, 10, 0, 7); ctx.fill(); });
    ctx.fillStyle = COL.v;
    ctx.fillRect(-270, -100, 300 * spring(t, t0 + 0.3, 20), 46);
    ctx.fillStyle = COL.k;
    ctx.fillRect(-270, -20, 460 * spring(t, t0 + 0.35, 20), 18);
    ctx.fillRect(-270, 20, 380 * spring(t, t0 + 0.4, 20), 18);
    ctx.fillStyle = COL.g;
    ctx.fillRect(-270, 80, 180 * spring(t, t0 + 0.42, 20), 52);
  } else if (label === "shop") {
    ctx.strokeStyle = COL.g;
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.arc(0, -130, 80, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = COL.k;
    ctx.font = font(800, 120);
    ctx.textAlign = "center";
    ctx.fillText("€", 0, 100);
    ctx.textAlign = "left";
  } else if (label === "app") {
    ctx.fillStyle = COL.k;
    ctx.beginPath();
    ctx.roundRect(-55, -280, 110, 26, 13);
    ctx.fill();
    ctx.fillStyle = COL.v;
    ctx.beginPath();
    ctx.roundRect(-110, -200, 220, 150, 22);
    ctx.fill();
    ctx.fillStyle = COL.g;
    ctx.beginPath();
    ctx.roundRect(-110, -30, 220, 70, 18);
    ctx.fill();
    ctx.fillStyle = COL.k;
    ctx.beginPath();
    ctx.roundRect(-110, 60, 150, 26, 13);
    ctx.fill();
  } else if (label === "bot") {
    for (let i = 0; i < 3; i++) {
      const lit = Math.floor((t - t0) / 0.125) % 3 === i;
      ctx.fillStyle = COL.k;
      ctx.beginPath();
      ctx.arc(-80 + i * 80, -30, lit ? 26 : 18, 0, 7);
      ctx.fill();
    }
  } else if (label === "video") {
    ctx.strokeStyle = COL.k;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(24, 0, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * spring(t, t0 + 0.3, 14));
    ctx.stroke();
  }
  ctx.restore();
}

// il 3D: il telefono prende spessore, si apre a strati, si sdraia tra le altre tessere
const PHONE = rrect(300, 600, 52).map(([x, y]) => [x, y]);
const PHONE_LAYERS = [
  { o: rrect(220, 150, 22), y: -125, c: COL.v, z: 70 },
  { o: rrect(220, 70, 18), y: -5, c: COL.g, z: 140 },
  { o: rrect(150, 26, 13), y: 75, c: COL.k, z: 210, x: -35 },
  { o: rrect(110, 26, 13), y: -267, c: COL.k, z: 30 },
  { o: rrect(240, 90, 30), y: 180, c: COL.s, z: 290 },
];
const TILES = [
  { o: rrect(230, 150, 22), c: COL.w, ang: 0, h: [90, 120] },
  { o: rrect(160, 160, 26), c: COL.g, ang: 1, h: [160, 420] },
  { o: rrect(220, 150, 50), c: COL.s, ang: 2, h: [230, 180] },
  { o: rrect(170, 170, 85), c: COL.v, ang: 3, h: [300, 260] },
  { o: rrect(200, 140, 22), c: COL.w, ang: 4, h: [370, 220] },
];
const TILE_R = 430;
function tilePos(i) { const a = -Math.PI / 2 + (i + 0.5) * ((Math.PI * 2) / 5) + 0.3; return [Math.cos(a) * TILE_R, 0, Math.sin(a) * TILE_R]; }
function cam3At(t) {
  const push = 1 + 0.025 * 3.75;
  const F = 1500, dist = F / push;
  const az = -0.48 * spring(t, 10.0, 10) - 0.32 * spring(t, 10.75, 10) + 1.0 * spring(t, 11.5, 9) - 0.2 * spring(t, 12.0, 8) + 0.0;
  let el = 0.32 * spring(t, 10.5, 10) - 0.12 * spring(t, 11.5, 10) + 0.55 * spring(t, 12.0, 8) + 0.8 * spring(t, 13.0, 10);
  let dd = dist + 380 * spring(t, 12.0, 7) + 120 * spring(t, 12.5, 8) - 300 * spring(t, 13.0, 9);
  const green = tilePos(1), gh = tileHeight(1, t);
  const tgt = [lerp(0, green[0], spring(t, 13.0, 10)), lerp(-50, gh, spring(t, 13.0, 10)), lerp(0, green[2], spring(t, 13.0, 10))];
  const azF = lerp(az, 0, spring(t, 13.0, 10));
  return camera3(tgt, azF, el, dd, F);
}
function tileHeight(i, t) { const T = TILES[i]; return lerp(4, T.h[0], spring(t, 12.5 + i * 0.05, 14)) + (T.h[1] - T.h[0]) * spring(t, 13.0, 14); }
function draw3D(t) {
  bg(COL.k);
  const cam = cam3At(t);
  const depth = 56 * spring(t, 9.85, 14);
  const lie = spring(t, 12.0, 9);
  // orientamento del telefono: in piedi, poi sdraiato con lo schermo verso l'alto
  const U = [1, 0, 0], V = rotX([0, 1, 0], -lie * Math.PI / 2), N = rotX([0, 0, 1], -lie * Math.PI / 2);
  const c = [0, lerp(0, depth / 2, lie), 0];
  const objs = [];
  // le tessere attorno, sul pavimento
  TILES.forEach((T, i) => {
    const appear = spring(t, 12.0 + i * 0.06, 20);
    if (appear < 0.01) return;
    const p = tilePos(i), h = tileHeight(i, t);
    objs.push({ z: cam.p(p)[2], draw: () => prism(cam, [p[0], h / 2, p[2]], [1, 0, 0], [0, 0, -1], [0, 1, 0], T.o, h, T.c, T.c, appear) });
  });
  objs.push({ z: cam.p(c)[2], draw: () => drawPhone3(cam, t, c, U, V, N, depth) });
  objs.sort((a, b) => b.z - a.z).forEach((o) => o.draw());
}
function drawPhone3(cam, t, c, U, V, N, depth) {
  prism(cam, c, U, V, N, PHONE, depth, COL.w, COL.v);
  const explode = spring(t, 10.5, 12) * (1 - spring(t, 11.75, 12));
  const pop = spring(t, 11.25, 16) * (1 - spring(t, 11.75, 12));
  const flip = spring(t, 11.0, 24) * (1 - spring(t, 11.75, 20));
  const swap = [COL.g, COL.v, COL.k, COL.k, COL.s];
  PHONE_LAYERS.forEach((L, i) => {
    const a = spring(t, 10.25 + i * 0.05, 26);
    if (a < 0.01) return;
    const z = depth / 2 + 2 + (L.z + (i === 4 ? 160 * pop : 0)) * explode;
    const cc = addv(addv(c, mul(V, -L.y)), addv(mul(N, z), mul(U, L.x ?? 0)));
    const col = flip > 0.5 ? swap[i] : L.c;
    prism(cam, cc, U, V, N, L.o, 6 + 10 * explode, col, col, a);
  });
}
function portal3D(t) {
  const cam = cam3At(t);
  const p = tilePos(1), h = tileHeight(1, t);
  const top = TILES[1].o.map(([x, y]) => cam.p([p[0] + x, h, p[2] + y]));
  const xs = top.map((q) => q[0]), ys = top.map((q) => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  // il rettangolo inscritto nella faccia superiore (vista dall'alto: quasi un quadrato)
  const inset = 0.12;
  return { kind: "rect", x: lerp(x0, x1, inset), y: lerp(y0, y1, inset), w: (x1 - x0) * (1 - 2 * inset), h: (y1 - y0) * (1 - 2 * inset), r: 0, color: COL.g, poly: top };
}
function drawShapes3D(t) { if (t < 9.85) drawShapes(t); else draw3D(t); }

/* ------------------------------------------------------------------ */
/* scena 4 · i dati: Lighthouse a 100                                   */
/* ------------------------------------------------------------------ */
const GAUGES = [
  { t: 14.0, label: "velocità" },
  { t: 14.5, label: "SEO" },
  { t: 15.0, label: "accessibile" },
  { t: 15.25, label: "qualità" },
];
const G_R = 140, G_Y = CY - 30;
const gx = (i) => CX + (i - 1.5) * 430;
function odometer(v, x, y, size, color) {
  ctx.font = font(700, size);
  const dw = ctx.measureText("0").width, lh = size * 1.05;
  const n = Math.floor(v), frac = v - n;
  const digits = Math.max(1, String(Math.min(100, n + (frac > 0.01 ? 1 : 0))).length);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - (dw * digits) / 2 - 10, y - size * 0.86, dw * digits + 20, lh);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  for (let p = 0; p < digits; p++) {
    const pow = Math.pow(10, p);
    const d = Math.floor(n / pow) % 10;
    const r = p === 0 ? frac : (n % pow) === pow - 1 ? frac : 0;
    const cx = x + (digits / 2 - p - 0.5) * dw;
    if (p > 0 && n < pow && !(n + 1 >= pow && r > 0)) continue;
    // la cifra in testa che sta arrivando (es. l'1 di 100) entra senza uno zero davanti
    if (!(p > 0 && n < pow)) ctx.fillText(String(d), cx, y - r * lh);
    if (r > 0) ctx.fillText(String((d + 1) % 10), cx, y + (1 - r) * lh);
  }
  ctx.restore();
  ctx.textAlign = "left";
}
function gaugeFill(i, t) { return expoOut(prog(t, GAUGES[i].t, GAUGES[i].t + 0.42)); }
function drawData(t) {
  bg(COL.g);
  const push = 1 + 0.03 * Math.max(0, t - 14);
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(push, push);
  ctx.translate(-CX, -CY);
  // titolo
  const head = spring(t, 14.25, 26);
  if (head > 0) {
    ctx.globalAlpha = head;
    ctx.font = font(700, 54);
    ctx.fillStyle = COL.k;
    ctx.textAlign = "center";
    ctx.fillText("Lighthouse", CX, 190 + 30 * (1 - head));
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }
  GAUGES.forEach((g, i) => {
    const appear = spring(t, 14.0 + i * 0.06, 24);
    if (appear < 0.01) return;
    const x = gx(i), f = gaugeFill(i, t);
    const close = i === 3 ? spring(t, 15.5, 16) : 0;
    ctx.save();
    ctx.translate(x, G_Y);
    ctx.scale(appear, appear);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(6,6,8,0.22)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, G_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = COL.k;
    ctx.lineWidth = 26;
    if (f > 0.002) {
      ctx.beginPath();
      ctx.arc(0, 0, G_R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
      ctx.stroke();
    }
    odometer(100 * f, 0, 34, 104, COL.k);
    if (close > 0) {
      // l'anello si chiude verso il centro: diventa un disco
      ctx.fillStyle = COL.k;
      ctx.beginPath();
      ctx.arc(0, 0, G_R + 13, 0, Math.PI * 2);
      ctx.arc(0, 0, Math.max(0, (G_R - 13) * (1 - close)), 0, Math.PI * 2, true);
      ctx.fill("evenodd");
    }
    ctx.restore();
    const lt = spring(t, g.t + 0.25, 26);
    if (lt > 0 && i < 3) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 220, G_Y + 200, 440, 70);
      ctx.clip();
      ctx.font = font(600, 44);
      ctx.fillStyle = COL.k;
      ctx.textAlign = "center";
      ctx.fillText(g.label, x, G_Y + 252 + 70 * (1 - lt));
      ctx.restore();
      ctx.textAlign = "left";
    }
    if (i === 3) {
      const l4 = spring(t, 15.25, 26) * (1 - close);
      if (l4 > 0) { ctx.globalAlpha = l4; ctx.font = font(600, 44); ctx.fillStyle = COL.k; ctx.textAlign = "center"; ctx.fillText(g.label, x, G_Y + 252); ctx.textAlign = "left"; ctx.globalAlpha = 1; }
    }
  });
  ctx.restore();
}
function dataPortal(t) {
  const push = 1 + 0.03 * Math.max(0, t - 14);
  return { kind: "circle", x: CX + (gx(3) - CX) * push, y: CY + (G_Y - CY) * push, r: (G_R + 13) * push, color: COL.k };
}

/* ------------------------------------------------------------------ */
/* scena 5 · la rete del preventivo, il volo, il nome                   */
/* ------------------------------------------------------------------ */
const NODES = (() => {
  const n = [{ id: "tu", p: [0, 0, 1000], r: 92, c: COL.w, label: "tu", t: 16.0 }];
  ["sito", "shop", "app", "bot"].forEach((l, i) => { const a = Math.PI / 4 + (i * Math.PI) / 2; n.push({ id: l, p: [Math.cos(a) * 430, Math.sin(a) * 290, 1000], r: 58, c: [COL.v, COL.g, COL.s, COL.w][i], label: l, t: 16.0 + i * 0.05 }); });
  ["AI", "video", "SEO", "100"].forEach((l, i) => { const a = (i * Math.PI) / 2; n.push({ id: l, p: [Math.cos(a) * 660, Math.sin(a) * 380, 1150], r: 48, c: [COL.g, COL.s, COL.v, COL.g][i], label: l, t: 16.25 + i * 0.05 }); });
  // più in profondità: quello che i servizi fanno succedere
  [["ordini", [-760, -520, 1550], COL.g], ["chat", [820, 420, 1750], COL.s], ["prenota", [-900, 420, 1980], COL.v], ["paga", [430, -360, 2200], COL.w]].forEach(([l, p, c], i) => n.push({ id: l, p, r: 62, c, label: l, t: 16.5 + i * 0.05 }));
  ["Google", "WhatsApp", "Instagram", "Maps"].forEach((l, i) => { const a = 0.4 + (i * Math.PI) / 2; n.push({ id: l, p: [Math.cos(a) * 820, Math.sin(a) * 470, 2650], r: 80, c: [COL.w, COL.g, COL.s, COL.v][i], label: l, t: 16.75 + i * 0.05 }); });
  n.push({ id: "clienti", p: [-330, 210, 3560], r: 150, c: COL.g, label: "clienti", t: 17.0 });
  [[-260, -380, 1350], [420, 300, 1450], [-700, 160, 1650], [300, -260, 1850], [-140, 430, 2050], [760, -60, 2350], [-430, -90, 2500], [180, 420, 2800], [-760, -360, 2950], [620, 380, 3150], [40, -440, 3300]].forEach((p, i) => n.push({ id: "d" + i, p, r: 22, c: [COL.v, COL.s, COL.g][i % 3], t: 16.5 + i * 0.03 }));
  return n;
})();
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
const LINKS = [
  ...["sito", "shop", "app", "bot"].map((id) => ["tu", id, 16.0]),
  ["sito", "AI", 16.25], ["shop", "video", 16.25], ["app", "SEO", 16.25], ["bot", "100", 16.25], ["AI", "shop", 16.5], ["video", "app", 16.5], ["SEO", "bot", 16.5], ["100", "sito", 16.5],
  ["ordini", "shop", 16.5], ["chat", "bot", 16.55], ["prenota", "app", 16.6], ["paga", "sito", 16.65],
  ["Google", "sito", 16.75], ["WhatsApp", "chat", 16.8], ["Instagram", "video", 16.85], ["Maps", "prenota", 16.9],
  ["clienti", "Google", 17.0], ["clienti", "WhatsApp", 17.0], ["clienti", "Instagram", 17.0], ["clienti", "Maps", 17.0],
  ["d0", "ordini", 16.6], ["d1", "chat", 16.6], ["d2", "prenota", 16.6], ["d3", "paga", 16.6], ["d5", "Maps", 16.9], ["d6", "Google", 16.9], ["d9", "clienti", 17.0],
];
function camZ(t) {
  // avanza piano, poi accelera e attraversa la rete
  return 160 * prog(t, 16.0, 16.8) + 3150 * Math.pow(prog(t, 16.75, 18.0), 2.0);
}
const camXY = (t) => { const u = Math.pow(prog(t, 16.75, 18.0), 1.4); return [-300 * u, 190 * u]; };
function nodeScreen(n, t) {
  const z = n.p[2] - camZ(t);
  if (z < 60) return null;
  const s = 1000 / z, [ox, oy] = camXY(t);
  return { x: CX + (n.p[0] - ox) * s, y: CY + (n.p[1] - oy) * s, s, z, near: clamp((z - 60) / 260) };
}
const sstepC = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const collapse = (t) => spring(t, 18.0, 30);
function drawNodes(t) {
  bg(COL.k);
  const col = collapse(t);
  const vis = (n) => spring(t, n.t, 26);
  // i collegamenti, con i puntini che corrono verso il centro
  ctx.lineCap = "round";
  for (const [a, b, t0] of LINKS) {
    const A = nodeScreen(byId[a], t), B = nodeScreen(byId[b], t);
    if (!A || !B) continue;
    const g = spring(t, t0, 18) * (1 - col);
    if (g < 0.01) continue;
    const ex = lerp(A.x, B.x, g), ey = lerp(A.y, B.y, g);
    ctx.strokeStyle = "rgba(199,155,255,0.5)";
    ctx.lineWidth = Math.max(2, 4 * Math.min(A.s, B.s));
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    if (g > 0.99) {
      const u = ((t * 1.6 + (a.length + b.length) * 0.13) % 1);
      ctx.fillStyle = COL.g;
      ctx.beginPath();
      ctx.arc(lerp(B.x, A.x, u), lerp(B.y, A.y, u), Math.max(3, 6 * Math.min(A.s, B.s)), 0, 7);
      ctx.fill();
    }
  }
  // i nodi, dal più lontano al più vicino
  const list = NODES.map((n) => ({ n, S: nodeScreen(n, t), S0: nodeScreen(n, t - 1 / 90) })).filter((o) => o.S).sort((a, b) => b.S.z - a.S.z);
  for (const { n, S, S0 } of list) {
    const a = vis(n) * S.near;
    if (a < 0.01) continue;
    let x = S.x, y = S.y, r = n.r * S.s * a;
    // il collasso: tutto finisce su una linea
    x = lerp(x, CX + (x - CX) * 0.6, col);
    y = lerp(y, CY, col);
    r = lerp(r, 3, col);
    const dx = S0 ? S.x - S0.x : 0, dy = S0 ? S.y - S0.y : 0;
    ctx.fillStyle = n.c;
    ctx.globalAlpha = 1 - sstepC(0.75, 1, col);
    smear(-dx * 0.8, -dy * 0.8, (sx, sy) => { ctx.beginPath(); ctx.arc(x + sx, y + sy, Math.max(0.5, r), 0, 7); ctx.fill(); });
    const near = n.id === "tu" || n.id === "clienti" ? 1 : clamp((S.s - 0.5) / 0.25);
    if (n.label && col < 0.5 && r > 6 && near > 0.01) {
      const fs = clamp(36 * S.s * (n.id === "tu" ? 1.3 : 1), 24, 220) * a;
      ctx.font = font(n.id === "tu" ? 800 : 600, fs);
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.max(0, 1 - col * 2) * near;
      if (n.id === "tu") { ctx.fillStyle = COL.k; ctx.fillText(n.label, x, y + fs * 0.34); }
      else { ctx.fillStyle = COL.w; ctx.fillText(n.label, x, y + r + fs * 1.05); }
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }
  }
  // il prezzo sotto "tu" sale man mano che la rete cresce
  const tu = nodeScreen(byId.tu, t);
  if (tu && col < 0.5) {
    const pv = lerp(900, 4500, expoOut(prog(t, 16.75, 17.35)));
    const show = spring(t, 16.75, 26);
    if (show > 0.01) {
      const fs = 46 * tu.s;
      ctx.globalAlpha = show * (1 - col * 2);
      ctx.font = font(700, fs);
      const label = `${(Math.round(pv / 50) * 50).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;
      const pw = textW("4.500 €", 700, fs) + fs * 0.9, py = tu.y + 92 * tu.s + fs * 0.35;
      ctx.fillStyle = COL.k;
      ctx.beginPath();
      ctx.roundRect(tu.x - pw / 2, py, pw, fs * 1.4, fs * 0.7);
      ctx.fill();
      ctx.strokeStyle = COL.g;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = COL.g;
      ctx.textAlign = "center";
      ctx.fillText(label, tu.x, py + fs * 1.06);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }
  }
  // la linea bianca del collasso
  if (col > 0.01) {
    // la linea si stringe verso il punto dove il cursore comincerà a scrivere il nome
    const sh = spring(t, 18.1, 26), start = nameStartX();
    const l = lerp(CX - 820, start, sh), r = lerp(CX + 820, start + 7, sh);
    ctx.fillStyle = COL.w;
    ctx.globalAlpha = col;
    const tall = Math.pow(sh, 6); // resta una linea sottile finché non si è stretta, poi si alza: è il cursore
    ctx.fillRect(l, lerp(CY - 2, CY - 20 - nameSize() * 0.78, tall), r - l, lerp(4, nameSize() * 0.95, tall));
    ctx.globalAlpha = 1;
  }
}
// il titolo finale, poi si cancella fino al cursore
const NAME = "Renato Manzotti", TAG = "Siti, app e bot su misura";
const nameSize = () => Math.min(150, 1560 / (textW(NAME, 800, 100) / 100));
const nameStartX = () => CX - textW(NAME, 800, nameSize()) / 2;
const NAME_T = [...NAME].map((_, i) => 18.25 + i * 0.016);
const TAG_T = [...TAG].map((_, i) => 18.5 + i * 0.009);
const DEL0 = 19.5;
function drawTitle(t) {
  bg(COL.k);
  const nameFit = nameSize();
  const tagSize = 66;
  // cancellazione: prima il sottotitolo, poi il nome, una lettera alla volta
  const delTag = Math.floor(clamp((t - DEL0) / 0.12) * TAG.length);
  const delName = Math.floor(clamp((t - DEL0 - 0.12) / 0.23) * NAME.length);
  let typed = 0;
  for (const x of NAME_T) if (t >= x) typed++;
  let nShown = Math.max(0, typed - delName);
  const name = NAME.slice(0, nShown);
  const wgt = 780 + 20 * kick(t);
  const fullW = textW(NAME, 800, nameFit);
  // durante la cancellazione il blocco resta centrato su quello che rimane
  const remW = textW(name, 800, nameFit);
  const x0 = lerp(CX - fullW / 2, CX - remW / 2, spring(t, DEL0 + 0.12, 30));
  const base = CY - 20;
  const end = spring(t, 19.8, 45);
  if (name) {
    ctx.font = font(wgt, nameFit);
    ctx.fillStyle = COL.w;
    ctx.fillText(name, x0, base);
  }
  // il trattino: la linea del collasso diventa la lineetta tra nome e sottotitolo
  const dashW = (fullW * 0.18 + fullW * 0.82 * spring(t, 19.25, 20)) * spring(t, 18.5, 24) * (1 - spring(t, DEL0 + 0.08, 30));
  if (dashW > 1) { ctx.fillStyle = COL.w; ctx.fillRect(CX - dashW / 2, CY + 34, dashW, 5); }
  let tn = 0;
  for (const x of TAG_T) if (t >= x) tn++;
  tn = Math.max(0, tn - delTag);
  if (tn > 0) {
    const tag = TAG.slice(0, tn);
    ctx.font = font(500, tagSize);
    const tw = ctx.measureText(TAG).width;
    const tx = CX - tw / 2;
    const green = spring(t, 18.75, 26);
    const cut = Math.min(tn, TAG.indexOf("su misura"));
    ctx.fillStyle = COL.s;
    ctx.fillText(tag.slice(0, cut), tx, CY + 130);
    if (tn > cut) { ctx.fillStyle = mixCol(COL.s, COL.g, green); ctx.fillText(tag.slice(cut), tx + ctx.measureText(tag.slice(0, cut)).width, CY + 130); }
  }
  // il cursore: segue il testo, alla fine torna al centro come nel primo fotogramma
  ctx.font = font(wgt, nameFit);
  const cxText = name ? x0 + ctx.measureText(name).width + 14 : t < DEL0 ? nameStartX() : CX - 3.5;
  const ytop = lerp(base - nameFit * 0.78, CY - CARET_H / 2, end);
  const ch = lerp(nameFit * 0.95, CARET_H, end);
  caret(lerp(cxText, CX - 3.5, end), ytop, ch, 7, COL.w);
}
function drawEnd(t) {
  if (t < 18.25) drawNodes(t);
  else drawTitle(t);
}

/* ------------------------------------------------------------------ */
/* le scene e lo zoom che le collega                                    */
/* ------------------------------------------------------------------ */
const SCENES = [
  { start: 0, end: 2, draw: drawHook, portal: hookPortal },
  { start: 2, end: 6, draw: drawType, portal: typePortal },
  { start: 6, end: 14, draw: drawShapes3D, portal: portal3D },
  { start: 14, end: 16, draw: drawData, portal: dataPortal },
  { start: 16, end: 20, draw: drawEnd, samples: (t) => (t > 16.95 && t < 18.12 ? 8 : 1) },
];
const ZOOM = 0.5;
const zoomEase = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
function portalPath(p) {
  ctx.beginPath();
  if (p.kind === "circle") ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  else if (p.poly) p.poly.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
  else ctx.rect(p.x, p.y, p.w, p.h);
  ctx.closePath();
}
function seek(t) {
  t = ((t % DUR) + DUR) % DUR;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  let i = SCENES.findIndex((s) => t >= s.start && t < s.end);
  if (i < 0) i = SCENES.length - 1;
  const S = SCENES[i], N = SCENES[i + 1];
  const u = N && S.portal ? prog(t, S.end - ZOOM, S.end) : 0;
  if (u <= 0) {
    // il volo dentro la rete è troppo veloce per tre sottofotogrammi: lì si media anche dentro il sottofotogramma
    const n = S.samples ? S.samples(t) : 1;
    if (n <= 1) { S.draw(t); return; }
    for (let c = 0; c < n; c++) {
      ctx = OFF;
      OFF.setTransform(1, 0, 0, 1, 0, 0);
      OFF.globalAlpha = 1;
      S.draw(t - (c / n) * (1 / 180));
      ctx = MAIN;
      MAIN.globalAlpha = 1 / (c + 1);
      MAIN.drawImage(offCanvas, 0, 0);
      MAIN.globalAlpha = 1;
    }
    return;
  }
  // zoom dentro il portale: il dettaglio della scena diventa la scena successiva
  const p = S.portal(t);
  const pc = p.kind === "circle" ? [p.x, p.y] : [p.x + p.w / 2, p.y + p.h / 2];
  const k = p.kind === "circle" ? p.r / Math.hypot(W / 2, H / 2) : Math.min(p.w / W, p.h / H);
  const Z = Math.exp(Math.log(1 / k) * zoomEase(u));
  const f = [(CX - pc[0] / k) / (1 - 1 / k), (CY - pc[1] / k) / (1 - 1 / k)];
  const toScreen = () => { ctx.translate(f[0], f[1]); ctx.scale(Z, Z); ctx.translate(-f[0], -f[1]); };
  // la scena che si lascia, con un mosso radiale quando lo zoom è veloce
  // quanto cresce lo zoom in un sottofotogramma (1/180 s): lo si riempie di copie con lo stesso peso
  const Z0 = Math.exp(Math.log(1 / k) * zoomEase(Math.max(0, u - 1 / 180 / ZOOM)));
  const speed = Math.log(Z / Z0);
  const copies = Math.min(12, Math.max(1, Math.ceil(speed / 0.0035)));
  for (let c = 0; c < copies; c++) {
    const zc = Math.exp(Math.log(Z) - (copies > 1 ? (speed * c) / (copies - 1) : 0));
    ctx = OFF;
    OFF.setTransform(1, 0, 0, 1, 0, 0);
    OFF.globalAlpha = 1;
    OFF.save();
    OFF.translate(f[0], f[1]); OFF.scale(zc, zc); OFF.translate(-f[0], -f[1]);
    S.draw(t);
    OFF.restore();
    ctx = MAIN;
    MAIN.globalAlpha = 1 / (c + 1);
    MAIN.drawImage(offCanvas, 0, 0);
    MAIN.globalAlpha = 1;
  }
  // la scena nuova, dentro il dettaglio
  ctx.save();
  toScreen();
  portalPath(p);
  ctx.clip();
  ctx.translate(pc[0], pc[1]);
  ctx.scale(k, k);
  ctx.translate(-CX, -CY);
  N.draw(Math.max(N.start - 0.5, t));
  ctx.restore();
}

window.REEL = {
  ready: document.fonts.load("800 100px Syne").then(() => document.fonts.load("400 100px Syne")).then(() => true),
  seek,
  DUR,
};
