import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { AdminAccountsPageContent } from "@/components/admin/AdminAccountsPageContent";

export const dynamic = "force-dynamic";

export default function AdminDraftAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  return (
    <AdminAccountsPageContent
      basePath="/admindraft"
      lockedFallback={<AdminDraftGate />}
      searchParams={searchParams}
    />
  );
}
