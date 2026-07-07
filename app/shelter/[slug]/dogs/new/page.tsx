import Link from "next/link";
import { redirect } from "next/navigation";
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
      <main className="min-h-screen bg-[#f5efe6] px-4 py-8 text-[#4f4338]">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[#eadfce] bg-white p-8 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
            PawJai Shelter Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Add a shelter before creating dog listings.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#7a6d61]">
            Each dog listing belongs to a shelter, so the draft create flow needs at least one shelter record first.
          </p>
          <Link className="mt-6 inline-flex rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white" href={cancelHref}>
            Back to shelter workspace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5efe6] px-4 py-8 text-[#4f4338]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
              PawJai Shelter Portal
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Create dog listing</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74685d]">
              Add the dog profile, matching answers, tags, and photos. This saves to the same live PawJai dog database.
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d40] transition hover:bg-[#faf4ec]"
            href={cancelHref}
          >
            Exit
          </Link>
        </header>

        <DogListingForm
          cancelLabel="Exit"
          cancelHref={cancelHref}
          personalityTags={personalityTags}
          returnTo={`/shelter/${slug}/dogs/new`}
          selectedShelterId={selectedShelterId}
          shelters={shelterOptions}
          showIntro={false}
          submitLabel="Save Draft"
          successListingsHref={cancelHref}
        />
      </div>
    </main>
  );
}
