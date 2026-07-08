import type { Metadata } from "next";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("Messages");

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
