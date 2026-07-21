"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ExternalLink, ImagePlus, Maximize2, Search } from "lucide-react";
import AdCard from "@/components/AdCard";
import { AdminWorkspaceNav } from "@/components/admin/AdminWorkspaceNav";
import { normalizeDogMediaUrl } from "@/utils/dog-media";
import {
  adDisplayStatusLabel,
  getAdDisplayStatus,
  OPEN_ENDED_AD_END_DATE,
  type AdDisplayStatus,
  type AdReviewStatus,
} from "@/utils/ad-workflow";
import { createClient } from "@/utils/supabase/client";
import {
  createAdAction,
  deleteAdAction,
  toggleAdAction,
  updateAdDatesAction,
  updateAdReviewStatusAction,
} from "./actions";

type Ad = {
  ad_status: AdReviewStatus;
  click_url: string;
  company_name: string;
  contact_email: string | null;
  contact_info: string | null;
  contact_phone: string | null;
  created_at: string;
  end_date: string;
  id: string;
  image_url: string;
  is_active: boolean;
  start_date: string;
};

type StatusFilter = "all" | AdDisplayStatus;

const initialState: { error?: string; success?: string } = {};

function statusClass(status: AdDisplayStatus) {
  switch (status) {
    case "approved":
      return "bg-[#eaf6df] text-[#3f6f24]";
    case "pending":
      return "bg-[#fff1dc] text-[#9a6b2a]";
    case "denied":
      return "bg-[#fff1ef] text-[#9a3f2f]";
    case "paused":
      return "bg-[#f0eee9] text-[#6f6258]";
    case "expired":
      return "bg-[#fbe8e8] text-[#9b3a32]";
  }
}

function displayDateRange(ad: Ad) {
  const endDate = ad.end_date === OPEN_ENDED_AD_END_DATE ? "ongoing" : ad.end_date;
  return `${ad.start_date} to ${endDate}`;
}

function contactLine(ad: Ad) {
  return [
    ad.contact_email,
    ad.contact_phone,
    !ad.contact_email && !ad.contact_phone ? ad.contact_info : null,
  ].filter(Boolean).join(" · ") || "No contact provided";
}

function matchesAd(ad: Ad, search: string, status: StatusFilter, today: string) {
  const displayStatus = getAdDisplayStatus({
    endDate: ad.end_date,
    isActive: ad.is_active,
    reviewStatus: ad.ad_status,
    today,
  });
  const query = search.trim().toLowerCase();
  const searchable = [
    ad.company_name,
    ad.click_url,
    ad.contact_email,
    ad.contact_phone,
    ad.contact_info,
    ad.start_date,
    ad.end_date,
  ].filter(Boolean).join(" ").toLowerCase();

  return (!query || searchable.includes(query)) && (status === "all" || displayStatus === status);
}

function AdReviewCard({
  ad,
  onMutate,
  onPreview,
  returnPath,
}: {
  ad: Ad;
  onMutate: () => void;
  onPreview: (ad: Ad) => void;
  returnPath: "/admin/ads" | "/admindraft/ads";
}) {
  const today = new Date().toISOString().slice(0, 10);
  const displayStatus = getAdDisplayStatus({
    endDate: ad.end_date,
    isActive: ad.is_active,
    reviewStatus: ad.ad_status,
    today,
  });
  const [editingDates, setEditingDates] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const cardAd = {
    clickUrl: ad.click_url,
    companyName: ad.company_name,
    id: ad.id,
    imageUrl: ad.image_url,
  };

  function runMutation(mutation: () => Promise<{ error?: string } | void>) {
    setMessage("");
    startTransition(async () => {
      const result = await mutation();
      if (result && "error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setEditingDates(false);
      onMutate();
    });
  }

  function handleDateSubmit(formData: FormData) {
    runMutation(() => updateAdDatesAction(
      ad.id,
      String(formData.get("start_date") ?? ""),
      String(formData.get("end_date") ?? ""),
      returnPath,
    ));
  }

  return (
    <article className="grid gap-6 rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_14px_42px_rgba(128,92,46,0.06)] lg:grid-cols-[250px_minmax(0,1fr)]">
      <div className="flex justify-center lg:justify-start">
        <AdCard ad={cardAd} cardHeight={374} cardWidth={250} />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b77624]">Ad application</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#4f4338]">{ad.company_name}</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusClass(displayStatus)}`}>
            {adDisplayStatusLabel(displayStatus)}
          </span>
        </div>

        <dl className="mt-5 grid gap-3 text-sm text-[#5f5248] md:grid-cols-2">
          <div>
            <dt className="font-semibold text-[#9a8c80]">Contact</dt>
            <dd className="mt-1">{contactLine(ad)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#9a8c80]">Dates</dt>
            <dd className="mt-1">{displayDateRange(ad)}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-semibold text-[#9a8c80]">Destination URL</dt>
            <dd className="mt-1">
              <a className="break-all font-semibold text-[#b77624] hover:underline" href={ad.click_url} rel="noopener noreferrer" target="_blank">
                {ad.click_url}
              </a>
            </dd>
          </div>
        </dl>

        {editingDates ? (
          <form action={handleDateSubmit} className="mt-5 rounded-2xl bg-[#fffdfa] p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Start</span>
                <input
                  className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                  defaultValue={ad.start_date}
                  name="start_date"
                  required
                  type="date"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">End</span>
                <input
                  className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                  defaultValue={ad.end_date}
                  name="end_date"
                  required
                  type="date"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full bg-[#b77624] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
                {pending ? "Saving..." : "Save dates"}
              </button>
              <button className="rounded-full border border-[#eadfce] px-4 py-2 text-sm font-semibold text-[#5b4d40]" onClick={() => setEditingDates(false)} type="button">
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {message ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{message}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {ad.ad_status !== "approved" ? (
            <button
              className="rounded-full bg-[#b77624] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={pending}
              onClick={() => runMutation(() => updateAdReviewStatusAction(ad.id, "approved", returnPath))}
              type="button"
            >
              Accept
            </button>
          ) : null}
          {ad.ad_status !== "denied" ? (
            <button
              className="rounded-full border border-[#f0c9c1] bg-white px-4 py-2 text-sm font-semibold text-[#9a3f2f] disabled:opacity-50"
              disabled={pending}
              onClick={() => runMutation(() => updateAdReviewStatusAction(ad.id, "denied", returnPath))}
              type="button"
            >
              Deny
            </button>
          ) : null}
          {ad.ad_status === "approved" ? (
            <button
              className="rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40] disabled:opacity-50"
              disabled={pending}
              onClick={() => runMutation(() => toggleAdAction(ad.id, !ad.is_active, returnPath))}
              type="button"
            >
              {ad.is_active ? "Pause" : "Resume"}
            </button>
          ) : null}
          <button
            className="rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]"
            onClick={() => setEditingDates((value) => !value)}
            type="button"
          >
            Edit dates
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]"
            onClick={() => onPreview(ad)}
            type="button"
          >
            <Maximize2 className="h-4 w-4" />
            Full preview
          </button>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]"
            href={ad.click_url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
            Open URL
          </a>
          <button
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
            onClick={() => {
              if (!confirm(`Delete ad for ${ad.company_name}?`)) return;
              runMutation(() => deleteAdAction(ad.id, returnPath));
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function AdminAdsPage({ basePath = "/admin" }: { basePath?: "/admin" | "/admindraft" }) {
  const [state, action, pending] = useActionState(createAdAction, initialState);
  const [ads, setAds] = useState<Ad[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const returnPath = `${basePath}/ads` as "/admin/ads" | "/admindraft/ads";
  const today = new Date().toISOString().slice(0, 10);
  const filteredAds = ads.filter((ad) => matchesAd(ad, search, status, today));

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
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      loadAds();
    }
  }, [state.success]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">PawJai Admin</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#4f4338]">Ads review</h1>
        <div className="mt-4">
          <AdminWorkspaceNav active="ads" basePath={basePath} />
        </div>
      </div>

      <section className="rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b77624]">Applications</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#4f4338]">Partner ad submissions</h2>
            <p className="mt-2 text-sm text-[#74685d]">Accept ads to make them live, deny unsuitable submissions, or pause approved campaigns.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_190px_auto] lg:w-[620px]">
            <label className="sr-only" htmlFor="admin-ads-search">Search ads</label>
            <input
              className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
              id="admin-ads-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search advertiser, URL, contact"
              type="search"
              value={search}
            />
            <label className="sr-only" htmlFor="admin-ads-status">Filter ads by status</label>
            <select
              className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] outline-none focus:border-[#d88c24]"
              id="admin-ads-status"
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              value={status}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Live</option>
              <option value="paused">Paused</option>
              <option value="denied">Denied</option>
              <option value="expired">Expired</option>
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d88c24] px-5 py-3 text-sm font-semibold text-white" type="button">
              <Search className="h-4 w-4" />
              {filteredAds.length} ads
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {filteredAds.map((ad) => (
            <AdReviewCard
              ad={ad}
              key={ad.id}
              onMutate={loadAds}
              onPreview={setPreviewAd}
              returnPath={returnPath}
            />
          ))}
          {ads.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#9a8c80]">No ads yet.</p>
          ) : null}
          {ads.length > 0 && filteredAds.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffdfa] p-6 text-sm text-[#9a8c80]">No ads match these filters.</p>
          ) : null}
        </div>
      </section>

      <aside className="mt-8">
        <form
          ref={formRef}
          action={action}
          className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h2 className="text-lg font-semibold text-[#4f4338]">New internal ad</h2>
              <p className="mt-2 text-sm leading-6 text-[#74685d]">PawJai-created ads can still be uploaded directly as approved campaigns.</p>
              <input name="returnTo" type="hidden" value={returnPath} />
              {state.error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p> : null}
              {state.success ? <p className="mt-4 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">{state.success}</p> : null}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Ad Image *</span>
                <span className="mt-2 flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#e3d3bd] bg-[#fffdfa] px-5 py-5 text-center transition hover:border-[#b77624] hover:bg-[#faf4ec]">
                  <ImagePlus className="mb-2 h-7 w-7 text-[#b77624]" />
                  <span className="text-sm font-semibold text-[#4f4338]">Choose ad image</span>
                  <input
                    accept="image/*"
                    className="mt-3 block w-full max-w-sm text-sm text-[#5b4d40] file:mr-3 file:rounded-full file:border-0 file:bg-[#b77624] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#9a6220]"
                    name="image_file"
                    required
                    type="file"
                  />
                </span>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none" name="company_name" placeholder="Company name" required type="text" />
                <input className="rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none" name="click_url" placeholder="pawjaipet.com/ads" required type="text" />
                <input className="rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none" name="contact_email" placeholder="Email optional" type="email" />
                <input className="rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none" name="contact_phone" placeholder="Phone optional" type="tel" />
                <input className="rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none" defaultValue={today} name="start_date" required type="date" />
                <input className="rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none" name="end_date" required type="date" />
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input className="h-4 w-4 rounded accent-[#b77624]" defaultChecked name="is_active" type="checkbox" />
                <span className="text-sm text-[#5b4d40]">Active immediately</span>
              </label>
              <button className="w-full rounded-full bg-[#b77624] px-6 py-3 text-sm font-semibold text-white hover:bg-[#9a6220] disabled:opacity-50" disabled={pending} type="submit">
                {pending ? "Uploading..." : "Upload internal ad"}
              </button>
            </div>
          </div>
        </form>
      </aside>

      {previewAd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8" role="dialog" aria-modal="true">
          <div className="max-h-full overflow-y-auto rounded-[28px] bg-[#f5efe6] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b77624]">Full feed preview</p>
                <h2 className="text-xl font-semibold text-[#4f4338]">{previewAd.company_name}</h2>
              </div>
              <button className="rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#5b4d40]" onClick={() => setPreviewAd(null)} type="button">
                Close
              </button>
            </div>
            <AdCard
              ad={{
                clickUrl: previewAd.click_url,
                companyName: previewAd.company_name,
                id: previewAd.id,
                imageUrl: previewAd.image_url,
              }}
              cardHeight="min(620px, calc(100dvh - 180px))"
              cardWidth="min(370px, calc(100vw - 48px))"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
