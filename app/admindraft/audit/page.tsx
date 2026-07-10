import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { AdminAuditPageContent } from "@/components/admin/AdminAuditPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ unlock?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <AdminAuditPageContent
      basePath="/admindraft"
      lockedFallback={<AdminDraftGate returnTo="/admindraft/audit" showError={resolvedSearchParams?.unlock === "failed"} />}
    />
  );
}
