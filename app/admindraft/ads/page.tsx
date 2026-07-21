import { redirect } from "next/navigation";
import AdminDraftGate from "@/components/admin/AdminDraftGate";
import AdminAdsPage from "@/app/admin/ads/AdminAdsPage";
import { getAdminAuthContext } from "@/utils/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminDraftAdsPage({
  searchParams,
}: {
  searchParams?: Promise<{ unlock?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const adminContext = await getAdminAuthContext();

  if (!adminContext) {
    return <AdminDraftGate returnTo="/admindraft/ads" showError={resolvedSearchParams?.unlock === "failed"} />;
  }

  if (!adminContext.isGlobalAdmin) {
    redirect("/admindraft");
  }

  return <AdminAdsPage basePath="/admindraft" />;
}
