"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Torus, Stars } from "@react-three/drei";
import * as THREE from "three";

function CoreOrb() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.15;
    ref.current.rotation.y = state.clock.elapsedTime * 0.22;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1.1, 64, 64]} scale={1.15}>
        <MeshDistortMaterial
          color="#00f5d4"
          attach="material"
          distort={0.35}
          speed={2}
          roughness={0.2}
          metalness={0.85}
          emissive="#00f5d4"
          emissiveIntensity={0.25}
        />
      </Sphere>
    </Float>
  );
}

function OrbitRings() {
  const g1 = React.useRef<THREE.Group>(null);
  const g2 = React.useRef<THREE.Group>(null);

  useFrame((state) => {
    if (g1.current) g1.current.rotation.z = state.clock.elapsedTime * 0.35;
    if (g2.current) g2.current.rotation.x = state.clock.elapsedTime * 0.28;
  });

  return (
    <>
      <group ref={g1}>
        <Torus args={[2.2, 0.02, 16, 100]} rotation={[Math.PI / 2.2, 0, 0]}>
          <meshBasicMaterial color="#b4ff39" transparent opacity={0.55} />
        </Torus>
        <Torus args={[2.6, 0.015, 16, 100]} rotation={[0.4, Math.PI / 3, 0]}>
          <meshBasicMaterial color="#f4c95d" transparent opacity={0.4} />
        </Torus>
      </group>
      <group ref={g2}>
        <Torus args={[3.1, 0.012, 16, 100]} rotation={[Math.PI / 4, 0.2, 0.5]}>
          <meshBasicMaterial color="#785aff" transparent opacity={0.35} />
        </Torus>
      </group>
    </>
  );
}

function ParticleField() {
  const count = 120;
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const ref = React.useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#00f5d4" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#00f5d4" />
      <pointLight position={[-8, -6, 4]} intensity={0.6} color="#f4c95d" />
      <Stars radius={80} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <CoreOrb />
      <OrbitRings />
      <ParticleField />
    </>
  );
}

export function HeroScene({ className }: { className?: string }) {
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [webglFailed, setWebglFailed] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (reducedMotion || webglFailed) {
    return (
      <div className={className}>
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-black/20">
          <div className="absolute inset-0">
            <div className="aurora-blob aurora-1 !left-[-10%] !top-[-20%] !h-[60%] !w-[50%]" />
            <div className="aurora-blob aurora-2 !right-[-10%] !top-[-10%] !h-[50%] !w-[45%]" />
          </div>
          <div className="relative flex h-full min-h-[280px] items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl font-semibold tracking-tight text-gradient">SYMBIO</div>
              <p className="mt-2 text-sm text-fg-muted">Immersive UGC platform</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-glow-lg">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          onError={() => setWebglFailed(true)}
        >
          <SceneContent />
        </Canvas>
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
        <div className="pointer-events-none absolute inset-0 noise-overlay rounded-3xl" />
      </div>
    </div>
  );
}
