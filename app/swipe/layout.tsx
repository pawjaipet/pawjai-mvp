import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Swipe");

export default function SwipeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
