import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { PawjaiProfileAdminPageContent } from "@/components/admin/PawjaiProfileAdminPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftPawjaiProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; unlock?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <PawjaiProfileAdminPageContent
      basePath="/admindraft"
      lockedFallback={<AdminDraftGate returnTo="/admindraft/pawjaiprofile" showError={resolvedSearchParams?.unlock === "failed"} />}
      searchParams={searchParams}
      showLock={false}
    />
  );
}
