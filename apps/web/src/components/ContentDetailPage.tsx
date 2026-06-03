"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { platformApi, type ApiArticle } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { articleTypeLabel, humanizeSlug } from "@/lib/display-labels";

export default function ContentDetailPage({
  basePath,
  listLabel,
}: {
  basePath: string;
  listLabel?: string;
}) {
  const { t, locale } = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = React.useState<ApiArticle | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    platformApi
      .article(slug)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton className="h-64" />;
  if (!article) return <p className="text-fg-muted">{t.common.notFound}</p>;

  const published = article.published_at
    ? new Date(article.published_at).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="max-w-3xl space-y-8 pb-14">
      <Link href={basePath} className="text-sm text-fg-muted hover:text-primary">
        {listLabel ?? t.content.back}
      </Link>

      <header className="holo-panel rounded-[2rem] p-8">
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">{articleTypeLabel(article.article_type)}</Badge>
          {published ? (
            <span className="text-xs text-fg-muted">
              {t.content.published}: {published}
            </span>
          ) : null}
        </div>
        <h1 className="mt-4 text-4xl font-semibold">{article.title}</h1>
        {article.excerpt ? <p className="mt-4 text-fg-muted">{article.excerpt}</p> : null}
        {article.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-fg-muted">
                {humanizeSlug(tag)}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="whitespace-pre-wrap rounded-[2rem] border border-white/10 bg-black/20 p-8 text-sm leading-7 text-fg-muted">
        {article.body}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/servers">
          <Button variant="outline" size="sm">
            {t.content.relatedServers}
          </Button>
        </Link>
        <Link href="/marketplace">
          <Button variant="outline" size="sm">
            {t.content.relatedMarket}
          </Button>
        </Link>
        {article.article_type === "guide" ? (
          <Link href="/studio">
            <Button size="sm">{t.studio.badge}</Button>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
