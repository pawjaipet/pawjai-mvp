import type { Database } from "@/types/database";

export type AdminWorkspaceRole = Extract<
  Database["public"]["Enums"]["app_role"],
  "admin" | "shelter_admin"
>;

export function isAdminWorkspaceRole(role: unknown): role is AdminWorkspaceRole {
  return role === "admin" || role === "shelter_admin";
}

export function canAccessShelter({
  role,
  shelterIds,
  targetShelterId,
}: {
  role: Database["public"]["Enums"]["app_role"] | null | undefined;
  shelterIds: string[];
  targetShelterId: string;
}) {
  if (role === "admin") return true;
  if (role !== "shelter_admin") return false;
  return shelterIds.includes(targetShelterId);
}

export function scopeShelterIdsForRole(
  role: Database["public"]["Enums"]["app_role"] | null | undefined,
  shelterIds: string[],
) {
  return role === "admin" ? null : shelterIds;
}
