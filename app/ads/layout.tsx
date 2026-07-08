import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Ads");

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
