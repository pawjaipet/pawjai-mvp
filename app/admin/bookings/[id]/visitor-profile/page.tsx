import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FileText, ShieldCheck, UserRound } from "lucide-react";
import type { Database, Json } from "@/types/database";
import { formatBookingCode } from "@/utils/booking";
import { requireGlobalAdmin, requireShelterAccess } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Adopter = Database["public"]["Tables"]["adopters"]["Row"];
type AdopterDocument = Database["public"]["Tables"]["adopter_documents"]["Row"];
type AdopterPreference = Database["public"]["Tables"]["adopter_preferences"]["Row"];
type AdopterProfile = Database["public"]["Tables"]["adopter_profiles"]["Row"];
type Dog = Pick<Database["public"]["Tables"]["dogs"]["Row"], "breed" | "id" | "name">;
type Shelter = Pick<Database["public"]["Tables"]["shelters"]["Row"], "district" | "id" | "name" | "phone_number" | "province">;
type Application = {
  created_at: string;
  dog_id: string;
  id: string;
  notes: string | null;
  status: string;
};
type ApplicationAnswer = {
  answer_json: Json;
  answer_text: string | null;
  id: string;
  question_id: string;
};
type ApplicationDetail = {
  daily_routine: string | null;
  experience_with_pets: string | null;
  living_condition: string | null;
  preferred_traits: string | null;
  purpose: string | null;
};
type Question = {
  id: string;
  question_text: string;
  sort_order: number;
};
type FilterSnapshot = {
  ageRange?: [number, number] | null;
  answers?: Record<string, string[]>;
  questions?: Record<string, string>;
};

function fullName(adopter: Adopter | null) {
  return [adopter?.first_name, adopter?.last_name].filter(Boolean).join(" ") || "Unknown adopter";
}

function formatDateTime(date: string, time: string) {
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  });
  const timeLabel = new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateLabel} at ${timeLabel}`;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replaceAll("_", " ");
}

function jsonAnswer(answer: Json) {
  if (Array.isArray(answer)) return answer.map((item) => formatValue(item)).join(", ");
  if (answer && typeof answer === "object") return JSON.stringify(answer);
  return formatValue(answer);
}

function FieldRow({ label, value }: { label: string; value: unknown }) {
  const rendered = formatValue(value);
  if (rendered === "Not provided") return null;
  return (
    <div className="rounded-2xl bg-[#fffdfa] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#4f4338]">{rendered}</p>
    </div>
  );
}

function ageRangeLabel(range: unknown) {
  if (!Array.isArray(range) || range.length !== 2) return null;
  const [min, max] = range.map(Number);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const fmt = (value: number) => (value === 0 ? "0 year" : value >= 7 ? "7+ years" : `${value} year${value === 1 ? "" : "s"}`);
  return min === max ? fmt(min) : `${fmt(min)} - ${fmt(max)}`;
}

function FilterAnswerRows({ snapshot }: { snapshot: FilterSnapshot | null }) {
  const entries = Object.entries(snapshot?.answers ?? {})
    .filter(([, values]) => Array.isArray(values) && values.length > 0)
    .sort(([a], [b]) => Number(a) - Number(b));

  const ageLabel = ageRangeLabel(snapshot?.ageRange);

  if (!entries.length && !ageLabel) {
    return <p className="text-sm text-[#74685d]">No saved filter preferences yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {ageLabel ? <FieldRow label="Preferred age range" value={ageLabel} /> : null}
      {entries.map(([index, values]) => (
        <FieldRow
          key={index}
          label={snapshot?.questions?.[index] ?? `Preference question ${Number(index) + 1}`}
          value={values}
        />
      ))}
    </div>
  );
}

function Panel({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[32px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
      <div className="mb-4 flex items-center gap-3 text-[#9a6b2a]">
        {icon}
        <h2 className="text-lg font-semibold text-[#4f4338]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DocumentCard({
  documentType,
  fileName,
  mimeType,
  signedUrl,
}: {
  documentType: string;
  fileName?: string | null;
  mimeType?: string | null;
  signedUrl?: string | null;
}) {
  const isImage = mimeType?.startsWith("image/");
  return (
    <a
      className="overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffdfa] text-sm font-semibold text-[#4f4338] hover:bg-[#faf4ec]"
      href={signedUrl ?? "#"}
      rel="noreferrer"
      target="_blank"
    >
      {isImage && signedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={fileName ?? documentType} className="h-44 w-full object-cover" src={signedUrl} />
      ) : (
        <div className="flex h-24 items-center justify-center bg-[#f8f0e5] text-[#9a6b2a]">
          <FileText size={28} />
        </div>
      )}
      <div className="p-4">
        {documentType.replace("_", " ")}
        {fileName ? <span className="block pt-1 text-xs font-normal text-[#74685d]">{fileName}</span> : null}
      </div>
    </a>
  );
}

async function signedDocumentUrl(
  admin: ReturnType<typeof createAdminClient>,
  bucketId: string,
  storagePath: string,
) {
  const { data } = await admin.storage.from(bucketId).createSignedUrl(storagePath, 60 * 15);
  return data?.signedUrl ?? null;
}

export default async function AdminVisitorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminContext = await requireGlobalAdmin(`/admin/bookings/${id}/visitor-profile`);

  const admin = createAdminClient();
  const adminUntyped = admin as any;
  const { data: appointment } = await admin
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!appointment) {
    notFound();
  }

  const typedAppointment = appointment as Appointment;
  await requireShelterAccess(typedAppointment.shelter_id, `/admin/bookings/${id}/visitor-profile`);
  const [{ data: adopter }, { data: dog }, { data: shelter }] = await Promise.all([
    admin
      .from("adopters")
      .select("id, first_name, last_name, email, phone_number, verification_status, address_line, district, province, occupation, government_id_number")
      .eq("id", typedAppointment.adopter_id)
      .maybeSingle(),
    typedAppointment.dog_id
      ? admin.from("dogs").select("id, name, breed").eq("id", typedAppointment.dog_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("shelters")
      .select("id, name, phone_number, district, province")
      .eq("id", typedAppointment.shelter_id)
      .maybeSingle(),
  ]);

  const typedAdopter = adopter as Adopter | null;
  const typedDog = dog as Dog | null;
  const typedShelter = shelter as Shelter | null;

  const [{ data: adopterProfile }, { data: adopterPreference }, { data: adopterDocuments }] = await Promise.all([
    admin.from("adopter_profiles").select("*").eq("adopter_id", typedAppointment.adopter_id).maybeSingle(),
    admin.from("adopter_preferences").select("*").eq("adopter_id", typedAppointment.adopter_id).maybeSingle(),
    admin.from("adopter_documents").select("*").eq("adopter_id", typedAppointment.adopter_id).order("created_at", { ascending: false }),
  ]);

  const { data: application } = typedAppointment.application_id
    ? await adminUntyped.from("applications").select("*").eq("id", typedAppointment.application_id).maybeSingle()
    : await adminUntyped
        .from("applications")
        .select("*")
        .eq("adopter_id", typedAppointment.adopter_id)
        .eq("shelter_id", typedAppointment.shelter_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
  const typedApplication = application as Application | null;
  const applicationId = typedApplication?.id ?? typedAppointment.application_id;
  const [{ data: applicationDetail }, { data: applicationAnswers }] = applicationId
    ? await Promise.all([
        adminUntyped.from("application_details").select("*").eq("application_id", applicationId).maybeSingle(),
        adminUntyped.from("application_answers").select("*").eq("application_id", applicationId),
      ])
    : [{ data: null }, { data: [] }];
  const questionIds = [...new Set(((applicationAnswers ?? []) as ApplicationAnswer[]).map((answer) => answer.question_id))];
  const { data: questions } = questionIds.length
    ? await adminUntyped.from("questionnaire_questions").select("id, question_text, sort_order").in("id", questionIds)
    : { data: [] };

  const questionMap = new Map(((questions ?? []) as Question[]).map((question) => [question.id, question]));
  const profile = adopterProfile as AdopterProfile | null;
  const preference = adopterPreference as AdopterPreference | null;
  const detail = applicationDetail as ApplicationDetail | null;
  const docs = await Promise.all(
    ((adopterDocuments ?? []) as AdopterDocument[]).map(async (document) => ({
      ...document,
      signedUrl: await signedDocumentUrl(admin, document.bucket_id, document.storage_path),
    })),
  );
  const answers = ((applicationAnswers ?? []) as ApplicationAnswer[])
    .map((answer) => ({ answer, question: questionMap.get(answer.question_id) }))
    .sort((a, b) => (a.question?.sort_order ?? 0) - (b.question?.sort_order ?? 0));
  const filterSnapshot = ((preference as unknown as { filter_answers?: FilterSnapshot | null })?.filter_answers ?? null);

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#b77624]">
              Visitor Profile
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-[#4f4338]">{fullName(typedAdopter)}</h1>
            <p className="mt-2 text-sm text-[#74685d]">
              {typedAdopter?.email ?? "No email"} · {typedAdopter?.phone_number ?? "No phone"}
            </p>
          </div>
          <Link className="rounded-full border border-[#eadfce] bg-white px-5 py-2 text-sm font-semibold text-[#5b4d40] hover:bg-[#faf4ec]" href={`/admin/bookings/${typedAppointment.id}`}>
            Booking detail
          </Link>
        </div>

        <section className="mb-5 rounded-[32px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
          <div className="grid gap-4 md:grid-cols-4">
            <FieldRow label="Booking" value={typedAppointment.booking_code ?? formatBookingCode(typedAppointment.id)} />
            <FieldRow label="Visit" value={formatDateTime(typedAppointment.appointment_date, typedAppointment.appointment_time)} />
            <FieldRow label="Dog" value={typedDog ? `${typedDog.name}${typedDog.breed ? ` - ${typedDog.breed}` : ""}` : "Shelter visit"} />
            <FieldRow label="Shelter" value={typedShelter?.name ?? "Unknown shelter"} />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <Panel icon={<UserRound size={20} />} title="Adopter profile and lifestyle">
            <div className="grid gap-3 md:grid-cols-2">
              <FieldRow label="Verification status" value={typedAdopter?.verification_status} />
              <FieldRow label="Address" value={[typedAdopter?.address_line, typedAdopter?.district, typedAdopter?.province].filter(Boolean).join(", ")} />
              <FieldRow label="Occupation" value={typedAdopter?.occupation} />
              <FieldRow label="Government ID number" value={typedAdopter?.government_id_number} />
              <FieldRow label="Housing" value={profile?.housing_type} />
              <FieldRow label="Home ownership" value={profile?.home_ownership} />
              <FieldRow label="Landlord permission" value={profile?.landlord_permission} />
              <FieldRow label="Yard space" value={profile?.yard_space} />
              <FieldRow label="Household size" value={profile?.household_member_count} />
              <FieldRow label="Allergies" value={profile?.household_allergies} />
              <FieldRow label="Current pets" value={profile?.current_pets} />
              <FieldRow label="Other pets" value={profile?.other_pets} />
              <FieldRow label="Daily time" value={profile?.daily_time_available} />
              <FieldRow label="Dog experience" value={profile?.dog_experience} />
              <FieldRow label="Rescue dog experience" value={profile?.rescue_dog_experience} />
              <FieldRow label="Adoption reason" value={profile?.adoption_reason} />
              <FieldRow label="Bonding plan" value={profile?.bonding_plan} />
              <FieldRow label="Behavior response" value={profile?.behavior_response} />
              <FieldRow label="Trauma response" value={profile?.trauma_response} />
              <FieldRow label="Emergency plan" value={profile?.emergency_plan} />
              <FieldRow label="Travel plan" value={profile?.travel_plan} />
              <FieldRow label="Financial preparedness" value={profile?.financial_preparedness} />
            </div>
            <div className="mt-5 rounded-2xl bg-[#f8f0e5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Shelter questionnaire Q&A</p>
              {answers.length === 0 ? (
                <p className="mt-2 text-sm leading-6 text-[#74685d]">No shelter questionnaire answers are attached to this booking yet.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {answers.map(({ answer, question }) => (
                    <div className="rounded-2xl bg-[#fffdfa] p-4" key={answer.id}>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8d7f72]">
                        {question?.question_text ?? "Question"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#4f4338]">
                        {answer.answer_text || jsonAnswer(answer.answer_json)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <Panel icon={<ShieldCheck size={20} />} title="Match preferences">
            <div className="grid gap-3">
              <FieldRow label="Preferred size" value={preference?.preferred_size} />
              <FieldRow label="Preferred energy" value={preference?.preferred_energy_level} />
              <FieldRow label="Good with dogs needed" value={preference?.good_with_dogs} />
              <FieldRow label="Good with cats needed" value={preference?.good_with_cats} />
              <FieldRow label="Good with kids needed" value={preference?.good_with_kids} />
              <FieldRow label="Preference notes" value={preference?.notes} />
              <FieldRow label="Application purpose" value={detail?.purpose} />
              <FieldRow label="Living condition" value={detail?.living_condition} />
              <FieldRow label="Preferred traits" value={detail?.preferred_traits} />
              <FieldRow label="Daily routine" value={detail?.daily_routine} />
              <FieldRow label="Experience with pets" value={detail?.experience_with_pets} />
              <FieldRow label="Saved preference summary" value={(preference as unknown as { filter_summary?: string | null })?.filter_summary} />
            </div>
            <div className="mt-5 rounded-2xl bg-[#f8f0e5] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7f72]">Full filter preferences</p>
              <FilterAnswerRows snapshot={filterSnapshot} />
            </div>
          </Panel>
        </div>

        <div className="mt-5 grid gap-5">
          <Panel icon={<FileText size={20} />} title="Verification documents">
            {docs.length === 0 ? (
              <p className="text-sm text-[#74685d]">No adopter verification documents are attached yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {docs.map((document) => (
                  <DocumentCard
                    documentType={document.document_type}
                    fileName={document.original_file_name}
                    key={document.id}
                    mimeType={document.mime_type}
                    signedUrl={document.signedUrl}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
