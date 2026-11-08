// node tool.mjs stills <cartella> [tempi]   — fotogrammi fissi (di default uno per battito)
// node tool.mjs audio <file.wav>            — la colonna sonora, dalla Web Audio API
// node tool.mjs video <file.mp4> [da] [a]   — 60 fps, 3 sottofotogrammi uniti con tmix
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";

const [mode, out, a3, a4] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await p.goto("http://127.0.0.1:8822/reel.html");
await p.evaluate(() => window.REEL.ready);

const grab = (t) => p.evaluate((t) => {
  window.REEL.seek(t);
  const c = document.getElementById("c");
  const d = c.getContext("2d").getImageData(0, 0, 1920, 1080).data;
  let s = "";
  for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
  return btoa(s);
}, t);

if (mode === "stills") {
  fs.mkdirSync(out, { recursive: true });
  const times = a3 ? a3.split(",").map(Number) : Array.from({ length: 40 }, (_, i) => i * 0.5 + 0.125);
  for (const t of times) {
    const url = await p.evaluate((t) => { window.REEL.seek(t); return document.getElementById("c").toDataURL("image/jpeg", 0.85); }, t);
    fs.writeFileSync(`${out}/t${t.toFixed(3).padStart(6, "0")}.jpg`, Buffer.from(url.split(",")[1], "base64"));
  }
  console.log("fotogrammi:", times.length);
} else if (mode === "audio") {
  const r = await p.evaluate(() => window.renderSoundtrack());
  fs.writeFileSync(out, Buffer.from(r.b64, "base64"));
  console.log("audio scritto, picco", r.peak.toFixed(2));
} else if (mode === "video") {
  // sottofotogramma n al tempo (n - 1) / 180: ogni fotogramma a 60 fps è la media di t - 1/180, t, t + 1/180
  const from = Number(a3 ?? 0), to = Number(a4 ?? 1200);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "1920x1080", "-r", "180", "-i", "-",
    "-vf", "tmix=frames=3:weights='1 1 1',select='eq(mod(n\\,3)\\,2)',setpts=N/(60*TB)", "-r", "60",
    "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", out], { stdio: ["pipe", "inherit", "inherit"] });
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));
  const start = Date.now();
  for (let n = from * 3; n < to * 3; n++) {
    await write(Buffer.from(await grab((n - 1) / 180), "base64"));
    if (n % 180 === 0) console.log(`t=${(n / 180).toFixed(1)} s — ${((Date.now() - start) / 1000).toFixed(0)} s trascorsi`);
  }
  ff.stdin.end();
  await new Promise((res) => ff.on("close", res));
  console.log("video:", out, ((Date.now() - start) / 1000).toFixed(0), "s");
}
console.log(errors.slice(0, 6).join("\n") || "nessun errore");
await b.close();
