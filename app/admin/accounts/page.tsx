import { AdminAccountsPageContent } from "@/components/admin/AdminAccountsPageContent";

export default function AdminAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  return <AdminAccountsPageContent basePath="/admin" searchParams={searchParams} />;
}
