import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import DocumentsPageClient from "@/components/documents/DocumentsPageClient";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { ensureAdopterForUser } from "@/utils/adopter";

function joinedName(firstName: string | null, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <ProtectedRouteGate
        nextPath="/documents"
        reason="Sign in to upload and manage adoption documents."
      />
    );
  }

  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const [{ data: profile }, { data: documents }, { data: accountProfile }] = await Promise.all([
    admin
      .from("adopter_profiles")
      .select("*")
      .eq("adopter_id", adopter.id)
      .maybeSingle(),
    admin
      .from("adopter_documents")
      .select("document_type, original_file_name")
      .eq("adopter_id", adopter.id)
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("full_name, phone_number")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const idDocument = (documents ?? []).find((doc) => doc.document_type === "id_copy");
  const homeDocuments = (documents ?? []).filter((doc) => doc.document_type === "house_image");
  const existingHomeFileNames = homeDocuments
    .map((doc) => doc.original_file_name)
    .filter((name): name is string => Boolean(name));

  const fullName =
    accountProfile?.full_name
    ?? joinedName(adopter.first_name, adopter.last_name)
    ?? "";

  return (
    <DocumentsPageClient
      initialData={{
        adopterId: adopter.id,
        existingHomeFileNames,
        existingIdFileName: idDocument?.original_file_name ?? null,
        form: {
          address: adopter.address_line ?? "",
          agreement: profile?.agreement_accepted ?? false,
          allergies: profile?.household_allergies ?? "",
          behaviorResponse: profile?.behavior_response ?? "",
          bondingPlan: Array.isArray(profile?.bonding_plan) ? profile!.bonding_plan.map((item) => String(item)) : [],
          dateOfBirth: adopter.date_of_birth ?? "",
          emergency: profile?.emergency_plan ?? "",
          financialReady: profile?.financial_preparedness ?? "",
          fullName,
          hadPetsBefore:
            profile?.had_pets_before === true
              ? "Yes"
              : profile?.had_pets_before === false
                ? "No"
                : "",
          homeType: profile?.housing_type ?? "",
          householdMembers: profile?.household_member_count?.toString() ?? "",
          idNumber: adopter.government_id_number ?? "",
          landlordPermission: profile?.landlord_permission ?? "",
          occupation: adopter.occupation ?? "",
          otherPets: Array.isArray(profile?.other_pets) ? profile!.other_pets.map((item) => String(item)) : [],
          ownRent: profile?.home_ownership ?? "",
          patienceAwareness: profile?.patience_awareness ?? "",
          petExperience: profile?.dog_experience ?? "",
          phone: accountProfile?.phone_number ?? adopter.phone_number ?? "",
          reason: profile?.adoption_reason ?? "",
          rescueCareExp: profile?.rescue_dog_experience ?? "",
          timeAvailable: profile?.daily_time_available ?? "",
          traumaResponse: profile?.trauma_response ?? "",
          travelPlan: profile?.travel_plan ?? "",
          yardSpace: profile?.yard_space ?? "",
        },
        userId: user.id,
        verificationStatus: adopter.verification_status,
      }}
    />
  );
}
