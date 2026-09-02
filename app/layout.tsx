import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ProductAnalyticsTracker from "@/components/analytics/ProductAnalyticsTracker";
import BottomNavBar from "@/components/BottomNavBar";
import NavigationFeedback from "@/components/NavigationFeedback";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import JsonLd from "@/components/seo/JsonLd";
import { pawjaiOrganizationJsonLd, pawjaiWebsiteJsonLd } from "@/utils/json-ld";
import { BRAND_SEARCH_ALIASES, SITE_URL } from "@/utils/seo";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "PawJai",
  keywords: [
    ...BRAND_SEARCH_ALIASES,
    "adopt dog Thailand",
    "dog adoption Thailand",
    "dog adoption Bangkok",
    "Thai shelter dogs",
    "rescue dog Thailand",
  ],
  title: {
    default: "PawJai - Find Your Perfect Companion",
    template: "%s | PawJai",
  },
  description: "PawJai Pet is a Thai dog adoption and shelter-matching platform for people searching for adoptable dogs, rescue dogs, and shelter partners.",
  openGraph: {
    title: "PawJai - Find Your Perfect Companion",
    description: "PawJai Pet helps people in Thailand discover adoptable dogs and connect with shelter partners.",
    siteName: "PawJai",
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PawJai - Find Your Perfect Companion",
    description: "PawJai Pet helps people in Thailand discover adoptable dogs and connect with shelter partners.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="bg-[#f5f0e8] text-[#65584f] antialiased font-[family-name:var(--font-montserrat)]">
        <JsonLd data={[pawjaiOrganizationJsonLd(), pawjaiWebsiteJsonLd()]} />
        <LanguageProvider>
          <AuthProvider>
            <ProductAnalyticsTracker />
            <NavigationFeedback />
            <main className="min-h-screen pb-[70px]">{children}</main>
            <BottomNavBar />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
