import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Sign in");

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
