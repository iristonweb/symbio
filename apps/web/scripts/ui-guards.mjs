/**
 * Static UI guard for regressions that are easy to reintroduce without browser tests.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const checks = [
  {
    file: "src/components/Shell.tsx",
    mustInclude: ["nav-scroll", "ml-auto flex shrink-0", "variant=\"secondary\""],
  },
  {
    file: "src/components/immersive/HeroScene.tsx",
    mustInclude: ["/symbio-hero-world-radar.png"],
  },
  {
    file: "src/components/ui/FilterPanel.tsx",
    mustInclude: ["FilterPanel", "FilterRow"],
  },
  {
    file: "src/app/page.tsx",
    mustNotInclude: ["expert telemetry", "Live ecosystem snapshot", "Open full server matrix"],
  },
  {
    file: "src/app/admin/dashboard/page.tsx",
    mustNotInclude: ["No product momentum yet.", "Queue test", "Server performance"],
  },
  {
    file: "src/app/studio/page.tsx",
    mustNotInclude: ["gameSlug", "Approved / Pending", "placeholder=\"tags\""],
  },
];

let failed = 0;

for (const check of checks) {
  const full = path.join(root, check.file);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: ${check.file}`);
    failed++;
    continue;
  }
  const text = fs.readFileSync(full, "utf8");
  for (const needle of check.mustInclude ?? []) {
    if (!text.includes(needle)) {
      console.error(`MISSING "${needle}" in ${check.file}`);
      failed++;
    }
  }
  for (const needle of check.mustNotInclude ?? []) {
    if (text.includes(needle)) {
      console.error(`FORBIDDEN "${needle}" in ${check.file}`);
      failed++;
    }
  }
}

if (failed > 0) process.exit(1);
console.log("ui-guards: OK");
