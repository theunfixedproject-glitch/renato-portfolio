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

const scenes: Record<SceneryVariant, (p: { id: string }) => React.ReactElement> = {
  vineyard: ({ id }) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b3a6b" />
          <stop offset="0.45" stopColor="#d9776a" />
          <stop offset="0.75" stopColor="#f6b77c" />
        </linearGradient>
        <linearGradient id={`${id}hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b7f3a" />
          <stop offset="1" stopColor="#2f3d1f" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <circle cx="1120" cy="430" r="90" fill="#ffd9a0" opacity="0.9" />
      {/* Dolomiti */}
      <path d="M0 520 L140 380 L210 430 L330 250 L420 360 L500 300 L620 450 L760 330 L860 420 L980 270 L1080 390 L1200 320 L1330 440 L1460 300 L1600 420 L1600 900 L0 900Z" fill="#6d5a86" />
      <path d="M330 250 L370 300 L345 300 L320 340 L300 290Z M980 270 L1020 320 L990 325 L965 300Z M1460 300 L1500 350 L1470 345Z" fill="#efe1f0" opacity="0.7" />
      <path d="M0 600 C 300 520, 520 560, 800 520 S 1300 480, 1600 540 L1600 900 L0 900Z" fill="#8c6f73" opacity="0.8" />
      {/* Colline coi filari */}
      <path d="M0 660 C 400 580, 900 640, 1600 600 L1600 900 L0 900Z" fill={`url(#${id}hill)`} />
      {Array.from({ length: 11 }, (_, i) => (
        <path
          key={i}
          d={`M${-100 + i * 40} ${700 + i * 22} C 400 ${640 + i * 26}, 1000 ${690 + i * 22}, 1700 ${650 + i * 24}`}
          stroke="#a3b55a"
          strokeWidth="5"
          strokeDasharray="2 14"
          strokeLinecap="round"
          fill="none"
          opacity={0.55 + i * 0.03}
        />
      ))}
      {/* Paesino col campanile */}
      <g fill="#3d2f2a">
        <rect x="250" y="560" width="70" height="50" />
        <path d="M245 560 L285 532 L325 560Z" />
        <rect x="330" y="500" width="22" height="110" />
        <path d="M326 500 L341 470 L356 500Z" />
        <rect x="360" y="572" width="60" height="38" />
        <path d="M356 572 L390 550 L424 572Z" />
      </g>
    </>
  ),

  city: ({ id }) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d6df" />
          <stop offset="0.7" stopColor="#f3e3c3" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <path d="M0 470 L180 330 L300 400 L460 280 L620 380 L780 300 L960 400 L1120 290 L1300 380 L1460 320 L1600 380 L1600 900 L0 900Z" fill="#9aa9a0" />
      <path d="M0 540 L220 430 L420 500 L640 420 L900 500 L1150 430 L1400 490 L1600 450 L1600 900 L0 900Z" fill="#7e8f86" />
      {/* Tetti del centro storico */}
      <g fill="#b5654b">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <path key={i} d={`M${i * 140 - 20} 650 L${i * 140 + 50} ${600 - (i % 3) * 18} L${i * 140 + 120} 650Z`} />
        ))}
      </g>
      <g fill="#e6cfa7">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <rect key={i} x={i * 140 - 10} y="648" width="120" height="260" />
        ))}
      </g>
      <g fill="#8a5a44" opacity="0.6">
        {Array.from({ length: 36 }, (_, i) => (
          <rect key={i} x={(i % 12) * 140 + 10 + (i % 2) * 50} y={690 + Math.floor(i / 12) * 60} width="22" height="32" rx="11" />
        ))}
      </g>
      {/* Duomo con cupola e campanile */}
      <g fill="#d8c3a0" stroke="#a88b63" strokeWidth="3">
        <rect x="640" y="520" width="320" height="200" />
        <path d="M720 520 C 720 430, 880 430, 880 520Z" />
        <rect x="785" y="410" width="30" height="40" />
        <rect x="1000" y="420" width="70" height="300" />
        <path d="M995 420 L1035 360 L1075 420Z" />
      </g>
      <g fill="#a88b63">
        <path d="M690 720 L690 640 C 690 610, 740 610, 740 640 L740 720Z" />
        <path d="M775 720 L775 620 C 775 580, 825 580, 825 620 L825 720Z" />
        <path d="M860 720 L860 640 C 860 610, 910 610, 910 640 L910 720Z" />
        <circle cx="800" cy="560" r="22" />
        <rect x="1022" y="470" width="26" height="40" rx="13" />
      </g>
    </>
  ),

  garden: ({ id }) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe0e8" />
          <stop offset="1" stopColor="#f1f5e6" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <path d="M0 430 L220 300 L380 380 L560 260 L760 360 L980 250 L1200 370 L1400 290 L1600 360 L1600 900 L0 900Z" fill="#b8c9bf" />
      {/* Casa */}
      <g>
        <rect x="900" y="420" width="420" height="300" fill="#f4e7d3" />
        <path d="M880 430 L1110 300 L1340 430Z" fill="#c0694f" />
        <rect x="960" y="480" width="70" height="90" fill="#7f9c8b" />
        <rect x="1080" y="480" width="70" height="90" fill="#7f9c8b" />
        <rect x="1200" y="480" width="70" height="90" fill="#7f9c8b" />
        <rect x="1085" y="600" width="60" height="120" fill="#8a5a44" />
      </g>
      {/* Pergolato */}
      <g stroke="#7a5b3d" strokeWidth="12" fill="none">
        <path d="M300 720 L300 470 M640 720 L640 470 M260 470 L680 470" />
      </g>
      <path d="M260 470 C 320 420, 400 500, 470 450 S 600 430, 680 470" stroke="#5f8f4e" strokeWidth="30" fill="none" strokeLinecap="round" />
      {/* Prato e siepi */}
      <path d="M0 700 C 400 650, 1100 690, 1600 660 L1600 900 L0 900Z" fill="#7fa65a" />
      <path d="M0 760 C 500 720, 1100 760, 1600 730 L1600 900 L0 900Z" fill="#5f8f4e" />
      {[120, 200, 1450, 1520].map((x, i) => (
        <g key={x}>
          <rect x={x - 8} y={560 + (i % 2) * 20} width="16" height="160" fill="#6b4b33" />
          <circle cx={x} cy={540 + (i % 2) * 20} r={80 - (i % 2) * 14} fill="#4f7d43" />
        </g>
      ))}
      {Array.from({ length: 40 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 97) % 1600}
          cy={780 + ((i * 53) % 90)}
          r="9"
          fill={["#f2a7b8", "#ffffff", "#f6d26b", "#c79bff"][i % 4]}
        />
      ))}
    </>
  ),
};
