import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminDraftGate from "@/components/admin/AdminDraftGate";
import { getAdminAuthContext, requireShelterAccess } from "@/utils/admin-auth";
import { mergePersonalityTags } from "@/utils/personality-tags";
import { createAdminClient } from "@/utils/supabase/admin";
import DogEditForm from "@/app/admin/dogs/[id]/edit/DogEditForm";
import { isAdminDraftUnlocked } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditAdminDraftDogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ role?: string; unlock?: string }>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const unlocked = await isAdminDraftUnlocked();
  const gateReturnTo = resolvedSearchParams?.role === "shelter"
    ? `/admindraft/dogs/${id}/edit?role=shelter`
    : `/admindraft/dogs/${id}/edit`;

  if (!unlocked) {
    return <AdminDraftGate returnTo={gateReturnTo} showError={resolvedSearchParams?.unlock === "failed"} />;
  }

  const adminContext = await getAdminAuthContext();

  if (!adminContext) {
    return <AdminDraftGate returnTo={gateReturnTo} />;
  }

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

  await requireShelterAccess(dog.shelter_id, `/admindraft/dogs/${id}/edit`);

  const listingsParams = new URLSearchParams({
    shelter: dog.shelter_id,
    view: "dogs",
  });
  if (resolvedSearchParams?.role === "shelter") listingsParams.set("role", "shelter");
  const draftListingsHref = `/admindraft?${listingsParams.toString()}`;
  const draftEditHref = resolvedSearchParams?.role === "shelter"
    ? `/admindraft/dogs/${dog.id}/edit?role=shelter`
    : `/admindraft/dogs/${dog.id}/edit`;

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-[#65584f]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_16px_50px_rgba(101,88,79,0.08)] md:flex-row md:items-end md:justify-between">
          <div className="flex gap-4">
            <div className="relative mt-1 h-14 w-14 shrink-0 overflow-hidden rounded-[18px] bg-[#f5f1e8]">
              <Image alt="PawJai" className="object-contain p-1.5" fill sizes="56px" src="/pawjai-logo-square.png" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">
                PawJai Admin Draft
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Edit dog listing</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65584f]">
                Update the same live PawJai dog record while staying inside the draft shelter workspace.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
              href={draftListingsHref}
            >
              Back to dog listings
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-5 py-3 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
              href={`/dogs/${dog.id}`}
            >
              View public profile
            </Link>
          </div>
        </header>

        <DogEditForm
          deleteReturnTo={draftListingsHref}
          dog={dog}
          personalityTags={mergePersonalityTags(
            (personalityTraitRows ?? []).map((trait) => trait.trait_value),
          )}
          photos={photos ?? []}
          returnTo={draftEditHref}
          shelters={shelters ?? []}
          traits={traits ?? []}
        />
      </div>
    </main>
  );
}
