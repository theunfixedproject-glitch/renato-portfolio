"use client";

import dynamic from "next/dynamic";

/** La scena 3D si carica solo nel browser, dopo il resto della pagina. */
export const BackgroundScene = dynamic(() => import("./Scene3D"), { ssr: false });
