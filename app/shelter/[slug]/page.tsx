import { redirect } from "next/navigation";
import AdminReorgDraftPanel from "@/components/admin/AdminReorgDraftPanel";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { loadAdminDraftData } from "@/utils/admin-draft-data";
import {
  getShelterByPortalSlug,
  getShelterPortalTarget,
} from "@/utils/shelter-portal";

export const dynamic = "force-dynamic";

export default async function ShelterPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ bookingView?: string; message?: string; view?: string }>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (!context) {
    redirect("/shelter");
  }

  if (context.isGlobalAdmin) {
    redirect("/admin");
  }

  const shelter = await getShelterByPortalSlug(slug, context.shelterIds);
  if (!shelter) {
    const fallbackTarget = await getShelterPortalTarget(context);
    redirect(fallbackTarget ?? "/shelter?message=This account is not linked to this shelter.");
  }

  const data = await loadAdminDraftData({ shelterIds: [shelter.id] });

  return (
    <AdminReorgDraftPanel
      accountSettingsHref={`/shelter/${slug}/settings`}
      data={data}
      initialBookingWorkspaceView={resolvedSearchParams?.bookingView}
      initialMessage={resolvedSearchParams?.message}
      initialRoleView="shelter"
      initialShelterId={shelter.id}
      initialShelterTab={resolvedSearchParams?.view}
      lockRoleView
      workspaceBaseHref={`/shelter/${slug}`}
    />
  );
}
