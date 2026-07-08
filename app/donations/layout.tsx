import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Donations");

export default function DonationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
