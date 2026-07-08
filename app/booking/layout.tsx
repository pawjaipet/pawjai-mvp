import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Booking workspace");

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
