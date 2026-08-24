"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAuditEvent } from "@/utils/admin-audit";
import { requireGlobalAdmin } from "@/utils/admin-auth";
import {
  isValidShelterPortalUsername,
  normalizeShelterPortalUsername,
} from "@/utils/shelter-portal";
import { createAdminClient } from "@/utils/supabase/admin";

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getAccountsReturnPath(formData: FormData) {
  const requested = getString(formData, "returnTo");
  if (requested.startsWith("/admindraft/accounts")) return "/admindraft/accounts?tab=shelters";
  return "/admin/accounts?tab=shelters";
}

function accountsRedirect(message: string, returnTo = "/admin/accounts?tab=shelters"): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}message=${encodeURIComponent(message)}`);
}

function revalidateAccounts() {
  revalidatePath("/admin/accounts");
  revalidatePath("/admindraft/accounts");
  revalidatePath("/shelter");
}

async function hasShelterMembership(profileId: string, shelterId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("shelter_users")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("shelter_id", shelterId)
    .maybeSingle();
  return Boolean(data);
}

export async function createShelterPortalAccountAction(formData: FormData) {
  const returnTo = getAccountsReturnPath(formData);
  const adminContext = await requireGlobalAdmin(returnTo);
  const email = getString(formData, "email").toLowerCase();
  const username = normalizeShelterPortalUsername(getString(formData, "username"));
  const password = getString(formData, "password");
  const fullName = getString(formData, "fullName") || null;
  const shelterId = getString(formData, "shelterId");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    accountsRedirect("Enter a valid shelter login email.", returnTo);
  }
  if (!isValidShelterPortalUsername(username)) {
    accountsRedirect("Use 3-40 lowercase letters, numbers, underscores, or hyphens for the username.", returnTo);
  }
  if (password.length < 12) {
    accountsRedirect("Use a password with at least 12 characters.", returnTo);
  }
  if (!shelterId) {
    accountsRedirect("Choose the shelter this login belongs to.", returnTo);
  }

  const admin = createAdminClient();
  const [{ data: shelter }, { data: existingMembership }] = await Promise.all([
    admin.from("shelters").select("id,name").eq("id", shelterId).maybeSingle(),
    admin.from("shelter_users").select("profile_id").eq("shelter_id", shelterId).maybeSingle(),
  ]);

  if (!shelter) accountsRedirect("The selected shelter no longer exists.", returnTo);
  if (existingMembership) {
    accountsRedirect(`${shelter.name} already has a portal account. Reset that account instead.`, returnTo);
  }

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { full_name: fullName || `${shelter.name} shared shelter login` },
  });
  if (createUserError || !createdUser.user) {
    accountsRedirect(createUserError?.message ?? "Shelter account could not be created.", returnTo);
  }

  const userId = createdUser.user.id;
  const rollbackUser = async () => {
    await admin.auth.admin.deleteUser(userId);
  };
  const { error: profileError } = await admin.from("profiles").upsert({
    full_name: fullName || `${shelter.name} shared shelter login`,
    id: userId,
    role: "shelter_admin",
    updated_at: new Date().toISOString(),
  });
  if (profileError) {
    await rollbackUser();
    accountsRedirect(`Shelter profile access could not be saved: ${profileError.message}`, returnTo);
  }

  const { error: linkError } = await admin.from("shelter_users").upsert({
    profile_id: userId,
    role: "owner",
    shelter_id: shelterId,
  }, { onConflict: "shelter_id,profile_id" });
  if (linkError) {
    await rollbackUser();
    accountsRedirect(`Shelter access could not be linked: ${linkError.message}`, returnTo);
  }

  const { error: usernameError } = await (admin as any)
    .from("shelter_portal_accounts")
    .insert({ profile_id: userId, username });
  if (usernameError) {
    await rollbackUser();
    const message = String(usernameError.message ?? "").toLowerCase().includes("duplicate")
      ? "That shelter username is already in use."
      : `Shelter username could not be saved: ${usernameError.message}`;
    accountsRedirect(message, returnTo);
  }

  await logAdminAuditEvent({
    action: "shelter_portal_account.create",
    context: adminContext,
    metadata: { email, username },
    shelterId,
    targetId: userId,
    targetTable: "shelter_portal_accounts",
  });
  revalidateAccounts();
  accountsRedirect(`${shelter.name} portal account created.`, returnTo);
}

export async function resetShelterPortalPasswordAction(formData: FormData) {
  const returnTo = getAccountsReturnPath(formData);
  const adminContext = await requireGlobalAdmin(returnTo);
  const profileId = getString(formData, "profileId");
  const shelterId = getString(formData, "shelterId");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!profileId || !shelterId || !(await hasShelterMembership(profileId, shelterId))) {
    accountsRedirect("That shelter portal account could not be found.", returnTo);
  }
  if (password.length < 12) {
    accountsRedirect("Use a replacement password with at least 12 characters.", returnTo);
  }
  if (password !== confirmPassword) accountsRedirect("The replacement passwords do not match.", returnTo);

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", profileId).maybeSingle();
  if (profile?.role !== "shelter_admin") {
    accountsRedirect("Only shelter portal passwords can be reset here.", returnTo);
  }

  const { error } = await admin.auth.admin.updateUserById(profileId, { password });
  if (error) accountsRedirect(`Password could not be reset: ${error.message}`, returnTo);

  await logAdminAuditEvent({
    action: "shelter_portal_account.password_reset",
    context: adminContext,
    metadata: { passwordReset: true },
    shelterId,
    targetId: profileId,
    targetTable: "shelter_portal_accounts",
  });
  revalidateAccounts();
  accountsRedirect("Shelter portal password reset. Share the new password securely.", returnTo);
}

export async function revokeShelterPortalAccountAction(formData: FormData) {
  const returnTo = getAccountsReturnPath(formData);
  const adminContext = await requireGlobalAdmin(returnTo);
  const profileId = getString(formData, "profileId");
  const shelterId = getString(formData, "shelterId");

  if (!profileId || !shelterId || !(await hasShelterMembership(profileId, shelterId))) {
    accountsRedirect("That shelter portal account could not be found.", returnTo);
  }
  if (profileId === adminContext.userId) accountsRedirect("You cannot revoke your own access from this page.", returnTo);

  const admin = createAdminClient();
  const { error: membershipError } = await admin
    .from("shelter_users")
    .delete()
    .eq("profile_id", profileId)
    .eq("shelter_id", shelterId);
  if (membershipError) accountsRedirect(`Shelter access could not be revoked: ${membershipError.message}`, returnTo);

  const { data: remainingMemberships } = await admin
    .from("shelter_users")
    .select("profile_id")
    .eq("profile_id", profileId)
    .limit(1);
  if (!remainingMemberships?.length) {
    await (admin as any).from("shelter_portal_accounts").delete().eq("profile_id", profileId);
    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: "adopter", updated_at: new Date().toISOString() })
      .eq("id", profileId);
    if (profileError) {
      accountsRedirect(`Portal link was removed, but the role could not be cleared: ${profileError.message}`, returnTo);
    }
  }

  await logAdminAuditEvent({
    action: "shelter_portal_account.revoke",
    context: adminContext,
    shelterId,
    targetId: profileId,
    targetTable: "shelter_portal_accounts",
  });
  revalidateAccounts();
  accountsRedirect("Shelter portal access revoked.", returnTo);
}
