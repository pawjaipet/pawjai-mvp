import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessShelter, isAdminWorkspaceRole } from "@/utils/admin-authorization";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database";

const ADMIN_GATE_COOKIE = "pawjai_admin_gate_unlocked";
const ADMIN_DRAFT_COOKIE = "pawjai_admin_draft_unlocked";
const ADMIN_GATE_PASSPHRASE = "pawjaiadmin!";
const ADMIN_GATE_COOKIE_PATHS = ["/admin", "/booking"];

export type AdminAuthContext = {
  fullName: string | null;
  isGlobalAdmin: boolean;
  role: Extract<Database["public"]["Enums"]["app_role"], "admin" | "shelter_admin">;
  shelterIds: string[];
  userEmail: string | null;
  userId: string | null;
};

type AdminAuthContextOptions = {
  includePhraseGate?: boolean;
};

function buildAdminLoginPath(nextPath = "/admin", message?: string) {
  const params = new URLSearchParams();
  params.set("next", nextPath);
  if (message) params.set("message", message);
  return `/admin/login?${params.toString()}`;
}

export async function getAdminAuthContext(options: AdminAuthContextOptions = {}): Promise<AdminAuthContext | null> {
  const includePhraseGate = options.includePhraseGate ?? true;
  const cookieStore = await cookies();

  if (
    includePhraseGate &&
    (cookieStore.get(ADMIN_GATE_COOKIE)?.value === "1" || cookieStore.get(ADMIN_DRAFT_COOKIE)?.value === "1")
  ) {
    return {
      fullName: "PawJai Admin",
      isGlobalAdmin: true,
      role: "admin",
      shelterIds: [],
      userEmail: null,
      userId: null,
    };
  }

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

  const cookieStore = await cookies();
  for (const path of ADMIN_GATE_COOKIE_PATHS) {
    cookieStore.set({
      httpOnly: true,
      maxAge: 0,
      name: ADMIN_GATE_COOKIE,
      path,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: "",
    });
  }
}

export async function openAdminGate() {
  const cookieStore = await cookies();
  for (const path of ADMIN_GATE_COOKIE_PATHS) {
    cookieStore.set({
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      name: ADMIN_GATE_COOKIE,
      path,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: "1",
    });
  }
}

export function validateAdminPassphrase(phrase: string) {
  return phrase.trim() === ADMIN_GATE_PASSPHRASE;
}
