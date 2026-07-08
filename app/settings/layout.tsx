import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Settings");

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
