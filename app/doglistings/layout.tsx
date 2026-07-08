import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Dog listings");

export default function DogListingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
