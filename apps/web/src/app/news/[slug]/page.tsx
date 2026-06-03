"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { platformApi, type ApiArticle } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function NewsArticlePage() {
  const { t } = useLocale();
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

  return (
    <article className="max-w-3xl space-y-6 pb-14">
      <Badge tone="info">{article.article_type}</Badge>
      <h1 className="text-4xl font-semibold">{article.title}</h1>
      <p className="text-fg-muted">{article.excerpt}</p>
      <div className="prose prose-invert whitespace-pre-wrap text-fg-muted">{article.body}</div>
    </article>
  );
}
