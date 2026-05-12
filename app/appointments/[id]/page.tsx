import { redirect } from "next/navigation";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import AppointmentDetailClient from "@/components/appointments/AppointmentDetailClient";
import { ensureAdopterForUser } from "@/utils/adopter";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath={`/appointments/${id}`}
        reason="Sign in to view your appointment details."
      />
    );
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const { data: appt } = await admin
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("adopter_id", adopter.id)
    .maybeSingle();

  if (!appt) {
    redirect("/appointments");
  }

  const [{ data: dog }, { data: shelter }] = await Promise.all([
    appt.dog_id
      ? admin
          .from("dogs")
          .select("id, name, breed")
          .eq("id", appt.dog_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("shelters")
      .select("id, name, phone_number, email, address_line, district, subdistrict, province, postal_code")
      .eq("id", appt.shelter_id)
      .maybeSingle(),
  ]);

  let coverUrl: string | null = null;
  if (appt.dog_id) {
    const { data: photo } = await admin
      .from("dog_photos")
      .select("public_url")
      .eq("dog_id", appt.dog_id)
      .eq("is_cover", true)
      .maybeSingle();
    coverUrl = photo?.public_url ?? null;
  }

  // Build display strings server-side (TZ-safe)
  const dateObj = new Date(appt.appointment_date);
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const startTime = appt.appointment_time
    ? new Date(`1970-01-01T${appt.appointment_time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  // Assume 1-hour visit window for end time
  const endTime = appt.appointment_time
    ? new Date(new Date(`1970-01-01T${appt.appointment_time}`).getTime() + 60 * 60 * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  const bookingId = `APT-${appt.id.slice(0, 5).toUpperCase()}`;

  const addressLines = shelter
    ? [
        shelter.address_line,
        [shelter.subdistrict, shelter.district].filter(Boolean).join(", "),
        [shelter.province, shelter.postal_code].filter(Boolean).join(" "),
      ].filter(Boolean) as string[]
    : [];

  return (
    <AppointmentDetailClient
      appointmentId={appt.id}
      bookingId={bookingId}
      dog={dog ? { id: dog.id, name: dog.name, breed: dog.breed, coverUrl } : null}
      shelter={
        shelter
          ? {
              name: shelter.name,
              phone: shelter.phone_number,
              email: shelter.email,
              addressLines,
            }
          : null
      }
      time={{ weekday, monthDay, start: startTime, end: endTime }}
      shelterNote={appt.shelter_note}
      visitorNote={appt.visitor_note}
    />
  );
}
