import { redirect } from "next/navigation";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { canBookAppointment, ensureAdopterForUser, getAdopterVerificationSnapshot } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { getShelterMonthAvailability } from "@/utils/shelter-availability";
import ScheduleBookingClient from "./ScheduleBookingClient";

function parseMonthParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    const today = new Date();
    return {
      month: today.getMonth(),
      year: today.getFullYear(),
    };
  }

  const [year, month] = value.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    const today = new Date();
    return {
      month: today.getMonth(),
      year: today.getFullYear(),
    };
  }

  return {
    month: month - 1,
    year,
  };
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ dogId?: string; month?: string }>;
}) {
  const params = await searchParams;
  const dogId = params.dogId ?? "";
  const nextPath = `/schedule${dogId ? `?dogId=${encodeURIComponent(dogId)}` : ""}`;

  if (!dogId) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath={nextPath}
        reason="Sign in to book and save shelter visits."
      />
    );
  }

  const verification = await getAdopterVerificationSnapshot(supabase, user);
  await ensureAdopterForUser(supabase, user);

  if (!canBookAppointment(verification)) {
    redirect(`/documents?next=${encodeURIComponent(nextPath)}`);
  }

  const admin = createAdminClient();
  const { data: dog } = await admin
    .from("dogs")
    .select("id, name, shelter_id, adoption_status")
    .eq("id", dogId)
    .maybeSingle();

  if (!dog) {
    redirect("/appointments");
  }

  if (dog.adoption_status !== "available") {
    redirect(`/dogs/${dog.id}?message=${encodeURIComponent("This dog is no longer available for visit bookings.")}`);
  }

  const { data: shelter } = await admin
    .from("shelters")
    .select("id, name")
    .eq("id", dog.shelter_id)
    .maybeSingle();

  if (!shelter) {
    redirect(`/dogs/${dog.id}?message=${encodeURIComponent("This dog's shelter profile is not ready for booking yet.")}`);
  }

  const { month, year } = parseMonthParam(params.month);
  const availability = await getShelterMonthAvailability({
    admin,
    month,
    shelterId: shelter.id,
    year,
  });

  return (
    <ScheduleBookingClient
      availability={availability}
      dog={{ id: dog.id, name: dog.name }}
      shelter={{ id: shelter.id, name: shelter.name }}
      viewMonth={month}
      viewYear={year}
    />
  );
}
