import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Profile");

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
