"use client";

import Link from "next/link";
import * as React from "react";
import { platformApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";

export default function LibraryPage() {
  const { t } = useLocale();
  const [items, setItems] = React.useState<Awaited<ReturnType<typeof platformApi.library>>["items"]>([]);

  React.useEffect(() => {
    platformApi.library().then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-8 pb-14">
      <PageHero title={t.marketplace.libraryTitle} subtitle={t.marketplace.libraryEmptyDesc} />

      {!items.length ? (
        <EmptyState
          title={t.marketplace.libraryEmpty}
          description={t.marketplace.libraryEmptyDesc}
          actionLabel={t.marketplace.libraryToMarket}
          actionHref="/marketplace"
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <li key={i.id} className="organism-panel rounded-2xl p-4">
              <Link href={`/marketplace/${i.slug}`} className="font-medium hover:text-primary">
                {i.title}
              </Link>
              {i.granted_at ? (
                <p className="mt-1 text-xs text-fg-muted">
                  {new Date(i.granted_at).toLocaleDateString()}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
