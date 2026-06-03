"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useUiMode } from "@/components/UiModeProvider";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

type Server = {
  id: string;
  name: string;
  game: string;
  region: string;
  online: number;
  max_players: number;
  rating: number;
};

type SortKey = "online" | "rating" | "name";

export default function ServersPage() {
  const { mode } = useUiMode();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [items, setItems] = React.useState<Server[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [game, setGame] = React.useState("all");
  const [region, setRegion] = React.useState("all");
  const [sort, setSort] = React.useState<SortKey>("online");

  const load = React.useCallback(() => {
    setLoading(true);
    fetch(`${apiUrl}/servers/top_online?limit=50`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  React.useEffect(() => {
    load();
  }, [load]);

  const games = React.useMemo(() => {
    const set = new Set(items.map((x) => x.game).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  const regions = React.useMemo(() => {
    const set = new Set(items.map((x) => x.region).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = items;
    if (game !== "all") arr = arr.filter((x) => x.game === game);
    if (region !== "all") arr = arr.filter((x) => x.region === region);
    if (s) arr = arr.filter((x) => `${x.name} ${x.game} ${x.region}`.toLowerCase().includes(s));
    const by = (a: Server, b: Server) => {
      if (sort === "online") return b.online - a.online;
      if (sort === "rating") return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    };
    return [...arr].sort(by);
  }, [items, q, game, region, sort]);

  const selectClass =
    "h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-fg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="info">
          <span className="text-gradient font-semibold tracking-[0.12em]">SERVER HUB</span>
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Server <span className="text-gradient">radar</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Live snapshots, anti-fraud, ranking. Discover — immersive cards. Expert — dense table.
        </p>
      </motion.div>

      <GlowCard className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, game, region…"
          />
          <select value={game} onChange={(e) => setGame(e.target.value)} className={selectClass}>
            {games.map((g) => (
              <option key={g} value={g}>
                {g === "all" ? "All games" : g}
              </option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All regions" : r}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              setSort((s) => (s === "online" ? "rating" : s === "rating" ? "name" : "online"))
            }
            className={cn(selectClass, "hover:bg-white/10")}
          >
            Sort: {sort}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-fg-muted">
            Showing <span className="text-fg">{filtered.length}</span> servers
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <a href={`${apiUrl}/docs`} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm">
                API
              </Button>
            </a>
          </div>
        </div>
      </GlowCard>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlowCard className="p-8 text-center">
          <p className="text-sm text-fg-muted">
            No matches. Run init_db to seed demo data.
          </p>
        </GlowCard>
      ) : mode === "expert" ? (
        <GlowCard className="overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-4">
            <SectionTitle title="Expert table" subtitle="Dense operator view" />
          </div>
          <div className="overflow-x-auto p-4 pt-0">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-fg-muted">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Game</th>
                  <th className="py-2 pr-4">Region</th>
                  <th className="py-2 pr-4">Online</th>
                  <th className="py-2 pr-4">Max</th>
                  <th className="py-2 pr-4">Rating</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-white/8 last:border-0 hover:bg-white/5">
                    <td className="py-3 pr-4 font-medium">{s.name}</td>
                    <td className="py-3 pr-4">
                      <Badge tone="info">{s.game}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-fg-muted">{s.region}</td>
                    <td className="py-3 pr-4">{s.online}</td>
                    <td className="py-3 pr-4 text-fg-muted">{s.max_players}</td>
                    <td className="py-3 pr-4">{s.rating.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlowCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <GlowCard key={s.id} className="p-5" delay={i * 0.03}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold leading-snug">{s.name}</div>
                <Badge tone="info">{s.game}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-fg-muted">{s.region}</span>
                <Badge tone={s.online > 0 ? "success" : "neutral"}>
                  {s.online > 0 ? "Online" : "Idle"}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm">
                  <span className="font-semibold">{s.online}</span>
                  <span className="text-fg-muted">/{s.max_players}</span>
                </span>
                <span className="text-xs text-fg-muted">★ {s.rating.toFixed(2)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className={cn(
                    "h-full transition",
                    s.online / Math.max(1, s.max_players) > 0.7 ? "bg-accent" : "bg-primary"
                  )}
                  style={{
                    width: `${Math.min(100, Math.round((s.online / Math.max(1, s.max_players)) * 100))}%`,
                  }}
                />
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}
