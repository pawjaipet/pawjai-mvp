import { redirect } from "next/navigation";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { getShelterPortalTarget } from "@/utils/shelter-portal";
import { signInShelterPortalAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ShelterLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const context = await getAdminAuthContext({ includePhraseGate: false });
  const resolvedSearchParams = await searchParams;

  if (context) {
    const target = await getShelterPortalTarget(context);
    if (target) redirect(target);
  }

  return (
    <main className="min-h-screen bg-[#f5efe6] px-4 py-16 text-[#4f4338]">
      <section className="mx-auto max-w-4xl rounded-[36px] bg-[#ffecc9] p-5 shadow-[0_24px_80px_rgba(130,88,34,0.12)] sm:p-10">
        <div className="rounded-[28px] bg-white/95 px-6 py-10 shadow-[inset_0_0_0_1px_rgba(234,223,206,0.75)] sm:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b77624]">
            PawJai Shelter Portal
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Sign in to your shelter workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#7a6d61]">
            This portal is for partner shelters. After sign-in, PawJai opens only the shelter workspace linked to that account.
          </p>

          <form action={signInShelterPortalAction} className="mt-10 max-w-2xl space-y-5">
            <label className="block" htmlFor="shelter-identifier">
              <span className="mb-3 block text-sm font-semibold text-[#6b5b4d]">Username</span>
              <input
                autoComplete="username"
                className="w-full rounded-2xl border border-[#e4d5bf] bg-white px-5 py-4 text-base text-[#4f4338] outline-none transition focus:border-[#d88c24] focus:bg-white"
                id="shelter-identifier"
                name="identifier"
                placeholder="thevoice"
                required
                type="text"
              />
            </label>

            <label className="block" htmlFor="shelter-password">
              <span className="mb-3 block text-sm font-semibold text-[#6b5b4d]">Password</span>
              <input
                autoComplete="current-password"
                className="w-full rounded-2xl border border-[#e4d5bf] bg-[#eef4ff] px-5 py-4 text-base text-[#4f4338] outline-none transition focus:border-[#d88c24] focus:bg-white"
                id="shelter-password"
                name="password"
                placeholder="Enter the account password"
                required
                type="password"
              />
            </label>

            {resolvedSearchParams?.message ? (
              <p className="rounded-2xl border border-[#f0c9c1] bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a3f2f]">
                {resolvedSearchParams.message}
              </p>
            ) : null}

            <button
              className="inline-flex items-center justify-center rounded-full bg-[#d88c24] px-8 py-4 text-base font-semibold text-white shadow-[0_14px_26px_rgba(172,105,27,0.2)] transition hover:bg-[#bf781f]"
              type="submit"
            >
              Sign in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
