# Frontend Supabase Setup

The Next.js app is now wired for Supabase SSR using the current `@supabase/ssr` pattern.

## Added files

- `/Users/sudlabha/Desktop/paw/lib/supabase/client.ts`
- `/Users/sudlabha/Desktop/paw/lib/supabase/server.ts`
- `/Users/sudlabha/Desktop/paw/lib/supabase/middleware.ts`
- `/Users/sudlabha/Desktop/paw/middleware.ts`
- `/Users/sudlabha/Desktop/paw/.env.example`

## Environment variables

Create `.env.local` from `.env.example` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The URL is already set to your project ref:

- `https://bdnyvcvkyepipdcygkvn.supabase.co`

You still need to paste the publishable key from the Supabase project's Connect dialog or API Keys page.

## CLI commands

The repo now includes the Supabase CLI as a dev dependency, so you can use:

- `npm run supabase -- --version`
- `npm run supabase:start`
- `npm run supabase:stop`
- `npm run supabase:status`
- `npm run supabase:login`
- `npm run supabase:link`

## Notes

- `supabase login` still requires your Supabase personal access token or browser flow in the CLI.
- `supabase link` is preconfigured to link this repo to project ref `bdnyvcvkyepipdcygkvn`.
- Running the full local Supabase stack still requires a Docker-compatible runtime.
