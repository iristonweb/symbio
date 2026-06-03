"use client";

import * as React from "react";
import Link from "next/link";
import { platformApi, type ApiServer } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

const SORT_KEYS = ["online", "rating", "votes", "rank", "new"] as const;

export default function ServersPage() {
  const { t } = useLocale();
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<(typeof SORT_KEYS)[number]>("online");
  const [servers, setServers] = React.useState<ApiServer[]>([]);
  const [loading, setLoading] = React.useState(true);

  const sortLabels: Record<(typeof SORT_KEYS)[number], string> = {
    online: t.servers.sortOnline,
    rating: t.servers.sortRating,
    votes: t.servers.sortVotes,
    rank: t.servers.sortRank,
    new: t.servers.sortNew,
  };

  React.useEffect(() => {
    setLoading(true);
    platformApi
      .servers({ sort, q: query || undefined })
      .then((r) => setServers(r.items))
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  }, [query, sort]);

  return (
    <div className="space-y-10 pb-14">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 banner-server opacity-80" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.92),rgba(3,5,13,0.52),rgba(3,5,13,0.88))]" />
        <div className="relative max-w-3xl">
          <Badge tone="info">{t.servers.badge}</Badge>
          <h1 className="mt-4 text-5xl font-semibold leading-none tracking-tight sm:text-7xl">
            {t.servers.title} <span className="text-gradient">{t.servers.titleAccent}</span>
          </h1>
          <p className="mt-5 text-base leading-8 text-fg-muted">{t.servers.subtitle}</p>
        </div>
      </section>

      <section className="sticky top-[104px] z-30 rounded-[2rem] border border-white/10 bg-[rgba(3,5,13,0.76)] p-3 backdrop-blur-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.servers.searchPlaceholder}
            className="h-13"
          />
          <div className="flex flex-wrap gap-2">
            {SORT_KEYS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={
                  sort === s
                    ? "rounded-full border border-primary/50 bg-primary/15 px-3 py-2 text-xs text-primary"
                    : "rounded-full border border-white/10 px-3 py-2 text-xs text-fg-muted hover:bg-white/10"
                }
              >
                {sortLabels[s]}
              </button>
            ))}
          </div>
          <Link href="/studio">
            <Button size="sm">{t.servers.addServer}</Button>
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {servers.map((server) => {
            const snap = server.snapshot;
            const pop = snap && snap.max_players > 0 ? Math.round((snap.online / snap.max_players) * 100) : 0;
            return (
              <Link key={server.id} href={`/servers/${server.id}`} className="organism-panel rounded-[2rem] p-6">
                <div className="flex justify-between gap-2">
                  <div>
                    <Badge tone="info">{server.game}</Badge>
                    <h2 className="mt-2 text-xl font-semibold">{server.name}</h2>
                    <p className="mt-1 text-xs text-fg-muted">
                      {server.region ?? "—"} · {server.mode ?? "—"}
                    </p>
                  </div>
                  <Badge tone={snap?.status === "online" ? "success" : "neutral"}>
                    {snap?.online ?? 0}/{snap?.max_players ?? 0}
                  </Badge>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${pop}%` }}
                  />
                </div>
                <div className="mt-2 flex gap-3 text-xs text-fg-muted">
                  {snap?.rank != null ? (
                    <span>
                      {t.common.rank} #{snap.rank}
                    </span>
                  ) : null}
                  {snap?.uptime_percent != null ? (
                    <span>
                      {t.common.uptime} {snap.uptime_percent}%
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
          {servers.length === 0 ? (
            <div className="col-span-2 holo-panel rounded-[2rem] p-10 text-center text-fg-muted">{t.servers.empty}</div>
          ) : null}
        </section>
      )}
    </div>
  );
}
