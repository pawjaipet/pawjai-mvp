import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AdopterDocument, AdopterProfile, Database } from "@/types/database";
import { createAdminClient } from "@/utils/supabase/admin";

type PawjaiClient = SupabaseClient<Database>;
type VerificationStatus = Database["public"]["Enums"]["adopter_verification_status"];

export type AdopterVerificationSnapshot = {
  adopter: Database["public"]["Tables"]["adopters"]["Row"];
  documents: Pick<AdopterDocument, "created_at" | "document_type" | "id" | "original_file_name">[];
  profile: AdopterProfile | null;
  status: VerificationStatus;
};

function splitName(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? null;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;

  return { firstName, lastName };
}

export async function ensureAdopterForUser(supabase: PawjaiClient, user: User) {
  const admin = createAdminClient();
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  const profilePictureUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const { data: profile, error: profileFindError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileFindError) {
    throw new Error(profileFindError.message);
  }

  if (profile) {
    const profileUpdates: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (fullName) profileUpdates.full_name = fullName;
    if (profilePictureUrl) profileUpdates.profile_picture_url = profilePictureUrl;

    const { error: profileUpdateError } = Object.keys(profileUpdates).length
      ? await admin.from("profiles").update(profileUpdates).eq("id", user.id)
      : { error: null };

    if (profileUpdateError) {
      throw new Error(profileUpdateError.message);
    }
  } else {
    const { error: profileInsertError } = await admin
      .from("profiles")
      .insert({
        full_name: fullName,
        id: user.id,
        profile_picture_url: profilePictureUrl,
        role: "adopter",
      });

    if (profileInsertError) {
      throw new Error(profileInsertError.message);
    }
  }

  const { firstName, lastName } = splitName(fullName);

  const { data: existing, error: existingError } = await admin
    .from("adopters")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    const adopterUpdates: Database["public"]["Tables"]["adopters"]["Update"] = {};
    if (user.email && existing.email !== user.email) adopterUpdates.email = user.email;
    if (!existing.first_name && firstName) adopterUpdates.first_name = firstName;
    if (!existing.last_name && lastName) adopterUpdates.last_name = lastName;

    if (Object.keys(adopterUpdates).length) {
      const { data: updatedAdopter, error: adopterUpdateError } = await admin
        .from("adopters")
        .update(adopterUpdates)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (adopterUpdateError) {
        throw new Error(adopterUpdateError.message);
      }

      return updatedAdopter;
    }

    return existing;
  }

  const { data: adopter, error } = await admin
    .from("adopters")
    .insert({
      email: user.email ?? null,
      first_name: firstName,
      last_name: lastName,
      profile_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return adopter;
}

export async function getAdopterVerificationSnapshot(supabase: PawjaiClient, user: User): Promise<AdopterVerificationSnapshot> {
  const adopter = await ensureAdopterForUser(supabase, user);
  const admin = createAdminClient();

  const [{ data: profile }, { data: documents }] = await Promise.all([
    admin
      .from("adopter_profiles")
      .select("*")
      .eq("adopter_id", adopter.id)
      .maybeSingle(),
    admin
      .from("adopter_documents")
      .select("id, document_type, original_file_name, created_at")
      .eq("adopter_id", adopter.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    adopter,
    documents: documents ?? [],
    profile: profile ?? null,
    status: adopter.verification_status,
  };
}

export function canBookAppointment(snapshot: Pick<AdopterVerificationSnapshot, "profile" | "status">) {
  return (
    (snapshot.status === "submitted" || snapshot.status === "approved")
    && Boolean(snapshot.profile?.completed_at)
  );
}
