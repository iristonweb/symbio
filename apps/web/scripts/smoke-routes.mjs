/**
 * Smoke check: required App Router pages exist (no server required).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, "..", "src", "app");

const required = [
  "page.tsx",
  "about/page.tsx",
  "contact/page.tsx",
  "help/page.tsx",
  "legal/privacy/page.tsx",
  "legal/terms/page.tsx",
  "not-found.tsx",
  "sitemap.ts",
  "robots.ts",
  "contests/[slug]/page.tsx",
  "admin/layout.tsx",
];

let failed = 0;
for (const route of required) {
  const full = path.join(appDir, route);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: ${route}`);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log(`smoke-routes: OK (${required.length} paths)`);
