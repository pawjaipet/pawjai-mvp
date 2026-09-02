import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminAuthContext } from "@/utils/admin-auth";
import { getShelterPortalTarget } from "@/utils/shelter-portal";
import { signInShelterPortalAction } from "./actions";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import JsonLd from "@/components/seo/JsonLd";
import { webPageJsonLd } from "@/utils/json-ld";
import { canonicalUrl } from "@/utils/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shelter Portal",
  description: "Sign in to PawJai's shelter portal to manage dog listings, appointments, and adoption workflows.",
  alternates: {
    canonical: "/shelter",
  },
  openGraph: {
    title: "PawJai Shelter Portal",
    description: "Partner shelter sign-in for managing PawJai dog listings and adoption appointments.",
    url: canonicalUrl("/shelter"),
    type: "website",
  },
};

export default async function ShelterLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const context = await getAdminAuthContext({ includePhraseGate: false });
  const resolvedSearchParams = await searchParams;

  if (context?.role === "shelter_admin") {
    const target = await getShelterPortalTarget(context);
    if (target?.startsWith("/shelter/")) redirect(target);
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-16 text-[#65584f]">
      <JsonLd
        data={webPageJsonLd({
          description: "Sign in to PawJai's shelter portal to manage dog listings, appointments, and adoption workflows.",
          name: "PawJai Shelter Portal",
          path: "/shelter",
        })}
      />
      <section className="mx-auto max-w-4xl rounded-[36px] bg-[#f3cbd0] p-5 shadow-[0_24px_80px_rgba(101,88,79,0.12)] sm:p-10">
        <div className="rounded-[28px] bg-white/95 px-6 py-10 shadow-[inset_0_0_0_1px_rgba(234,223,206,0.75)] sm:px-12">
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#cd8188]">
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
                className="w-full rounded-2xl border border-[#e4d5bf] bg-white px-5 py-4 text-base text-[#4f4338] outline-none transition focus:border-[#cd8188] focus:bg-white"
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
                className="w-full rounded-2xl border border-[#e4d5bf] bg-[#eef4ff] px-5 py-4 text-base text-[#4f4338] outline-none transition focus:border-[#cd8188] focus:bg-white"
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
              className="inline-flex items-center justify-center rounded-full bg-[#cd8188] px-8 py-4 text-base font-semibold text-white shadow-[0_14px_26px_rgba(205,129,136,0.22)] transition hover:bg-[#b87179]"
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
