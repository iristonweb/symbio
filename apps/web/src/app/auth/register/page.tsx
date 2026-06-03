"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function RegisterForm() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const { setAuthToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [autoNickname, setAutoNickname] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nickname: autoNickname ? null : nickname,
          auto_nickname: autoNickname,
          referral_code: refCode || null,
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || t.auth.registerFailed);
      const data = await res.json();
      await setAuthToken(data.access_token);
      router.push("/profile?welcome=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.auth.registerFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg pb-16">
      <GlowCard className="p-6 sm:p-8">
        <Badge tone="info">{t.auth.creatorBadge}</Badge>
        <h1 className="mt-3 text-2xl font-semibold">
          {t.auth.creatorTitle} <span className="text-gradient">{t.auth.creatorTitleAccent}</span>
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{t.auth.creatorDesc}</p>
        {refCode ? (
          <p className="mt-2 rounded-xl border border-primary/25 bg-primary/10 p-3 text-xs text-primary">
            {t.rewards.referralDesc}
          </p>
        ) : null}
        <h2 className="mt-6 text-lg font-semibold">{t.auth.register}</h2>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-fg-muted">{t.auth.email}</label>
            <Input className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-fg-muted">{t.auth.password}</label>
            <Input className="mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input type="checkbox" checked={autoNickname} onChange={(e) => setAutoNickname(e.target.checked)} />
            {t.auth.autoNickname}
          </label>
          {!autoNickname ? (
            <div>
              <label className="text-xs text-fg-muted">{t.auth.nickname}</label>
              <Input className="mt-2" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" isLoading={busy} className="w-full">
            {t.auth.submitRegister}
          </Button>
        </form>
        <Link href="/auth/login" className="mt-4 block text-center text-sm text-fg-muted hover:text-fg">
          {t.auth.signInLink}
        </Link>
      </GlowCard>
    </div>
  );
}

export default function RegisterPage() {
  const { t } = useLocale();
  return (
    <Suspense fallback={<p className="text-fg-muted">{t.common.loading}</p>}>
      <RegisterForm />
    </Suspense>
  );
}
