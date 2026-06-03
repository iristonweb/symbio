import type { translations } from "@/lib/i18n/translations";

type LocaleStrings = typeof translations.ru;
import type { ServerExpertTableLabels } from "@/components/ui/ServerExpertTable";

export function expertTableLabels(t: LocaleStrings): ServerExpertTableLabels {
  return {
    server: t.nav.servers,
    game: t.nav.games,
    region: t.common.region,
    mode: t.common.mode,
    online: t.servers.sortOnline,
    ping: t.mode.colPing,
    map: t.mode.colMap,
    rank: t.servers.sortRank,
    rankDelta: t.mode.colRankDelta,
    uptime: t.common.uptime,
    load: t.mode.colLoad,
    rating: t.servers.sortRating,
    status: t.common.statusLabel,
    empty: t.servers.empty,
  };
}
