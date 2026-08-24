import { AdminAccountsPageContent } from "@/components/admin/AdminAccountsPageContent";

export default function AdminAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; q?: string; tab?: string }>;
}) {
  return <AdminAccountsPageContent basePath="/admin" searchParams={searchParams} />;
}
