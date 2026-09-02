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
import { SITE_URL } from "@/utils/seo";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "PawJai",
  title: {
    default: "PawJai - Find Your Perfect Companion",
    template: "%s | PawJai",
  },
  description: "Thai dog adoption and matching platform.",
  openGraph: {
    title: "PawJai - Find Your Perfect Companion",
    description: "Thai dog adoption and matching platform.",
    siteName: "PawJai",
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PawJai - Find Your Perfect Companion",
    description: "Thai dog adoption and matching platform.",
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
