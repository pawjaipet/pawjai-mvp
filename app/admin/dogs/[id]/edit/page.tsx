import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGlobalAdmin, requireShelterAccess } from "@/utils/admin-auth";
import { mergePersonalityTags } from "@/utils/personality-tags";
import { createAdminClient } from "@/utils/supabase/admin";
import DogEditForm from "./DogEditForm";

export default async function EditAdminDogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminContext = await requireGlobalAdmin(`/admin/dogs/${id}/edit`);

  const supabase = createAdminClient();
  const [{ data: dog }, { data: shelters }, { data: photos }, { data: traits }, { data: personalityTraitRows }] = await Promise.all([
    supabase.from("dogs").select("*").eq("id", id).single(),
    supabase.from("shelters").select("id, name").order("name", { ascending: true }),
    supabase.from("dog_photos").select("*").eq("dog_id", id).order("sort_order"),
    supabase.from("dog_traits").select("*").eq("dog_id", id).order("created_at"),
    supabase
      .from("dog_traits")
      .select("trait_value")
      .eq("trait_type", "personality")
      .order("trait_value", { ascending: true }),
  ]);

  if (!dog) notFound();
  await requireShelterAccess(dog.shelter_id, `/admin/dogs/${id}/edit`);

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
            href="/admin/listings"
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
        personalityTags={mergePersonalityTags(
          (personalityTraitRows ?? []).map((trait) => trait.trait_value),
        )}
        photos={photos ?? []}
        shelters={shelters ?? []}
        traits={traits ?? []}
      />
    </div>
  );
}
