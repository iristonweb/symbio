"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { platformApi, fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { gameLabel, humanizeSlug, productTypeLabel } from "@/lib/display-labels";

export default function MarketplaceProductPage() {
  const { t } = useLocale();
  const params = useParams();
  const slug = String(params.slug);
  const [product, setProduct] = React.useState<Awaited<ReturnType<typeof platformApi.marketplaceProduct>> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [versions, setVersions] = React.useState<{ id: string; version: string; changelog?: string | null; files: { filename: string; size_bytes: number }[] }[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    platformApi
      .marketplaceProduct(slug)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    fetchApi<{ items: { id: string; version: string; changelog?: string | null; files: { filename: string; size_bytes: number }[] }[] }>(`/marketplace/products/${slug}/versions`)
      .then((r) => setVersions(r.items))
      .catch(() => setVersions([]));
  }, [slug]);

  if (loading) return <Skeleton className="h-96" />;
  if (!product) {
    return (
      <EmptyState
        title={t.marketplace.productNotFound}
        description={t.marketplace.emptyDesc}
        actionLabel={t.common.backToCatalog}
        actionHref="/marketplace"
      />
    );
  }

  const addToCart = async () => {
    try {
      await fetchApi(`/marketplace/cart/items/${product.id}`, { method: "POST" });
      setToast(t.marketplace.addedToCart);
    } catch {
      setToast(t.marketplace.signInToCart);
    }
    window.setTimeout(() => setToast(null), 2200);
  };

  const download = async () => {
    try {
      const r = await fetchApi<{ url: string }>(`/marketplace/products/${slug}/download`);
      window.location.href = r.url;
    } catch {
      setToast(t.marketplace.downloadError);
      window.setTimeout(() => setToast(null), 2200);
    }
  };

  return (
    <div className="space-y-8 pb-14">
      <Link href="/marketplace" className="text-sm text-fg-muted hover:text-primary">
        ← {t.marketplace.title}
      </Link>

      <section className="holo-panel rounded-[2.5rem] p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgb(var(--primary)_/_0.3),transparent_35%),radial-gradient(circle_at_80%_20%,rgb(var(--violet)_/_0.24),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
            {product.cover_url ? <img src={product.cover_url} alt="" className="h-full w-full object-cover" /> : null}
            <div className="absolute inset-0 ecosystem-grid opacity-30" />
            <div
              className="absolute bottom-4 left-4 rounded-full border border-accent/30 bg-black/55 px-3 py-1 text-xs text-accent backdrop-blur-xl"
              title={t.marketplace.verifiedDesc}
            >
              {t.marketplace.verified}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{productTypeLabel(product.product_type)}</Badge>
              {product.game_slug ? <Badge tone="neutral">{gameLabel(product.game_slug)}</Badge> : null}
            </div>
            <h1 className="mt-4 text-4xl font-semibold">{product.title}</h1>
            <p className="mt-4 text-fg-muted">{product.description || product.short_description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fg-muted">
                  {humanizeSlug(tag)}
                </span>
              ))}
            </div>
            <p className="mt-6 text-3xl font-semibold text-gradient">
              {product.is_free ? t.marketplace.free : `${product.price_rub} ₽`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={addToCart}>{t.marketplace.addToCart}</Button>
              <Button variant="premium" onClick={download}>
                {t.marketplace.download}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await fetchApi(`/marketplace/products/${slug}/wishlist`, { method: "POST" });
                  setToast(t.marketplace.wishlistOk);
                  window.setTimeout(() => setToast(null), 2200);
                }}
              >
                {t.marketplace.wishlist}
              </Button>
              <Link href="/marketplace/compatibility">
                <Button variant="ghost">{t.marketplace.compatibility}</Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-fg-muted">
              ★ {product.rating_avg.toFixed(1)} · {product.sales_count} {t.marketplace.sales}
            </p>
            <p className="mt-2 text-xs text-fg-muted">{t.marketplace.refunds}</p>
          </div>
        </div>
      </section>

      <section className="holo-panel rounded-[2rem] p-6">
        <h2 className="text-xl font-semibold">{t.marketplace.authorCard}</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Creator · {product.creator_id.slice(0, 8)}
        </p>
        <p className="mt-2 text-xs text-fg-muted">{t.marketplace.verifiedDesc}</p>
      </section>

      <section className="holo-panel rounded-[2rem] p-6">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <p className="mt-2 text-sm text-fg-muted">{t.marketplace.reviewsSoon}</p>
      </section>

      <section className="holo-panel rounded-[2rem] p-6">
        <h2 className="text-2xl font-semibold">{t.marketplace.versions}</h2>
        <div className="mt-4 space-y-3">
          {versions.map((version) => (
            <div key={version.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="font-medium">v{version.version}</div>
              {version.changelog ? <p className="mt-1 text-sm text-fg-muted">{version.changelog}</p> : null}
              <div className="mt-2 text-xs text-fg-muted">
                {version.files.length ? version.files.map((file) => file.filename).join(", ") : "—"}
              </div>
            </div>
          ))}
          {versions.length === 0 ? <p className="text-sm text-fg-muted">{t.marketplace.noVersions}</p> : null}
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-24 right-5 z-[90] rounded-2xl border border-primary/30 bg-black/80 px-4 py-3 text-sm text-fg shadow-glass backdrop-blur-xl lg:bottom-5">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
