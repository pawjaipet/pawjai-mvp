"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ImagePlus, Upload } from "lucide-react";
import AdCard from "@/components/AdCard";
import { normalizeAdClickUrl } from "@/utils/ad-click-url";
import {
  createPartnerAdAction,
  createPartnerAdFromUploadedMediaAction,
  prepareDirectAdMediaUploadAction,
  type PartnerAdCreateState,
} from "./actions";

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

type AdCreativeSettings = {
  height: number;
  maxUploadMb: number;
  maxVideoSeconds: number;
  width: number;
};

function gcd(left: number, right: number): number {
  return right === 0 ? left : gcd(right, left % right);
}

function ratioLabel(settings: AdCreativeSettings) {
  const divisor = gcd(settings.width, settings.height);
  return `${settings.width / divisor}:${settings.height / divisor}`;
}

function assetSpecs(settings: AdCreativeSettings) {
  return [
    `Best size: ${settings.width} x ${settings.height} px vertical`,
    `Safe ratio: ${ratioLabel(settings)} portrait`,
    "Images: JPG, PNG, WebP, HEIC, or HEIF",
    `Videos: MP4 or MOV, ${settings.maxVideoSeconds}s max, under ${settings.maxUploadMb} MB`,
  ];
}

function extensionFromFileName(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isAcceptedAdAsset(file: File) {
  const extension = extensionFromFileName(file.name);
  const type = file.type.split(";")[0]?.trim().toLowerCase();
  return (
    ["heic", "heif", "jpeg", "jpg", "mov", "mp4", "png", "webp"].includes(extension) ||
    [
      "image/heic",
      "image/heif",
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ].includes(type)
  );
}

function isVideoAsset(file: File) {
  const extension = extensionFromFileName(file.name);
  return file.type.startsWith("video/") || extension === "mov" || extension === "mp4";
}

function getVideoDuration(file: File, maxVideoSeconds: number) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read this video length. Please upload an MP4 or MOV under ${maxVideoSeconds} seconds.`));
    };
    video.src = url;
  });
}

async function sha1Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-1", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function PartnerAdCreatePage({ creativeSettings }: { creativeSettings: AdCreativeSettings }) {
  const [state, action, pending] = useActionState(createPartnerAdAction, initialCreateState);
  const [clientError, setClientError] = useState("");
  const [directSubmitState, setDirectSubmitState] = useState<PartnerAdCreateState>({});
  const [directSubmitPending, setDirectSubmitPending] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const specs = assetSpecs(creativeSettings);
  const resultState = directSubmitState.success || directSubmitState.error ? directSubmitState : state;
  const submitting = pending || directSubmitPending;

  useEffect(() => {
    return () => {
      if (preview?.imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(preview.imageUrl);
      }
    };
  }, [preview?.imageUrl]);

  async function handlePreview() {
    const form = formRef.current;
    if (!form) return;

    setClientError("");
    setDirectSubmitState({});
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

    if (file.size > creativeSettings.maxUploadMb * 1024 * 1024) {
      setClientError(`Upload a file under ${creativeSettings.maxUploadMb} MB.`);
      return;
    }

    if (!isAcceptedAdAsset(file)) {
      setClientError("Upload a JPG, PNG, WebP, HEIC, HEIF, MP4, or MOV ad asset.");
      return;
    }

    const mediaType = isVideoAsset(file) ? "video" : "image";
    if (mediaType === "video") {
      try {
        const duration = await getVideoDuration(file, creativeSettings.maxVideoSeconds);
        if (duration > creativeSettings.maxVideoSeconds + 0.25) {
          setClientError(`Ad videos must be ${creativeSettings.maxVideoSeconds} seconds or shorter.`);
          return;
        }
      } catch (error) {
        setClientError(error instanceof Error ? error.message : "Could not read this video length.");
        return;
      }
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!preview || preview.mediaType !== "video") return;

    event.preventDefault();
    const form = formRef.current;
    if (!form || directSubmitPending) return;

    setClientError("");
    setDirectSubmitState({});

    const originalFormData = new FormData(form);
    const file = originalFormData.get("image_file");
    if (!(file instanceof File) || file.size <= 0) {
      setClientError("Choose an ad video before submitting.");
      return;
    }

    setDirectSubmitPending(true);
    try {
      const uploadTarget = await prepareDirectAdMediaUploadAction({
        contentType: file.type,
        fileName: file.name,
        mediaType: "video",
        size: file.size,
      });

      if (uploadTarget.error || !uploadTarget.authorizationToken || !uploadTarget.uploadUrl || !uploadTarget.fileName || !uploadTarget.publicUrl || !uploadTarget.contentType) {
        setClientError(uploadTarget.error ?? "Could not prepare the video upload.");
        return;
      }

      const checksum = await sha1Hex(file);
      const uploadResponse = await fetch(uploadTarget.uploadUrl, {
        body: file,
        headers: {
          Authorization: uploadTarget.authorizationToken,
          "Content-Type": uploadTarget.contentType,
          "X-Bz-Content-Sha1": checksum,
          "X-Bz-File-Name": encodeURIComponent(uploadTarget.fileName),
        },
        method: "POST",
      });

      if (!uploadResponse.ok) {
        setClientError(`Video upload failed with status ${uploadResponse.status}. Please try a smaller MP4 or contact PawJai.`);
        return;
      }

      const metadata = new FormData();
      for (const [key, value] of originalFormData.entries()) {
        if (key !== "image_file") metadata.append(key, value);
      }
      metadata.set("uploaded_image_url", uploadTarget.publicUrl);
      metadata.set("uploaded_media_type", "video");

      const result = await createPartnerAdFromUploadedMediaAction(undefined, metadata);
      setDirectSubmitState(result);
      if (result.error) setClientError(result.error);
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Video upload failed. Please try a smaller MP4 or contact PawJai.");
    } finally {
      setDirectSubmitPending(false);
    }
  }

  if (resultState.success && resultState.ad) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 text-[#65584f]">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#cd8188]">PawJai Ads</p>
          <h1 className="mt-1 text-3xl font-semibold">Ad submitted</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8a7b70]">
            Your ad is now with the PawJai team for review. Once approved, it can appear between dog profiles in this format.
          </p>
        </div>

        <div className="grid gap-6 rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_16px_50px_rgba(101,88,79,0.08)] lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="flex justify-center">
            <AdCard
              ad={{
                clickUrl: resultState.ad.clickUrl,
                companyName: resultState.ad.companyName,
                id: resultState.ad.id,
                imageUrl: resultState.ad.imageUrl,
                mediaType: resultState.ad.mediaType,
              }}
              cardHeight={560}
              cardWidth={370}
              trackClicks={false}
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf6df] px-4 py-2 text-sm font-semibold text-[#3f6f24]">
              <CheckCircle2 className="h-4 w-4" />
              Submitted for review
            </div>
            <h2 className="mt-5 text-2xl font-semibold">{resultState.ad.companyName}</h2>
            <p className="mt-3 text-sm leading-6 text-[#8a7b70]">
              PawJai will review the creative, link, and dates before it goes live.
            </p>
            <div className="mt-5 rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7b70]">Ad submission code</p>
              <p className="mt-1 text-2xl font-semibold text-[#cd8188]">{resultState.ad.submissionCode}</p>
            </div>
            <dl className="mt-6 grid gap-3 text-sm">
              <div>
                <dt className="font-semibold text-[#8a7b70]">Destination URL</dt>
                <dd className="mt-1 break-all text-[#cd8188]">{resultState.ad.clickUrl}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8a7b70]">Ad format</dt>
                <dd className="mt-1">{resultState.ad.mediaType === "video" ? "Video" : "Image"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8a7b70]">Requested dates</dt>
                <dd className="mt-1">{resultState.ad.startDate} to {resultState.ad.endDate}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8a7b70]">Contact email</dt>
                <dd className="mt-1">{resultState.ad.contactEmail || "Not provided"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8a7b70]">Contact phone</dt>
                <dd className="mt-1">{resultState.ad.contactPhone || "Not provided"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8a7b70]">Keep this code</dt>
                <dd className="mt-1">Use this code when following up with PawJai.</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-[#65584f]">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#cd8188]">PawJai Ads</p>
        <h1 className="mt-1 text-3xl font-semibold">{preview ? "Preview ad" : "Create ad"}</h1>
        {!preview ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8a7b70]">
            Submit a product or brand ad for PawJai review. No login is needed; we will email your ad ID after submission.
          </p>
        ) : null}
      </div>

      <form
        ref={formRef}
        action={action}
        className="rounded-[28px] border border-[#d6c8ad] bg-white p-6 shadow-[0_16px_50px_rgba(101,88,79,0.08)]"
        onSubmit={handleSubmit}
      >
        <div className={preview ? "hidden" : "space-y-5"}>
          {(clientError || resultState.error) ? (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{clientError || resultState.error}</p>
          ) : null}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7b70]">Ad creative *</span>
            <span className="mt-2 grid min-h-[168px] cursor-pointer gap-5 rounded-[24px] border-2 border-dashed border-[#d6c8ad] bg-[#fffaf5] px-5 py-6 transition hover:border-[#cd8188] hover:bg-[#f5f1e8] md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
              <span className="flex flex-col items-center justify-center text-center">
                <ImagePlus className="mb-3 h-10 w-10 text-[#cd8188]" />
                <span className="text-lg font-semibold text-[#65584f]">Choose image or video</span>
                <span className="mt-1 text-sm text-[#8a7b70]">This is the asset users will tap in the swipe feed.</span>
              </span>
              <span className="rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 text-left">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7b70]">Creative specs</span>
                <span className="mt-2 grid gap-1 text-sm text-[#65584f]">
                  {specs.map((spec) => (
                    <span key={spec}>{spec}</span>
                  ))}
                </span>
              </span>
              <input
                accept=".heic,.heif,.jpg,.jpeg,.mov,.mp4,.png,.webp,image/heic,image/heif,image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                className="block w-full text-sm text-[#65584f] file:mr-3 file:rounded-full file:border-0 file:bg-[#cd8188] file:px-6 file:py-3 file:text-sm file:font-semibold file:text-white hover:file:bg-[#b87179] md:col-span-2"
                name="image_file"
                required
                type="file"
              />
            </span>
          </label>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8a7b70]">Company name *</label>
            <input
              className="w-full rounded-xl border border-[#d6c8ad] px-3 py-3 text-sm text-[#65584f] focus:border-[#cd8188] focus:outline-none"
              name="company_name"
              placeholder="e.g. PETBEO"
              required
              type="text"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#8a7b70]">Email</label>
              <input
                className="w-full rounded-xl border border-[#d6c8ad] px-3 py-3 text-sm text-[#65584f] focus:border-[#cd8188] focus:outline-none"
                name="contact_email"
                placeholder="name@company.com"
                type="email"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#8a7b70]">Phone number</label>
              <input
                className="w-full rounded-xl border border-[#d6c8ad] px-3 py-3 text-sm text-[#65584f] focus:border-[#cd8188] focus:outline-none"
                name="contact_phone"
                placeholder="+66..."
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8a7b70]">Click URL *</label>
            <input
              className="w-full rounded-xl border border-[#d6c8ad] px-3 py-3 text-sm text-[#65584f] focus:border-[#cd8188] focus:outline-none"
              name="click_url"
              placeholder="pawjaipet.com/ads"
              required
              type="text"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#8a7b70]">Requested start date *</label>
              <input
                className="w-full rounded-xl border border-[#d6c8ad] px-3 py-3 text-sm text-[#65584f] focus:border-[#cd8188] focus:outline-none"
                defaultValue={today}
                min={today}
                name="start_date"
                required
                type="date"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#8a7b70]">Requested end date *</label>
              <input
                className="w-full rounded-xl border border-[#d6c8ad] px-3 py-3 text-sm text-[#65584f] focus:border-[#cd8188] focus:outline-none"
                defaultValue={today}
                min={today}
                name="end_date"
                required
                type="date"
              />
            </div>
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b87179]"
            onClick={handlePreview}
            type="button"
          >
            <Upload className="h-4 w-4" />
            Continue to preview
          </button>
        </div>

        {preview ? (
          <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
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
                cardWidth={370}
                trackClicks={false}
              />
            </div>
            <div className="flex flex-col justify-center">
              {(clientError || resultState.error) ? (
                <p className="mb-5 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{clientError || resultState.error}</p>
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">Review before submitting</p>
              <h2 className="mt-3 text-2xl font-semibold">{preview.companyName}</h2>
              <p className="mt-3 break-all text-sm font-semibold text-[#cd8188]">{preview.clickUrl}</p>
              <p className="mt-5 text-sm leading-6 text-[#8a7b70]">
                This is the same ad-card format users will see in the swipe feed after PawJai approves it.
              </p>
              <dl className="mt-6 grid gap-3 text-sm">
                <div>
                  <dt className="font-semibold text-[#8a7b70]">Ad format</dt>
                  <dd>{preview.mediaType === "video" ? "Video" : "Image"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#8a7b70]">Contact email</dt>
                  <dd>{preview.contactEmail || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#8a7b70]">Contact phone</dt>
                  <dd>{preview.contactPhone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#8a7b70]">Requested dates</dt>
                  <dd>{preview.startDate} to {preview.endDate}</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-[#d6c8ad] bg-white px-6 py-3 text-sm font-semibold text-[#65584f] hover:bg-[#f5f1e8]"
                  onClick={() => setPreview(null)}
                  type="button"
                >
                  Modify ad
                </button>
                <button
                  className="rounded-full bg-[#cd8188] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b87179] disabled:opacity-50"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? (preview.mediaType === "video" ? "Uploading video..." : "Submitting...") : "Submit for review"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
