"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { GlowCard } from "@/components/immersive/GlowCard";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const ENDPOINTS = [
  ["Web", "http://localhost:3000"],
  ["API Swagger", "http://127.0.0.1:8000/docs"],
  ["Meilisearch", "http://localhost:7700"],
  ["MinIO Console", "http://localhost:9011"],
  ["Postgres", "localhost:5435"],
  ["Redis", "localhost:6379"],
];

const ROADMAP = [
  "Marketplace: compatibility filters и публикация server packs",
  "Studio: upload pipeline и релизы версий",
  "Client v0: install / update / rollback",
  "Trust & Safety: rate limits, signed URLs, расширенный audit",
  "Импорт WARGM: только публичные метаданные, без копирования контента",
];

export default function DocsPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-10 pb-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <PageHero badge={t.docs.badge} title={t.docs.title} titleAccent={t.docs.titleAccent} subtitle={t.docs.subtitle}>
          <div className="flex flex-wrap gap-2">
            <Link href="/help">
              <Button variant="premium" size="sm">
                {t.help.title}
              </Button>
            </Link>
            <Link href="/admin/audit">
              <Button variant="outline" size="sm">
                {t.docs.audit}
              </Button>
            </Link>
            <Link href="/servers">
              <Button size="sm">{t.docs.servers}</Button>
            </Link>
          </div>
        </PageHero>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlowCard className="lg:col-span-7 p-6">
          <div className="text-xs text-fg-muted">{t.docs.endpoints}</div>
          <div className="mt-1 text-lg font-semibold">{t.docs.endpointsTitle}</div>
          <div className="mt-4 space-y-2">
            {ENDPOINTS.map(([k, v]) => (
              <div
                key={k}
                className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="shrink-0 text-fg">{k}</span>
                <span className="break-all font-mono text-xs text-fg-muted sm:text-right">{v}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        <GlowCard className="lg:col-span-5 p-6">
          <div className="text-xs text-fg-muted">{t.docs.roadmap}</div>
          <div className="mt-1 text-lg font-semibold">{t.docs.roadmapTitle}</div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-fg-muted">
            {ROADMAP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </GlowCard>

        <GlowCard className="lg:col-span-12 p-6">
          <Badge tone="info">{t.docs.devTips}</Badge>
          <div className="mt-2 text-lg font-semibold">{t.docs.devTipsTitle}</div>
          <p className="mt-2 text-sm leading-7 text-fg-muted">{t.docs.devTipsBody}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/guides" className="text-primary hover:underline">
              {t.nav.guides}
            </Link>
            <Link href="/studio" className="text-primary hover:underline">
              {t.nav.studio}
            </Link>
            <Link href="/billing" className="text-primary hover:underline">
              {t.nav.billing}
            </Link>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
