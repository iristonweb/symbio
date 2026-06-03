"use client";

import Link from "next/link";
import * as React from "react";
import { useAuth } from "@/components/AuthProvider";
import { hasRole } from "@/lib/auth";
import { fetchApi, platformApi } from "@/lib/platform-api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const [libraryCount, setLibraryCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    platformApi.library().then((r) => setLibraryCount(r.items.length)).catch(() => {});
  }, [user]);

  if (loading) return <p className="text-fg-muted">Загрузка…</p>;

  if (!user) {
    return (
      <div className="holo-panel rounded-[2rem] p-8 text-center">
        <h1 className="text-2xl font-semibold">Войдите в SYMBIO</h1>
        <Link href="/auth/login" className="mt-6 inline-block">
          <Button>Войти</Button>
        </Link>
      </div>
    );
  }

  const verifyEmail = async () => {
    await fetchApi("/auth/verify-email/request", { method: "POST" });
    alert("Письмо отправлено (в dev — смотрите логи API)");
    await refresh();
  };

  return (
    <div className="space-y-8 pb-14">
      <section className="holo-panel rounded-[2.5rem] p-8">
        <Badge tone="info">@{user.nickname}</Badge>
        <h1 className="mt-3 text-4xl font-semibold">{user.display_name || user.nickname}</h1>
        <p className="mt-2 text-fg-muted">{user.email}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.roles.map((r) => (
            <Badge key={r} tone="neutral">
              {r}
            </Badge>
          ))}
          {user.email_verified ? (
            <Badge tone="success">email verified</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={verifyEmail}>
              Подтвердить email
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/marketplace/library" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
          <div className="text-sm text-fg-muted">Библиотека</div>
          <div className="mt-2 text-3xl font-semibold">{libraryCount}</div>
        </Link>
        <Link href="/billing" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
          <div className="text-sm text-fg-muted">Тарифы</div>
          <div className="mt-2 text-lg font-semibold">Подписки</div>
        </Link>
        {hasRole(user, "creator") ? (
          <Link href="/studio" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
            <div className="text-sm text-fg-muted">Студия</div>
            <div className="mt-2 text-lg font-semibold">Мои продукты</div>
          </Link>
        ) : (
          <Link href="/studio" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
            <div className="text-sm text-fg-muted">Стать создателем</div>
            <div className="mt-2 text-lg font-semibold">Creator</div>
          </Link>
        )}
        {hasRole(user, "admin") ? (
          <Link href="/admin/users" className="organism-panel rounded-2xl p-5 hover:border-primary/30">
            <div className="text-sm text-fg-muted">Admin</div>
            <div className="mt-2 text-lg font-semibold">Пользователи</div>
          </Link>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="info">linked accounts</Badge>
          <h2 className="mt-3 text-2xl font-semibold">Аккаунты и доверие</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Подключите игровые аккаунты, чтобы SYMBIO точнее подбирал серверы, моды и совместимые сборки.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/auth/login" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/30">
              <div className="font-medium">Google</div>
              <div className="mt-1 text-xs text-fg-muted">email trust + быстрый вход</div>
            </Link>
            <Link href="/auth/login" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/30">
              <div className="font-medium">Steam</div>
              <div className="mt-1 text-xs text-fg-muted">игровая идентичность</div>
            </Link>
          </div>
        </div>

        <div className="holo-panel rounded-[2rem] p-6">
          <Badge tone="success">onboarding</Badge>
          <h2 className="mt-3 text-2xl font-semibold">Настройте свой Playstyle DNA</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Hardcore", "PvP", "Economy", "Roleplay", "MilSim", "SMP"].map((tag) => (
              <button key={tag} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left text-sm text-fg-muted transition hover:border-primary/30 hover:text-fg">
                {tag}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-fg-muted">
            Следующий шаг: эти сигналы будут питать персональную главную, рекомендации серверов и compatibility graph.
          </p>
        </div>
      </section>

      <section className="holo-panel rounded-[2rem] p-6">
        <Badge tone="warning">next best actions</Badge>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link href="/marketplace/compatibility" className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary/30">
            <div className="font-medium">Проверить совместимость</div>
            <p className="mt-2 text-xs text-fg-muted">Откройте граф модов и зависимостей.</p>
          </Link>
          <Link href="/marketplace" className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary/30">
            <div className="font-medium">Найти моды</div>
            <p className="mt-2 text-xs text-fg-muted">Пополните библиотеку verified-контентом.</p>
          </Link>
          <Link href="/studio" className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary/30">
            <div className="font-medium">Стать creator</div>
            <p className="mt-2 text-xs text-fg-muted">Опубликуйте первый продукт на модерацию.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
