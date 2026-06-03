/** Routes where Обзор / Эксперт changes the UI (tables vs cards). */
export function isExpertModeRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/servers") return true;
  if (pathname === "/studio") return true;
  if (pathname.startsWith("/games/") && pathname !== "/games") return true;
  return false;
}

export function viewModeFromSearch(search: string): "discover" | "expert" | null {
  const view = new URLSearchParams(search).get("view");
  if (view === "expert" || view === "discover") return view;
  return null;
}

export function withViewParam(pathname: string, search: string, mode: "discover" | "expert"): string {
  if (!isExpertModeRoute(pathname)) return pathname + search;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (mode === "expert") params.set("view", "expert");
  else params.delete("view");
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}
