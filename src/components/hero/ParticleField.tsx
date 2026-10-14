"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
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

const fragmentShader = /* glsl */ `
  uniform vec3 uViolet;
  uniform vec3 uGreen;
  varying float vHeight;
  varying float vGlow;
  varying float vMix;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, r);
    vec3 color = mix(uViolet, uGreen, vMix);
    color += vGlow * 0.9;
    alpha *= 0.35 + clamp(vHeight * 0.4 + 0.3, 0.0, 0.5) + vGlow;
    gl_FragColor = vec4(color, alpha);
  }
`;

function Waves({ animate }: { animate: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { camera, gl } = useThree();
  const target = useMemo(() => new THREE.Vector2(0, 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  const geometry = useMemo(() => {
    const cols = 140;
    const rows = 70;
    const spacing = 0.32;
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
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseStrength: { value: 0 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) },
      uViolet: { value: new THREE.Color("#a259ff") },
      uGreen: { value: new THREE.Color("#3dff9a") },
    }),
    [gl],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    if (animate) m.uniforms.uTime.value += delta;

    // Proietta il puntatore sul piano delle particelle per sapere dove "sollevarle".
    raycaster.setFromCamera(state.pointer, camera);
    const hasHit = raycaster.ray.intersectPlane(plane, hit);
    if (hasHit) target.set(hit.x, hit.z);
    m.uniforms.uMouse.value.lerp(target, 0.08);
    const strength = hasHit && state.pointer.lengthSq() > 0 ? 1 : 0;
    m.uniforms.uMouseStrength.value += (strength - m.uniforms.uMouseStrength.value) * 0.05;

    // Leggera parallasse della camera che segue il mouse.
    camera.position.x += (state.pointer.x * 1.5 - camera.position.x) * 0.03;
    camera.lookAt(0, 0, 0);
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

type ParticleFieldProps = {
  /** Elemento che riceve gli eventi del puntatore (il canvas sta sotto al testo). */
  eventSource: React.RefObject<HTMLElement | null>;
};

/** Onde di particelle neon che si sollevano sotto al cursore. */
export default function ParticleField({ eventSource }: ParticleFieldProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Fuori dallo schermo il canvas smette di disegnare: niente batteria sprecata.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="absolute inset-0" aria-hidden>
      <Canvas
        eventSource={eventSource as React.RefObject<HTMLElement>}
        eventPrefix="client"
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 5.5, 12], fov: 55 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <Waves animate={!reducedMotion} />
      </Canvas>
    </div>
  );
}
