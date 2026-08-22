import { AdminUserAnalyticsPageContent } from "@/components/admin/AdminUserAnalyticsPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  return (
    <AdminUserAnalyticsPageContent
      searchParams={searchParams}
    />
  );
}
