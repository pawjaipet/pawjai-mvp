import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/utils/supabase/config";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseKey, supabaseUrl } = getSupabaseEnv();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Middleware or route handlers should own cookie persistence when
            // Server Components run in a read-only cookies context.
          }
        },
      },
    },
  );
}
