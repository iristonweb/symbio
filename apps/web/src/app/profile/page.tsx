"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import * as React from "react";
import { useAuth } from "@/components/AuthProvider";
import { hasRole } from "@/lib/auth";
import { fetchApi, platformApi, type AuthIdentitiesInfo, type ReferralInfo } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

function ProfileContent() {
  const { t } = useLocale();
  const { user, loading, refresh, logout } = useAuth();
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "1";
  const [libraryCount, setLibraryCount] = React.useState(0);
  const [tokenBalance, setTokenBalance] = React.useState(0);
  const [referral, setReferral] = React.useState<ReferralInfo | null>(null);
  const [identities, setIdentities] = React.useState<AuthIdentitiesInfo | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    platformApi.library().then((r) => setLibraryCount(r.items.length)).catch(() => {});
    platformApi.tokenWallet().then((w) => setTokenBalance(w.balance_tokens)).catch(() => {});
    platformApi.referralInfo().then(setReferral).catch(() => {});
    platformApi.authIdentities().then(setIdentities).catch(() => {});
  }, [user]);

  const copyReferral = () => {
    if (!referral?.referral_url) return;
    void navigator.clipboard.writeText(referral.referral_url);
    setToast(t.rewards.copied);
  };

  if (loading) return <p className="text-fg-muted">{t.common.loading}</p>;

  if (!user) {
    return (
      <div className="pb-14">
        <PageHero title={t.profile.signInTitle} subtitle={t.profile.signInDesc}>
          <Link href="/auth/login">
            <Button>{t.profile.signIn}</Button>
          </Link>
        </PageHero>
      </div>
    );
  }

  const verifyEmail = async () => {
    await fetchApi("/auth/verify-email/request", { method: "POST" });
    setToast(t.profile.verifySent);
    await refresh();
  };

  const checklist = [
    { done: user.email_verified, label: t.profile.checklistEmail, href: "#verify" },
    { done: false, label: t.profile.checklistServer, href: "/servers" },
    { done: libraryCount > 0, label: t.profile.checklistMod, href: "/marketplace" },
    { done: hasRole(user, "creator"), label: t.profile.checklistStudio, href: "/studio" },
  ];

  return (
    <div className="space-y-8 pb-14">
      <PageHero badge={t.profile.badge} title={user.display_name || user.nickname} subtitle={user.email}>
        <div className="flex flex-wrap gap-2">
          {user.roles.map((r) => (
            <Badge key={r} tone="neutral">
              {r}
            </Badge>
          ))}
          {user.email_verified ? (
            <Badge tone="success">{t.profile.emailVerified}</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={verifyEmail}>
              {t.profile.verifyEmail}
            </Button>
          )}
        </div>
      </PageHero>

      {showWelcome ? (
        <section className="holo-panel rounded-[2rem] p-6">
          <Badge tone="success">{t.profile.welcomeTitle}</Badge>
          <p className="mt-2 text-sm text-fg-muted">{t.profile.welcomeDesc}</p>
          <ul className="mt-4 space-y-2">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <span className={item.done ? "text-accent" : "text-fg-muted"}>{item.done ? "✓" : "○"}</span>
                <Link href={item.href} className="hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/billing" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
          <div className="text-sm text-fg-muted">{t.rewards.tokenBalance}</div>
          <div className="mt-2 text-3xl font-semibold text-gradient">{tokenBalance}</div>
          <p className="mt-1 text-xs text-fg-muted">{t.rewards.spendTokens}</p>
        </Link>
        <Link href="/marketplace/library" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
          <div className="text-sm text-fg-muted">{t.profile.library}</div>
          <div className="mt-2 text-3xl font-semibold">{libraryCount}</div>
        </Link>
        <Link href="/billing" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
          <div className="text-sm text-fg-muted">{t.profile.billing}</div>
          <div className="mt-2 text-lg font-semibold">{t.profile.billingHint}</div>
        </Link>
        {hasRole(user, "creator") ? (
          <Link href="/studio" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
            <div className="text-sm text-fg-muted">{t.profile.studio}</div>
            <div className="mt-2 text-lg font-semibold">{t.profile.studioHint}</div>
          </Link>
        ) : (
          <Link href="/studio" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
            <div className="text-sm text-fg-muted">{t.profile.becomeCreator}</div>
            <p className="mt-2 text-xs text-fg-muted">{t.profile.becomeCreatorHint}</p>
          </Link>
        )}
        {hasRole(user, "admin") ? (
          <Link href="/admin/users" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
            <div className="text-sm text-fg-muted">{t.nav.admin}</div>
            <div className="mt-2 text-lg font-semibold">{t.admin.usersTitle}</div>
          </Link>
        ) : null}
      </section>

      {referral ? (
        <section className="holo-panel rounded-[2rem] p-6">
          <Badge tone="success">{t.rewards.referralTitle}</Badge>
          <p className="mt-2 text-sm text-fg-muted">{t.rewards.referralDesc}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">{referral.referral_url}</code>
            <Button size="sm" variant="outline" onClick={copyReferral}>
              {t.rewards.copyLink}
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="text-xs text-fg-muted">{t.rewards.qualified}</div>
              <div className="text-2xl font-semibold">{referral.qualified_count}</div>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="text-xs text-fg-muted">{t.rewards.pending}</div>
              <div className="text-2xl font-semibold">{referral.pending_count}</div>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="text-xs text-fg-muted">{t.rewards.progressToTop}</div>
              <div className="text-2xl font-semibold">
                {referral.qualified_count}/{referral.target_qualified}
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              style={{
                width: `${Math.min(100, (referral.qualified_count / referral.target_qualified) * 100)}%`,
              }}
            />
          </div>
        </section>
      ) : null}

      {identities ? (
        <section className="holo-panel rounded-[2rem] p-6">
          <Badge tone="info">{t.rewards.socialTitle}</Badge>
          <p className="mt-2 text-sm text-fg-muted">{t.rewards.socialDesc}</p>
          <p className="mt-4 text-lg font-semibold">
            {t.rewards.multiplier}: ×{identities.vote_multiplier.toFixed(2)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["google", "steam"] as const).map((p) => (
              <Badge key={p} tone={identities.social_providers.includes(p) ? "success" : "neutral"}>
                {p} {identities.social_providers.includes(p) ? "✓" : "—"}
              </Badge>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {!identities.social_providers.includes("steam") ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  platformApi.oauthStart("steam", { link: true }).then((r) => {
                    window.location.href = r.url;
                  })
                }
              >
                {t.auth.oauthSteam}
              </Button>
            ) : null}
            {!identities.social_providers.includes("google") ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  platformApi.oauthStart("google", { link: true }).then((r) => {
                    window.location.href = r.url;
                  })
                }
              >
                {t.auth.oauthGoogle}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="holo-panel rounded-[2rem] p-6">
        <Badge tone="warning">{t.profile.quickActions}</Badge>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link href="/servers" className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary/30">
            <div className="font-medium">{t.profile.servers}</div>
            <p className="mt-2 text-xs text-fg-muted">{t.servers.subtitle}</p>
          </Link>
          <Link href="/marketplace" className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary/30">
            <div className="font-medium">{t.profile.marketplace}</div>
            <p className="mt-2 text-xs text-fg-muted">{t.marketplace.subtitle}</p>
          </Link>
          <Link href="/guides" className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary/30">
            <div className="font-medium">{t.profile.guides}</div>
            <p className="mt-2 text-xs text-fg-muted">{t.guides.subtitle}</p>
          </Link>
        </div>
        <div className="mt-4 border-t border-white/10 pt-4">
          <Button size="sm" variant="outline" onClick={logout}>
            {t.profile.signOut}
          </Button>
        </div>
      </section>

      <Toast message={toast} tone="success" onClose={() => setToast(null)} />
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLocale();
  return (
    <Suspense fallback={<p className="text-fg-muted">{t.common.loading}</p>}>
      <ProfileContent />
    </Suspense>
  );
}
