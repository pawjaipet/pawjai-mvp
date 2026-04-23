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
    <div className="rounded-[36px] bg-gradient-to-br from-[#fff5e6] via-[#fff0dc] to-[#f9e0b8] p-8 shadow-[0_24px_60px_rgba(176,120,42,0.16)]">
      <div className="rounded-[28px] border border-white/80 bg-white/80 p-8 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
          PawJai Internal
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#4f4338]">
          Unlock the dog onboarding workspace.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#74685d]">
          This is a lightweight internal gate for the team while we shape the long-term shelter
          onboarding UX. It is intentionally simple and not meant to be production-grade security.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Admin phrase</span>
            <input
              type="password"
              name="passphrase"
              className="w-full rounded-2xl border border-[#e7dbc8] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none transition focus:border-[#d69546] focus:ring-4 focus:ring-[#f6d7ad]/50"
              placeholder="Enter the shared team phrase"
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
            className="inline-flex items-center justify-center rounded-full bg-[#d38a2c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#bf781f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Checking phrase..." : "Unlock admin page"}
          </button>
        </form>
      </div>
    </div>
  );
}
