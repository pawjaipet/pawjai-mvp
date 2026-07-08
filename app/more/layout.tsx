import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("More");

export default function MoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
