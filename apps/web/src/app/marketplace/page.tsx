"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ITEMS = [
  { title: "Ultra Realistic Retexture Pack", game: "ARMA", type: "Textures", price: "$9", tag: "Verified" },
  { title: "Tactical HUD v2", game: "Squad", type: "UI", price: "Free", tag: "Trending" },
  { title: "High-poly Weapon Models", game: "Insurgency", type: "3D Models", price: "$19", tag: "Pro" },
  { title: "Night Ops Shader Preset", game: "DayZ", type: "Shaders", price: "$7", tag: "New" },
  { title: "Urban Map Expansion", game: "SCUM", type: "Maps", price: "$12", tag: "Hot" },
  { title: "Sound Overhaul Pack", game: "Tarkov", type: "Audio", price: "$5", tag: "New" },
];

const FILTERS = ["Textures", "3D Models", "Maps", "Shaders", "UI"];

export default function MarketplacePage() {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    let arr = ITEMS;
    if (filter) arr = arr.filter((x) => x.type === filter);
    const q = query.trim().toLowerCase();
    if (!q) return arr;
    return arr.filter((x) => (x.title + x.game + x.type).toLowerCase().includes(q));
  }, [query, filter]);

  return (
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="info">
          <span className="text-gradient font-semibold tracking-[0.12em]">MARKETPLACE</span>
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Browse <span className="text-gradient">mods & assets</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Filter by game, compatibility and license. Payments & delivery — next sprint.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/servers">
            <Button variant="outline" size="sm">
              Servers
            </Button>
          </Link>
          <Link href="/studio">
            <Button size="sm">Creator Studio</Button>
          </Link>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search packs, mods, assets…"
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(filter === t ? null : t)}
              className={
                filter === t
                  ? "rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs text-primary"
                  : "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fg-muted hover:bg-white/10"
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((it, idx) => (
          <GlowCard key={it.title} className="p-6" delay={idx * 0.04}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-fg-muted">
                  {it.game} • {it.type}
                </div>
                <div className="mt-1 text-lg font-semibold">{it.title}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-fg-muted">
                {it.price}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-fg-muted">
                Compatibility: <span className="text-fg">v1.4+</span>
              </span>
              <Badge tone="neutral">{it.tag}</Badge>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm">View</Button>
              <Button size="sm" variant="outline">
                Add to collection
              </Button>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
