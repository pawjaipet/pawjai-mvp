import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { AdminUserAnalyticsPageContent } from "@/components/admin/AdminUserAnalyticsPageContent";

export const dynamic = "force-dynamic";

export default async function AdminDraftAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; unlock?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <AdminUserAnalyticsPageContent
      lockedFallback={(
        <AdminDraftGate
          returnTo={`/admindraft/analytics${resolvedSearchParams?.range ? `?range=${encodeURIComponent(resolvedSearchParams.range)}` : ""}`}
          showError={resolvedSearchParams?.unlock === "failed"}
        />
      )}
      searchParams={searchParams}
    />
  );
}
