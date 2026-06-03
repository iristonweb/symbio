"use client";

import * as React from "react";
import { fetchApi } from "@/lib/platform-api";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { PageHero } from "@/components/ui/PageHero";
import { hasRole } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type AdminUser = {
  id: string;
  email: string;
  nickname: string;
  roles: string[];
  email_verified: boolean;
};

const ALL_ROLES = ["user", "creator", "site_owner", "moderator", "admin"];

export default function AdminUsersPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [items, setItems] = React.useState<AdminUser[]>([]);

  React.useEffect(() => {
    if (!user || !hasRole(user, "admin")) return;
    fetchApi<{ items: AdminUser[] }>("/admin/users").then((r) => setItems(r.items));
  }, [user]);

  if (!user || !hasRole(user, "admin")) {
    return <p className="text-fg-muted">{t.admin.usersOnly}</p>;
  }

  const toggleRole = async (u: AdminUser, role: string) => {
    const roles = u.roles.includes(role) ? u.roles.filter((r) => r !== role) : [...u.roles, role];
    await fetchApi(`/admin/users/${u.id}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles }),
    });
    const refreshed = await fetchApi<{ items: AdminUser[] }>("/admin/users");
    setItems(refreshed.items);
  };

  return (
    <div className="space-y-6 pb-14">
      <PageHero badge="Admin" title={t.admin.usersTitle} subtitle={t.admin.auditSubtitle} />
      <div className="space-y-4">
        {items.map((u) => (
          <div key={u.id} className="organism-panel rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-medium">@{u.nickname}</span>
                <span className="ml-2 text-sm text-fg-muted">{u.email}</span>
              </div>
              {u.email_verified ? <Badge tone="success">verified</Badge> : <Badge tone="warning">unverified</Badge>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant={u.roles.includes(role) ? "primary" : "outline"}
                  onClick={() => toggleRole(u, role)}
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
