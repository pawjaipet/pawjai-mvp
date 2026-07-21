"use client";

import Link from "next/link";
import { useActionState, useRef, useTransition } from "react";
import { createAdAction, deleteAdAction, toggleAdAction, updateAdDatesAction } from "./actions";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { normalizeDogMediaUrl } from "@/utils/dog-media";

type Ad = {
  id: string;
  company_name: string;
  contact_info: string | null;
  image_url: string;
  click_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

const initialState: { error?: string; success?: string } = {};

function AdRow({ ad, onMutate }: { ad: Ad; onMutate: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const expired = ad.end_date < today;
  const [editingDates, setEditingDates] = useState(false);
  const [dateError, setDateError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDateSubmit(formData: FormData) {
    setDateError("");
    startTransition(async () => {
      const result = await updateAdDatesAction(
        ad.id,
        String(formData.get("start_date") ?? ""),
        String(formData.get("end_date") ?? ""),
      );

      if (result.error) {
        setDateError(result.error);
        return;
      }

      setEditingDates(false);
      onMutate();
    });
  }

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[#eadfce] bg-white p-4">
      <img
        src={ad.image_url}
        alt={ad.company_name}
        className="h-20 w-20 rounded-xl object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-[#4f4338]">{ad.company_name}</p>
          {expired && (
            <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5">Expired</span>
          )}
          {!expired && ad.is_active && (
            <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">Live</span>
          )}
          {!expired && !ad.is_active && (
            <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Paused</span>
          )}
        </div>
        {editingDates ? (
          <form action={handleDateSubmit} className="mt-2 space-y-2 rounded-2xl bg-[#fffdfa] p-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#9a8c80]">Start</span>
                <input
                  type="date"
                  name="start_date"
                  required
                  defaultValue={ad.start_date}
                  className="w-full rounded-xl border border-[#eadfce] px-2 py-1.5 text-xs text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#9a8c80]">End</span>
                <input
                  type="date"
                  name="end_date"
                  required
                  defaultValue={ad.end_date}
                  className="w-full rounded-xl border border-[#eadfce] px-2 py-1.5 text-xs text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                />
              </label>
            </div>
            {dateError ? <p className="text-xs text-red-600">{dateError}</p> : null}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-[#b77624] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#9a6220] disabled:opacity-50"
              >
                {pending ? "Saving..." : "Save dates"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateError("");
                  setEditingDates(false);
                }}
                className="rounded-full border border-[#eadfce] px-3 py-1.5 text-xs text-[#5b4d40] hover:bg-[#faf4ec]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-1 text-xs text-[#9a8c80]">{ad.start_date} → {ad.end_date}</p>
        )}
        {ad.contact_info && (
          <p className="mt-0.5 text-xs text-[#9a8c80]">{ad.contact_info}</p>
        )}
        <a href={ad.click_url} target="_blank" rel="noopener noreferrer"
          className="mt-1 block text-xs text-[#b77624] truncate hover:underline">
          {ad.click_url}
        </a>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={() => {
            setDateError("");
            setEditingDates((value) => !value);
          }}
          className="text-xs rounded-full border border-[#eadfce] px-3 py-1.5 text-[#5b4d40] hover:bg-[#faf4ec]"
        >
          Edit dates
        </button>
        <button
          onClick={async () => { await toggleAdAction(ad.id, !ad.is_active); onMutate(); }}
          className="text-xs rounded-full border border-[#eadfce] px-3 py-1.5 text-[#5b4d40] hover:bg-[#faf4ec]"
        >
          {ad.is_active ? "Pause" : "Resume"}
        </button>
        <button
          onClick={async () => {
            if (!confirm(`Delete ad for ${ad.company_name}?`)) return;
            await deleteAdAction(ad.id);
            onMutate();
          }}
          className="text-xs rounded-full border border-red-200 px-3 py-1.5 text-red-500 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function AdminAdsPage() {
  const [state, action, pending] = useActionState(createAdAction, initialState);
  const [ads, setAds] = useState<Ad[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  async function loadAds() {
    const supabase = createClient();
    const { data } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    setAds((data ?? []).map((ad) => ({
      ...ad,
      image_url: normalizeDogMediaUrl(ad.image_url) ?? ad.image_url,
    })));
  }

  useEffect(() => { loadAds(); }, []);
  useEffect(() => { if (state.success) { formRef.current?.reset(); loadAds(); } }, [state.success]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">PawJai Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#4f4338]">Ads</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin">
            Create dog
          </Link>
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/listings">
            Manage listings
          </Link>
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/bookings">
            Bookings
          </Link>
          <Link className="rounded-full bg-[#d38a2c] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(179,111,31,0.22)]" href="/admin/ads">
            Ads
          </Link>
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/pawjaiprofile">
            About content
          </Link>
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/accounts">
            Accounts
          </Link>
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href="/admin/audit">
            Audit
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">

        {/* Existing ads */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#4f4338]">All Ads ({ads.length})</h2>
          {ads.length === 0 && (
            <p className="text-sm text-[#9a8c80]">No ads yet.</p>
          )}
          {ads.map((ad) => (
            <AdRow key={ad.id} ad={ad} onMutate={loadAds} />
          ))}
        </section>

        {/* Upload form */}
        <aside>
          <form ref={formRef} action={action}
            className="rounded-[28px] border border-[#eadfce] bg-white p-6 space-y-4 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
            <h2 className="text-lg font-semibold text-[#4f4338]">New Ad</h2>

            {state.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{state.error}</p>
            )}
            {state.success && (
              <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">{state.success}</p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Ad Image *</label>
              <input type="file" name="image_file" accept="image/*" required
                className="block w-full text-sm text-[#5b4d40] file:mr-3 file:rounded-full file:border-0 file:bg-[#faf4ec] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-[#b77624] hover:file:bg-[#f0e8d8]" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Company Name *</label>
              <input type="text" name="company_name" required placeholder="e.g. PETBEO"
                className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:outline-none focus:border-[#b77624]" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Contact Info</label>
              <input type="text" name="contact_info" placeholder="phone / email"
                className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:outline-none focus:border-[#b77624]" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Click URL *</label>
              <input type="text" name="click_url" required placeholder="pawjaipet.com/ads"
                className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:outline-none focus:border-[#b77624]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Start Date *</label>
                <input type="date" name="start_date" required defaultValue={today}
                  className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:outline-none focus:border-[#b77624]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">End Date *</label>
                <input type="date" name="end_date" required
                  className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:outline-none focus:border-[#b77624]" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_active" defaultChecked
                className="h-4 w-4 rounded accent-[#b77624]" />
              <span className="text-sm text-[#5b4d40]">Active immediately</span>
            </label>

            <button type="submit" disabled={pending}
              className="w-full rounded-full bg-[#b77624] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#9a6220] disabled:opacity-50">
              {pending ? "Uploading…" : "Upload Ad"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
