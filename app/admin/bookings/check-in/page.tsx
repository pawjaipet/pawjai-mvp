import BookingCheckInPage from "@/app/booking/check-in/page";
import { requireGlobalAdmin } from "@/utils/admin-auth";

export default async function AdminBookingCheckInPage(props: {
  searchParams?: Promise<{ invalid?: string; returnTo?: string; token?: string }>;
}) {
  await requireGlobalAdmin("/admin/bookings/check-in");
  return BookingCheckInPage(props);
}
