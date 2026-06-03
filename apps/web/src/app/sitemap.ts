import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://symbio.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/games",
    "/servers",
    "/projects",
    "/marketplace",
    "/news",
    "/guides",
    "/promocodes",
    "/contests",
    "/billing",
    "/studio",
    "/about",
    "/contact",
    "/help",
    "/legal/privacy",
    "/legal/terms",
    "/docs",
  ];

  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
