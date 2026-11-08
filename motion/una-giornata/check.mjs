// Controllo del movimento: la velocità giù per la pagina non cala mai durante la crociera,
// e durante il volo e la salita la camera non si avvicina mai.
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await (await b.newContext()).newPage();
await p.goto("http://localhost:8811/film.html");
await p.evaluate(() => window.FILM.ready);
const r = await p.evaluate(() => {
  const out = { speedDipCruise: 0, minCruise: 1e9, maxCruise: 0, zoomInFlight: 0, maxZoomInStep: 0, subframes: {} };
  let prev = null;
  for (let i = 0; i <= 14.5 * 60; i++) {
    const t = i / 60, q = window.FILM.probe(t);
    if (prev) {
      const v = (q.ly - prev.ly) * 60;
      if (t > 1.65 && t < 7.3) { out.minCruise = Math.min(out.minCruise, v); out.maxCruise = Math.max(out.maxCruise, v); if (v < prev.v - 1e-6 && t > 1.7) out.speedDipCruise = Math.max(out.speedDipCruise, prev.v - v); }
      if (t <= 9.25 && q.d < prev.d - 1e-6) { out.zoomInFlight++; out.maxZoomInStep = Math.max(out.maxZoomInStep, prev.d - q.d); }
      q.v = v;
    }
    const n = window.FILM.subframesFor(t);
    out.subframes[n] = (out.subframes[n] || 0) + 1;
    prev = q;
  }
  return out;
});
console.log(JSON.stringify(r));
await b.close();
