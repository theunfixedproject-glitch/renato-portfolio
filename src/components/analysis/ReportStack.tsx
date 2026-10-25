"use client";

import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";

/**
 * Anteprima 3D di un report: tre fogli sovrapposti che si aprono a ventaglio e
 * seguono il mouse. I nomi delle attività sono oscurati: è un'anteprima, non il report.
 */

const ranking = [
  { score: 20, w: "62%" },
  { score: 22, w: "48%" },
  { score: 64, w: "55%" },
  { score: 65, w: "40%" },
  { score: 67, w: "58%" },
];

const bars = [
  { label: "w-24", value: 38 },
  { label: "w-28", value: 34 },
  { label: "w-20", value: 32 },
  { label: "w-24", value: 31 },
];

function Redacted({ w, className = "" }: { w: string; className?: string }) {
  return <span className={`inline-block h-2.5 rounded-sm bg-[#1d3446]/80 ${className}`} style={{ width: w }} />;
}

function SheetFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-[#fbfcfd] text-[#1d3446] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
      <div className="h-2 bg-[#0e7c7b]" />
      <div className="flex-1 p-5">
        <p className="text-[8px] font-bold tracking-[0.18em] text-[#0e7c7b] uppercase">{label}</p>
        {children}
      </div>
      <div className="flex justify-between border-t border-[#dfe6ea] px-5 py-2 text-[7px] text-[#7a8a96]">
        <span>RICERCA SU FONTI PUBBLICHE</span>
        <span>1 / 19</span>
      </div>
    </div>
  );
}

function RankingSheet() {
  return (
    <SheetFrame label="Report dei siti web">
      <p className="mt-2 text-[17px] leading-tight font-semibold">50 siti di B&amp;B in provincia</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          ["50", "siti"],
          ["151", "pagine"],
          ["50", "telefoni"],
          ["43", "email"],
        ].map(([n, l]) => (
          <div key={l}>
            <p className="text-[18px] leading-none font-bold">{n}</p>
            <p className="mt-1 text-[7px] text-[#7a8a96]">{l}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[9px] font-bold">Classifica · dal punteggio più basso</p>
      <ul className="mt-2 space-y-2.5">
        {ranking.map((r, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-[#eef2f4] pb-2">
            <span className="text-[8px] font-bold text-[#7a8a96]">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1">
              <Redacted w={r.w} />
              <span className="mt-1 block">
                <Redacted w="80%" className="h-1.5 bg-[#c9d4db]" />
              </span>
            </span>
            <span className={`text-[14px] font-bold ${r.score < 30 ? "text-[#c0392b]" : "text-[#0e7c7b]"}`}>
              {r.score}
              <span className="text-[7px] font-normal text-[#7a8a96]">/100</span>
            </span>
          </li>
        ))}
      </ul>
    </SheetFrame>
  );
}

function ChartSheet() {
  return (
    <SheetFrame label="Analisi di mercato">
      <p className="mt-2 text-[16px] leading-tight font-bold">Il bisogno c&apos;è, anche in un sistema forte</p>
      <div className="mt-5 space-y-3">
        {bars.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`h-2 shrink-0 rounded-sm bg-[#c9d4db] ${b.label}`} />
            <span className="h-4 flex-1 bg-[#e8f0f1]">
              <span className="block h-full bg-[#0e7c7b]" style={{ width: `${b.value * 2}%` }} />
            </span>
            <span className="w-7 text-right text-[9px] font-bold">{b.value}%</span>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-md border border-[#cfe0e1] bg-[#eef6f6] p-3">
        <p className="text-[9px] font-bold text-[#0e7c7b]">Il giudizio centrale</p>
        <Redacted w="95%" className="mt-2 h-1.5 bg-[#9fb4bf]" />
        <Redacted w="85%" className="mt-1.5 h-1.5 bg-[#9fb4bf]" />
        <Redacted w="60%" className="mt-1.5 h-1.5 bg-[#9fb4bf]" />
      </div>
    </SheetFrame>
  );
}

function ListSheet() {
  return (
    <SheetFrame label="Mappatura operatori">
      <p className="mt-2 text-[16px] leading-tight font-semibold">100 studi professionali</p>
      <div className="mt-4 space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b border-[#eef2f4] pb-3">
            <p className="text-[9px] font-bold">{String(i + 1).padStart(3, "0")}</p>
            <Redacted w={["70%", "55%", "64%", "48%"][i]} className="mt-1" />
            <div className="mt-1.5 flex gap-2">
              <Redacted w="30%" className="h-1.5 bg-[#c9d4db]" />
              <Redacted w="40%" className="h-1.5 bg-[#c9d4db]" />
            </div>
          </div>
        ))}
      </div>
    </SheetFrame>
  );
}

export function ReportStack() {
  const rx = useSpring(8, { stiffness: 120, damping: 18 });
  const ry = useSpring(-18, { stiffness: 120, damping: 18 });
  const spread = useSpring(1, { stiffness: 140, damping: 20 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(-18 + px * 26);
    rx.set(8 - py * 16);
    spread.set(1.45);
  };
  const onLeave = () => {
    rx.set(8);
    ry.set(-18);
    spread.set(1);
  };

  const sheets = [
    { Sheet: ListSheet, x: -46, y: 26, z: -120, rot: -7 },
    { Sheet: ChartSheet, x: -20, y: 10, z: -60, rot: -3 },
    { Sheet: RankingSheet, x: 8, y: -6, z: 0, rot: 2 },
  ];

  return (
    <div aria-hidden className="relative mx-auto h-[420px] w-full max-w-[420px] [perspective:1400px] sm:h-[480px]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="glow-violet pointer-events-none absolute -inset-20" />
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={{ rotateX: rx, rotateY: ry }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {sheets.map(({ Sheet, x, y, z, rot }, i) => (
          <Layer key={i} spread={spread} x={x} y={y} z={z} rot={rot}>
            <Sheet />
          </Layer>
        ))}
        {/* etichetta fluttuante */}
        <motion.div
          className="absolute -right-2 bottom-10 rounded-2xl border border-cyber/40 bg-ink/85 px-4 py-3 font-mono text-xs text-snow shadow-[0_0_40px_-10px_var(--color-cyber)] sm:-right-6"
          style={{ z: 80 }}
        >
          <span className="text-cyber">PDF</span> · <span className="text-violet-soft">Web</span> · <span className="text-snow">Excel</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

type LayerProps = { spread: MotionValue<number>; x: number; y: number; z: number; rot: number; children: React.ReactNode };

/** Un foglio della pila: si allontana dagli altri quando il mouse è sopra. */
function Layer({ spread, x, y, z, rot, children }: LayerProps) {
  const tx = useTransform(spread, (s) => `calc(-50% + ${x * s}px)`);
  const ty = useTransform(spread, (s) => `calc(-50% + ${y * s}px)`);
  const tz = useTransform(spread, (s) => z * s);
  return (
    <motion.div className="absolute top-1/2 left-1/2 h-[360px] w-[270px] sm:h-[400px] sm:w-[300px]" style={{ x: tx, y: ty, z: tz, rotateZ: rot }}>
      {children}
    </motion.div>
  );
}
