import { redirect } from "next/navigation";

export default async function LegacyOnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  redirect(resolvedSearchParams?.tab === "listings" ? "/admin/listings" : "/admin");
}
