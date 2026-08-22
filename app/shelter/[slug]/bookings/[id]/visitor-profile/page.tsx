import { redirect } from "next/navigation";
import { renderVisitorProfilePage } from "@/app/booking/[id]/visitor-profile/page";
import { getAdminAuthContext } from "@/utils/admin-auth";
import {
  getShelterByPortalSlug,
  getShelterPortalTarget,
} from "@/utils/shelter-portal";

export const dynamic = "force-dynamic";

export default async function ShelterVisitorProfilePage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (!context || context.isGlobalAdmin) redirect("/shelter");

  const shelter = await getShelterByPortalSlug(slug, context.shelterIds);
  if (!shelter) redirect((await getShelterPortalTarget(context)) ?? "/shelter");

  return renderVisitorProfilePage({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve({
      returnTo: `/shelter/${slug}?view=bookings`,
    }),
    shelterPortalSlug: slug,
  });
}
