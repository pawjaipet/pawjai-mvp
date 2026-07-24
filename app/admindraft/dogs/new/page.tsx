import Image from "next/image";
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
  searchParams?: Promise<{ role?: string; shelter?: string; unlock?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const unlocked = await isAdminDraftUnlocked();
  const gateParams = new URLSearchParams();
  if (resolvedSearchParams?.shelter) gateParams.set("shelter", resolvedSearchParams.shelter);
  if (resolvedSearchParams?.role === "shelter") gateParams.set("role", "shelter");
  const gateQuery = gateParams.toString();
  const gateReturnTo = gateQuery ? `/admindraft/dogs/new?${gateQuery}` : "/admindraft/dogs/new";

  if (!unlocked) {
    return <AdminDraftGate returnTo={gateReturnTo} showError={resolvedSearchParams?.unlock === "failed"} />;
  }

  const adminContext = await getAdminAuthContext();

  if (!adminContext) {
    return <AdminDraftGate returnTo={gateReturnTo} />;
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
  const listingsParams = new URLSearchParams({ view: "dogs" });
  if (selectedShelterId) listingsParams.set("shelter", selectedShelterId);
  if (resolvedSearchParams?.role === "shelter") listingsParams.set("role", "shelter");
  const cancelHref = `/admindraft?${listingsParams.toString()}`;
  const personalityTags = mergePersonalityTags(
    (personalityTraitRows ?? []).map((trait) => trait.trait_value),
  );

  if (shelterOptions.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-[#65584f]">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[#d6c8ad] bg-white p-8 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-[18px] bg-[#f5f1e8]">
              <Image alt="PawJai" className="object-contain p-1.5" fill sizes="56px" src="/pawjai-logo-square.png" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">
                PawJai Admin Draft
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Add a shelter before creating dog listings.</h1>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#65584f]">
            Each dog listing belongs to a shelter, so the draft create flow needs at least one shelter record first.
          </p>
          <Link className="mt-6 inline-flex rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white" href="/admindraft">
            Back to admin draft
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-[#65584f]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_16px_50px_rgba(101,88,79,0.08)] md:flex-row md:items-end md:justify-between">
          <div className="flex gap-4">
            <div className="relative mt-1 h-14 w-14 shrink-0 overflow-hidden rounded-[18px] bg-[#f5f1e8]">
              <Image alt="PawJai" className="object-contain p-1.5" fill sizes="56px" src="/pawjai-logo-square.png" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">
                PawJai Admin Draft
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Create dog listing</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65584f]">
                Add the dog profile, matching answers, tags, and photos. This saves to the same live PawJai dog database.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
            href={cancelHref}
          >
            Exit
          </Link>
        </header>

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
      </div>
    </main>
  );
}
