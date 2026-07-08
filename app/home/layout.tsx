import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Home redirect");

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
