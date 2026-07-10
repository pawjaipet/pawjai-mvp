"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Database } from "@/types/database";

type AdminRole = Extract<Database["public"]["Enums"]["app_role"], "admin" | "shelter_admin">;

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

const ACCOUNT_PATHS = new Set(["/admin/accounts", "/admindraft/accounts"]);

function getAccountsReturnPath(formData: FormData) {
  const requested = getString(formData, "returnTo");
  return ACCOUNT_PATHS.has(requested) ? requested : "/admin/accounts";
}

function accountsRedirect(message: string, returnTo = "/admin/accounts"): never {
  redirect(`${returnTo}?message=${encodeURIComponent(message)}`);
}

function parseAdminRole(value: string): AdminRole | null {
  return value === "admin" || value === "shelter_admin" ? value : null;
}

export async function createAdminAccountAction(formData: FormData) {
  const returnTo = getAccountsReturnPath(formData);
  const adminContext = await requireGlobalAdmin(returnTo);
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const fullName = getString(formData, "fullName") || null;
  const role = parseAdminRole(getString(formData, "role"));
  const shelterId = getString(formData, "shelterId");

  if (!email || !email.includes("@")) {
    accountsRedirect("Enter a valid email address.", returnTo);
  }

  if (!password || password.length < 12) {
    accountsRedirect("Use a temporary password with at least 12 characters.", returnTo);
  }

  if (!role) {
    accountsRedirect("Choose an admin role.", returnTo);
  }

  if (role === "shelter_admin" && !shelterId) {
    accountsRedirect("Choose a shelter for shelter admin accounts.", returnTo);
  }

  const supabase = createAdminClient();
  const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createUserError || !createdUser.user) {
    accountsRedirect(createUserError?.message ?? "Admin account could not be created.", returnTo);
  }

  const userId = createdUser.user.id;
  const { error: profileError } = await supabase.from("profiles").upsert({
    full_name: fullName,
    id: userId,
    role,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    accountsRedirect(`Auth user was created, but profile role could not be saved: ${profileError.message}`, returnTo);
  }

  if (role === "shelter_admin") {
    const { error: linkError } = await supabase.from("shelter_users").upsert({
      profile_id: userId,
      role: "owner",
      shelter_id: shelterId,
    }, { onConflict: "shelter_id,profile_id" });

    if (linkError) {
      accountsRedirect(`Admin user was created, but shelter access could not be linked: ${linkError.message}`, returnTo);
    }
  }

  await logAdminAuditEvent({
    action: "admin_account.create",
    context: adminContext,
    metadata: {
      email,
      role,
    },
    shelterId: role === "shelter_admin" ? shelterId : null,
    targetId: userId,
    targetTable: "profiles",
  });

  revalidatePath("/admin/accounts");
  revalidatePath("/admindraft/accounts");
  accountsRedirect(role === "shelter_admin" ? "Shelter admin account created and linked." : "PawJai admin account created.", returnTo);
}

export async function revokeAdminAccountAction(formData: FormData) {
  const returnTo = getAccountsReturnPath(formData);
  const adminContext = await requireGlobalAdmin(returnTo);
  const profileId = getString(formData, "profileId");

  if (!profileId) {
    accountsRedirect("Missing admin account.", returnTo);
  }

  if (profileId === adminContext.userId) {
    accountsRedirect("You cannot revoke your own admin access from this page.", returnTo);
  }

  const supabase = createAdminClient();
  await supabase.from("shelter_users").delete().eq("profile_id", profileId);
  const { error } = await supabase
    .from("profiles")
    .update({
      role: "adopter",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) {
    accountsRedirect(`Admin access could not be revoked: ${error.message}`, returnTo);
  }

  await logAdminAuditEvent({
    action: "admin_account.revoke",
    context: adminContext,
    targetId: profileId,
    targetTable: "profiles",
  });

  revalidatePath("/admin/accounts");
  revalidatePath("/admindraft/accounts");
  accountsRedirect("Admin access revoked.", returnTo);
}
