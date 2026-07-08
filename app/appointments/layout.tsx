import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Appointments");

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
