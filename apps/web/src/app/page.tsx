"use client";

import Link from "next/link";
import * as React from "react";
import { motion } from "framer-motion";
import { ecosystemServers, activityFeed, seasonEvents } from "@/lib/ecosystem";
import { HeroSceneDynamic } from "@/components/immersive/HeroSceneDynamic";
import { OrganismPanel, MetricCapsule, PulseOrb } from "@/components/immersive/OrganismPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLocale } from "@/components/LocaleProvider";

const playstyles = ["Hardcore", "MilSim", "PvP", "SMP", "Economy", "Roleplay"];

export default function HomePage() {
  const { t } = useLocale();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState("Hardcore");
  const [apiOnline, setApiOnline] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    fetch(`${apiUrl}/health`, { cache: "no-store" })
      .then((r) => mounted && setApiOnline(r.ok))
      .catch(() => mounted && setApiOnline(false));
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  const filtered = ecosystemServers.filter((server) => {
    const haystack = `${server.name} ${server.game} ${server.region} ${server.playstyle.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-20 pb-14">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/20">
        <div className="absolute inset-0 ecosystem-backdrop opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.92),rgba(3,5,13,0.42)_55%,rgba(3,5,13,0.88))]" />
        <div className="absolute inset-0 ecosystem-grid opacity-60" />
        <div className="absolute inset-0 scan-beam overflow-hidden opacity-80" />

        <div className="relative grid min-h-[680px] gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center"
          >
            <div className="flex flex-wrap gap-2">
              <Badge tone={apiOnline ? "success" : "danger"}>
                {apiOnline ? t.home.apiAlive : t.home.apiSleep}
              </Badge>
              <Badge tone="info">{t.home.badge}</Badge>
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-fg sm:text-7xl lg:text-8xl">
              {t.home.title1}
              <span className="block bg-gradient-to-r from-cyan-200 via-lime-200 to-fuchsia-300 bg-clip-text text-transparent">
                {t.home.title2}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-fg-muted sm:text-lg">{t.home.subtitle}</p>

            <div className="mt-8 max-w-3xl rounded-[2rem] border border-white/10 bg-black/45 p-3 backdrop-blur-2xl">
              <div className="flex flex-col gap-3 lg:flex-row">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.home.searchPlaceholder}
                  className="h-14 rounded-[1.4rem] border-white/10 bg-[rgba(8,12,22,0.85)] text-base"
                />
                <Link href="/servers">
                  <Button className="h-14 w-full rounded-[1.4rem] px-6 lg:w-auto">{t.common.openRadar}</Button>
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {playstyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelected(style)}
                    className={
                      selected === style
                        ? "rounded-full border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs text-primary"
                        : "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-fg-muted hover:bg-white/10"
                    }
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <MetricCapsule label={t.home.livingWorlds} value="4.8K" hint={t.home.tracked} />
              <MetricCapsule label={t.home.communityPulse} value="91%" hint={t.home.activityHint} />
              <MetricCapsule label={t.home.matchFit} value="84%" hint={`${selected} — ${t.home.recommendations}`} />
            </div>
          </motion.div>

          <div className="relative min-h-[460px]">
            <HeroSceneDynamic className="absolute inset-x-0 top-0 h-[330px] lg:h-[390px]" />
            <div className="absolute bottom-0 left-0 right-0 grid gap-3 sm:grid-cols-2">
              {ecosystemServers.slice(0, 2).map((server, index) => (
                <div key={server.id} className="organism-panel rounded-[1.8rem] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{server.name}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-fg-muted">
                        {server.mood}
                      </div>
                    </div>
                    <PulseOrb value={server.pulse} accent={server.accent} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="holo-panel relative overflow-hidden rounded-[2rem] p-6">
          <div className="absolute inset-0 ecosystem-grid opacity-60" />
          <div className="relative">
            <Badge tone="info">{t.home.radarBadge}</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">{t.home.radarTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-fg-muted">{t.home.radarDesc}</p>
            <div className="relative mx-auto mt-8 aspect-square max-w-[440px] rounded-full border border-primary/20 bg-black/30">
              <div className="absolute inset-8 rounded-full border border-white/10" />
              <div className="absolute inset-20 rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_28px_rgb(var(--primary))]" />
              {ecosystemServers.map((server, index) => {
                const coords = [
                  "left-[18%] top-[22%]",
                  "right-[18%] top-[30%]",
                  "left-[28%] bottom-[18%]",
                  "right-[27%] bottom-[22%]",
                ][index];
                return (
                  <Link
                    key={server.id}
                    href={`/servers/${server.id}`}
                    className={`absolute ${coords} group`}
                  >
                    <span className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/20" />
                    <span className="relative block h-8 w-8 rounded-full border border-white/20 bg-black/70 shadow-[0_0_22px_rgb(var(--primary)_/_0.45)]" />
                    <span className="absolute left-9 top-1 hidden whitespace-nowrap rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs text-fg group-hover:block">
                      {server.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <Badge tone="success">{t.home.featured}</Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t.home.recommended}</h2>
            </div>
            <Link href="/servers" className="hidden text-sm text-primary hover:text-fg sm:block">
              {t.home.viewAll}
            </Link>
          </div>
          <div className="grid gap-4">
            {filtered.slice(0, 2).map((server, index) => (
              <OrganismPanel key={server.id} server={server} index={index} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="holo-panel rounded-[2rem] p-6 lg:col-span-2">
          <Badge tone="warning">{t.home.seasonBadge}</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">{t.home.seasonTitle}</h2>
          <div className="mt-8 space-y-5">
            {seasonEvents.map((event) => (
              <div key={event.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{event.label}</span>
                  <span className="text-fg-muted">{event.time}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-lime-300 to-fuchsia-400" style={{ width: `${event.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="info">{t.home.feedBadge}</Badge>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{t.home.feedTitle}</h2>
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
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">{t.home.ownerTitle}</h2>
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
