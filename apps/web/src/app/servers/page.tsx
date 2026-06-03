"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ecosystemServers } from "@/lib/ecosystem";
import { OrganismPanel, MetricCapsule } from "@/components/immersive/OrganismPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const filters = ["Hardcore survival", "Faction wars", "MilSim", "Raids", "SMP", "Creator events"];

export default function ServersPage() {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<"energy" | "stability" | "pulse">("energy");

  const filtered = React.useMemo(() => {
    let list = ecosystemServers;
    if (filter) list = list.filter((server) => server.playstyle.includes(filter));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((server) =>
        `${server.name} ${server.game} ${server.region} ${server.mood} ${server.faction} ${server.playstyle.join(" ")}`
          .toLowerCase()
          .includes(q)
      );
    }
    return [...list].sort((a, b) => b[sort] - a[sort]);
  }, [filter, query, sort]);

  return (
    <div className="space-y-10 pb-14">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 banner-server opacity-80" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.92),rgba(3,5,13,0.52),rgba(3,5,13,0.88))]" />
        <div className="relative max-w-3xl">
          <Badge tone="info">worlds radar</Badge>
          <h1 className="mt-4 text-5xl font-semibold leading-none tracking-tight sm:text-7xl">
            Find a world by <span className="text-gradient">mood, pulse and pressure.</span>
          </h1>
          <p className="mt-5 text-base leading-8 text-fg-muted">
            Search is no longer only by name. Filter by faction, wipe pressure, stability, community energy
            and playstyle fit.
          </p>
        </div>
      </section>

      <section className="sticky top-[104px] z-30 rounded-[2rem] border border-white/10 bg-[rgba(3,5,13,0.76)] p-3 backdrop-blur-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Instant search: world, faction, game, mood..."
            className="h-13"
          />
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(filter === item ? null : item)}
                className={
                  filter === item
                    ? "rounded-full border border-primary/50 bg-primary/15 px-3 py-2 text-xs text-primary"
                    : "rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-fg-muted hover:bg-white/10"
                }
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSort((s) => (s === "energy" ? "stability" : s === "stability" ? "pulse" : "energy"))}
            className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-fg-muted hover:bg-white/10"
          >
            Sort / {sort}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCapsule label="recommendation engine" value="84%" hint="avg player fit" />
        <MetricCapsule label="active factions" value="127" hint="power shifting hourly" />
        <MetricCapsule label="wipe pressure" value="High" hint="3 worlds near reset" />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {filtered.map((server, index) => (
          <OrganismPanel key={server.id} server={server} index={index} />
        ))}
      </section>

      {filtered.length === 0 ? (
        <div className="holo-panel rounded-[2rem] p-10 text-center">
          <h2 className="text-2xl font-semibold">No organism matched your signal.</h2>
          <p className="mt-2 text-sm text-fg-muted">Clear filters or try another playstyle.</p>
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="success">personalized recommendations</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Your next world should feel alive.</h2>
          <p className="mt-3 text-sm leading-7 text-fg-muted">
            SYMBIO will rank worlds by your preferred tempo: high-pressure wipes, stable long-form worlds,
            faction politics, cooperative creation or tactical operations.
          </p>
        </div>
        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="warning">owner CTA</Badge>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">Add your server organism.</h2>
          <p className="mt-3 text-sm leading-7 text-fg-muted">Claim a world, publish lore, show media and track conversion.</p>
          <Link href="/studio" className="mt-5 inline-block">
            <Button>Create project</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
