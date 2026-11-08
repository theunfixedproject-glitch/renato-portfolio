// Fotogrammi fissi del film, più qualche misura della camera.
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = process.argv[2];
const TIMES = (process.argv[3] ?? "0,1.6,2.5,5,6.5,9.3,11").split(",").map(Number);
const SUB = process.argv[4] ? Number(process.argv[4]) : undefined;
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 1152 } })).newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errors.push(m.text()));
await p.goto("http://localhost:8811/film.html");
const t0 = Date.now();
await p.evaluate(() => window.FILM.ready);
console.log("pronto in", Date.now() - t0, "ms, crociera", await p.evaluate(() => Math.round(window.FILM.CRUISE)), "px/s");
const probes = await p.evaluate(() => [0, 1.6, 4, 7.3, 8.0, 8.3, 8.65, 9.0, 9.25, 9.47, 9.97, 12, 14.5].map((t) => window.FILM.probe(t)));
for (const q of probes) console.log(Object.entries(q).map(([k, v]) => `${k}=${Number(v).toFixed(1)}`).join(" "));
for (const t of TIMES) {
  const s = Date.now();
  await p.evaluate(([t, sub]) => window.FILM.seek(t, { sub }), [t, SUB]);
  const url = await p.evaluate(() => document.getElementById("c").toDataURL("image/png"));
  fs.writeFileSync(`${OUT}/t${t.toFixed(2)}.png`, Buffer.from(url.split(",")[1], "base64"));
  console.log("t", t, Date.now() - s, "ms");
}
console.log(errors.slice(0, 8).join("\n") || "nessun errore");
await b.close();
