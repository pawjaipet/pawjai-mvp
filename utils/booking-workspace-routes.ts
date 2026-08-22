export function shelterWorkspaceBaseFromBookingListHref(
  bookingListHref: string,
) {
  const pathname = bookingListHref.split(/[?#]/, 1)[0] ?? "";
  const match = pathname.match(/^\/shelter\/([a-z0-9_-]+)$/i);
  return match ? pathname : null;
}

export function bookingWorkspaceDetailHref({
  appointmentId,
  bookingListHref,
}: {
  appointmentId: string;
  bookingListHref: string;
}) {
  const shelterBase = shelterWorkspaceBaseFromBookingListHref(bookingListHref);
  return shelterBase
    ? `${shelterBase}/bookings/${appointmentId}`
    : `/admin/bookings/${appointmentId}`;
}

export function bookingWorkspaceVisitorHref({
  appointmentId,
  bookingListHref,
}: {
  appointmentId: string;
  bookingListHref: string;
}) {
  return `${bookingWorkspaceDetailHref({ appointmentId, bookingListHref })}/visitor-profile`;
}

export function bookingWorkspaceCheckInHref(bookingListHref: string) {
  const shelterBase = shelterWorkspaceBaseFromBookingListHref(bookingListHref);
  return shelterBase ? `${shelterBase}/bookings/check-in` : "/admin/bookings/check-in";
}
