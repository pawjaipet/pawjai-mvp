import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Adopted dogs");

export default function AdoptedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
