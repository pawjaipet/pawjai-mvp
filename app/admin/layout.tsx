import type { Metadata } from "next";
import AdminLaneGuard from "@/components/admin/AdminLaneGuard";
import { noindexMetadata } from "@/utils/seo";

export const metadata: Metadata = noindexMetadata("PawJai Admin");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminLaneGuard />
      {children}
    </>
  );
}
