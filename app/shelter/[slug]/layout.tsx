import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Shelter workspace");

export default function ShelterWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
