import Link from "next/link";
import { notFound } from "next/navigation";
import AdminGateForm from "@/app/admin/dogs/new/AdminGateForm";
import { unlockAdminGateAction } from "@/app/admin/dogs/new/actions";
import { initialAdminGateState } from "@/app/admin/dogs/new/form-state";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import DogEditForm from "./DogEditForm";

export default async function EditAdminDogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gateOpen = await isAdminGateOpen();

  if (!gateOpen) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <AdminGateForm
          action={unlockAdminGateAction}
          initialState={initialAdminGateState}
        />
      </div>
    );
  }

  const supabase = createAdminClient();
  const [{ data: dog }, { data: shelters }, { data: photos }, { data: traits }] = await Promise.all([
    supabase.from("dogs").select("*").eq("id", id).single(),
    supabase.from("shelters").select("id, name").order("name", { ascending: true }),
    supabase.from("dog_photos").select("*").eq("dog_id", id).order("sort_order"),
    supabase.from("dog_traits").select("*").eq("dog_id", id).order("created_at"),
  ]);

  if (!dog) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">
            PawJai Admin
          </p>
          <p className="mt-2 text-sm text-[#7a6d61]">
            Editing keeps the database record intact, even when a dog is hidden from public browsing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/doglistings"
            className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-medium text-[#5b4d40] transition hover:bg-[#faf4ec]"
          >
            Back to dog listings
          </Link>
          <Link
            href={`/dogs/${dog.id}`}
            className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-medium text-[#5b4d40] transition hover:bg-[#faf4ec]"
          >
            View public profile
          </Link>
        </div>
      </div>

      <DogEditForm
        dog={dog}
        photos={photos ?? []}
        shelters={shelters ?? []}
        traits={traits ?? []}
      />
    </div>
  );
}
