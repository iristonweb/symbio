"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge, Button, GlowCard } from "@/components/primitives";

const ITEMS = [
  { title: "Ultra Realistic Retexture Pack", game: "ARMA", type: "Textures", price: "$9", tag: "Verified" },
  { title: "Tactical HUD v2", game: "Squad", type: "UI", price: "Free", tag: "Trending" },
  { title: "High‑poly Weapon Models", game: "Insurgency", type: "3D Models", price: "$19", tag: "Pro" },
  { title: "Night Ops Shader Preset", game: "DayZ", type: "Shaders", price: "$7", tag: "New" },
];

export default function MarketplacePage() {
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter((x) => (x.title + x.game + x.type).toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge><span className="text-gradient font-semibold tracking-[0.12em]">MARKETPLACE</span><span className="ml-2">• MVP UI</span></Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Browse mods & assets</h1>
          <p className="mt-2 text-sm text-[rgb(var(--cy-muted))]">
            Filter by game, compatibility and license. Payments & delivery will be wired in later.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => (window.location.href = "/servers")}>Servers</Button>
          <Button onClick={() => (window.location.href = "/studio")}>Creator Studio</Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search packs, mods, assets…"
          className="h-11 w-full rounded-2xl px-4 text-sm outline-none bg-white/5 border border-white/10 text-[rgb(var(--cy-text))] placeholder:text-[rgb(var(--cy-muted))] focus:ring-2 focus:ring-[rgb(var(--cy-lime)_/_0.18)] focus:border-[rgb(var(--cy-lime)_/_0.35)]"
        />
        <div className="flex flex-wrap gap-2">
          {["Textures", "3D Models", "Maps", "Shaders", "UI"].map((t) => (
            <button key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[rgb(var(--cy-muted))] hover:bg-white/10">
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-12">
        {filtered.map((it, idx) => (
          <motion.div key={it.title} className="md:col-span-6" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
            <GlowCard className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-[rgb(var(--cy-muted))]">{it.game} • {it.type}</div>
                  <div className="mt-1 text-lg font-semibold">{it.title}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-[rgb(var(--cy-muted))]">{it.price}</div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-[rgb(var(--cy-muted))]">Compatibility: <span className="text-[rgb(var(--cy-text))]">v1.4+</span></div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[rgb(var(--cy-muted))]">{it.tag}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm">View</Button>
                <Button size="sm" variant="outline">Add to collection</Button>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
