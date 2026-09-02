"use client";

import { FileText, HeartPulse, Syringe } from "lucide-react";
import type { DogCareDocument, DogCareRecord, DogCareTimelineEvent, DogVaccinationRecord } from "@/types/database";
import {
  DOG_VACCINATION_VERIFICATION_OPTIONS,
  buildDogCareCompleteness,
  isCareDateOverdue,
} from "@/utils/dog-care-passport";

type DogCarePassportFieldsProps = {
  careRecord?: DogCareRecord | null;
  documents?: DogCareDocument[];
  mode: "create" | "edit";
  timelineEvents?: DogCareTimelineEvent[];
  vaccinations?: DogVaccinationRecord[];
};

const DOG_CARE_DOCUMENT_TYPE_OPTIONS = [
  { label: "Adoption document", value: "adoption_document" },
  { label: "Vaccination proof", value: "vaccination_proof" },
  { label: "Medical record", value: "medical_record" },
  { label: "Other", value: "other" },
];

const DOG_CARE_DOCUMENT_VISIBILITY_OPTIONS = [
  { label: "Adopter visible", value: "adopter_visible" },
  { label: "Shelter only", value: "shelter_only" },
];

function inputClass() {
  return "w-full rounded-2xl border border-[#d6c8ad] bg-[#fffaf5] px-4 py-3 text-sm text-[#65584f] outline-none transition focus:border-[#cd8188] focus:ring-4 focus:ring-[#f3cbd0]/50";
}

function Field({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#65584f]">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-[#8c7d70]">{hint}</span> : null}
    </label>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function VaccineRow({ record }: { record?: DogVaccinationRecord }) {
  return (
    <div className="grid gap-3 rounded-3xl border border-[#f0e6d7] bg-white p-4 md:grid-cols-2">
      <input name="vaccine_record_id" type="hidden" value={record?.id ?? ""} />
      <Field label="Vaccine name">
        <input name="vaccine_name" className={inputClass()} defaultValue={record?.vaccine_name ?? ""} placeholder="Rabies, DHPP, yearly booster" />
      </Field>
      <Field label="Provider / shelter / vet">
        <input name="vaccine_provider_name" className={inputClass()} defaultValue={record?.provider_name ?? ""} placeholder="Shelter clinic or vet name" />
      </Field>
      <Field label="Date given">
        <input name="vaccine_administered_on" className={inputClass()} defaultValue={record?.administered_on ?? ""} type="date" />
      </Field>
      <Field label="Next due date">
        <input name="vaccine_due_on" className={inputClass()} defaultValue={record?.due_on ?? ""} type="date" />
      </Field>
      <Field label="Verification status">
        <select name="vaccine_verification_status" className={inputClass()} defaultValue={record?.verification_status ?? "unknown"}>
          {DOG_VACCINATION_VERIFICATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Linked document">
        <select name="vaccine_document_id" className={inputClass()} defaultValue={record?.document_id ?? ""} disabled>
          <option value="">Document upload coming soon</option>
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Vaccine notes">
          <textarea name="vaccine_notes" rows={2} className={inputClass()} defaultValue={record?.notes ?? ""} placeholder="Batch, reaction, reminder, or proof details." />
        </Field>
      </div>
    </div>
  );
}

export default function DogCarePassportFields({
  careRecord = null,
  documents = [],
  mode,
  timelineEvents = [],
  vaccinations = [],
}: DogCarePassportFieldsProps) {
  const completeness = buildDogCareCompleteness({
    careRecord,
    documents,
    timelineEvents,
    vaccinations,
  });
  const openByDefault = mode === "edit" || completeness.completed > 0;

  return (
    <details
      className="overflow-hidden rounded-[28px] border border-[#d6c8ad] bg-white/90 shadow-[0_16px_50px_rgba(101,88,79,0.08)]"
      open={openByDefault}
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 p-6 marker:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f8e8ea] text-[#cd8188]">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-[#65584f]">Care Passport</h2>
              <p className="mt-1 text-sm leading-6 text-[#65584f]">
                Health, vaccines, reminders, and care documents.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
          <span className="rounded-full bg-[#eef8e9] px-3 py-1.5 text-[#3d7a34]">
            {completeness.percent}% complete
          </span>
          {careRecord?.next_vet_check_due_date ? (
            <span className={`rounded-full px-3 py-1.5 ${isCareDateOverdue(careRecord.next_vet_check_due_date) ? "bg-[#fff1ee] text-[#b42318]" : "bg-[#fff6dd] text-[#8a5b00]"}`}>
              Next vet {formatDate(careRecord.next_vet_check_due_date)}
            </span>
          ) : null}
        </div>
      </summary>

      <div className="border-t border-[#f0e6d7] p-6">
        {completeness.missing.length > 0 ? (
          <div className="mb-5 rounded-3xl border border-[#f0e6d7] bg-[#fffaf5] p-4 text-sm leading-6 text-[#65584f]">
            <p className="font-semibold">Missing before passport feels complete:</p>
            <p className="mt-1 text-[#65584f]/75">{completeness.missing.slice(0, 5).join(", ")}{completeness.missing.length > 5 ? "..." : ""}</p>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Last vet check date">
            <input name="care_last_vet_check_date" className={inputClass()} defaultValue={careRecord?.last_vet_check_date ?? ""} type="date" />
          </Field>
          <Field label="Next vet check due date">
            <input name="care_next_vet_check_due_date" className={inputClass()} defaultValue={careRecord?.next_vet_check_due_date ?? ""} type="date" />
          </Field>
          <Field label="Current medication">
            <textarea name="care_medications" rows={3} className={inputClass()} defaultValue={careRecord?.medications ?? ""} placeholder="None, or medication name, dose, schedule." />
          </Field>
          <Field label="Allergies">
            <textarea name="care_allergies" rows={3} className={inputClass()} defaultValue={careRecord?.allergies ?? ""} placeholder="None known, food sensitivity, medicine allergy." />
          </Field>
          <Field label="Special needs notes">
            <textarea name="care_special_needs_notes" rows={3} className={inputClass()} defaultValue={careRecord?.special_needs_notes ?? ""} placeholder="Mobility, recovery, diet, behavior support." />
          </Field>
          <div className="md:col-span-2">
            <Field label="Medical notes">
              <textarea name="care_medical_notes" rows={4} className={inputClass()} defaultValue={careRecord?.medical_notes ?? ""} placeholder="Vet summary, health history, treatment context, and follow-up instructions." />
            </Field>
          </div>
        </div>

        <div className="mt-7 rounded-3xl border border-[#f0e6d7] bg-[#fffaf5] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Syringe className="h-5 w-5 text-[#cd8188]" />
            <div>
              <h3 className="font-semibold text-[#65584f]">Vaccination records</h3>
              <p className="text-sm text-[#65584f]/70">Edit existing records or fill the blank row to add one.</p>
            </div>
          </div>
          <div className="space-y-4">
            {vaccinations.map((record) => (
              <VaccineRow key={record.id} record={record} />
            ))}
            <VaccineRow />
          </div>
        </div>

        <div className="mt-7">
          <div className="rounded-3xl border border-[#f0e6d7] bg-[#fffaf5] p-5">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#cd8188]" />
              <div>
                <h3 className="font-semibold text-[#65584f]">Care documents</h3>
                <p className="text-sm text-[#65584f]/70">Upload adoption documents, vaccine proof, or medical records.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <Field label="Document title">
                <input name="care_document_title" className={inputClass()} placeholder="Rabies vaccine card, adoption agreement" />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Document type">
                  <select name="care_document_type" className={inputClass()} defaultValue="vaccination_proof">
                    {DOG_CARE_DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Visibility">
                  <select name="care_document_visibility" className={inputClass()} defaultValue="adopter_visible">
                    {DOG_CARE_DOCUMENT_VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field hint="Accepted files: PNG, JPG, WEBP, or PDF under 15 MB." label="Upload document">
                <input
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="block w-full rounded-2xl border border-[#d6c8ad] bg-white px-4 py-3 text-sm text-[#65584f] file:mr-3 file:rounded-full file:border-0 file:bg-[#cd8188] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  name="care_document_file"
                  type="file"
                />
              </Field>
            </div>
            <div className="mt-4 space-y-3">
              {documents.length > 0 ? documents.map((document) => {
                const content = (
                  <>
                    <p className="font-semibold">{document.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#cd8188]">
                      {document.document_type.replaceAll("_", " ")} · {document.visibility.replaceAll("_", " ")}
                    </p>
                  </>
                );

                return document.file_url ? (
                  <a
                    className="block rounded-2xl bg-white px-4 py-3 text-sm text-[#65584f] transition hover:bg-[#f8e8ea]"
                    href={document.file_url}
                    key={document.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={document.id} className="rounded-2xl bg-white px-4 py-3 text-sm text-[#65584f]">
                    {content}
                  </div>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-[#d6c8ad] bg-white px-4 py-5 text-sm leading-6 text-[#65584f]/70">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
