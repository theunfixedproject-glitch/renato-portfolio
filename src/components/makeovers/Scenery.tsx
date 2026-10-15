"use client";

import { useId } from "react";

export type SceneryVariant = "vineyard" | "city" | "garden";

type SceneryProps = {
  variant: SceneryVariant;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Illustrazioni al posto delle foto nei mockup: paesaggi di fantasia,
 * così i siti d'esempio non usano immagini di strutture reali.
 */
export function Scenery({ variant, className, style }: SceneryProps) {
  const uid = useId().replace(/:/g, "");
  const Scene = scenes[variant];
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={className} style={style} aria-hidden>
      <Scene id={uid} />
    </svg>
  );
}

/** Finestre accese sparse in modo stabile (stessa posizione a ogni render). */
const lit = (i: number) => (i * 37) % 5 < 2;

const scenes: Record<SceneryVariant, (p: { id: string }) => React.ReactElement> = {
  /* Tramonto dorato sui vigneti, Dolomiti sullo sfondo */
  vineyard: ({ id }) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2350" />
          <stop offset="0.35" stopColor="#7b4a78" />
          <stop offset="0.6" stopColor="#e07f68" />
          <stop offset="0.78" stopColor="#ffc27e" />
        </linearGradient>
        <radialGradient id={`${id}sun`} cx="0.7" cy="0.52" r="0.45">
          <stop offset="0" stopColor="#fff1c4" stopOpacity="1" />
          <stop offset="0.12" stopColor="#ffd38a" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#ff9f6e" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ff9f6e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}mtnFar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6b9c" />
          <stop offset="1" stopColor="#c48a8a" />
        </linearGradient>
        <linearGradient id={`${id}mtn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b4470" />
          <stop offset="1" stopColor="#8f6377" />
        </linearGradient>
        <linearGradient id={`${id}haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc9a0" stopOpacity="0" />
          <stop offset="1" stopColor="#ffc9a0" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${id}hill1`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a8f4a" />
          <stop offset="1" stopColor="#5a5a2a" />
        </linearGradient>
        <linearGradient id={`${id}hill2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f7a34" />
          <stop offset="1" stopColor="#2e3818" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <rect width="1600" height="900" fill={`url(#${id}sun)`} />
      <circle cx="1120" cy="468" r="58" fill="#fff3d1" />
      {/* uccelli */}
      <g stroke="#3a2a40" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6">
        <path d="M420 220 q12 -10 24 0 q12 -10 24 0" />
        <path d="M480 250 q9 -8 18 0 q9 -8 18 0" />
        <path d="M380 270 q8 -7 16 0 q8 -7 16 0" />
      </g>
      {/* Dolomiti lontane */}
      <path d="M0 470 L120 400 L200 430 L300 330 L380 380 L460 300 L560 410 L700 350 L820 430 L940 340 L1040 400 L1160 360 L1280 420 L1420 330 L1600 410 L1600 900 L0 900Z" fill={`url(#${id}mtnFar)`} opacity="0.75" />
      {/* Dolomiti vicine, con le pareti in luce */}
      <path d="M0 540 L140 420 L210 460 L330 280 L420 390 L500 330 L620 470 L760 360 L860 440 L980 300 L1080 410 L1200 350 L1330 460 L1460 320 L1600 440 L1600 900 L0 900Z" fill={`url(#${id}mtn)`} />
      <path d="M330 280 L420 390 L380 395 L340 330Z M980 300 L1080 410 L1030 410 L990 350Z M1460 320 L1600 440 L1540 440 L1470 370Z" fill="#e8a58a" opacity="0.55" />
      <path d="M330 280 L352 312 L338 318 L322 300Z M980 300 L1004 332 L988 338Z M1460 320 L1484 350 L1468 352Z" fill="#fff4ec" opacity="0.9" />
      <rect y="380" width="1600" height="260" fill={`url(#${id}haze)`} />
      {/* Colline coi filari in prospettiva */}
      <path d="M0 610 C 300 560, 620 590, 900 570 S 1400 540, 1600 580 L1600 900 L0 900Z" fill={`url(#${id}hill1)`} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={`a${i}`} d={`M${-60 + i * 30} ${640 + i * 9} C 400 ${595 + i * 9}, 900 ${615 + i * 9}, 1660 ${590 + i * 10}`} stroke="#c9c46a" strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" fill="none" opacity="0.5" />
      ))}
      <path d="M0 700 C 420 640, 900 690, 1600 650 L1600 900 L0 900Z" fill={`url(#${id}hill2)`} />
      {Array.from({ length: 10 }, (_, i) => (
        <path
          key={`b${i}`}
          d={`M${-80 + i * 20} ${720 + i * 20} C 420 ${672 + i * 21}, 1000 ${714 + i * 20}, 1700 ${676 + i * 22}`}
          stroke="#a9b65a"
          strokeWidth={4 + i * 0.9}
          strokeDasharray={`${2 + i * 0.4} ${12 + i * 2}`}
          strokeLinecap="round"
          fill="none"
          opacity={0.45 + i * 0.05}
        />
      ))}
      {/* Paesino col campanile e finestre accese */}
      <g>
        <g fill="#3a2a2a">
          <rect x="240" y="580" width="80" height="56" />
          <path d="M234 580 L280 548 L326 580Z" />
          <rect x="332" y="512" width="24" height="124" />
          <path d="M328 512 L344 476 L360 512Z" />
          <rect x="366" y="594" width="66" height="42" />
          <path d="M360 594 L399 568 L438 594Z" />
          <rect x="190" y="602" width="44" height="34" />
        </g>
        <g fill="#ffd27a">
          <rect x="254" y="596" width="10" height="12" />
          <rect x="294" y="596" width="10" height="12" />
          <rect x="339" y="530" width="10" height="14" />
          <rect x="380" y="606" width="9" height="10" />
          <rect x="410" y="606" width="9" height="10" />
        </g>
      </g>
      {/* Vite in primo piano */}
      <g opacity="0.95">
        <path d="M1380 900 C 1390 820, 1360 770, 1400 720" stroke="#3b2a1d" strokeWidth="14" fill="none" strokeLinecap="round" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse key={i} cx={1360 + (i % 3) * 50} cy={700 + Math.floor(i / 3) * 50} rx="44" ry="30" fill={i % 2 ? "#3f5a22" : "#4f6d2a"} transform={`rotate(${i * 25 - 40} ${1360 + (i % 3) * 50} ${700 + Math.floor(i / 3) * 50})`} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <circle key={i} cx={1410 + (i % 3) * 14} cy={770 + Math.floor(i / 3) * 14} r="9" fill="#5b2a4a" />
        ))}
      </g>
    </>
  ),

  /* Centro storico all'ora blu, Duomo illuminato */
  city: ({ id }) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2b4a" />
          <stop offset="0.45" stopColor="#5d6a96" />
          <stop offset="0.75" stopColor="#e8a98f" />
          <stop offset="1" stopColor="#f6d4a8" />
        </linearGradient>
        <linearGradient id={`${id}mtn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d4766" />
          <stop offset="1" stopColor="#6b6f86" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.7" r="0.5">
          <stop offset="0" stopColor="#ffd08a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd08a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}stone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d9b5" />
          <stop offset="1" stopColor="#c9a57a" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={(i * 211) % 1600} cy={(i * 97) % 260} r={i % 4 === 0 ? 2.4 : 1.4} fill="#fff" opacity={0.35 + (i % 3) * 0.2} />
      ))}
      <circle cx="1320" cy="150" r="34" fill="#fff6dc" opacity="0.9" />
      <path d="M0 470 L180 350 L300 410 L460 290 L620 390 L780 310 L960 410 L1120 300 L1300 390 L1460 330 L1600 380 L1600 900 L0 900Z" fill={`url(#${id}mtn)`} />
      <path d="M460 290 L520 340 L490 342 Z M1120 300 L1170 345 L1140 345Z" fill="#dfe3f0" opacity="0.6" />
      <rect width="1600" height="900" fill={`url(#${id}glow)`} />
      {/* Case del centro, con finestre accese */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = i * 140 - 20;
        const h = 600 - (i % 3) * 22;
        return (
          <g key={i}>
            <rect x={x + 10} y={h + 40} width="120" height={300} fill={["#d9b48a", "#c99c78", "#e2c39b"][i % 3]} />
            <path d={`M${x} ${h + 44} L${x + 70} ${h} L${x + 140} ${h + 44}Z`} fill="#8e4a3a" />
            {[0, 1].map((r) =>
              [0, 1, 2].map((c) => (
                <rect
                  key={`${r}${c}`}
                  x={x + 26 + c * 36}
                  y={h + 70 + r * 60}
                  width="18"
                  height="30"
                  rx="9"
                  fill={lit(i * 6 + r * 3 + c) ? "#ffcf6e" : "#5c4436"}
                  opacity={lit(i * 6 + r * 3 + c) ? 1 : 0.7}
                />
              )),
            )}
          </g>
        );
      })}
      {/* Duomo */}
      <g>
        <rect x="620" y="500" width="360" height="260" fill={`url(#${id}stone)`} />
        <path d="M700 500 C 700 400, 900 400, 900 500Z" fill="#e7cfa6" />
        <path d="M700 500 C 700 400, 900 400, 900 500" fill="none" stroke="#b58e62" strokeWidth="4" />
        <rect x="786" y="388" width="28" height="36" fill="#e7cfa6" />
        <path d="M782 388 L800 360 L818 388Z" fill="#b58e62" />
        <circle cx="800" cy="560" r="34" fill="#ffd27e" stroke="#b58e62" strokeWidth="6" />
        <g stroke="#b58e62" strokeWidth="2">
          <path d="M800 526 V594 M766 560 H834 M776 536 L824 584 M824 536 L776 584" />
        </g>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${648 + i * 66} 760 V680 C ${648 + i * 66} 650, ${692 + i * 66} 650, ${692 + i * 66} 680 V760Z`} fill={i === 2 ? "#ffc65c" : "#8a6a4a"} opacity={i === 2 ? 0.9 : 0.75} />
        ))}
        {/* Campanile */}
        <rect x="1010" y="400" width="74" height="360" fill={`url(#${id}stone)`} />
        <path d="M1004 400 L1047 330 L1090 400Z" fill="#8e4a3a" />
        <rect x="1030" y="440" width="34" height="56" rx="17" fill="#ffd27e" />
        <rect x="1036" y="540" width="22" height="40" rx="11" fill="#8a6a4a" />
      </g>
      {/* Lampioni */}
      {[120, 520, 1180, 1480].map((x) => (
        <g key={x}>
          <rect x={x} y="720" width="6" height="140" fill="#2a2a35" />
          <circle cx={x + 3} cy="716" r="10" fill="#ffe2a0" />
          <circle cx={x + 3} cy="716" r="46" fill="#ffd27e" opacity="0.18" />
        </g>
      ))}
      <rect y="840" width="1600" height="60" fill="#3a3340" />
    </>
  ),

  /* Mattino nel giardino: pergolato fiorito, tavolo per la colazione */
  garden: ({ id }) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd0e0" />
          <stop offset="0.6" stopColor="#e8f2df" />
          <stop offset="1" stopColor="#fbf3dc" />
        </linearGradient>
        <radialGradient id={`${id}sun`} cx="0.18" cy="0.1" r="0.6">
          <stop offset="0" stopColor="#fffbe6" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fffbe6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}lawn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb865" />
          <stop offset="1" stopColor="#4f7d3f" />
        </linearGradient>
        <linearGradient id={`${id}ray`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffbe6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fffbe6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <path d="M0 440 L220 320 L380 390 L560 280 L760 370 L980 270 L1200 380 L1400 300 L1600 370 L1600 900 L0 900Z" fill="#a9c2c4" opacity="0.8" />
      <path d="M0 500 L260 420 L520 470 L800 400 L1100 460 L1400 410 L1600 450 L1600 900 L0 900Z" fill="#9db7a6" />
      {/* Casa con persiane */}
      <g>
        <rect x="880" y="400" width="460" height="330" fill="#f6ead6" />
        <path d="M860 412 L1110 280 L1360 412Z" fill="#c4674d" />
        <path d="M860 412 L1110 280 L1110 296 L880 416Z" fill="#a8533d" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={940 + i * 130} y="460" width="70" height="100" fill="#fff4d6" />
            <rect x={924 + i * 130} y="460" width="16" height="100" fill="#6f9a80" />
            <rect x={1010 + i * 130} y="460" width="16" height="100" fill="#6f9a80" />
          </g>
        ))}
        <rect x="1080" y="600" width="64" height="130" rx="32" fill="#7a5238" />
        {/* glicine sulla facciata */}
        {Array.from({ length: 14 }, (_, i) => (
          <ellipse key={i} cx={890 + i * 32} cy={410 + (i % 3) * 8} rx="12" ry="26" fill={i % 2 ? "#b79ad8" : "#9f7fcb"} opacity="0.9" />
        ))}
      </g>
      <rect width="1600" height="900" fill={`url(#${id}sun)`} />
      <path d="M200 0 L520 0 L1100 900 L700 900Z" fill={`url(#${id}ray)`} opacity="0.22" />
      {/* Prato */}
      <path d="M0 690 C 400 640, 1100 680, 1600 650 L1600 900 L0 900Z" fill={`url(#${id}lawn)`} />
      {/* Pergolato con tavolo */}
      <g>
        <g stroke="#7a5b3d" strokeWidth="14" strokeLinecap="round">
          <path d="M260 760 V470 M660 760 V470 M220 470 H700 M240 500 H680" />
        </g>
        <path d="M220 468 C 300 410, 380 500, 460 440 S 620 420, 700 468" stroke="#5f8f4e" strokeWidth="34" fill="none" strokeLinecap="round" />
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx={250 + i * 40} cy={500 + (i % 3) * 14} rx="11" ry="30" fill={i % 2 ? "#b79ad8" : "#9f7fcb"} />
        ))}
        <rect x="380" y="660" width="170" height="14" rx="7" fill="#e8dcc7" />
        <path d="M400 674 V760 M530 674 V760" stroke="#9c8a73" strokeWidth="8" />
        <circle cx="430" cy="652" r="10" fill="#fff" />
        <circle cx="500" cy="652" r="10" fill="#fff" />
        <path d="M340 700 V760 M360 700 V760 M330 700 H372" stroke="#9c8a73" strokeWidth="7" />
        <path d="M570 700 V760 M590 700 V760 M560 700 H602" stroke="#9c8a73" strokeWidth="7" />
      </g>
      {/* Alberi */}
      {[110, 1480].map((x, i) => (
        <g key={x}>
          <rect x={x - 10} y="520" width="20" height="230" fill="#6b4b33" />
          <circle cx={x} cy="500" r="110" fill="#4f7d43" />
          <circle cx={x - 50} cy="460" r="70" fill="#5f8f4e" />
          <circle cx={x + 55} cy="470" r="64" fill={i ? "#5f8f4e" : "#6aa058"} />
        </g>
      ))}
      {/* Aiuole */}
      {Array.from({ length: 60 }, (_, i) => (
        <circle key={i} cx={(i * 83) % 1600} cy={790 + ((i * 47) % 100)} r={7 + (i % 3) * 2} fill={["#f2a7b8", "#ffffff", "#f6d26b", "#c79bff", "#ff8f6b"][i % 5]} />
      ))}
      {/* Luci sfocate */}
      {[
        [300, 200, 40],
        [520, 130, 26],
        [180, 330, 18],
      ].map(([x, y, r]) => (
        <circle key={x} cx={x} cy={y} r={r} fill="#fffbe6" opacity="0.35" />
      ))}
    </>
  ),
};
