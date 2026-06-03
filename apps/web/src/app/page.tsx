"use client";

import Link from "next/link";
import * as React from "react";
import { motion } from "framer-motion";
import {
  ecosystemServers,
  activityFeed,
  seasonEvents,
  heroFilterIds,
  type HeroFilterId,
} from "@/lib/ecosystem";
import { HeroSceneDynamic } from "@/components/immersive/HeroSceneDynamic";
import { MetricCapsule } from "@/components/immersive/OrganismPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { EcosystemRadarPanel } from "@/components/immersive/EcosystemRadar";
import { useLocale } from "@/components/LocaleProvider";
import { useUiMode } from "@/components/UiModeProvider";
import { platformApi, type EcosystemRadar } from "@/lib/platform-api";

type HomeServer = {
  id: string;
  name: string;
  game: string;
  region?: string | null;
  mode?: string | null;
  online: number;
  maxPlayers: number;
  status: string;
  href: string;
};

export default function HomePage() {
  const { t } = useLocale();
  const { mode } = useUiMode();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [query, setQuery] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState<HeroFilterId>("all");
  const [apiOnline, setApiOnline] = React.useState(false);
  const [radarData, setRadarData] = React.useState<EcosystemRadar | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetch(`${apiUrl}/health`, { cache: "no-store" })
      .then((r) => mounted && setApiOnline(r.ok))
      .catch(() => mounted && setApiOnline(false));
    platformApi
      .ecosystemRadar()
      .then((data) => mounted && setRadarData(data))
      .catch(() => mounted && setRadarData(null));
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  const filterLabels: Record<HeroFilterId, string> = {
    all: t.home.filterAll,
    hardcore: t.home.filterHardcore,
    milsim: t.home.filterMilSim,
    pvp: t.home.filterPvp,
    smp: t.home.filterSmp,
    economy: t.home.filterEconomy,
    roleplay: t.home.filterRoleplay,
  };

  const fallbackServers: HomeServer[] = ecosystemServers.map((server) => ({
    id: server.id,
    name: server.name,
    game: server.game,
    region: server.region,
    mode: server.mood,
    online: server.online,
    maxPlayers: server.maxPlayers,
    status: "fallback",
    href: `/servers?${new URLSearchParams({ q: server.name }).toString()}`,
  }));

  const liveServers: HomeServer[] =
    radarData?.servers.map((server) => ({
      id: server.id,
      name: server.name,
      game: server.game,
      region: server.region,
      mode: server.mode,
      online: server.online,
      maxPlayers: server.max_players,
      status: server.status,
      href: server.href,
    })) ?? [];

  const sourceServers = liveServers.length > 0 ? liveServers : fallbackServers;
  const filtered = sourceServers.filter((server) => {
    const haystack = `${server.name} ${server.game} ${server.region ?? ""} ${server.mode ?? ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase().trim());
    const matchesFilter = selectedFilter === "all" || haystack.includes(selectedFilter);
    return matchesQuery && matchesFilter;
  });

  const heroPreview = (filtered.length > 0 ? filtered : sourceServers).slice(0, 2);
  const onlineTotal = radarData?.stats.servers_online ?? sourceServers.reduce((sum, server) => sum + server.online, 0);
  const searchHref =
    query.trim() || selectedFilter !== "all"
      ? `/servers?${new URLSearchParams({
          ...(query.trim() ? { q: query.trim() } : {}),
          ...(selectedFilter !== "all" ? { style: selectedFilter } : {}),
        }).toString()}`
      : "/servers";

  return (
    <div className="space-y-20 pb-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 sm:rounded-[2.5rem]">
        <div className="absolute inset-0 ecosystem-backdrop opacity-75" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(3,5,13,0.94)_0%,rgba(3,5,13,0.55)_48%,rgba(3,5,13,0.9)_100%)]" />
        <div className="absolute inset-0 ecosystem-grid opacity-35" />
        <div className="absolute inset-0 scan-beam overflow-hidden opacity-40" />

        <div className="relative grid min-h-[min(720px,88vh)] gap-10 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{t.home.badge}</Badge>
              {apiOnline ? (
                <Badge tone="success">{t.home.apiAlive}</Badge>
              ) : null}
            </div>
            <h1 className="font-display mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              {t.home.title1}
              <span className="mt-1 block bg-gradient-to-r from-cyan-200 via-emerald-200 to-violet-300 bg-clip-text text-transparent">
                {t.home.title2}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">{t.home.subtitle}</p>

            <div className="hero-search-panel mt-8 max-w-xl rounded-[1.75rem] p-3 sm:max-w-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.home.searchPlaceholder}
                  className="h-12 rounded-2xl border-white/10 bg-[rgba(8,12,22,0.9)] text-base sm:h-14"
                  aria-label={t.home.searchPlaceholder}
                />
                <Link href={searchHref} className="shrink-0">
                  <Button className="h-12 w-full rounded-2xl px-6 sm:h-14 sm:w-auto">{t.home.searchCta}</Button>
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {heroFilterIds.map((id) => (
                  <Chip key={id} active={selectedFilter === id} onClick={() => setSelectedFilter(id)}>
                    {filterLabels[id]}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              <MetricCapsule
                label={t.home.benefitOnline}
                value={onlineTotal.toLocaleString("ru-RU")}
                hint={t.home.benefitOnlineHint}
              />
              <MetricCapsule label={t.home.benefitRadar} value="Live" hint={t.home.benefitRadarHint} />
              <MetricCapsule
                label={t.home.benefitMatch}
                value={filtered.length > 0 ? String(filtered.length) : "—"}
                hint={`${filterLabels[selectedFilter]} · ${t.home.benefitMatchHint}`}
              />
            </div>
          </motion.div>

          <div className="relative flex min-h-[420px] flex-col gap-4 lg:min-h-[520px]">
            <HeroSceneDynamic className="relative z-10 h-[min(340px,42vh)] w-full shrink-0 lg:h-[min(400px,48vh)]" />
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              {heroPreview.map((server) => (
                <Link
                  key={server.id}
                  href={server.href}
                  className="organism-panel group rounded-[1.5rem] p-4 transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{server.name}</div>
                      <div className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-fg-muted">
                        {server.game} · {server.mode ?? server.region ?? "live"}
                      </div>
                    </div>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
                      {server.status}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-fg-muted">
                    {server.online}/{server.maxPlayers} {t.common.players}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {mode === "expert" ? (
        <section className="holo-panel rounded-[2rem] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge tone="warning">expert telemetry</Badge>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight">Live ecosystem snapshot</h2>
            </div>
            <Link href="/servers?sort=online" className="text-sm text-primary hover:text-fg">
              Open full server matrix →
            </Link>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-fg-muted">
                <tr>
                  <th className="py-3">World</th>
                  <th className="py-3">Game</th>
                  <th className="py-3">Mode</th>
                  <th className="py-3">Region</th>
                  <th className="py-3 text-right">Online</th>
                  <th className="py-3 text-right">Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sourceServers.slice(0, 8).map((server) => {
                  const load = server.maxPlayers > 0 ? Math.round((server.online / server.maxPlayers) * 100) : 0;
                  return (
                    <tr key={server.id} className="text-fg-muted">
                      <td className="py-3">
                        <Link href={server.href} className="font-medium text-fg hover:text-primary">
                          {server.name}
                        </Link>
                      </td>
                      <td className="py-3">{server.game}</td>
                      <td className="py-3">{server.mode ?? "—"}</td>
                      <td className="py-3">{server.region ?? "global"}</td>
                      <td className="py-3 text-right">{server.online}/{server.maxPlayers}</td>
                      <td className="py-3 text-right">{load}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <EcosystemRadarPanel
          fallbackServers={ecosystemServers.map((s) => ({
            id: s.id,
            name: s.name,
            game: s.game,
            href: `/servers?${new URLSearchParams({ q: s.name }).toString()}`,
          }))}
        />

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <Badge tone="success">{t.home.featured}</Badge>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight">{t.home.recommended}</h2>
            </div>
            <Link href="/servers" className="hidden text-sm text-primary hover:text-fg sm:block">
              {t.home.viewAll}
            </Link>
          </div>
          <div className="grid gap-4">
            {(filtered.length > 0 ? filtered : sourceServers).slice(0, 2).map((server) => (
              <Link key={server.id} href={server.href} className="organism-panel rounded-[2rem] p-5 transition hover:border-primary/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone={server.status === "online" ? "success" : "info"}>{server.game}</Badge>
                    <h3 className="mt-3 text-xl font-semibold">{server.name}</h3>
                    <p className="mt-1 text-sm text-fg-muted">
                      {server.region ?? "global"} · {server.mode ?? "ecosystem"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gradient">{server.online}</div>
                    <div className="text-[11px] text-fg-muted">online</div>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${server.maxPlayers > 0 ? Math.min(100, Math.round((server.online / server.maxPlayers) * 100)) : 0}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="holo-panel rounded-[2rem] p-6 lg:col-span-2">
          <Badge tone="warning">{t.home.seasonBadge}</Badge>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight">{t.home.seasonTitle}</h2>
          <div className="mt-8 space-y-5">
            {seasonEvents.map((event) => (
              <div key={event.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{event.label}</span>
                  <span className="text-fg-muted">{event.time}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-lime-300 to-fuchsia-400"
                    style={{ width: `${event.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="info">{t.home.feedBadge}</Badge>
          <h2 className="font-display mt-4 text-2xl font-semibold tracking-tight">{t.home.feedTitle}</h2>
          <div className="mt-5 space-y-3">
            {activityFeed.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-fg-muted">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_16px_rgb(var(--accent))]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="banner-control overflow-hidden rounded-[2.5rem] border border-white/10 p-6 sm:p-10">
        <div className="max-w-2xl">
          <Badge tone="info">{t.home.ownerBadge}</Badge>
          <h2 className="font-display mt-4 text-4xl font-semibold tracking-tight">{t.home.ownerTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-fg-muted">{t.home.ownerDesc}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/dashboard">
              <Button>{t.home.openDashboard}</Button>
            </Link>
            <Link href="/studio">
              <Button variant="outline">{t.home.addServer}</Button>
            </Link>
            <Link href="/profile">
              <Button variant="secondary">{t.home.joinCommunity}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
