"use client";

import { Badge, Button, GlowCard } from "@/components/primitives";

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge><span className="text-gradient font-semibold tracking-[0.12em]">DOCS</span><span className="ml-2">• Sprint 0</span></Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Project notes</h1>
          <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--cy-muted))]">
            Quick links for local dev and a minimal roadmap snapshot. This page is a placeholder until the full docs hub lands.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => (window.location.href = "/admin/audit")}>Audit</Button>
          <Button onClick={() => (window.location.href = "/servers")}>Servers</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-12">
        <GlowCard className="md:col-span-7 p-6">
          <div className="text-xs text-[rgb(var(--cy-muted))]">Local endpoints</div>
          <div className="mt-1 text-lg font-semibold">Where to click</div>
          <div className="mt-4 space-y-2 text-sm">
            {[
              ["Web", "http://localhost:3000"],
              ["API Swagger", "http://127.0.0.1:8000/docs"],
              ["Meilisearch", "http://localhost:7700"],
              ["MinIO Console", "http://localhost:9011"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-[rgb(var(--cy-text))]">{k}</span>
                <span className="text-xs text-[rgb(var(--cy-muted))]">{v}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        <GlowCard className="md:col-span-5 p-6">
          <div className="text-xs text-[rgb(var(--cy-muted))]">Roadmap snapshot</div>
          <div className="mt-1 text-lg font-semibold">Next steps</div>
          <ul className="mt-4 space-y-2 text-sm text-[rgb(var(--cy-muted))] list-disc pl-5">
            <li>Marketplace product pages + compatibility filters</li>
            <li>Server pack publishing + verification flows</li>
            <li>Creator Studio upload & release pipeline</li>
            <li>Client v0: install/update/rollback skeleton</li>
            <li>Trust & Safety: rate limits, audit trail, signed URLs</li>
          </ul>
        </GlowCard>

        <GlowCard className="md:col-span-12 p-6">
          <div className="text-xs text-[rgb(var(--cy-muted))]">Dev tips</div>
          <div className="mt-1 text-lg font-semibold">Windows stability</div>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--cy-muted))]">
            If you see Watchpack “lstat C:\\pagefile.sys” messages, it’s a Windows watcher quirk. We tightened tsconfig includes to reduce
            filesystem scanning. For DB init errors on Windows async IO, run the init commands in WSL2 or ensure Postgres is healthy and reachable.
          </p>
        </GlowCard>
      </div>
    </div>
  );
}
