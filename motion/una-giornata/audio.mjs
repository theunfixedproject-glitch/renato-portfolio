// La colonna sonora del film, fatta solo di codice: 120 bpm, La minore, 14,5 secondi.
// I battiti cadono sulla griglia del film (0.47 + 0.5k), così la botta è a 9.97.
import fs from "node:fs";

const SR = 48000, DUR = 14.5, N = Math.round(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const revL = new Float32Array(N), revR = new Float32Array(N); // mandata al riverbero
const dlyL = new Float32Array(N), dlyR = new Float32Array(N); // mandata al delay
const PHASE = 0.47, BEAT = 0.5;
const beat = (b) => PHASE + b * BEAT;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

class Biquad {
  constructor() { this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set("lp", 1000, 0.7); }
  set(type, f, q) {
    const w = (2 * Math.PI * clamp(f, 10, SR * 0.45)) / SR, cw = Math.cos(w), al = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === "lp") { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; }
    else if (type === "hp") { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; }
    else { b0 = al; b1 = 0; b2 = -al; }
    const a0 = 1 + al;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = (-2 * cw) / a0; this.a2 = (1 - al) / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}
// scrive un suono: fn(i, tt) restituisce il campione, tt = secondi dall'attacco
function put(t0, dur, fn, { gain = 1, pan = 0, rev = 0, dly = 0 } = {}) {
  const s0 = Math.max(0, Math.round(t0 * SR)), s1 = Math.min(N, Math.round((t0 + dur) * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let s = s0; s < s1; s++) {
    const v = fn(s - s0, (s - s0) / SR, s / SR);
    L[s] += v * gl; R[s] += v * gr;
    if (rev) { revL[s] += v * gl * rev; revR[s] += v * gr * rev; }
    if (dly) { dlyL[s] += v * gl * dly; dlyR[s] += v * gr * dly; }
  }
}
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));

/* --- strumenti --- */
function kick(t0, g = 1) {
  let ph = 0;
  put(t0, 0.45, (i, tt) => {
    const f = 46 + 110 * Math.exp(-tt * 28);
    ph += f / SR;
    const click = tt < 0.004 ? (1 - tt / 0.004) * 0.6 : 0;
    return (Math.sin(2 * Math.PI * ph) * Math.exp(-tt * 7.5) + click) * 0.9;
  }, { gain: g });
}
function clap(t0, g = 1) {
  const bp = new Biquad(); bp.set("bp", 1500, 1.2);
  put(t0, 0.35, (i, tt) => {
    const bursts = [0, 0.011, 0.022].reduce((a, o) => a + (tt >= o ? Math.exp(-(tt - o) * 140) : 0), 0);
    return bp.run(rnd()) * (bursts * 0.7 + Math.exp(-tt * 14) * 0.5) * 1.6;
  }, { gain: g, rev: 0.25 });
}
function hat(t0, open = false, g = 1, pan = 0.2) {
  const hp = new Biquad(); hp.set("hp", 7500, 0.7);
  put(t0, open ? 0.35 : 0.08, (i, tt) => hp.run(rnd()) * Math.exp(-tt * (open ? 9 : 55)) * 0.5, { gain: g, pan });
}
function bass(m, t0, dur, g = 1) {
  const lp = new Biquad(); let ph = 0, ph2 = 0;
  const f = mtof(m);
  put(t0, dur + 0.05, (i, tt) => {
    if (i % 32 === 0) lp.set("lp", 260 + 900 * Math.exp(-tt * 12), 0.9);
    ph += f / SR; ph2 += f / 2 / SR;
    const env = Math.min(1, tt / 0.005) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / 0.05));
    return (lp.run(saw(ph)) * 0.55 + Math.sin(2 * Math.PI * ph2) * 0.5) * env;
  }, { gain: g });
}
function pluck(m, t0, g = 1, pan = 0, bright = 1) {
  const lp = new Biquad(); let ph = 0, ph2 = 0;
  const f = mtof(m);
  put(t0, 0.6, (i, tt) => {
    if (i % 16 === 0) lp.set("lp", 300 + 3800 * bright * Math.exp(-tt * 16), 1.1);
    ph += f / SR; ph2 += (f * 1.004) / SR;
    return lp.run(saw(ph) * 0.5 + (ph2 % 1 < 0.5 ? 0.35 : -0.35)) * Math.exp(-tt * 7) * Math.min(1, tt / 0.002);
  }, { gain: g, pan, rev: 0.2, dly: 0.35 });
}
function pad(notes, t0, dur, { g = 1, cut0 = 700, cut1 = 2400, att = 0.6, rel = 0.9 } = {}) {
  notes.forEach((m, k) => {
    const lp = new Biquad();
    const ph = [0, 0, 0], det = [-0.006, 0, 0.007];
    const f = mtof(m);
    put(t0, dur + rel, (i, tt) => {
      if (i % 64 === 0) lp.set("lp", cut0 + (cut1 - cut0) * clamp(tt / dur, 0, 1), 0.7);
      let v = 0;
      for (let j = 0; j < 3; j++) { ph[j] += (f * (1 + det[j])) / SR; v += saw(ph[j]); }
      const env = Math.min(1, tt / att) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / rel));
      return lp.run(v / 3) * env * 0.16;
    }, { gain: g, pan: (k / Math.max(1, notes.length - 1)) * 1.2 - 0.6, rev: 0.45 });
  });
}
function whoosh(t0, dur, g = 1, panFrom = -0.7, panTo = 0.7) {
  const bp = new Biquad();
  const s0 = Math.round(t0 * SR), s1 = Math.min(N, Math.round((t0 + dur) * SR));
  for (let s = s0; s < s1; s++) {
    const u = (s - s0) / (s1 - s0);
    if ((s - s0) % 16 === 0) bp.set("bp", 400 + 5200 * Math.sin(Math.PI * u) ** 1.5, 1.6);
    const v = bp.run(rnd()) * Math.sin(Math.PI * u) ** 2 * 1.4 * g;
    const pan = panFrom + (panTo - panFrom) * u;
    L[s] += v * Math.cos(((pan + 1) * Math.PI) / 4);
    R[s] += v * Math.sin(((pan + 1) * Math.PI) / 4);
    revL[s] += v * 0.3; revR[s] += v * 0.3;
  }
}
function tick(t0, f = 2600, g = 0.12, pan = 0) {
  put(t0, 0.05, (i, tt) => Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 90), { gain: g, pan, rev: 0.3 });
}

/* --- accordi e arpeggi --- */
const AM9 = [57, 60, 64, 67, 71], FMAJ9 = [53, 57, 60, 64, 67], CMAJ9 = [55, 59, 62, 64, 67], GADD9 = [55, 59, 62, 67, 69];
const ARP = [0, 2, 4, 2, 1, 3, 4, 3];
const arp = (ch, barT, from = 0, g = 0.55, bright = 1) => {
  for (let h = from; h < 8; h++) pluck(ch[ARP[h]] + 12, barT + h * 0.25, g, h % 2 ? 0.35 : -0.35, bright);
};

// intro: il volo parte da fermo (0–1.97)
pad(AM9, 0, 1.97, { g: 0.8, cut0: 400, cut1: 1400, att: 1.4, rel: 0.3 });
for (let h = 1; h < 8; h++) hat(0.22 + h * 0.25 - 0.25, false, 0.25 + h * 0.03, h % 2 ? 0.3 : -0.3);
[0.47, 0.97, 1.22, 1.47].forEach((t, k) => pluck(AM9[[0, 2, 4, 3][k]] + 12, t, 0.4, k % 2 ? 0.3 : -0.3, 0.6));
for (let k = 0; k < 4; k++) clap(1.47 + k * 0.125, 0.15 + k * 0.08); // la corsa raddoppia

// crociera: tre battute (1.97–7.97)
const bars = [[1.97, AM9, 45], [3.97, FMAJ9, 41], [5.97, CMAJ9, 48]];
for (const [bt, ch, root] of bars) {
  pad(ch, bt, 2, { g: 0.7, cut0: 900, cut1: 1800, att: 0.2, rel: 0.4 });
  for (let b = 0; b < 4; b++) {
    const t = bt + b * BEAT;
    const fade = 1 - clamp((t - 7.3) / 0.7, 0, 1) * 0.6; // la corsa rallenta
    kick(t, 0.9 * fade);
    if (b % 2) clap(t, 0.55 * fade);
    hat(t + 0.25, b === 3, 0.35 * fade, 0.25);
    bass(root, t, 0.22, 0.55 * fade);
    bass(root + 12, t + 0.25, 0.18, 0.4 * fade);
  }
  arp(ch, bt, 0, 0.5);
}

// salita, sguardo dall'alto e picchiata (7.97–9.97)
pad(GADD9, 7.97, 1.8, { g: 0.9, cut0: 600, cut1: 3200, att: 0.8, rel: 0.25 });
{ // il fruscio che sale
  const bp = new Biquad();
  const s0 = Math.round(7.75 * SR), s1 = Math.round(9.47 * SR);
  for (let s = s0; s < s1; s++) {
    const u = (s - s0) / (s1 - s0);
    if ((s - s0) % 16 === 0) bp.set("bp", 500 * Math.pow(14, u), 1.2);
    const v = bp.run(rnd()) * (0.1 + 0.9 * u * u) * 0.55 * (s / SR > 9.25 ? 1 - (s / SR - 9.25) / 0.22 : 1);
    L[s] += v; R[s] += v; revL[s] += v * 0.2; revR[s] += v * 0.2;
  }
}
for (let k = 0; k < 16; k++) { // rullata che accelera fino al respiro sopra la pagina
  const t = 8.47 + 0.78 * (1 - Math.pow(1 - k / 16, 1.6));
  if (t < 9.25) clap(t, 0.12 + 0.3 * (k / 16));
}
whoosh(8.36, 0.6, 0.9, -0.8, 0.6);
whoosh(9.525, 0.55, 1.1, 0.7, -0.4);
tick(9.25, 1800, 0.08); // un respiro sopra la pagina intera

// la botta (9.97)
{
  kick(9.97, 1.3);
  let ph = 0;
  put(9.97, 2.6, (i, tt) => { ph += (34 + 22 * Math.exp(-tt * 3)) / SR; return Math.sin(2 * Math.PI * ph) * Math.exp(-tt * 1.6) * 0.9; });
  const hp = new Biquad(); hp.set("hp", 3000, 0.7);
  put(9.97, 2.2, (i, tt) => hp.run(rnd()) * Math.exp(-tt * 2.6) * 0.35, { rev: 0.6 });
  pad(FMAJ9, 9.97, 2.0, { g: 1.25, cut0: 3000, cut1: 1400, att: 0.01, rel: 1.4 });
  pluck(FMAJ9[4] + 12, 9.97, 0.6, 0, 1.2);
}

// la notte: il finale (9.97–14.5)
pad(AM9, 11.97, 2.6, { g: 0.85, cut0: 1300, cut1: 700, att: 0.4, rel: 0.5 });
for (let h = 2; h < 16; h++) {
  const t = 9.97 + h * 0.25, ch = t < 11.97 ? FMAJ9 : AM9;
  pluck(ch[ARP[h % 8]] + 12, t, 0.26 * (1 - clamp((t - 13.5) / 1, 0, 1)), h % 2 ? 0.45 : -0.45, 0.55);
}
kick(11.97, 0.45);
kick(12.97, 0.35);
// una spunta leggera per ogni parola del titolo
"Siti, app e bot che lavorano per te.".split(" ").forEach((w, i) => tick(10.12 + 0.06 * i, 2400 + i * 60, 0.05, -0.2 + i * 0.05));
"anche quando dormi.".split(" ").forEach((w, i) => tick(10.36 + 0.05 * i, 1700 + i * 80, 0.06, 0.2));
// le tessere che si girano e il badge che cambia
[10.97, 11.22, 11.47, 11.72, 12.22, 12.47, 12.72, 13.22, 13.47, 13.72, 13.97].forEach((t, k) => tick(t, 3200 - (k % 3) * 300, 0.07, k % 2 ? 0.5 : -0.5));
[11.97, 12.97].forEach((t) => { tick(t, 1320, 0.1); tick(t + 0.03, 1980, 0.08); });

/* --- delay, riverbero, master --- */
{
  const d = Math.round(0.375 * SR);
  for (let s = d; s < N; s++) { // ping-pong
    dlyL[s] += dlyR[s - d] * 0.38;
    dlyR[s] += dlyL[s - d] * 0.38;
  }
  for (let s = 0; s < N; s++) { L[s] += dlyR[s] * 0.5; R[s] += dlyL[s] * 0.5; }
}
function freeverb(inp, spread) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => Math.round(((n + spread) * SR) / 44100));
  const aps = [556, 441, 341, 225].map((n) => Math.round(((n + spread) * SR) / 44100));
  const out = new Float32Array(N);
  for (const n of combs) {
    const buf = new Float32Array(n); let idx = 0, store = 0;
    for (let s = 0; s < N; s++) {
      const y = buf[idx];
      store = y * 0.78 + store * 0.22;
      buf[idx] = inp[s] * 0.015 + store * 0.86;
      idx = (idx + 1) % n;
      out[s] += y;
    }
  }
  for (const n of aps) {
    const buf = new Float32Array(n); let idx = 0;
    for (let s = 0; s < N; s++) {
      const b = buf[idx];
      const y = -out[s] + b;
      buf[idx] = out[s] + b * 0.5;
      idx = (idx + 1) % n;
      out[s] = y;
    }
  }
  return out;
}
const wl = freeverb(revL, 0), wr = freeverb(revR, 23);
for (let s = 0; s < N; s++) { L[s] += wl[s] * 0.9; R[s] += wr[s] * 0.9; }

let peak = 0;
for (let s = 0; s < N; s++) peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s]));
const pre = 1.6 / peak;
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVE", 8); out.write("fmt ", 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write("data", 36); out.writeUInt32LE(N * 4, 40);
for (let s = 0; s < N; s++) {
  const fade = Math.min(1, s / (SR * 0.01)) * Math.min(1, (N - s) / (SR * 0.45));
  const sat = (x) => Math.tanh(x * pre) * 0.89 * fade; // saturazione morbida, picco sotto 0 dB
  out.writeInt16LE(Math.round(sat(L[s]) * 32767), 44 + s * 4);
  out.writeInt16LE(Math.round(sat(R[s]) * 32767), 46 + s * 4);
}
fs.writeFileSync(process.argv[2] ?? "track.wav", out);
console.log("traccia scritta, picco grezzo", peak.toFixed(2));
