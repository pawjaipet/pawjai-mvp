import Link from "next/link";
import { unlockAdminDraftAction } from "@/app/admindraft/actions";

export default function AdminDraftGate({ showError = false }: { showError?: boolean }) {
  return (
    <main className="min-h-screen bg-[#f5efe6] px-4 py-16 text-[#4f4338]">
      <section className="mx-auto max-w-4xl rounded-[36px] bg-[#ffecc9] p-5 shadow-[0_24px_80px_rgba(130,88,34,0.12)] sm:p-10">
        <div className="rounded-[28px] bg-white/95 px-6 py-10 shadow-[inset_0_0_0_1px_rgba(234,223,206,0.75)] sm:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b77624]">
            PawJai Internal
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Unlock the admin draft workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#7a6d61]">
            This is a lightweight internal gate for the team while we shape the long-term shelter onboarding UX. It is intentionally simple and not meant to be production-grade security.
          </p>

          <form action={unlockAdminDraftAction} className="mt-10 max-w-2xl space-y-5">
            <label className="block" htmlFor="admin-draft-phrase">
              <span className="mb-3 block text-sm font-semibold text-[#6b5b4d]">Admin phrase</span>
              <input
                autoComplete="current-password"
                className="w-full rounded-2xl border border-[#e4d5bf] bg-[#eef4ff] px-5 py-4 text-base text-[#4f4338] outline-none transition focus:border-[#d88c24] focus:bg-white"
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
              className="inline-flex items-center justify-center rounded-full bg-[#d88c24] px-8 py-4 text-base font-semibold text-white shadow-[0_14px_26px_rgba(172,105,27,0.2)] transition hover:bg-[#bf781f]"
              type="submit"
            >
              Unlock admin page
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-[#eadfce] bg-[#faf4ec] px-5 py-4 text-sm text-[#6b5b4d]">
            Shelter employee account?{" "}
            <Link className="font-semibold text-[#b77624] underline-offset-4 hover:underline" href="/admindraft/login">
              Sign in to your shelter portal
            </Link>
            .
          </div>
        </div>
      </section>
    </main>
  );
}
