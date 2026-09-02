import type {
  Database,
  DogCareDocument,
  DogCareRecord,
  DogCareTimelineEvent,
  DogVaccinationRecord,
} from "@/types/database";

export type DogVaccinationStatus = Database["public"]["Enums"]["dog_vaccination_status"];
export type DogVaccinationVerificationStatus =
  Database["public"]["Enums"]["dog_vaccination_verification_status"];
export type DogCareEventType = Database["public"]["Enums"]["dog_care_event_type"];

export type DogCarePassport = {
  careRecord: DogCareRecord | null;
  documents: DogCareDocument[];
  timelineEvents: DogCareTimelineEvent[];
  vaccinations: DogVaccinationRecord[];
};

export type DogCareCompleteness = {
  completed: number;
  missing: string[];
  percent: number;
  total: number;
};

export const DOG_VACCINATION_STATUS_OPTIONS: { label: string; value: DogVaccinationStatus }[] = [
  { label: "Unknown", value: "unknown" },
  { label: "Not started", value: "not_started" },
  { label: "Partially vaccinated", value: "partial" },
  { label: "Up to date", value: "up_to_date" },
  { label: "Overdue", value: "overdue" },
];

export const DOG_VACCINATION_VERIFICATION_OPTIONS: { label: string; value: DogVaccinationVerificationStatus }[] = [
  { label: "Unknown", value: "unknown" },
  { label: "Pending", value: "pending" },
  { label: "Verified", value: "verified" },
];

export const DOG_CARE_NOTE_TYPE_OPTIONS: { label: string; value: DogCareEventType }[] = [
  { label: "Medical", value: "medical" },
  { label: "Behavior", value: "behavior" },
  { label: "Diet", value: "diet" },
  { label: "Follow-up", value: "follow_up" },
  { label: "General", value: "general" },
];

const CARE_COMPLETENESS_FIELDS = [
  {
    isComplete: (passport: DogCarePassport) => passport.vaccinations.length > 0,
    label: "Vaccine records",
  },
  {
    isComplete: (passport: DogCarePassport) => Boolean(passport.careRecord?.medical_notes?.trim()),
    label: "Medical notes",
  },
  {
    isComplete: (passport: DogCarePassport) => Boolean(passport.careRecord?.special_needs_notes?.trim()),
    label: "Special needs notes",
  },
  {
    isComplete: (passport: DogCarePassport) => Boolean(passport.careRecord?.allergies?.trim()),
    label: "Allergies",
  },
  {
    isComplete: (passport: DogCarePassport) => Boolean(passport.careRecord?.medications?.trim()),
    label: "Medication",
  },
  {
    isComplete: (passport: DogCarePassport) => Boolean(passport.careRecord?.last_vet_check_date),
    label: "Last vet check",
  },
  {
    isComplete: (passport: DogCarePassport) => Boolean(passport.careRecord?.next_vet_check_due_date),
    label: "Next vet check due",
  },
];

export function buildDogCareCompleteness(passport: DogCarePassport): DogCareCompleteness {
  const missing = CARE_COMPLETENESS_FIELDS
    .filter((field) => !field.isComplete(passport))
    .map((field) => field.label);
  const total = CARE_COMPLETENESS_FIELDS.length;
  const completed = total - missing.length;

  return {
    completed,
    missing,
    percent: Math.round((completed / total) * 100),
    total,
  };
}

export function formatDogVaccinationStatus(status: DogVaccinationStatus | null | undefined) {
  return DOG_VACCINATION_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "Unknown";
}

export function formatDogCareEventType(type: DogCareEventType | null | undefined) {
  return DOG_CARE_NOTE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "General";
}

export function isCareDateOverdue(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
