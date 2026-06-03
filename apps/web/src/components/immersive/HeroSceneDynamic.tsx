"use client";

import dynamic from "next/dynamic";

export const HeroSceneDynamic = dynamic(
  () => import("./HeroScene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="relative min-h-[280px] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/20 skeleton-shimmer" />
    ),
  }
);
