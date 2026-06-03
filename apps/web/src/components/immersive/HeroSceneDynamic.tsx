"use client";

import dynamic from "next/dynamic";

export const HeroSceneDynamic = dynamic(
  () => import("./HeroScene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="hero-scene-frame relative min-h-[300px] w-full overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-32 rounded-full border border-primary/20 bg-primary/5">
            <div className="hero-radar-sweep !absolute !inset-0 !opacity-30" />
          </div>
        </div>
      </div>
    ),
  }
);
