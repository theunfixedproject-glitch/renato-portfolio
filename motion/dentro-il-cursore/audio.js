"use strict";
/*
 * La colonna sonora di "Dentro il cursore" (versione 2), scritta con la Web Audio API e resa offline in WAV.
 * 120 bpm: cassa su ogni battito, un colpo a ogni cambio di manifesto, un riser verso la rete (16 s),
 * un suono per ogni cosa che si vede. Resa su due giri: si tiene il secondo, così il loop non ha cuciture.
 */
async function renderSoundtrack() {
  await window.REEL.ready;
  const SR = 48000, DUR = 20, B = 0.5;
  // due giri interi: si tiene il secondo, così l'inizio contiene le code della fine e il loop non ha cuciture
  const ac = new OfflineAudioContext(2, SR * DUR * 2, SR);
  const master = ac.createGain();
  master.gain.value = 0.8;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.16;
  master.connect(comp).connect(ac.destination);

  // riverbero da un impulso di rumore che si spegne
  const rev = ac.createConvolver();
  { const len = SR * 1.6, ir = ac.createBuffer(2, len, SR);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let s = 11 + c; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = ((s / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3.2); } }
    rev.buffer = ir; }
  const revIn = ac.createGain(); revIn.gain.value = 0.3; revIn.connect(rev).connect(master);
  // eco a ottavo puntato
  const dly = ac.createDelay(1); dly.delayTime.value = 0.375;
  const fb = ac.createGain(); fb.gain.value = 0.3;
  const dlyIn = ac.createGain(); dlyIn.gain.value = 0.28;
  dlyIn.connect(dly); dly.connect(fb).connect(dly); dly.connect(master);

  const noise = ac.createBuffer(1, SR * 2, SR);
  { const d = noise.getChannelData(0); let s = 3; for (let i = 0; i < d.length; i++) { s = (s * 48271) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; } }
  let seed = 5;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const out = (node, gain, pan = 0, send = 0, echo = 0) => {
    const g = ac.createGain(); g.gain.value = gain;
    const p = ac.createStereoPanner(); p.pan.value = pan;
    node.connect(g).connect(p).connect(master);
    if (send) { const s = ac.createGain(); s.gain.value = send; p.connect(s).connect(revIn); }
    if (echo) { const e = ac.createGain(); e.gain.value = echo; p.connect(e).connect(dlyIn); }
    return g;
  };
  const env = (param, t, a, peak, d) => { param.setValueAtTime(0.0001, t); param.exponentialRampToValueAtTime(peak, t + a); param.exponentialRampToValueAtTime(0.0001, t + a + d); };

  function kick(t, g = 1) {
    const o = ac.createOscillator(), v = ac.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    env(v.gain, t, 0.002, 1, 0.36);
    o.connect(v); out(v, 0.95 * g);
    o.start(t); o.stop(t + 0.42);
    // il clic dell'attacco
    noiseHit(t, "highpass", 3000, 0.7, 0.001, 0.012, 0.12 * g);
  }
  function noiseHit(t, type, freq, q, a, d, g, pan = 0, send = 0) {
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const v = ac.createGain(); env(v.gain, t, a, 1, d);
    s.connect(f).connect(v); out(v, g, pan, send);
    s.start(t, rnd() * 1.5); s.stop(t + a + d + 0.05);
  }
  const hat = (t, g = 0.16, pan = 0.25) => noiseHit(t, "highpass", 8500, 0.7, 0.001, 0.04, g, pan);
  const clap = (t, g = 0.38) => { for (const o of [0, 0.011, 0.023]) noiseHit(t + o, "bandpass", 1600, 1.3, 0.001, 0.085, g, 0, 0.45); };
  const tick = (t, f = 2600, g = 0.05, pan = 0) => {
    const o = ac.createOscillator(), v = ac.createGain();
    o.frequency.value = f; env(v.gain, t, 0.001, 1, 0.035);
    o.connect(v); out(v, g, pan, 0.15); o.start(t); o.stop(t + 0.05);
  };
  function bass(m, t, d, g = 0.33) {
    const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m);
    const s = ac.createOscillator(); s.frequency.value = mtof(m - 12);
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 2;
    f.frequency.setValueAtTime(1100, t); f.frequency.exponentialRampToValueAtTime(200, t + d);
    const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(1, t + 0.005); v.gain.setValueAtTime(1, t + d - 0.03); v.gain.linearRampToValueAtTime(0.0001, t + d);
    o.connect(f); s.connect(v); f.connect(v); out(v, g);
    o.start(t); s.start(t); o.stop(t + d + 0.02); s.stop(t + d + 0.02);
  }
  function pluck(m, t, g = 0.1, pan = 0, echo = 0.5) {
    const o = ac.createOscillator(); o.type = "square"; o.frequency.value = mtof(m);
    const o2 = ac.createOscillator(); o2.type = "triangle"; o2.frequency.value = mtof(m + 12);
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 3;
    f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.22);
    const v = ac.createGain(); env(v.gain, t, 0.002, 1, 0.28);
    o.connect(f); o2.connect(f); f.connect(v); out(v, g, pan, 0.25, echo);
    o.start(t); o2.start(t); o.stop(t + 0.35); o2.stop(t + 0.35);
  }
  function pad(notes, t, d, g = 0.045, cut = 1500, cut2 = cut) {
    notes.forEach((m, k) => [-7, 6].forEach((det) => {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det;
      const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(cut, t); f.frequency.linearRampToValueAtTime(cut2, t + d);
      const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(1, t + 0.06); v.gain.setValueAtTime(1, t + d - 0.08); v.gain.linearRampToValueAtTime(0.0001, t + d);
      o.connect(f).connect(v); out(v, g, (k / (notes.length - 1)) * 1.2 - 0.6, 0.35); o.start(t); o.stop(t + d + 0.05);
    }));
  }
  function hit(t, big = 1) {
    kick(t, 1.15 * big);
    const o = ac.createOscillator(), v = ac.createGain();
    o.frequency.setValueAtTime(64, t); o.frequency.exponentialRampToValueAtTime(34, t + 1.0);
    env(v.gain, t, 0.004, 1, 1.1 * big);
    o.connect(v); out(v, 0.6 * big); o.start(t); o.stop(t + 1.3 * big);
    noiseHit(t, "highpass", 2400, 0.5, 0.002, 0.7 * big, 0.22 * big, 0, 0.8);
  }
  function whoosh(t0, d, g = 0.2, dir = 1) {
    const s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.3;
    const [fa, fb2] = dir > 0 ? [350, 5000] : [5000, 350];
    f.frequency.setValueAtTime(fa, t0); f.frequency.exponentialRampToValueAtTime(fb2, t0 + d);
    const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(1, t0 + d * 0.8); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    const p = ac.createStereoPanner(); p.pan.setValueAtTime(-0.5 * dir, t0); p.pan.linearRampToValueAtTime(0.5 * dir, t0 + d);
    s.connect(f).connect(v).connect(p); const g2 = ac.createGain(); g2.gain.value = g; p.connect(g2).connect(master);
    s.start(t0); s.stop(t0 + d + 0.05);
  }

  const ABS = { kick, noiseHit, hat, clap, tick, bass, pluck, pad, hit, whoosh };
  const score = (T0) => {
  const kick = (t, ...r) => ABS.kick(t + T0, ...r), noiseHit = (t, ...r) => ABS.noiseHit(t + T0, ...r), hat = (t, ...r) => ABS.hat(t + T0, ...r);
  const clap = (t, ...r) => ABS.clap(t + T0, ...r), tick = (t, ...r) => ABS.tick(t + T0, ...r), bass = (m, t, ...r) => ABS.bass(m, t + T0, ...r);
  const pluck = (m, t, ...r) => ABS.pluck(m, t + T0, ...r), pad = (n, t, ...r) => ABS.pad(n, t + T0, ...r), hit = (t, ...r) => ABS.hit(t + T0, ...r);
  const whoosh = (t, ...r) => ABS.whoosh(t + T0, ...r);
  // armonia: La minore, Fa, Do, Sol; nella rete Re minore → Mi, la tensione prima del titolo
  const CH = { Am: [57, 60, 64, 67], F: [53, 57, 60, 65], C: [55, 60, 64, 67], G: [55, 59, 62, 67], Dm: [50, 57, 62, 65], E: [52, 56, 59, 64] };
  const ROOT = { Am: 45, F: 41, C: 48, G: 43, Dm: 38, E: 40 };
  const PROG = ["Am", "F", "C", "G", "Am", "F", "C", "G", "Dm", "Am"];
  const ARP = [0, 2, 3, 1, 3, 2, 0, 3];
  for (let b = 0; b < 40; b++) {
    const t = b * B, bar = Math.floor(b / 4), beatIn = b % 4;
    let ch = PROG[bar];
    if (bar === 8 && beatIn >= 2) ch = "E";
    kick(t, bar === 0 ? 0.8 : bar === 9 ? 0.85 : 1);
    if (bar >= 1 && bar <= 8) {
      if (beatIn % 2 === 1) clap(t, bar === 8 ? 0.45 : 0.36);
      hat(t + 0.25, 0.15);
      if (bar >= 7) { hat(t + 0.125, 0.06, -0.3); hat(t + 0.375, 0.07, 0.35); }
      bass(ROOT[ch], t + 0.25, 0.2);
      if (bar >= 3) bass(ROOT[ch] + 12, t + 0.375, 0.1, 0.18);
    }
    if (bar >= 3 && bar <= 7) pluck(CH[ch][ARP[(b * 2) % 8]] + 12, t + 0.25, 0.05, (b % 2 ? 0.3 : -0.3), 0.4);
    if (beatIn === 0 || (bar === 8 && beatIn === 2)) {
      const d = bar === 8 ? 1 : 2;
      pad(CH[ch], t, d, bar === 0 || bar === 9 ? 0.03 : bar === 8 ? 0.05 : 0.04, bar === 8 ? 1800 : 1200, bar === 8 ? 3400 : 1600);
    }
  }
  // il campo di testo: un tasto per ogni lettera, poi l'invio
  "Hai un'idea?".split("").forEach((_, i) => tick(0.5 + i * 0.042, 2300 + (i % 3) * 240, 0.05, -0.3 + i * 0.05));
  noiseHit(1.5, "bandpass", 1200, 1.5, 0.002, 0.06, 0.25); tick(1.5, 900, 0.08);
  // le porte che si aprono: un pizzicato alto, prima di ogni tuffo
  [1.25, 5.25, 13.25, 15.25, 17.25].forEach((t, i) => pluck([81, 84, 79, 83, 88][i], t, 0.07, 0.25, 0.5));
  // i tuffi: un risucchio che sale
  [1.5, 5.5, 13.5, 15.5, 17.5].forEach((t, i) => whoosh(t, 0.5, 0.22, i % 2 ? -1 : 1));
  // i manifesti a fessure: uno sciabordio per ogni arrivo, un tic sull'accento
  [2.5, 3.0, 3.5, 4.0, 4.5, 5.0].forEach((t, i) => { whoosh(t - 0.04, 0.2, 0.14, i % 2 ? -1 : 1); for (let j = 0; j < 4; j++) tick(t + j * 0.02, 3200 - j * 200, 0.025, (i % 2 ? 0.4 : -0.4)); });
  [2.25, 2.75, 3.25, 3.75, 4.25, 4.75].forEach((t, i) => pluck([76, 79, 74, 81, 72, 77][i], t, 0.06, i % 2 ? 0.3 : -0.3, 0.3));
  // le forme: una scala che sale, i dettagli che entrano
  [[6.0, 64], [6.5, 67], [7.0, 69], [7.5, 72], [8.0, 74], [8.5, 76], [9.0, 79]].forEach(([t, m], i) => { pluck(m, t, 0.08, i % 2 ? 0.35 : -0.35, 0.35); tick(t + 0.25, 2600, 0.04); });
  tick(9.25, 2000, 0.05); tick(9.5, 2400, 0.05);
  // il telefono in 3D: prende spessore, gli strati si staccano, la camera gira, gli strati tornano
  whoosh(9.8, 0.4, 0.18, 1);
  [11.0, 11.05, 11.1, 11.15, 11.2].forEach((t, i) => tick(t, 1500 + i * 260, 0.05, -0.4 + i * 0.2));
  whoosh(11.3, 0.4, 0.16, -1);
  [12.75, 12.78, 12.81, 12.84, 12.87].forEach((t, i) => tick(t, 2600 - i * 260, 0.045, 0.4 - i * 0.2));
  // i dati: il contatore che corre e l'atterraggio sul 100
  [[14.25, 14.5], [14.75, 15.0]].forEach(([a, b]) => { for (let j = 0; j < 9; j++) tick(a + j * 0.026, 1400 + j * 180, 0.03, 0.2); pluck(88, b, 0.09, 0, 0.4); });
  // la rete: i nodi che compaiono, la camera che si inclina
  for (let j = 0; j < 22; j++) tick(16.0 + j * 0.065, 1800 + ((j * 7) % 9) * 160, 0.03, -0.5 + ((j * 3) % 7) * 0.16);
  [16.5, 17.0, 17.45].forEach((t, i) => whoosh(t - 0.15, 0.3, 0.12, i % 2 ? 1 : -1));
  // il titolo: le lettere del sottotitolo, il cambio di peso, la cancellazione fino al cursore
  for (let i = 0; i < 25; i++) tick(18.25 + i * 0.012, 2500, 0.022);
  tick(18.75, 700, 0.07); tick(19.0, 900, 0.07);
  for (let i = 0; i < 14; i++) tick(19.5 + i * 0.03, 2000 - i * 40, 0.04);
  // un colpo a ogni cambio di manifesto
  [2.0, 6.0, 10.0, 14.0].forEach((t) => hit(t, 0.85));
  hit(16.0, 1.35);
  hit(18.0, 0.9);
  // il riser verso la rete
  { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.1;
    f.frequency.setValueAtTime(350, T0 + 14.0); f.frequency.exponentialRampToValueAtTime(7500, T0 + 15.98);
    const v = ac.createGain(); v.gain.setValueAtTime(0.0001, T0 + 14.0); v.gain.exponentialRampToValueAtTime(0.45, T0 + 15.98); v.gain.linearRampToValueAtTime(0.0001, T0 + 16.01);
    s.connect(f).connect(v); out(v, 0.55, 0, 0.3); s.start(T0 + 14.0); s.stop(T0 + 16.05);
    const o = ac.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(110, T0 + 14.0); o.frequency.exponentialRampToValueAtTime(880, T0 + 15.98);
    const ff = ac.createBiquadFilter(); ff.type = "lowpass"; ff.frequency.value = 2000;
    const vv = ac.createGain(); vv.gain.setValueAtTime(0.0001, T0 + 14.0); vv.gain.exponentialRampToValueAtTime(0.22, T0 + 15.98); vv.gain.linearRampToValueAtTime(0.0001, T0 + 16.01);
    o.connect(ff).connect(vv); out(vv, 0.5); o.start(T0 + 14.0); o.stop(T0 + 16.05); }
  };
  score(0);
  score(DUR);

  const buf = await ac.startRendering();
  // WAV a 16 bit
  const L = buf.getChannelData(0).subarray(SR * DUR), R = buf.getChannelData(1).subarray(SR * DUR), n = L.length;
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const gain = peak > 0.95 ? 0.95 / peak : 1;
  const bytes = new DataView(new ArrayBuffer(44 + n * 4));
  const str = (o, s) => [...s].forEach((c, i) => bytes.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); bytes.setUint32(4, 36 + n * 4, true); str(8, "WAVE"); str(12, "fmt ");
  bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, 2, true); bytes.setUint32(24, SR, true);
  bytes.setUint32(28, SR * 4, true); bytes.setUint16(32, 4, true); bytes.setUint16(34, 16, true); str(36, "data"); bytes.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    bytes.setInt16(44 + i * 4, Math.round(clampA(L[i] * gain) * 32767), true);
    bytes.setInt16(46 + i * 4, Math.round(clampA(R[i] * gain) * 32767), true);
  }
  let s = "";
  const u8 = new Uint8Array(bytes.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { b64: btoa(s), peak };
}
const clampA = (x) => Math.max(-1, Math.min(1, x));
window.renderSoundtrack = renderSoundtrack;
