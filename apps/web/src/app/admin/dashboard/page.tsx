"use client";

import Link from "next/link";
import * as React from "react";
import { fetchApi } from "@/lib/platform-api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCapsule } from "@/components/immersive/OrganismPanel";

type Copilot = {
  metrics: { servers: number; online: number; avg_load: number; products: number; events: number };
  servers: { id: string; name: string; game: string; mode?: string | null; online: number; max_players: number; load: number; rating: number; votes: number; href: string }[];
  products: { slug: string; title: string; game?: string | null; sales: number; rating: number; href: string }[];
  recommendations: { type: string; title: string; impact: string; action: string }[];
};

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<Copilot | null>(null);

  React.useEffect(() => {
    fetchApi<Copilot>("/ecosystem/copilot").then(setData).catch(() => setData(null));
  }, []);

  const metrics = data?.metrics ?? { servers: 0, online: 0, avg_load: 0, products: 0, events: 0 };

  return (
    <div className="space-y-10 pb-14">
      <section className="banner-control relative overflow-hidden rounded-[2.7rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.9),rgba(3,5,13,0.48),rgba(3,5,13,0.86))]" />
        <div className="relative max-w-3xl">
          <Badge tone="info">owner command</Badge>
          <h1 className="mt-4 text-5xl font-semibold leading-none tracking-tight sm:text-7xl">
            Grow a server like a <span className="text-gradient">living economy.</span>
          </h1>
          <p className="mt-5 text-base leading-8 text-fg-muted">
            Monitor conversion, retention, vote velocity, activity heatmaps, community pressure and
            profile performance from one cinematic control room.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/studio">
              <Button>Add server</Button>
            </Link>
            <Link href="/admin/audit">
              <Button variant="outline">Audit log</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCapsule label="servers" value={String(metrics.servers)} hint="tracked worlds" />
        <MetricCapsule label="online" value={String(metrics.online)} hint="live players" />
        <MetricCapsule label="avg load" value={`${metrics.avg_load}%`} hint="capacity pressure" />
        <MetricCapsule label="market signals" value={String(metrics.products)} hint="top products" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="organism-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge tone="success">lead organism</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Server performance</h2>
              <p className="mt-2 text-sm text-fg-muted">Online, load and trust signals from live data.</p>
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
            {!data?.servers?.length ? <p className="text-sm text-fg-muted">No server data yet.</p> : null}
          </div>
        </div>

        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="warning">market momentum</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Products that can grow servers</h2>
          <div className="mt-6 space-y-3">
            {(data?.products ?? []).slice(0, 6).map((product) => (
              <Link key={product.slug} href={product.href} className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-violet/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{product.title}</div>
                    <div className="text-xs text-fg-muted">{product.game ?? "any game"} · ★ {product.rating.toFixed(1)}</div>
                  </div>
                  <div className="text-right text-sm text-fg-muted">{product.sales} sales</div>
                </div>
              </Link>
            ))}
            {!data?.products?.length ? <p className="text-sm text-fg-muted">No product momentum yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {(data?.recommendations ?? []).map((item) => (
          <div key={item.title} className="holo-panel rounded-[2rem] p-6">
            <Badge tone={item.impact === "high" ? "warning" : "info"}>{item.type} · {item.impact}</Badge>
            <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-fg-muted">{item.action}</p>
          </div>
        ))}
        {!data ? (
          <div className="holo-panel rounded-[2rem] p-6 lg:col-span-3">
            <Badge tone="info">copilot</Badge>
            <p className="mt-4 text-sm text-fg-muted">Waiting for live ecosystem data.</p>
          </div>
        ) : null}
      </section>

      <section className="holo-panel rounded-[2rem] p-6">
        <Badge tone="info">experiment queue</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">Next growth experiments</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {["Hero CTA", "Mod bundle", "Wipe countdown"].map((name) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="font-medium">{name}</div>
              <p className="mt-2 text-xs text-fg-muted">Create an A/B variant and compare profile-to-join conversion.</p>
              <Button className="mt-4" size="sm" variant="outline">Queue test</Button>
              </div>
          ))}
        </div>
      </section>
    </div>
  );
}
