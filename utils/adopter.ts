import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type PawjaiClient = SupabaseClient<Database>;

function splitName(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? null;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;

  return { firstName, lastName };
}

export async function ensureAdopterForUser(supabase: PawjaiClient, user: User) {
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
  const { data: profile, error: profileFindError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileFindError) {
    throw new Error(profileFindError.message);
  }

  if (profile) {
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        profile_picture_url: profilePictureUrl,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      throw new Error(profileUpdateError.message);
    }
  } else {
    const { error: profileInsertError } = await supabase
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

  const { data: existing, error: existingError } = await supabase
    .from("adopters")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) return existing;

  const { firstName, lastName } = splitName(fullName);

  const { data: adopter, error } = await supabase
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
