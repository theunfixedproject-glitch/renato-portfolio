"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Scena 3D dietro a tutto il sito. Scorrendo la pagina la telecamera scende:
 * in cima le onde di particelle dell'hero, poi una nebbia di particelle che si
 * scosta dal cursore (o dal dito) e forme geometriche che fluttuano ai lati.
 */

/** Quanto scende la telecamera dall'inizio alla fine della pagina, in unità della scena. */
const DEPTH = 80;
const VIOLET = new THREE.Color("#a259ff");
const GREEN = new THREE.Color("#3dff9a");

type Shared = {
  /** Puntatore in coordinate normalizzate (-1..1), aggiornato anche col touch. */
  pointer: THREE.Vector2;
  /** Avanzamento dello scroll 0..1, già ammorbidito. */
  scroll: { target: number; current: number };
  /** Punto del mondo sotto al puntatore, sul piano z = 0. */
  mouseWorld: THREE.Vector3;
  /** 0..1: quanto il puntatore è "attivo" (si spegne se resta fermo). */
  activity: { value: number; last: number };
  animate: boolean;
};

/* ------------------------------------------------------------------ */
/* Onde dell'hero                                                       */
/* ------------------------------------------------------------------ */

const wavesVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform float uPixelRatio;
  varying float vHeight;
  varying float vGlow;
  varying float vMix;

  void main() {
    vec3 p = position;
    float wave = sin(p.x * 0.35 + uTime * 0.6) * 0.45
               + cos(p.z * 0.45 + uTime * 0.45) * 0.35
               + sin((p.x + p.z) * 0.18 + uTime * 0.3) * 0.5;
    float d = distance(p.xz, uMouse);
    float bump = exp(-d * d * 0.18) * uMouseStrength;
    p.y += wave + bump * 2.4;
    vHeight = wave;
    vGlow = bump;
    vMix = smoothstep(-14.0, 14.0, p.x + sin(uTime * 0.2) * 4.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.2 + bump * 4.0) * uPixelRatio * (14.0 / -mv.z);
  }
`;

const wavesFragment = /* glsl */ `
  uniform vec3 uViolet;
  uniform vec3 uGreen;
  varying float vHeight;
  varying float vGlow;
  varying float vMix;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, r);
    vec3 color = mix(uViolet, uGreen, vMix) + vGlow * 0.9;
    alpha *= 0.35 + clamp(vHeight * 0.4 + 0.3, 0.0, 0.5) + vGlow;
    gl_FragColor = vec4(color, alpha);
  }
`;

function Waves({ shared, cols, rows }: { shared: Shared; cols: number; rows: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();
  const target = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  const geometry = useMemo(() => {
    const spacing = 0.32 * (140 / cols);
    const positions = new Float32Array(cols * rows * 3);
    let i = 0;
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        positions[i++] = (x - cols / 2) * spacing;
        positions[i++] = 0;
        positions[i++] = (z - rows / 2) * spacing;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [cols, rows]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uMouseStrength: { value: 0 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) },
      uViolet: { value: VIOLET },
      uGreen: { value: GREEN },
    }),
    [gl],
  );

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    if (shared.animate) m.uniforms.uTime.value += delta;
    // Le onde stanno a y = 0: il punto sotto al cursore va cercato su quel piano.
    const ray = state.raycaster;
    ray.setFromCamera(shared.pointer, state.camera);
    const ok = ray.ray.intersectPlane(plane, hit);
    if (ok) target.set(hit.x, hit.z);
    m.uniforms.uMouse.value.lerp(target, 0.08);
    const strength = ok ? shared.activity.value : 0;
    m.uniforms.uMouseStrength.value += (strength - m.uniforms.uMouseStrength.value) * 0.05;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={wavesVertex}
        fragmentShader={wavesFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Nebbia di particelle che si scosta dal cursore                       */
/* ------------------------------------------------------------------ */

const dustVertex = /* glsl */ `
  attribute vec3 aRand;
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  uniform float uPixelRatio;
  varying float vMix;
  varying float vAlpha;
  varying float vGlow;

  void main() {
    vec3 p = position;
    float phase = aRand.y * 6.2831;
    p.x += sin(uTime * 0.25 + phase) * 0.6;
    p.y += cos(uTime * 0.2 + phase * 1.3) * 0.6;
    p.z += sin(uTime * 0.15 + phase * 0.7) * 0.4;

    // Spinta lontano dal cursore, più forte vicino al piano della telecamera.
    vec2 d = p.xy - uMouse.xy;
    float dist = length(d);
    float depthFade = smoothstep(-26.0, 0.0, p.z);
    float force = smoothstep(5.5, 0.0, dist) * uMouseStrength * depthFade;
    p.xy += normalize(d + 0.0001) * force * 2.2;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.4 + aRand.x * 3.2) * (1.0 + force * 1.5) * uPixelRatio * (18.0 / -mv.z);

    vMix = aRand.z;
    vGlow = force;
    vAlpha = 0.35 + 0.45 * (0.5 + 0.5 * sin(uTime * (0.6 + aRand.x) + phase));
  }
`;

const dustFragment = /* glsl */ `
  uniform vec3 uViolet;
  uniform vec3 uGreen;
  varying float vMix;
  varying float vAlpha;
  varying float vGlow;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float core = smoothstep(0.5, 0.0, r);
    vec3 color = mix(uViolet, uGreen, step(0.62, vMix)) + vGlow * 0.6;
    gl_FragColor = vec4(color, core * core * (vAlpha + vGlow));
  }
`;

function Dust({ shared, count }: { shared: Shared; count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();
  const smooth = useMemo(() => new THREE.Vector3(), []);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const rand = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribuite su tutta la discesa della telecamera, più fitte ai lati che al centro.
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = Math.random() < 0.35 ? (Math.random() - 0.5) * 18 : side * (6 + Math.random() * 16);
      positions[i * 3] = x;
      positions[i * 3 + 1] = 10 - Math.random() * (DEPTH + 25);
      positions[i * 3 + 2] = -Math.random() * 26 + 3;
      rand[i * 3] = Math.random();
      rand[i * 3 + 1] = Math.random();
      rand[i * 3 + 2] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 3));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3() },
      uMouseStrength: { value: 0 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) },
      uViolet: { value: VIOLET },
      uGreen: { value: GREEN },
    }),
    [gl],
  );

  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;
    if (shared.animate) m.uniforms.uTime.value += delta;
    smooth.lerp(shared.mouseWorld, 0.12);
    m.uniforms.uMouse.value.copy(smooth);
    m.uniforms.uMouseStrength.value += (shared.activity.value - m.uniforms.uMouseStrength.value) * 0.08;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Forme geometriche fluttuanti                                          */
/* ------------------------------------------------------------------ */

type ShapeKind = "ico" | "knot" | "octa" | "torus" | "dodeca";

const shapes: { kind: ShapeKind; pos: [number, number, number]; scale: number; color: THREE.Color; speed: number }[] = [
  { kind: "torus", pos: [14, 9, -20], scale: 3, color: VIOLET, speed: 0.1 },
  { kind: "ico", pos: [11, -11, -10], scale: 2.2, color: GREEN, speed: 0.18 },
  { kind: "knot", pos: [-11, -24, -10], scale: 1.6, color: VIOLET, speed: 0.15 },
  { kind: "octa", pos: [11, -37, -9], scale: 2, color: VIOLET, speed: 0.2 },
  { kind: "dodeca", pos: [-11, -50, -10], scale: 2, color: GREEN, speed: 0.16 },
  { kind: "ico", pos: [11, -63, -10], scale: 2.4, color: VIOLET, speed: 0.14 },
  { kind: "knot", pos: [-10, -77, -11], scale: 1.8, color: GREEN, speed: 0.12 },
];

function Geometry({ kind }: { kind: ShapeKind }) {
  switch (kind) {
    case "ico":
      return <icosahedronGeometry args={[1, 1]} />;
    case "knot":
      return <torusKnotGeometry args={[1, 0.3, 96, 10]} />;
    case "octa":
      return <octahedronGeometry args={[1, 0]} />;
    case "dodeca":
      return <dodecahedronGeometry args={[1, 0]} />;
    case "torus":
      return <torusGeometry args={[1, 0.28, 12, 48]} />;
  }
}

function FloatingShape({ shared, index }: { shared: Shared; index: number }) {
  const s = shapes[index];
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (shared.animate) {
      g.rotation.x += delta * s.speed;
      g.rotation.y += delta * s.speed * 1.3;
      g.position.y = s.pos[1] + Math.sin(t * 0.6 + index) * 0.5;
    }
    // Le forme si girano leggermente verso il puntatore.
    g.rotation.z += (shared.pointer.x * 0.5 - g.rotation.z) * 0.03;
    g.position.x += (s.pos[0] + shared.pointer.x * 0.8 - g.position.x) * 0.04;
    if (inner.current) inner.current.rotation.y -= delta * s.speed * 2;
  });

  return (
    <group ref={group} position={s.pos} scale={s.scale}>
      <mesh>
        <Geometry kind={s.kind} />
        <meshBasicMaterial color={s.color} wireframe transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={inner} scale={0.55}>
        <Geometry kind={s.kind} />
        <meshBasicMaterial color={s.color} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <points scale={1.001}>
        <Geometry kind={s.kind} />
        <pointsMaterial color={s.color} size={0.06} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Telecamera che segue lo scroll e il puntatore                          */
/* ------------------------------------------------------------------ */

function CameraRig({ shared }: { shared: Shared }) {
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const { camera, raycaster } = state;
    shared.scroll.current += (shared.scroll.target - shared.scroll.current) * Math.min(1, delta * 4);
    const y = -shared.scroll.current * DEPTH;
    // In cima guarda in giù sulle onde, poi si raddrizza e scende nella nebbia.
    const tilt = Math.min(1, shared.scroll.current * 12);
    camera.position.x += (shared.pointer.x * 1.4 - camera.position.x) * 0.04;
    camera.position.y = y + 5.5 - tilt * 3.5;
    camera.position.z = 12;
    // In cima guarda le onde (y = 0), poi guarda dritto davanti a sé.
    camera.lookAt(camera.position.x * 0.3, camera.position.y * tilt, 0);

    // Il cursore si spegne da solo dopo qualche secondo di immobilità.
    const idle = performance.now() - shared.activity.last;
    const want = idle < 2500 ? 1 : 0;
    shared.activity.value += (want - shared.activity.value) * 0.04;

    raycaster.setFromCamera(shared.pointer, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) shared.mouseWorld.copy(hit);
  });
  return null;
}

/* ------------------------------------------------------------------ */

export default function Scene3D() {
  const [running, setRunning] = useState(true);
  const [small, setSmall] = useState(false);

  const shared = useMemo<Shared>(
    () => ({
      pointer: new THREE.Vector2(0, 0),
      scroll: { target: 0, current: 0 },
      mouseWorld: new THREE.Vector3(0, 0, 0),
      activity: { value: 0, last: 0 },
      animate: true,
    }),
    [],
  );

  useEffect(() => {
    setSmall(window.matchMedia("(max-width: 768px)").matches);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    shared.animate = !reduce.matches;

    const onPointer = (e: PointerEvent) => {
      shared.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      shared.activity.last = performance.now();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      shared.scroll.target = max > 0 ? window.scrollY / max : 0;
    };
    const onVisibility = () => setRunning(!document.hidden);

    onScroll();
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [shared]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        frameloop={running ? "always" : "never"}
        dpr={[1, small ? 1.25 : 1.5]}
        camera={{ position: [0, 5.5, 12], fov: 55, near: 0.1, far: 120 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <CameraRig shared={shared} />
        <Waves shared={shared} cols={small ? 90 : 140} rows={small ? 50 : 70} />
        <Dust shared={shared} count={small ? 1100 : 2600} />
        {shapes.map((_, i) => (
          <FloatingShape key={i} shared={shared} index={i} />
        ))}
      </Canvas>
    </div>
  );
}
