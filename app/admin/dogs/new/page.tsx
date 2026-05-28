import Link from "next/link";
import type { ReactNode } from "react";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  lockAdminGateAction,
  unlockAdminGateAction,
} from "./actions";
import { initialAdminGateState } from "./form-state";
import DogListingForm from "./DogListingForm";
import AdminGateForm from "./AdminGateForm";
import { mergePersonalityTags } from "@/utils/personality-tags";

type AdminDog = {
  id: string;
  adoption_status: string;
  created_at: string;
  name: string;
  shelter_id: string;
  shelter_name: string;
};

function TabLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#d38a2c] text-white shadow-[0_10px_24px_rgba(179,111,31,0.22)]"
          : "border border-[#eadfce] bg-white text-[#5b4d40] hover:bg-[#faf4ec]"
      }`}
    >
      {children}
    </Link>
  );
}

function DogListingCard({ dog }: { dog: AdminDog }) {
  return (
    <div className="rounded-2xl border border-[#eee2d2] bg-[#fffdfa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#4f4338]">{dog.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#9a6b2a]">
            {dog.adoption_status}
          </p>
        </div>
        <span className="text-xs text-[#8d7f72]">
          {new Date(dog.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <p className="mt-3 text-sm text-[#74685d]">{dog.shelter_name}</p>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/admin/dogs/${dog.id}/edit`}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-[#d38a2c] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#bf781f]"
        >
          Edit
        </Link>
        <Link
          href={`/dogs/${dog.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-[#eadfce] bg-white px-3 py-2 text-xs font-semibold text-[#5b4d40] transition hover:bg-[#faf4ec]"
        >
          Open
        </Link>
      </div>
    </div>
  );
}

function ListingsByShelter({
  dogs,
  shelters,
}: {
  dogs: AdminDog[];
  shelters: { id: string; name: string }[];
}) {
  return (
    <section className="rounded-[28px] border border-[#eadfce] bg-white/90 p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#4f4338]">All Dog Listings</h2>
          <p className="mt-1 text-sm leading-6 text-[#7a6d61]">
            Manage profiles by shelter. Use Open to preview the public dog page, or Edit to change
            details, status, tags, and delete accidental duplicates.
          </p>
        </div>
        <p className="rounded-full bg-[#f8ecd8] px-4 py-2 text-sm font-semibold text-[#9a6b2a]">
          {dogs.length} profiles
        </p>
      </div>

      <div className="mt-6 space-y-8">
        {shelters.map((shelter) => {
          const shelterDogs = dogs.filter((dog) => dog.shelter_id === shelter.id);
          if (shelterDogs.length === 0) return null;

          return (
            <div key={shelter.id}>
              <div className="mb-3 flex items-center justify-between gap-4 border-b border-[#eadfce] pb-3">
                <h3 className="text-lg font-semibold text-[#4f4338]">{shelter.name}</h3>
                <span className="text-sm text-[#8d7f72]">{shelterDogs.length} dogs</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {shelterDogs.map((dog) => (
                  <DogListingCard key={dog.id} dog={dog} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export async function AdminDogManagementPage({
  activeTabOverride,
  searchParams,
}: {
  activeTabOverride?: "create" | "listings";
  searchParams?: Promise<{ tab?: string }>;
}) {
  const gateOpen = await isAdminGateOpen();
  const resolvedSearchParams = await searchParams;
  const activeTab = activeTabOverride ?? (resolvedSearchParams?.tab === "listings" ? "listings" : "create");

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
  const [{ data: shelters }, { data: dogs }] = await Promise.all([
    supabase.from("shelters").select("id, name").order("name", { ascending: true }),
    supabase
      .from("dogs")
      .select("id, name, adoption_status, created_at, shelter_id")
      .order("created_at", { ascending: false }),
  ]);
  const { data: personalityTraitRows } = await supabase
    .from("dog_traits")
    .select("trait_value")
    .eq("trait_type", "personality")
    .order("trait_value", { ascending: true });

  if (!shelters || shelters.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-[32px] border border-[#eadfce] bg-white p-8 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
            Internal Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#4f4338]">
            Add a shelter before creating dog listings.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#7a6d61]">
            Each dog listing belongs to a shelter, so the onboarding flow needs at least one
            shelter record to attach the dog to.
          </p>
        </div>
      </div>
    );
  }

  const shelterMap = new Map(shelters.map((shelter) => [shelter.id, shelter.name]));
  const personalityTags = mergePersonalityTags(
    (personalityTraitRows ?? []).map((trait) => trait.trait_value),
  );

  const formattedDogs: AdminDog[] =
    dogs?.map((dog) => ({
      adoption_status: dog.adoption_status,
      created_at: dog.created_at,
      id: dog.id,
      name: dog.name,
      shelter_id: dog.shelter_id,
      shelter_name: shelterMap.get(dog.shelter_id) ?? "Unknown shelter",
    })) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">
            PawJai Admin
          </p>
          <p className="mt-2 text-sm text-[#7a6d61]">
            Internal onboarding mode is unlocked with the shared team phrase.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <TabLink href="/admin" active={activeTab === "create"}>
            Create dog
          </TabLink>
          <TabLink href="/admin/listings" active={activeTab === "listings"}>
            Manage listings
          </TabLink>
          <TabLink href="/admin/bookings" active={false}>
            Bookings
          </TabLink>
          <TabLink href="/admin/ads" active={false}>
            Ads
          </TabLink>
          <TabLink href="/admin/pawjaiprofile" active={false}>
            About content
          </TabLink>
          <form action={lockAdminGateAction}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-medium text-[#5b4d40] transition hover:bg-[#faf4ec]"
            >
              Lock admin page
            </button>
          </form>
        </div>
      </div>

      {activeTab === "listings" ? (
        <ListingsByShelter dogs={formattedDogs} shelters={shelters} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <DogListingForm personalityTags={personalityTags} shelters={shelters} />

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-[#eadfce] bg-white/90 p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
              <h2 className="text-xl font-semibold text-[#4f4338]">Onboarding Notes</h2>
              <div className="mt-4 space-y-4 text-sm leading-6 text-[#74685d]">
                <p>
                  Use <span className="font-semibold text-[#4f4338]">draft</span> for listings that
                  still need copy cleanup, medical review, or final photo ordering.
                </p>
                <p>
                  The first photo becomes the browse card cover, so place the strongest portrait first.
                </p>
                <p>
                  Use <Link href="/admin/listings" className="font-semibold text-[#b77624] underline underline-offset-4">Manage listings</Link>{" "}
                  to edit existing dogs, preview profiles, or delete accidental duplicates.
                </p>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

export default async function NewAdminDogPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  return <AdminDogManagementPage searchParams={searchParams} />;
}
