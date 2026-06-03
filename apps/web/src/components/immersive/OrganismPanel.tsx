"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { accentClass, type EcosystemServer } from "@/lib/ecosystem";
import { Badge } from "@/components/ui/Badge";

export function PulseOrb({
  value,
  accent = "green",
  size = "md",
}: {
  value: number;
  accent?: EcosystemServer["accent"];
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "lg" ? "h-28 w-28" : size === "sm" ? "h-12 w-12" : "h-20 w-20";

  return (
    <div className={cn("relative grid place-items-center rounded-full", px)}>
      <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br blur-xl opacity-40", accentClass(accent))} />
      <div className="absolute inset-0 rounded-full border border-white/10 bg-black/30" />
      <div className="absolute inset-2 rounded-full border border-white/10" />
      <div
        className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-20 animate-breathe", accentClass(accent))}
        style={{ clipPath: `inset(${Math.max(0, 100 - value)}% 0 0 0 round 999px)` }}
      />
      <div className="relative text-center">
        <div className={cn("bg-gradient-to-r bg-clip-text font-semibold text-transparent", accentClass(accent))}>
          {value}
        </div>
        <div className="text-[9px] uppercase tracking-[0.22em] text-fg-muted">pulse</div>
      </div>
    </div>
  );
}

export function OrganismPanel({
  server,
  index = 0,
  compact = false,
}: {
  server: EcosystemServer;
  index?: number;
  compact?: boolean;
}) {
  const load = Math.round((server.online / server.maxPlayers) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <Link href={`/servers/${server.id}`} className="block">
        <div className="organism-panel relative overflow-hidden rounded-[2rem] p-5 transition duration-500 group-hover:-translate-y-1 group-hover:border-white/20">
          <div className={cn("absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br opacity-25 blur-3xl", accentClass(server.accent))} />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={server.stability > 88 ? "success" : "warning"}>{server.mood}</Badge>
                <Badge tone="neutral">{server.region}</Badge>
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-fg">{server.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-fg-muted">
                {server.game} / {server.faction}
              </p>
            </div>
            <PulseOrb value={server.pulse} accent={server.accent} size={compact ? "sm" : "md"} />
          </div>

          <p className={cn("relative mt-4 text-sm leading-6 text-fg-muted", compact && "line-clamp-2")}>{server.lore}</p>

          <div className="relative mt-5 grid grid-cols-3 gap-2">
            {[
              ["Online", `${server.online}/${server.maxPlayers}`],
              ["Stability", `${server.stability}%`],
              ["Wipe", server.wipeIn],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-fg-muted">{k}</div>
                <div className="mt-1 text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-5">
            <div className="flex items-center justify-between text-xs text-fg-muted">
              <span>community energy</span>
              <span>{server.energy}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
              <div className={cn("h-full rounded-full bg-gradient-to-r", accentClass(server.accent))} style={{ width: `${server.energy}%` }} />
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            {server.playstyle.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-fg-muted">
                {tag}
              </span>
            ))}
          </div>

          <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
            <span className="text-fg-muted">{server.season}</span>
            <span className="text-primary">Open organism →</span>
          </div>

          <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 bg-[radial-gradient(420px_circle_at_70%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function MetricCapsule({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="text-[10px] uppercase tracking-[0.24em] text-fg-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-fg">{value}</div>
      {hint ? <div className="mt-1 text-xs text-fg-muted">{hint}</div> : null}
    </div>
  );
}
