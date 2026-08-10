import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/layout/AppShell";
import { cookies } from "next/headers";
import { Locale } from "@/lib/i18n/types";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GuestFlow",
  description: "Operations-first internal application for guest journey management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('gf-locale')?.value as Locale;
  const locale: Locale = (localeCookie === 'ar' || localeCookie === 'en') ? localeCookie : 'en';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={`${inter.className} text-slate-900 bg-slate-50 antialiased`}>
        <LocaleProvider initialLocale={locale}>
          <Providers>
            <AppShell>
              {children}
            </AppShell>
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
