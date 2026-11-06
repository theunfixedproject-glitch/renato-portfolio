"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CloseIcon } from "@/components/ui/Icons";
import { buildEcosystem, type EcoKind, type EcoNode } from "@/lib/ecosystem";
import type { QuoteInput, QuoteResult } from "@/lib/quote";
import { EcoIcon } from "./ecoIcons";
import { layoutEcosystem, ORBIT_MIN_WIDTH, SPINE_GAP, type Geometry, type Size } from "./ecoLayout";

/**
 * L'ecosistema del preventivo: una mappa a nodi che si costruisce dalle scelte
 * del preventivatore. I nodi sono pulsanti veri (leggibili, cliccabili, da tastiera);
 * collegamenti, flussi, orbite e satelliti sono disegnati su una sola tela.
 */

type Body = Size & { id: string; kind: EcoKind; ring: number; units: number; x: number; y: number; vx: number; vy: number; tx: number; ty: number; born: number; seed: number };
type Link = { key: string; from: string; to: string; born: number; phase: number };
type LogLine = { id: number; sign: "+" | "−"; text: string; more?: string };

const RGB: Record<EcoKind, string> = {
  core: "244,244,248",
  service: "162,89,255",
  base: "163,163,181",
  feature: "61,255,154",
  channel: "95,208,255",
};

const KIND_LABEL: Record<EcoKind, string> = {
  core: "Il centro di tutto",
  service: "Servizio",
  base: "Già compreso nel prezzo",
  feature: "Extra",
  channel: "Canale · da qui arrivano i clienti",
};

const PRICE_LABEL: Partial<Record<EcoKind, string>> = { core: "stima totale", service: "prezzo indicativo", feature: "costo dell'extra" };

const LEGEND = [
  ["service", "Servizi"],
  ["base", "Già compresi"],
  ["feature", "Extra"],
  ["channel", "Canali"],
] as const;

const SPEED: Record<string, number> = { relaxed: 0.7, normal: 1, rush: 1.7 };
/** Punti con cui si disegna ogni collegamento. */
const N = 28;
const TAU = Math.PI * 2;
const INTRO_DELAY = [0, 0.05, 0.3, 0.55];

const hash = (s: string) => Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const thousands = (n: number) =>
  (Math.round(n / 50) * 50)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function EcosystemGraph({ input, result }: { input: QuoteInput; result: QuoteResult | null }) {
  const eco = useMemo(() => buildEcosystem(input, result), [input, result]);
  const byId = useMemo(() => new Map(eco.nodes.map((n) => [n.id, n])), [eco]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const elRefs = useRef(new Map<string, HTMLDivElement>());
  const bodies = useRef(new Map<string, Body>());
  const links = useRef<Link[]>([]);
  const geoRef = useRef<Geometry | null>(null);
  const ecoRef = useRef(eco);
  const canvasSize = useRef({ w: 0, h: 0, dpr: 1 });
  const active = useRef<string | null>(null);
  const related = useRef<Set<string> | null>(null);
  const speed = useRef(1);
  const reduced = useRef(false);
  const released = useRef(false);
  const sprites = useRef<Partial<Record<EcoKind, HTMLCanvasElement>>>({});
  const buf = useRef(new Float32Array(N * 2));
  const kick = useRef<() => void>(() => {});
  const mono = useRef("monospace");

  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [intro, setIntro] = useState(true);
  const [mode, setMode] = useState<"orbit" | "spine">("orbit");
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const [log, setLog] = useState<LogLine | null>(null);
  const current = hover ?? pinned;

  speed.current = SPEED[input.urgencyId] ?? 1;

  /* ---------------- disposizione ---------------- */

  const fitCanvas = useCallback((w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const c = canvasSize.current;
    if (c.w === w && c.h === h && c.dpr === dpr) return;
    canvasSize.current = { w, h, dpr };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }, []);

  /** Misura le etichette, calcola dove va ogni nodo e adatta l'altezza della mappa. */
  const relayout = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.clientWidth;
    if (!w) return;
    const orbit = w >= ORBIT_MIN_WIDTH;
    wrap.style.setProperty("--chip-max", `${orbit ? 210 : Math.floor(w / 2 - SPINE_GAP - 16)}px`);
    const sizes = new Map<string, Size>();
    for (const n of ecoRef.current.nodes) {
      const el = elRefs.current.get(n.id)?.querySelector<HTMLElement>("[data-node]");
      if (el) sizes.set(n.id, { hw: el.offsetWidth / 2, hh: el.offsetHeight / 2 });
    }
    const { geo, targets } = layoutEcosystem(ecoRef.current, sizes, w);
    geoRef.current = geo;
    wrap.style.height = `${geo.h}px`;
    fitCanvas(w, geo.h);
    for (const b of bodies.current.values()) {
      const s = sizes.get(b.id);
      if (s) { b.hw = s.hw; b.hh = s.hh; }
      const t = targets.get(b.id);
      if (t) { b.tx = t.x; b.ty = t.y; }
      // il centro non si muove; prima che la mappa sia visibile, nessuno si muove
      if (b.kind === "core" || reduced.current || !released.current) { b.x = b.tx; b.y = b.ty; b.vx = b.vy = 0; }
    }
    setMode(orbit ? "orbit" : "spine");
  }, [fitCanvas]);

  const writePositions = useCallback((time: number) => {
    const still = reduced.current;
    for (const b of bodies.current.values()) {
      const el = elRefs.current.get(b.id);
      if (!el) continue;
      const float = still || b.kind === "core" ? 0 : Math.sin(time / 1700 + b.seed) * 2.2;
      el.style.transform = `translate3d(${b.x}px, ${b.y + float}px, 0)`;
    }
    const tip = tipRef.current, id = active.current, geo = geoRef.current;
    if (tip && id && geo?.mode === "orbit") {
      const b = bodies.current.get(id);
      if (b) {
        const below = b.y < geo.h / 2;
        const x = clamp(b.x, 150, geo.w - 150);
        const y = below ? b.y + b.hh + 14 : b.y - b.hh - 14;
        tip.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, ${below ? "0" : "-100%"})`;
      }
    }
  }, []);

  /** Molle: ogni nodo raggiunge la sua posizione con un piccolo rimbalzo. */
  const step = useCallback((now: number) => {
    let busy = false;
    for (const b of bodies.current.values()) {
      if (b.kind === "core" || now < b.born) continue;
      b.vx = (b.vx + (b.tx - b.x) * 0.075) * 0.78;
      b.vy = (b.vy + (b.ty - b.y) * 0.075) * 0.78;
      b.x += b.vx;
      b.y += b.vy;
      if (Math.abs(b.vx) + Math.abs(b.vy) > 0.02 || Math.abs(b.tx - b.x) + Math.abs(b.ty - b.y) > 0.2) busy = true;
      else { b.x = b.tx; b.y = b.ty; }
    }
    return busy;
  }, []);

  /* ---------------- disegno ---------------- */

  /** Il percorso di un collegamento, nel verso del flusso (dal pezzo verso il centro). */
  const route = useCallback((l: Link, out: Float32Array) => {
    const a = bodies.current.get(l.from), b = bodies.current.get(l.to), g = geoRef.current;
    if (!a || !b || !g) return false;
    if (g.mode === "orbit") {
      const ua = (a.x - g.cx) / g.ax, va = (a.y - g.cy) / g.ay, ub = (b.x - g.cx) / g.ax, vb = (b.y - g.cy) / g.ay;
      const ra = Math.hypot(ua, va), rb = Math.hypot(ub, vb);
      if (ra < 0.12 || rb < 0.12) {
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1);
          out[2 * i] = a.x + (b.x - a.x) * t;
          out[2 * i + 1] = a.y + (b.y - a.y) * t;
        }
        return true;
      }
      // le curve seguono le orbite invece di tagliare in mezzo
      const ta = Math.atan2(va, ua);
      let d = Math.atan2(vb, ub) - ta;
      if (d > Math.PI) d -= TAU;
      else if (d < -Math.PI) d += TAU;
      const bow = Math.abs(ra - rb) < 0.12 ? 0.09 : 0;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const r = ra + (rb - ra) * t - bow * Math.sin(Math.PI * t);
        const th = ta + d * t;
        out[2 * i] = g.cx + g.ax * r * Math.cos(th);
        out[2 * i + 1] = g.cy + g.ay * r * Math.sin(th);
      }
      return true;
    }
    // telefono: le linee corrono accanto alla spina dorsale
    const onA = a.kind === "core" || a.kind === "service", onB = b.kind === "core" || b.kind === "service";
    let p1x: number, p1y: number, p2x: number, p2y: number;
    const dy = b.y - a.y, dir = Math.sign(dy) || 1, reach = Math.min(42, Math.abs(dy) * 0.5);
    if (onA && onB) { p1x = a.x; p1y = a.y + dy / 3; p2x = b.x; p2y = a.y + (2 * dy) / 3; }
    else if (onB) { const lane = g.cx + (Math.sign(a.x - g.cx) || 1) * 5; p1x = lane; p1y = a.y; p2x = lane; p2y = b.y - dir * reach; }
    else if (onA) { const lane = g.cx + (Math.sign(b.x - g.cx) || 1) * 5; p1x = lane; p1y = a.y + dir * reach; p2x = lane; p2y = b.y; }
    else { const mx = (a.x + b.x) / 2; p1x = mx; p1y = a.y; p2x = mx; p2y = b.y; }
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), m = 1 - t;
      out[2 * i] = m * m * m * a.x + 3 * m * m * t * p1x + 3 * m * t * t * p2x + t * t * t * b.x;
      out[2 * i + 1] = m * m * m * a.y + 3 * m * m * t * p1y + 3 * m * t * t * p2y + t * t * t * b.y;
    }
    return true;
  }, []);

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current, g = geoRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !g) return;
      const { w, h, dpr } = canvasSize.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const rel = related.current;
      const moving = !reduced.current;
      const now = performance.now();
      const core = bodies.current.get("core");
      const empty = ecoRef.current.empty;

      /* --- la struttura: orbite e spicchi, oppure la spina dorsale --- */
      if (g.mode === "orbit") {
        ctx.lineWidth = 1;
        ctx.setLineDash([1.5, 9]);
        for (let k = 1; k <= 3; k++) {
          ctx.lineDashOffset = moving ? (time / 90) * (k % 2 ? 1 : -1) : 0;
          ctx.strokeStyle = `rgba(255,255,255,${0.1 - k * 0.018})`;
          ctx.beginPath();
          ctx.ellipse(g.cx, g.cy, g.ax * g.rings[k], g.ay * g.rings[k], 0, 0, TAU);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        // lo spicchio di ogni servizio: un arco tra il primo e il secondo anello
        const r = (g.rings[1] + g.rings[2]) / 2 + 0.01;
        ctx.lineCap = "round";
        for (const s of g.sectors) {
          const isCore = s.id === "core";
          const lit = rel?.has(s.id) && s.id === active.current;
          const pad = Math.min(0.06, (s.a1 - s.a0) * 0.12);
          ctx.strokeStyle = `rgba(${isCore ? RGB.feature : RGB.service},${lit ? 0.55 : rel ? 0.06 : 0.16})`;
          ctx.lineWidth = lit ? 3 : 2;
          ctx.beginPath();
          ctx.ellipse(g.cx, g.cy, g.ax * r, g.ay * r, 0, s.a0 + pad, s.a1 - pad);
          ctx.stroke();
          // tacche ai bordi
          for (const edge of [s.a0 + pad, s.a1 - pad]) {
            const x = g.cx + g.ax * r * Math.cos(edge), y = g.cy + g.ay * r * Math.sin(edge);
            ctx.fillStyle = `rgba(${isCore ? RGB.feature : RGB.service},${rel ? 0.1 : 0.35})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, TAU);
            ctx.fill();
          }
        }
        ctx.lineCap = "butt";
      } else if (!empty) {
        // le zone dei servizi
        for (const z of g.zones) {
          const lit = active.current === z.id;
          ctx.fillStyle = `rgba(162,89,255,${lit ? 0.08 : 0.035})`;
          ctx.strokeStyle = `rgba(162,89,255,${lit ? 0.35 : 0.12})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(8, z.y0, w - 16, z.y1 - z.y0, 20);
          else ctx.rect(8, z.y0, w - 16, z.y1 - z.y0);
          ctx.fill();
          ctx.stroke();
        }
        // la spina dorsale, con il flusso che sale verso il centro
        ctx.setLineDash([2, 7]);
        ctx.lineDashOffset = moving ? time / 40 : 0;
        ctx.strokeStyle = "rgba(162,89,255,0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(g.cx, g.cy);
        ctx.lineTo(g.cx, g.spineEnd);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      /* --- il centro pulsa --- */
      if (core) {
        const r0 = core.hw;
        for (let k = 0; k < 2; k++) {
          const p = moving ? ((time / 3200 + k * 0.5) % 1) : 0.35;
          ctx.strokeStyle = `rgba(162,89,255,${0.32 * (1 - p)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(core.x, core.y, r0 + 6 + p * (g.mode === "orbit" ? 80 : 46), 0, TAU);
          ctx.stroke();
        }
      }

      /* --- i collegamenti e le comete --- */
      const pts = buf.current;
      ctx.globalCompositeOperation = "source-over";
      const comets: { kind: EcoKind; x: number; y: number; a: number; s: number }[] = [];
      for (const l of links.current) {
        const grow = clamp((now - l.born) / 650, 0, 1);
        if (grow <= 0 || !route(l, pts)) continue;
        const a = bodies.current.get(l.from)!, b = bodies.current.get(l.to)!;
        const on = !rel || (rel.has(a.id) && rel.has(b.id));
        const alpha = on ? (rel ? 0.95 : 0.4) : 0.05;
        const last = Math.max(1, Math.round(grow * (N - 1)));
        const grad = ctx.createLinearGradient(pts[0], pts[1], pts[2 * (N - 1)], pts[2 * (N - 1) + 1]);
        grad.addColorStop(0, `rgba(${RGB[a.kind]},${alpha})`);
        grad.addColorStop(1, `rgba(${RGB[b.kind]},${alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = rel && on ? 2 : b.kind === "core" ? 1.6 : 1.2;
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        for (let i = 1; i <= last; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
        ctx.stroke();

        if (moving && grow >= 1 && on) {
          let len = 0;
          for (let i = 1; i < N; i++) len += Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
          const dur = Math.max(1.6, len / 85) / speed.current;
          const head = ((time / 1000) / dur + l.phase) % 1;
          for (let k = 0; k < 7; k++) {
            const u = head - k * 0.022;
            if (u < 0) break;
            const f = u * (N - 1), i0 = Math.floor(f), fr = f - i0, i1 = Math.min(N - 1, i0 + 1);
            comets.push({
              kind: a.kind,
              x: pts[2 * i0] + (pts[2 * i1] - pts[2 * i0]) * fr,
              y: pts[2 * i0 + 1] + (pts[2 * i1 + 1] - pts[2 * i0 + 1]) * fr,
              a: (rel ? 1 : 0.85) * (1 - k / 7),
              s: k,
            });
          }
        }
      }
      // le comete brillano (si sommano alla luce sotto)
      ctx.globalCompositeOperation = "lighter";
      for (const c of comets) {
        const sp = sprites.current[c.kind];
        ctx.globalAlpha = c.a;
        if (c.s === 0 && sp) ctx.drawImage(sp, c.x - 11, c.y - 11, 22, 22);
        ctx.fillStyle = c.s === 0 ? "rgba(255,255,255,0.95)" : `rgba(${RGB[c.kind]},1)`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.s === 0 ? 1.8 : 2.2 - c.s * 0.25, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      /* --- satelliti: una pagina, una schermata o un video per puntino --- */
      for (const n of bodies.current.values()) {
        if (!n.units || now < n.born) continue;
        const dim = rel && !rel.has(n.id);
        const rx = n.hw + 14, ry = n.hh + 11;
        const spin = moving ? time / 7000 + n.seed : n.seed;
        for (let i = 0; i < n.units; i++) {
          const ang = spin + (i / n.units) * TAU;
          const depth = (Math.sin(ang) + 1) / 2;
          ctx.fillStyle = `rgba(199,155,255,${(dim ? 0.12 : 0.35 + depth * 0.6).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(n.x + Math.cos(ang) * rx, n.y + Math.sin(ang) * ry, 1.4 + depth * 0.9, 0, TAU);
          ctx.fill();
        }
      }

      /* --- un'onda quando un pezzo nuovo entra nell'ecosistema --- */
      if (moving) {
        for (const n of bodies.current.values()) {
          const e = (now - n.born - 250) / 900;
          if (e <= 0 || e >= 1 || n.kind === "core") continue;
          ctx.strokeStyle = `rgba(${RGB[n.kind]},${0.55 * (1 - e)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(n.x, n.y, n.hw + 4 + e * 30, n.hh + 4 + e * 22, 0, 0, TAU);
          ctx.stroke();
        }
      }

      // per ultime, così linee e comete non ci passano sopra
      if (g.mode === "spine") {
        // le didascalie dei gruppi: un'etichetta sulla linea, come il nome di una fermata
        ctx.font = `500 9.5px ${mono.current}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const c of g.captions) {
          const text = c.text.toUpperCase();
          const tw = ctx.measureText(text).width + text.length * 1.2;
          ctx.strokeStyle = "rgba(255,255,255,0.07)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(20, c.y);
          ctx.lineTo(w - 20, c.y);
          ctx.stroke();
          ctx.fillStyle = "#0b0a12";
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(g.cx - tw / 2 - 12, c.y - 10, tw + 24, 20, 10);
          else ctx.rect(g.cx - tw / 2 - 12, c.y - 10, tw + 24, 20);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "rgba(163,163,181,0.9)";
          if ("letterSpacing" in ctx) ctx.letterSpacing = "1.2px";
          ctx.fillText(text, g.cx, c.y + 0.5);
          if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
        }
      }
    },
    [route],
  );

  /* ---------------- ciclo ---------------- */

  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    mono.current = getComputedStyle(document.documentElement).getPropertyValue("--font-fira").trim() || "monospace";
    for (const k of Object.keys(RGB) as EcoKind[]) {
      const c = document.createElement("canvas");
      c.width = c.height = 32;
      const g = c.getContext("2d");
      if (!g) continue;
      const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, `rgba(${RGB[k]},0.9)`);
      gr.addColorStop(0.3, `rgba(${RGB[k]},0.35)`);
      gr.addColorStop(1, `rgba(${RGB[k]},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 32, 32);
      sprites.current[k] = c;
    }

    let raf = 0, onScreen = false, introTimer = 0;
    const loop = (t: number) => {
      step(performance.now());
      writePositions(t);
      draw(t);
      raf = onScreen && !document.hidden && !reduced.current ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    kick.current = () => {
      if (reduced.current) { writePositions(0); draw(0); }
      else if (onScreen) start();
    };

    // la prima volta che la mappa entra nello schermo, tutto nasce dal centro
    const release = () => {
      if (released.current) return;
      released.current = true;
      const now = performance.now();
      const core = bodies.current.get("core");
      for (const b of bodies.current.values()) {
        if (b.kind === "core") continue;
        b.born = reduced.current ? -1e9 : now + INTRO_DELAY[b.ring] * 1000;
        if (!reduced.current && core) { b.x = core.x; b.y = core.y; }
      }
      for (const l of links.current) {
        const ring = bodies.current.get(l.from)?.ring ?? 1;
        l.born = reduced.current ? -1e9 : now + (INTRO_DELAY[ring] + 0.15) * 1000;
      }
      setVisible(true);
      introTimer = window.setTimeout(() => setIntro(false), 1400);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) { release(); start(); }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    if (wrapRef.current) io.observe(wrapRef.current);
    const onVis = () => !document.hidden && onScreen && start();
    document.addEventListener("visibilitychange", onVis);

    let lastW = 0;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w === lastW) return;
      lastW = w;
      relayout();
      kick.current();
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    // quando arrivano i caratteri le etichette cambiano misura
    document.fonts?.ready.then(() => { relayout(); kick.current(); });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(introTimer);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [step, writePositions, draw, relayout]);

  /* ---------------- quando cambiano le scelte ---------------- */

  useLayoutEffect(() => {
    ecoRef.current = eco;
    const now = reduced.current ? -1e9 : performance.now();
    const old = bodies.current;
    const next = new Map<string, Body>();
    for (const n of eco.nodes) {
      let b = old.get(n.id);
      if (!b) {
        // un pezzo nuovo nasce dal nodo a cui si collega
        const parent = eco.edges.find((e) => e.from === n.id && old.has(e.to))?.to ?? eco.edges.find((e) => e.to === n.id && old.has(e.from))?.from ?? "core";
        const p = old.get(parent);
        b = { id: n.id, kind: n.kind, ring: n.ring, hw: 50, hh: 16, units: 0, x: p?.x ?? 0, y: p?.y ?? 0, vx: 0, vy: 0, tx: p?.x ?? 0, ty: p?.y ?? 0, born: now, seed: (hash(n.id) % 628) / 100 };
      }
      b.units = n.units ?? 0;
      next.set(n.id, b);
    }
    bodies.current = next;

    const prev = new Map(links.current.map((l) => [l.key, l]));
    links.current = eco.edges.map((e) => {
      const key = `${e.from}>${e.to}`;
      const p = prev.get(key);
      return { key, from: e.from, to: e.to, born: p?.born ?? (reduced.current ? now : now + 120), phase: p?.phase ?? (hash(key) % 1000) / 1000 };
    });

    relayout();
    kick.current();
  }, [eco, relayout]);

  // cosa è cambiato, in una riga sotto la mappa
  const prevNodes = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    const prev = prevNodes.current;
    prevNodes.current = new Map(eco.nodes.map((n) => [n.id, n.label]));
    if (!prev) return;
    const added = eco.nodes.filter((n) => !prev.has(n.id));
    const removed = [...prev].filter(([id]) => !byId.has(id));
    let line: LogLine | null = null;
    if (added.length) {
      const lead = added.find((n) => n.kind === "service") ?? added.find((n) => n.kind === "feature") ?? added[0];
      const to = eco.edges.filter((e) => e.from === lead.id).map((e) => (e.to === "core" ? "core" : byId.get(e.to)?.label));
      const everywhere = to.length === 1 && to[0] === "core";
      line = {
        id: performance.now(),
        sign: "+",
        text: lead.label,
        more: added.length > 1 ? `e altri ${added.length - 1} pezzi collegati` : everywhere ? "vale per tutto il progetto" : to.length ? `si collega a ${to.map((t) => (t === "core" ? "la tua attività" : t)).join(", ")}` : "aggiunto alla mappa",
      };
    } else if (removed.length) {
      line = { id: performance.now(), sign: "−", text: removed[0][1], more: removed.length > 1 ? `tolto, insieme ad altri ${removed.length - 1} pezzi` : "tolto dalla mappa" };
    }
    if (line) setLog(line);
  }, [eco, byId]);

  /* ---------------- evidenziazione ---------------- */

  /** Il nodo scelto, la strada fino al centro e i pezzi che dipendono da lui. */
  const relatedSet = useMemo(() => {
    if (!current) return null;
    const set = new Set([current]);
    const walk = (up: boolean) => {
      const queue = [current];
      while (queue.length) {
        const id = queue.shift()!;
        for (const e of eco.edges) {
          const [a, b] = up ? [e.from, e.to] : [e.to, e.from];
          if (a !== id || set.has(b)) continue;
          set.add(b);
          if (b !== "core") queue.push(b);
        }
      }
    };
    walk(true);
    if (current === "core") for (const e of eco.edges) e.to === "core" && set.add(e.from);
    else walk(false);
    return set;
  }, [current, eco]);

  useEffect(() => {
    active.current = current;
    related.current = relatedSet;
    kick.current();
  }, [current, relatedSet]);

  useEffect(() => { setPortal(document.body); }, []);
  useEffect(() => { if (pinned && !byId.has(pinned)) setPinned(null); }, [byId, pinned]);
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPinned(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned]);

  const activeNode = current ? byId.get(current) : null;
  const sheetNode = pinned ? byId.get(pinned) : null;

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[11px] text-mist">
        {LEGEND.map(([k, label]) => (
          <span key={k} className="inline-flex items-center gap-2 rounded-full border border-line bg-coal/70 py-1.5 pr-3 pl-2.5">
            <i className="size-2 rounded-full" style={{ background: `rgb(${RGB[k]})`, boxShadow: `0 0 10px rgb(${RGB[k]})` }} aria-hidden />
            {label}
            <b className="font-medium text-snow tabular-nums">{eco.counts[k]}</b>
          </span>
        ))}
        {!eco.empty && (
          <span className="ml-auto hidden text-mist/80 sm:inline">
            {eco.nodes.length - 1} pezzi · {eco.edges.length} collegamenti
          </span>
        )}
      </div>

      <div
        ref={wrapRef}
        role="group"
        aria-label="Mappa del tuo ecosistema"
        onClick={(e) => {
          if (e.target === e.currentTarget || e.target === canvasRef.current) setPinned(null);
        }}
        className="relative h-[560px] overflow-hidden rounded-[2rem] border border-line transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          backgroundColor: "#07070b",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(162,89,255,0.16), transparent 70%), radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 22px 22px",
        }}
      >
        <canvas ref={canvasRef} className="pointer-events-none absolute top-0 left-0" aria-hidden />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(4,4,6,0.75))]" />

        {mode === "orbit" && (
          <>
            <p aria-hidden className="pointer-events-none absolute top-5 left-6 hidden items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-mist/70 uppercase md:flex">
              <i className="size-1.5 rounded-full bg-cyber shadow-[0_0_8px_var(--color-cyber)] motion-safe:animate-pulse" /> si aggiorna mentre scegli
            </p>
            {!eco.empty && (
              <p aria-hidden className="pointer-events-none absolute bottom-5 left-6 hidden font-mono text-[10px] tracking-[0.12em] text-mist/60 md:block">
                dal centro verso l&apos;esterno: servizi → pezzi ed extra → canali
              </p>
            )}
          </>
        )}

        <AnimatePresence>
          {eco.nodes.map((n) => (
            <motion.div
              key={n.id}
              ref={(el: HTMLDivElement | null) => {
                if (el) elRefs.current.set(n.id, el);
                else elRefs.current.delete(n.id);
              }}
              className="absolute top-0 left-0 will-change-transform"
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <div className="-translate-x-1/2 -translate-y-1/2">
                <NodeChip
                  node={n}
                  result={result}
                  visible={visible}
                  delay={intro ? INTRO_DELAY[n.ring] : 0}
                  dim={!!relatedSet && !relatedSet.has(n.id)}
                  selected={current === n.id}
                  onEnter={() => setHover(n.id)}
                  onLeave={() => setHover(null)}
                  onToggle={() => setPinned((p) => (p === n.id ? null : n.id))}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {mode === "orbit" && (
          <div ref={tipRef} className="pointer-events-none absolute top-0 left-0 z-20 w-[280px]" aria-live="polite">
            <AnimatePresence mode="wait">
              {activeNode && (
                <motion.div key={activeNode.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Detail node={activeNode} eco={eco} byId={byId} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {eco.empty && (
          <p className="pointer-events-none absolute inset-x-0 bottom-10 px-6 text-center font-mono text-xs text-mist">
            Scegli un servizio qui sopra: l&apos;ecosistema prende forma intorno alla tua attività.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="flex min-h-6 items-start gap-2 font-mono text-[11px] leading-relaxed text-mist" aria-live="polite">
          <span className="text-violet-soft" aria-hidden>
            ›
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={log?.id ?? "idle"} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {log ? (
                <>
                  <b className={`font-medium ${log.sign === "+" ? "text-cyber" : "text-[#ff7a9a]"}`}>
                    {log.sign} {log.text}
                  </b>
                  {log.more && <span> · {log.more}</span>}
                </>
              ) : (
                "Aggiungi o togli qualcosa qui sopra: la mappa si aggiorna da sola."
              )}
            </motion.span>
          </AnimatePresence>
        </div>
        {!eco.empty && (
          <p className="max-w-md text-[13px] leading-relaxed text-mist md:text-right">
            Le luci che scorrono sono i tuoi clienti: partono dai canali, passano dai servizi e arrivano alla tua attività.
            {input.urgencyId === "rush" && " Con i tempi urgenti corrono più veloci."}
          </p>
        )}
      </div>

      <ul className="sr-only">
        {eco.nodes.map((n) => (
          <li key={n.id}>
            {KIND_LABEL[n.kind]}: {n.title}. {n.desc} {n.price ?? ""}
          </li>
        ))}
      </ul>

      {portal &&
        mode === "spine" &&
        createPortal(
          <AnimatePresence>
            {sheetNode && (
              <motion.div
                key={sheetNode.id}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                exit={{ y: "110%" }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md"
                role="dialog"
                aria-label={sheetNode.title}
              >
                <Detail node={sheetNode} eco={eco} byId={byId} onClose={() => setPinned(null)} />
              </motion.div>
            )}
          </AnimatePresence>,
          portal,
        )}
    </div>
  );
}

/* ---------------- la scheda di un nodo ---------------- */

function Detail({ node, eco, byId, onClose }: { node: EcoNode; eco: ReturnType<typeof buildEcosystem>; byId: Map<string, EcoNode>; onClose?: () => void }) {
  const color = `rgb(${RGB[node.kind]})`;
  const neighbours = eco.edges
    .filter((e) => e.from === node.id || e.to === node.id)
    .map((e) => byId.get(e.from === node.id ? e.to : e.from))
    .filter((n): n is EcoNode => !!n);
  return (
    <div
      className={`${onClose ? "pointer-events-auto" : ""} relative overflow-hidden rounded-2xl border border-line bg-coal/95 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl`}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: `rgba(${RGB[node.kind]},0.12)`, color, boxShadow: `inset 0 0 0 1px rgba(${RGB[node.kind]},0.3)` }}>
          <EcoIcon name={node.kind === "core" ? "ai" : node.icon} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color }}>
            {KIND_LABEL[node.kind]}
          </p>
          <p className="mt-0.5 font-display text-lg leading-tight font-bold">{node.title}</p>
          {node.sub && node.kind !== "core" && <p className="mt-0.5 font-mono text-[11px] text-violet-soft">{node.sub}</p>}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Chiudi" className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-mist hover:text-snow">
            <CloseIcon width={18} height={18} />
          </button>
        )}
      </div>
      <p className="mt-2.5 text-[13px] leading-snug text-mist">{node.desc}</p>
      {(node.price || node.kind === "core") && node.kind !== "channel" && (
        <dl className="mt-3 space-y-1 border-t border-line pt-2.5 font-mono text-[12px]">
          {node.kind === "base" ? (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-mist">costo</dt>
              <dd className="text-cyber">già compreso</dd>
            </div>
          ) : (
            node.price && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-mist">{PRICE_LABEL[node.kind]}</dt>
                <dd className="text-snow">{node.price}</dd>
              </div>
            )
          )}
          {node.kind === "core" && node.sub && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-mist">tempi</dt>
              <dd className="text-cyber">{node.sub}</dd>
            </div>
          )}
        </dl>
      )}
      {neighbours.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-[10px] tracking-[0.15em] text-mist/70 uppercase">si collega a</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {neighbours.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10.5px] text-mist">
                <i className="size-1.5 rounded-full" style={{ background: `rgb(${RGB[m.kind]})` }} aria-hidden />
                {m.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- i nodi ---------------- */

const CHIP_STYLE: Record<Exclude<EcoKind, "core" | "service">, string> = {
  base: "border-white/15 bg-[#101017] text-[#c9c9d6]",
  feature: "border-cyber/40 bg-[#09140f] text-snow",
  channel: "border-[rgba(95,208,255,0.45)] bg-[#09111a] text-snow",
};

function NodeChip({
  node,
  result,
  visible,
  delay,
  dim,
  selected,
  onEnter,
  onLeave,
  onToggle,
}: {
  node: EcoNode;
  result: QuoteResult | null;
  visible: boolean;
  delay: number;
  dim: boolean;
  selected: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onToggle: () => void;
}) {
  const color = `rgb(${RGB[node.kind]})`;
  const common = {
    type: "button" as const,
    "data-node": "",
    "aria-pressed": selected,
    "aria-label": `${node.title}${node.price ? `, ${node.price}` : ""}`,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onFocus: onEnter,
    onBlur: onLeave,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle();
    },
    initial: { scale: 0, opacity: 0 },
    animate: visible ? { scale: selected ? 1.06 : 1, opacity: dim ? 0.22 : 1 } : { scale: 0, opacity: 0 },
    transition: { type: "spring" as const, stiffness: 300, damping: 20, delay, opacity: { duration: 0.25, delay } },
  };

  if (node.kind === "core") {
    const price = result ? `${thousands(result.min)}–${thousands(result.max)} €` : "";
    return (
      <motion.button {...common} className="relative grid size-[124px] cursor-pointer place-items-center rounded-full text-center sm:size-[150px]">
        <span
          aria-hidden
          className="absolute -inset-[6px] rounded-full motion-safe:animate-[beam-rotate_10s_linear_infinite]"
          style={{
            background: "conic-gradient(from 0deg, transparent 0 12%, #a259ff 28%, transparent 44% 58%, #3dff9a 74%, transparent 90%)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-white/15"
          style={{
            background: "radial-gradient(circle at 50% 28%, #3d2669 0%, #170f28 55%, #0a0811 100%)",
            boxShadow: "0 0 80px -10px rgba(162,89,255,0.75), inset 0 0 30px rgba(162,89,255,0.25)",
          }}
        />
        <span className="relative block px-2">
          <span className="block font-mono text-[8.5px] tracking-[0.12em] whitespace-nowrap text-violet-soft uppercase sm:text-[10px] sm:tracking-[0.2em]">{node.label}</span>
          {result ? (
            <span className={`mt-1 block font-display leading-tight font-bold whitespace-nowrap ${price.length > 14 ? "text-[12.5px] sm:text-[16px]" : "text-[14.5px] sm:text-[19px]"}`}>
              <AnimatedNumber value={result.min} format={thousands} />–<AnimatedNumber value={result.max} format={thousands} /> €
            </span>
          ) : (
            <span className="mt-1 block font-display text-[14px] leading-tight font-bold sm:text-[17px]">Il tuo progetto</span>
          )}
          {node.sub && <span className="mt-0.5 block font-mono text-[9px] text-mist sm:text-[10px]">{node.sub}</span>}
        </span>
      </motion.button>
    );
  }

  if (node.kind === "service") {
    return (
      <motion.button
        {...common}
        className="relative flex max-w-[min(260px,calc(var(--chip-max,210px)*1.6))] cursor-pointer items-center gap-2.5 rounded-2xl border border-violet/55 py-2 pr-4 pl-2 text-left sm:py-2.5"
        style={{
          background: "linear-gradient(160deg, #22163a 0%, #110c1d 70%)",
          boxShadow: selected ? `0 0 0 2px ${color}, 0 0 40px -6px rgba(162,89,255,0.9)` : "0 0 34px -12px rgba(162,89,255,0.85), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet/15 text-violet-soft ring-1 ring-violet/35 sm:size-9">
          <EcoIcon name={node.icon} size={17} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[13.5px] leading-tight font-bold sm:text-[15px]">{node.label}</span>
          {node.sub && <span className="mt-0.5 block font-mono text-[9.5px] text-violet-soft sm:text-[10px]">{node.sub}</span>}
          {node.price && <span className="mt-1 block font-mono text-[10.5px] text-snow/85 tabular-nums sm:text-[11px]">{node.price}</span>}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      {...common}
      className={`relative flex max-w-[var(--chip-max,210px)] cursor-pointer items-center gap-1.5 rounded-full border py-1.5 pr-3 pl-2 text-left ${CHIP_STYLE[node.kind]}`}
      style={{ boxShadow: selected ? `0 0 0 2px ${color}, 0 0 24px -4px ${color}` : undefined }}
    >
      <EcoIcon name={node.icon} size={13} className="shrink-0" style={{ color }} />
      <span className="text-[12px] leading-tight font-medium">{node.label}</span>
    </motion.button>
  );
}
