import { redirect } from "next/navigation";
import { renderBookingDetailPage } from "@/app/booking/[id]/page";
import { getAdminAuthContext } from "@/utils/admin-auth";
import {
  getShelterByPortalSlug,
  getShelterPortalTarget,
} from "@/utils/shelter-portal";

export const dynamic = "force-dynamic";

export default async function ShelterBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; slug: string }>;
  searchParams?: Promise<{ checkedIn?: string; returnTo?: string; token?: string }>;
}) {
  const [{ id, slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (!context || context.isGlobalAdmin) redirect("/shelter");

  const shelter = await getShelterByPortalSlug(slug, context.shelterIds);
  if (!shelter) redirect((await getShelterPortalTarget(context)) ?? "/shelter");

  return renderBookingDetailPage({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve({
      ...resolvedSearchParams,
      returnTo: resolvedSearchParams?.returnTo ?? `/shelter/${slug}?view=bookings`,
    }),
    shelterPortalSlug: slug,
  });
}
