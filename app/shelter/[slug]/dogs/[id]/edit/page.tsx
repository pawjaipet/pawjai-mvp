import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { mergePersonalityTags } from "@/utils/personality-tags";
import { getShelterByPortalSlug, getShelterPortalTarget } from "@/utils/shelter-portal";
import { createAdminClient } from "@/utils/supabase/admin";
import DogEditForm from "@/app/admin/dogs/[id]/edit/DogEditForm";

export const dynamic = "force-dynamic";

export default async function ShelterEditDogPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  const adminContext = await getAdminAuthContext({ includePhraseGate: false });

  if (!adminContext || adminContext.isGlobalAdmin) {
    redirect("/shelter");
  }

  const shelter = await getShelterByPortalSlug(slug, adminContext.shelterIds);
  if (!shelter) {
    const fallbackTarget = await getShelterPortalTarget(adminContext);
    redirect(fallbackTarget ?? "/shelter");
  }

  const supabase = createAdminClient();
  const [{ data: dog }, { data: shelters }, { data: photos }, { data: traits }, { data: personalityTraitRows }] = await Promise.all([
    supabase.from("dogs").select("*").eq("id", id).single(),
    supabase.from("shelters").select("id, name").eq("id", shelter.id).order("name", { ascending: true }),
    supabase.from("dog_photos").select("*").eq("dog_id", id).order("sort_order"),
    supabase.from("dog_traits").select("*").eq("dog_id", id).order("created_at"),
    supabase
      .from("dog_traits")
      .select("trait_value")
      .eq("trait_type", "personality")
      .order("trait_value", { ascending: true }),
  ]);

  if (!dog) notFound();

  if (dog.shelter_id !== shelter.id) {
    notFound();
  }

  const shelterListingsHref = `/shelter/${slug}?view=dogs`;

  return (
    <PawjaiWorkspaceShell
      actions={(
        <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:border-[#cd8188] hover:bg-[#f8e8ea]"
              href={shelterListingsHref}
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
      description="Update the same live PawJai dog record while staying inside your shelter workspace."
      eyebrow="My Shelter Workspace powered by PawJai"
      homeHref={shelterListingsHref}
      title={`Edit ${dog.name}`}
    >
      <DogEditForm
        deleteReturnTo={shelterListingsHref}
        dog={dog}
        personalityTags={mergePersonalityTags(
          (personalityTraitRows ?? []).map((trait) => trait.trait_value),
        )}
        photos={photos ?? []}
        returnTo={`/shelter/${slug}/dogs/${dog.id}/edit`}
        shelters={shelters ?? []}
        traits={traits ?? []}
      />
    </PawjaiWorkspaceShell>
  );
}
