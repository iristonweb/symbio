"use client";

import Link from "next/link";
import * as React from "react";
import { motion } from "framer-motion";
import { useUiMode } from "@/components/UiModeProvider";
import { HeroSceneDynamic } from "@/components/immersive/HeroSceneDynamic";
import { GlowCard } from "@/components/immersive/GlowCard";
import { MotionItem } from "@/components/immersive/MotionSection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Kbd } from "@/components/ui/Kbd";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/cn";

type Health = { ok: boolean; service: string; time: string };
type TopServer = {
  id: string;
  name: string;
  game: string;
  region: string;
  online: number;
  max_players: number;
  rating: number;
};

const MODULES = [
  {
    title: "Marketplace",
    desc: "Моды, ретекстуры, 3D, карты, шейдеры — версии, лицензии, превью.",
    href: "/marketplace",
    tag: "UGC",
    tone: "info" as const,
  },
  {
    title: "Server Hub",
    desc: "Топ онлайн, тренды, рейтинги, антифрод и верификация серверов.",
    href: "/servers",
    tag: "Live",
    tone: "success" as const,
  },
  {
    title: "Creator Studio",
    desc: "Загрузки, версии, аналитика, промо и выплаты — в одном месте.",
    href: "/studio",
    tag: "Pro",
    tone: "info" as const,
  },
  {
    title: "Collections",
    desc: "Наборы модов с зависимостями, конфликтами и быстрым откатом.",
    href: "/marketplace",
    tag: "Packs",
    tone: "neutral" as const,
  },
  {
    title: "Academy",
    desc: "Гайды hardcore-уровня + стандарты качества и разборы.",
    href: "/docs",
    tag: "Learn",
    tone: "neutral" as const,
  },
  {
    title: "Mod Manager",
    desc: "One-click install, update, rollback, conflict resolver.",
    href: "/docs",
    tag: "Desktop",
    tone: "neutral" as const,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.04 + i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function HomePage() {
  const { mode } = useUiMode();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [health, setHealth] = React.useState<Health | null>(null);
  const [top, setTop] = React.useState<TopServer[]>([]);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    fetch(`${apiUrl}/health`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => mounted && setHealth(data))
      .catch(() => mounted && setHealth(null));
    fetch(`${apiUrl}/servers/top_online?limit=5`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => mounted && setTop(Array.isArray(data) ? data : []))
      .catch(() => mounted && setTop([]));
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return top;
    return top.filter((x) => `${x.name} ${x.game} ${x.region}`.toLowerCase().includes(s));
  }, [q, top]);

  return (
    <div className="space-y-16 pb-8">
      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
        <motion.div initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp} custom={0}>
            <Badge tone={health?.ok ? "success" : "danger"}>
              {health?.ok ? "API online" : "API offline"}
            </Badge>
            <Badge tone="info" className="ml-2">
              Immersive v2
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            One-click mods.
            <span className="block text-gradient">Real server stats.</span>
            <span className="block text-fg-muted text-3xl sm:text-4xl lg:text-5xl font-medium mt-1">
              Creator economy.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="max-w-xl text-[15px] leading-7 text-fg-muted">
            SYMBIO объединяет marketplace модов, server hub и creator studio — чтобы игроки ставили
            контент безопасно, а авторы зарабатывали прозрачно.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center gap-3">
            <Link href="/servers">
              <Button size="lg">Explore Servers</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline">
                Become a Creator
              </Button>
            </Link>
            <span className="text-xs text-fg-muted">
              <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd> command palette
            </span>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap gap-2">
            {["Postgres", "Redis", "Meilisearch", "MinIO", "FastAPI", "Next.js"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fg-muted"
              >
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <HeroSceneDynamic className="h-full min-h-[300px] lg:min-h-[380px]" />
        </motion.div>
      </section>

      {/* Cockpit */}
      <section className="grid gap-4 lg:grid-cols-3">
        <GlowCard className="p-5" delay={0}>
          <div className="text-xs text-fg-muted">Live status</div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-medium truncate">{apiUrl}</span>
            <Badge tone={health?.ok ? "success" : "danger"}>
              {health?.ok ? "Healthy" : "Offline"}
            </Badge>
          </div>
        </GlowCard>
        <GlowCard className="p-5" delay={0.05}>
          <div className="text-xs text-fg-muted">Interface mode</div>
          <div className="mt-2 text-sm font-medium">
            {mode === "discover" ? "Discover UI" : "Expert UI"}
          </div>
          <p className="mt-1 text-xs text-fg-muted">Переключатель в хедере меняет плотность данных.</p>
        </GlowCard>
        <GlowCard className="p-5" delay={0.1}>
          <div className="text-xs text-fg-muted">Servers tracked</div>
          <div className="mt-2 text-2xl font-semibold text-gradient">{top.length}</div>
          <p className="mt-1 text-xs text-fg-muted">Live snapshots from API</p>
        </GlowCard>
      </section>

      {/* Modules bento */}
      <section>
        <SectionTitle
          title="Core modules"
          subtitle="Навигация по ключевым частям платформы — hover для glow."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <Link key={m.title} href={m.href} className="block">
              <GlowCard className="h-full p-5" delay={i * 0.04} interactive>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-base font-semibold">{m.title}</div>
                  <Badge tone={m.tone}>{m.tag}</Badge>
                </div>
                <p className="mt-2 text-sm text-fg-muted">{m.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                  Open <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </GlowCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Top servers */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle
            title="Top online right now"
            subtitle="Демоданные после init_db."
          />
          <div className="w-full sm:w-72">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search servers…"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {filtered.length === 0 ? (
            <GlowCard className="p-6 sm:col-span-2 lg:col-span-5">
              <p className="text-sm text-fg-muted">
                Пока пусто. Проверь API и init_db.
              </p>
            </GlowCard>
          ) : (
            filtered.map((s, i) => (
              <GlowCard key={s.id} className="p-4" delay={i * 0.03}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold leading-snug">{s.name}</div>
                  <Badge tone="info">{s.game}</Badge>
                </div>
                <div className="mt-2 text-xs text-fg-muted">{s.region}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm">
                    <span className="font-semibold">{s.online}</span>
                    <span className="text-fg-muted">/{s.max_players}</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full bg-primary transition"
                    style={{
                      width: `${Math.min(100, Math.round((s.online / Math.max(1, s.max_players)) * 100))}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-fg-muted">
                  rating <span className="text-fg">{s.rating.toFixed(2)}</span>
                </div>
              </GlowCard>
            ))
          )}
        </div>
      </section>

      {/* Expert panel */}
      {mode === "expert" ? (
        <MotionItem index={0}>
          <GlowCard className="p-6">
            <SectionTitle title="Expert quick panel" subtitle="Copy/paste friendly endpoints" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Health", `${apiUrl}/health`],
                ["Top online", `${apiUrl}/servers/top_online?limit=10`],
                ["Swagger", `${apiUrl}/docs`],
              ].map(([label, url]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="text-xs text-fg-muted">{label}</div>
                  <div className="mt-2 font-mono text-xs break-all text-fg">{url}</div>
                </div>
              ))}
            </div>
          </GlowCard>
        </MotionItem>
      ) : null}
    </div>
  );
}
