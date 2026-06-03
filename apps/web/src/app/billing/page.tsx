"use client";

import * as React from "react";
import { platformApi, fetchApi, type ApiPlan } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BillingPage() {
  const { t } = useLocale();
  const [plans, setPlans] = React.useState<ApiPlan[]>([]);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [txs, setTxs] = React.useState<{ amount: number; tx_type: string; description?: string; created_at: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    Promise.all([
      platformApi.plans(),
      token ? platformApi.wallet().catch(() => null) : Promise.resolve(null),
    ])
      .then(([p, w]) => {
        setPlans(p.items);
        if (w) {
          setBalance(w.balance_credits);
          setTxs(w.transactions);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const checkout = async (planSlug: string) => {
    setMsg(null);
    try {
      const r = await fetchApi<{ status: string; plan: string }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan_slug: planSlug, provider: "mock" }),
      });
      setMsg(`${t.billing.checkoutOk}: ${r.status} — ${r.plan}`);
      const w = await platformApi.wallet();
      setBalance(w.balance_credits);
      setTxs(w.transactions);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : t.studio.signInFirst);
    }
  };

  return (
    <div className="space-y-10 pb-14">
      <section className="holo-panel rounded-[2.5rem] p-8">
        <Badge tone="info">{t.billing.badge}</Badge>
        <h1 className="mt-4 text-4xl font-semibold">
          {t.billing.title} <span className="text-gradient">{t.billing.titleAccent}</span>
        </h1>
        {balance !== null ? (
          <p className="mt-4 text-lg">
            {t.billing.balance}: <strong>{balance}</strong> {t.billing.credits}
          </p>
        ) : (
          <p className="mt-4 text-fg-muted">{t.billing.signInWallet}</p>
        )}
      </section>

      {msg ? <p className="text-sm text-primary">{msg}</p> : null}

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="organism-panel rounded-[2rem] p-6">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-sm text-fg-muted">{plan.description}</p>
              <p className="mt-4 text-3xl font-semibold text-gradient">
                {plan.price_monthly === 0 ? t.billing.free : `${plan.price_monthly} ${t.billing.perMonth}`}
              </p>
              <p className="text-xs text-fg-muted">
                {plan.credits_monthly} {t.billing.credits}
              </p>
              <Button className="mt-6 w-full" size="sm" onClick={() => checkout(plan.slug)}>
                {plan.price_monthly === 0 ? t.billing.activate : t.billing.subscribe}
              </Button>
            </div>
          ))}
        </div>
      )}

      {txs.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold">{t.billing.transactions}</h2>
          <div className="mt-4 space-y-2">
            {txs.map((tx, i) => (
              <div key={i} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
                <span className={tx.amount >= 0 ? "text-accent" : "text-fg-muted"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>{" "}
                {tx.tx_type} — {tx.description ?? ""}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
