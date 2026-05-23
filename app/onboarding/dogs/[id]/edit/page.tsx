import { redirect } from "next/navigation";

export default async function LegacyOnboardingDogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/dogs/${id}/edit`);
}
