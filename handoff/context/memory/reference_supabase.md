---
name: Supabase Reference
description: Supabase project details, storage buckets, env var locations for PAWJAI
type: reference
originSessionId: 26138611-8087-4cbb-9e19-91a09b1ea996
---
**MCP server:** `mcp__96b59bab-9681-4ba9-97d1-24bbaec99e22__*`  
**Project ID:** `bdnyvcvkyepipdcygkvn`  
**Project name:** BACKEND ATTEMPT1  
**Region:** us-west-1  
**API URL:** https://bdnyvcvkyepipdcygkvn.supabase.co

**Env vars location:** /Users/sudlabha/Desktop/paw/.env.local  
Contains: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

**Storage buckets:**
- `profile-pictures` — public
- `dog-photos` — public (dog media uploaded here)
- `assets` — public (created 2026-05-16, for branding/static assets like logo)
- `identity-documents` — private
- `application-documents` — private
- `adopter-documents` — private

**Upload logo to storage (service role):**
```bash
curl -X POST "https://bdnyvcvkyepipdcygkvn.supabase.co/storage/v1/object/assets/branding/pawjai-logo.png" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: image/png" \
  --data-binary @/path/to/file.png
```

**Note:** Worktrees need .env.local copied in — does not inherit from main project root.
