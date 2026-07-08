import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Schedule");

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
