import AdminDraftGate from "@/components/admin/AdminDraftGate";
import AdminAdsPage from "@/app/admin/ads/AdminAdsPage";
import { isAdminDraftUnlocked } from "@/app/admindraft/actions";

export const dynamic = "force-dynamic";

export default async function AdminDraftAdsPage({
  searchParams,
}: {
  searchParams?: Promise<{ unlock?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const unlocked = await isAdminDraftUnlocked();

  if (!unlocked) {
    return <AdminDraftGate returnTo="/admindraft/ads" showError={resolvedSearchParams?.unlock === "failed"} />;
  }

  return <AdminAdsPage basePath="/admindraft" />;
}
