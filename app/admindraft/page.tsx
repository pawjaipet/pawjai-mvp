import { redirect } from "next/navigation";
import AdminReorgDraftPanel from "@/components/admin/AdminReorgDraftPanel";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import { loadAdminDraftData } from "@/utils/admin-draft-data";

export const dynamic = "force-dynamic";

function buildAdminDraftReturnTo(searchParams?: { bookingView?: string; role?: string; shelter?: string; view?: string; visitBucket?: string }) {
  const params = new URLSearchParams();

  if (searchParams?.shelter) params.set("shelter", searchParams.shelter);
  if (searchParams?.view && searchParams.view !== "about") params.set("view", searchParams.view);
  if (searchParams?.bookingView) params.set("bookingView", searchParams.bookingView);
  if (searchParams?.visitBucket) params.set("visitBucket", searchParams.visitBucket);
  if (searchParams?.role === "shelter") params.set("role", "shelter");

  const query = params.toString();
  return query ? `/admindraft?${query}` : "/admindraft";
}

export default async function AdminDraftPage({
  searchParams,
}: {
  searchParams?: Promise<{ bookingView?: string; message?: string; role?: string; shelter?: string; unlock?: string; view?: string; visitBucket?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  await requireGlobalAdmin(buildAdminDraftReturnTo(resolvedSearchParams));

  if (resolvedSearchParams?.view === "about") {
    redirect("/admindraft/aboutcontent");
  }

  const data = await loadAdminDraftData();

  return (
    <AdminReorgDraftPanel
      data={data}
      initialBookingWorkspaceView={resolvedSearchParams?.bookingView}
      initialVisitBucket={resolvedSearchParams?.visitBucket}
      initialMainTab={resolvedSearchParams?.view}
      initialMessage={resolvedSearchParams?.message}
      initialRoleView={resolvedSearchParams?.role === "shelter" ? "shelter" : "pawjai"}
      initialShelterId={resolvedSearchParams?.shelter}
      initialShelterTab={resolvedSearchParams?.view}
    />
  );
}
