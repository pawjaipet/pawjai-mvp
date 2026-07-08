import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Adoption filters");

export default function FilterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
