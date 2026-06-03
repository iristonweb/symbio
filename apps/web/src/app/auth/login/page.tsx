"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { setAuthToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const isDev = process.env.NODE_ENV === "development";
  const [email, setEmail] = React.useState(isDev ? "admin@symbio.dev" : "");
  const [password, setPassword] = React.useState(isDev ? "admin123" : "");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const startOAuth = async (provider: "google" | "steam") => {
    const r = await fetch(`${apiUrl}/auth/${provider}/start`);
    const data = await r.json();
    window.location.href = data.url;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      if (!res.ok) throw new Error((await res.text()) || t.auth.loginFailed);
      const data = await res.json();
      await setAuthToken(data.access_token);
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.auth.loginFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <Badge tone="info">{t.auth.terminal}</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {t.auth.signInTitle} <span className="text-gradient">SYMBIO</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-fg-muted">{t.auth.signInDesc}</p>
          <p className="mt-3 max-w-md text-xs text-fg-muted">{t.rewards.socialDesc}</p>
        </motion.div>

        <GlowCard className="p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">{t.auth.login}</h1>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-fg-muted">{t.auth.email}</label>
              <Input className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-fg-muted">{t.auth.password}</label>
              <Input className="mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error ? (
              <div className="rounded-2xl border border-[rgba(255,80,110,0.35)] bg-[rgba(255,80,110,0.1)] p-3 text-sm">
                {error}
              </div>
            ) : null}
            <Button type="submit" isLoading={busy} className="w-full">
              {t.auth.submitLogin}
            </Button>
          </form>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => startOAuth("google")}>
              Google
            </Button>
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => startOAuth("steam")}>
              Steam
            </Button>
          </div>
          {isDev ? <p className="mt-3 text-center text-xs text-fg-muted">{t.auth.devHint}</p> : null}
          <Link href="/auth/register" className="mt-4 block text-center text-sm text-fg-muted hover:text-fg">
            {t.auth.createLink}
          </Link>
        </GlowCard>
      </div>
    </div>
  );
}
