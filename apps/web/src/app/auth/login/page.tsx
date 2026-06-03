"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [email, setEmail] = React.useState("admin@symbio.local");
  const [password, setPassword] = React.useState("admin123");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });
      if (!res.ok) throw new Error((await res.text()) || t.auth.loginFailed);
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      router.push("/admin/audit");
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
          <div className="mt-8 space-y-3">
            {[t.auth.verified, t.auth.auditTrail, t.auth.rbac].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <GlowCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <h1 className="text-2xl font-semibold">{t.auth.login}</h1>
            <Badge tone="info">{t.auth.login}</Badge>
          </div>
          <p className="mt-1 text-sm text-fg-muted lg:hidden">{t.auth.adminAccess}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-fg-muted">{t.auth.email}</label>
              <div className="mt-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-fg-muted">{t.auth.password}</label>
              <div className="mt-2">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-[rgba(255,80,110,0.35)] bg-[rgba(255,80,110,0.1)] p-3 text-sm text-[rgba(255,200,210,0.95)]">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" isLoading={busy}>
                {t.auth.submitLogin}
              </Button>
              <Link href="/auth/register" className="text-sm text-fg-muted hover:text-fg">
                {t.auth.createLink}
              </Link>
            </div>
          </form>
        </GlowCard>
      </div>
    </div>
  );
}
