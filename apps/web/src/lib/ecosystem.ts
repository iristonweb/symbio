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
    name: "Неоновый рубеж",
    game: "DayZ",
    region: "EU",
    online: 187,
    maxPlayers: 220,
    rating: 4.92,
    mood: "Агрессивный рост",
    pulse: 94,
    stability: 91,
    faction: "Синдикат Авроры",
    season: "Сезон 12: Биомороз",
    wipeIn: "03д 18ч",
    energy: 96,
    playstyle: ["Hardcore", "Faction wars", "Night raids"],
    accent: "green",
    lore: "Нестабильный рубеж: ночные штормы меняют границы фракций каждый вечер.",
  },
  {
    id: "void-sector",
    name: "Сектор Пустоты",
    game: "ARMA",
    region: "NA",
    online: 142,
    maxPlayers: 180,
    rating: 4.87,
    mood: "Тактическое давление",
    pulse: 83,
    stability: 88,
    faction: "Чёрная спираль",
    season: "Операция Затмение",
    wipeIn: "11д 04ч",
    energy: 82,
    playstyle: ["MilSim", "Command ops", "Persistent war"],
    accent: "cyan",
    lore: "Театр операций с постоянными фронтами, логистикой и координацией отрядов.",
  },
  {
    id: "ember-colony",
    name: "Угольная колония",
    game: "Rust",
    region: "EU",
    online: 264,
    maxPlayers: 300,
    rating: 4.78,
    mood: "Ресурсный бум",
    pulse: 98,
    stability: 74,
    faction: "Пепельные",
    season: "Раскол лавы",
    wipeIn: "19ч 26м",
    energy: 91,
    playstyle: ["PvP", "Economy", "Clan politics"],
    accent: "amber",
    lore: "Короткие вайпы, взрывная экономика и клановый контроль ресурсных жил.",
  },
  {
    id: "pulse-haven",
    name: "Пульс-гавань",
    game: "Minecraft",
    region: "ASIA",
    online: 96,
    maxPlayers: 140,
    rating: 4.95,
    mood: "Творческая гармония",
    pulse: 71,
    stability: 97,
    faction: "Призменный сад",
    season: "Изумрудные машины",
    wipeIn: "28д 09ч",
    energy: 73,
    playstyle: ["SMP", "Quests", "Roleplay"],
    accent: "magenta",
    lore: "Кооперативный мир: районы игроков растут вокруг сезонных квестов и ивентов.",
  },
];

export const activityFeed = [
  "Неоновый рубеж: всплеск активности в секторе C-12",
  "Угольная колония: финальная фаза до вайпа",
  "Сектор Пустоты: открыты слоты на выходные операции",
  "Пульс-гавань: ивент сообщества — 82% участия",
];

export const seasonEvents = [
  { label: "Всплеск сигнала", time: "Сейчас", progress: 18 },
  { label: "Натиск фракций", time: "12ч", progress: 42 },
  { label: "Мутация мира", time: "2д", progress: 66 },
  { label: "Окно вайпа", time: "3д", progress: 91 },
];

export function accentClass(accent: EcosystemServer["accent"]) {
  return {
    cyan: "from-cyan-300 via-sky-400 to-blue-500",
    green: "from-emerald-300 via-lime-300 to-cyan-300",
    magenta: "from-fuchsia-300 via-pink-400 to-cyan-300",
    amber: "from-amber-200 via-orange-400 to-fuchsia-400",
  }[accent];
}

/** Filter ids used on home hero — map to playstyle keywords in server data */
export const heroFilterIds = ["all", "hardcore", "milsim", "pvp", "smp", "economy", "roleplay"] as const;
export type HeroFilterId = (typeof heroFilterIds)[number];

export function serverMatchesHeroFilter(server: EcosystemServer, filterId: HeroFilterId): boolean {
  if (filterId === "all") return true;
  const hay = server.playstyle.join(" ").toLowerCase();
  const map: Record<Exclude<HeroFilterId, "all">, string[]> = {
    hardcore: ["hardcore"],
    milsim: ["milsim"],
    pvp: ["pvp", "raid"],
    smp: ["smp"],
    economy: ["economy"],
    roleplay: ["roleplay", "quest"],
  };
  return map[filterId].some((k) => hay.includes(k));
}

export function totalOnline(): number {
  return ecosystemServers.reduce((sum, s) => sum + s.online, 0);
}
