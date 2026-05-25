import { redirect } from "next/navigation";

// Legacy /onboarding stub.
// Adopter verification now lives at /documents. Admin listings flow at /admin/listings.
// Default sends visitors to the adopter verification page rather than the admin gate.
export default async function LegacyOnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  redirect(resolvedSearchParams?.tab === "listings" ? "/admin/listings" : "/documents");
}
