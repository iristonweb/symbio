"use client";

import Link from "next/link";
import * as React from "react";
import { useAuth } from "@/components/AuthProvider";
import { hasRole } from "@/lib/auth";
import { fetchApi, platformApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const { t } = useLocale();
  const { user, loading, refresh } = useAuth();
  const [libraryCount, setLibraryCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    platformApi.library().then((r) => setLibraryCount(r.items.length)).catch(() => {});
  }, [user]);

  if (loading) return <p className="text-fg-muted">{t.common.loading}</p>;

  if (!user) {
    return (
      <EmptySignIn t={t} />
    );
  }

  const verifyEmail = async () => {
    await fetchApi("/auth/verify-email/request", { method: "POST" });
    alert(t.profile.verifySent);
    await refresh();
  };

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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="mt-2 text-lg font-semibold">{t.profile.creator}</div>
          </Link>
        )}
        {hasRole(user, "admin") ? (
          <Link href="/admin/users" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
            <div className="text-sm text-fg-muted">Admin</div>
            <div className="mt-2 text-lg font-semibold">{t.admin.usersTitle}</div>
          </Link>
        ) : null}
      </section>

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
      </section>
    </div>
  );
}

function EmptySignIn({ t }: { t: ReturnType<typeof useLocale>["t"] }) {
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
