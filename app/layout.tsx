import type { Metadata } from "next";
import "./globals.css";
import BottomNavBar from "@/components/BottomNavBar";

export const metadata: Metadata = {
  title: "PawJai — Find Your Perfect Companion",
  description: "Thai dog adoption and matching platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <BottomNavBar />
      </body>
    </html>
  );
}
