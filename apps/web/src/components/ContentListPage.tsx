"use client";

import * as React from "react";
import Link from "next/link";
import { platformApi, type ApiArticle } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

type ContentSection = "guides" | "promocodes" | "news";

function formatDate(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function ContentListPage({
  titleKey,
  type,
  basePath,
  emptyActionHref,
}: {
  titleKey: ContentSection;
  type: string;
  basePath: string;
  emptyActionHref?: string;
}) {
  const { t, locale } = useLocale();
  const section = t[titleKey];
  const [articles, setArticles] = React.useState<ApiArticle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    platformApi
      .articles(type)
      .then((r) => setArticles(r.items))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [type]);

  const actionHref =
    emptyActionHref ??
    (titleKey === "guides" ? "/studio" : titleKey === "promocodes" ? "/news" : "/");

  return (
    <div className="space-y-10 pb-14">
      <PageHero
        badge={"badge" in section ? section.badge : undefined}
        title={section.title}
        titleAccent={"titleAccent" in section ? section.titleAccent : undefined}
        subtitle={"subtitle" in section ? section.subtitle : undefined}
      />

      {loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title={"emptyTitle" in section ? section.emptyTitle : t.common.noResults}
          description={"emptyDesc" in section ? section.emptyDesc : ""}
          actionLabel={"emptyAction" in section ? section.emptyAction : undefined}
          actionHref={actionHref}
        />
      ) : (
        <div className="grid gap-4">
          {articles.map((a) => {
            const date = formatDate(a.published_at, locale);
            return (
              <Link key={a.id} href={`${basePath}/${a.slug}`} className="holo-panel rounded-2xl p-6 transition hover:border-primary/30">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">{a.article_type}</Badge>
                  {date ? <span className="text-xs text-fg-muted">{date}</span> : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold">{a.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{a.excerpt}</p>
                {"readMore" in section ? (
                  <span className="mt-3 inline-block text-sm text-primary">{section.readMore} →</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
