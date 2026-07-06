import AdminDraftGate from "@/components/admin/AdminDraftGate";
import AdminReorgDraftPanel from "@/components/admin/AdminReorgDraftPanel";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { loadAdminDraftData } from "@/utils/admin-draft-data";
import { isAdminDraftUnlocked } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDraftPage({
  searchParams,
}: {
  searchParams?: Promise<{ shelter?: string; unlock?: string; view?: string }>;
}) {
  const unlocked = await isAdminDraftUnlocked();
  const context = unlocked ? null : await getAdminAuthContext();
  const resolvedSearchParams = await searchParams;

  if (!unlocked && !context) {
    return <AdminDraftGate showError={resolvedSearchParams?.unlock === "failed"} />;
  }

  const isShelterAccount = !unlocked && context?.role === "shelter_admin";
  const scopedShelterIds = !unlocked && context && !context.isGlobalAdmin ? context.shelterIds : null;
  const initialShelterId = isShelterAccount
    ? context.shelterIds[0]
    : resolvedSearchParams?.shelter;
  const data = await loadAdminDraftData({ shelterIds: scopedShelterIds });

  return (
    <AdminReorgDraftPanel
      data={data}
      initialRoleView={isShelterAccount ? "shelter" : "pawjai"}
      initialShelterId={initialShelterId}
      initialShelterTab={resolvedSearchParams?.view}
      lockRoleView={isShelterAccount}
    />
  );
}
