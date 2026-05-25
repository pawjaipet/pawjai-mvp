import { redirect } from "next/navigation";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/appointments/${id}?tab=messages`);
}
