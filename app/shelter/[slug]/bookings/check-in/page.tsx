import { redirect } from "next/navigation";
import { renderBookingCheckInPage } from "@/app/booking/check-in/page";
import { getAdminAuthContext } from "@/utils/admin-auth";
import {
  getShelterByPortalSlug,
  getShelterPortalTarget,
} from "@/utils/shelter-portal";

export const dynamic = "force-dynamic";

export default async function ShelterBookingCheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ invalid?: string; token?: string }>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const context = await getAdminAuthContext({ includePhraseGate: false });

  if (!context || context.isGlobalAdmin) redirect("/shelter");

  const shelter = await getShelterByPortalSlug(slug, context.shelterIds);
  if (!shelter) redirect((await getShelterPortalTarget(context)) ?? "/shelter");

  return renderBookingCheckInPage({
    searchParams: Promise.resolve({
      ...resolvedSearchParams,
      returnTo: `/shelter/${slug}?view=bookings`,
    }),
    shelterPortalSlug: slug,
  });
}
