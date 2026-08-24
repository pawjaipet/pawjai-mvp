import BookingVisitorProfilePage from "@/app/booking/[id]/visitor-profile/page";
import { requireGlobalAdmin } from "@/utils/admin-auth";

export default async function AdminBookingVisitorProfilePage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { id } = await props.params;
  await requireGlobalAdmin(`/admin/bookings/${id}/visitor-profile`);
  return BookingVisitorProfilePage(props);
}
