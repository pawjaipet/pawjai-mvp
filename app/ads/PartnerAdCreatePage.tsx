"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Upload } from "lucide-react";
import AdCard from "@/components/AdCard";
import { normalizeAdClickUrl } from "@/utils/ad-click-url";
import { createPartnerAdAction, type PartnerAdCreateState } from "./actions";

const initialCreateState: PartnerAdCreateState = {};

type PreviewState = {
  clickUrl: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  endDate: string;
  imageUrl: string;
  mediaType: "image" | "video";
  startDate: string;
};

const assetSpecs = [
  "Best size: 370 x 620 px vertical",
  "Safe ratio: 9:16 portrait",
  "Images: JPG, PNG, or WebP",
  "Videos: MP4, MOV, or WebM, under 210 MB",
];

export default function PartnerAdCreatePage() {
  const [state, action, pending] = useActionState(createPartnerAdAction, initialCreateState);
  const [clientError, setClientError] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    return () => {
      if (preview?.imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(preview.imageUrl);
      }
    };
  }, [preview?.imageUrl]);

  function handlePreview() {
    const form = formRef.current;
    if (!form) return;

    setClientError("");
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const file = formData.get("image_file");
    const startDate = String(formData.get("start_date") ?? "");
    const endDate = String(formData.get("end_date") ?? "");

    if (startDate < today) {
      setClientError("Start date must be today or later.");
      return;
    }

    if (endDate < startDate) {
      setClientError("End date must be on or after the start date.");
      return;
    }

    if (!(file instanceof File) || file.size <= 0) {
      setClientError("Choose an ad image or video before previewing.");
      return;
    }

    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setClientError("Upload a JPG, PNG, WebP, MP4, MOV, or WebM ad asset.");
      return;
    }

    let clickUrl = "";
    try {
      clickUrl = normalizeAdClickUrl(formData.get("click_url"));
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Enter a valid click URL.");
      return;
    }

    if (preview?.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(preview.imageUrl);
    }

    setPreview({
      clickUrl,
      companyName: String(formData.get("company_name") ?? "").trim(),
      contactEmail: String(formData.get("contact_email") ?? "").trim(),
      contactPhone: String(formData.get("contact_phone") ?? "").trim(),
      endDate,
      imageUrl: URL.createObjectURL(file),
      mediaType,
      startDate,
    });
  }

  if (state.success && state.ad) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 text-[#4f4338]">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">PawJai Ads</p>
          <h1 className="mt-1 text-3xl font-semibold">Ad submitted</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74685d]">
            Your ad is now with the PawJai team for review. Once approved, it can appear between dog profiles in this format.
          </p>
        </div>

        <div className="grid gap-6 rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex justify-center">
            <AdCard
              ad={{
                clickUrl: state.ad.clickUrl,
                companyName: state.ad.companyName,
                id: state.ad.id,
                imageUrl: state.ad.imageUrl,
                mediaType: state.ad.mediaType,
              }}
              cardHeight={560}
              cardWidth={334}
              trackClicks={false}
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf6df] px-4 py-2 text-sm font-semibold text-[#3f6f24]">
              <CheckCircle2 className="h-4 w-4" />
              Submitted for review
            </div>
            <h2 className="mt-5 text-2xl font-semibold">{state.ad.companyName}</h2>
            <p className="mt-3 text-sm leading-6 text-[#74685d]">
              PawJai will review the creative, link, and dates before it goes live.
            </p>
            <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a8c80]">Ad submission code</p>
              <p className="mt-1 text-2xl font-semibold text-[#b77624]">{state.ad.submissionCode}</p>
            </div>
            <dl className="mt-6 grid gap-3 text-sm">
              <div>
                <dt className="font-semibold text-[#9a8c80]">Destination URL</dt>
                <dd className="mt-1 break-all text-[#b77624]">{state.ad.clickUrl}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#9a8c80]">Ad format</dt>
                <dd className="mt-1">{state.ad.mediaType === "video" ? "Video" : "Image"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#9a8c80]">Requested dates</dt>
                <dd className="mt-1">{state.ad.startDate} to {state.ad.endDate}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#9a8c80]">Contact email</dt>
                <dd className="mt-1">{state.ad.contactEmail || "Not provided"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#9a8c80]">Contact phone</dt>
                <dd className="mt-1">{state.ad.contactPhone || "Not provided"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#9a8c80]">Keep this code</dt>
                <dd className="mt-1">Use this code when following up with PawJai.</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-[#4f4338]">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">PawJai Ads</p>
        <h1 className="mt-1 text-3xl font-semibold">{preview ? "Preview ad" : "Create ad"}</h1>
        {!preview ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74685d]">
            Submit a product or brand ad for PawJai review. No login is needed; we will email your ad ID after submission.
          </p>
        ) : null}
      </div>

      <form
        ref={formRef}
        action={action}
        className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]"
      >
        <div className={preview ? "hidden" : "space-y-5"}>
          {(clientError || state.error) ? (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{clientError || state.error}</p>
          ) : null}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Ad creative *</span>
            <span className="mt-2 grid min-h-[168px] cursor-pointer gap-5 rounded-[24px] border-2 border-dashed border-[#e3d3bd] bg-[#fffdfa] px-5 py-6 transition hover:border-[#b77624] hover:bg-[#faf4ec] md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
              <span className="flex flex-col items-center justify-center text-center">
                <ImagePlus className="mb-3 h-10 w-10 text-[#b77624]" />
                <span className="text-lg font-semibold text-[#4f4338]">Choose image or video</span>
                <span className="mt-1 text-sm text-[#9a8c80]">This is the asset users will tap in the swipe feed.</span>
              </span>
              <span className="rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-left">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#9a8c80]">Creative specs</span>
                <span className="mt-2 grid gap-1 text-sm text-[#74685d]">
                  {assetSpecs.map((spec) => (
                    <span key={spec}>{spec}</span>
                  ))}
                </span>
              </span>
              <input
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                className="block w-full text-sm text-[#5b4d40] file:mr-3 file:rounded-full file:border-0 file:bg-[#b77624] file:px-6 file:py-3 file:text-sm file:font-semibold file:text-white hover:file:bg-[#9a6220] md:col-span-2"
                name="image_file"
                required
                type="file"
              />
            </span>
          </label>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Company name *</label>
            <input
              className="w-full rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
              name="company_name"
              placeholder="e.g. PETBEO"
              required
              type="text"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Email</label>
              <input
                className="w-full rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                name="contact_email"
                placeholder="name@company.com"
                type="email"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Phone number</label>
              <input
                className="w-full rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                name="contact_phone"
                placeholder="+66..."
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Click URL *</label>
            <input
              className="w-full rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
              name="click_url"
              placeholder="pawjaipet.com/ads"
              required
              type="text"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Requested start date *</label>
              <input
                className="w-full rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                defaultValue={today}
                min={today}
                name="start_date"
                required
                type="date"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Requested end date *</label>
              <input
                className="w-full rounded-xl border border-[#eadfce] px-3 py-3 text-sm text-[#4f4338] focus:border-[#b77624] focus:outline-none"
                defaultValue={today}
                min={today}
                name="end_date"
                required
                type="date"
              />
            </div>
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b77624] px-6 py-3 text-sm font-semibold text-white hover:bg-[#9a6220]"
            onClick={handlePreview}
            type="button"
          >
            <Upload className="h-4 w-4" />
            Continue to preview
          </button>
        </div>

        {preview ? (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="flex justify-center">
              <AdCard
                ad={{
                  clickUrl: preview.clickUrl,
                  companyName: preview.companyName,
                  id: "preview",
                  imageUrl: preview.imageUrl,
                  mediaType: preview.mediaType,
                }}
                cardHeight={560}
                cardWidth={334}
                trackClicks={false}
              />
            </div>
            <div className="flex flex-col justify-center">
              {(clientError || state.error) ? (
                <p className="mb-5 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{clientError || state.error}</p>
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">Review before submitting</p>
              <h2 className="mt-3 text-2xl font-semibold">{preview.companyName}</h2>
              <p className="mt-3 break-all text-sm font-semibold text-[#b77624]">{preview.clickUrl}</p>
              <p className="mt-5 text-sm leading-6 text-[#74685d]">
                This is the same ad-card format users will see in the swipe feed after PawJai approves it.
              </p>
              <dl className="mt-6 grid gap-3 text-sm">
                <div>
                  <dt className="font-semibold text-[#9a8c80]">Ad format</dt>
                  <dd>{preview.mediaType === "video" ? "Video" : "Image"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#9a8c80]">Contact email</dt>
                  <dd>{preview.contactEmail || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#9a8c80]">Contact phone</dt>
                  <dd>{preview.contactPhone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#9a8c80]">Requested dates</dt>
                  <dd>{preview.startDate} to {preview.endDate}</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-[#eadfce] bg-white px-6 py-3 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]"
                  onClick={() => setPreview(null)}
                  type="button"
                >
                  Modify ad
                </button>
                <button
                  className="rounded-full bg-[#b77624] px-6 py-3 text-sm font-semibold text-white hover:bg-[#9a6220] disabled:opacity-50"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? "Submitting..." : "Submit for review"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
