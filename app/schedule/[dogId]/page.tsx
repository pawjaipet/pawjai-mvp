import { redirect } from "next/navigation";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { canBookAppointment, ensureAdopterForUser, getAdopterVerificationSnapshot } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

/**
 * Routing entry point from swipe card calendar button.
 *
 * - Not signed in → ProtectedRouteGate (returns to this URL after auth)
 * - Signed in but unverified → redirect to /documents with a `next`
 *   param so user lands back here after verifying
 * - Verified → redirect into the calendar UI at /schedule?dogId=...
 *
 * No UI of its own — pure routing.
 */
export default async function ScheduleEntry({
  params,
}: {
  params: Promise<{ dogId: string }>;
}) {
  const { dogId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath={`/schedule/${dogId}`}
        reason="Sign in to book a shelter visit."
      />
    );
  }

  const verification = await getAdopterVerificationSnapshot(supabase, user);
  await ensureAdopterForUser(supabase, user);

  if (!canBookAppointment(verification)) {
    redirect(`/documents?next=${encodeURIComponent(`/schedule/${dogId}`)}`);
  }

  const admin = createAdminClient();
  const { data: dog } = await admin
    .from("dogs")
    .select("id, name, shelter_id")
    .eq("id", dogId)
    .maybeSingle();

  if (!dog) {
    redirect("/appointments");
  }

  const { data: shelter } = await admin
    .from("shelters")
    .select("id, name")
    .eq("id", dog.shelter_id)
    .maybeSingle();

  const qs = new URLSearchParams({
    dogId: dog.id,
    dog: dog.name,
    shelterId: dog.shelter_id,
    shelter: shelter?.name ?? "the shelter",
  });

  redirect(`/schedule?${qs.toString()}`);
}
