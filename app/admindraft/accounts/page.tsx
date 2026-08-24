import { AdminAccountsPageContent } from "@/components/admin/AdminAccountsPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; q?: string; tab?: string }>;
}) {
  return (
    <AdminAccountsPageContent
      basePath="/admindraft"
      searchParams={searchParams}
    />
  );
}
