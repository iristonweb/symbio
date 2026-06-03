export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  display_name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  roles: string[];
  capabilities: string[];
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("symbio_user");
}

export function cacheUser(user: AuthUser) {
  localStorage.setItem("symbio_user", JSON.stringify(user));
}

export function getCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("symbio_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function hasRole(user: AuthUser | null, role: string): boolean {
  return Boolean(user?.roles?.includes(role));
}

export function hasCapability(user: AuthUser | null, cap: string): boolean {
  return Boolean(user?.capabilities?.includes(cap));
}
