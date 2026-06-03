"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const ENDPOINTS = [
  ["Web", "http://localhost:3000"],
  ["API Swagger", "http://127.0.0.1:8000/docs"],
  ["Meilisearch", "http://localhost:7700"],
  ["MinIO Console", "http://localhost:9011"],
  ["Postgres", "localhost:5432"],
  ["Redis", "localhost:6379"],
];

const ROADMAP = [
  "Marketplace product pages + compatibility filters",
  "Server pack publishing + verification flows",
  "Creator Studio upload & release pipeline",
  "Client v0: install/update/rollback skeleton",
  "Trust & Safety: rate limits, audit trail, signed URLs",
];

export default function DocsPage() {
  return (
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge tone="info">
          <span className="text-gradient font-semibold tracking-[0.12em]">DOCS</span>
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Project <span className="text-gradient">notes</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Quick links for local dev and roadmap snapshot.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/admin/audit">
            <Button variant="outline" size="sm">
              Audit
            </Button>
          </Link>
          <Link href="/servers">
            <Button size="sm">Servers</Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlowCard className="lg:col-span-7 p-6">
          <div className="text-xs text-fg-muted">Local endpoints</div>
          <div className="mt-1 text-lg font-semibold">Where to click</div>
          <div className="mt-4 space-y-2">
            {ENDPOINTS.map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="text-fg">{k}</span>
                <span className="text-xs text-fg-muted font-mono">{v}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        <GlowCard className="lg:col-span-5 p-6">
          <div className="text-xs text-fg-muted">Roadmap snapshot</div>
          <div className="mt-1 text-lg font-semibold">Next steps</div>
          <ul className="mt-4 space-y-2 text-sm text-fg-muted list-disc pl-5">
            {ROADMAP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </GlowCard>

        <GlowCard className="lg:col-span-12 p-6">
          <div className="text-xs text-fg-muted">Dev tips</div>
          <div className="mt-1 text-lg font-semibold">Windows stability</div>
          <p className="mt-2 text-sm leading-7 text-fg-muted">
            If DB init fails on Windows, run scripts from WSL2 or ensure Docker containers are
            healthy. WebGL hero falls back to CSS aurora when reduced motion is enabled.
          </p>
        </GlowCard>
      </div>
    </div>
  );
}
