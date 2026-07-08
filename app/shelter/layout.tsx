import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Shelter portal");

export default function ShelterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
