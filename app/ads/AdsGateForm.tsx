"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdsGateState } from "./actions";

export const initialAdsGateState: AdsGateState = {
  message: "",
  status: "idle",
};

export default function AdsGateForm({
  action,
  initialState,
}: {
  action: (state: AdsGateState, formData: FormData) => Promise<AdsGateState>;
  initialState: AdsGateState;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[36px] bg-gradient-to-br from-[#fff5e6] via-[#fff0dc] to-[#f9e0b8] p-8 shadow-[0_24px_60px_rgba(176,120,42,0.16)]">
        <div className="rounded-[28px] border border-white/80 bg-white/80 p-8 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
            PawJai Ads
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#4f4338]">
            Partner ads login.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#74685d]">
            Enter your partner key to create a PawJai ad.
          </p>

          <form action={formAction} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Username</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                className="w-full rounded-2xl border border-[#e7dbc8] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none transition focus:border-[#d69546] focus:ring-4 focus:ring-[#f6d7ad]/50"
                placeholder="Enter username"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#5b4d40]">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-[#e7dbc8] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none transition focus:border-[#d69546] focus:ring-4 focus:ring-[#f6d7ad]/50"
                placeholder="Enter password"
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
              {pending ? "Unlocking..." : "Unlock ads page"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
