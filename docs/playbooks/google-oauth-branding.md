# Google OAuth Branding

The old Supabase OAuth redirect flow can show a Google account chooser that says:

```txt
to continue to bdnyvcvkyepipdcygkvn.supabase.co
```

That is technically correct because Supabase brokers the OAuth callback through the project API domain, but it looks untrustworthy to adopters.

## App Fix

The PawJai auth form now prefers Google Identity Services when this public env var is present:

```txt
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google Web OAuth client ID>
```

With that set, the Google button runs on `www.pawjaipet.com`, receives a Google ID token, and signs into Supabase with:

```ts
supabase.auth.signInWithIdToken({
  provider: "google",
  token,
  nonce,
})
```

If the env var is missing, PawJai falls back to the previous Supabase `signInWithOAuth` redirect flow.

## Required Google Console Settings

In Google Cloud / Google Auth Platform:

1. Open the PawJai OAuth web client.
2. Add Authorized JavaScript origins:

```txt
https://www.pawjaipet.com
https://pawjaipet.com
http://localhost:3001
```

3. Keep the existing Supabase authorized redirect URI for the fallback flow:

```txt
https://bdnyvcvkyepipdcygkvn.supabase.co/auth/v1/callback
```

4. Copy the Web OAuth client ID into Vercel:

```txt
NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

5. In Google Auth Platform branding, set:
   - App name: `PawJai`
   - App logo: PawJai logo
   - Authorized domain: `pawjaipet.com`
   - Privacy policy / terms URLs on `www.pawjaipet.com`

## Best Long-Term Fix

Supabase’s official recommendation is to set up a custom Supabase domain, such as:

```txt
auth.pawjaipet.com
```

or:

```txt
api.pawjaipet.com
```

Once activated, Supabase Auth advertises that custom domain in OAuth callback flows, so Google no longer shows the random Supabase project URL.

Before activating the Supabase custom domain, add this redirect URI in Google Cloud:

```txt
https://auth.pawjaipet.com/auth/v1/callback
```

Then update production env:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://auth.pawjaipet.com
```

Use the direct Google Identity Services flow as the immediate UX fix, and the Supabase custom domain as the infrastructure cleanup.
