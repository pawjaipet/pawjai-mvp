"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminGateState } from "./form-state";

export default function AdminGateForm({
  action,
  initialState,
}: {
  action: (state: AdminGateState, formData: FormData) => Promise<AdminGateState>;
  initialState: AdminGateState;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="rounded-[36px] bg-[#ffecc9] p-5 shadow-[0_24px_80px_rgba(130,88,34,0.12)] sm:p-10">
      <div className="rounded-[28px] bg-white/95 px-6 py-10 shadow-[inset_0_0_0_1px_rgba(234,223,206,0.75)] sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b77624]">
          PawJai Internal
        </p>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-[#4f4338] sm:text-5xl">
          Unlock the dog onboarding workspace.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#7a6d61]">
          This is a lightweight internal gate for the team while we shape the long-term shelter onboarding UX. It is intentionally simple and not meant to be production-grade security.
        </p>

        <form action={formAction} className="mt-10 max-w-2xl space-y-5">
          <label className="block" htmlFor="admin-phrase">
            <span className="mb-3 block text-sm font-semibold text-[#6b5b4d]">Admin phrase</span>
            <input
              autoComplete="current-password"
              className="w-full rounded-2xl border border-[#e4d5bf] bg-[#eef4ff] px-5 py-4 text-base text-[#4f4338] outline-none transition focus:border-[#d88c24] focus:bg-white"
              id="admin-phrase"
              name="adminPhrase"
              required
              type="password"
            />
          </label>

          {state.message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                state.status === "error"
                  ? "border-[#f1c4c0] bg-[#fff5f4] text-[#9f2d24]"
                  : "border-[#bfdcb5] bg-[#f1faee] text-[#2f6b33]"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-[#d88c24] px-8 py-4 text-base font-semibold text-white shadow-[0_14px_26px_rgba(172,105,27,0.2)] transition hover:bg-[#bf781f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Unlocking..." : "Unlock admin page"}
          </button>
        </form>
      </div>
    </div>
  );
}
