"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { platformApi, fetchApi } from "@/lib/platform-api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function MarketplaceProductPage() {
  const params = useParams();
  const slug = String(params.slug);
  const [product, setProduct] = React.useState<Awaited<ReturnType<typeof platformApi.marketplaceProduct>> | null>(null);
  const [versions, setVersions] = React.useState<{ id: string; version: string; changelog?: string | null; files: { filename: string; size_bytes: number }[] }[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    platformApi.marketplaceProduct(slug).then(setProduct).catch(() => setProduct(null));
    fetchApi<{ items: { id: string; version: string; changelog?: string | null; files: { filename: string; size_bytes: number }[] }[] }>(`/marketplace/products/${slug}/versions`)
      .then((r) => setVersions(r.items))
      .catch(() => setVersions([]));
  }, [slug]);

  if (!product) return <p className="text-fg-muted">Загрузка…</p>;

  const addToCart = async () => {
    try {
      await fetchApi(`/marketplace/cart/items/${product.id}`, { method: "POST" });
      setToast("Добавлено в корзину");
    } catch {
      setToast("Войдите, чтобы добавить товар");
    }
    window.setTimeout(() => setToast(null), 2200);
  };

  const download = async () => {
    try {
      const r = await fetchApi<{ url: string }>(`/marketplace/products/${slug}/download`);
      window.location.href = r.url;
    } catch {
      setToast("Нужна лицензия или файл ещё не загружен");
      window.setTimeout(() => setToast(null), 2200);
    }
  };

  return (
    <div className="space-y-8 pb-14">
      <section className="holo-panel rounded-[2.5rem] p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgb(var(--primary)_/_0.3),transparent_35%),radial-gradient(circle_at_80%_20%,rgb(var(--violet)_/_0.24),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
            {product.cover_url ? <img src={product.cover_url} alt="" className="h-full w-full object-cover" /> : null}
            <div className="absolute inset-0 ecosystem-grid opacity-30" />
            <div className="absolute bottom-4 left-4 rounded-full border border-accent/30 bg-black/55 px-3 py-1 text-xs text-accent backdrop-blur-xl">
              verified creator
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{product.product_type}</Badge>
              {product.game_slug ? <Badge tone="neutral">{product.game_slug}</Badge> : null}
            </div>
            <h1 className="mt-4 text-4xl font-semibold">{product.title}</h1>
            <p className="mt-4 text-fg-muted">{product.description || product.short_description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fg-muted">
                  #{tag}
                </span>
              ))}
            </div>
            <p className="mt-6 text-3xl font-semibold text-gradient">
              {product.is_free ? "Бесплатно" : `${product.price_rub} ₽`}
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={addToCart}>В корзину</Button>
              <Button variant="premium" onClick={download}>
                Скачать
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await fetchApi(`/marketplace/products/${slug}/wishlist`, { method: "POST" });
                  setToast("Wishlist обновлён");
                  window.setTimeout(() => setToast(null), 2200);
                }}
              >
                Wishlist
              </Button>
            </div>
            <p className="mt-4 text-sm text-fg-muted">
              ★ {product.rating_avg.toFixed(1)} · {product.sales_count} продаж
            </p>
          </div>
        </div>
      </section>
      <section className="holo-panel rounded-[2rem] p-6">
        <h2 className="text-2xl font-semibold">Версии и файлы</h2>
        <div className="mt-4 space-y-3">
          {versions.map((version) => (
            <div key={version.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="font-medium">v{version.version}</div>
              {version.changelog ? <p className="mt-1 text-sm text-fg-muted">{version.changelog}</p> : null}
              <div className="mt-2 text-xs text-fg-muted">
                {version.files.length ? version.files.map((file) => file.filename).join(", ") : "Файлы ожидают загрузки"}
              </div>
            </div>
          ))}
          {versions.length === 0 ? <p className="text-sm text-fg-muted">Пока нет опубликованных файлов.</p> : null}
        </div>
      </section>
      {toast ? (
        <div className="fixed bottom-5 right-5 z-[90] rounded-2xl border border-primary/30 bg-black/80 px-4 py-3 text-sm text-fg shadow-glass backdrop-blur-xl">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
