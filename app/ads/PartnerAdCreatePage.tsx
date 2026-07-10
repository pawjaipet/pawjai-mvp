"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPartnerAdAction } from "./actions";

const initialCreateState: { error?: string; success?: string } = {};

export default function PartnerAdCreatePage() {
  const [state, action, pending] = useActionState(createPartnerAdAction, initialCreateState);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">PawJai Ads</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#4f4338]">Create ad</h1>
      </div>

      <form
        ref={formRef}
        action={action}
        className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]"
      >
        <div className="space-y-4">
          {state.error ? (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{state.success}</p>
          ) : null}

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Ad image *</label>
            <input
              accept="image/*"
              className="block w-full text-sm text-[#5b4d40] file:mr-3 file:rounded-full file:border-0 file:bg-[#faf4ec] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-[#b77624] hover:file:bg-[#f0e8d8]"
              name="image_file"
              required
              type="file"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Company name *</label>
            <input
              className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
              name="company_name"
              placeholder="e.g. PETBEO"
              required
              type="text"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Contact info</label>
            <input
              className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
              name="contact_info"
              placeholder="phone / email"
              type="text"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Click URL *</label>
            <input
              className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
              name="click_url"
              placeholder="pawjai.co.th/ads"
              required
              type="text"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Start date *</label>
              <input
                className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                defaultValue={today}
                name="start_date"
                required
                type="date"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">End date *</label>
              <input
                className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                name="end_date"
                required
                type="date"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              className="h-4 w-4 rounded accent-[#b77624]"
              defaultChecked
              name="is_active"
              type="checkbox"
            />
            <span className="text-sm text-[#5b4d40]">Active immediately</span>
          </label>

          <button
            className="w-full rounded-full bg-[#b77624] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#9a6220] disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? "Uploading..." : "Upload Ad"}
          </button>
        </div>
      </form>
    </div>
  );
}
