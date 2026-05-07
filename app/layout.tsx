import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import BottomNavBar from "@/components/BottomNavBar";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PawJai — Find Your Perfect Companion",
  description: "Thai dog adoption and matching platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="bg-[#f5f0e8] text-[#65584f] antialiased font-[family-name:var(--font-montserrat)]">
        <AuthProvider>
          <main className="min-h-screen pb-[70px]">{children}</main>
          <BottomNavBar />
        </AuthProvider>
      </body>
    </html>
  );
}
