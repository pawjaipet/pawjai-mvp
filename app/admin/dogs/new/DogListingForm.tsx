"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createDogListingAction } from "./actions";
import { initialCreateDogListingState } from "./form-state";

type ShelterOption = {
  id: string;
  name: string;
};

type TraitRow = {
  id: string;
  type: string;
  value: string;
};

const defaultTraitRows: TraitRow[] = [
  { id: "trait-1", type: "temperament", value: "" },
  { id: "trait-2", type: "care_note", value: "" },
];

const defaultPhotoRows = ["", ""];

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
  const [traitRows, setTraitRows] = useState(defaultTraitRows);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-6">
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

          <Field label="Size">
            <select name="size" className={inputClass()} defaultValue="">
              <option value="">Not set yet</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra_large">Extra large</option>
            </select>
          </Field>

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
            <Field label="Background story">
              <textarea
                name="background"
                rows={5}
                className={inputClass()}
                placeholder="How the dog was rescued, personality highlights, and anything an adopter should know."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Special needs or medical notes">
              <textarea
                name="special_needs"
                rows={4}
                className={inputClass()}
                placeholder="Medication, recovery notes, mobility needs, allergies, or anything the team should surface."
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        title="Matching Template"
        description="Fill this like the adopter questionnaire in reverse. These answers become the structured dog fields used for filtering and matching."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Energy level">
            <select name="energy_level" className={inputClass()} defaultValue="">
              <option value="">Not set yet</option>
              <option value="low">Low - relaxed, calm companion</option>
              <option value="medium">Medium - daily walks and light play</option>
              <option value="high">High - needs a lot of activity</option>
            </select>
          </Field>

          <Field label="Training status">
            <select name="training_preference_match" className={inputClass()} defaultValue="">
              <option value="">Not set yet</option>
              <option value="Well-trained dogs only">Well-trained dog</option>
              <option value="Dogs still in training">Still in training</option>
              <option value="Willing to train from scratch">Needs training from scratch</option>
            </select>
          </Field>

          <Field label="People friendliness">
            <select name="people_friendliness" className={inputClass()} defaultValue="">
              <option value="">Not set yet</option>
              <option value="Comfortable being petted by strangers">Comfortable being petted by strangers</option>
              <option value="Takes time to get to know new people">Takes time with new people</option>
              <option value="Only stick to their owner">Only sticks to their owner</option>
            </select>
          </Field>

          <Field label="Good with people?">
            <select name="human_friendly_value" className={inputClass()} defaultValue="">
              <option value="">Not sure</option>
              <option value="true">Yes</option>
              <option value="false">No / needs careful introduction</option>
            </select>
          </Field>

          <Field label="Friendliness to other dogs">
            <select name="dog_social_style" className={inputClass()} defaultValue="">
              <option value="">Not set yet</option>
              <option value="Friendly and playful">Friendly and playful</option>
              <option value="Okay with other dogs but not too social">Okay with dogs but not too social</option>
              <option value="Prefer to be solo">Prefers to be solo</option>
            </select>
          </Field>

          <Field label="Good with dogs?">
            <select name="good_with_dogs_value" className={inputClass()} defaultValue="">
              <option value="">Not sure</option>
              <option value="true">Yes</option>
              <option value="false">No / solo preferred</option>
            </select>
          </Field>

          <Field label="Friendliness to cats">
            <select name="cat_friendliness" className={inputClass()} defaultValue="">
              <option value="">Not set yet</option>
              <option value="Cat-friendly">Cat-friendly</option>
              <option value="Not sure / No">Not sure / no</option>
            </select>
          </Field>

          <Field label="Good with cats?">
            <select name="good_with_cats_value" className={inputClass()} defaultValue="">
              <option value="">Not sure</option>
              <option value="true">Yes</option>
              <option value="false">No / unknown</option>
            </select>
          </Field>

          <Field label="Friendliness to kids under 4">
            <select name="kid_friendliness" className={inputClass()} defaultValue="">
              <option value="">Not set yet</option>
              <option value="Kid-friendly">Kid-friendly</option>
              <option value="Not sure / No">Not sure / no</option>
            </select>
          </Field>

          <Field label="Good with kids?">
            <select name="good_with_kids_value" className={inputClass()} defaultValue="">
              <option value="">Not sure</option>
              <option value="true">Yes</option>
              <option value="false">No / unknown</option>
            </select>
          </Field>

          <Field label="Special needs category">
            <select name="special_needs_category" className={inputClass()} defaultValue="">
              <option value="">No category selected</option>
              <option value="Medical conditions">Medical conditions</option>
              <option value="Behavioral challenges">Behavioral challenges</option>
              <option value="Special diet requirements">Special diet requirements</option>
              <option value="No special needs preferred">No special needs</option>
            </select>
          </Field>

          <div className="md:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["sterilized", "Sterilized"],
              ["house_trained", "House trained"],
              ["leash_trained", "Leash trained"],
              ["animal_friendly", "Animal friendly"],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-3 rounded-2xl border border-[#f0e6d7] bg-white px-4 py-3 text-sm text-[#5b4d40]">
                <input type="checkbox" name={name} className="h-4 w-4 rounded border-[#d4c1a5] text-[#d69546] focus:ring-[#f6d7ad]" />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="md:col-span-2">
            <Field label="Personality and temperament">
              <textarea
                name="temperament"
                rows={3}
                className={inputClass()}
                placeholder="Gentle, shy at first, playful after warming up, calm around adults."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Ideal home">
              <textarea
                name="ideal_home"
                rows={3}
                className={inputClass()}
                placeholder="Quiet home, patient adopter, no cats, daily walks, fenced outdoor space if possible."
              />
            </Field>
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
            hint="Use this when the photos are on your computer. Backblaze receives the files directly."
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

      <Section
        title="Custom Traits"
        description="Optional extra labels for anything that does not fit the template above, like caretaker, rescue location, vaccine note, or internal tag."
      >
        <div className="space-y-4">
          {traitRows.map((row, index) => (
            <div key={row.id} className="grid gap-4 rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 md:grid-cols-[1fr_2fr]">
              <Field label={`Trait label ${index + 1}`} error={state.fieldErrors?.[`trait_${index}`]}>
                <input
                  name="trait_type"
                  defaultValue={row.type}
                  className={inputClass(state.fieldErrors?.[`trait_${index}`])}
                  placeholder="temperament"
                />
              </Field>
              <Field label={`Trait value ${index + 1}`}>
                <input
                  name="trait_value"
                  defaultValue={row.value}
                  className={inputClass(state.fieldErrors?.[`trait_${index}`])}
                  placeholder="gentle, playful with people"
                />
              </Field>
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setTraitRows((rows) => [
                  ...rows,
                  { id: `trait-${rows.length + 1}`, type: "", value: "" },
                ])
              }
              className="rounded-full border border-[#d8b27f] px-4 py-2 text-sm font-medium text-[#9b5f1c] transition hover:bg-[#fff0db]"
            >
              Add trait
            </button>
            {traitRows.length > 1 ? (
              <button
                type="button"
                onClick={() => setTraitRows((rows) => rows.slice(0, -1))}
                className="rounded-full border border-[#eadfce] px-4 py-2 text-sm font-medium text-[#7a6d61] transition hover:bg-[#f8f2ea]"
              >
                Remove last trait
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
