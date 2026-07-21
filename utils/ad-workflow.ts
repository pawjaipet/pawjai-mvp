export const OPEN_ENDED_AD_END_DATE = "2099-12-31";

export type AdReviewStatus = "pending" | "approved" | "denied";
export type AdDisplayStatus = AdReviewStatus | "paused" | "expired";

export function getAdDisplayStatus({
  endDate,
  isActive,
  reviewStatus,
  today,
}: {
  endDate: string;
  isActive: boolean;
  reviewStatus: AdReviewStatus;
  today: string;
}): AdDisplayStatus {
  if (reviewStatus !== "approved") return reviewStatus;
  if (endDate < today) return "expired";
  return isActive ? "approved" : "paused";
}

export function adDisplayStatusLabel(status: AdDisplayStatus) {
  switch (status) {
    case "approved":
      return "Live";
    case "denied":
      return "Denied";
    case "expired":
      return "Expired";
    case "paused":
      return "Paused";
    case "pending":
      return "Pending";
  }
}
