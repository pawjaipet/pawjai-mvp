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
    <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-[#fffdfa] shadow-[0_24px_70px_rgba(92,66,38,0.12)]">
      <div className="border-b border-[#f0e2cf] bg-[#4f4338] px-8 py-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f4c981]">
          PawJai Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight">
          Sign in to the shelter workspace.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#f6eadb]">
          Use the PawJai admin account or the shared account assigned to your shelter.
        </p>
      </div>

      <div className="p-8">
        <div className="rounded-2xl border border-[#f0e2cf] bg-[#fff8ee] px-4 py-3 text-sm leading-6 text-[#6f5d4c]">
          Shelter accounts can manage only their linked shelter. PawJai admin can manage the full
          workspace.
        </div>

        <form action={formAction} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Admin email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              className="w-full rounded-2xl border border-[#e7dbc8] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none transition focus:border-[#d69546] focus:ring-4 focus:ring-[#f6d7ad]/50"
              placeholder="shelter@pawjai.co.th"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-[#e7dbc8] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none transition focus:border-[#d69546] focus:ring-4 focus:ring-[#f6d7ad]/50"
              placeholder="Enter the account password"
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
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
