import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Controls } from "../types";

export const BASE_TEXTURE = "textures/blue-marble.jpg";

interface GlobeProps {
  textureUrl: string; // equirectangular image
  controls: Controls;
  energy: number; // 0..1 from the current frame
  level: () => number; // live audio loudness
}

const atmosphereShader = {
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec3 vNormal;
    void main() {
      float rim = pow(0.75 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
      gl_FragColor = vec4(uColor, 1.0) * rim * uIntensity;
    }`,
};

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

/** Loads textures without suspending, so the globe keeps the previous frame until the next is ready. */
function useSmoothTexture(url: string, fallback: THREE.Texture) {
  const [tex, setTex] = useState<THREE.Texture>(() => cache.get(url) ?? fallback);
  useEffect(() => {
    let alive = true;
    const hit = cache.get(url);
    if (hit) return setTex(hit);
    loader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      cache.set(url, t);
      if (alive) setTex(t);
    });
    return () => {
      alive = false;
    };
  }, [url]);
  return tex;
}

function Planet({ textureUrl, controls, energy, level }: GlobeProps) {
  const base = useLoader(THREE.TextureLoader, BASE_TEXTURE);
  base.colorSpace = THREE.SRGBColorSpace;
  const texture = useSmoothTexture(textureUrl, base);
  const earth = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#4da6ff") }, uIntensity: { value: 1 } }), []);
  const cool = useMemo(() => new THREE.Color("#4da6ff"), []);
  const warm = useMemo(() => new THREE.Color("#ff6a3d"), []);

  useFrame((_, dt) => {
    const loud = level();
    // Sound -> planet: tempo drives rotation, loudness makes the atmosphere pulse,
    // warmth tints the planet and its atmosphere (cool blue <-> overheated orange).
    if (earth.current) earth.current.rotation.y += dt * (controls.tempo / 600);
    const t = Math.max(0, controls.warmth);
    uniforms.uColor.value.copy(cool).lerp(warm, t);
    uniforms.uIntensity.value = 0.8 + loud * 2.5 + energy * 0.5;
    if (material.current) {
      material.current.color.setRGB(1, 1 - Math.max(0, controls.warmth) * 0.35, 1 - Math.max(0, controls.warmth) * 0.5);
      material.current.emissiveIntensity = 0.15 + loud * 0.6;
    }
  });

  return (
    <group>
      <mesh ref={earth}>
        <sphereGeometry args={[2, 96, 96]} />
        <meshStandardMaterial ref={material} map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.15} roughness={0.9} />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial args={[atmosphereShader]} uniforms={uniforms} blending={THREE.AdditiveBlending} side={THREE.BackSide} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function Globe(props: GlobeProps) {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} aria-hidden="true">
      <color attach="background" args={["#02030a"]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={2.2} />
      <Stars radius={80} depth={40} count={4000} factor={3} fade speed={0.5 + props.controls.tempo / 120} />
      <Suspense fallback={null}>
        <Planet {...props} />
      </Suspense>
      <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
    </Canvas>
  );
}
