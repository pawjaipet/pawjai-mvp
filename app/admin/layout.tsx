import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Admin");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
