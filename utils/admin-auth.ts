import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessShelter } from "@/utils/admin-authorization";
import { getAdminCookieDomains } from "@/utils/admin-cookie-scope";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/types/database";

const ADMIN_GATE_COOKIE = "pawjai_admin_gate_unlocked";
const ADMIN_DRAFT_COOKIE = "pawjai_admin_draft_unlocked";
const ADMIN_GATE_COOKIE_PATHS = ["/", "/admin", "/booking"];
const ADMIN_DRAFT_COOKIE_PATHS = ["/", "/admindraft", "/booking"];
const DEFAULT_PAWJAI_ADMIN_GOOGLE_EMAIL = "pawjaipet@gmail.com";

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

export function getPawjaiAdminGoogleEmail() {
  return (process.env.PAWJAI_ADMIN_GOOGLE_EMAIL || DEFAULT_PAWJAI_ADMIN_GOOGLE_EMAIL)
    .trim()
    .toLowerCase();
}

export function sanitizeAdminNextPath(value: string | null | undefined) {
  const fallback = "/admindraft";
  const candidate = String(value ?? "").trim();

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "http://pawjai.local");
    if (parsed.origin !== "http://pawjai.local") return fallback;

    const allowed = [
      "/admin",
      "/admindraft",
      "/booking",
    ].some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`));

    if (!allowed || parsed.pathname === "/admin/login") return fallback;

    return `${parsed.pathname}${parsed.search}` || fallback;
  } catch {
    return fallback;
  }
}

export function buildAdminLoginPath(nextPath = "/admindraft") {
  const params = new URLSearchParams();
  params.set("next", sanitizeAdminNextPath(nextPath));
  return `/admin/login?${params.toString()}`;
}

type AuthIdentity = {
  provider?: string | null;
};

type AuthenticatedUser = {
  app_metadata?: {
    provider?: unknown;
    providers?: unknown;
  } | null;
  email?: string | null;
  identities?: AuthIdentity[] | null;
};

function userSignedInWithGoogle(user: AuthenticatedUser) {
  const appProvider = typeof user.app_metadata?.provider === "string"
    ? user.app_metadata.provider
    : "";
  const appProviders = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : [];

  return appProvider === "google"
    || appProviders.includes("google")
    || Boolean(user.identities?.some((identity) => identity.provider === "google"));
}

export function isPawjaiGoogleAdminUser(user: AuthenticatedUser | null | undefined) {
  if (!user?.email) return false;
  return user.email.trim().toLowerCase() === getPawjaiAdminGoogleEmail()
    && userSignedInWithGoogle(user);
}

export async function getAdminAuthContext(options: AdminAuthContextOptions = {}): Promise<AdminAuthContext | null> {
  void options;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // A real staff session owns its lane even if this browser also has a stale
  // phrase-gate cookie from earlier PawJai admin work.
  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (isPawjaiGoogleAdminUser(user)) {
      return {
        fullName: profile?.full_name ?? "PawJai Admin",
        isGlobalAdmin: true,
        role: "admin",
        shelterIds: [],
        userEmail: user.email ?? null,
        userId: user.id,
      };
    }

    if (profile?.role === "shelter_admin") {
      const { data: memberships } = await admin
        .from("shelter_users")
        .select("shelter_id")
        .eq("profile_id", user.id);

      return {
        fullName: profile.full_name,
        isGlobalAdmin: false,
        role: profile.role,
        shelterIds: (memberships ?? []).map((membership) => membership.shelter_id),
        userEmail: user.email ?? null,
        userId: user.id,
      };
    }
  }

  return null;
}

export async function requireAdminWorkspace(nextPath = "/admin") {
  const context = await getAdminAuthContext();

  if (!context) {
    redirect(buildAdminLoginPath(nextPath));
  }

  return context;
}

export async function requireGlobalAdmin(nextPath = "/admin") {
  const context = await requireAdminWorkspace(nextPath);

  if (!context.isGlobalAdmin) {
    const { getShelterPortalTarget } = await import("@/utils/shelter-portal");
    redirect(await getShelterPortalTarget(context) ?? "/shelter");
  }

  return context;
}

async function redirectShelterAccountToPortal(context: AdminAuthContext): Promise<never> {
  const { getShelterPortalTarget } = await import("@/utils/shelter-portal");
  redirect(await getShelterPortalTarget(context) ?? "/shelter");
}

export async function requireShelterAccess(shelterId: string, nextPath = "/admin") {
  const context = await requireAdminWorkspace(nextPath);

  if (!canAccessShelter({ role: context.role, shelterIds: context.shelterIds, targetShelterId: shelterId })) {
    if (context.role === "shelter_admin") {
      await redirectShelterAccountToPortal(context);
    }

    redirect(buildAdminLoginPath(nextPath));
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
  const cookieDomains = await getAdminCookieDomains();
  for (const { name, paths } of [
    { name: ADMIN_GATE_COOKIE, paths: ADMIN_GATE_COOKIE_PATHS },
    { name: ADMIN_DRAFT_COOKIE, paths: ADMIN_DRAFT_COOKIE_PATHS },
  ]) {
    for (const path of paths) {
      for (const domain of cookieDomains) {
        cookieStore.set({
          ...(domain ? { domain } : {}),
          httpOnly: true,
          maxAge: 0,
          name,
          path,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          value: "",
        });
      }
    }
  }
}

export async function openAdminGate() {
  await closeAdminGate();
}

export function validateAdminPassphrase(phrase: string) {
  void phrase;
  return false;
}
