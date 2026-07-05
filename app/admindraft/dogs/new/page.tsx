import Link from "next/link";
import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { mergePersonalityTags } from "@/utils/personality-tags";
import { createAdminClient } from "@/utils/supabase/admin";
import DogListingForm from "@/app/admin/dogs/new/DogListingForm";
import { isAdminDraftUnlocked } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminDraftNewDogPage({
  searchParams,
}: {
  searchParams?: Promise<{ shelter?: string; unlock?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const unlocked = await isAdminDraftUnlocked();

  if (!unlocked) {
    return <AdminDraftGate showError={resolvedSearchParams?.unlock === "failed"} />;
  }

  const adminContext = await getAdminAuthContext();

  if (!adminContext) {
    return <AdminDraftGate />;
  }

  const supabase = createAdminClient();
  const scopedShelterIds = adminContext.isGlobalAdmin ? null : adminContext.shelterIds;
  const [{ data: shelters }, { data: personalityTraitRows }] = await Promise.all([
    scopedShelterIds && scopedShelterIds.length === 0
      ? Promise.resolve({ data: [] })
      : scopedShelterIds
        ? supabase.from("shelters").select("id, name").in("id", scopedShelterIds).order("name", { ascending: true })
        : supabase.from("shelters").select("id, name").order("name", { ascending: true }),
    supabase
      .from("dog_traits")
      .select("trait_value")
      .eq("trait_type", "personality")
      .order("trait_value", { ascending: true }),
  ]);
  const shelterOptions = shelters ?? [];
  const selectedShelterId = resolvedSearchParams?.shelter && shelterOptions.some((shelter) => shelter.id === resolvedSearchParams.shelter)
    ? resolvedSearchParams.shelter
    : shelterOptions[0]?.id ?? "";
  const cancelHref = selectedShelterId
    ? `/admindraft?shelter=${selectedShelterId}&view=dogs`
    : "/admindraft?view=dogs";
  const personalityTags = mergePersonalityTags(
    (personalityTraitRows ?? []).map((trait) => trait.trait_value),
  );

  if (shelterOptions.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5efe6] px-4 py-8 text-[#4f4338]">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[#eadfce] bg-white p-8 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
            PawJai Admin Draft
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Add a shelter before creating dog listings.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#7a6d61]">
            Each dog listing belongs to a shelter, so the draft create flow needs at least one shelter record first.
          </p>
          <Link className="mt-6 inline-flex rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white" href="/admindraft">
            Back to admin draft
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
              PawJai Admin Draft
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
            Cancel
          </Link>
        </header>

        <DogListingForm
          cancelHref={cancelHref}
          personalityTags={personalityTags}
          returnTo="/admindraft"
          selectedShelterId={selectedShelterId}
          shelters={shelterOptions}
          showIntro={false}
          submitLabel="Save draft"
          successListingsHref={cancelHref}
        />
      </div>
    </main>
  );
}
