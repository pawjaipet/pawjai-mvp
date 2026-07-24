import { redirect } from "next/navigation";
import AdminDraftGate from "@/components/admin/AdminDraftGate";
import AdminReorgDraftPanel from "@/components/admin/AdminReorgDraftPanel";
import { loadAdminDraftData } from "@/utils/admin-draft-data";
import { isAdminDraftUnlocked } from "./actions";

export const dynamic = "force-dynamic";

function buildAdminDraftReturnTo(searchParams?: { role?: string; shelter?: string; view?: string }) {
  const params = new URLSearchParams();

  if (searchParams?.shelter) params.set("shelter", searchParams.shelter);
  if (searchParams?.view && searchParams.view !== "about") params.set("view", searchParams.view);
  if (searchParams?.role === "shelter") params.set("role", "shelter");

  const query = params.toString();
  return query ? `/admindraft?${query}` : "/admindraft";
}

export default async function AdminDraftPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string; shelter?: string; unlock?: string; view?: string }>;
}) {
  const unlocked = await isAdminDraftUnlocked();
  const resolvedSearchParams = await searchParams;

  if (resolvedSearchParams?.view === "about") {
    redirect("/admindraft/aboutcontent");
  }

  if (!unlocked) {
    return (
      <AdminDraftGate
        returnTo={buildAdminDraftReturnTo(resolvedSearchParams)}
        showError={resolvedSearchParams?.unlock === "failed"}
      />
    );
  }

  const data = await loadAdminDraftData();

  return (
    <AdminReorgDraftPanel
      data={data}
      initialMainTab={resolvedSearchParams?.view}
      initialRoleView={resolvedSearchParams?.role === "shelter" ? "shelter" : "pawjai"}
      initialShelterId={resolvedSearchParams?.shelter}
      initialShelterTab={resolvedSearchParams?.view}
    />
  );
}
