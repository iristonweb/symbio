"use client";

import Link from "next/link";
import * as React from "react";
import { fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCapsule } from "@/components/immersive/OrganismPanel";
import { gameLabel, humanizeSlug } from "@/lib/display-labels";

type Copilot = {
  metrics: { servers: number; online: number; avg_load: number; products: number; events: number };
  servers: { id: string; name: string; game: string; mode?: string | null; online: number; max_players: number; load: number; rating: number; votes: number; href: string }[];
  products: { slug: string; title: string; game?: string | null; sales: number; rating: number; href: string }[];
  recommendations: { type: string; title: string; impact: string; action: string }[];
};

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const [data, setData] = React.useState<Copilot | null>(null);

  React.useEffect(() => {
    fetchApi<Copilot>("/ecosystem/copilot").then(setData).catch(() => setData(null));
  }, []);

  const metrics = data?.metrics ?? { servers: 0, online: 0, avg_load: 0, products: 0, events: 0 };
  const impactLabels: Record<string, string> = {
    high: t.admin.impactHigh,
    medium: t.admin.impactMedium,
    low: t.admin.impactLow,
  };
  const recommendationTypeLabels: Record<string, string> = {
    server: t.admin.recServer,
    marketplace: t.admin.recMarketplace,
    billing: t.admin.recBilling,
    content: t.admin.recContent,
  };

  return (
    <div className="space-y-10 pb-14">
      <section className="banner-control relative overflow-hidden rounded-[2.7rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.9),rgba(3,5,13,0.48),rgba(3,5,13,0.86))]" />
        <div className="relative max-w-3xl">
          <Badge tone="info">{t.admin.dashboardBadge}</Badge>
          <h1 className="mt-4 text-5xl font-semibold leading-none tracking-tight sm:text-7xl">
            {t.admin.dashboardTitle} <span className="text-gradient">{t.admin.dashboardTitleAccent}</span>
          </h1>
          <p className="mt-5 text-base leading-8 text-fg-muted">{t.admin.dashboardSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/studio">
              <Button>{t.admin.addServer}</Button>
            </Link>
            <Link href="/admin/audit">
              <Button variant="outline">{t.admin.auditLog}</Button>
            </Link>
            <Link href="/admin/imports">
              <Button variant="ghost">{t.admin.importTitle}</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCapsule label={t.admin.metricServers} value={String(metrics.servers)} hint={t.admin.metricServersHint} />
        <MetricCapsule label={t.admin.metricOnline} value={String(metrics.online)} hint={t.admin.metricOnlineHint} />
        <MetricCapsule label={t.admin.metricLoad} value={`${metrics.avg_load}%`} hint={t.admin.metricLoadHint} />
        <MetricCapsule label={t.admin.metricMarket} value={String(metrics.products)} hint={t.admin.metricMarketHint} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="organism-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge tone="success">{t.admin.leadOrganism}</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">{t.admin.serverPerformance}</h2>
              <p className="mt-2 text-sm text-fg-muted">{t.admin.serverPerformanceDesc}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {(data?.servers ?? []).slice(0, 5).map((server) => (
              <Link key={server.id} href={server.href} className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-primary/30">
                <div className="flex items-center justify-between text-sm">
                  <span>{server.name}</span>
                  <span className="text-fg-muted">{server.online}/{server.max_players}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lime-300" style={{ width: `${server.load}%` }} />
                </div>
              </Link>
            ))}
            {!data?.servers?.length ? <p className="text-sm text-fg-muted">{t.admin.noServerData}</p> : null}
          </div>
        </div>

        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="warning">{t.admin.marketMomentum}</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">{t.admin.growthProducts}</h2>
          <div className="mt-6 space-y-3">
            {(data?.products ?? []).slice(0, 6).map((product) => (
              <Link key={product.slug} href={product.href} className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-violet/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{product.title}</div>
                    <div className="text-xs text-fg-muted">{product.game ? gameLabel(product.game) : t.common.anyGame} · ★ {product.rating.toFixed(1)}</div>
                  </div>
                  <div className="text-right text-sm text-fg-muted">{product.sales} {t.marketplace.sales}</div>
                </div>
              </Link>
            ))}
            {!data?.products?.length ? <p className="text-sm text-fg-muted">{t.admin.noProductMomentum}</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {(data?.recommendations ?? []).map((item) => (
          <div key={item.title} className="holo-panel rounded-[2rem] p-6">
            <Badge tone={item.impact === "high" ? "warning" : "info"}>
              {recommendationTypeLabels[item.type] ?? humanizeSlug(item.type)} · {impactLabels[item.impact] ?? humanizeSlug(item.impact)}
            </Badge>
            <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-fg-muted">{item.action}</p>
          </div>
        ))}
        {!data ? (
          <div className="holo-panel rounded-[2rem] p-6 lg:col-span-3">
            <Badge tone="info">{t.admin.copilot}</Badge>
            <p className="mt-4 text-sm text-fg-muted">{t.admin.noServerData}</p>
          </div>
        ) : null}
      </section>

      <section className="holo-panel rounded-[2rem] p-6">
        <Badge tone="info">{t.admin.experimentQueue}</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">{t.admin.nextExperiments}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[t.admin.experimentHeroCta, t.admin.experimentModBundle, t.admin.experimentWipeCountdown].map((name) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="font-medium">{name}</div>
              <p className="mt-2 text-xs text-fg-muted">{t.admin.experimentDesc}</p>
              <Button className="mt-4" size="sm" variant="outline">{t.admin.queueTest}</Button>
              </div>
          ))}
        </div>
      </section>
    </div>
  );
}
