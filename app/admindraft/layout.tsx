import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLaneGuard from "@/components/admin/AdminLaneGuard";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { noindexMetadata } from "@/utils/seo";
import { getShelterPortalTarget } from "@/utils/shelter-portal";

export const metadata: Metadata = noindexMetadata("Admin draft");

export default async function AdminDraftLayout({ children }: { children: React.ReactNode }) {
  const context = await getAdminAuthContext();

  if (context?.role === "shelter_admin") {
    redirect(await getShelterPortalTarget(context) ?? "/shelter");
  }

  return (
    <>
      <AdminLaneGuard />
      {children}
    </>
  );
}
