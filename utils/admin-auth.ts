import "server-only";

import { redirect } from "next/navigation";
import { canAccessShelter, isAdminWorkspaceRole } from "@/utils/admin-authorization";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database";

export type AdminAuthContext = {
  fullName: string | null;
  isGlobalAdmin: boolean;
  role: Extract<Database["public"]["Enums"]["app_role"], "admin" | "shelter_admin">;
  shelterIds: string[];
  userEmail: string | null;
  userId: string;
};

function buildAdminLoginPath(nextPath = "/admin", message?: string) {
  const params = new URLSearchParams();
  params.set("next", nextPath);
  if (message) params.set("message", message);
  return `/admin/login?${params.toString()}`;
}

export async function getAdminAuthContext(): Promise<AdminAuthContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminWorkspaceRole(profile?.role)) return null;

  const { data: memberships } = await admin
    .from("shelter_users")
    .select("shelter_id")
    .eq("profile_id", user.id);

  return {
    fullName: profile.full_name,
    isGlobalAdmin: profile.role === "admin",
    role: profile.role,
    shelterIds: (memberships ?? []).map((membership) => membership.shelter_id),
    userEmail: user.email ?? null,
    userId: user.id,
  };
}

export async function requireAdminWorkspace(nextPath = "/admin") {
  const context = await getAdminAuthContext();

  if (!context) {
    redirect(buildAdminLoginPath(nextPath, "Sign in with an admin or shelter account."));
  }

  return context;
}

export async function requireGlobalAdmin(nextPath = "/admin") {
  const context = await requireAdminWorkspace(nextPath);

  if (!context.isGlobalAdmin) {
    redirect(buildAdminLoginPath(nextPath, "This page is only available to PawJai admin."));
  }

  return context;
}

export async function requireShelterAccess(shelterId: string, nextPath = "/admin") {
  const context = await requireAdminWorkspace(nextPath);

  if (!canAccessShelter({ role: context.role, shelterIds: context.shelterIds, targetShelterId: shelterId })) {
    redirect(buildAdminLoginPath(nextPath, "This shelter is not linked to your admin account."));
  }

  return context;
}

export async function isAdminGateOpen() {
  return (await getAdminAuthContext()) !== null;
}

export async function closeAdminGate() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function openAdminGate() {
  throw new Error("Admin phrase unlock has been replaced by Supabase admin sign-in.");
}

export function validateAdminPassphrase() {
  return false;
}
