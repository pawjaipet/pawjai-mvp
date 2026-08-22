import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import { requireGlobalAdmin, requireShelterAccess } from "@/utils/admin-auth";
import { mergePersonalityTags } from "@/utils/personality-tags";
import { createAdminClient } from "@/utils/supabase/admin";
import DogEditForm from "./DogEditForm";

export const dynamic = "force-dynamic";

export default async function EditAdminDogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireGlobalAdmin(`/admin/dogs/${id}/edit`);

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

  const listingsParams = new URLSearchParams({ shelter: dog.shelter_id, view: "dogs" });
  const listingsHref = `/admin?${listingsParams.toString()}`;
  const editHref = `/admin/dogs/${dog.id}/edit`;

  return (
    <PawjaiWorkspaceShell
      actions={(
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:border-[#cd8188] hover:bg-[#f8e8ea]"
            href={listingsHref}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dog listings
          </Link>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:border-[#cd8188] hover:bg-[#f8e8ea]"
            href={`/dogs/${dog.id}`}
          >
            <ExternalLink className="h-4 w-4" />
            View public profile
          </Link>
        </div>
      )}
      description="Update the live PawJai dog record while staying inside the PawJai admin workspace."
      eyebrow="PawJai Admin"
      homeHref={listingsHref}
      title={`Edit ${dog.name}`}
    >
      <DogEditForm
        deleteReturnTo={listingsHref}
        dog={dog}
        personalityTags={mergePersonalityTags(
          (personalityTraitRows ?? []).map((trait) => trait.trait_value),
        )}
        photos={photos ?? []}
        returnTo={editHref}
        shelters={shelters ?? []}
        traits={traits ?? []}
      />
    </PawjaiWorkspaceShell>
  );
}
