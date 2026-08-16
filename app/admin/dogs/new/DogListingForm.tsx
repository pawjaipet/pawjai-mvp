"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import DogBreedPicker from "@/components/dogs/DogBreedPicker";
import PersonalityTagPicker from "@/components/dogs/PersonalityTagPicker";
import { createDogListingAction } from "./actions";
import { initialCreateDogListingState } from "./form-state";

type ShelterOption = {
  id: string;
  name: string;
};

const defaultPhotoRows = ["", ""];

type PendingMediaItem = {
  compressed?: boolean;
  key: string;
  kind: "photo" | "video";
  name: string;
  originalSize?: number;
  size: number;
};

const careTags = [
  "No medical needs",
  "Vaccinated",
  "Spayed",
  "Neutered",
  "Special diet",
  "Medication",
  "Mobility support",
  "Behavioral support",
];

const CLIENT_MAX_FORM_MEDIA_BYTES = 3.5 * 1024 * 1024;
const CLIENT_PHOTO_MAX_WIDTH = 1800;
const CLIENT_PHOTO_MAX_HEIGHT = 2400;
const CLIENT_PHOTO_QUALITY = 0.78;

function isHeicLikeFile(file: File) {
  const type = file.type.split(";")[0]?.trim().toLowerCase();
  const name = file.name.toLowerCase();

  return type === "image/heic" || type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif");
}

function isClientCompressiblePhoto(file: File) {
  return file.type.startsWith("image/") && !isHeicLikeFile(file) && file.type !== "image/gif";
}

function replaceExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  return `${baseName}.${extension}`;
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read ${file.name} for browser compression.`));
    };
    image.src = objectUrl;
  });
}

async function compressPhotoForAdminUpload(file: File) {
  if (!isClientCompressiblePhoto(file)) {
    return { compressed: false, file };
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(
    1,
    CLIENT_PHOTO_MAX_WIDTH / image.naturalWidth,
    CLIENT_PHOTO_MAX_HEIGHT / image.naturalHeight,
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    return { compressed: false, file };
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", CLIENT_PHOTO_QUALITY);
  });

  if (!blob || blob.size >= file.size) {
    return { compressed: false, file };
  }

  return {
    compressed: true,
    file: new File([blob], replaceExtension(file.name, "jpg"), {
      lastModified: file.lastModified,
      type: "image/jpeg",
    }),
  };
}

function Section({
  title,
  description,
  children,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-[28px] border border-[#d6c8ad] bg-white/90 p-6 shadow-[0_16px_50px_rgba(101,88,79,0.08)]">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[#65584f]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#65584f]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  children,
  error,
  hint,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  hint?: string;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#65584f]">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-[#8c7d70]">{hint}</span> : null}
      {error ? <span className="mt-2 block text-xs font-medium text-[#b42318]">{error}</span> : null}
    </label>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-[#65584f] outline-none transition focus:border-[#cd8188] focus:ring-4 focus:ring-[#f3cbd0]/50 ${
    error ? "border-[#d94b41] bg-[#fff4f2]" : "border-[#d6c8ad] bg-[#fffaf5]"
  }`;
}

function fileInputClass(error?: string, accent = "file:bg-[#cd8188]") {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-[#65584f] file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white ${
    error ? "border-[#d94b41] bg-[#fff4f2]" : "border-[#d6c8ad] bg-[#fffaf5]"
  } ${accent}`;
}

const fieldErrorLabels: Record<string, string> = {
  age_months: "Age in months",
  cover_media_key: "Cover media",
  media_files: "Uploaded media files",
  name: "Dog name",
  shelter_id: "Shelter",
  video_file: "Optional cover video",
  weight_kg: "Weight in kg",
};

function formatFieldErrorLabel(key: string) {
  if (fieldErrorLabels[key]) return fieldErrorLabels[key];

  const photoFileMatch = key.match(/^photo_file_(\d+)$/);
  if (photoFileMatch) return `Uploaded photo ${Number(photoFileMatch[1]) + 1}`;

  const mediaFileMatch = key.match(/^media_file_(\d+)$/);
  if (mediaFileMatch) return `Uploaded media ${Number(mediaFileMatch[1]) + 1}`;

  const photoUrlMatch = key.match(/^photo_url_(\d+)$/);
  if (photoUrlMatch) return `Photo URL ${Number(photoUrlMatch[1]) + 1}`;

  const traitMatch = key.match(/^trait_(\d+)$/);
  if (traitMatch) return `Custom trait ${Number(traitMatch[1]) + 1}`;

  return key.replaceAll("_", " ");
}

function ErrorSummary({ errors }: { errors?: Record<string, string> }) {
  const entries = Object.entries(errors ?? {});

  if (entries.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl border border-[#f1c4c0] bg-[#fff5f4] px-5 py-4 text-sm text-[#9f2d24]">
      <p className="font-semibold">Please fix these fields first:</p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {entries.map(([key, error]) => (
          <li key={key}>
            <span className="font-medium">{formatFieldErrorLabel(key)}:</span> {error}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function ChoiceCards({
  name,
  options,
}: {
  name: string;
  options: { description?: string; label: string; value: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => {
        const optionId = `${name}-${option.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const descriptionId = option.description ? `${optionId}-description` : undefined;

        return (
          <label key={option.value} className="relative block cursor-pointer" htmlFor={optionId}>
            <input
              aria-describedby={descriptionId}
              className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              data-testid={`admin-radio-${name}-${option.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              id={optionId}
              name={name}
              type="radio"
              value={option.value}
            />
            <span className="block h-full rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 text-sm text-[#65584f] transition peer-checked:border-[#cd8188] peer-checked:bg-[#cd8188] peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-[#f3cbd0]">
              <span className="block font-semibold">{option.label}</span>
              {option.description ? (
                <span id={descriptionId} className="mt-1 block text-xs opacity-75">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function ChipCheckboxGroup({
  name,
  options,
}: {
  name: string;
  options: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option} className="cursor-pointer">
          <input className="peer sr-only" name={name} type="checkbox" value={option} />
          <span className="inline-flex rounded-full border border-[#d6c8ad] bg-white px-4 py-2 text-sm font-medium text-[#65584f] transition peer-checked:border-[#cd8188] peer-checked:bg-[#d6c8ad] peer-focus-visible:ring-4 peer-focus-visible:ring-[#f3cbd0]">
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}

export default function DogListingForm({
  cancelLabel = "Cancel",
  cancelHref,
  personalityTags,
  returnTo,
  selectedShelterId,
  shelters,
  showIntro = true,
  submitLabel = "Create dog listing",
  successListingsHref = "/admin/listings",
}: {
  cancelLabel?: string;
  cancelHref?: string;
  personalityTags: string[];
  returnTo?: string;
  selectedShelterId?: string;
  shelters: ShelterOption[];
  showIntro?: boolean;
  submitLabel?: string;
  successListingsHref?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createDogListingAction,
    initialCreateDogListingState,
  );
  const [mediaError, setMediaError] = useState("");
  const [photoRows, setPhotoRows] = useState(defaultPhotoRows);
  const [mediaItems, setMediaItems] = useState<PendingMediaItem[]>([]);
  const [coverMediaKey, setCoverMediaKey] = useState("");
  const [mediaPreparing, setMediaPreparing] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const defaultShelterId = selectedShelterId && shelters.some((shelter) => shelter.id === selectedShelterId)
    ? selectedShelterId
    : shelters.length === 1 ? shelters[0].id : "";
  const mediaUploadError = state.fieldErrors?.media_files ?? mediaError;

  useEffect(() => {
    if (!state.message && !state.fieldErrors) return;

    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.fieldErrors, state.message]);

  function moveMediaItem(index: number, direction: -1 | 1) {
    setMediaItems((items) => {
      const next = [...items];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return items;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  async function handleMediaFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFiles = Array.from(input.files ?? []);
    setMediaError("");

    if (selectedFiles.length === 0) {
      setMediaItems([]);
      setCoverMediaKey("");
      return;
    }

    setMediaPreparing(true);

    try {
      const preparedFiles: { compressed: boolean; file: File; originalSize: number }[] = [];
      const warnings: string[] = [];

      for (const file of selectedFiles) {
        const prepared = await compressPhotoForAdminUpload(file);
        preparedFiles.push({
          compressed: prepared.compressed,
          file: prepared.file,
          originalSize: file.size,
        });

        if (isHeicLikeFile(file) && file.size > CLIENT_MAX_FORM_MEDIA_BYTES) {
          warnings.push(`${file.name} is a large HEIC file. Please export it as JPG before uploading online.`);
        }

        if (file.type.startsWith("video/") && file.size > CLIENT_MAX_FORM_MEDIA_BYTES) {
          warnings.push(`${file.name} is too large for direct online form upload. Use a shorter/compressed clip for now.`);
        }
      }

      const totalBytes = preparedFiles.reduce((sum, item) => sum + item.file.size, 0);
      if (totalBytes > CLIENT_MAX_FORM_MEDIA_BYTES) {
        warnings.push(
          `Selected media is ${formatFileSize(totalBytes)} after browser compression. Please upload fewer files at once or use smaller exports.`,
        );
      }

      const transfer = new DataTransfer();
      preparedFiles.forEach((item) => transfer.items.add(item.file));
      input.files = transfer.files;

      const nextItems = preparedFiles.map((item, index) => ({
        compressed: item.compressed,
        key: `file-${index}`,
        kind: item.file.type.startsWith("video/") ? ("video" as const) : ("photo" as const),
        name: item.file.name,
        originalSize: item.originalSize,
        size: item.file.size,
      }));
      setMediaItems(nextItems);
      setCoverMediaKey(nextItems[0]?.key ?? "");
      setMediaError(warnings.join(" "));
    } catch (error) {
      setMediaItems([]);
      setCoverMediaKey("");
      input.value = "";
      setMediaError(error instanceof Error ? error.message : "Could not prepare these files for upload.");
    } finally {
      setMediaPreparing(false);
    }
  }

  return (
    <form action={formAction} aria-busy={pending || mediaPreparing} className="space-y-6">
      {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
      {showIntro ? (
        <div className="rounded-[32px] border border-[#f3cbd0] bg-[#f8e8ea] p-7 shadow-[0_24px_60px_rgba(101,88,79,0.12)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cd8188]">
                Internal Dog Onboarding
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#65584f]">
                Create a new PawJai listing like a marketplace post.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#65584f]">
                Start with the essentials, choose the photo order yourself, and save the listing
                when it is ready for the public browse flow.
              </p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/80 p-5 text-sm text-[#65584f]">
              <p className="font-medium text-[#65584f]">Workflow tip</p>
              <p className="mt-2 leading-6">
                Save new dogs as <span className="font-semibold text-[#cd8188]">draft</span> until
                photos and copy feel right, then publish them by switching the adoption status to
                <span className="font-semibold text-[#cd8188]"> available</span>.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 rounded-[28px] border border-white/80 bg-white/70 p-5 md:grid-cols-3">
            {[
              {
                label: "Manual photo control",
                value: "You decide image order",
              },
              {
                label: "Team-friendly drafts",
                value: "Save first, polish later",
              },
              {
                label: "Future shelter flow",
                value: "Same model, cleaner UX later",
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#cd8188]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm text-[#65584f]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Section
        title="Core Listing"
        description="These are the fields the team will touch most often when turning a rescue profile into a public listing."
      >
        <ErrorSummary errors={state.fieldErrors} />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Dog name" error={state.fieldErrors?.name}>
            <input name="name" className={inputClass(state.fieldErrors?.name)} placeholder="Mali" />
          </Field>

          <Field label="Shelter" error={state.fieldErrors?.shelter_id}>
            <select name="shelter_id" className={inputClass(state.fieldErrors?.shelter_id)} defaultValue={defaultShelterId}>
              <option value="" disabled>
                Select a shelter
              </option>
              {shelters.map((shelter) => (
                <option key={shelter.id} value={shelter.id}>
                  {shelter.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Breed" error={state.fieldErrors?.breed}>
            <DogBreedPicker buttonClassName={inputClass(state.fieldErrors?.breed)} placeholder="Choose breed" />
          </Field>

          <Field label="Adoption status">
            <select name="adoption_status" className={inputClass()} defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="adopted">Adopted</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </Field>

          <Field label="Gender">
            <select name="gender" className={inputClass()} defaultValue="unknown">
              <option value="unknown">Unknown</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <p className="mb-3 text-sm font-semibold text-[#65584f]">Size</p>
            <ChoiceCards
              name="size"
              options={[
                { label: "Small", value: "small", description: "Chihuahua, pug" },
                { label: "Medium", value: "medium", description: "Beagle, Thai mix" },
                { label: "Large", value: "large", description: "Ridgeback, labrador" },
              ]}
            />
          </div>

          <Field label="Age in months" error={state.fieldErrors?.age_months}>
            <input
              name="age_months"
              type="number"
              min="0"
              className={inputClass(state.fieldErrors?.age_months)}
              placeholder="36"
            />
          </Field>

          <Field label="Weight in kg" error={state.fieldErrors?.weight_kg}>
            <input
              name="weight_kg"
              type="number"
              min="0"
              step="0.1"
              className={inputClass(state.fieldErrors?.weight_kg)}
              placeholder="18.5"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="My Story">
              <textarea
                name="background"
                rows={5}
                className={inputClass()}
                placeholder="Short public story that appears on the dog profile."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Medical needs shown on profile">
              <textarea
                name="special_needs"
                rows={4}
                className={inputClass()}
                placeholder="Example: None - vaccinated and spayed. Or add medication, recovery, mobility, allergy, or diet notes."
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        title="Matching Template"
        description="Click the answers and tags adopters will actually see on the swipe card and dog profile."
      >
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm font-semibold text-[#65584f]">How active is this dog?</p>
            <ChoiceCards
              name="energy_level"
              options={[
                { label: "Low", value: "low", description: "Relaxed, calm companion" },
                { label: "Medium", value: "medium", description: "Daily walks and light play" },
                { label: "High", value: "high", description: "Needs a lot of activity" },
              ]}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#65584f]">Protectiveness</p>
            <ChoiceCards
              name="protectiveness"
              options={[
                { label: "Chill", value: "Very chill - not reactive", description: "Rarely barks or reacts" },
                { label: "Alert barker", value: "Barks to alert, but not aggressive", description: "Notices visitors but stays friendly" },
                { label: "Protective", value: "Highly protective", description: "Very protective of home or family" },
              ]}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#65584f]">Affection style</p>
            <ChoiceCards
              name="affection_style"
              options={[
                { label: "Cuddly", value: "Very cuddly and affectionate", description: "Seeks closeness often" },
                { label: "Subtle", value: "Subtle", description: "Shows affection quietly" },
                { label: "Independent", value: "Independent", description: "Loyal but self-directed" },
              ]}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#65584f]">Training status</p>
            <ChoiceCards
              name="training_preference_match"
              options={[
                { label: "Well-trained", value: "Well-trained dogs only" },
                { label: "Still training", value: "Dogs still in training" },
                { label: "Needs basics", value: "Willing to train from scratch" },
              ]}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#65584f]">People friendliness</p>
            <ChoiceCards
              name="people_friendliness"
              options={[
                { label: "Social", value: "Comfortable being petted by strangers", description: "Comfortable with new people" },
                { label: "Slow warm-up", value: "Takes time to get to know new people", description: "Needs a patient intro" },
                { label: "Owner-focused", value: "Only stick to their owner", description: "Bonds closely with one person" },
              ]}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#65584f]">Friendliness to other dogs</p>
            <ChoiceCards
              name="dog_social_style"
              options={[
                { label: "Friendly", value: "Friendly and playful" },
                { label: "Selective", value: "Okay with other dogs but not too social" },
                { label: "Solo dog", value: "Prefer to be solo" },
              ]}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Good with dogs?">
              <select name="good_with_dogs_value" className={inputClass()} defaultValue="">
                <option value="">Not sure</option>
                <option value="true">Yes</option>
                <option value="false">No / solo preferred</option>
              </select>
            </Field>

            <Field label="Good with cats?">
              <select name="good_with_cats_value" className={inputClass()} defaultValue="">
                <option value="">Not sure</option>
                <option value="true">Yes</option>
                <option value="false">No / unknown</option>
              </select>
            </Field>

            <Field label="Good with kids?">
              <select name="good_with_kids_value" className={inputClass()} defaultValue="">
                <option value="">Not sure</option>
                <option value="true">Yes</option>
                <option value="false">No / unknown</option>
              </select>
            </Field>

            <Field label="House training">
              <select name="house_trained_value" className={inputClass()} defaultValue="">
                <option value="">Not sure</option>
                <option value="true">House trained</option>
                <option value="false">Not house trained yet</option>
              </select>
            </Field>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#65584f]">Public personality and description tags</p>
            <p className="mb-4 text-sm leading-6 text-[#65584f]">
              These become the playful beige bubbles on the swipe card and dog profile. Pick the words that actually fit the dog.
            </p>
            <PersonalityTagPicker options={personalityTags} />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#65584f]">Care and medical tags</p>
            <p className="mb-4 text-sm leading-6 text-[#65584f]">
              These help fill the medical needs area without making the team write everything from scratch.
            </p>
            <ChipCheckboxGroup name="care_tag" options={careTags} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["sterilized", "Sterilized"],
              ["leash_trained", "Leash trained"],
              ["animal_friendly", "Animal friendly"],
            ].map(([name, label]) => (
              <label key={name} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#f0e6d7] bg-white px-4 py-3 text-sm text-[#65584f]">
                <input type="checkbox" name={name} className="h-4 w-4 rounded border-[#d6c8ad] text-[#cd8188] focus:ring-[#f3cbd0]" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Photos and videos"
        description="Upload photos and short dog videos, then choose the cover and order before saving. Videos are compressed to short muted MP4 loops."
      >
        <div className="space-y-4">
          <Field
            label="Local folder inside pawjaidogs"
            hint="Example: create pawjaidogs/maan with 01.jpg, 02.jpg, 03.jpg, then type maan here."
          >
            <input
              name="local_photo_folder"
              className={inputClass()}
              placeholder="maan"
            />
          </Field>

          <Field
            label="Upload photos and videos"
            error={mediaUploadError}
            hint="Select photos and up to 6 videos. Photos are compressed in your browser first so online uploads stay fast and reliable."
          >
            <input
              name="media_files"
              type="file"
              accept="image/*,video/*,.heic,.heif"
              multiple
              onChange={(event) => {
                void handleMediaFilesChange(event);
              }}
              className={fileInputClass(mediaUploadError, "file:bg-[#cd8188]")}
            />
          </Field>

          {mediaItems.length > 0 ? (
            <div className="rounded-[24px] border border-[#d6c8ad] bg-[#fffaf5] p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-[#65584f]">Cover and display order</p>
                <p className="mt-1 text-xs leading-5 text-[#65584f]">
                  The cover item appears first on swipe cards and dog profiles. Only the active dog
                  video auto-loads on the public swipe page.
                </p>
              </div>

              <input type="hidden" name="cover_media_key" value={coverMediaKey} />
              {mediaItems.map((item) => (
                <input key={`order-${item.key}`} type="hidden" name="media_order" value={item.key} />
              ))}

              <div className="space-y-2">
                {mediaItems.map((item, index) => (
                  <div
                    key={item.key}
                    className="flex flex-col gap-3 rounded-2xl border border-[#d6c8ad] bg-white p-3 sm:flex-row sm:items-center"
                  >
                    <label className="flex flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="cover_media_choice"
                        checked={coverMediaKey === item.key}
                        onChange={() => setCoverMediaKey(item.key)}
                        className="h-4 w-4 border-[#d6c8ad] text-[#cd8188] focus:ring-[#f3cbd0]"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#65584f]">
                          {index + 1}. {item.name}
                        </span>
                        <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-[#9a6b2a]">
                          {item.kind} · {formatFileSize(item.size)}
                          {item.compressed && item.originalSize
                            ? ` · compressed from ${formatFileSize(item.originalSize)}`
                            : ""}
                          {coverMediaKey === item.key ? " · Cover" : ""}
                        </span>
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveMediaItem(index, -1)}
                        className="rounded-full border border-[#d6c8ad] px-3 py-2 text-xs font-semibold text-[#65584f] transition hover:bg-[#f5f1e8] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={index === mediaItems.length - 1}
                        onClick={() => moveMediaItem(index, 1)}
                        className="rounded-full border border-[#d6c8ad] px-3 py-2 text-xs font-semibold text-[#65584f] transition hover:bg-[#f5f1e8] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {photoRows.map((value, index) => (
            <Field
              key={`photo-${index}`}
              label={`Photo URL ${index + 1}`}
              error={state.fieldErrors?.[`photo_url_${index}`]}
              hint={
                index === 0
                  ? "Use URL rows for direct public image URLs. OneDrive folder pages are less reliable than file upload or local folders."
                  : undefined
              }
            >
              <input
                name="photo_url"
                defaultValue={value}
                className={inputClass(state.fieldErrors?.[`photo_url_${index}`])}
                placeholder="https://1drv.ms/... or direct image URL"
              />
            </Field>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPhotoRows((rows) => [...rows, ""])}
              className="rounded-full border border-[#cd8188] px-4 py-2 text-sm font-medium text-[#65584f] transition hover:bg-[#f8e8ea]"
            >
              Add photo slot
            </button>
            {photoRows.length > 1 ? (
              <button
                type="button"
                onClick={() => setPhotoRows((rows) => rows.slice(0, -1))}
                className="rounded-full border border-[#d6c8ad] px-4 py-2 text-sm font-medium text-[#65584f] transition hover:bg-[#f8f2ea]"
              >
                Remove last slot
              </button>
            ) : null}
          </div>
        </div>
      </Section>

      {state.message ? (
        <div
          ref={feedbackRef}
          aria-live="polite"
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-2xl border px-5 py-4 text-sm ${
            state.status === "success"
              ? "border-[#bfdcb5] bg-[#f1faee] text-[#2f6b33]"
              : "border-[#f1c4c0] bg-[#fff5f4] text-[#9f2d24]"
          }`}
        >
          <p>{state.message}</p>
          {state.status === "success" && state.dogId ? (
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <Link href={`/dogs/${state.dogId}`} className="font-semibold underline decoration-2 underline-offset-4">
                Open the new dog profile
              </Link>
              <Link href={successListingsHref} className="font-semibold underline decoration-2 underline-offset-4">
                View in Manage listings
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 rounded-[28px] border border-[#d6c8ad] bg-white/95 p-4 shadow-[0_18px_42px_rgba(101,88,79,0.16)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#65584f]">Ready to create this listing?</p>
            <p className="text-sm text-[#65584f]">
              Save as draft while details are incomplete, or choose available when the profile and cover image are ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {cancelHref ? (
              <Link
                className="inline-flex items-center justify-center rounded-full border border-[#d6c8ad] bg-white px-7 py-3 text-sm font-semibold text-[#65584f] transition hover:bg-[#f5f1e8]"
                href={cancelHref}
              >
                {cancelLabel}
              </Link>
            ) : null}
            <button
              type="submit"
              disabled={pending || mediaPreparing || Boolean(mediaError)}
              aria-describedby="create-dog-submit-status"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#cd8188] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(205,129,136,0.22)] transition hover:bg-[#b87179] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {mediaPreparing ? "Preparing media..." : pending ? "Creating listing..." : submitLabel}
            </button>
          </div>
        </div>
        <p id="create-dog-submit-status" className="mt-3 text-xs leading-5 text-[#65584f]" aria-live="polite">
          {mediaPreparing
            ? "Preparing selected files before upload."
            : pending
              ? "Creating the listing now. Keep this page open until the result message appears."
              : "If anything needs attention, the form will scroll to the fix list after submit."}
        </p>
      </div>
    </form>
  );
}
