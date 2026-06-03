"use client";

import * as React from "react";
import Link from "next/link";
import { platformApi, type ApiArticle } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function NewsPage() {
  const { t } = useLocale();
  const [articles, setArticles] = React.useState<ApiArticle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    platformApi
      .articles("news")
      .then((r) => setArticles(r.items))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-14">
      <h1 className="text-4xl font-semibold">
        {t.news.title} <span className="text-gradient">{t.news.titleAccent}</span>
      </h1>
      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid gap-4">
          {articles.map((a) => (
            <Link key={a.id} href={`/news/${a.slug}`} className="holo-panel rounded-2xl p-6">
              <Badge tone="info">{a.article_type}</Badge>
              <h2 className="mt-2 text-xl font-semibold">{a.title}</h2>
              <p className="mt-2 text-sm text-fg-muted">{a.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
