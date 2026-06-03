"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { platformApi, fetchApi, type ApiMarketplaceProduct } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FilterPanel, FilterRow } from "@/components/ui/FilterPanel";
import { Input } from "@/components/ui/Input";
import { GlowCard } from "@/components/immersive/GlowCard";
import { gameLabel, humanizeSlug, productTypeLabel } from "@/lib/display-labels";

const TYPES = ["", "mod", "addon", "resource_pack", "plugin", "service"];

export default function MarketplacePage() {
  const { t } = useLocale();
  const [items, setItems] = React.useState<ApiMarketplaceProduct[]>([]);
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [cartCount, setCartCount] = React.useState(0);
  const [toast, setToast] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    platformApi
      .marketplaceProducts({ q: q || undefined, type: type || undefined })
      .then((r) => setItems(r.items))
      .finally(() => setLoading(false));
  }, [q, type]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    platformApi.cart().then((cart) => setCartCount(cart.items.length)).catch(() => setCartCount(0));
  }, []);

  const addToCart = async (id: string) => {
    try {
      await fetchApi(`/marketplace/cart/items/${id}`, { method: "POST" });
      const cart = await platformApi.cart();
      setCartCount(cart.items.length);
      setToast(t.marketplace.addedToCart);
      window.setTimeout(() => setToast(null), 2200);
    } catch {
      setToast(t.marketplace.signInToCart);
      window.setTimeout(() => setToast(null), 2200);
    }
  };

  return (
    <div className="space-y-10 pb-14">
      <PageHero badge={t.marketplace.badge} title={t.marketplace.title} titleAccent={t.marketplace.titleAccent} subtitle={t.marketplace.subtitle}>
        <div className="flex flex-wrap gap-3">
          <Link href="/marketplace/cart">
            <Button variant="premium">
              {t.marketplace.cart}
              {cartCount > 0 ? ` · ${cartCount}` : ""}
            </Button>
          </Link>
          <Link href="/marketplace/library">
            <Button variant="secondary">{t.marketplace.library}</Button>
          </Link>
          <Link href="/marketplace/compatibility">
            <Button variant="outline">{t.marketplace.compatibility}</Button>
          </Link>
        </div>
      </PageHero>

      <FilterPanel>
        <FilterRow label={t.common.search}>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder={t.marketplace.searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 min-w-0 flex-1"
        />
        <Button variant="outline" onClick={load}>
          {t.marketplace.search}
        </Button>
          </div>
        </FilterRow>
        <FilterRow label={t.marketplace.typeLabel}>
        {TYPES.map((typeId) => (
          <Chip key={typeId || "all"} active={type === typeId} onClick={() => setType(typeId)}>
            {typeId ? productTypeLabel(typeId) : t.marketplace.typeAll}
          </Chip>
        ))}
        </FilterRow>
      </FilterPanel>

      {loading ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : items.length === 0 ? (
        <EmptyState
          title={t.marketplace.emptyTitle}
          description={t.marketplace.emptyDesc}
          actionLabel={t.marketplace.emptyAction}
          actionHref="/studio"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <GlowCard key={item.id} className="p-5">
              <div className="relative -mx-2 -mt-2 mb-4 h-36 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_15%,rgb(var(--primary)_/_0.28),transparent_32%),radial-gradient(circle_at_85%_25%,rgb(var(--violet)_/_0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                {item.cover_url ? (
                  <Image
                    src={item.cover_url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover opacity-85"
                    unoptimized
                  />
                ) : null}
                <div className="absolute inset-0 ecosystem-grid opacity-30" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <Badge tone="info">{productTypeLabel(item.product_type)}</Badge>
                  {item.game_slug ? <Badge tone="neutral">{gameLabel(item.game_slug)}</Badge> : null}
                </div>
                <div
                  className="absolute bottom-3 right-3 rounded-full border border-accent/30 bg-black/55 px-3 py-1 text-[11px] text-accent backdrop-blur-xl"
                  title={t.marketplace.verifiedDesc}
                >
                  {t.marketplace.verified}
                </div>
              </div>
              <h2 className="mt-3 text-lg font-semibold">
                <Link href={`/marketplace/${item.slug}`} className="hover:text-primary">
                  {item.title}
                </Link>
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{item.short_description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-fg-muted">
                    {humanizeSlug(tag)}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-2xl font-semibold text-gradient">
                {item.is_free ? t.marketplace.free : `${item.price_rub} ₽`}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                ★ {item.rating_avg.toFixed(1)} · {item.sales_count} {t.marketplace.sales}
              </p>
              <div className="mt-4 flex gap-2">
                <Link href={`/marketplace/${item.slug}`}>
                  <Button size="sm" variant="outline">
                    {t.marketplace.open}
                  </Button>
                </Link>
                <Button size="sm" onClick={() => addToCart(item.id)}>
                  {t.marketplace.addToCart}
                </Button>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
      {toast ? (
        <div className="fixed bottom-24 right-5 z-[90] rounded-2xl border border-primary/30 bg-black/80 px-4 py-3 text-sm text-fg shadow-glass backdrop-blur-xl lg:bottom-5">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
