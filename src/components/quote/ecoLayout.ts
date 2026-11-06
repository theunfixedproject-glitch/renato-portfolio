import type { EcoNode, Ecosystem } from "@/lib/ecosystem";

/**
 * Dove va ogni nodo dell'ecosistema. Niente simulazioni fisiche: le posizioni
 * si calcolano, così la mappa è ordinata e uguale a ogni visita.
 *
 * - "orbit" (schermi larghi): il centro, poi tre anelli. Ogni servizio ha il
 *   suo spicchio, grande quanto i pezzi che si porta dietro.
 * - "spine" (telefono): una linea verticale che scende dal centro; ogni servizio
 *   è una fermata, con i suoi pezzi in due colonne.
 */

export type Size = { hw: number; hh: number };
export type Pt = { x: number; y: number };
export type Sector = { id: string; a0: number; a1: number };
export type Zone = { id: string; y0: number; y1: number };
/** Didascalia di un gruppo nella vista telefono. */
export type Caption = { text: string; y: number };
export type Geometry =
  | { mode: "orbit"; w: number; h: number; cx: number; cy: number; ax: number; ay: number; rings: number[]; sectors: Sector[] }
  | { mode: "spine"; w: number; h: number; cx: number; cy: number; spineEnd: number; zones: Zone[]; captions: Caption[] };
export type Layout = { geo: Geometry; targets: Map<string, Pt> };

export const ORBIT_MIN_WIDTH = 720;
/** Spazio tra le due colonne della vista telefono (per lato). */
export const SPINE_GAP = 12;

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const norm = (a: number) => ((a % TAU) + TAU) % TAU;

type Item = Size & { id: string; want: number };

/** I servizi a cui appartiene ogni nodo. Vuoto = vale per tutto il progetto. */
function ownership(eco: Ecosystem) {
  const kind = new Map(eco.nodes.map((n) => [n.id, n.kind]));
  const up = new Map<string, string[]>();
  const down = new Map<string, string[]>();
  for (const e of eco.edges) {
    up.set(e.from, [...(up.get(e.from) ?? []), e.to]);
    down.set(e.to, [...(down.get(e.to) ?? []), e.from]);
  }
  const memo = new Map<string, string[]>();
  const of = (id: string, depth = 0): string[] => {
    const hit = memo.get(id);
    if (hit) return hit;
    const out = new Set<string>();
    if (depth < 4) {
      for (const p of up.get(id) ?? []) {
        const k = kind.get(p);
        if (k === "service") out.add(p);
        else if (k === "base" || k === "feature") of(p, depth + 1).forEach((s) => out.add(s));
      }
      // un canale senza servizi diretti appartiene a chi lo apre (es. il video di lancio)
      if (!out.size && kind.get(id) === "channel") for (const c of down.get(id) ?? []) of(c, depth + 1).forEach((s) => out.add(s));
    }
    const list = [...out];
    memo.set(id, list);
    return list;
  };
  return { of, up };
}

/** Ogni pezzo compreso seguito dagli extra che ci si agganciano, poi gli altri extra, poi i canali. */
function ordered(items: EcoNode[], up: Map<string, string[]>) {
  const out: EcoNode[] = [];
  const feats = items.filter((n) => n.kind === "feature");
  for (const b of items.filter((n) => n.kind === "base")) {
    out.push(b);
    for (const f of feats) if (up.get(f.id)?.includes(b.id)) out.push(f);
  }
  for (const n of items) if (!out.includes(n)) out.push(n);
  return out.sort((a, b) => (a.ring === 3 ? 1 : 0) - (b.ring === 3 ? 1 : 0));
}

function split(eco: Ecosystem, rings: number[]) {
  const { of, up } = ownership(eco);
  const services = eco.nodes.filter((n) => n.kind === "service");
  const groups = new Map(services.map((s) => [s.id, [] as EcoNode[]]));
  const shared: EcoNode[] = [];
  const global: EcoNode[] = [];
  for (const n of eco.nodes) {
    if (!rings.includes(n.ring)) continue;
    const o = of(n.id);
    if (o.length === 1) groups.get(o[0])?.push(n);
    else if (o.length > 1) shared.push(n);
    else global.push(n);
  }
  return { of, up, services, groups, shared, global };
}

/** Quanto spazio angolare occupa un'etichetta in quel punto dell'ellisse. */
function footprint(theta: number, it: Size, rx: number, ry: number, gap: number) {
  const tx = -rx * Math.sin(theta), ty = ry * Math.cos(theta);
  const sp = Math.hypot(tx, ty) || 1;
  return ((Math.abs(tx) * 2 * it.hw + Math.abs(ty) * 2 * it.hh) / sp + gap) / sp;
}

/** Distribuisce le etichette su un'ellisse: restano vicine a dove vorrebbero stare, senza toccarsi. */
function pack(items: Item[], rx: number, ry: number, gap = 14) {
  const out = new Map<string, number>();
  const n = items.length;
  if (n === 0) return out;
  if (n === 1) return out.set(items[0].id, items[0].want);
  const sorted = items.map((it) => ({ ...it, want: norm(it.want) })).sort((a, b) => a.want - b.want);
  // si "taglia" il cerchio nel buco più grande, così l'ordine è lineare
  let cut = 0, best = -1;
  for (let i = 0; i < n; i++) {
    const g = (i === n - 1 ? sorted[0].want + TAU : sorted[i + 1].want) - sorted[i].want;
    if (g > best) { best = g; cut = (i + 1) % n; }
  }
  const seq = [...sorted.slice(cut), ...sorted.slice(0, cut)];
  const want = seq.map((it) => it.want);
  for (let i = 1; i < n; i++) while (want[i] < want[i - 1]) want[i] += TAU;
  const th = [...want];
  const fp = (i: number) => footprint(th[i], seq[i], rx, ry, gap);
  for (let iter = 0; iter < 420; iter++) {
    for (let i = 0; i < n - 1; i++) {
      const need = (fp(i) + fp(i + 1)) / 2, d = th[i + 1] - th[i];
      if (d < need) { const p = (need - d) / 2; th[i] -= p; th[i + 1] += p; }
    }
    const need = (fp(n - 1) + fp(0)) / 2, d = th[0] + TAU - th[n - 1];
    if (d < need) { const p = (need - d) / 2; th[n - 1] -= p; th[0] += p; }
    if (iter < 380) for (let i = 0; i < n; i++) th[i] += (want[i] - th[i]) * 0.012;
  }
  seq.forEach((it, i) => out.set(it.id, th[i]));
  return out;
}

function meanAngle(list: number[]) {
  let x = 0, y = 0;
  for (const a of list) { x += Math.cos(a); y += Math.sin(a); }
  // servizi opposti: il punto in mezzo è in alto
  return Math.hypot(x, y) < 0.3 * list.length ? -Math.PI / 2 : Math.atan2(y, x);
}

type Box = Size & Pt & { id: string; fixed?: boolean; round?: boolean };

/** Ultima passata: se due etichette si toccano ancora, si spostano quel tanto che basta. */
function separate(boxes: Box[], w: number, h: number, gx = 12, gy = 8) {
  const keepIn = (b: Box) => {
    b.x = clamp(b.x, b.hw + 10, w - b.hw - 10);
    b.y = clamp(b.y, b.hh + 10, h - b.hh - 10);
  };
  for (let iter = 0; iter < 90; iter++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        let a = boxes[i], b = boxes[j];
        if (a.round || b.round) {
          if (b.round) [a, b] = [b, a];
          // a è il centro (un cerchio), b un'etichetta
          const px = clamp(a.x, b.x - b.hw, b.x + b.hw), py = clamp(a.y, b.y - b.hh, b.y + b.hh);
          let dx = px - a.x, dy = py - a.y;
          let d = Math.hypot(dx, dy);
          const need = a.hw + 14;
          if (d >= need) continue;
          if (d < 1e-3) { dx = b.x - a.x || 1; dy = b.y - a.y; d = Math.hypot(dx, dy); }
          b.x += (dx / d) * (need - d);
          b.y += (dy / d) * (need - d);
          moved = true;
          continue;
        }
        const dx = b.x - a.x, dy = b.y - a.y;
        const ox = a.hw + b.hw + gx - Math.abs(dx), oy = a.hh + b.hh + gy - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        const wa = a.fixed ? 0 : b.fixed ? 1 : 0.5, wb = b.fixed ? 0 : a.fixed ? 1 : 0.5;
        if (ox < oy) {
          const s = ox * (dx >= 0 ? 1 : -1);
          a.x -= s * wa; b.x += s * wb;
        } else {
          const s = oy * (dy >= 0 ? 1 : -1);
          a.y -= s * wa; b.y += s * wb;
        }
      }
    }
    boxes.forEach((b) => !b.fixed && keepIn(b));
    if (!moved) break;
  }
}

function orbit(eco: Ecosystem, S: (id: string) => Size, w: number): Layout {
  const { of, up, services, groups, shared, global } = split(eco, [2]);
  const outer = eco.nodes.filter((n) => n.ring >= 2);
  const h = services.length ? Math.round(clamp(430 + outer.length * 15, 560, 820)) : 420;
  const cx = w / 2, cy = h / 2;
  const edgeHw = Math.max(70, ...eco.nodes.filter((n) => n.ring === 3).map((n) => S(n.id).hw));
  const ax = Math.max(140, w / 2 - 18 - edgeHw), ay = h / 2 - 34;
  const rings = [0, 0.46, 0.74, 1];
  const targets = new Map<string, Pt>([["core", { x: cx, y: cy }]]);
  const geo: Geometry = { mode: "orbit", w, h, cx, cy, ax, ay, rings, sectors: [] };
  if (!services.length) return { geo, targets };

  // gli spicchi: ogni servizio pesa quanto i pezzi che si porta dietro
  const touch = (sid: string) => shared.filter((n) => of(n.id).includes(sid)).length;
  const weights = services.map((s) => 1.4 + groups.get(s.id)!.length + 0.5 * touch(s.id));
  if (global.length) weights.push(0.8 + global.length);
  const total = weights.reduce((a, b) => a + b, 0);
  let a = (services.length === 1 ? -Math.PI / 2 : Math.PI) - (weights[0] / total) * Math.PI;
  geo.sectors = weights.map((wt, i) => {
    const a0 = a;
    a += (wt / total) * TAU;
    return { id: services[i]?.id ?? "core", a0, a1: a };
  });
  const sectors = geo.sectors;
  const mid = (i: number) => (sectors[i].a0 + sectors[i].a1) / 2;

  const place = (items: Item[], r: number) => {
    const rx = ax * r, ry = ay * r;
    pack(items, rx, ry).forEach((th, id) => targets.set(id, { x: cx + rx * Math.cos(th), y: cy + ry * Math.sin(th) }));
  };

  // anello 1: i servizi al centro del loro spicchio
  const angle = new Map<string, number>();
  pack(services.map((s, i) => ({ id: s.id, want: mid(i), ...S(s.id) })), ax * rings[1], ay * rings[1], 20).forEach((th, id) => {
    angle.set(id, th);
    targets.set(id, { x: cx + ax * rings[1] * Math.cos(th), y: cy + ay * rings[1] * Math.sin(th) });
  });

  // anello 2: pezzi compresi ed extra, sparsi nello spicchio del loro servizio
  const ring2: Item[] = [];
  sectors.forEach((sec, i) => {
    const list = ordered(i < services.length ? groups.get(services[i].id)! : global, up);
    list.forEach((n, j) => ring2.push({ id: n.id, want: sec.a0 + ((j + 0.5) / list.length) * (sec.a1 - sec.a0), ...S(n.id) }));
  });
  for (const n of shared) ring2.push({ id: n.id, want: meanAngle(of(n.id).map((s) => angle.get(s)!)), ...S(n.id) });
  const crowd = ring2.reduce((sum, it) => sum + footprint(it.want, it, ax * rings[2], ay * rings[2], 14), 0);
  if (crowd > TAU * 0.92) {
    // troppi pezzi per un anello solo: si sfalsano su due
    const sorted = [...ring2].sort((p, q) => norm(p.want) - norm(q.want));
    place(sorted.filter((_, i) => i % 2 === 0), 0.65);
    place(sorted.filter((_, i) => i % 2 === 1), 0.84);
  } else place(ring2, rings[2]);

  // anello 3: i canali, fuori dal servizio che portano clienti
  const ring3 = eco.nodes
    .filter((n) => n.ring === 3)
    .map((n) => {
      const o = of(n.id);
      const want = o.length ? meanAngle(o.map((s) => angle.get(s)!)) : global.length ? mid(sectors.length - 1) : Math.PI / 2;
      return { id: n.id, want, ...S(n.id) };
    });
  place(ring3, rings[3]);

  const boxes: Box[] = eco.nodes.map((n) => ({ id: n.id, ...S(n.id), ...targets.get(n.id)!, fixed: n.kind === "core", round: n.kind === "core" }));
  separate(boxes, w, h);
  boxes.forEach((b) => targets.set(b.id, { x: b.x, y: b.y }));
  return { geo, targets };
}

function spine(eco: Ecosystem, S: (id: string) => Size, w: number): Layout {
  const { up, services, groups, shared, global } = split(eco, [2, 3]);
  const cx = w / 2;
  const targets = new Map<string, Pt>();
  const zones: Zone[] = [];
  const captions: Caption[] = [];
  const core = S("core");
  if (!services.length) {
    targets.set("core", { x: cx, y: 170 });
    return { geo: { mode: "spine", w, h: 400, cx, cy: 170, spineEnd: 170, zones, captions }, targets };
  }
  const cy = 18 + core.hh;
  targets.set("core", { x: cx, y: cy });
  let y = cy + core.hh + 30;
  let lone = 0;
  const rows = (items: EcoNode[]) => {
    for (let i = 0; i < items.length; i += 2) {
      const a = items[i], b = items[i + 1];
      const sa = S(a.id), sb = b ? S(b.id) : null;
      const rh = Math.max(sa.hh, sb?.hh ?? 0);
      const left = !b ? lone++ % 2 === 0 : true;
      targets.set(a.id, { x: left ? cx - SPINE_GAP - sa.hw : cx + SPINE_GAP + sa.hw, y: y + rh });
      if (b && sb) targets.set(b.id, { x: cx + SPINE_GAP + sb.hw, y: y + rh });
      y += rh * 2 + 10;
    }
  };
  const caption = (text: string) => {
    captions.push({ text, y: y + 8 });
    y += 30;
  };
  if (global.length) {
    caption("per tutto il progetto");
    rows(ordered(global, up));
    y += 24;
  }
  let spineEnd = cy;
  for (const s of services) {
    const ss = S(s.id);
    const y0 = y - 12;
    spineEnd = y + ss.hh;
    targets.set(s.id, { x: cx, y: spineEnd });
    y += ss.hh * 2 + 16;
    rows(ordered(groups.get(s.id)!, up));
    zones.push({ id: s.id, y0, y1: y + 2 });
    y += 30;
  }
  if (shared.length) {
    caption("in comune tra più servizi");
    rows(ordered(shared, up));
  }
  return { geo: { mode: "spine", w, h: Math.round(y + 8), cx, cy, spineEnd, zones, captions }, targets };
}

export function layoutEcosystem(eco: Ecosystem, sizes: Map<string, Size>, w: number): Layout {
  const S = (id: string) => sizes.get(id) ?? { hw: 60, hh: 16 };
  return w >= ORBIT_MIN_WIDTH ? orbit(eco, S, w) : spine(eco, S, w);
}
