"use client";

import * as React from "react";
import { useUiMode } from "@/components/UiModeProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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

function Icon({ name }: { name: "search" | "sort" }) {
  if (name === "search")
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 21l-4.3-4.3" />
        <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 6h11" />
      <path d="M3 6h3" />
      <path d="M10 12h11" />
      <path d="M3 12h3" />
      <path d="M10 18h11" />
      <path d="M3 18h3" />
    </svg>
  );
}

export default function ServersPage() {
  const { mode } = useUiMode();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [items, setItems] = React.useState<Server[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [game, setGame] = React.useState<string>("all");
  const [region, setRegion] = React.useState<string>("all");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Servers</h1>
            <Badge tone={mode === "discover" ? "info" : "neutral"}>{mode}</Badge>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Live snapshots, anti-fraud, and ranking logic. In Discover mode — cards. In Expert mode — dense table.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <a href={`${apiUrl}/docs`} target="_blank" rel="noreferrer">
            <Button variant="ghost">API</Button>
          </a>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]">
                <Icon name="search" />
              </div>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, game, region…"
                className="pl-10"
              />
            </div>

            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--fg)] outline-none"
            >
              {games.map((g) => (
                <option key={g} value={g}>
                  {g === "all" ? "All games" : g}
                </option>
              ))}
            </select>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--fg)] outline-none"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All regions" : r}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSort((s) => (s === "online" ? "rating" : s === "rating" ? "name" : "online"))}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--fg)] transition hover:bg-[color:var(--card2)]"
              title="Change sort"
            >
              <Icon name="sort" />
              <span className="hidden sm:inline">Sort: {sort}</span>
              <span className="sm:hidden">{sort}</span>
            </button>
          </div>

          <div className="mt-4 text-xs text-[color:var(--muted)]">
            Showing <span className="text-[color:var(--fg)]">{filtered.length}</span> servers
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-[color:var(--muted)]">Loading servers…</div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-[color:var(--muted)]">
              No matches. If this is empty and you just started the project — run init_db to seed demo data.
            </div>
          </CardContent>
        </Card>
      ) : mode === "expert" ? (
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <div className="text-sm font-semibold">Expert table</div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[color:var(--muted)]">
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
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
                    <tr key={s.id} className="border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
                      <td className="py-3 pr-4 font-medium">{s.name}</td>
                      <td className="py-3 pr-4">
                        <Badge tone="info">{s.game}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-[color:var(--muted)]">{s.region}</td>
                      <td className="py-3 pr-4">{s.online}</td>
                      <td className="py-3 pr-4 text-[color:var(--muted)]">{s.max_players}</td>
                      <td className="py-3 pr-4">{s.rating.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="group overflow-hidden">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold leading-snug">{s.name}</div>
                  <Badge tone="info">{s.game}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[color:var(--muted)]">{s.region}</div>
                  <Badge tone={s.online > 0 ? "success" : "neutral"}>{s.online > 0 ? "Online" : "Idle"}</Badge>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-semibold">{s.online}</span>
                    <span className="text-[color:var(--muted)]">/{s.max_players}</span>
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">rating {s.rating.toFixed(2)}</div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                  <div
                    className={cn(
                      "h-full transition group-hover:opacity-90",
                      s.online / Math.max(1, s.max_players) > 0.7
                        ? "bg-[rgba(180,255,57,0.85)]"
                        : "bg-[rgba(0,245,212,0.85)]"
                    )}
                    style={{
                      width: `${Math.min(100, Math.round((s.online / Math.max(1, s.max_players)) * 100))}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
