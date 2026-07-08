import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Admin draft");

export default function AdminDraftLayout({ children }: { children: React.ReactNode }) {
  return children;
}
