import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Onboarding");

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
