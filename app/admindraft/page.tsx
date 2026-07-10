import { redirect } from "next/navigation";
import AdminDraftGate from "@/components/admin/AdminDraftGate";
import AdminReorgDraftPanel from "@/components/admin/AdminReorgDraftPanel";
import { loadAdminDraftData } from "@/utils/admin-draft-data";
import { isAdminDraftUnlocked } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDraftPage({
  searchParams,
}: {
  searchParams?: Promise<{ shelter?: string; unlock?: string; view?: string }>;
}) {
  const unlocked = await isAdminDraftUnlocked();
  const resolvedSearchParams = await searchParams;

  if (resolvedSearchParams?.view === "about") {
    redirect("/admindraft/aboutcontent");
  }

  if (!unlocked) {
    return <AdminDraftGate showError={resolvedSearchParams?.unlock === "failed"} />;
  }

  const data = await loadAdminDraftData();

  return (
    <AdminReorgDraftPanel
      data={data}
      initialMainTab={resolvedSearchParams?.view}
      initialShelterId={resolvedSearchParams?.shelter}
      initialShelterTab={resolvedSearchParams?.view}
    />
  );
}
