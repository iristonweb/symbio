"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge, Button, GlowCard } from "@/components/primitives";
import { useUiMode } from "@/components/UiMode";

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path d={path} fill="currentColor" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.07, duration: 0.5, ease: "easeOut" },
  }),
};

export default function HomePage() {
  const { mode, setMode } = useUiMode();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10">
      {/* Hero */}
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <motion.div initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp} custom={0}>
            <Badge className="border-white/10 bg-white/5">
              <span className="text-gradient font-semibold tracking-[0.12em]">SPRINT 0</span>
              <span className="ml-2">• Marketplace + Servers + Creator Studio</span>
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl font-semibold tracking-tight"
          >
            One‑click UGC for games.
            <span className="block text-gradient">Install. Update. Rollback.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="max-w-xl text-[15px] leading-7 text-[rgb(var(--cy-muted))]"
          >
            SYMBIO объединяет маркетплейс модов, Server Hub и Creator Studio — с клиентом, который умеет
            ставить сборки в один клик и валидировать зависимости/конфликты.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center gap-3">
            <Button onClick={() => (window.location.href = "/marketplace")}>
              Explore marketplace
              <span className="opacity-70">→</span>
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/servers")}>
              Browse servers
            </Button>
            <div className="ml-1 text-xs text-[rgb(var(--cy-muted))]">
              Tip: press <kbd className="mx-1 rounded-md border border-white/10 bg-black/20 px-2 py-1">Ctrl/⌘</kbd>+
              <kbd className="rounded-md border border-white/10 bg-black/20 px-2 py-1">K</kbd>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--cy-muted))]">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">MinIO</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Meilisearch</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Postgres</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Redis</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">FastAPI</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Next.js</span>
          </motion.div>
        </motion.div>

        {/* Right panel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <GlowCard className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Interface mode</div>
                <div className="mt-1 text-xs text-[rgb(var(--cy-muted))]">
                  Discover for creators & players • Expert for operators & power users
                </div>
              </div>

              <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <button
                  className={"px-3 py-2 text-xs transition " + (mode === "discover" ? "bg-white/10 text-[rgb(var(--cy-text))]" : "text-[rgb(var(--cy-muted))] hover:bg-white/5")}
                  onClick={() => setMode("discover")}
                >
                  Discover
                </button>
                <button
                  className={"px-3 py-2 text-xs transition " + (mode === "expert" ? "bg-white/10 text-[rgb(var(--cy-text))]" : "text-[rgb(var(--cy-muted))] hover:bg-white/5")}
                  onClick={() => setMode("expert")}
                >
                  Expert
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="grid h-8 w-8 place-items-center rounded-2xl border border-white/10 bg-black/20 text-[rgb(var(--cy-lime))]">
                    <Icon path="M12 2l9 4.5v11L12 22 3 17.5v-11L12 2zm0 2.2L5 7v9.4l7 3.5 7-3.5V7l-7-2.8z" />
                  </span>
                  One‑click pack install
                </div>
                <div className="mt-1 text-xs leading-6 text-[rgb(var(--cy-muted))]">
                  Server → required modpack → conflict/deps validator → install/update/rollback.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="grid h-8 w-8 place-items-center rounded-2xl border border-white/10 bg-black/20 text-[rgb(var(--cy-accent))]">
                    <Icon path="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z" />
                  </span>
                  Compatibility & trust
                </div>
                <div className="mt-1 text-xs leading-6 text-[rgb(var(--cy-muted))]">
                  Versions, licenses, analytics, verified servers, audit logs and safe distribution.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="grid h-8 w-8 place-items-center rounded-2xl border border-white/10 bg-black/20 text-[rgb(var(--cy-lime))]">
                    <Icon path="M12 3a9 9 0 00-9 9h3l-4 4-4-4h3A12 12 0 0112 0v3zm9 9a9 9 0 01-9 9v-3l4 4 4-4h-3A12 12 0 0012 24v-3a9 9 0 009-9h-3l4-4 4 4h-3z" />
                  </span>
                  Updates & rollbacks
                </div>
                <div className="mt-1 text-xs leading-6 text-[rgb(var(--cy-muted))]">
                  Predictable installs: lockfiles, staged updates, and instant rollback.
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* Content */}
      <div className="mt-12">
        {mode === "discover" ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">Discover</div>
                <div className="text-sm text-[rgb(var(--cy-muted))]">Bento overview for players & creators.</div>
              </div>
              <Button variant="ghost" onClick={() => (window.location.href = "/servers")}>
                Open Servers →
              </Button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-12">
              <GlowCard className="md:col-span-5 p-6">
                <div className="text-xs text-[rgb(var(--cy-muted))]">Marketplace</div>
                <div className="mt-1 text-lg font-semibold">Sell & buy mods safely</div>
                <div className="mt-2 text-sm leading-6 text-[rgb(var(--cy-muted))]">
                  Taxonomy, compatibility filters, licensing, analytics and promo tools.
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" onClick={() => (window.location.href = "/marketplace")}>Browse</Button>
                  <Button size="sm" variant="outline" onClick={() => (window.location.href = "/studio")}>Creator Studio</Button>
                </div>
              </GlowCard>

              <GlowCard className="md:col-span-7 p-6">
                <div className="text-xs text-[rgb(var(--cy-muted))]">Server Hub</div>
                <div className="mt-1 text-lg font-semibold">Servers drive distribution</div>
                <div className="mt-2 text-sm leading-6 text-[rgb(var(--cy-muted))]">
                  Each server can publish “required pack” → users install it in one click with validation.
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { k: "Top Online", v: "fresh snapshots" },
                    { k: "Trending", v: "EMA / z-score" },
                    { k: "Best Rated", v: "Wilson score" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-[rgb(var(--cy-muted))]">{s.k}</div>
                      <div className="mt-1 text-[13px] text-[rgb(var(--cy-text))]">{s.v}</div>
                    </div>
                  ))}
                </div>
              </GlowCard>

              <GlowCard className="md:col-span-7 p-6">
                <div className="text-xs text-[rgb(var(--cy-muted))]">Creator economy</div>
                <div className="mt-1 text-lg font-semibold">Versions, licenses, analytics</div>
                <div className="mt-2 text-sm leading-6 text-[rgb(var(--cy-muted))]">
                  Creators publish releases with semantic versions, upload assets, track installs and revenue.
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[rgb(var(--cy-muted))]">
                  {["Claimed/Verified", "Audit log", "Signed URLs", "Refund & dispute"].map((t) => (
                    <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{t}</span>
                  ))}
                </div>
              </GlowCard>

              <GlowCard className="md:col-span-5 p-6">
                <div className="text-xs text-[rgb(var(--cy-muted))]">Client</div>
                <div className="mt-1 text-lg font-semibold">Install • Update • Rollback</div>
                <div className="mt-2 text-sm leading-6 text-[rgb(var(--cy-muted))]">
                  Future: Electron/Tauri client, sandboxed paths, crash logs (opt‑in), safe SDLC.
                </div>
                <div className="mt-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-[rgb(var(--cy-muted))]">
                    Coming next: conflict resolver UI + modpack collections.
                  </div>
                </div>
              </GlowCard>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">Expert</div>
                <div className="text-sm text-[rgb(var(--cy-muted))]">Operator-first panel: endpoints & checks.</div>
              </div>
              <Button variant="ghost" onClick={() => (window.location.href = "/admin/audit")}>
                Open Audit →
              </Button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-12">
              <GlowCard className="md:col-span-7 p-6">
                <div className="text-xs text-[rgb(var(--cy-muted))]">Local stack</div>
                <div className="mt-1 text-lg font-semibold">Services & ports</div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-xs text-[rgb(var(--cy-muted))]">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Service</th>
                        <th className="px-4 py-3 text-left font-medium">URL</th>
                        <th className="px-4 py-3 text-left font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {[
                        ["Web", "http://localhost:3000", "Next.js"],
                        ["API", "http://127.0.0.1:8000/docs", "FastAPI Swagger"],
                        ["Meili", "http://localhost:7700", "Search"],
                        ["MinIO Console", "http://localhost:9011", "S3 UI"],
                        ["Postgres", "localhost:5432", "DB"],
                        ["Redis", "localhost:6379", "Cache/queues"],
                      ].map(([a, b, c]) => (
                        <tr key={a} className="bg-black/10">
                          <td className="px-4 py-3 font-medium">{a}</td>
                          <td className="px-4 py-3 text-[rgb(var(--cy-muted))]">{b}</td>
                          <td className="px-4 py-3 text-[rgb(var(--cy-muted))]">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-xs text-[rgb(var(--cy-muted))]">
                  Tip: if DB init fails on Windows, run the script from WSL2 or ensure Docker containers are healthy.
                </div>
              </GlowCard>

              <GlowCard className="md:col-span-5 p-6">
                <div className="text-xs text-[rgb(var(--cy-muted))]">Quick checks</div>
                <div className="mt-1 text-lg font-semibold">Health & auth</div>

                <div className="mt-4 space-y-2 text-sm">
                  {[
                    ["API health", "GET /health"],
                    ["Auth", "POST /auth/login"],
                    ["Servers", "GET /servers"],
                    ["Audit", "GET /audit"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="text-[rgb(var(--cy-text))]">{k}</span>
                      <span className="text-xs text-[rgb(var(--cy-muted))]">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-[rgb(var(--cy-muted))]">
                  Admin creation: <span className="text-[rgb(var(--cy-text))]">python -m app.scripts.create_admin</span>
                </div>
              </GlowCard>
            </div>
          </>
        )}
      </div>

      {/* Footer strip */}
      <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[rgb(var(--cy-muted))]">
        <div>SYMBIO • Master Brief v1.2 • Sprint 0</div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">A11y</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Perf</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Trust & Safety</span>
        </div>
      </div>
    </div>
  );
}
