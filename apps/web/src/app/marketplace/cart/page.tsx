"use client";

import Link from "next/link";
import * as React from "react";
import { platformApi, fetchApi } from "@/lib/platform-api";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const [cart, setCart] = React.useState<{ items: { id: string; title: string; price_rub: number; is_free: boolean }[]; total_rub: number } | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = () => platformApi.cart().then(setCart).catch(() => setCart({ items: [], total_rub: 0 }));

  React.useEffect(() => {
    load();
  }, []);

  const checkout = async () => {
    try {
      await fetchApi("/marketplace/checkout", { method: "POST" });
      setMessage("Заказ оформлен. Лицензии добавлены в библиотеку.");
      load();
    } catch {
      setMessage("Не удалось оформить заказ. Проверьте авторизацию.");
    }
  };

  const removeItem = async (id: string) => {
    await fetchApi(`/marketplace/cart/items/${id}`, { method: "DELETE" });
    setMessage("Товар удалён из корзины.");
    load();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-14">
      <h1 className="text-3xl font-semibold">Корзина</h1>
      {!cart?.items.length ? (
        <p className="text-fg-muted">
          Пусто. <Link href="/marketplace" className="text-primary">В маркет</Link>
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {cart.items.map((i) => (
              <li key={i.id} className="organism-panel flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
                <div>
                  <span className="font-medium">{i.title}</span>
                  <div className="text-xs text-fg-muted">{i.is_free ? "Free license" : "Digital license"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span>{i.is_free ? "Free" : `${i.price_rub} ₽`}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeItem(i.id)}>
                    Убрать
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xl font-semibold">Итого: {cart.total_rub} ₽</p>
          <Button onClick={checkout}>Оформить заказ</Button>
        </>
      )}
      {message ? <p className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary">{message}</p> : null}
    </div>
  );
}
