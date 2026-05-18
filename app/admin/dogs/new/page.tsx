import Link from "next/link";
import { isAdminGateOpen } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  lockAdminGateAction,
  unlockAdminGateAction,
} from "./actions";
import { initialAdminGateState } from "./form-state";
import DogListingForm from "./DogListingForm";
import AdminGateForm from "./AdminGateForm";

type RecentDog = {
  id: string;
  adoption_status: string;
  created_at: string;
  name: string;
  shelter_id: string;
  shelter_name: string;
};

export default async function NewAdminDogPage() {
  const gateOpen = await isAdminGateOpen();

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
  const [{ data: shelters }, { data: recentDogs }] = await Promise.all([
    supabase.from("shelters").select("id, name").order("name", { ascending: true }),
    supabase
      .from("dogs")
      .select("id, name, adoption_status, created_at, shelter_id")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

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

  const formattedRecentDogs: RecentDog[] =
    recentDogs?.map((dog) => ({
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <DogListingForm shelters={shelters} />

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
                Custom trait pairs are flexible on purpose. We can formalize the most common ones
                into structured fields later.
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#eadfce] bg-white/90 p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <h2 className="text-xl font-semibold text-[#4f4338]">Recent Listings</h2>
            <div className="mt-4 space-y-3">
              {formattedRecentDogs.length === 0 ? (
                <p className="text-sm leading-6 text-[#74685d]">
                  No dogs have been added yet from this admin tool.
                </p>
              ) : (
                formattedRecentDogs.map((dog) => (
                  <div
                    key={dog.id}
                    className="rounded-2xl border border-[#eee2d2] bg-[#fffdfa] p-4"
                  >
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
                        href={`/onboarding/dogs/${dog.id}/edit`}
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
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
