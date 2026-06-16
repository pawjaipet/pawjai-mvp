# Session: Initial app build + Figma import + auth modal

- **Session IDs:** `1b12712c-9864-4a00-be78-65aa29d9e573` (plus resumed snapshots `502eaa6b-6646-4e1f-a0c2-8c2d29e54fd2` and `7837dd7e-3fd2-4703-92e6-0ca257a3ee89` — same logical session, ~22 MB each, ~2,545 messages)
- **Date range:** 2026-04-20 → 2026-05-17 for the initial build; the `7837dd7e` snapshot was **resumed and used through 2026-06-16** for an extensive UI polish second life (see below)
- **Branch:** `codex/auth-modal-access` (initial build); UI polish later landed on `main`

## What it was working on
The foundational PAWJAI build. Started by connecting to a Figma Make design (`PAWJAI-Currently`) and translating it into the Next.js app, then built out the bulk of the MVP: dog browsing/swipe feed, dog detail pages, the auth/login modal flow, admin dog management, booking/appointment flows, and the Supabase backend scaffold. This is the session most of the early git history traces back to.

## Files / areas touched
Broad — `app/` (swipe, dogs, messages, admin, filter, schedule, documents), `components/` (SwipeFeed, SwipeDogCard, BottomNavBar, PageHeader), `app/layout.tsx`, Supabase migrations, and Next.js helper utilities.

## Current state
**Done** (long since merged and superseded by later work). The session ended because an image exceeded the many-image dimension limit, not because work was incomplete.

## 7837dd7e resumed (2026-05-17 → 2026-06-16) — UI polish second life

The `7837dd7e` snapshot of this session was resumed and used as a long-running UI polish thread, in parallel with the worktree session. Major themes (not exhaustive):

- **Swipe feed**: card sizing for iPhone Safari (`100dvh`, `min()` clamps), ad slots every 3 dogs (`AD_EVERY = 3`), hamburger menu removed, PawJai logo top-left as page header
- **Dog name + tags**: name wrapping at long Thai names, fallback personality pills derived from energy/training/social fields
- **Dog detail page**: bookmark/save icon top-right, PawJai logo top-left as back-home link
- **Profile**: editable header (avatar + cover + name + badges), horizontal-scroll wishlist (175×175 cards)
- **Appointments**: UPCOMING/PAST tabs, past-cards dim styling, dark-brown app bar with brightness-inverted logo, DETAILS / MESSAGES / HELP tabs, QR check-in render
- **Verification (`/documents`)**: per-section drafts (`saveMode: "draft" | "submit"`), Save-&-Exit pill, multi-photo home upload up to 5, "currently have any pets?" question removed
- **Schedule routing**: new `/schedule/[dogId]` server entry that redirects unverified adopters to `/documents?next=…` before booking
- **Admin dog-new form**: error summary at top of Core Listing, friendly field labels, default shelter auto-select

This work landed on `main` via the `codex/auth-modal-access` branch being fast-forwarded into `main`. Tag `MARK101` was placed as a stable checkpoint mid-stream.

## Unfinished threads / TODOs
- **Logo resize on swipe feed** — user repeatedly requested the PawJai logo on the swipe feed be made bigger/proportional to match Figma; current size `h-[60px] w-[140px]` at `left-[14px] top-[14px]`. **Not yet committed.**
- All other threads carry forward into the worktree session and into the in-flight admin-auth security sweep (see [2026-05-17 worktree session](2026-05-17_worktree-figma-mcp-uxui-polish.md)).

## External systems depended on
Figma MCP (design import), Supabase (DB + auth), GitHub (branch `codex/auth-modal-access`, then `main`), Vercel (auto-deploy).
