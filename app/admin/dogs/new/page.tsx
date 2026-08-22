import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PawjaiWorkspaceShell from "@/components/admin/PawjaiWorkspaceShell";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import { mergePersonalityTags } from "@/utils/personality-tags";
import { createAdminClient } from "@/utils/supabase/admin";
import DogListingForm from "./DogListingForm";

export const dynamic = "force-dynamic";

export default async function AdminNewDogPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string; shelter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const gateParams = new URLSearchParams();
  if (resolvedSearchParams?.shelter) gateParams.set("shelter", resolvedSearchParams.shelter);
  if (resolvedSearchParams?.role === "shelter") gateParams.set("role", "shelter");
  const gateQuery = gateParams.toString();
  const gateReturnTo = gateQuery ? `/admin/dogs/new?${gateQuery}` : "/admin/dogs/new";
  await requireGlobalAdmin(gateReturnTo);

  const supabase = createAdminClient();
  const [{ data: shelters }, { data: personalityTraitRows }] = await Promise.all([
    supabase.from("shelters").select("id, name").order("name", { ascending: true }),
    supabase
      .from("dog_traits")
      .select("trait_value")
      .eq("trait_type", "personality")
      .order("trait_value", { ascending: true }),
  ]);
  const shelterOptions = shelters ?? [];
  const selectedShelterId = resolvedSearchParams?.shelter
    && shelterOptions.some((shelter) => shelter.id === resolvedSearchParams.shelter)
    ? resolvedSearchParams.shelter
    : (shelterOptions[0]?.id ?? "");
  const listingsParams = new URLSearchParams({ view: "dogs" });
  if (selectedShelterId) listingsParams.set("shelter", selectedShelterId);
  if (resolvedSearchParams?.role === "shelter") listingsParams.set("role", "shelter");
  const cancelHref = `/admin?${listingsParams.toString()}`;
  const personalityTags = mergePersonalityTags(
    (personalityTraitRows ?? []).map((trait) => trait.trait_value),
  );

  if (shelterOptions.length === 0) {
    return (
      <PawjaiWorkspaceShell
        eyebrow="PawJai Admin"
        homeHref="/admin"
        maxWidth="max-w-5xl"
        title="Create dog listing"
      >
        <section className="rounded-[28px] border border-[#d6c8ad] bg-white/90 p-8 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
          <h2 className="text-2xl font-semibold text-[#65584f]">Add a shelter before creating dog listings.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#65584f]/75">
            Each dog listing belongs to a shelter, so the create flow needs at least one shelter record first.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b87179]"
            href="/admin"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to admin
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
      description="Add the dog profile, matching answers, tags, and photos. This saves to the live PawJai dog database."
      eyebrow="PawJai Admin"
      homeHref="/admin"
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
