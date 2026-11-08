"use strict";
/*
 * "Una giornata" — volo sopra il portfolio di Renato Manzotti.
 * Ogni fotogramma si calcola da t dentro seek(t): niente timer, niente transizioni CSS.
 * Mondo: X lungo la larghezza della pagina, Y giù per la pagina, Z l'altezza dal pavimento.
 */
const W = 1440, H = 1152, F = 1880, HX = W / 2, HY = H / 2;
const DEG = Math.PI / 180;
const PHASE = 0.47; // 120 bpm: la botta a 9.97 cade su un battere
const DURATION = 14.5;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const ease3 = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const easeOut3 = (u) => 1 - Math.pow(1 - u, 3);
const easeQ = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const halfBeat = (t) => PHASE + Math.round((t - PHASE) / 0.25) * 0.25;
const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 1000) / 1000; };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const mix3 = (a, b, u) => [mix(a[0], b[0], u), mix(a[1], b[1], u), mix(a[2], b[2], u)];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: true, preserveDrawingBuffer: true });
gl.getExtension("EXT_color_buffer_float");
const ANISO = gl.getExtension("EXT_texture_filter_anisotropic");

window.FILM = { ready: (async () => {
  /* ------------------------------------------------------------------ */
  /* materiali                                                           */
  /* ------------------------------------------------------------------ */
  const L = await (await fetch("cap3/layout.json")).json();
  const PH = L.H;
  const HERO = 900;
  const FOOTER_TITLE = 11130;
  await Promise.all(["500 40px Geist", "italic 400 40px 'Instrument Serif'", "700 40px 'Fira Code'"].map((f) => document.fonts.load(f)));

  const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const texFrom = (src, aniso = 16) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (ANISO) gl.texParameterf(gl.TEXTURE_2D, ANISO.TEXTURE_MAX_ANISOTROPY_EXT, aniso);
    return t;
  };

  const chunks = [];
  for (const c of L.chunks) chunks.push({ ...c, tex: texFrom(await loadImg(`cap3/${c.file}`)) });
  const pieces = [];
  for (const pc of L.pieces) pieces.push({ ...pc, tex: texFrom(await loadImg(`cap3/${pc.file}`), 8) });

  // le tessere del logo: monogramma RM, davanti e dietro
  const tileCanvas = (front) => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, front ? "#a259ff" : "#8a46ec");
    g.addColorStop(1, front ? "#c79bff" : "#b383ff");
    x.fillStyle = g;
    x.beginPath();
    x.roundRect(8, 8, 496, 496, 118);
    x.fill();
    const hl = x.createLinearGradient(0, 8, 0, 260);
    hl.addColorStop(0, "rgba(255,255,255,0.22)");
    hl.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = hl;
    x.beginPath();
    x.roundRect(8, 8, 496, 496, 118);
    x.fill();
    x.fillStyle = "#060608";
    x.textAlign = "center";
    x.textBaseline = "middle";
    if (front) {
      x.font = "700 210px 'Fira Code'";
      x.fillText("RM", 256, 270);
    } else {
      x.beginPath();
      x.arc(256, 256, 34, 0, Math.PI * 2);
      x.fill();
    }
    return c;
  };
  const TILE_FRONT = texFrom(tileCanvas(true), 8);
  const TILE_BACK = texFrom(tileCanvas(false), 8);

  // testo del finale, disegnato su una tela e caricato come texture
  const tc = document.createElement("canvas");
  tc.width = W;
  tc.height = H;
  const tx = tc.getContext("2d");
  const TEXT_TEX = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, TEXT_TEX);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  /* ------------------------------------------------------------------ */
  /* camera: una sola curva di velocità, poi salita, picchiata e finale   */
  /* ------------------------------------------------------------------ */
  const DT = 1 / 2000, TMAX = 9.6, NT = Math.ceil(TMAX / DT) + 2;
  // velocità giù per la pagina, come quota della crociera
  const share = (t) => {
    if (t <= 0) return 0;
    if (t < 0.6) return 0.5 * sstep(0, 0.6, t);
    if (t < 1.25) return 0.5;
    if (t < 1.6) return 0.5 + 0.5 * sstep(1.25, 1.6, t);
    if (t < 7.3) return 1;
    if (t < 8.3) return 0.12 + 0.88 * (1 - sstep(7.3, 8.3, t));
    return 0.12 * (1 - sstep(8.3, 8.9, t));
  };
  // salita: velocità a trapezio morbido sullo zoom in scala logaritmica
  const riseV = (t) => (t < 7.75 ? 0 : t < 8.35 ? sstep(7.75, 8.35, t) : t < 8.95 ? 1 : 1 - sstep(8.95, 9.25, t));
  const S = new Float64Array(NT), P = new Float64Array(NT);
  for (let i = 1; i < NT; i++) {
    const tm = (i - 0.5) * DT;
    S[i] = S[i - 1] + share(tm) * DT;
    P[i] = P[i - 1] + riseV(tm) * DT;
  }
  const table = (A) => (t) => { const f = clamp(t, 0, TMAX) / DT, i = Math.min(NT - 2, Math.floor(f)); return A[i] + (A[i + 1] - A[i]) * (f - i); };
  const Sat = table(S), Praw = table(P);
  const PEND = Praw(9.25);
  const Pat = (t) => Praw(t) / PEND;

  // un po' più lontano del brief: la pagina è larga e la crociera più veloce
  const D0 = 1750, D1 = 2150;
  const dFlight = (t) => D0 + (D1 - D0) * easeOut3(clamp(t / 8.2));
  const D_OVER = (PH * F) / 1068;
  const D_CARD = (F * 1440) / 1018;
  const thetaAt = (t) => 56 * DEG * (1 - sstep(8.15, 8.95, t));
  const lnDRise = (t) => Math.log(dFlight(t)) + (Math.log(D_OVER) - Math.log(D1)) * Pat(t);
  const K = 1110 - HY; // il bordo basso della pagina si ferma 42 px sopra il fondo
  const lyPin = (d, th) => PH - (K * d) / (F * Math.cos(th) + K * Math.sin(th));
  const LY0 = 420;
  const CRUISE = (lyPin(Math.exp(lnDRise(8.3)), thetaAt(8.3)) - LY0) / Sat(8.3);
  const lyGlide = (t) => LY0 + CRUISE * Sat(t);
  const LND_OVER = Math.log(D_OVER), LND_CREEP = Math.log(D_OVER / 1.035), LND_CARD = Math.log(D_CARD);
  const YTOP0 = HY - (F * PH) / 2 / Math.exp(LND_CREEP);

  function camera(t) {
    let d, th, ly;
    if (t < 9.25) {
      th = thetaAt(t);
      d = t < 7.75 ? dFlight(t) : Math.exp(lnDRise(t));
      const g = lyGlide(t);
      ly = t < 8.3 ? g : mix(g, lyPin(d, th), sstep(8.3, 8.65, t));
    } else if (t < 9.47) {
      th = 0;
      d = Math.exp(mix(LND_OVER, LND_CREEP, sstep(9.25, 9.47, t)));
      ly = PH / 2;
    } else if (t < 9.97) {
      th = 0;
      const u = (t - 9.47) / 0.5;
      d = Math.exp(mix(LND_CREEP, LND_CARD, easeQ(u)));
      const ytop = mix(YTOP0, 283, sstep(0.55, 1, u));
      ly = ((HY - ytop) * d) / F;
    } else {
      th = 0;
      d = D_CARD / (1 + 0.02 * sstep(9.97, DURATION, t));
      ly = 450 - (25 * d) / F; // il centro della card resta fermo
    }
    const s = Math.sin(th), c = Math.cos(th);
    return {
      t, d, th, ly,
      C: [HX, ly + d * s, d * c],
      Fw: [0, -s, -c],
      U: [0, -c, s],
      R: [1, 0, 0],
    };
  }
  const project = (cam, p) => {
    const v = [p[0] - cam.C[0], p[1] - cam.C[1], p[2] - cam.C[2]];
    const z = v[1] * cam.Fw[1] + v[2] * cam.Fw[2];
    return { x: HX + (F * v[0]) / z, y: HY - (F * (v[1] * cam.U[1] + v[2] * cam.U[2])) / z, z };
  };
  // primo istante in cui il centro dell'inquadratura arriva a y
  const tCross = (y) => {
    let a = 0, b = 8.3;
    if (lyGlide(b) < y) return b;
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (lyGlide(m) < y) a = m; else b = m; }
    return b;
  };

  /* ------------------------------------------------------------------ */
  /* la luce: dalla mattina alla notte                                   */
  /* ------------------------------------------------------------------ */
  const SKY = [
    [0, "#f9fbfb", "#f2f3f6"],
    [4.6, "#f9fbfb", "#f2f3f6"],
    [6.9, "#fbf4ea", "#f0e6d8"],
    [7.9, "#f5e2d3", "#e3cdc0"],
    [8.6, "#c9c5dc", "#aaadc8"],
    [9.2, "#474c6c", "#323651"],
    [9.75, "#161a2b", "#0d1020"],
    [99, "#121626", "#0a0c18"],
  ].map(([t, c, e]) => [t, hex(c), hex(e)]);
  function light(t) {
    let i = 0;
    while (i < SKY.length - 2 && t > SKY[i + 1][0]) i++;
    const [t0, c0, e0] = SKY[i], [t1, c1, e1] = SKY[i + 1];
    const u = sstep(t0, t1, t);
    const night = sstep(8.9, 9.8, t);
    return {
      center: mix3(c0, c1, u),
      edge: mix3(e0, e1, u),
      haze: mix3(c0, c1, u),
      shadowCol: mix3(hex("#1a2133"), [0, 0, 0], night),
      shadowOp: mix(mix(0.26, 0.3, sstep(5.5, 7.6, t)), 0.5, night) * (1 - 0.4 * sstep(8.2, 8.9, t) * (1 - night)),
      sunAng: mix(32, -38, sstep(0, 8.6, t)) * DEG,
      sunLen: 1 + 0.7 * sstep(5.5, 8.2, t) - 0.6 * night,
      night,
    };
  }
  const shadowOffset = (z, lt) => {
    const ox = 0.1 * z * lt.sunLen, oy = (4 + 0.36 * z) * lt.sunLen;
    const c = Math.cos(lt.sunAng), s = Math.sin(lt.sunAng);
    return [ox * c - oy * s, ox * s + oy * c];
  };

  /* ------------------------------------------------------------------ */
  /* i pezzi che si sollevano                                            */
  /* ------------------------------------------------------------------ */
  const ROLE = {
    chip: { z: [60, 80], ang: 30, dur: 0.7 },
    flychip: { z: [190, 210], ang: 54, dur: 0.95 },
    button: { z: [26, 34], ang: 12, dur: 0.6 },
    mockup: { z: [34, 40], ang: 16, dur: 0.9 },
    photo: { z: [100, 130], ang: 46, dur: 0.75 },
    card: { z: [24, 40], ang: 10, dur: 0.6 },
    testimonial: { z: [112, 112], ang: 30, dur: 0.85, rest: 22 },
    title: { z: [70, 90], ang: 50, dur: 0.7 },
    herotitle: { z: [20, 30], ang: 24, dur: 0.9 },
  };
  const HERO_START = { "h-title": 0.97, "h-photo": 0.22, "h-status": 0.22, "h-cta": 0.47, "h-badge-lh": 0.47, "h-cta2": 0.72, "h-point0": 0.72, "h-point1": 0.97, "h-point2": 0.97, "h-badge-sm": 1.22 };
  for (const pc of pieces) {
    const r = ROLE[pc.role] ?? ROLE.card;
    pc.hero = pc.y < HERO;
    pc.ang = r.ang * DEG;
    pc.zRest = r.rest ?? 6;
    // un pezzo grande sale abbastanza da non affondare nella pagina quando si alza
    pc.zLift = Math.max(mix(r.z[0], r.z[1], hash(pc.name)), (pc.h / 2) * Math.sin(pc.ang) + 14);
    pc.dur = r.dur;
    const lead = pc.role === "testimonial" ? 760 : pc.role === "title" ? 820 : 640;
    pc.t0 = HERO_START[pc.name] ?? halfBeat(tCross(pc.y + pc.h / 2 - lead));
    pc.dx = pc.role === "flychip" ? (pc.x + pc.w / 2 < HX ? -380 : 640) : 0;
    pc.edge = pc.role === "testimonial" ? 34 : 0;
  }
  function pieceState(pc, t) {
    const u = ease3(clamp((t - pc.t0) / pc.dur));
    let z = mix(pc.zRest, pc.zLift, u), a = pc.ang * u;
    let dx = pc.dx * easeOut3(clamp((t - pc.t0) / (pc.dur * 1.3)));
    if (pc.hero) {
      // fuori campo, i pezzi dell'eroe tornano a posto: alla fine l'eroe è intero
      const back = sstep(3.2, 6.2, t);
      z = mix(z, pc.zRest, back);
      a *= 1 - back;
      dx *= 1 - back;
    }
    return { z, a, dx, haze: pc.hero ? 0 : sstep(9.47, 9.72, t), alpha: pc.hero ? 1 : 1 - sstep(9.72, 9.8, t) };
  }
  // quanto è sollevato ciò che passa al centro dell'inquadratura (per il fuoco)
  function liftAtCenter(t, ly) {
    let best = 0;
    for (const pc of pieces) {
      if (pc.x > HX || pc.x + pc.w < HX) continue;
      const cy = pc.y + pc.h / 2, half = pc.h / 2 + 60;
      const w = 1 - sstep(half * 0.6, half, Math.abs(ly - cy));
      if (w > 0) best = Math.max(best, pieceState(pc, t).z * w);
    }
    return best;
  }

  /* ------------------------------------------------------------------ */
  /* le tessere del logo                                                 */
  /* ------------------------------------------------------------------ */
  const T_REST = [0, 1, 2, 3].map((i) => ({ x: 668 + i * 40, y: 744, z: 4, s: 32 }));
  const T_HANG = [
    { x: -170, y: -80, z: 240, s: 190 },
    { x: -40, y: 170, z: 130, s: 150 },
    { x: 1610, y: -60, z: 290, s: 200 },
    { x: 1500, y: 180, z: 160, s: 165 },
  ];
  const T_END = [
    { x: -30, y: -24, z: 44, s: 150, psi: -8 },
    null,
    { x: 1470, y: -20, z: 44, s: 150, psi: 9 },
    { x: 1596, y: 610, z: 70, s: 118, psi: -5 },
  ];
  const FLIPS = [
    [0, 10.97], [2, 11.22], [3, 11.47], [0, 11.72], [2, 12.22], [3, 12.47], [0, 12.72], [2, 13.22], [3, 13.47], [0, 13.72], [2, 13.97],
  ];
  const camRel = (cam, depth, xr, yr) =>
    add3(add3(add3(cam.C, mul3(cam.Fw, depth)), mul3(cam.R, xr * depth)), mul3(cam.U, yr * depth));

  function tiles(t, cam) {
    const out = [];
    for (let i = 0; i < 5; i++) {
      let p = null, s = 0, stand = 0, psi = 0, faceCam = false, alpha = 1;
      if (i < 4) {
        const u = ease3(clamp((t - (0.1 + 0.1 * i)) / 1.05));
        const a = T_REST[i], b = T_HANG[i];
        p = [mix(a.x, b.x, u), mix(a.y, b.y, u) + 300 * sstep(1.2, 2.4, t), mix(a.z, b.z, u) + 6 * Math.sin(t * 3.9 + i * 1.7) * u];
        s = Math.exp(mix(Math.log(a.s), Math.log(b.s), u));
        stand = 24 * DEG * u;
        psi = (i % 2 ? 6 : -7) * u;
        if (i === 1 && t > 4.9 && t < 6.1) {
          // una tessera passa vicinissima all'obiettivo, sul bordo sinistro
          const v = clamp((t - 4.9) / 1.1);
          p = camRel(cam, 430, mix(-0.24, -0.66, v), mix(-0.46, -0.1, v));
          s = 150;
          faceCam = true;
          psi = -12 + 20 * v;
        }
        if (t >= 9.47 && T_END[i]) {
          // atterrano sugli angoli della card insieme alla picchiata
          const e = T_END[i], v = easeOut3(clamp((t - 9.47) / 0.48));
          const from = [b.x, b.y + 300, b.z];
          p = [mix(from[0], e.x, v), mix(from[1], e.y, v), mix(from[2] + 900 * (1 - v), e.z, v)];
          p[0] += 4 * Math.sin(t * 1.3 + i);
          p[1] += 3 * Math.cos(t * 1.1 + i * 2);
          s = mix(b.s, e.s, v);
          stand = 24 * DEG * (1 - v);
          psi = mix(psi, e.psi, v);
        }
      }
      if ((i === 1 || i === 4) && t >= 9.7) {
        // due macchie morbide entrano dagli angoli in basso
        const v = easeOut3(clamp((t - 9.75) / 0.8));
        const side = i === 1 ? -1 : 1;
        const drift = 0.02 * Math.sin(t * 0.9 + i);
        p = camRel(cam, 600, side * mix(0.82, 0.41, v) + drift, mix(-0.6, -0.3, v) + drift * 0.5);
        s = i === 1 ? 190 : 165;
        faceCam = true;
        psi = side * (14 - 6 * v);
        alpha = sstep(9.7, 9.9, t);
      } else if (i === 4) continue;
      let flip = 0;
      for (const [k, tf] of FLIPS) if (k === i) flip += Math.PI * ease3(clamp((t - tf) / 0.3));
      out.push({ i, p, s, stand, psi: psi * DEG, flip, faceCam, alpha, near: faceCam });
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* il testo del finale                                                 */
  /* ------------------------------------------------------------------ */
  const LINE1 = "Siti, app e bot che lavorano per te.";
  const TAIL = "anche quando dormi.";
  const BADGES = ["Renato Manzotti", "Siti · App · Bot · Video", "+39 338 863 7995"];
  const BADGE_AT = [10.02, 11.97, 12.97];
  tx.font = "500 74px Geist";
  const S1 = Math.min(74, Math.floor((74 * 1240) / tx.measureText(LINE1).width));
  function drawWords(words, font, size, color, x0, base, t0, step, t) {
    tx.font = `${font} ${size}px ${font.includes("italic") ? "'Instrument Serif'" : "Geist"}`;
    const space = tx.measureText(" ").width;
    const ws = words.map((w) => tx.measureText(w).width);
    const total = ws.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    let x = x0 - total / 2;
    tx.fillStyle = color;
    words.forEach((w, i) => {
      const p = clamp((t - (t0 + step * i)) / 0.34);
      if (p > 0) {
        const e = easeOut3(p);
        tx.globalAlpha = e;
        tx.filter = e < 0.999 ? `blur(${(12 * (1 - e)).toFixed(2)}px)` : "none";
        tx.fillText(w, x, base + 16 * (1 - e));
      }
      x += ws[i] + space;
    });
    tx.globalAlpha = 1;
    tx.filter = "none";
  }
  function drawLogo(cx, cy, r) {
    const g = tx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, "#a259ff");
    g.addColorStop(1, "#c79bff");
    tx.fillStyle = g;
    tx.beginPath();
    tx.arc(cx, cy, r, 0, Math.PI * 2);
    tx.fill();
    tx.fillStyle = "#060608";
    tx.font = `700 ${Math.round(r * 0.78)}px 'Fira Code'`;
    tx.textAlign = "center";
    tx.textBaseline = "middle";
    tx.fillText("RM", cx, cy + r * 0.06);
    tx.textAlign = "left";
    tx.textBaseline = "alphabetic";
  }
  function drawText(t) {
    tx.clearRect(0, 0, W, H);
    if (t < 9.99) return false;
    // la pillola bianca: logo + marchio, poi cambia sul battere
    const inP = easeOut3(clamp((t - 10.02) / 0.25));
    if (inP > 0) {
      let k = 0;
      while (k < BADGES.length - 1 && t >= BADGE_AT[k + 1]) k++;
      const sw = clamp((t - BADGE_AT[k]) / 0.3);
      tx.font = "500 21px Geist";
      const wNow = tx.measureText(BADGES[k]).width;
      const wPrev = k > 0 ? tx.measureText(BADGES[k - 1]).width : wNow;
      const wText = k > 0 ? mix(wPrev, wNow, easeOut3(sw)) : wNow;
      const bw = 8 + 30 + 10 + wText + 20, bh = 46, bx = HX - bw / 2, by = 44 + 10 * (1 - inP);
      tx.globalAlpha = inP;
      tx.fillStyle = "rgba(0,0,0,0.28)";
      tx.filter = "blur(10px)";
      tx.beginPath();
      tx.roundRect(bx, by + 8, bw, bh, bh / 2);
      tx.fill();
      tx.filter = "none";
      tx.fillStyle = "#ffffff";
      tx.beginPath();
      tx.roundRect(bx, by, bw, bh, bh / 2);
      tx.fill();
      drawLogo(bx + 8 + 15, by + bh / 2, 15);
      tx.save();
      tx.beginPath();
      tx.rect(bx + 48, by + 2, bw - 52, bh - 4);
      tx.clip();
      tx.font = "500 21px Geist";
      tx.fillStyle = "#0d0d12";
      const base = by + 30;
      if (k > 0 && sw < 1) {
        const e = easeOut3(sw);
        tx.globalAlpha = inP * (1 - e);
        tx.fillText(BADGES[k - 1], bx + 48, base - 14 * e);
        tx.globalAlpha = inP * e;
        tx.fillText(BADGES[k], bx + 48, base + 14 * (1 - e));
      } else {
        tx.fillText(BADGES[k], bx + 48, base);
      }
      tx.restore();
      tx.globalAlpha = 1;
    }
    drawWords(LINE1.split(" "), "500", S1, "#f4f4f8", HX, 172, 10.12, 0.06, t);
    drawWords(TAIL.split(" "), "italic 400", 82, "#8b8b92", HX, 252, 10.36, 0.05, t);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* WebGL                                                               */
  /* ------------------------------------------------------------------ */
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = (vs, fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "aPos");
    gl.bindAttribLocation(p, 1, "aUV");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  };
  const VS_WORLD = `#version 300 es
  in vec3 aPos; in vec2 aUV;
  uniform vec3 uC, uR, uU, uFw; uniform float uF;
  out vec2 vUV; out float vDepth; out vec3 vW;
  void main() {
    vec3 v = aPos - uC;
    float z = dot(v, uFw);
    vUV = aUV; vDepth = z; vW = aPos;
    gl_Position = vec4(uF * dot(v, uR) / 720.0, uF * dot(v, uU) / 576.0, z - 20.0, z);
  }`;
  const FS_WORLD = `#version 300 es
  precision highp float;
  in vec2 vUV; in float vDepth; in vec3 vW;
  uniform int uMode; uniform sampler2D uTex;
  uniform vec4 uP0, uP1; uniform vec3 uHaze, uColor;
  layout(location = 0) out vec4 oCol;
  layout(location = 1) out vec4 oDep;
  float sdRR(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main() {
    vec4 c; float k;
    if (uMode == 0) {
      vec2 hb = vec2(720.0, uP0.x * 0.5);
      float d = sdRR(vW.xy - hb, hb, uP0.y);
      float aa = max(fwidth(d), 0.6);
      float a = (1.0 - smoothstep(-aa, aa, d)) * uP0.w;
      vec4 t = texture(uTex, vUV);
      t.rgb = mix(t.rgb, uHaze, smoothstep(900.0, 990.0, vW.y) * uP0.z);
      c = vec4(t.rgb, 1.0) * a; k = a;
    } else if (uMode == 1) {
      vec2 uv = vUV; if (uP0.z > 0.5) uv.x = 1.0 - uv.x;
      vec4 t = texture(uTex, uv);
      t.rgb = mix(t.rgb, uHaze * t.a, uP0.x);
      c = t * uP0.y; k = c.a;
    } else if (uMode == 2) {
      float a = textureLod(uTex, vUV, uP0.x).a * 0.2;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float ang = fi * 2.39996;
        float rr = sqrt((fi + 0.5) / 6.0);
        a += textureLod(uTex, vUV + vec2(cos(ang), sin(ang)) * rr * uP0.yz, uP0.x + 0.6).a * (0.8 / 6.0);
      }
      c = vec4(uColor, 1.0) * a * uP0.w; k = 0.0;
    } else if (uMode == 3) {
      c = vec4(uColor * mix(1.0, 0.84, vUV.y), 1.0);
      c.rgb = mix(c.rgb, uHaze, uP0.y);
      c *= uP0.x; k = c.a;
    } else {
      vec2 hb = vec2(720.0, uP0.x * 0.5);
      float d = sdRR(vW.xy - hb - uP1.xy, hb, uP0.y);
      float a = (1.0 - smoothstep(-uP0.w * 0.3, uP0.w, d)) * uP0.z;
      c = vec4(uColor, 1.0) * a; k = 0.0;
    }
    oCol = c;
    oDep = vec4(vDepth * k, 0.0, 0.0, k);
  }`;
  const VS_FULL = `#version 300 es
  in vec3 aPos;
  void main() { gl_Position = vec4(aPos.xy, 0.0, 1.0); }`;
  const FS_FLOOR = `#version 300 es
  precision highp float;
  uniform vec3 uC, uR, uU, uFw; uniform float uF; uniform vec3 uCenter, uEdge;
  layout(location = 0) out vec4 oCol;
  layout(location = 1) out vec4 oDep;
  void main() {
    vec2 s = gl_FragCoord.xy - vec2(720.0, 576.0);
    vec3 dir = uFw + uR * (s.x / uF) + uU * (s.y / uF);
    float depth = dir.z < -1e-4 ? -uC.z / dir.z : 1e5;
    float r = clamp(length(s / vec2(720.0, 576.0)) / 1.4142, 0.0, 1.0);
    oCol = vec4(mix(uCenter, uEdge, pow(r, 1.4)), 1.0);
    oDep = vec4(depth, 0.0, 0.0, 1.0);
  }`;
  const FS_ACC = `#version 300 es
  precision highp float;
  uniform sampler2D uCol, uDep; uniform float uW;
  layout(location = 0) out vec4 oCol;
  layout(location = 1) out vec4 oDep;
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    oCol = texelFetch(uCol, p, 0) * uW;
    oDep = texelFetch(uDep, p, 0) * uW;
  }`;
  const FS_TEXT = `#version 300 es
  precision highp float;
  uniform sampler2D uTex; uniform float uFocus;
  layout(location = 0) out vec4 oCol;
  layout(location = 1) out vec4 oDep;
  void main() {
    vec4 t = texture(uTex, vec2(gl_FragCoord.x / 1440.0, 1.0 - gl_FragCoord.y / 1152.0));
    oCol = t;
    oDep = vec4(uFocus * t.a, 0.0, 0.0, t.a);
  }`;
  const COC = `
  float coc(float z, float f) { float r = z < f ? 75.0 * (f - z) / max(z, 1.0) : 6.0 * (z - f) / z; return min(r, 120.0); }`;
  // la sfocatura si calcola a metà risoluzione: dove c'è sfocatura non si vede la differenza
  const FS_DOF_HALF = `#version 300 es
  precision highp float;
  uniform sampler2D uCol, uDep; uniform float uFocus;
  out vec4 oCol;${COC}
  void main() {
    vec2 res = vec2(1440.0, 1152.0);
    ivec2 p = ivec2(gl_FragCoord.xy) * 2;
    float z = min(min(texelFetch(uDep, p, 0).r, texelFetch(uDep, p + ivec2(1, 0), 0).r),
                  min(texelFetch(uDep, p + ivec2(0, 1), 0).r, texelFetch(uDep, p + ivec2(1, 1), 0).r));
    float r = coc(z, uFocus);
    vec2 uv = (gl_FragCoord.xy * 2.0) / res;
    int n = r < 4.0 ? 12 : (r < 14.0 ? 24 : 40);
    float fn = float(n);
    float lod = max(1.0, log2(max(1.0, r * 0.3)));
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 40; i++) {
      if (i >= n) break;
      float fi = float(i) + 0.5;
      float a = fi * 2.39996323;
      acc += textureLod(uCol, uv + vec2(cos(a), sin(a)) * (max(r, 1.0) * sqrt(fi / fn)) / res, lod).rgb;
    }
    oCol = vec4(acc / fn, r);
  }`;
  const FS_DOF = `#version 300 es
  precision highp float;
  uniform sampler2D uCol, uDep, uHalf; uniform float uFocus, uSeed, uOn;
  out vec4 oCol;${COC}
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    float r = coc(texelFetch(uDep, p, 0).r, uFocus) * uOn;
    vec3 col = texelFetch(uCol, p, 0).rgb;
    if (r > 0.6) col = mix(col, texture(uHalf, gl_FragCoord.xy / vec2(1440.0, 1152.0)).rgb, smoothstep(0.6, 3.0, r));
    float n = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);
    oCol = vec4(col + (n - 0.5) / 255.0, 1.0);
  }`;
  const PW = prog(VS_WORLD, FS_WORLD);
  const PFLOOR = prog(VS_FULL, FS_FLOOR);
  const PACC = prog(VS_FULL, FS_ACC);
  const PTEXT = prog(VS_FULL, FS_TEXT);
  const PDOF = prog(VS_FULL, FS_DOF);
  const PHALF = prog(VS_FULL, FS_DOF_HALF);

  // geometria
  const full = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, full);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 0, 0, 3, -1, 0, 0, 0, -1, 3, 0, 0, 0]), gl.STATIC_DRAW);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, 4 * 5 * 4, gl.DYNAMIC_DRAW);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);
  const bindBuf = (b) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
  };
  const qdata = new Float32Array(20);
  const drawQuad = (c, uv = [0, 0, 1, 1]) => {
    // c: alto-sinistra, alto-destra, basso-sinistra, basso-destra
    const uvs = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[0], uv[3]], [uv[2], uv[3]]];
    for (let i = 0; i < 4; i++) qdata.set([c[i][0], c[i][1], c[i][2], uvs[i][0], uvs[i][1]], i * 5);
    bindBuf(quad);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, qdata);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const drawFull = () => { bindBuf(full); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  // superfici di lavoro
  const mkTex = (levels = 1) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA16F, W, H);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, levels > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, levels > 1 ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const mkFbo = (a, b) => {
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, a, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, b, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo");
    return f;
  };
  const sceneCol = mkTex(), sceneDep = mkTex();
  const accCol = mkTex(Math.floor(Math.log2(W)) + 1), accDep = mkTex();
  const sceneFbo = mkFbo(sceneCol, sceneDep), accFbo = mkFbo(accCol, accDep);
  const halfTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, halfTex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, W / 2, H / 2);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const halfFbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, halfFbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, halfTex, 0);

  /* ------------------------------------------------------------------ */
  /* una scena a un istante                                              */
  /* ------------------------------------------------------------------ */
  const setCam = (P, cam) => {
    gl.uniform3fv(P.u.uC, cam.C);
    gl.uniform3fv(P.u.uR, cam.R);
    gl.uniform3fv(P.u.uU, cam.U);
    gl.uniform3fv(P.u.uFw, cam.Fw);
    gl.uniform1f(P.u.uF, F);
  };
  const tex0 = (t) => { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t); };

  function focusAt(t, cam) {
    let f = cam.d;
    if (t > 7.0 && t < 9.0) {
      const w = sstep(7.2, 7.8, t) * (1 - sstep(8.4, 8.9, t));
      f -= Math.max(0, FOOTER_TITLE - cam.ly) * Math.sin(cam.th) * w;
    }
    if (t < 8.3) {
      let z = 0;
      for (const dt of [-0.12, -0.06, 0, 0.06, 0.12]) z += liftAtCenter(t + dt, lyGlide(t + dt)) / 5;
      f -= z * Math.cos(cam.th);
    }
    return f;
  }

  function pieceQuad(pc, st, extra = 0) {
    const qx = pc.clip.x + st.dx, qy = pc.clip.y, qw = pc.clip.width, qh = pc.clip.height;
    const cx = qx + qw / 2, cy = qy + qh / 2;
    const ca = Math.cos(st.a), sa = Math.sin(st.a);
    return [[-qw / 2, -qh / 2], [qw / 2, -qh / 2], [-qw / 2, qh / 2], [qw / 2, qh / 2]].map(([lx, ly]) => {
      const e = extra;
      const ex = lx + Math.sign(lx) * e, ey = ly + Math.sign(ly) * e;
      return [cx + ex, cy + ey * ca, st.z - ey * sa];
    });
  }
  function tileQuad(tl, cam) {
    const h = tl.s / 2;
    let ex, ey, en;
    if (tl.faceCam) {
      ex = cam.R; ey = mul3(cam.U, -1); en = mul3(cam.Fw, -1);
    } else {
      const ca = Math.cos(tl.stand), sa = Math.sin(tl.stand);
      ex = [1, 0, 0]; ey = [0, ca, -sa]; en = [0, sa, ca];
    }
    const cp = Math.cos(tl.psi), sp = Math.sin(tl.psi), cf = Math.cos(tl.flip), sf = Math.sin(tl.flip);
    return [[-h, -h], [h, -h], [-h, h], [h, h]].map(([lx, ly]) => {
      const rx = lx * cp - ly * sp, ry = lx * sp + ly * cp;
      return add3(add3(add3(tl.p, mul3(ex, rx * cf)), mul3(ey, ry)), mul3(en, rx * sf));
    });
  }
  function drawShadow(texture, corners, z, lt, blurPx, texW, texH, op = 1) {
    const [ox, oy] = shadowOffset(z, lt);
    const sc = corners.map((c) => [c[0] + ox + (shadowOffset(c[2], lt)[0] - ox), c[1] + oy + (shadowOffset(c[2], lt)[1] - oy), 0.5]);
    // un margine in più per la sfocatura
    const m = blurPx * 1.2;
    const wq = Math.hypot(sc[1][0] - sc[0][0], sc[1][1] - sc[0][1]) || 1, hq = Math.hypot(sc[2][0] - sc[0][0], sc[2][1] - sc[0][1]) || 1;
    const mu = m / wq, mv = m / hq;
    const ux = [(sc[1][0] - sc[0][0]) / wq, (sc[1][1] - sc[0][1]) / wq], vy = [(sc[2][0] - sc[0][0]) / hq, (sc[2][1] - sc[0][1]) / hq];
    const grow = (c, sx, sy) => [c[0] + (ux[0] * sx + vy[0] * sy) * m, c[1] + (ux[1] * sx + vy[1] * sy) * m, 0.5];
    const g = [grow(sc[0], -1, -1), grow(sc[1], 1, -1), grow(sc[2], -1, 1), grow(sc[3], 1, 1)];
    const texels = (blurPx / wq) * texW;
    gl.uniform1i(PW.u.uMode, 2);
    gl.uniform4f(PW.u.uP0, clamp(Math.log2(Math.max(1, texels / 3)), 0, 4), blurPx / wq, blurPx / hq, lt.shadowOp * op);
    gl.uniform3fv(PW.u.uColor, lt.shadowCol);
    tex0(texture);
    drawQuad(g, [-mu, -mv, 1 + mu, 1 + mv]);
  }

  function renderScene(t) {
    const cam = camera(t), lt = light(t);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);
    gl.useProgram(PFLOOR.p);
    setCam(PFLOOR, cam);
    gl.uniform3fv(PFLOOR.u.uCenter, lt.center);
    gl.uniform3fv(PFLOOR.u.uEdge, lt.edge);
    drawFull();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(PW.p);
    setCam(PW, cam);
    gl.uniform1i(PW.u.uTex, 0);
    gl.uniform3fv(PW.u.uHaze, lt.haze);

    // maschera della pagina: dalla pagina intera all'eroe
    const mBottom = mix(PH, HERO, sstep(9.6, 9.86, t));
    const mRad = mix(24, (38 * cam.d) / F, sstep(9.6, 9.97, t));
    const fadeBelow = sstep(9.47, 9.7, t);

    // l'ombra morbida e larga della pagina (la texture legata non si usa, ma non deve essere quella su cui si disegna)
    tex0(chunks[0].tex);
    gl.uniform1i(PW.u.uMode, 4);
    gl.uniform4f(PW.u.uP0, mBottom, mRad, mix(0.16, 0.42, lt.night), mix(90, 60, lt.night));
    gl.uniform4f(PW.u.uP1, shadowOffset(30, lt)[0] * 0.6, 14 + 8 * lt.sunLen, 0, 0);
    gl.uniform3fv(PW.u.uColor, lt.shadowCol);
    drawQuad([[-260, -260, 0], [1700, -260, 0], [-260, PH + 300, 0], [1700, PH + 300, 0]]);

    // la pagina, a fette
    gl.uniform1i(PW.u.uMode, 0);
    gl.uniform4f(PW.u.uP0, mBottom, mRad, fadeBelow, 1);
    for (const c of chunks) {
      if (c.y > mBottom + 4) continue;
      tex0(c.tex);
      drawQuad([[0, c.y, 0], [1440, c.y, 0], [0, c.y + c.h, 0], [1440, c.y + c.h, 0]]);
    }

    // stato dei pezzi e delle tessere
    const st = pieces.map((pc) => ({ pc, s: pieceState(pc, t) }));
    const tl = tiles(t, cam);

    // ombre (sulla pagina e sul pavimento)
    for (const { pc, s } of st) {
      if (s.alpha <= 0) continue;
      const blur = 7 + 0.5 * s.z;
      drawShadow(pc.tex, pieceQuad(pc, s), s.z, lt, blur, pc.clip.width * 2, pc.clip.height * 2, s.alpha * (1 - s.haze));
    }
    for (const k of tl) {
      if (k.faceCam || k.alpha <= 0) continue;
      drawShadow(TILE_FRONT, tileQuad(k, cam), k.p[2], lt, 7 + 0.5 * k.p[2], 512, 512, k.alpha);
    }

    // i pezzi, dal più basso al più alto
    st.sort((a, b) => a.s.z - b.s.z);
    for (const { pc, s } of st) {
      if (s.alpha <= 0) continue;
      if (pc.edge) {
        // lo spessore bianco della card che si alza
        const ca = Math.cos(s.a), sa = Math.sin(s.a);
        const n = [0, sa, ca];
        const yb = pc.h / 2, inset = 24;
        const cx = pc.x + pc.w / 2 + s.dx, cy = pc.y + pc.h / 2;
        const bl = [pc.x + inset + s.dx, cy + yb * ca, s.z - yb * sa], br = [pc.x + pc.w - inset + s.dx, cy + yb * ca, s.z - yb * sa];
        const down = mul3(n, -pc.edge);
        gl.uniform1i(PW.u.uMode, 3);
        gl.uniform4f(PW.u.uP0, s.alpha, s.haze, 0, 0);
        gl.uniform3fv(PW.u.uColor, [0.97, 0.975, 0.99]);
        drawQuad([bl, br, add3(bl, down), add3(br, down)]);
        void cx;
      }
      gl.uniform1i(PW.u.uMode, 1);
      gl.uniform4f(PW.u.uP0, s.haze, s.alpha, 0, 0);
      tex0(pc.tex);
      drawQuad(pieceQuad(pc, s));
    }

    // tessere lontane, poi il testo, poi le tessere vicinissime all'obiettivo
    const drawTile = (k) => {
      const front = Math.cos(k.flip) >= 0;
      gl.uniform1i(PW.u.uMode, 1);
      gl.uniform4f(PW.u.uP0, 0, k.alpha, front ? 0 : 1, 0);
      tex0(front ? TILE_FRONT : TILE_BACK);
      drawQuad(tileQuad(k, cam));
    };
    const byDepth = (a, b) => project(cam, b.p).z - project(cam, a.p).z;
    tl.filter((k) => !k.near && k.alpha > 0).sort(byDepth).forEach(drawTile);
    const focus = focusAt(t, cam);
    if (drawText(t)) {
      gl.bindTexture(gl.TEXTURE_2D, TEXT_TEX);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
      gl.useProgram(PTEXT.p);
      gl.uniform1i(PTEXT.u.uTex, 0);
      gl.uniform1f(PTEXT.u.uFocus, focus);
      tex0(TEXT_TEX);
      drawFull();
      gl.useProgram(PW.p);
    }
    tl.filter((k) => k.near && k.alpha > 0).sort(byDepth).forEach(drawTile);
    return { cam, focus };
  }

  /* ------------------------------------------------------------------ */
  /* un fotogramma: sottofotogrammi per il mosso, poi la profondità      */
  /* ------------------------------------------------------------------ */
  // quanto si sposta l'immagine durante l'otturatore: da qui i sottofotogrammi
  function subframesFor(t, shutter) {
    const a = camera(clamp(t - shutter / 2, 0, DURATION)), b = camera(clamp(t + shutter / 2, 0, DURATION));
    let px = 0;
    for (const [dx, dy] of [[0, 0], [0, 420], [0, -900], [-620, -300], [620, 300]]) {
      const pt = [HX + dx, b.ly + dy, 0];
      const pa = project(a, pt), pb = project(b, pt);
      if (pa.z > 50 && pb.z > 50) px = Math.max(px, Math.hypot(pb.x - pa.x, pb.y - pa.y));
    }
    return Math.round(clamp(Math.ceil(px / 2.5), 3, 12));
  }
  window.FILM.subframesFor = (t) => subframesFor(t, 0.7 / 60);

  function seek(t, opt = {}) {
    const shutter = (opt.shutter ?? 0.7) / 60;
    const n = opt.sub ?? subframesFor(t, shutter);
    gl.bindFramebuffer(gl.FRAMEBUFFER, accFbo);
    gl.viewport(0, 0, W, H);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
    let focus = 0;
    for (let i = 0; i < n; i++) {
      const ts = n > 1 ? t + (i / (n - 1) - 0.5) * shutter : t;
      focus += renderScene(clamp(ts, 0, DURATION)).focus / n;
      gl.bindFramebuffer(gl.FRAMEBUFFER, accFbo);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(PACC.p);
      gl.uniform1i(PACC.u.uCol, 0);
      gl.uniform1i(PACC.u.uDep, 1);
      gl.uniform1f(PACC.u.uW, 1 / n);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneCol);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, sceneDep);
      drawFull();
      gl.activeTexture(gl.TEXTURE0);
    }
    gl.disable(gl.BLEND);
    gl.bindTexture(gl.TEXTURE_2D, accCol);
    gl.generateMipmap(gl.TEXTURE_2D);
    // sfocatura a metà risoluzione
    gl.bindFramebuffer(gl.FRAMEBUFFER, halfFbo);
    gl.viewport(0, 0, W / 2, H / 2);
    gl.useProgram(PHALF.p);
    gl.uniform1i(PHALF.u.uCol, 0);
    gl.uniform1i(PHALF.u.uDep, 1);
    gl.uniform1f(PHALF.u.uFocus, focus);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, accCol);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, accDep);
    if (!opt.dofOff) drawFull();
    // composizione a piena risoluzione
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(PDOF.p);
    gl.uniform1i(PDOF.u.uCol, 0);
    gl.uniform1i(PDOF.u.uDep, 1);
    gl.uniform1i(PDOF.u.uHalf, 2);
    gl.uniform1f(PDOF.u.uFocus, focus);
    gl.uniform1f(PDOF.u.uOn, opt.dofOff ? 0 : 1);
    gl.uniform1f(PDOF.u.uSeed, (t * 977) % 113);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, halfTex);
    gl.activeTexture(gl.TEXTURE0);
    drawFull();
    gl.finish();
  }

  // il fotogramma come byte RGBA (dal basso verso l'alto), in base64
  const px = new Uint8Array(W * H * 4);
  function grab() {
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let s = "";
    const CH = 0x8000;
    for (let i = 0; i < px.length; i += CH) s += String.fromCharCode.apply(null, px.subarray(i, i + CH));
    return btoa(s);
  }

  // tempi delle singole parti, per capire dove va il tempo
  function profile(t) {
    const one = new Uint8Array(4);
    const sync = () => { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, one); };
    const ms = (fn) => { sync(); const a = performance.now(); fn(); sync(); return Math.round(performance.now() - a); };
    const out = {};
    out.full1 = ms(() => seek(t, { sub: 1 }));
    out.dofOff1 = ms(() => seek(t, { sub: 1, dofOff: true }));
    out.full4 = ms(() => seek(t, { sub: 4 }));
    out.n = subframesFor(t, 0.7 / 60);
    return out;
  }
  window.FILM.profile = profile;

  // misure per controllare il movimento
  const probe = (t) => {
    const cam = camera(t);
    return { t, d: cam.d, th: cam.th / DEG, ly: cam.ly, bottomY: project(cam, [HX, PH, 0]).y, topY: project(cam, [HX, 0, 0]).y, focus: focusAt(t, cam) };
  };
  Object.assign(window.FILM, { seek, grab, probe, CRUISE, pieces: pieces.map((p) => ({ name: p.name, t0: p.t0, zLift: p.zLift })) });
  return true;
})() };
