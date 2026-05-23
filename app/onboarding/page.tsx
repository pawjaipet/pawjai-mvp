import { AdminDogManagementPage } from "@/app/admin/dogs/new/page";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  return <AdminDogManagementPage searchParams={searchParams} />;
}
