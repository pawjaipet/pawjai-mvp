import { redirect } from "next/navigation";
import AdminReorgDraftPanel from "@/components/admin/AdminReorgDraftPanel";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import { loadAdminDraftData } from "@/utils/admin-draft-data";

export const dynamic = "force-dynamic";

function buildAdminReturnTo(searchParams?: { bookingView?: string; role?: string; shelter?: string; view?: string }) {
  const params = new URLSearchParams();

  if (searchParams?.shelter) params.set("shelter", searchParams.shelter);
  if (searchParams?.view && searchParams.view !== "about") params.set("view", searchParams.view);
  if (searchParams?.bookingView) params.set("bookingView", searchParams.bookingView);
  if (searchParams?.role === "shelter") params.set("role", "shelter");

  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default async function AdminWorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<{ bookingView?: string; message?: string; role?: string; shelter?: string; view?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  await requireGlobalAdmin(buildAdminReturnTo(resolvedSearchParams));

  if (resolvedSearchParams?.view === "about") {
    redirect("/admin/aboutcontent");
  }

  const data = await loadAdminDraftData();

  return (
    <AdminReorgDraftPanel
      data={data}
      initialBookingWorkspaceView={resolvedSearchParams?.bookingView}
      initialMainTab={resolvedSearchParams?.view}
      initialMessage={resolvedSearchParams?.message}
      initialRoleView={resolvedSearchParams?.role === "shelter" ? "shelter" : "pawjai"}
      initialShelterId={resolvedSearchParams?.shelter}
      initialShelterTab={resolvedSearchParams?.view}
    />
  );
}
