"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useLocale } from "@/components/LocaleProvider";
import { ecosystemServers } from "@/lib/ecosystem";

const DEFAULT_HERO_MEDIA = "/symbio-hero-world-radar.png";
/** Optional video/GIF override — set NEXT_PUBLIC_HERO_MEDIA=/hero-loop.webm */
const HERO_MEDIA = process.env.NEXT_PUBLIC_HERO_MEDIA || DEFAULT_HERO_MEDIA;

const NODE_POSITIONS: [number, number, number][] = [
  [-2.1, 0.4, 0.3],
  [1.8, -0.2, 0.5],
  [-0.6, -1.4, 0.2],
  [2.2, 1.1, -0.1],
];

function RadarSweep() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.85;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.05, 3.4, 64, 1, 0, Math.PI / 5]} />
      <meshBasicMaterial color="#3ef0ff" transparent opacity={0.22} side={THREE.DoubleSide} />
    </mesh>
  );
}

function RadarRings() {
  const g = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    if (g.current) g.current.rotation.z = state.clock.elapsedTime * 0.08;
  });
  return (
    <group ref={g}>
      {[1.2, 2, 2.8].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.02, r, 64]} />
          <meshBasicMaterial color="#3ef0ff" transparent opacity={0.12 + i * 0.04} />
        </mesh>
      ))}
    </group>
  );
}

function WorldNodes() {
  const group = React.useRef<THREE.Group>(null);
  const nodes = ecosystemServers.slice(0, 4);

  useFrame((state) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.12;
      mesh.scale.setScalar(pulse * (i === 0 ? 1.15 : 0.95));
    });
  });

  return (
    <group ref={group}>
      {nodes.map((server, i) => {
        const pos = NODE_POSITIONS[i] ?? [0, 0, 0];
        const colors: Record<string, string> = {
          green: "#71ff7a",
          cyan: "#3ef0ff",
          amber: "#ffb852",
          magenta: "#d24cff",
        };
        const color = colors[server.accent] ?? "#3ef0ff";
        return (
          <mesh key={server.id} position={pos}>
            <sphereGeometry args={[0.14, 24, 24]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} metalness={0.4} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function TraceLines() {
  const ref = React.useRef<THREE.LineSegments>(null);
  const geometry = React.useMemo(() => {
    const points: number[] = [];
    NODE_POSITIONS.forEach(([x, y, z]) => {
      points.push(0, 0, 0, x, y, z);
    });
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  }, []);

  useFrame((state) => {
    if (ref.current?.material) {
      const mat = ref.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#3ef0ff" transparent opacity={0.3} />
    </lineSegments>
  );
}

function CoreGlow() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.35, 32, 32]} />
      <meshStandardMaterial
        color="#3ef0ff"
        emissive="#3ef0ff"
        emissiveIntensity={1.2}
        transparent
        opacity={0.85}
        metalness={0.6}
        roughness={0.15}
      />
    </mesh>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 6]} intensity={1.4} color="#3ef0ff" />
      <pointLight position={[-5, -3, 2]} intensity={0.5} color="#d24cff" />
      <Stars radius={60} depth={40} count={1800} factor={2.5} saturation={0} fade speed={0.4} />
      <RadarRings />
      <RadarSweep />
      <TraceLines />
      <CoreGlow />
      <WorldNodes />
    </>
  );
}

function HeroMediaAsset({ className }: { className?: string }) {
  const isVideo = HERO_MEDIA?.match(/\.(webm|mp4|ogg)$/i);
  return (
    <div className={className}>
      <div className="hero-scene-frame relative h-full min-h-[280px] w-full overflow-hidden">
        {isVideo ? (
          <video
            className="hero-media-asset absolute inset-0 h-full w-full object-cover"
            src={HERO_MEDIA}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hero-media-asset absolute inset-0 h-full w-full object-cover" src={HERO_MEDIA} alt="" />
        )}
        <div className="hero-media-vignette pointer-events-none absolute inset-0" />
        <div className="hero-media-scan pointer-events-none absolute inset-0" />
        <div className="hero-media-pulse hero-media-pulse-1" />
        <div className="hero-media-pulse hero-media-pulse-2" />
        <div className="hero-media-pulse hero-media-pulse-3" />
      </div>
    </div>
  );
}

function HeroRadarFallback({
  className,
  label,
  hint,
}: {
  className?: string;
  label: string;
  hint: string;
}) {
  return (
    <div className={className}>
      <div className="hero-scene-frame hero-radar-fallback relative flex h-full min-h-[300px] w-full items-center justify-center overflow-hidden p-6">
        <div className="hero-radar-ring hero-radar-ring-1" />
        <div className="hero-radar-ring hero-radar-ring-2" />
        <div className="hero-radar-ring hero-radar-ring-3" />
        <div className="hero-radar-sweep" />
        <div className="hero-radar-core" />
        {NODE_POSITIONS.map((_, i) => (
          <span key={i} className={`hero-radar-node hero-radar-node-${i + 1}`} />
        ))}
        <div className="relative z-10 mt-auto w-full text-center">
          <div className="text-xs uppercase tracking-[0.28em] text-primary/90">{label}</div>
          <p className="mt-2 text-sm text-fg-muted">{hint}</p>
        </div>
      </div>
    </div>
  );
}

export function HeroScene({ className }: { className?: string }) {
  const { t } = useLocale();
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [webglFailed, setWebglFailed] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const labels = { label: t.home.heroVisualLabel, hint: t.home.heroVisualHint };

  if (HERO_MEDIA) {
    return <HeroMediaAsset className={className} />;
  }

  if (reducedMotion || webglFailed) {
    return <HeroRadarFallback className={className} {...labels} />;
  }

  return (
    <div className={className}>
      <div className="hero-scene-frame relative h-full min-h-[300px] w-full overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 6.5], fov: 42 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          onError={() => setWebglFailed(true)}
        >
          <SceneContent />
        </Canvas>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(3,5,13)] to-transparent p-4 pt-16">
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary/90">{labels.label}</div>
          <p className="mt-1 text-xs text-fg-muted">{labels.hint}</p>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
        <div className="pointer-events-none absolute inset-0 noise-overlay rounded-[inherit] opacity-[0.05]" />
      </div>
    </div>
  );
}
