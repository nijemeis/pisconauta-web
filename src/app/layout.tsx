import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Archivo, Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";
import { getUser } from "@/lib/auth";
import { buildMe } from "@/lib/me";
import { getRates } from "@/lib/rates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Currency } from "@/lib/types";
import { SessionProvider } from "@/components/session";
import { AgeGate, Footer, TabBar, TopBar } from "@/components/shell";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-archivo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: { default: t("meta.title"), template: "%s · PISCONAUTA" }, description: t("meta.description") };
}
export const viewport: Viewport = { themeColor: "#14100E", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const user = await getUser();
  // Account preference wins; otherwise the cookie; otherwise the inline script follows prefers-color-scheme.
  const theme = jar.get("pn_theme")?.value ?? (user ? user.theme : undefined);
  const [me, rates, locale] = await Promise.all([buildMe(user), getRates(), getLocale()]);
  const saved = jar.get("pn_currency")?.value ?? user?.currency;
  const currency: Currency = saved === "USD" || saved === "EUR" ? saved : "PEN";
  return (
    <html lang={locale === "en" ? "en" : "es-PE"} data-theme={theme} className={`${cormorant.variable} ${archivo.variable} ${plex.variable}`} suppressHydrationWarning>
      <head>
        {!theme && <script dangerouslySetInnerHTML={{ __html: `if(matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.dataset.theme="light"` }} />}
      </head>
      <body>
        <SessionProvider initial={me} initialCurrency={currency} initialLocale={locale} rates={rates}>
          <TopBar />
          {children}
          <Footer />
          <TabBar />
          <AgeGate passed={jar.get("pn_age")?.value === "1"} />
        </SessionProvider>
      </body>
    </html>
  );
}
