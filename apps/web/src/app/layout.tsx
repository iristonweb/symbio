import "./globals.css";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { UiModeProvider } from "@/components/UiModeProvider";
import { LocaleProvider } from "@/components/LocaleProvider";

export const metadata: Metadata = {
  title: "SYMBIO — экосистема игровых серверов",
  description:
    "Мониторинг серверов, проекты сообществ, рейтинги и кабинет владельца — премиальная игровая экосистема SYMBIO.",
  icons: {
    icon: "/symbio-logo.png",
    shortcut: "/symbio-logo.png",
    apple: "/symbio-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <LocaleProvider>
          <UiModeProvider>
            <Shell>{children}</Shell>
          </UiModeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
