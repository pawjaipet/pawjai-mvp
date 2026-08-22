"use server";

import { createClient } from "@/utils/supabase/server";
import {
  isPawjaiGoogleAdminUser,
  sanitizeAdminNextPath,
} from "@/utils/admin-auth";

export type AdminGoogleLoginResult = {
  error?: string;
  ok: boolean;
  redirectTo?: string;
};

export async function completeAdminGoogleLogin(nextPath?: string | null): Promise<AdminGoogleLoginResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: "Google sign-in did not finish. Please try again.",
      ok: false,
    };
  }

  if (!isPawjaiGoogleAdminUser(user)) {
    await supabase.auth.signOut();
    return {
      error: "This admin area only accepts the PawJai Google account.",
      ok: false,
    };
  }

  return {
    ok: true,
    redirectTo: sanitizeAdminNextPath(nextPath),
  };
}
