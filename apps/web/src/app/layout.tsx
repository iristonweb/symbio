import "./globals.css";
import type { Metadata } from "next";
import { Inter, Onest } from "next/font/google";
import { Shell } from "@/components/Shell";
import { UiModeProvider } from "@/components/UiModeProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { AuthProvider } from "@/components/AuthProvider";

const fontBody = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

const fontDisplay = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

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
    <html lang="ru" className={`dark ${fontBody.variable} ${fontDisplay.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <LocaleProvider>
          <AuthProvider>
            <UiModeProvider>
              <Shell>{children}</Shell>
            </UiModeProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
