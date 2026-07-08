import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Documents");

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
