"use client";

import Link from "next/link";
import * as React from "react";
import { platformApi } from "@/lib/platform-api";

export default function LibraryPage() {
  const [items, setItems] = React.useState<Awaited<ReturnType<typeof platformApi.library>>["items"]>([]);

  React.useEffect(() => {
    platformApi.library().then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6 pb-14">
      <h1 className="text-3xl font-semibold">Моя библиотека</h1>
      {!items.length ? (
        <p className="text-fg-muted">Пока пусто.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <li key={i.id} className="organism-panel rounded-2xl p-4">
              <Link href={`/marketplace/${i.slug}`} className="font-medium hover:text-primary">
                {i.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
