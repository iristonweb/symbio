"use client";

import Link from "next/link";
import * as React from "react";
import { platformApi, type EcosystemRadar } from "@/lib/platform-api";
import { Badge } from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";
import { gameLabel } from "@/lib/display-labels";

type Props = {
  fallbackServers?: { id: string; name: string; game: string; href?: string }[];
};

export function EcosystemRadarPanel({ fallbackServers = [] }: Props) {
  const { t } = useLocale();
  const [data, setData] = React.useState<EcosystemRadar | null>(null);

  React.useEffect(() => {
    platformApi
      .ecosystemRadar()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const servers = data?.servers?.length
    ? data.servers
    : fallbackServers.map((s) => ({
        ...s,
        online: 0,
        max_players: 0,
        status: "unknown",
        href: s.href || `/servers/${s.id}`,
      }));

  const coords = [
    "left-[14%] top-[20%]",
    "right-[14%] top-[28%]",
    "left-[24%] bottom-[16%]",
    "right-[22%] bottom-[20%]",
    "left-[42%] top-[12%]",
    "right-[38%] bottom-[12%]",
  ];

  return (
    <div className="holo-panel relative overflow-hidden rounded-[2rem] p-6">
      <div className="absolute inset-0 ecosystem-grid opacity-50" />
      <div className="relative">
        <Badge tone="info">{t.home.radarBadge}</Badge>
        <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight">{t.home.radarTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-fg-muted">{t.home.radarDesc}</p>

        {data?.stats ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-fg-muted">
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
              {data.stats.servers_online} {t.common.players}
            </span>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
              {data.stats.product_count} mods
            </span>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
              {data.stats.game_count} games
            </span>
          </div>
        ) : null}

        <div className="relative mx-auto mt-8 aspect-square max-w-[440px] rounded-full border border-primary/25 bg-[radial-gradient(circle_at_50%_45%,rgb(var(--primary)_/_0.08),transparent_62%)] shadow-[inset_0_0_60px_rgb(var(--primary)_/_0.06)]">
          <div className="absolute inset-8 rounded-full border border-white/10" />
          <div className="absolute inset-20 rounded-full border border-white/8" />
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_32px_rgb(var(--primary))]" />
          <div className="absolute inset-0 rounded-full opacity-40 hero-radar-sweep" />
          {servers.slice(0, 6).map((server, index) => (
            <Link
              key={server.id}
              href={server.href}
              className={`absolute ${coords[index % coords.length]} group z-10`}
            >
              <span className="absolute inset-0 h-9 w-9 animate-ping rounded-full bg-primary/15" />
              <span className="relative block h-9 w-9 rounded-full border border-primary/30 bg-black/75 shadow-[0_0_24px_rgb(var(--primary)_/_0.4)]" />
              <span className="absolute left-10 top-0 z-20 hidden max-w-[200px] rounded-xl border border-white/12 bg-black/80 px-3 py-1.5 text-xs backdrop-blur-xl group-hover:block sm:max-w-[240px]">
                <span className="font-medium text-fg">{server.name}</span>
                <span className="mt-0.5 block text-fg-muted">
                  {gameLabel(server.game)} · {server.online}/{server.max_players}
                </span>
              </span>
            </Link>
          ))}
        </div>

        {data?.products?.length ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {data.products.slice(0, 4).map((p) => (
              <Link
                key={p.slug}
                href={p.href}
                className="rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-[11px] text-fg-muted transition hover:border-violet/50 hover:text-fg"
              >
                {p.title}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
