"use client";

import Link from "next/link";
import * as React from "react";
import { platformApi, fetchApi, type ApiMarketplaceProduct } from "@/lib/platform-api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { GlowCard } from "@/components/immersive/GlowCard";

const TYPES = ["", "mod", "addon", "resource_pack", "plugin", "service"];

export default function MarketplacePage() {
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
      setToast("Добавлено в корзину");
      window.setTimeout(() => setToast(null), 2200);
    } catch {
      setToast("Войдите, чтобы добавить товар");
      window.setTimeout(() => setToast(null), 2200);
    }
  };

  return (
    <div className="space-y-10 pb-14">
      <section className="holo-panel rounded-[2.5rem] p-8">
        <Badge tone="info">SYMBIO Marketplace</Badge>
        <h1 className="mt-4 text-4xl font-semibold">
          Моды, аддоны и <span className="text-gradient">дополнения</span>
        </h1>
        <p className="mt-3 max-w-2xl text-fg-muted">
          Покупайте контент от verified creators. Продажи, лицензии и библиотека — в одной экосистеме.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/marketplace/cart">
            <Button variant="premium">Корзина{cartCount > 0 ? ` · ${cartCount}` : ""}</Button>
          </Link>
          <Link href="/marketplace/library">
            <Button variant="secondary">Моя библиотека</Button>
          </Link>
          <Link href="/marketplace/compatibility">
            <Button variant="outline">Compatibility Graph</Button>
          </Link>
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Поиск модов…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={load}>
          Найти
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Chip key={t || "all"} active={type === t} onClick={() => setType(t)}>
            {t || "Все"}
          </Chip>
        ))}
      </div>

      {loading ? (
        <p className="text-fg-muted">Загрузка…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <GlowCard key={item.id} className="p-5">
              <div className="relative -mx-2 -mt-2 mb-4 h-36 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_15%,rgb(var(--primary)_/_0.28),transparent_32%),radial-gradient(circle_at_85%_25%,rgb(var(--violet)_/_0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                {item.cover_url ? (
                  <img src={item.cover_url} alt="" className="h-full w-full object-cover opacity-85" />
                ) : null}
                <div className="absolute inset-0 ecosystem-grid opacity-30" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <Badge tone="info">{item.product_type}</Badge>
                  {item.game_slug ? <Badge tone="neutral">{item.game_slug}</Badge> : null}
                </div>
                <div className="absolute bottom-3 right-3 rounded-full border border-accent/30 bg-black/55 px-3 py-1 text-[11px] text-accent backdrop-blur-xl">
                  verified creator
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
                    #{tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-2xl font-semibold text-gradient">
                {item.is_free ? "Бесплатно" : `${item.price_rub} ₽`}
              </p>
              <p className="mt-1 text-xs text-fg-muted">★ {item.rating_avg.toFixed(1)} · {item.sales_count} продаж</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/marketplace/${item.slug}`}>
                  <Button size="sm" variant="outline">
                    Открыть
                  </Button>
                </Link>
                <Button size="sm" onClick={() => addToCart(item.id)}>
                  В корзину
                </Button>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
      {toast ? (
        <div className="fixed bottom-5 right-5 z-[90] rounded-2xl border border-primary/30 bg-black/80 px-4 py-3 text-sm text-fg shadow-glass backdrop-blur-xl">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
