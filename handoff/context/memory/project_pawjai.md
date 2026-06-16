---
name: PAWJAI Project
description: Core facts about the pawjai.co.th dog adoption platform — stack, repo, deploy, Figma, key files
type: project
originSessionId: 26138611-8087-4cbb-9e19-91a09b1ea996
---
Thai dog adoption & matching platform. Live at pawjai.co.th.

**Repo:** github.com/pawjaipet/pawjai-mvp  
**Deploy:** Vercel auto-deploys from `main` branch. Push to main → live in ~1 min.  
**Local path:** /Users/sudlabha/Desktop/paw  
**Worktrees:** /Users/sudlabha/Desktop/paw/.claude/worktrees/

**Stack:** Next.js + TypeScript + Tailwind CSS + shadcn/ui → Supabase (DB, Auth, Storage, Edge Functions)

**Figma:** https://www.figma.com/make/cfYww0U2M4xAkvHv3Gbvss/PAWJAI-Currently  
File key: `cfYww0U2M4xAkvHv3Gbvss` — 23 screens, 34 shadcn/ui primitives  
Note: Figma Make file — do NOT use `get_metadata` on it. Use `get_design_context` / `get_screenshot`.

**Key agent reference file:** agents.md in repo root — lists all MCP tools and workflows.

**Workflow — code change to live:**
1. Edit in worktree
2. `git add` + `git commit` in worktree
3. `git checkout main && git merge <branch> && git push origin main`

**Logo:** 500×500px square PNG at `/public/pawjai-logo.png` (committed to git).  
Backup in Supabase Storage: `assets/branding/pawjai-logo.png` (public bucket).  
Public URL: https://bdnyvcvkyepipdcygkvn.supabase.co/storage/v1/object/public/assets/branding/pawjai-logo.png

**Why:** Logo rendered size controlled by container height (square image + object-contain). As of 2026-05-16, logo sizes updated to 65-85px across all pages to match Figma proportions.
