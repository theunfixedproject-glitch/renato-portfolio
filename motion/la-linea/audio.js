"use strict";
/*
 * La colonna sonora, scritta con la Web Audio API e resa offline in WAV.
 * 120 bpm: cassa su ogni battito, un colpo a ogni cambio di scena, un riser verso l'ultima battuta piena (12 s).
 * Il fruscio della penna segue la velocità reale della punta sullo schermo, letta dall'animazione.
 */
async function renderSoundtrack() {
  await window.REEL.ready;
  const SR = 48000, DUR = 15, B = 0.5;
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
  const sp = window.REEL.penSpeed(200);
  const score = (T0) => {
  const kick = (t, ...r) => ABS.kick(t + T0, ...r), noiseHit = (t, ...r) => ABS.noiseHit(t + T0, ...r), hat = (t, ...r) => ABS.hat(t + T0, ...r);
  const clap = (t, ...r) => ABS.clap(t + T0, ...r), tick = (t, ...r) => ABS.tick(t + T0, ...r), bass = (m, t, ...r) => ABS.bass(m, t + T0, ...r);
  const pluck = (m, t, ...r) => ABS.pluck(m, t + T0, ...r), pad = (n, t, ...r) => ABS.pad(n, t + T0, ...r), hit = (t, ...r) => ABS.hit(t + T0, ...r);
  const whoosh = (t, ...r) => ABS.whoosh(t + T0, ...r);
  // armonia: Re minore, Si bemolle, Fa, Do... e nell'ultima battuta piena Sol minore → La, la tensione prima della firma
  const CH = { Dm: [50, 57, 62, 65], Bb: [46, 53, 58, 62], F: [53, 57, 60, 65], C: [48, 55, 60, 64], Gm: [55, 58, 62, 67], A: [57, 61, 64, 69] };
  const ROOT = { Dm: 38, Bb: 34, F: 41, C: 36, Gm: 43, A: 45 };
  const PROG = ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "Dm"];
  const ARP = [0, 2, 3, 1, 3, 2, 0, 3];

  for (let b = 0; b < 30; b++) {
    const t = b * B, bar = Math.floor(b / 4), beatIn = b % 4;
    let ch = PROG[bar];
    if (bar === 6 && beatIn >= 2) ch = "A";
    // la cassa su ogni battito
    kick(t, bar === 0 ? 0.8 : bar === 7 ? 0.85 : 1);
    if (bar >= 1 && bar <= 6) {
      if (beatIn % 2 === 1) clap(t, bar === 6 ? 0.45 : 0.36);
      hat(t + 0.25, 0.15);
      if (bar >= 5) { hat(t + 0.125, 0.06, -0.3); hat(t + 0.375, 0.07, 0.35); }
      bass(ROOT[ch], t + 0.25, 0.2);
      if (bar >= 3) bass(ROOT[ch] + 12, t + 0.375, 0.1, 0.18);
    }
    if (beatIn === 0 || (bar === 6 && beatIn === 2)) {
      const d = bar === 7 ? 1 : bar === 6 ? 1 : 2;
      pad(CH[ch], t, d, bar === 0 || bar === 7 ? 0.03 : bar === 6 ? 0.05 : 0.04, bar === 6 ? 1800 : 1200, bar === 6 ? 3200 : 1600);
    }
  }
  // l'aggancio: la penna che scrive "una", "sola", "linea"
  [0.25, 0.5, 1.0, 1.5].forEach((t, i) => pluck([62, 65, 69, 74][i], t, 0.07, -0.2 + i * 0.13));
  [0.75, 1.25, 1.75].forEach((t) => hat(t, 0.1, 0.3));
  // le parole: un pizzicato a ogni parola, un tic su ogni accento
  [[2.0, 74], [2.5, 72], [3.0, 69], [3.5, 77]].forEach(([t, m]) => { pluck(m, t, 0.09, 0.2); tick(t + 0.25, 3000, 0.045, -0.3); });
  // le forme: una scala che sale
  [[4.0, 62], [4.25, 65], [4.5, 69], [5.0, 72], [5.25, 74], [5.5, 77], [5.75, 81]].forEach(([t, m], i) => pluck(m, t, 0.08, i % 2 ? 0.35 : -0.35, 0.35));
  // la voce del bot: un tic per ogni lettera scritta
  [["ciao!", 6.25], ["prenoto io", 6.75], ["fatto.", 7.25]].forEach(([s, t0]) => { for (let i = 0; i < s.length; i++) tick(t0 + i * 0.022, 2200 + (i % 3) * 260, 0.035, -0.2 + (i % 4) * 0.12); });
  // la spirale: la camera gira a scatti
  [8.25, 8.75, 9.0, 9.25].forEach((t, i) => whoosh(t - 0.2, 0.3, 0.12, i % 2 ? -1 : 1));
  whoosh(9.3, 0.25, 0.14, -1);
  // il grafico: un bip che sale a ogni gradino, poi il contatore
  [[10.0, 74], [10.5, 77], [11.0, 81], [11.5, 86]].forEach(([t, m]) => { pluck(m, t, 0.09, 0.15, 0.3); for (let j = 0; j < 5; j++) tick(t + 0.03 + j * 0.03, 1800 + j * 220, 0.025, 0.3); });
  tick(10.75, 3400, 0.05);
  // la scultura: la penna corre, la camera gira, la fisarmonica si chiude
  whoosh(12.55, 0.25, 0.14, -1);
  [13.0, 13.25].forEach((t) => { kick(t + 0.125, 0.45); noiseHit(t, "bandpass", 900, 2, 0.002, 0.08, 0.2); });
  // la firma e il titolo
  whoosh(13.3, 0.22, 0.14, 1);
  for (let i = 0; i < 15; i++) tick(14.0 + i * 0.016, 2500, 0.025);
  for (let i = 0; i < 9; i++) tick(14.25 + i * 0.016, 2100, 0.025);
  // l'inchiostro che riempie parole e forme: un tonfo morbido e un fruscio breve
  [0.5, 1.0, 1.5, 2.25, 2.75, 3.25, 3.75, 4.36, 5.36, 5.86, 10.25, 13.75].forEach((t, i) => {
    noiseHit(t, "lowpass", 700, 0.8, 0.004, 0.11, 0.22, i % 2 ? 0.2 : -0.2);
    noiseHit(t, "bandpass", 2600, 1.2, 0.01, 0.06, 0.07, i % 2 ? -0.3 : 0.3);
  });
  // il riavvolgimento: tutto torna nel punto
  whoosh(14.5, 0.48, 0.24, -1);
  // un colpo a ogni cambio di scena
  [2.0, 4.0, 6.0, 8.0, 10.0].forEach((t) => hit(t, 0.85));
  hit(12.0, 1.35);
  hit(13.5, 0.7);
  hit(14.0, 0.9);
  // il riser verso l'ultima battuta piena
  { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.1;
    f.frequency.setValueAtTime(350, T0 + 10.0); f.frequency.exponentialRampToValueAtTime(7500, T0 + 11.98);
    const v = ac.createGain(); v.gain.setValueAtTime(0.0001, T0 + 10.0); v.gain.exponentialRampToValueAtTime(0.45, T0 + 11.98); v.gain.linearRampToValueAtTime(0.0001, T0 + 12.01);
    s.connect(f).connect(v); out(v, 0.55, 0, 0.3); s.start(T0 + 10.0); s.stop(T0 + 12.05);
    const o = ac.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(98, T0 + 10.0); o.frequency.exponentialRampToValueAtTime(784, T0 + 11.98);
    const ff = ac.createBiquadFilter(); ff.type = "lowpass"; ff.frequency.value = 2000;
    const vv = ac.createGain(); vv.gain.setValueAtTime(0.0001, T0 + 10.0); vv.gain.exponentialRampToValueAtTime(0.22, T0 + 11.98); vv.gain.linearRampToValueAtTime(0.0001, T0 + 12.01);
    o.connect(ff).connect(vv); out(vv, 0.5); o.start(T0 + 10.0); o.stop(T0 + 12.05); }

  // il fruscio della penna: rumore filtrato, forte quanto la punta corre
  { const curve = new Float32Array(sp.length);
    for (let i = 0; i < sp.length; i++) curve[i] = Math.min(1, Math.pow(sp[i] / 4000, 0.8));
    // media mobile breve: niente scatti nel guadagno
    const sm = new Float32Array(curve.length);
    for (let i = 0; i < curve.length; i++) { let s = 0, n = 0; for (let j = -3; j <= 3; j++) { const k = i + j; if (k >= 0 && k < curve.length) { s += curve[k]; n++; } } sm[i] = s / n; }
    const s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3800; f.Q.value = 0.9;
    const f2 = ac.createBiquadFilter(); f2.type = "highpass"; f2.frequency.value = 1500;
    const v = ac.createGain(); v.gain.setValueAtTime(0, T0); v.gain.setValueCurveAtTime(sm, T0, DUR - 0.01);
    s.connect(f).connect(f2).connect(v); out(v, 0.16, 0.1, 0.1); s.start(T0); s.stop(T0 + DUR); }
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
