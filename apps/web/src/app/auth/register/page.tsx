"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuroraBackground } from "@/components/aurora/AuroraBackground";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
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

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Register failed");
      }

      router.push("/auth/login");
    } catch (err: any) {
      setError(err?.message || "Register failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuroraBackground className="rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[rgba(7,10,15,0.55)] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
      <div className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold tracking-tight">Create account</div>
              <div className="mt-1 text-sm text-[color:var(--muted)]">
                Sprint 0 registration (email + password).
              </div>
            </div>
            <Badge tone="info">Auth</Badge>
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader className="pb-0">
              <div className="text-sm font-semibold">Sign up</div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-[color:var(--muted)]">Email</label>
                  <div className="mt-2">
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[color:var(--muted)]">Password</label>
                  <div className="mt-2">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-[rgba(255,80,110,0.35)] bg-[rgba(255,80,110,0.10)] p-3 text-sm text-[rgba(255,200,210,0.95)]">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" isLoading={busy} className="w-full sm:w-auto">
                    Create account
                  </Button>

                  <a
                    className="text-sm text-[color:var(--muted)] hover:text-[color:var(--fg)]"
                    href="/auth/login"
                  >
                    I already have an account →
                  </a>
                </div>

                <div className="text-xs text-[color:var(--muted)]">
                  API endpoint: <span className="font-mono">{apiUrl}/auth/register</span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuroraBackground>
  );
}
