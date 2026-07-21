# Prompt: Domain Split, SEO Indexing, and Public/App Surface Cleanup

Use this prompt in a new coding session for PawJai.

## Context

Project: PAWJAI, Thai dog adoption and matching platform.

Repo path:

```txt
/Users/sudlabha/Desktop/paw
```

Relevant reel:

```txt
https://www.instagram.com/reel/DaSpPVGsu-o/?igsh=MXRkdnRxenVpMGc0cQ==
```

The reel itself could not be fully downloaded/transcribed from Codex because Instagram blocked unauthenticated media extraction. However, indexed transcript/OCR snippets were accessible and should be treated as the source idea, not as a perfect full transcript.

## Reel Transcript / OCR Reference

Accessible indexed text included:

```txt
Follow these 3 steps after buying your app domain.

Basically split your app domain from your main domain.
This makes working with different ...

Then go to Google Console and tell Google to index the public pages of our website.

OCR:
3 Thing to do after buying your ...
```

Interpretation for PawJai:

1. Separate public marketing/indexable pages from the logged-in app surface.
2. Keep public pages easy for Google to crawl and index.
3. Use Google Search Console to submit/index public PawJai pages.

## Goal

Implement a PawJai version of the reel’s advice:

- Make the public site cleanly indexable.
- Make clear which routes are public SEO routes vs. logged-in app routes.
- Prepare the app for a possible future split such as:
  - Public site: `https://www.pawjaipet.com`
  - App/dashboard: `https://app.pawjaipet.com`
- Add or verify sitemap/robots/canonical metadata for public pages.
- Do not break the current production domain or auth redirects.

## Important Current Domain Assumptions

Current live domain:

```txt
https://www.pawjaipet.com
```

Current auth callback routes:

```txt
https://www.pawjaipet.com/auth/callback
https://www.pawjaipet.com/auth/confirm
```

Do not move auth to `app.pawjaipet.com` yet unless the user explicitly asks. This prompt is for preparing the structure and SEO surface first.

## Desired Implementation

### 1. Audit Route Visibility

Create or update a small route map documenting:

- Public/indexable:
  - `/`
  - `/about`
  - `/dogs`
  - `/dogs/[id]`
  - Any public informational pages
- Public but probably `noindex`:
  - `/auth`
  - `/auth/callback`
  - `/auth/confirm`
- Private/noindex:
  - `/profile`
  - `/appointments`
  - `/documents`
  - `/messages`
  - `/schedule`
  - `/filter`
- Admin/noindex:
  - `/admin`
  - `/admin/**`

Recommended file:

```txt
docs/domain-and-indexing-plan.md
```

### 2. Add/Verify SEO Metadata

In the Next.js app, verify or add:

- `app/sitemap.ts`
- `app/robots.ts`
- Metadata/canonical setup in `app/layout.tsx` or route-level metadata.

Sitemap should include only stable public pages, especially:

- Home
- About
- Dog listing
- Individual available dog profile pages, if dynamically feasible

Robots should:

- Allow public pages.
- Disallow private/admin/auth routes.
- Reference the sitemap URL.

### 3. Canonical Domain

Ensure metadata consistently uses:

```txt
https://www.pawjaipet.com
```

Avoid accidentally canonicalizing to localhost, `pawjaipet.com` without `www`, or Supabase/Vercel preview URLs.

### 4. Future App Domain Prep

Do not fully migrate yet, but add a short note/config plan for a future app split:

```txt
www.pawjaipet.com  -> public/SEO site
app.pawjaipet.com  -> logged-in app, auth, account flows
```

Include implications:

- Supabase Site URL / Redirect URLs
- Google OAuth authorized redirect URIs
- Cookie/session domain behavior
- Vercel domains
- Cloudflare DNS

### 5. Google Search Console Checklist

Add a checklist to the doc:

- Add Domain property for `pawjaipet.com`.
- Verify ownership via DNS TXT in Cloudflare.
- Submit sitemap:

```txt
https://www.pawjaipet.com/sitemap.xml
```

- Inspect important URLs:
  - `https://www.pawjaipet.com/`
  - `https://www.pawjaipet.com/about`
  - `https://www.pawjaipet.com/dogs`
- Request indexing for public pages.

## Constraints

- Do not expose private user data or auth-only pages in sitemap.
- Do not index admin, auth, document, message, appointment, profile, or scheduling pages.
- Do not change production DNS, Supabase redirect URLs, or Google OAuth settings unless explicitly requested.
- Preserve existing auth behavior.
- Keep changes scoped and verify with `npm run build`.

## Verification Plan

Run:

```bash
npm run build
```

If a local server is used, check:

```txt
/robots.txt
/sitemap.xml
```

Confirm:

- Sitemap only includes public URLs.
- Robots disallows private/auth/admin paths.
- Build passes.
- No auth routes were moved or broken.

## Expected Deliverables

- A concise domain/indexing plan doc.
- Next.js sitemap/robots/metadata updates if missing or incomplete.
- Build verification result.
- A summary of what the user still needs to do manually in Google Search Console and Cloudflare.
