import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/utils/supabase/config";

export function createClient() {
  const { supabaseKey, supabaseUrl } = getSupabaseEnv();

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
  );
}
