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
  moderation_status?: string | null;
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
  moderation_status?: string;
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
  audience?: string;
  price_monthly: number;
  credits_monthly: number;
  commission_percent?: number | null;
  features: string[];
};

export type ApiMarketplaceProduct = {
  id: string;
  slug: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  product_type: string;
  game_slug?: string | null;
  price_rub: number;
  is_free: boolean;
  cover_url?: string | null;
  tags: string[];
  moderation_status?: string;
  sales_count: number;
  rating_avg: number;
  rating_count: number;
  creator_id: string;
};

export type EcosystemRadar = {
  servers: {
    id: string;
    name: string;
    game: string;
    region?: string | null;
    mode?: string | null;
    online: number;
    max_players: number;
    status: string;
    href: string;
  }[];
  games: { slug: string; title: string; href: string }[];
  projects: { slug: string; name: string; href: string }[];
  products: { slug: string; title: string; price_rub: number; href: string }[];
  stats: { servers_online: number; server_count: number; game_count: number; product_count: number };
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
  myProjects: () => fetchApi<{ items: ApiProject[]; total: number }>("/projects/mine"),
  servers: (params?: {
    game?: string;
    sort?: string;
    q?: string;
    style?: string;
    fresh_minutes?: number;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.game) q.set("game", params.game);
    if (params?.sort) q.set("sort", params.sort ?? "online");
    if (params?.q) q.set("q", params.q);
    if (params?.style) q.set("style", params.style);
    q.set("fresh_minutes", String(params?.fresh_minutes ?? 10080));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return fetchApi<{ items: ApiServer[] }>(`/servers?${q}`);
  },
  server: (id: string) => fetchApi<ApiServer>(`/servers/${id}`),
  myServers: () => fetchApi<{ items: ApiServer[]; total: number }>("/servers/mine"),
  articles: (type?: string) =>
    fetchApi<{ items: ApiArticle[] }>(`/articles${type ? `?type=${type}` : ""}`),
  article: (slug: string) => fetchApi<ApiArticle>(`/articles/${slug}`),
  contests: () => fetchApi<{ items: { id: string; slug: string; title: string; prize_summary?: string }[] }>(`/contests`),
  contest: (slug: string) =>
    fetchApi<{
      id: string;
      slug: string;
      title: string;
      description?: string;
      prize_summary?: string;
      status: string;
    }>(`/contests/${slug}`),
  plans: (audience?: string) =>
    fetchApi<{ items: ApiPlan[] }>(`/billing/plans${audience ? `?audience=${audience}` : ""}`),
  wallet: () => fetchApi<{ balance_credits: number; transactions: { amount: number; tx_type: string; description?: string; created_at: string }[] }>(`/billing/wallet`),
  ecosystemRadar: () => fetchApi<EcosystemRadar>("/ecosystem/radar"),
  marketplaceProducts: (params?: { q?: string; game?: string; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.q) q.set("q", params.q);
    if (params?.game) q.set("game", params.game);
    if (params?.type) q.set("type", params.type);
    return fetchApi<{ items: ApiMarketplaceProduct[]; total: number }>(`/marketplace/products?${q}`);
  },
  marketplaceProduct: (slug: string) => fetchApi<ApiMarketplaceProduct>(`/marketplace/products/${slug}`),
  cart: () => fetchApi<{ items: ApiMarketplaceProduct[]; total_rub: number }>("/marketplace/cart"),
  library: () => fetchApi<{ items: (ApiMarketplaceProduct & { granted_at?: string })[] }>("/marketplace/library"),
  search: (q: string, index = "servers") =>
    fetchApi<{ hits: { id: string; name?: string; title?: string }[] }>(`/search?q=${encodeURIComponent(q)}&index=${index}`),
  voteServer: (serverId: string) =>
    fetchApi<VoteResult>(`/servers/${serverId}/vote`, { method: "POST" }),
  referralInfo: () =>
    fetchApi<ReferralInfo>("/auth/me/referral"),
  authIdentities: () =>
    fetchApi<AuthIdentitiesInfo>("/auth/me/identities"),
  tokenWallet: () =>
    fetchApi<{ balance_tokens: number; balance_credits: number }>("/auth/me/wallet"),
  oauthStart: (provider: "google" | "steam", options?: { link?: boolean }) => {
    const q = options?.link ? "?link=true" : "";
    return fetch(`${API_URL}/auth/${provider}/start${q}`, {
      headers: { ...authHeaders() },
    }).then(async (res) => {
      if (!res.ok) throw new Error(`OAuth start failed: ${res.status}`);
      return res.json() as Promise<{ url: string; state: string }>;
    });
  },
};

export type VoteResult = {
  vote_id: string;
  server_id: string;
  votes: number;
  rewarded: boolean;
  earned_tokens: number;
  multiplier: number;
  wallet_balance: number;
  next_vote_at: string | null;
  social_providers: string[];
  email_verified: boolean;
};

export type ReferralInfo = {
  code: string;
  referral_url: string;
  pending_count: number;
  qualified_count: number;
  target_qualified: number;
  top_plan_slug: string;
  top_plan_days: number;
  milestones_granted: number[];
  milestones: Record<string, number>;
};

export type AuthIdentitiesInfo = {
  providers: Record<string, { linked: boolean; email?: string | null }>;
  social_providers: string[];
  vote_multiplier: number;
  email_verified: boolean;
};
