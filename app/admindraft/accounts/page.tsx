import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { AdminAccountsPageContent } from "@/components/admin/AdminAccountsPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; unlock?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <AdminAccountsPageContent
      basePath="/admindraft"
      lockedFallback={<AdminDraftGate returnTo="/admindraft/accounts" showError={resolvedSearchParams?.unlock === "failed"} />}
      searchParams={searchParams}
    />
  );
}
