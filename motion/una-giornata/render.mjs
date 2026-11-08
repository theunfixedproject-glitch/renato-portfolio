// Rende un tratto del film in MP4 (H.264), un fotogramma alla volta.
// uso: node render.mjs out.mp4 fps primoFotogramma ultimoEscluso [sottofotogrammi|auto] [scala]
import { chromium } from "playwright";
import { spawn } from "node:child_process";

const [out, fpsArg = "60", fromArg = "0", toArg = "", subArg = "auto", scale = ""] = process.argv.slice(2);
const fps = Number(fpsArg);
const total = Math.round(14.5 * fps);
const from = Number(fromArg), to = toArg ? Math.min(Number(toArg), total) : total;
const sub = subArg === "auto" ? undefined : Number(subArg);

const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 1152 } })).newPage();
p.on("pageerror", (e) => console.error("errore pagina:", e.message));
await p.goto("http://localhost:8811/film.html");
await p.evaluate(() => window.FILM.ready);

const vf = ["vflip", scale ? `scale=${scale}:flags=lanczos` : null].filter(Boolean).join(",");
const ff = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "1440x1152", "-r", String(fps), "-i", "-",
  "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", scale ? "20" : "12", "-pix_fmt", "yuv420p", out,
], { stdio: ["pipe", "inherit", "inherit"] });
const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));

const start = Date.now();
for (let i = from; i < to; i++) {
  const t = i / fps;
  const b64 = await p.evaluate(([t, sub]) => { window.FILM.seek(t, sub ? { sub } : {}); return window.FILM.grab(); }, [t, sub]);
  await write(Buffer.from(b64, "base64"));
  if ((i - from) % 30 === 0) {
    const done = i - from + 1, left = to - i - 1;
    console.log(`fotogramma ${i} (t=${t.toFixed(2)}) — ${((Date.now() - start) / done / 1000).toFixed(2)} s/fotogramma, mancano ~${Math.round((((Date.now() - start) / done) * left) / 60000)} min`);
  }
}
ff.stdin.end();
await new Promise((res) => ff.on("close", res));
await b.close();
console.log("fatto:", out, ((Date.now() - start) / 1000).toFixed(0), "s");
