"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import * as React from "react";
import { useAuth } from "@/components/AuthProvider";
import { hasRole } from "@/lib/auth";
import {
  fetchApi,
  platformApi,
  type AuthIdentitiesInfo,
  type ReferralInfo,
  type SteamLibraryInfo,
} from "@/lib/platform-api";
import { gameLabel } from "@/lib/display-labels";
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
  const [steamLibrary, setSteamLibrary] = React.useState<SteamLibraryInfo | null>(null);
  const [steamBusy, setSteamBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    platformApi.library().then((r) => setLibraryCount(r.items.length)).catch(() => {});
    platformApi.tokenWallet().then((w) => setTokenBalance(w.balance_tokens)).catch(() => {});
    platformApi.referralInfo().then(setReferral).catch(() => {});
    platformApi.authIdentities().then(setIdentities).catch(() => {});
    platformApi.steamLibrary().then(setSteamLibrary).catch(() => setSteamLibrary(null));
  }, [user]);

  const syncSteamLibrary = async () => {
    setSteamBusy(true);
    try {
      const lib = await platformApi.steamLibrarySync();
      setSteamLibrary(lib);
      setToast(t.profile.steamLibrarySync);
    } catch {
      setToast(t.common.notFound);
    } finally {
      setSteamBusy(false);
    }
  };

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="info">{t.profile.steamLibraryTitle}</Badge>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t.profile.steamLibraryDesc}</p>
          </div>
          {identities?.social_providers.includes("steam") ? (
            <Button size="sm" variant="outline" onClick={syncSteamLibrary} disabled={steamBusy}>
              {steamBusy ? t.common.loading : t.profile.steamLibrarySync}
            </Button>
          ) : null}
        </div>

        {!identities?.social_providers.includes("steam") ? (
          <p className="mt-4 text-sm text-fg-muted">{t.profile.steamLibraryLinkFirst}</p>
        ) : null}

        {steamLibrary?.linked && steamLibrary.visibility === "private" ? (
          <p className="mt-4 text-sm text-amber-200/90">{t.profile.steamLibraryPrivate}</p>
        ) : null}

        {steamLibrary?.linked && steamLibrary.symbio_games.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-fg-muted">
              {t.profile.steamLibraryMatched}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {steamLibrary.symbio_games.map((g) => (
                <Link
                  key={g.slug}
                  href={`/servers?game=${g.slug}`}
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-4 transition hover:border-primary/40"
                >
                  <div className="font-medium">{g.title}</div>
                  <p className="mt-1 text-xs text-fg-muted">
                    {g.server_count} {t.nav.servers.toLowerCase()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {steamLibrary?.linked && steamLibrary.games.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-fg-muted">
              {t.profile.steamLibraryAllGames} ({steamLibrary.game_count})
            </h3>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {steamLibrary.games.map((g) => (
                <div
                  key={g.appid}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {g.img_icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.img_icon_url} alt="" className="h-8 w-8 rounded-lg" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[10px]">
                        {g.appid}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{g.name}</div>
                      {g.symbio_matched && g.symbio_slug ? (
                        <Link href={`/games/${g.symbio_slug}`} className="text-xs text-primary hover:text-fg">
                          {gameLabel(g.symbio_slug)} · SYMBIO
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-fg-muted">
                    <div>
                      {Math.round(g.playtime_forever / 60)} {t.profile.steamLibraryHours}
                    </div>
                    {g.playtime_2weeks > 0 ? (
                      <div>
                        +{Math.round(g.playtime_2weeks / 60)} {t.profile.steamLibraryPlaytime2w}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : steamLibrary?.linked ? (
          <p className="mt-4 text-sm text-fg-muted">{t.profile.steamLibraryEmpty}</p>
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
