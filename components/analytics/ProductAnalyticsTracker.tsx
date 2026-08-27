"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  dogIdFromPublicPath,
  dogIdFromSchedulePath,
  isTrackablePublicPath,
} from "@/utils/product-analytics-model";
import { sendProductAnalyticsEvent } from "@/utils/product-analytics-client";

const fallbackBookingStarts = new Set<string>();

function markBookingStarted(dogId: string) {
  const key = `pawjai_booking_started:${dogId}`;
  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    if (fallbackBookingStarts.has(dogId)) return false;
    fallbackBookingStarts.add(dogId);
    return true;
  }
}

export default function ProductAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isTrackablePublicPath(pathname)) return;

    const search = window.location.search;
    sendProductAnalyticsEvent({ eventName: "page_view", path: pathname });

    const profileDogId = dogIdFromPublicPath(pathname);
    if (profileDogId) {
      sendProductAnalyticsEvent({ dogId: profileDogId, eventName: "dog_profile_view", path: pathname });
    }

    const bookingDogId = dogIdFromSchedulePath(pathname, search);
    if (bookingDogId && markBookingStarted(bookingDogId)) {
      sendProductAnalyticsEvent({ dogId: bookingDogId, eventName: "booking_started", path: pathname });
    }
  }, [pathname]);

  return null;
}
