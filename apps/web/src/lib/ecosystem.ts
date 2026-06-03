export type EcosystemServer = {
  id: string;
  name: string;
  game: string;
  region: string;
  online: number;
  maxPlayers: number;
  rating: number;
  mood: string;
  pulse: number;
  stability: number;
  faction: string;
  season: string;
  wipeIn: string;
  energy: number;
  playstyle: string[];
  accent: "cyan" | "green" | "magenta" | "amber";
  lore: string;
};

export const ecosystemServers: EcosystemServer[] = [
  {
    id: "neon-frontier",
    name: "Neon Frontier",
    game: "DayZ",
    region: "EU",
    online: 187,
    maxPlayers: 220,
    rating: 4.92,
    mood: "Aggressive expansion",
    pulse: 94,
    stability: 91,
    faction: "Aurora Syndicate",
    season: "Season 12: Biofrost",
    wipeIn: "03d 18h",
    energy: 96,
    playstyle: ["Hardcore survival", "Faction wars", "Night raids"],
    accent: "green",
    lore: "A volatile frontier ecosystem where bioluminescent storms reshape faction territory every night.",
  },
  {
    id: "void-sector",
    name: "Void Sector",
    game: "ARMA",
    region: "NA",
    online: 142,
    maxPlayers: 180,
    rating: 4.87,
    mood: "Strategic pressure",
    pulse: 83,
    stability: 88,
    faction: "Black Helix",
    season: "Operation Eclipse",
    wipeIn: "11d 04h",
    energy: 82,
    playstyle: ["MilSim", "Command ops", "Persistent war"],
    accent: "cyan",
    lore: "A command-grade theatre with persistent fronts, logistics pressure, and coordinated operations.",
  },
  {
    id: "ember-colony",
    name: "Ember Colony",
    game: "Rust",
    region: "EU",
    online: 264,
    maxPlayers: 300,
    rating: 4.78,
    mood: "Resource bloom",
    pulse: 98,
    stability: 74,
    faction: "Ashborne",
    season: "Molten Divide",
    wipeIn: "19h 26m",
    energy: 91,
    playstyle: ["Raids", "Economy", "Clan politics"],
    accent: "amber",
    lore: "A heated colony with short wipe cycles, explosive market shifts, and clan-controlled resource veins.",
  },
  {
    id: "pulse-haven",
    name: "Pulse Haven",
    game: "Minecraft",
    region: "ASIA",
    online: 96,
    maxPlayers: 140,
    rating: 4.95,
    mood: "Creative harmony",
    pulse: 71,
    stability: 97,
    faction: "Prism Garden",
    season: "Verdant Machines",
    wipeIn: "28d 09h",
    energy: 73,
    playstyle: ["SMP", "Quests", "Creator events"],
    accent: "magenta",
    lore: "A cooperative world where player-built districts grow like living biomes around seasonal quests.",
  },
];

export const activityFeed = [
  "Neon Frontier triggered a territory surge in Sector C-12",
  "Ember Colony wipe timer entered final high-pressure phase",
  "Void Sector opened command slots for weekend operation",
  "Pulse Haven community event reached 82% participation",
];

export const seasonEvents = [
  { label: "Signal bloom", time: "Now", progress: 18 },
  { label: "Faction surge", time: "12h", progress: 42 },
  { label: "World mutation", time: "2d", progress: 66 },
  { label: "Wipe window", time: "3d", progress: 91 },
];

export function accentClass(accent: EcosystemServer["accent"]) {
  return {
    cyan: "from-cyan-300 via-sky-400 to-blue-500",
    green: "from-emerald-300 via-lime-300 to-cyan-300",
    magenta: "from-fuchsia-300 via-pink-400 to-cyan-300",
    amber: "from-amber-200 via-orange-400 to-fuchsia-400",
  }[accent];
}
