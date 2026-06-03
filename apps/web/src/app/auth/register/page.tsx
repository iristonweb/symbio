"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlowCard } from "@/components/immersive/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [email, setEmail] = React.useState("creator@symbio.local");
  const [password, setPassword] = React.useState("creator123");
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
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Register failed");
      router.push("/auth/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <GlowCard className="p-6 sm:p-8 order-2 lg:order-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold">Create account</h1>
            <Badge tone="info">Creator</Badge>
          </div>
          <p className="mt-1 text-sm text-fg-muted">Join the creator economy</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-fg-muted">Email</label>
              <div className="mt-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-fg-muted">Password</label>
              <div className="mt-2">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-[rgba(255,80,110,0.35)] bg-[rgba(255,80,110,0.1)] p-3 text-sm text-[rgba(255,200,210,0.95)]">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" isLoading={busy}>
                Create account
              </Button>
              <Link href="/auth/login" className="text-sm text-fg-muted hover:text-fg">
                Sign in →
              </Link>
            </div>

            <p className="text-xs text-fg-muted font-mono">{apiUrl}/auth/register</p>
          </form>
        </GlowCard>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="order-1 lg:order-2"
        >
          <Badge tone="success">Creator onboarding</Badge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            Publish. <span className="text-gradient">Earn.</span> Grow.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-fg-muted">
            Upload mods, manage versions, track analytics and connect with server communities.
          </p>
          <Link href="/studio" className="mt-6 inline-block">
            <Button variant="outline">Open Creator Studio</Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
