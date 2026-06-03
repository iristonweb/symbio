"use client";

import Link from "next/link";
import * as React from "react";
import { platformApi, fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const { t } = useLocale();
  const [cart, setCart] = React.useState<{ items: { id: string; title: string; price_rub: number; is_free: boolean }[]; total_rub: number } | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = () => platformApi.cart().then(setCart).catch(() => setCart({ items: [], total_rub: 0 }));

  React.useEffect(() => {
    load();
  }, []);

  const checkout = async () => {
    try {
      await fetchApi("/marketplace/checkout", { method: "POST" });
      setMessage(t.marketplace.cartCheckoutOk);
      load();
    } catch {
      setMessage(t.marketplace.cartCheckoutFail);
    }
  };

  const removeItem = async (id: string) => {
    await fetchApi(`/marketplace/cart/items/${id}`, { method: "DELETE" });
    setMessage(t.marketplace.cartRemoved);
    load();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-14">
      <PageHero title={t.marketplace.cartTitle} subtitle={t.marketplace.cartEmptyDesc} />

      {!cart?.items.length ? (
        <EmptyState
          title={t.marketplace.cartEmpty}
          description={t.marketplace.cartEmptyDesc}
          actionLabel={t.marketplace.cartToMarket}
          actionHref="/marketplace"
        />
      ) : (
        <>
          <ul className="space-y-3">
            {cart.items.map((i) => (
              <li key={i.id} className="organism-panel flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
                <span className="font-medium">{i.title}</span>
                <div className="flex items-center gap-3">
                  <span>{i.is_free ? t.marketplace.free : `${i.price_rub} ₽`}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeItem(i.id)}>
                    {t.marketplace.cartRemove}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xl font-semibold">
            {t.marketplace.cartTotal}: {cart.total_rub} ₽
          </p>
          <Button onClick={checkout}>{t.marketplace.cartCheckout}</Button>
        </>
      )}
      {message ? <p className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary">{message}</p> : null}
    </div>
  );
}
