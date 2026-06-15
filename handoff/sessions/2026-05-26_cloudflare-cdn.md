# Session: Cloudflare CDN in front of Backblaze B2

- **Session ID:** `6c0d8df0-42d0-4c56-9967-ee14959cd67c`
- **Date range:** 2026-05-26 (~4 min active)
- **Branch:** `main`

## What it was working on
Set up Cloudflare as a CDN in front of Backblaze B2 media storage so B2 streams less bandwidth. Configured `media.pawjai.co.th` as a proxied CNAME to Backblaze, SSL "full" mode, and a 30-day edge cache rule that overrides Backblaze's `Cache-Control: private`.

## Files / areas touched
Infra/DNS (Cloudflare dashboard). Flagged `utils/backblaze.ts` (the default B2 base URL fallback) and the `PAWJAI_B2_PUBLIC_BASE_URL` production env var as the one code-side thing to verify.

## Current state
**Done / verified.** CDN confirmed working; remaining "issue" was just DNS propagation (24–48h window). Action item left: confirm the production `PAWJAI_B2_PUBLIC_BASE_URL` points at the CDN domain, not direct Backblaze.

## Unfinished threads / TODOs
Verify `PAWJAI_B2_PUBLIC_BASE_URL` in the Vercel production environment resolves to `media.pawjai.co.th` (the CDN), not the raw Backblaze URL.

## External systems depended on
Cloudflare (CDN/DNS), Backblaze B2 (origin storage), Vercel (env var).

> Note: this transcript contained a Cloudflare API token in the opening message — **not reproduced here**. That token should be treated as exposed and rotated.
