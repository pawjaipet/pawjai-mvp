import BookingDetailPage from "@/app/booking/[id]/page";
import { requireGlobalAdmin } from "@/utils/admin-auth";

export default async function AdminBookingDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string; token?: string }>;
}) {
  const { id } = await props.params;
  await requireGlobalAdmin(`/admin/bookings/${id}`);
  return BookingDetailPage(props);
}
