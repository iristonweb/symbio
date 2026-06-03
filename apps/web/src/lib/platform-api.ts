const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type ServerSnapshot = {
  online: number;
  max_players: number;
  status: string;
  map?: string | null;
  version?: string | null;
  ping?: number | null;
  uptime_percent?: number | null;
  rank?: number | null;
  rank_delta?: number | null;
  created_at: string;
};

export type ApiServer = {
  id: string;
  game: string;
  name: string;
  slug?: string | null;
  host: string;
  port: number;
  join_url?: string | null;
  region?: string | null;
  mode?: string | null;
  description?: string | null;
  links: Record<string, string>;
  tags: Record<string, unknown>;
  rating: number;
  votes: number;
  claim_status: string;
  project_id?: string | null;
  source_url?: string | null;
  snapshot?: ServerSnapshot | null;
};

export type ApiGame = {
  id: string;
  slug: string;
  title: string;
  category: string;
  platforms: string[];
  short_description?: string | null;
  cover_url?: string | null;
  rating: number;
  server_count: number;
  genres: { slug: string; name: string }[];
};

export type ApiProject = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  links: Record<string, string>;
  game_slugs: string[];
  rating: number;
  votes: number;
  online_total: number;
  max_players_total: number;
  source_url?: string | null;
  servers?: ApiServer[];
};

export type ApiArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  article_type: string;
  tags: string[];
  game_slug?: string | null;
  published_at?: string | null;
  body?: string;
};

export type ApiPlan = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  credits_monthly: number;
  features: string[];
};

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const platformApi = {
  games: (params?: { category?: string; q?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.q) q.set("q", params.q);
    return fetchApi<{ items: ApiGame[]; total: number }>(`/games?${q}`);
  },
  game: (slug: string) => fetchApi<ApiGame>(`/games/${slug}`),
  projects: (params?: { game?: string; sort?: string }) => {
    const q = new URLSearchParams();
    if (params?.game) q.set("game", params.game);
    if (params?.sort) q.set("sort", params.sort);
    return fetchApi<{ items: ApiProject[]; total: number }>(`/projects?${q}`);
  },
  project: (slug: string) => fetchApi<ApiProject>(`/projects/${slug}`),
  servers: (params?: { game?: string; sort?: string; q?: string }) => {
    const q = new URLSearchParams();
    if (params?.game) q.set("game", params.game);
    if (params?.sort) q.set("sort", params.sort ?? "online");
    if (params?.q) q.set("q", params.q);
    return fetchApi<{ items: ApiServer[] }>(`/servers?${q}`);
  },
  server: (id: string) => fetchApi<ApiServer>(`/servers/${id}`),
  articles: (type?: string) =>
    fetchApi<{ items: ApiArticle[] }>(`/articles${type ? `?type=${type}` : ""}`),
  article: (slug: string) => fetchApi<ApiArticle>(`/articles/${slug}`),
  contests: () => fetchApi<{ items: { id: string; slug: string; title: string; prize_summary?: string }[] }>(`/contests`),
  plans: () => fetchApi<{ items: ApiPlan[] }>(`/billing/plans`),
  wallet: () => fetchApi<{ balance_credits: number; transactions: { amount: number; tx_type: string; description?: string; created_at: string }[] }>(`/billing/wallet`),
  search: (q: string, index = "servers") =>
    fetchApi<{ hits: { id: string; name?: string; title?: string }[] }>(`/search?q=${encodeURIComponent(q)}&index=${index}`),
};
