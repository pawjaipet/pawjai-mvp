type CookieLike = {
  name: string;
};

export function isSupabaseAuthCookieName(name: string) {
  return (
    (name.startsWith("sb-") && name.includes("-auth-token"))
    || name.includes("supabase-auth-token")
  );
}

export function hasSupabaseAuthCookies(cookies: CookieLike[]) {
  return cookies.some((cookie) => isSupabaseAuthCookieName(cookie.name));
}
