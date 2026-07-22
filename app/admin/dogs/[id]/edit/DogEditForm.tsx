"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import DogBreedPicker from "@/components/dogs/DogBreedPicker";
import type { Database, DogPhoto, DogTrait } from "@/types/database";
import { buildDogMediaItems, type DogMediaItem } from "@/utils/dog-media";
import { deleteDogProfileAction, updateDogProfileAction } from "./actions";
import { initialEditDogProfileState } from "./form-state";

type Dog = Database["public"]["Tables"]["dogs"]["Row"];
type ShelterOption = {
  id: string;
  name: string;
};

type PendingPhotoUpload = {
  compressed: boolean;
  name: string;
  originalSize: number;
  size: number;
};

const CLIENT_MAX_FORM_MEDIA_BYTES = 3.5 * 1024 * 1024;
const CLIENT_PHOTO_MAX_WIDTH = 1800;
const CLIENT_PHOTO_MAX_HEIGHT = 2400;
const CLIENT_PHOTO_QUALITY = 0.78;

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

const structuredTraitTypes = [
  "protectiveness",
  "affection_style",
  "training_preference_match",
  "people_friendliness",
  "dog_social_style",
  "intake_note",
];

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

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
    <section className="rounded-[28px] border border-[#eadfce] bg-white/90 p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[#4f4338]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#7a6d61]">{description}</p>
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
      <span className="mb-2 block text-sm font-medium text-[#5b4d40]">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-[#8c7d70]">{hint}</span> : null}
      {error ? <span className="mt-2 block text-xs font-medium text-[#b42318]">{error}</span> : null}
    </label>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-[#4f4338] outline-none transition focus:border-[#d69546] focus:ring-4 focus:ring-[#f6d7ad]/50 ${
    error ? "border-[#d94b41] bg-[#fff4f2]" : "border-[#e7dbc8] bg-[#fffdfa]"
  }`;
}

function formatFieldErrorLabel(key: string) {
  const labels: Record<string, string> = {
    age_months: "Age in months",
    dog_id: "Dog profile",
    name: "Dog name",
    shelter_id: "Shelter",
    weight_kg: "Weight in kg",
  };

  if (key.startsWith("new_photo_")) return "New photo upload";

  return labels[key] ?? key.replaceAll("_", " ");
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

function ChoiceCards({
  defaultValue,
  name,
  options,
}: {
  defaultValue?: string | null;
  name: string;
  options: { description?: string; label: string; value: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input
            className="peer sr-only"
            defaultChecked={defaultValue === option.value}
            name={name}
            type="radio"
            value={option.value}
          />
          <span className="block h-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#5b4d40] transition peer-checked:border-[#cd8188] peer-checked:bg-[#cd8188] peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-[#f3cbd0]">
            <span className="block font-semibold">{option.label}</span>
            {option.description ? (
              <span className="mt-1 block text-xs opacity-75">{option.description}</span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}

function ChipCheckboxGroup({
  name,
  options,
  selected,
}: {
  name: string;
  options: string[];
  selected: Set<string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option} className="cursor-pointer">
          <input
            className="peer sr-only"
            defaultChecked={selected.has(option)}
            name={name}
            type="checkbox"
            value={option}
          />
          <span className="inline-flex rounded-full border border-[#d6c8ad] bg-white px-4 py-2 text-sm font-medium text-[#65584f] transition peer-checked:border-[#cd8188] peer-checked:bg-[#d6c8ad] peer-focus-visible:ring-4 peer-focus-visible:ring-[#f3cbd0]">
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}

function toBooleanSelectValue(value: boolean | null) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function getTraitValue(traits: DogTrait[], type: string) {
  return traits.find((trait) => trait.trait_type === type)?.trait_value ?? null;
}

function statusCopy(status: Dog["adoption_status"]) {
  switch (status) {
    case "available":
      return "Visible on PawJai";
    case "draft":
      return "Hidden draft";
    case "reserved":
      return "Temporarily held";
    case "adopted":
      return "Adopted record";
    case "unavailable":
      return "Hidden from public browsing";
    default:
      return "Profile status";
  }
}

function MediaOrderEditor({ dogName, items }: { dogName: string; items: DogMediaItem[] }) {
  const [mediaItems, setMediaItems] = useState(items);
  const [coverMediaId, setCoverMediaId] = useState(
    items.find((item) => item.isCover)?.id ?? items[0]?.id ?? "",
  );

  function moveMediaItem(index: number, direction: -1 | 1) {
    setMediaItems((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  if (mediaItems.length === 0) {
    return <p className="text-sm leading-6 text-[#74685d]">No photos or videos are attached yet.</p>;
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="cover_media_id" value={coverMediaId} />
      {mediaItems.map((item) => (
        <input key={`order-${item.id}`} type="hidden" name="media_order" value={item.id} />
      ))}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mediaItems.map((item, index) => {
          const previewUrl = item.type === "video" ? item.posterUrl : item.publicUrl;
          const isCover = coverMediaId === item.id;

          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-2xl border bg-[#fffdfa] transition ${
                isCover ? "border-[#cd8188] shadow-[0_12px_30px_rgba(205,129,136,0.22)]" : "border-[#eadfce]"
              }`}
            >
              <div className="relative h-40 bg-[#e3d6bb]">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={`${dogName} media ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#65584f]">
                    No preview
                  </div>
                )}
                {item.type === "video" ? (
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                    Video
                  </span>
                ) : null}
              </div>

              <div className="space-y-3 p-3 text-xs text-[#74685d]">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#5b4d40]">
                  <input
                    type="radio"
                    name="cover_media_choice"
                    checked={isCover}
                    onChange={() => setCoverMediaId(item.id)}
                    className="h-4 w-4 border-[#d4c1a5] text-[#cd8188] focus:ring-[#f3cbd0]"
                  />
                  <span>
                    {item.type === "video" ? "Video" : "Photo"} {index + 1}
                    {isCover ? <span className="ml-2 text-[#b77624]">Cover</span> : null}
                  </span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveMediaItem(index, -1)}
                    className="rounded-full border border-[#eadfce] px-3 py-2 font-semibold text-[#5b4d40] transition hover:bg-[#faf4ec] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={index === mediaItems.length - 1}
                    onClick={() => moveMediaItem(index, 1)}
                    className="rounded-full border border-[#eadfce] px-3 py-2 font-semibold text-[#5b4d40] transition hover:bg-[#faf4ec] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Down
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DogEditForm({
  deleteReturnTo,
  dog,
  personalityTags,
  photos,
  returnTo,
  shelters,
  traits,
}: {
  deleteReturnTo?: string;
  dog: Dog;
  personalityTags: string[];
  photos: DogPhoto[];
  returnTo?: string;
  shelters: ShelterOption[];
  traits: DogTrait[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateDogProfileAction,
    initialEditDogProfileState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  const [newPhotoUploadError, setNewPhotoUploadError] = useState("");
  const [newPhotoItems, setNewPhotoItems] = useState<PendingPhotoUpload[]>([]);
  const [newPhotosPreparing, setNewPhotosPreparing] = useState(false);

  async function handleNewPhotoFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFiles = Array.from(input.files ?? []);
    setNewPhotoUploadError("");

    if (selectedFiles.length === 0) {
      setNewPhotoItems([]);
      return;
    }

    setNewPhotosPreparing(true);

    try {
      const preparedFiles: { compressed: boolean; file: File; originalSize: number }[] = [];

      for (const file of selectedFiles) {
        if (isHeicLikeFile(file) && file.size > CLIENT_MAX_FORM_MEDIA_BYTES) {
          throw new Error(`${file.name} is a large HEIC file. Please export it as JPG before uploading online.`);
        }

        const prepared = await compressPhotoForAdminUpload(file);
        preparedFiles.push({
          compressed: prepared.compressed,
          file: prepared.file,
          originalSize: file.size,
        });
      }

      const totalBytes = preparedFiles.reduce((sum, item) => sum + item.file.size, 0);
      if (totalBytes > CLIENT_MAX_FORM_MEDIA_BYTES) {
        throw new Error(
          `Selected photos are ${formatFileSize(totalBytes)} after browser compression. Please upload fewer photos at once or use smaller exports.`,
        );
      }

      const transfer = new DataTransfer();
      preparedFiles.forEach((item) => transfer.items.add(item.file));
      input.files = transfer.files;
      setNewPhotoItems(
        preparedFiles.map((item) => ({
          compressed: item.compressed,
          name: item.file.name,
          originalSize: item.originalSize,
          size: item.file.size,
        })),
      );
    } catch (error) {
      setNewPhotoItems([]);
      input.value = "";
      setNewPhotoUploadError(error instanceof Error ? error.message : "Could not prepare these photos for upload.");
    } finally {
      setNewPhotosPreparing(false);
    }
  }

  const personalityTraitValues = traits
    .filter((trait) => trait.trait_type === "personality")
    .map((trait) => trait.trait_value);
  const selectedPersonalityTags = new Set(personalityTraitValues.filter((tag) => personalityTags.includes(tag)));
  const customPersonalityTags = personalityTraitValues
    .filter((tag) => !personalityTags.includes(tag))
    .join(", ");
  const selectedCareTags = new Set(
    traits.filter((trait) => trait.trait_type === "medical_needs").map((trait) => trait.trait_value),
  );
  const mediaItems = buildDogMediaItems({ photos, traits });
  const hiddenTraits = traits.filter(
    (trait) =>
      !structuredTraitTypes.includes(trait.trait_type) &&
      trait.trait_type !== "personality" &&
      trait.trait_type !== "medical_needs",
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-gradient-to-br from-[#fff6e8] via-[#fff1df] to-[#f9e4c0] p-7 shadow-[0_24px_60px_rgba(176,120,42,0.16)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
              Manage Dog Profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#4f4338]">
              Edit {dog.name} without losing the profile history.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6f6256]">
              Update public details, refresh tags after care changes, or hide a listing from PawJai
              while keeping the dog record in Supabase.
            </p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 text-sm text-[#6f6256]">
            <p className="font-medium text-[#4f4338]">Current status</p>
            <p className="mt-2 text-2xl font-semibold capitalize text-[#b77624]">{dog.adoption_status}</p>
            <p className="mt-1 leading-6">{statusCopy(dog.adoption_status)}</p>
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="dog_id" value={dog.id} />
        {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}

        <Section
          title="Core Profile"
          description="These are the details users see on the dog card and profile."
        >
          <ErrorSummary errors={state.fieldErrors} />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Dog name" error={state.fieldErrors?.name}>
              <input
                name="name"
                className={inputClass(state.fieldErrors?.name)}
                defaultValue={dog.name}
                placeholder="Mali"
              />
            </Field>

            <Field label="Shelter" error={state.fieldErrors?.shelter_id}>
              <select
                name="shelter_id"
                className={inputClass(state.fieldErrors?.shelter_id)}
                defaultValue={dog.shelter_id}
              >
                {shelters.map((shelter) => (
                  <option key={shelter.id} value={shelter.id}>
                    {shelter.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Breed">
              <DogBreedPicker buttonClassName={inputClass()} defaultValue={dog.breed} placeholder="Choose breed" />
            </Field>

            <Field
              label="Profile status"
              hint="Use unavailable to remove a dog from public browsing without deleting the database record."
            >
              <select name="adoption_status" className={inputClass()} defaultValue={dog.adoption_status}>
                <option value="draft">Draft</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="adopted">Adopted</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </Field>

            <Field label="Gender">
              <select name="gender" className={inputClass()} defaultValue={dog.gender}>
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>

            <Field label="Age in months" error={state.fieldErrors?.age_months}>
              <input
                name="age_months"
                type="number"
                min="0"
                className={inputClass(state.fieldErrors?.age_months)}
                defaultValue={dog.age_months ?? ""}
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
                defaultValue={dog.weight_kg ?? ""}
                placeholder="18.5"
              />
            </Field>

            <div className="md:col-span-2">
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Size</p>
              <ChoiceCards
                defaultValue={dog.size}
                name="size"
                options={[
                  { label: "Small", value: "small", description: "Chihuahua, pug" },
                  { label: "Medium", value: "medium", description: "Beagle, Thai mix" },
                  { label: "Large", value: "large", description: "Ridgeback, labrador" },
                ]}
              />
            </div>

            <div className="md:col-span-2">
              <Field label="My Story">
                <textarea
                  name="background"
                  rows={5}
                  className={inputClass()}
                  defaultValue={dog.background ?? ""}
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
                  defaultValue={dog.special_needs ?? ""}
                  placeholder="Example: None - vaccinated and neutered."
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section
          title="Public Matching Tags"
          description="These tags become the beige bubbles on the browse card and dog profile."
        >
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">How active is this dog?</p>
              <ChoiceCards
                defaultValue={dog.energy_level}
                name="energy_level"
                options={[
                  { label: "Low", value: "low", description: "Relaxed, calm companion" },
                  { label: "Medium", value: "medium", description: "Daily walks and light play" },
                  { label: "High", value: "high", description: "Needs a lot of activity" },
                ]}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Training status</p>
              <ChoiceCards
                defaultValue={getTraitValue(traits, "training_preference_match")}
                name="training_preference_match"
                options={[
                  { label: "Well-trained", value: "Well-trained dogs only" },
                  { label: "Still training", value: "Dogs still in training" },
                  { label: "Needs basics", value: "Willing to train from scratch" },
                ]}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Protectiveness</p>
              <ChoiceCards
                defaultValue={getTraitValue(traits, "protectiveness")}
                name="protectiveness"
                options={[
                  { label: "Chill", value: "Very chill - not reactive", description: "Rarely barks or reacts" },
                  { label: "Alert barker", value: "Barks to alert, but not aggressive", description: "Notices visitors but stays friendly" },
                  { label: "Protective", value: "Highly protective", description: "Very protective of home or family" },
                ]}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Affection style</p>
              <ChoiceCards
                defaultValue={getTraitValue(traits, "affection_style")}
                name="affection_style"
                options={[
                  { label: "Cuddly", value: "Very cuddly and affectionate", description: "Seeks closeness often" },
                  { label: "Subtle", value: "Subtle", description: "Shows affection quietly" },
                  { label: "Independent", value: "Independent", description: "Loyal but self-directed" },
                ]}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">People friendliness</p>
              <ChoiceCards
                defaultValue={getTraitValue(traits, "people_friendliness")}
                name="people_friendliness"
                options={[
                  { label: "Social", value: "Comfortable being petted by strangers", description: "Comfortable with new people" },
                  { label: "Slow warm-up", value: "Takes time to get to know new people", description: "Needs a patient intro" },
                  { label: "Owner-focused", value: "Only stick to their owner", description: "Bonds closely with one person" },
                ]}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Friendliness to other dogs</p>
              <ChoiceCards
                defaultValue={getTraitValue(traits, "dog_social_style")}
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
                <select name="good_with_dogs_value" className={inputClass()} defaultValue={toBooleanSelectValue(dog.good_with_dogs)}>
                  <option value="">Not sure</option>
                  <option value="true">Yes</option>
                  <option value="false">No / solo preferred</option>
                </select>
              </Field>

              <Field label="Good with cats?">
                <select name="good_with_cats_value" className={inputClass()} defaultValue={toBooleanSelectValue(dog.good_with_cats)}>
                  <option value="">Not sure</option>
                  <option value="true">Yes</option>
                  <option value="false">No / unknown</option>
                </select>
              </Field>

              <Field label="Good with kids?">
                <select name="good_with_kids_value" className={inputClass()} defaultValue={toBooleanSelectValue(dog.good_with_kids)}>
                  <option value="">Not sure</option>
                  <option value="true">Yes</option>
                  <option value="false">No / unknown</option>
                </select>
              </Field>

              <Field label="House training">
                <select name="house_trained_value" className={inputClass()} defaultValue={toBooleanSelectValue(dog.house_trained)}>
                  <option value="">Not sure</option>
                  <option value="true">House trained</option>
                  <option value="false">Not house trained yet</option>
                </select>
              </Field>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Public personality and description tags</p>
              <p className="mb-4 text-sm leading-6 text-[#7a6d61]">
                Pick the words users should see. Use Other when the dog needs a more specific word.
              </p>
              <ChipCheckboxGroup name="personality_tag" options={personalityTags} selected={selectedPersonalityTags} />
              <div className="mt-4">
                <Field label="Other personality tags" hint="Separate extra public tags with commas.">
                  <input
                    name="custom_personality_tags"
                    className={inputClass()}
                    defaultValue={customPersonalityTags}
                    placeholder="Shy at first, Loves belly rubs"
                  />
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Care and medical tags</p>
              <ChipCheckboxGroup name="care_tag" options={careTags} selected={selectedCareTags} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["sterilized", "Sterilized", dog.sterilized],
                ["leash_trained", "Leash trained", dog.leash_trained],
                ["animal_friendly", "Animal friendly", dog.animal_friendly],
              ].map(([name, label, checked]) => (
                <label
                  key={name as string}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#f0e6d7] bg-white px-4 py-3 text-sm text-[#5b4d40]"
                >
                  <input
                    type="checkbox"
                    name={name as string}
                    defaultChecked={Boolean(checked)}
                    className="h-4 w-4 rounded border-[#d4c1a5] text-[#d69546] focus:ring-[#f6d7ad]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="Photos and Video"
          description="Choose the cover and arrange the exact order users should see on swipe cards and dog profiles."
        >
          <div className="space-y-6">
            <MediaOrderEditor dogName={dog.name} items={mediaItems} />

            <div className="rounded-3xl border border-dashed border-[#d8c8ad] bg-[#fffdfa] p-5">
              <Field
                label="Add new photos"
                error={state.fieldErrors?.new_photo_0 ?? newPhotoUploadError}
                hint="Upload JPG, PNG, WEBP, or HEIC photos. Photos are compressed in your browser first, then saved to storage and appended after the current media when you press Save."
              >
                <input
                  name="new_photo_files"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  multiple
                  onChange={(event) => {
                    void handleNewPhotoFilesChange(event);
                  }}
                  className="block w-full rounded-2xl border border-[#e7dbc8] bg-white px-4 py-3 text-sm text-[#5b4d40] file:mr-4 file:rounded-full file:border-0 file:bg-[#d38a2c] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#bf781f]"
                />
              </Field>
              {newPhotosPreparing ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#b77624]">
                  Preparing photos...
                </p>
              ) : null}
              {newPhotoItems.length > 0 ? (
                <div className="mt-4 space-y-2 rounded-2xl border border-[#eadfce] bg-white p-3">
                  {newPhotoItems.map((item) => (
                    <p key={`${item.name}-${item.size}`} className="text-xs uppercase tracking-[0.14em] text-[#9a6b2a]">
                      {item.name} · {formatFileSize(item.size)}
                      {item.compressed ? ` · compressed from ${formatFileSize(item.originalSize)}` : ""}
                    </p>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-xs leading-5 text-[#8c7d70]">
                After saving, the page refreshes and the new photos can be moved up, moved down, or selected as the cover.
              </p>
            </div>
          </div>
        </Section>

        {state.message ? (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              state.status === "success"
                ? "border-[#bfdcb5] bg-[#f1faee] text-[#2f6b33]"
                : "border-[#f1c4c0] bg-[#fff5f4] text-[#9f2d24]"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className="sticky bottom-4 z-10 rounded-[28px] border border-[#eadfce] bg-white/95 p-4 shadow-[0_18px_42px_rgba(97,70,33,0.16)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#4f4338]">Save profile changes?</p>
              <p className="text-sm text-[#7a6d61]">
                This updates Supabase and refreshes the public dog profile.
              </p>
            </div>
            <button
              type="submit"
              disabled={pending || newPhotosPreparing || Boolean(newPhotoUploadError)}
              className="inline-flex items-center justify-center rounded-full bg-[#d38a2c] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#bf781f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving changes..." : newPhotosPreparing ? "Preparing photos..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[28px] border border-[#f1c4c0] bg-[#fff7f5] p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <h2 className="text-xl font-semibold text-[#6d2a23]">Delete Dog Profile</h2>
          <p className="mt-2 text-sm leading-6 text-[#7a4b45]">
            Use this only for accidental duplicates or test profiles. It permanently deletes this
            dog from Supabase and removes attached public storage files when possible.
          </p>
          <form action={deleteDogProfileAction} className="mt-5">
            <input type="hidden" name="dog_id" value={dog.id} />
            {deleteReturnTo ? <input name="returnTo" type="hidden" value={deleteReturnTo} /> : null}
            <button
              type="submit"
              className="w-full rounded-full border border-[#d94b41] bg-[#b42318] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f1f18]"
            >
              Delete this dog profile
            </button>
          </form>
        </section>
      </div>

      {hiddenTraits.length > 0 ? (
        <section className="rounded-[28px] border border-[#eadfce] bg-white/90 p-6 text-sm leading-6 text-[#74685d]">
          <h2 className="text-xl font-semibold text-[#4f4338]">Protected Metadata</h2>
          <p className="mt-2">
            Video metadata and other system traits are kept intact when this form updates profile tags.
          </p>
        </section>
      ) : null}
    </div>
  );
}
