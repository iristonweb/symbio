"use client";

import Link from "next/link";
import * as React from "react";
import { AuroraBackground } from "@/components/aurora/AuroraBackground";
import { useUiMode } from "@/components/UiModeProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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

function Icon({ name }: { name: "market" | "server" | "studio" | "pack" | "learn" | "client" | "arrow" }) {
  const common = "h-5 w-5";
  if (name === "arrow")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 12h12" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  if (name === "server")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16v5H4z" />
        <path d="M4 13h16v5H4z" />
        <path d="M7 8h.01M7 15h.01" />
      </svg>
    );
  if (name === "market")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 7h18l-1.5 14H4.5L3 7Z" />
        <path d="M7 7a5 5 0 0 1 10 0" />
      </svg>
    );
  if (name === "studio")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4h16v16H4z" />
        <path d="M8 20V4" />
        <path d="M4 8h16" />
        <path d="M12 12h4" />
        <path d="M12 16h4" />
      </svg>
    );
  if (name === "pack")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l8 4-8 4-8-4 8-4Z" />
        <path d="M4 11l8 4 8-4" />
        <path d="M4 15l8 4 8-4" />
      </svg>
    );
  if (name === "learn")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V6" />
        <path d="M20 19V6" />
        <path d="M4 6l8-3 8 3-8 3-8-3Z" />
        <path d="M12 9v12" />
      </svg>
    );
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 7h10v10H7z" />
      <path d="M9 3h6" />
      <path d="M9 21h6" />
      <path d="M3 9v6" />
      <path d="M21 9v6" />
    </svg>
  );
}

function BentoCard({
  title,
  desc,
  href,
  icon,
  tone = "info",
  tag,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  tone?: "info" | "success" | "neutral";
  tag?: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[rgba(0,245,212,0.18)] blur-3xl" />
          <div className="absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-[rgba(180,255,57,0.14)] blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
              {icon}
            </div>
            {tag ? <Badge tone={tone}>{tag}</Badge> : null}
          </div>

          <div className="mt-4">
            <div className="text-base font-semibold tracking-tight">{title}</div>
            <div className="mt-1 text-sm text-[color:var(--muted)]">{desc}</div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-sm text-[color:var(--primary)]">
            <span className="opacity-90">Open</span>
            <span className="transition group-hover:translate-x-0.5">
              <Icon name="arrow" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

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
    <AuroraBackground className="rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,10,15,0.55)] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-10">
          <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={health?.ok ? "success" : "danger"}>
                  {health?.ok ? "API online" : "API offline"}
                </Badge>
                <Badge tone="info">Sprint 0</Badge>
                <Badge tone="neutral">Discover / Expert</Badge>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                One-click mods. Real server stats. Creator economy.
              </h1>

              <p className="mt-4 max-w-2xl text-base text-[color:var(--muted)] sm:text-lg">
                SYMBIO объединяет marketplace модов, server hub и creator studio — чтобы игроки ставили
                контент безопасно, а авторы зарабатывали прозрачно.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/servers">
                  <Button size="lg">Explore Servers</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="lg" variant="secondary">
                    Become a Creator
                  </Button>
                </Link>
                <a href={`${apiUrl}/docs`} target="_blank" rel="noreferrer">
                  <Button size="lg" variant="ghost">
                    API Docs
                  </Button>
                </a>
              </div>
            </div>

            <Card className="relative overflow-hidden">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Live status</div>
                  <Badge tone={health?.ok ? "success" : "danger"}>
                    {health?.ok ? "Healthy" : "No connection"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="text-xs text-[color:var(--muted)]">API</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-sm font-medium">{apiUrl}</div>
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          health?.ok ? "bg-[color:var(--accent)]" : "bg-[rgba(255,80,110,0.95)]"
                        )}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="text-xs text-[color:var(--muted)]">Mode</div>
                    <div className="mt-1 text-sm font-medium">{mode === "discover" ? "Discover UI" : "Expert UI"}</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      Переключатель в хедере меняет плотность интерфейса и представление данных.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Core modules</div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">
                  Навигация по ключевым частям платформы.
                </div>
              </div>
              <div className="hidden sm:block text-xs text-[color:var(--muted)]">Hover cards for glow</div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <BentoCard
                title="Marketplace"
                desc="Моды, ретекстуры, 3D, карты, шейдеры — с версиями, лицензиями и превью."
                href="/servers"
                icon={<Icon name="market" />}
                tone="info"
                tag="UGC"
              />
              <BentoCard
                title="Server Hub"
                desc="Топ онлайн, тренды, рейтинги, антифрод и верификация серверов."
                href="/servers"
                icon={<Icon name="server" />}
                tone="success"
                tag="Live"
              />
              <BentoCard
                title="Creator Studio"
                desc="Загрузки, версии, аналитика, промо и выплаты — в одном месте."
                href="/auth/register"
                icon={<Icon name="studio" />}
                tone="info"
                tag="Pro"
              />
              <BentoCard
                title="Collections / Modpacks"
                desc="Наборы модов с зависимостями, конфликтами и быстрым откатом."
                href="/servers"
                icon={<Icon name="pack" />}
                tone="neutral"
                tag="Packs"
              />
              <BentoCard
                title="Academy"
                desc="Гайды уровня hardcore + экспертные разборы и стандарты качества."
                href="/"
                icon={<Icon name="learn" />}
                tone="neutral"
                tag="Learn"
              />
              <BentoCard
                title="Client / Mod Manager"
                desc="One-click install, update, rollback, conflict resolver, crash logs with consent."
                href="/"
                icon={<Icon name="client" />}
                tone="neutral"
                tag="Desktop"
              />
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Top online right now</div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">
                  Демоданные появляются после инициализации базы.
                </div>
              </div>
              <div className="w-full sm:w-72">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search servers…"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-5">
              {filtered.length === 0 ? (
                <Card className="lg:col-span-5">
                  <CardContent className="pt-5">
                    <div className="text-sm text-[color:var(--muted)]">
                      Пока пусто. Проверь, что API работает и база инициализирована (init_db).
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filtered.map((s) => (
                  <Card key={s.id} className="group overflow-hidden">
                    <CardHeader className="pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold leading-snug">{s.name}</div>
                        <Badge tone="info">{s.game}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-xs text-[color:var(--muted)]">{s.region}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-semibold">{s.online}</span>
                          <span className="text-[color:var(--muted)]">/{s.max_players}</span>
                        </div>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                          <div
                            className="h-full bg-[rgba(0,245,212,0.85)] transition group-hover:opacity-90"
                            style={{ width: `${Math.min(100, Math.round((s.online / Math.max(1, s.max_players)) * 100))}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-[color:var(--muted)]">
                        rating: <span className="text-[color:var(--fg)]">{s.rating.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {mode === "expert" ? (
            <section>
              <Card className="overflow-hidden">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">Expert quick panel</div>
                    <Badge tone="neutral">Copy/paste friendly</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-3 text-sm">
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="text-xs text-[color:var(--muted)]">Health</div>
                      <div className="mt-2 font-mono text-xs">{apiUrl}/health</div>
                    </div>
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="text-xs text-[color:var(--muted)]">Top online</div>
                      <div className="mt-2 font-mono text-xs">{apiUrl}/servers/top_online?limit=10</div>
                    </div>
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="text-xs text-[color:var(--muted)]">Swagger</div>
                      <div className="mt-2 font-mono text-xs">{apiUrl}/docs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}
        </div>
      </div>
    </AuroraBackground>
  );
}
