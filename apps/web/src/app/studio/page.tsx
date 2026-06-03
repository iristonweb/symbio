"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MetricCapsule, PulseOrb } from "@/components/immersive/OrganismPanel";

const modes = ["Hardcore survival", "Faction wars", "MilSim", "Economy", "Roleplay", "Creator events"];

export default function StudioPage() {
  const [name, setName] = React.useState("Neon Frontier");
  const [game, setGame] = React.useState("DayZ");
  const [mood, setMood] = React.useState("Aggressive expansion");

  return (
    <div className="space-y-10 pb-14">
      <section className="relative overflow-hidden rounded-[2.7rem] border border-white/10 p-6 sm:p-10">
        <div className="absolute inset-0 banner-control opacity-75" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,13,0.92),rgba(3,5,13,0.6),rgba(3,5,13,0.9))]" />
        <div className="relative max-w-3xl">
          <Badge tone="info">add server organism</Badge>
          <h1 className="mt-4 text-5xl font-semibold leading-none tracking-tight sm:text-7xl">
            Launch a world with <span className="text-gradient">identity, pulse and trust.</span>
          </h1>
          <p className="mt-5 text-base leading-8 text-fg-muted">
            Create a server profile that sells the feeling of your world: lore, faction state,
            wipe cadence, stability, media, votes and conversion analytics.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="success">project seed</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Define the organism</h2>
          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-fg-muted">World name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-fg-muted">Game</label>
                <Input value={game} onChange={(e) => setGame(e.target.value)} className="mt-2" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-fg-muted">Mood</label>
                <Input value={mood} onChange={(e) => setMood(e.target.value)} className="mt-2" />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-fg-muted">Playstyle signals</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {modes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-fg-muted hover:bg-white/10"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-fg-muted">
              Next: connect media gallery, Discord snapshots, vote CTA, wipe timer and analytics tags.
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={!name}>Create project</Button>
            <Link href="/admin/dashboard">
              <Button variant="outline">Preview analytics</Button>
            </Link>
          </div>
        </div>

        <div className="organism-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge tone="info">live preview</Badge>
              <h3 className="mt-4 text-3xl font-semibold">{name || "Unnamed world"}</h3>
              <p className="mt-2 text-sm text-fg-muted">
                {game} / {mood}
              </p>
            </div>
            <PulseOrb value={88} accent="green" size="lg" />
          </div>
          <div className="mt-6 grid gap-3">
            <MetricCapsule label="launch readiness" value="72%" hint="profile completeness" />
            <MetricCapsule label="trust layer" value="Pending" hint="claim + verification" />
            <MetricCapsule label="community fit" value="High" hint="players can follow and vote" />
          </div>
        </div>
      </section>
    </div>
  );
}
