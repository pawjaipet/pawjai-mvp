import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Donate");

export default function DonateDogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
