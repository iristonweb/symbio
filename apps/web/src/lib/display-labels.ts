export function humanizeSlug(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const gameLabels: Record<string, string> = {
  "7-days-to-die": "7 Days to Die",
  "ark-survival-evolved": "ARK: Survival Evolved",
  "arma-3": "ARMA 3",
  "counter-strike-2": "Counter-Strike 2",
  "cs-go": "Counter-Strike: GO",
  dayz: "DayZ",
  "garrys-mod": "Garry's Mod",
  minecraft: "Minecraft",
  "project-zomboid": "Project Zomboid",
  rust: "Rust",
  scum: "SCUM",
  squad: "Squad",
  unturned: "Unturned",
};

const categoryLabels: Record<string, string> = {
  browser: "Браузерная игра",
  client: "Клиентская игра",
  mobile: "Мобильная игра",
  sandbox: "Песочница",
  shooter: "Шутер",
  survival: "Выживание",
};

const productTypeLabels: Record<string, string> = {
  addon: "Аддон",
  mod: "Мод",
  plugin: "Плагин",
  resource_pack: "Resource pack",
  service: "Услуга",
};

const articleTypeLabels: Record<string, string> = {
  guide: "Гайд",
  news: "Новость",
  promocode: "Промокод",
};

const txTypeLabels: Record<string, string> = {
  checkout: "Покупка тарифа",
  credit: "Начисление",
  debit: "Списание",
  promotion: "Продвижение",
  reward: "Награда",
  vote_reward: "Награда за голос",
};

export function gameLabel(slug: string | null | undefined): string {
  if (!slug) return "Любая игра";
  return gameLabels[slug] ?? humanizeSlug(slug);
}

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return "Все категории";
  return categoryLabels[value] ?? humanizeSlug(value);
}

export function productTypeLabel(value: string | null | undefined): string {
  if (!value) return "Все типы";
  return productTypeLabels[value] ?? humanizeSlug(value);
}

export function articleTypeLabel(value: string | null | undefined): string {
  if (!value) return "Материал";
  return articleTypeLabels[value] ?? humanizeSlug(value);
}

export function txTypeLabel(value: string | null | undefined): string {
  if (!value) return "Операция";
  return txTypeLabels[value] ?? humanizeSlug(value);
}

export function featureLabel(feature: string): string {
  const known: Record<string, string> = {
    "1_project": "1 проект с базовым листингом",
    "3_projects": "До 3 проектов и расширенная карточка",
    "10_projects": "До 10 проектов и промо-кампании",
    analytics: "Аналитика продаж и аудитории",
    analytics_basic: "Базовая аналитика сервера",
    analytics_pro: "Расширенная аналитика и отчёты",
    api_export: "API/export для сети серверов",
    basic_listing: "Базовое размещение сервера",
    bundles: "Bundles и наборы продуктов",
    collections: "Коллекции и расширенная библиотека",
    commission_7: "Комиссия маркета 7%",
    commission_10: "Комиссия маркета 10%",
    commission_15: "Комиссия маркета 15%",
    early_deals: "Ранний доступ к скидкам",
    extended_card: "Расширенная карточка проекта",
    notifications: "Уведомления о событиях и скидках",
    promo_campaigns: "Промо-кампании в радаре",
    promo_tools: "Инструменты продвижения creator",
    priority_moderation: "Приоритетная модерация",
    priority_support: "Приоритетная поддержка",
    publish_after_moderation: "Публикация после модерации",
    team: "Командный доступ",
    unlimited_projects: "Неограниченное число проектов",
    wishlist: "Wishlist и сохранённые товары",
  };
  return known[feature] ?? humanizeSlug(feature);
}
