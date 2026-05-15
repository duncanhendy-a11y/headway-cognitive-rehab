# Headway Cognitive Rehab — Build Plan

## Overview

Rebuild the existing Bolt cognitive rehab app into a full clinical session tool for
Headway UK (brain injury charity). The current app is a standalone exercise player
with localStorage persistence. The rebuilt app serves two user groups: rehabilitation
professionals (auth'd) and their clients (no auth, isolated view).

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (existing)
- **Styling**: Tailwind CSS + shadcn/ui (adding)
- **Routing**: React Router v6 (adding)
- **Backend**: Supabase — schema `headway_rehab` on existing project (wired up)
- **AI**: Claude API via `@anthropic-ai/sdk` — session summaries, insights
- **PWA**: vite-plugin-pwa + Workbox (adding)
- **Charts**: Recharts (adding)
- **Fonts**: Tex Gyre Heros (self-hosted, open source, Headway's actual font)

## Supabase Schema (already deployed)

```
professionals   — auth'd users (OTs, support workers, carers)
clients         — identifier only (GDPR), linked to professional
sessions        — one sitting, difficulty, notes, ai_summary, pending_sync flag
session_exercises — one row per exercise per session, final_score, duration
exercise_telemetry — per-round: score, errors, response_time_ms, timestamps, metadata (jsonb)
ai_insights     — generated per client: session_summary | plateau_alert | regression | recommendation | domain_analysis
```

## User Roles

- **Professional**: logs in, manages client roster (max ~25), runs sessions, adds notes
- **Client**: no login — sees isolated full-screen exercise view, no trace of other clients (GDPR)
- **Supervisor**: schema role exists, UI deferred to future version

## Core User Journey

1. Professional logs in (magic link; Google SSO architecture-ready)
2. Selects client from roster
3. Session setup wizard: choose exercises → set difficulty
4. Hands device to client — full-screen calm view with client's name only
5. Client completes exercises (telemetry captured invisibly)
6. Device returned to professional
7. Professional adds session notes (quick-tags + freeform textarea)
8. AI generates draft session summary, professional edits and saves
9. Progress dashboard shows trends, domain health, AI-flagged alerts

## Milestones

### M1 — Foundation (auth + routing + brand + SessionContext)
- Define `SessionContext`: `{ sessionId, clientId, professionalId, difficulty }` — consumed by exercise view and telemetry collector
- Replace `App.tsx` conditional-render state machine with React Router routes
- Protected route wrapper + auth context (magic link Supabase auth)
- Professional dashboard shell with sidebar nav
- Install: React Router, shadcn/ui, Recharts, vite-plugin-pwa, @anthropic-ai/sdk
- Tailwind config: Headway colours + Tex Gyre Heros font
- React Router setup: `/login`, `/dashboard`, `/clients/:id`, `/session/setup`, `/session/exercise`, `/session/notes`, `/session/:id/report`, `/help`
- Supabase auth context (magic link)
- Protected route wrapper
- Professional dashboard shell (nav + client roster grid)

### M1.5 — RLS Security (must land before M2 writes real data)
- Replace all `allow_all` policies with `auth.uid()`-scoped policies
- Pattern: `professionals` filtered by `auth_user_id = auth.uid()`; all other tables cascade through `professional_id`
- New migration: `20260515000001_headway_rehab_rls.sql`

### M2 — Client Management
- Add/edit/deactivate client (identifier only)
- Client profile page: tabs for Overview, Sessions, Insights
- Radar chart for 6 cognitive domains
- Session history list

### M3 — Session Flow
- Session setup wizard (3 steps: exercises → difficulty → confirm)
- Client exercise view: isolated full-screen, calm Headway-branded
- Exercise components enhanced with telemetry hooks (timestamps, errors, response time per round)
- Between-exercise transition screens
- All 6 existing exercises wrapped with telemetry

### M4 — Post-Session + AI
- Post-session notes screen (quick-tags + freeform)
- Claude API: generate session summary draft
- Session saved to Supabase (online) or localStorage queue (offline)
- Session report page: full breakdown with charts
- AI insights: plateau detection, exercise recommendations

### M5 — PWA + Polish
- vite-plugin-pwa with Workbox
- Offline banner + sync status indicator
- Background sync on reconnect
- Help page: getting started, exercise guide, tooltips reference
- Onboarding tour (first login)

## Key Constraints

- **GDPR**: clients store identifier only. Client view shows NO other client names.
- **Offline-first**: sessions created offline with `pending_sync: true`, synced on reconnect
- **Non-technical users**: professionals are busy, not tech-savvy — UI must be obvious
- **Accessibility**: large touch targets (48px min), high contrast, large text option
- **Headway brand**: navy `#003361`, blue `#6491C0`, yellow-gold `#FEDC00`, Tex Gyre Heros

## What Already Exists

| Sub-problem | Existing code |
|---|---|
| 6 cognitive exercises | `src/exercises/` — all 6, working, need telemetry hooks |
| Exercise contract | `props: { difficulty, onComplete, onScoreUpdate }` |
| Data types | `src/types.ts` — ExerciseType, Difficulty, ExerciseStats |
| localStorage stats | `src/utils/storage.ts` — getStats, updateStats, clearStats |
| Supabase client | `src/lib/supabase.ts` — wired to `headway_rehab` schema |
| Supabase schema | Remote — all 6 tables deployed |

## NOT In Scope (this version)

- Supervisor dashboard UI (role exists in DB, UI deferred)
- Headway CRM integration
- PDF session reports
- Client home-practice mode (client-side auth)
- Video exercise guidance
- Multi-language support

## Engineering Review Findings

| Finding | Severity | Fix |
|---|---|---|
| `allow_all` RLS on all 6 tables — anyone can read all client data | **Critical** | Replace with `auth.uid()` policies in M2 before any real data |
| `App.tsx` state machine not explicitly replaced in M1 | High | M1 must remove `currentExercise` useState and replace with Router |
| No `SessionContext` defined — how do session IDs reach exercises? | High | Define `SessionContext` in M1: `{ sessionId, clientId, professionalId, difficulty }` |
| Offline sync steps unspecified — no queue structure, no deduplication | High | Pseudo-code sync loop in M4: detect reconnect → read queue → upsert by UUID → delete on success |
| Sync race condition — concurrent sync during live session | High | Module-level `isSyncing` mutex flag in sync utility |
| Supabase edge function setup not in plan (needed for Claude API) | Medium | M4 sub-task: `supabase/functions/generate-summary/index.ts` + `ANTHROPIC_API_KEY` secret |
| Workbox runtime cache config missing — could cache Supabase anon key | Medium | M5: `runtimeCaching` — Supabase API → NetworkFirst; static → CacheFirst |
| `MemoryMatch` has no round concept for telemetry | Medium | Treat whole game as one round; `errors = moves - matches` at completion |

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|---------|
| 1 | Arch | React Router v6 over TanStack Router | Mechanical | P5 (explicit) | Simpler, widely understood, no overkill for this route count | TanStack Router |
| 2 | Arch | shadcn/ui over Radix primitives directly | Mechanical | P5 | Pre-built accessible components, consistent with Tailwind | Radix raw |
| 3 | Arch | Recharts over Chart.js | Mechanical | P5 | Better React integration, TypeScript-first | Chart.js |
| 4 | Offline | localStorage queue + pending_sync flag | Mechanical | P5 | Simple, reliable, matches existing localStorage pattern | IndexedDB |
| 5 | AI | Claude API server-side edge function | Taste | P1 | Keeps API key off client; requires Supabase edge function setup | Client-side API call |
| 6 | Auth | Magic link only (no password) | Mechanical | P5 | Simpler, phishing-resistant, SSO hook ready for later | Password auth |
