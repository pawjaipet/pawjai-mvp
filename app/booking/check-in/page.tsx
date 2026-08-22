import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import {
  getCheckInTokenSecret,
  hashCheckInToken,
  verifySignedCheckInToken,
} from "@/utils/booking";
import { bookingWorkspaceDetailHref } from "@/utils/booking-workspace-routes";
import { canAccessShelter } from "@/utils/admin-authorization";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { getShelterPortalTarget } from "@/utils/shelter-portal";
import { createAdminClient } from "@/utils/supabase/admin";

function withReturnTo(path: string, returnTo: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

function InvalidQrCard({ retry, returnTo }: { retry?: boolean; returnTo: string }) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-[#f1c4c0] bg-white p-8 text-center shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
        <ShieldAlert className="mx-auto text-[#9a3129]" size={42} />
        <h1 className="mt-4 text-3xl font-semibold text-[#65584f]">Booking QR not recognized</h1>
        <p className="mt-3 text-sm leading-6 text-[#65584f]">
          {retry
            ? "Ask the visitor to open their latest appointment details in PawJai and scan the QR again."
            : "This code is missing, expired, or does not match a PawJai booking record."}
        </p>
        <Link className="mt-6 inline-flex rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white" href={returnTo}>
          Back to booking list
        </Link>
      </div>
    </div>
  );
}

type BookingCheckInPageProps = {
  searchParams?: Promise<{ invalid?: string; returnTo?: string; token?: string }>;
};

type BookingCheckInRenderProps = BookingCheckInPageProps & {
  shelterPortalSlug?: string;
};

export async function renderBookingCheckInPage({
  searchParams,
  shelterPortalSlug,
}: BookingCheckInRenderProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token ?? "";
  const context = await getAdminAuthContext();

  if (!context) {
    redirect("/shelter?message=Sign in to scan this booking.");
  }

  if (!context.isGlobalAdmin && !shelterPortalSlug) {
    const portalTarget = await getShelterPortalTarget(context);
    if (!portalTarget) redirect("/shelter");

    const canonicalParams = new URLSearchParams();
    if (resolvedSearchParams?.invalid) canonicalParams.set("invalid", resolvedSearchParams.invalid);
    if (token) canonicalParams.set("token", token);
    const canonicalQuery = canonicalParams.toString();
    redirect(`${portalTarget}/bookings/check-in${canonicalQuery ? `?${canonicalQuery}` : ""}`);
  }

  const requestedReturnTo = (resolvedSearchParams?.returnTo?.startsWith("/admindraft")
    || resolvedSearchParams?.returnTo?.startsWith("/admin/bookings")
    || resolvedSearchParams?.returnTo?.startsWith("/shelter/"))
    ? resolvedSearchParams.returnTo
    : "/shelter";

  if (!token || resolvedSearchParams?.invalid === "1") {
    return <InvalidQrCard returnTo={requestedReturnTo} />;
  }

  const admin = createAdminClient();
  const { data: hashedAppointment } = await admin
    .from("appointments")
    .select("id, shelter_id")
    .eq("check_in_token_hash", hashCheckInToken(token))
    .maybeSingle();
  const appointmentIdFromToken = verifySignedCheckInToken({
    token,
    secret: getCheckInTokenSecret(),
  });
  const { data: signedAppointment } = !hashedAppointment && appointmentIdFromToken
    ? await admin
        .from("appointments")
        .select("id, shelter_id")
        .eq("id", appointmentIdFromToken)
        .maybeSingle()
    : { data: null };
  const appointment = hashedAppointment ?? signedAppointment;

  if (!appointment) {
    return <InvalidQrCard retry returnTo={requestedReturnTo} />;
  }

  if (!canAccessShelter({ role: context.role, shelterIds: context.shelterIds, targetShelterId: appointment.shelter_id })) {
    if (context.role === "shelter_admin") {
      const portalTarget = await getShelterPortalTarget(context);
      redirect(portalTarget ?? "/shelter?message=This booking is not linked to your shelter.");
    }

    redirect("/admindraft");
  }

  const detailHref = bookingWorkspaceDetailHref({
    appointmentId: appointment.id,
    bookingListHref: requestedReturnTo,
  });
  redirect(withReturnTo(`${detailHref}?token=${encodeURIComponent(token)}`, requestedReturnTo));
}

export default async function AdminDraftBookingCheckInPage(props: BookingCheckInPageProps) {
  return renderBookingCheckInPage(props);
}
