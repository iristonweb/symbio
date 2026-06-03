"use client";

import * as React from "react";
import Link from "next/link";
import { platformApi, fetchApi, type ApiPlan } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";

type AudienceId = "user" | "site_owner" | "creator";

export default function BillingPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [audience, setAudience] = React.useState<AudienceId>("user");
  const [plans, setPlans] = React.useState<ApiPlan[]>([]);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [txs, setTxs] = React.useState<{ amount: number; tx_type: string; description?: string; created_at: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState<string | null>(null);

  const audiences: { id: AudienceId; label: string }[] = [
    { id: "user", label: t.billing.audienceUser },
    { id: "site_owner", label: t.billing.audienceOwner },
    { id: "creator", label: t.billing.audienceCreator },
  ];

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    Promise.all([
      platformApi.plans(audience),
      token ? platformApi.wallet().catch(() => null) : Promise.resolve(null),
    ])
      .then(([p, w]) => {
        setPlans(p.items.filter((pl) => !pl.slug.includes("legacy")));
        if (w) {
          setBalance(w.balance_credits);
          setTxs(w.transactions);
        }
      })
      .finally(() => setLoading(false));
  }, [audience]);

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
        <p className="mt-3 text-fg-muted">{t.billing.subtitle}</p>
        <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          {t.billing.mockBanner}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-fg-muted">
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">{t.billing.trustLicense}</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">{t.billing.trustRub}</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">{t.billing.trustRevenue}</span>
        </div>
        <p className="mt-3 text-sm text-fg-muted">{t.rewards.spendTokens}</p>
        {balance !== null ? (
          <p className="mt-4 text-lg">
            {t.billing.balance}: <strong>{balance}</strong> {t.billing.tokensLabel ?? t.billing.credits}
          </p>
        ) : (
          <p className="mt-4 text-fg-muted">{t.billing.signInWallet}</p>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {audiences.map((a) => (
          <Chip key={a.id} active={audience === a.id} onClick={() => setAudience(a.id)}>
            {a.label}
          </Chip>
        ))}
      </div>

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
                {plan.price_monthly === 0 ? t.billing.free : `${plan.price_monthly} ₽${t.billing.perMonth}`}
              </p>
              <p className="text-xs text-fg-muted">
                {plan.credits_monthly} {t.billing.credits}
                {plan.commission_percent != null ? ` · ${plan.commission_percent}%` : ""}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-fg-muted">
                {plan.features.slice(0, 5).map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {user ? (
                <Button
                  className="mt-6 w-full"
                  size="sm"
                  variant={plan.price_monthly > 0 ? "premium" : "secondary"}
                  onClick={() => checkout(plan.slug)}
                >
                  {plan.price_monthly === 0 ? t.billing.activate : t.billing.subscribe}
                </Button>
              ) : (
                <Link href="/auth/login" className="mt-6 block">
                  <Button className="w-full" size="sm" variant="premium">
                    {t.billing.signInToSubscribe}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && plans.length > 0 ? (
        <section className="holo-panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold">{t.billing.compareTitle}</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-fg-muted">
                <tr>
                  <th className="py-3">Plan</th>
                  <th className="py-3 text-right">Price</th>
                  <th className="py-3 text-right">{t.billing.credits}</th>
                  <th className="py-3 text-right">%</th>
                  <th className="py-3">Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="py-3 font-medium">{plan.name}</td>
                    <td className="py-3 text-right">{plan.price_monthly === 0 ? "0 ₽" : `${plan.price_monthly} ₽`}</td>
                    <td className="py-3 text-right">{plan.credits_monthly}</td>
                    <td className="py-3 text-right">{plan.commission_percent != null ? `${plan.commission_percent}%` : "—"}</td>
                    <td className="py-3 text-fg-muted">{plan.features.slice(0, 4).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="holo-panel rounded-[2rem] p-6">
        <h2 className="text-2xl font-semibold">{t.billing.faqTitle}</h2>
        <ul className="mt-4 space-y-3 text-sm text-fg-muted">
          <li>· {t.billing.faqCancel}</li>
          <li>· {t.billing.faqRefund}</li>
          <li>· {t.billing.faqCredits}</li>
          <li>· {t.billing.faqPromote}</li>
        </ul>
      </section>

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
