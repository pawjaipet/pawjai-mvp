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
  const { data: existing, error: existingError } = await supabase
    .from("adopters")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) return existing;

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;
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
