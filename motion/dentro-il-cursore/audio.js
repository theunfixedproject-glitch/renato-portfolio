"use strict";
/*
 * La colonna sonora, scritta con la Web Audio API e resa offline in WAV.
 * 120 bpm: cassa su ogni battito, colpo a ogni cambio di scena, un riser verso la rete (16 s).
 */
async function renderSoundtrack() {
  const SR = 48000, DUR = 20, B = 0.5;
  const ac = new OfflineAudioContext(2, SR * DUR, SR);
  const master = ac.createGain();
  master.gain.value = 0.8;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
  master.connect(comp).connect(ac.destination);

  // riverbero da un impulso di rumore che si spegne
  const rev = ac.createConvolver();
  { const len = SR * 1.8, ir = ac.createBuffer(2, len, SR);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let s = 7 + c; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = ((s / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3); } }
    rev.buffer = ir; }
  const revIn = ac.createGain(); revIn.gain.value = 0.35; revIn.connect(rev).connect(master);
  // eco a ottavo puntato per i pizzicati
  const dly = ac.createDelay(1); dly.delayTime.value = 0.375;
  const fb = ac.createGain(); fb.gain.value = 0.32;
  const dlyIn = ac.createGain(); dlyIn.gain.value = 0.3;
  dlyIn.connect(dly); dly.connect(fb).connect(dly); dly.connect(master);

  const noise = ac.createBuffer(1, SR * 2, SR);
  { const d = noise.getChannelData(0); let s = 1; for (let i = 0; i < d.length; i++) { s = (s * 48271) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; } }
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
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    env(v.gain, t, 0.002, 1, 0.38);
    o.connect(v); out(v, 0.9 * g);
    o.start(t); o.stop(t + 0.45);
  }
  function noiseHit(t, type, freq, q, a, d, g, pan = 0, send = 0) {
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const v = ac.createGain(); env(v.gain, t, a, 1, d);
    s.connect(f).connect(v); out(v, g, pan, send);
    s.start(t, Math.random() * 1.5); s.stop(t + a + d + 0.05);
  }
  const hat = (t, g = 0.18, pan = 0.3) => noiseHit(t, "highpass", 8000, 0.7, 0.001, 0.045, g, pan);
  const clap = (t, g = 0.4) => { for (const o of [0, 0.012, 0.024]) noiseHit(t + o, "bandpass", 1500, 1.4, 0.001, 0.09, g, 0, 0.5); };
  const tick = (t, f = 2600, g = 0.06, pan = 0) => {
    const o = ac.createOscillator(), v = ac.createGain();
    o.frequency.value = f; env(v.gain, t, 0.001, 1, 0.04);
    o.connect(v); out(v, g, pan, 0.2); o.start(t); o.stop(t + 0.06);
  };
  function bass(m, t, d, g = 0.35) {
    const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m);
    const s = ac.createOscillator(); s.frequency.value = mtof(m - 12);
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 1;
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(220, t + d);
    const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(1, t + 0.006); v.gain.setValueAtTime(1, t + d - 0.03); v.gain.linearRampToValueAtTime(0.0001, t + d);
    o.connect(f); s.connect(v); f.connect(v); out(v, g);
    o.start(t); s.start(t); o.stop(t + d + 0.02); s.stop(t + d + 0.02);
  }
  function pluck(m, t, g = 0.12, pan = 0) {
    const o = ac.createOscillator(); o.type = "square"; o.frequency.value = mtof(m);
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 2;
    f.frequency.setValueAtTime(4500, t); f.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    const v = ac.createGain(); env(v.gain, t, 0.002, 1, 0.32);
    o.connect(f).connect(v); out(v, g, pan, 0.25, 0.6); o.start(t); o.stop(t + 0.4);
  }
  function pad(notes, t, d, g = 0.05, cut = 1600) {
    notes.forEach((m, k) => [-6, 7].forEach((det) => {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det;
      const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cut;
      const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(1, t + 0.08); v.gain.setValueAtTime(1, t + d - 0.1); v.gain.linearRampToValueAtTime(0.0001, t + d);
      o.connect(f).connect(v); out(v, g, (k / (notes.length - 1)) * 1.2 - 0.6, 0.4); o.start(t); o.stop(t + d + 0.05);
    }));
  }
  function hit(t, big = 1) {
    kick(t, 1.2 * big);
    const o = ac.createOscillator(), v = ac.createGain();
    o.frequency.setValueAtTime(60, t); o.frequency.exponentialRampToValueAtTime(32, t + 1.2);
    env(v.gain, t, 0.004, 1, 1.4 * big);
    o.connect(v); out(v, 0.7 * big); o.start(t); o.stop(t + 1.6 * big);
    noiseHit(t, "highpass", 2500, 0.5, 0.002, 0.9 * big, 0.25 * big, 0, 0.8);
  }
  function whoosh(t0, d, g = 0.25) {
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.4;
    f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(5500, t0 + d * 0.85); f.frequency.exponentialRampToValueAtTime(2000, t0 + d);
    const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(1, t0 + d * 0.85); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    const p = ac.createStereoPanner(); p.pan.setValueAtTime(-0.6, t0); p.pan.linearRampToValueAtTime(0.6, t0 + d);
    s.connect(f).connect(v).connect(p); const g2 = ac.createGain(); g2.gain.value = g; p.connect(g2).connect(master);
    s.start(t0); s.stop(t0 + d + 0.05);
  }

  // accordi: La minore, Fa, Do, Sol — una battuta ciascuno
  const CH = { Am: [57, 60, 64, 67], F: [53, 57, 60, 64], C: [55, 60, 64, 67], G: [55, 59, 62, 67] };
  const ROOT = { Am: 45, F: 41, C: 48, G: 43 };
  const PROG = ["Am", "F", "C", "G", "Am", "F", "C", "G", "Am", "F"];
  const ARP = [0, 2, 3, 1, 2, 3, 0, 2];

  for (let b = 0; b < 40; b++) {
    const t = b * B, bar = Math.floor(b / 4), beatIn = b % 4, ch = PROG[bar];
    kick(t, bar === 0 ? 0.75 : bar === 9 ? 0.8 : 1);
    if (bar >= 1 && bar <= 8) {
      if (beatIn % 2 === 1) clap(t);
      hat(t + 0.25);
      bass(ROOT[ch], t, 0.22);
      bass(ROOT[ch] + 12, t + 0.25, 0.18, 0.25);
    }
    if (bar >= 2 && bar <= 8) {
      pluck(CH[ch][ARP[(beatIn * 2) % 8]] + 12, t, 0.08, -0.3);
      pluck(CH[ch][ARP[(beatIn * 2 + 1) % 8]] + 12, t + 0.25, 0.08, 0.3);
    }
    if (beatIn === 0) pad(CH[ch], t, 2, bar === 0 || bar === 9 ? 0.035 : 0.045, bar === 8 ? 2600 : 1500);
  }
  // l'aggancio: la scrittura
  [0.5, 0.54, 0.58, 0.75, 0.77, 0.8, 0.83, 0.86, 0.89, 0.92, 0.95, 1.0].forEach((t, i) => tick(t, 2200 + (i % 3) * 300, 0.05, -0.2 + i * 0.04));
  hat(0.25, 0.08); hat(0.75, 0.1); hat(1.25, 0.12); hat(1.75, 0.14);
  // i tabelloni delle parole
  [2.5, 3.0, 3.5].forEach((t) => { for (let j = 0; j < 4; j++) tick(t + j * 0.035, 3200, 0.04, -0.3 + j * 0.2); });
  // le etichette delle forme
  for (let k = 0; k < 7; k++) tick(6.25 + k * 0.5, 1800, 0.05);
  // gli strumenti di Lighthouse che salgono
  [14.0, 14.5, 15.0, 15.25].forEach((t) => { for (let j = 0; j < 6; j++) tick(t + j * 0.04, 1400 + j * 180, 0.035); });
  // il titolo: scrittura e cancellazione
  for (let i = 0; i < 15; i++) tick(18.25 + i * 0.016, 2400, 0.03);
  for (let i = 0; i < 12; i++) tick(19.5 + i * 0.03, 1900, 0.03);
  // gli zoom dentro i dettagli
  [1.5, 5.5, 13.5, 15.5].forEach((t) => whoosh(t, 0.5, 0.22));
  // un colpo a ogni cambio di scena
  [2.0, 6.0, 10.0, 14.0, 18.0].forEach((t) => hit(t, 1));
  hit(16.0, 1.4);
  // il riser verso la rete
  { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(400, 14.0); f.frequency.exponentialRampToValueAtTime(7000, 15.98);
    const v = ac.createGain(); v.gain.setValueAtTime(0.0001, 14.0); v.gain.exponentialRampToValueAtTime(0.5, 15.98); v.gain.linearRampToValueAtTime(0.0001, 16.02);
    s.connect(f).connect(v); out(v, 0.6, 0, 0.3); s.start(14.0); s.stop(16.05);
    const o = ac.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(110, 14.0); o.frequency.exponentialRampToValueAtTime(880, 15.98);
    const ff = ac.createBiquadFilter(); ff.type = "lowpass"; ff.frequency.value = 1800;
    const vv = ac.createGain(); vv.gain.setValueAtTime(0.0001, 14.0); vv.gain.exponentialRampToValueAtTime(0.25, 15.98); vv.gain.linearRampToValueAtTime(0.0001, 16.02);
    o.connect(ff).connect(vv); out(vv, 0.5); o.start(14.0); o.stop(16.05); }

  const buf = await ac.startRendering();
  // WAV a 16 bit
  const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
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
