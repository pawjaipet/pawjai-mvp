import Image from "next/image";
import Link from "next/link";
import { Bone, PawPrint } from "lucide-react";

type AdminDraftGateProps = {
  returnTo?: string;
  showError?: boolean;
};

export default function AdminDraftGate({ returnTo = "/admindraft", showError = false }: AdminDraftGateProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f1e8] px-4 py-16 text-[#65584f]">
      <Bone className="pointer-events-none absolute right-10 top-20 hidden h-28 w-28 rotate-12 text-[#d6c8ad]/45 md:block" strokeWidth={1.3} />
      <PawPrint className="pointer-events-none absolute bottom-24 left-16 hidden h-20 w-20 -rotate-12 text-[#cd8188]/20 md:block" strokeWidth={1.4} />
      <section className="relative mx-auto max-w-4xl rounded-[36px] bg-[#f3cbd0] p-5 shadow-[0_24px_80px_rgba(101,88,79,0.12)] sm:p-10">
        <div className="rounded-[28px] bg-white/95 px-6 py-10 shadow-[inset_0_0_0_1px_rgba(214,200,173,0.75)] sm:px-12">
          <div className="relative h-20 w-20 overflow-hidden rounded-[24px] bg-[#f5f1e8] shadow-[inset_0_0_0_1px_rgba(214,200,173,0.8)]">
            <Image
              alt="PawJai"
              className="object-contain p-2"
              fill
              priority
              sizes="80px"
              src="/pawjai-logo-square.png"
            />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-[#cd8188]">
            PawJai Internal
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Unlock the admin draft workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#65584f]">
            This is a lightweight internal gate for the team while we shape the long-term shelter onboarding UX. It is intentionally simple and not meant to be production-grade security.
          </p>

          <form action="/admindraft/unlock" className="mt-10 max-w-2xl space-y-5" method="post">
            <input name="returnTo" type="hidden" value={returnTo} />
            <label className="block" htmlFor="admin-draft-phrase">
              <span className="mb-3 block text-sm font-semibold text-[#65584f]">Admin phrase</span>
              <input
                autoComplete="current-password"
                className="w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-5 py-4 text-base text-[#65584f] outline-none transition focus:border-[#cd8188] focus:bg-white focus:ring-4 focus:ring-[#f3cbd0]/55"
                id="admin-draft-phrase"
                name="adminPhrase"
                required
                type="password"
              />
            </label>

            {showError ? (
              <p className="rounded-2xl border border-[#f0c9c1] bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#9a3f2f]">
                That phrase does not match. Try again.
              </p>
            ) : null}

            <button
              className="inline-flex items-center justify-center rounded-full bg-[#cd8188] px-8 py-4 text-base font-semibold text-white shadow-[0_14px_26px_rgba(205,129,136,0.24)] transition hover:bg-[#b87179]"
              type="submit"
            >
              Unlock admin page
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-[#d6c8ad] bg-[#f5f1e8] px-5 py-4 text-sm text-[#65584f]">
            Shelter employee account?{" "}
            <Link className="font-semibold text-[#cd8188] underline-offset-4 hover:underline" href="/shelter">
              Sign in to your shelter portal
            </Link>
            .
          </div>
        </div>
      </section>
    </main>
  );
}
