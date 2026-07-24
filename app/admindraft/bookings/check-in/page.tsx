import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import AdminDraftGate from "@/components/admin/AdminDraftGate";
import {
  getCheckInTokenSecret,
  hashCheckInToken,
  verifySignedCheckInToken,
} from "@/utils/booking";
import { requireShelterAccess } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminDraftUnlocked } from "@/app/admindraft/actions";

function InvalidQrCard({ retry }: { retry?: boolean }) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-[#f1c4c0] bg-white p-8 text-center shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-[20px] bg-[#f5f1e8]">
          <Image alt="PawJai" className="object-contain p-1.5" fill sizes="64px" src="/pawjai-logo-square.png" />
        </div>
        <ShieldAlert className="mx-auto mt-4 text-[#9a3129]" size={42} />
        <h1 className="mt-4 text-3xl font-semibold text-[#65584f]">Booking QR not recognized</h1>
        <p className="mt-3 text-sm leading-6 text-[#65584f]">
          {retry
            ? "Ask the visitor to open their latest appointment details in PawJai and scan the QR again."
            : "This code is missing, expired, or does not match a PawJai booking record."}
        </p>
        <Link className="mt-6 inline-flex rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white" href="/admindraft?view=bookings">
          Back to booking list
        </Link>
      </div>
    </div>
  );
}

export default async function AdminDraftBookingCheckInPage({
  searchParams,
}: {
  searchParams?: Promise<{ invalid?: string; token?: string; unlock?: string }>;
}) {
  const unlocked = await isAdminDraftUnlocked();
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token ?? "";
  const gateParams = new URLSearchParams();
  if (token) gateParams.set("token", token);
  const gateReturnTo = gateParams.toString()
    ? `/admindraft/bookings/check-in?${gateParams.toString()}`
    : "/admindraft/bookings/check-in";

  if (!unlocked) {
    return <AdminDraftGate returnTo={gateReturnTo} showError={resolvedSearchParams?.unlock === "failed"} />;
  }

  if (!token || resolvedSearchParams?.invalid === "1") {
    return <InvalidQrCard />;
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
    return <InvalidQrCard retry />;
  }

  await requireShelterAccess(appointment.shelter_id, "/admindraft/bookings/check-in");

  redirect(`/admindraft/bookings/${appointment.id}?token=${encodeURIComponent(token)}`);
}
