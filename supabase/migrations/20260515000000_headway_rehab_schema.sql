-- Headway Cognitive Rehab — schema setup
-- Schema: headway_rehab
-- All client data is minimal PII by design (GDPR). Clients are identifier-only.
-- RLS uses allow_all for the demo build. Tighten to auth.uid() before production.

create schema if not exists headway_rehab;

grant usage on schema headway_rehab to anon, authenticated, service_role;
alter default privileges in schema headway_rehab
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema headway_rehab
  grant all on sequences to anon, authenticated, service_role;

-- ─── professionals ────────────────────────────────────────────────────────────
-- The authenticated users: OTs, support workers, volunteer carers.
-- auth_user_id links to auth.users once Supabase Auth is wired up.
-- role is 'professional' now; 'supervisor' is designed in for future use.

create table headway_rehab.professionals (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique,
  email           text not null unique,
  full_name       text not null,
  role            text not null default 'professional'
                  check (role in ('professional', 'supervisor')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table headway_rehab.professionals enable row level security;
create policy "allow_all" on headway_rehab.professionals
  for all using (true) with check (true);

-- ─── clients ──────────────────────────────────────────────────────────────────
-- Minimal PII: identifier only (name or reference code set by professional).
-- One professional owns each client record. GDPR: no DOB, medical, or sensitive data.

create table headway_rehab.clients (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references headway_rehab.professionals(id) on delete cascade,
  identifier      text not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table headway_rehab.clients enable row level security;
create policy "allow_all" on headway_rehab.clients
  for all using (true) with check (true);

-- ─── sessions ─────────────────────────────────────────────────────────────────
-- One session = one sitting between professional and client.
-- pending_sync = true when the session was created offline and not yet uploaded.

create table headway_rehab.sessions (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references headway_rehab.professionals(id) on delete cascade,
  client_id       uuid not null references headway_rehab.clients(id) on delete cascade,
  difficulty      text not null check (difficulty in ('easy', 'medium', 'hard')),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  notes           text,
  ai_summary      text,
  pending_sync    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table headway_rehab.sessions enable row level security;
create policy "allow_all" on headway_rehab.sessions
  for all using (true) with check (true);

-- ─── session_exercises ────────────────────────────────────────────────────────
-- One row per exercise run within a session.
-- sequence_order preserves the order exercises were presented.

create table headway_rehab.session_exercises (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references headway_rehab.sessions(id) on delete cascade,
  exercise_type    text not null check (
                     exercise_type in ('memory','pattern','sequence','word','spatial','attention')
                   ),
  difficulty       text not null check (difficulty in ('easy', 'medium', 'hard')),
  sequence_order   integer not null,
  final_score      integer not null default 0,
  duration_seconds integer,
  completed        boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table headway_rehab.session_exercises enable row level security;
create policy "allow_all" on headway_rehab.session_exercises
  for all using (true) with check (true);

-- ─── exercise_telemetry ───────────────────────────────────────────────────────
-- Granular per-round data captured invisibly during exercises.
-- metadata (jsonb) holds exercise-specific extras, e.g. pattern length, word category.

create table headway_rehab.exercise_telemetry (
  id                   uuid primary key default gen_random_uuid(),
  session_exercise_id  uuid not null references headway_rehab.session_exercises(id) on delete cascade,
  round_number         integer not null,
  score                integer not null default 0,
  errors               integer not null default 0,
  response_time_ms     integer,
  started_at           timestamptz not null,
  completed_at         timestamptz,
  metadata             jsonb,
  created_at           timestamptz not null default now()
);

alter table headway_rehab.exercise_telemetry enable row level security;
create policy "allow_all" on headway_rehab.exercise_telemetry
  for all using (true) with check (true);

-- ─── ai_insights ──────────────────────────────────────────────────────────────
-- AI-generated content per client. session_id is nullable for cross-session insights.
-- type: session_summary | plateau_alert | regression | recommendation | domain_analysis

create table headway_rehab.ai_insights (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references headway_rehab.clients(id) on delete cascade,
  session_id      uuid references headway_rehab.sessions(id) on delete set null,
  type            text not null check (
                    type in ('session_summary','plateau_alert','regression','recommendation','domain_analysis')
                  ),
  exercise_type   text check (
                    exercise_type in ('memory','pattern','sequence','word','spatial','attention')
                  ),
  content         text not null,
  generated_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

alter table headway_rehab.ai_insights enable row level security;
create policy "allow_all" on headway_rehab.ai_insights
  for all using (true) with check (true);

-- ─── indexes ──────────────────────────────────────────────────────────────────

create index on headway_rehab.clients(professional_id);
create index on headway_rehab.sessions(professional_id);
create index on headway_rehab.sessions(client_id);
create index on headway_rehab.sessions(client_id, started_at desc);
create index on headway_rehab.session_exercises(session_id);
create index on headway_rehab.exercise_telemetry(session_exercise_id);
create index on headway_rehab.ai_insights(client_id);
create index on headway_rehab.ai_insights(session_id);
