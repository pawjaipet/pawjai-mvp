import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { mergePersonalityTags } from "@/utils/personality-tags";
import { getShelterByPortalSlug, getShelterPortalTarget } from "@/utils/shelter-portal";
import { createAdminClient } from "@/utils/supabase/admin";
import DogListingForm from "@/app/admin/dogs/new/DogListingForm";

export const dynamic = "force-dynamic";

export default async function ShelterNewDogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
  const [{ data: shelters }, { data: personalityTraitRows }] = await Promise.all([
    supabase.from("shelters").select("id, name").eq("id", shelter.id).order("name", { ascending: true }),
    supabase
      .from("dog_traits")
      .select("trait_value")
      .eq("trait_type", "personality")
      .order("trait_value", { ascending: true }),
  ]);
  const shelterOptions = shelters ?? [];
  const selectedShelterId = shelter.id;
  const cancelHref = `/shelter/${slug}?view=dogs`;
  const personalityTags = mergePersonalityTags(
    (personalityTraitRows ?? []).map((trait) => trait.trait_value),
  );

  if (shelterOptions.length === 0) {
    return (
      <PawjaiWorkspaceShell eyebrow="My Shelter Workspace powered by PawJai" homeHref={cancelHref} maxWidth="max-w-5xl" title="Create dog listing">
        <section className="rounded-[28px] border border-[#d6c8ad] bg-white/90 p-8 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
          <h2 className="text-2xl font-semibold text-[#65584f]">Add a shelter before creating dog listings.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#65584f]/75">
            Each dog listing belongs to a shelter, so the draft create flow needs at least one shelter record first.
          </p>
          <Link className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b87179]" href={cancelHref}>
            <ArrowLeft className="h-4 w-4" />
            Back to shelter workspace
          </Link>
        </section>
      </PawjaiWorkspaceShell>
    );
  }

  return (
    <PawjaiWorkspaceShell
      actions={(
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:border-[#cd8188] hover:bg-[#f8e8ea]"
            href={cancelHref}
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Link>
      )}
      description="Add the dog profile, matching answers, tags, and photos. This saves to the same live PawJai dog database."
      eyebrow="My Shelter Workspace powered by PawJai"
      homeHref={cancelHref}
      maxWidth="max-w-5xl"
      title="Create dog listing"
    >
      <DogListingForm
        cancelLabel="Exit"
        cancelHref={cancelHref}
        personalityTags={personalityTags}
        returnTo={cancelHref}
        selectedShelterId={selectedShelterId}
        shelters={shelterOptions}
        showIntro={false}
        submitLabel="Save Draft"
        successListingsHref={cancelHref}
      />
    </PawjaiWorkspaceShell>
  );
}
