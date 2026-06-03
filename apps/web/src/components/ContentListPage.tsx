"use client";

import * as React from "react";
import Link from "next/link";
import { platformApi, type ApiArticle } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ContentListPage({
  titleKey,
  type,
  basePath,
}: {
  titleKey: "guides" | "promocodes";
  type: string;
  basePath: string;
}) {
  const { t } = useLocale();
  const title = t[titleKey].title;
  const [articles, setArticles] = React.useState<ApiArticle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    platformApi
      .articles(type)
      .then((r) => setArticles(r.items))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="space-y-8 pb-14">
      <h1 className="text-4xl font-semibold">{title}</h1>
      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid gap-4">
          {articles.map((a) => (
            <Link key={a.id} href={`${basePath}/${a.slug}`} className="holo-panel rounded-2xl p-6">
              <h2 className="text-xl font-semibold">{a.title}</h2>
              <p className="mt-2 text-sm text-fg-muted">{a.excerpt}</p>
            </Link>
          ))}
          {articles.length === 0 ? <p className="text-fg-muted">{t.common.noResults}</p> : null}
        </div>
      )}
    </div>
  );
}
