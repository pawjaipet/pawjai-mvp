import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import type { AdminAuthContext } from "@/utils/admin-auth";

export function normalizeShelterPortalUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidShelterPortalUsername(value: string) {
  return /^[a-z0-9][a-z0-9_-]{2,39}$/.test(normalizeShelterPortalUsername(value));
}

export async function resolveShelterPilotLoginIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  if (normalized.includes("@")) return normalized;
  if (!isValidShelterPortalUsername(normalized)) return "";

  const admin = createAdminClient();
  const { data: account } = await (admin as any)
    .from("shelter_portal_accounts")
    .select("profile_id")
    .eq("username", normalized)
    .maybeSingle();

  if (account?.profile_id) {
    const { data: user } = await admin.auth.admin.getUserById(account.profile_id);
    return user.user?.email ?? "";
  }

  if (normalized === "thevoice") return "thevoice@pawjaipet.com";
  if (normalized === "rescuedog") return "rescuedog@pawjaipet.com";

  return "";
}

export function slugifyShelterName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export async function getShelterPortalTarget(context: AdminAuthContext) {
  if (context.isGlobalAdmin) return "/admin";

  const shelterId = context.shelterIds[0];
  if (!shelterId) return null;

  const admin = createAdminClient();
  const { data: shelter } = await admin
    .from("shelters")
    .select("id,name")
    .eq("id", shelterId)
    .maybeSingle();

  if (!shelter) return null;

  return `/shelter/${slugifyShelterName(shelter.name)}`;
}

export async function getShelterByPortalSlug(slug: string, allowedShelterIds: string[]) {
  if (allowedShelterIds.length === 0) return null;

  const admin = createAdminClient();
  const { data: shelters } = await admin
    .from("shelters")
    .select("id,name")
    .in("id", allowedShelterIds);

  return (shelters ?? []).find((shelter) => slugifyShelterName(shelter.name) === slug) ?? null;
}

export async function getShelterPortalAccount(profileId: string) {
  const admin = createAdminClient();
  const [{ data: account }, { data: user }] = await Promise.all([
    (admin as any)
      .from("shelter_portal_accounts")
      .select("username")
      .eq("profile_id", profileId)
      .maybeSingle(),
    admin.auth.admin.getUserById(profileId),
  ]);

  return {
    email: user.user?.email ?? "",
    username: account?.username ?? "",
  };
}
