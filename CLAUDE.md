# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Vite, localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run lint         # ESLint across all files
npm run typecheck    # TypeScript check without emitting (tsconfig.app.json)
```

No test suite is currently configured.

## Architecture

This is a **React 18 + TypeScript + Vite** app styled with **Tailwind CSS** and using **Lucide React** for icons. Supabase JS is installed but not yet wired up — all persistence is currently `localStorage` only.

### State management

All global state lives in `App.tsx` as `useState` hooks. There is no context, no store, no routing library. Navigation between views is purely conditional rendering: `currentExercise === null` renders the menu; a non-null value renders that exercise inside `ExerciseContainer`.

### Exercise contract

Every exercise component in `src/exercises/` accepts exactly this props shape:

```ts
{
  difficulty: Difficulty;          // 'easy' | 'medium' | 'hard'
  onComplete: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}
```

`onComplete` is called once when the exercise ends (triggers stats save + completion modal). `onScoreUpdate` is called incrementally to keep the header score live.

### Data types (`src/types.ts`)

- `ExerciseType` — union of the 6 exercise IDs: `'memory' | 'pattern' | 'sequence' | 'word' | 'spatial' | 'attention'`
- `ExerciseStats` — `{ completed, bestScore, averageScore, totalScore }`
- `Stats` — `Record<string, ExerciseStats>` persisted to `localStorage` under key `cognitive_rehab_stats`

### What is being built on top of this

This codebase is being extended into a **full clinical session tool for Headway UK** (brain injury charity). The planned additions are:

- **Two distinct UI modes**: a calm client-facing exercise view and a professional dashboard
- **Supabase backend**: new schema on an existing project — tables for `professionals`, `clients`, `sessions`, `session_results`, `exercise_telemetry`, `notes`
- **Auth**: magic link now, Google SSO hook for later; professionals authenticate, clients never do
- **Per-session telemetry**: per-round timestamps, error counts, response times captured invisibly during exercises
- **AI layer** (Claude API): session summaries, plateau detection, exercise recommendations
- **PWA + offline sync**: Workbox + Supabase offline queue
- **Headway branding**: Tex Gyre Heros font (self-hosted, open source), colours `#003361` navy / `#6491C0` blue / `#FEDC00` yellow-gold

### Headway brand constants (use these, do not invent others)

| Token | Hex | Usage |
|---|---|---|
| Primary navy | `#003361` | Headings, nav, key UI chrome |
| Secondary blue | `#6491C0` | Buttons, h1, interactive elements |
| Light blue | `#8AAFD6` | Links, accents |
| Yellow-gold | `#FEDC00` | CTA button text, highlights |
| Body text | `#333333` | All body copy |
| Client bg | `#F5F9FF` | Client-facing view background |
| Pro canvas | `#F4F6F9` | Professional dashboard background |

Font stack: `'Tex Gyre Heros', Arimo, sans-serif` — bold for headings, regular for body, condensed bold for CTAs.

### GDPR constraint

Client records store an identifier only (name or reference code assigned by the professional). No DOB, medical history, or sensitive PII is stored. The client view must never show any other client's name or any indication that other clients exist.
