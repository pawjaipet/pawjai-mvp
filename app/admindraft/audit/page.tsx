import { AdminAuditPageContent } from "@/components/admin/AdminAuditPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftAuditPage({
  searchParams: _searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  return (
    <AdminAuditPageContent
      basePath="/admindraft"
    />
  );
}
