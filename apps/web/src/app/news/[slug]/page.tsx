"use client";

import ContentDetailPage from "@/components/ContentDetailPage";
import { useLocale } from "@/components/LocaleProvider";

export default function NewsArticlePage() {
  const { t } = useLocale();
  return <ContentDetailPage basePath="/news" listLabel={`${t.content.back} (${t.news.title})`} />;
}
