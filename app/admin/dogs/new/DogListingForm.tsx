"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createDogListingAction } from "./actions";
import { initialCreateDogListingState } from "./form-state";

type ShelterOption = {
  id: string;
  name: string;
};

const defaultPhotoRows = ["", ""];

const personalityTags = [
  "Happy",
  "Lucky",
  "Sweet",
  "Playful",
  "Adventurous",
  "Curious",
  "Cuddly",
  "Smart",
  "Gentle",
  "Calm",
  "Serene",
  "Graceful",
  "Brave",
  "Social",
  "Friendly",
  "Loving",
  "Funny",
  "Goofy",
  "Chill",
  "Loyal",
  "Independent",
  "Affectionate",
  "Protective",
];

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

function ChoiceCards({
  name,
  options,
}: {
  name: string;
  options: { description?: string; label: string; value: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input className="peer sr-only" name={name} type="radio" value={option.value} />
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
  shelters,
}: {
  shelters: ShelterOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createDogListingAction,
    initialCreateDogListingState,
  );
  const [photoRows, setPhotoRows] = useState(defaultPhotoRows);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-[32px] bg-gradient-to-br from-[#fff6e8] via-[#fff1df] to-[#f9e4c0] p-7 shadow-[0_24px_60px_rgba(176,120,42,0.16)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
              Internal Dog Onboarding
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#4f4338]">
              Create a new PawJai listing like a marketplace post.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6f6256]">
              Start with the essentials, choose the photo order yourself, and save the listing
              when it is ready for the public browse flow.
            </p>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 text-sm text-[#6f6256]">
            <p className="font-medium text-[#4f4338]">Workflow tip</p>
            <p className="mt-2 leading-6">
              Save new dogs as <span className="font-semibold text-[#b77624]">draft</span> until
              photos and copy feel right, then publish them by switching the adoption status to
              <span className="font-semibold text-[#b77624]"> available</span>.
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b77624]">
                {item.label}
              </p>
              <p className="mt-2 text-sm text-[#5f5348]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Section
        title="Core Listing"
        description="These are the fields the team will touch most often when turning a rescue profile into a public listing."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Dog name" error={state.fieldErrors?.name}>
            <input name="name" className={inputClass(state.fieldErrors?.name)} placeholder="Mali" />
          </Field>

          <Field label="Shelter" error={state.fieldErrors?.shelter_id}>
            <select name="shelter_id" className={inputClass(state.fieldErrors?.shelter_id)} defaultValue="">
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

          <Field label="Breed">
            <input name="breed" className={inputClass()} placeholder="Mixed breed" />
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
            <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Size</p>
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
            <p className="mb-3 text-sm font-semibold text-[#5b4d40]">How active is this dog?</p>
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
            <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Training status</p>
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
            <p className="mb-3 text-sm font-semibold text-[#5b4d40]">People friendliness</p>
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
            <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Friendliness to other dogs</p>
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
            <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Public personality and description tags</p>
            <p className="mb-4 text-sm leading-6 text-[#7a6d61]">
              These become the playful beige bubbles on the swipe card and dog profile. Pick the words that actually fit the dog.
            </p>
            <ChipCheckboxGroup name="personality_tag" options={personalityTags} />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#5b4d40]">Care and medical tags</p>
            <p className="mb-4 text-sm leading-6 text-[#7a6d61]">
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
              <label key={name} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#f0e6d7] bg-white px-4 py-3 text-sm text-[#5b4d40]">
                <input type="checkbox" name={name} className="h-4 w-4 rounded border-[#d4c1a5] text-[#d69546] focus:ring-[#f6d7ad]" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Photos"
        description="Choose the workflow that is easiest for the team. Local folders are imported in filename order, browser files keep picker order, and URL rows are imported last. The first imported photo becomes the cover."
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
            label="Upload image files"
            hint="Use this when the photos are on your computer. Photos are uploaded to public dog photo storage."
          >
            <input
              name="photo_files"
              type="file"
              accept="image/*"
              multiple
              className="w-full rounded-2xl border border-[#e7dbc8] bg-[#fffdfa] px-4 py-3 text-sm text-[#4f4338] file:mr-4 file:rounded-full file:border-0 file:bg-[#d38a2c] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </Field>

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
              className="rounded-full border border-[#d8b27f] px-4 py-2 text-sm font-medium text-[#9b5f1c] transition hover:bg-[#fff0db]"
            >
              Add photo slot
            </button>
            {photoRows.length > 1 ? (
              <button
                type="button"
                onClick={() => setPhotoRows((rows) => rows.slice(0, -1))}
                className="rounded-full border border-[#eadfce] px-4 py-2 text-sm font-medium text-[#7a6d61] transition hover:bg-[#f8f2ea]"
              >
                Remove last slot
              </button>
            ) : null}
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
          <p>{state.message}</p>
          {state.status === "success" && state.dogId ? (
            <p className="mt-2">
              <Link href={`/dogs/${state.dogId}`} className="font-semibold underline decoration-2 underline-offset-4">
                Open the new dog profile
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 rounded-[28px] border border-[#eadfce] bg-white/95 p-4 shadow-[0_18px_42px_rgba(97,70,33,0.16)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#4f4338]">Ready to create this listing?</p>
            <p className="text-sm text-[#7a6d61]">
              Save as draft while details are incomplete, or choose available when the profile and cover image are ready.
            </p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-[#d38a2c] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#bf781f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Creating listing..." : "Create dog listing"}
          </button>
        </div>
      </div>
    </form>
  );
}
