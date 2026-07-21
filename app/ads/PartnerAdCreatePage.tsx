"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Upload } from "lucide-react";
import AdCard from "@/components/AdCard";
import { normalizeAdClickUrl } from "@/utils/ad-click-url";
import { OPEN_ENDED_AD_END_DATE } from "@/utils/ad-workflow";
import { createPartnerAdAction, type PartnerAdCreateState } from "./actions";

const initialCreateState: PartnerAdCreateState = {};

type PreviewState = {
  clickUrl: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  imageUrl: string;
  startDate: string;
};

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

    if (startDate < today) {
      setClientError(`Start date must be today or later.`);
      return;
    }

    if (!(file instanceof File) || file.size <= 0) {
      setClientError("Choose an ad image before previewing.");
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
      imageUrl: URL.createObjectURL(file),
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
              }}
              cardHeight={560}
              cardWidth={334}
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf6df] px-4 py-2 text-sm font-semibold text-[#3f6f24]">
              <CheckCircle2 className="h-4 w-4" />
              Submitted for review
            </div>
            <h2 className="mt-5 text-2xl font-semibold">{state.ad.companyName}</h2>
            <p className="mt-3 text-sm leading-6 text-[#74685d]">
              PawJai will review the image, link, and dates before it goes live.
            </p>
            <dl className="mt-6 grid gap-3 text-sm">
              <div>
                <dt className="font-semibold text-[#9a8c80]">Destination URL</dt>
                <dd className="mt-1 break-all text-[#b77624]">{state.ad.clickUrl}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#9a8c80]">Requested start</dt>
                <dd className="mt-1">{state.ad.startDate}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#9a8c80]">End date</dt>
                <dd className="mt-1">{state.ad.endDate === OPEN_ENDED_AD_END_DATE ? "Ongoing until PawJai updates it" : state.ad.endDate}</dd>
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
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">Ad image *</span>
            <span className="mt-2 flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#e3d3bd] bg-[#fffdfa] px-5 py-6 text-center transition hover:border-[#b77624] hover:bg-[#faf4ec]">
              <ImagePlus className="mb-3 h-8 w-8 text-[#b77624]" />
              <span className="text-base font-semibold text-[#4f4338]">Choose ad image</span>
              <span className="mt-1 text-sm text-[#9a8c80]">JPG, PNG, or WebP</span>
              <input
                accept="image/*"
                className="mt-4 block w-full max-w-sm text-sm text-[#5b4d40] file:mr-3 file:rounded-full file:border-0 file:bg-[#b77624] file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#9a6220]"
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
            <div className="rounded-xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9a8c80]">End date</p>
              <p className="mt-2 text-sm font-semibold text-[#4f4338]">Ongoing until PawJai confirms dates</p>
              <input name="end_date" type="hidden" value={OPEN_ENDED_AD_END_DATE} />
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
                }}
                cardHeight={560}
                cardWidth={334}
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
                  <dt className="font-semibold text-[#9a8c80]">Contact email</dt>
                  <dd>{preview.contactEmail || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#9a8c80]">Contact phone</dt>
                  <dd>{preview.contactPhone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#9a8c80]">Requested start</dt>
                  <dd>{preview.startDate}</dd>
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
