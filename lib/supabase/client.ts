import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/utils/supabase/config";

export function createClient() {
  const { supabaseKey, supabaseUrl } = getSupabaseEnv();

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
}
