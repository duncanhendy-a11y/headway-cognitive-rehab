-- Replace allow_all RLS policies with auth.uid()-scoped policies.
-- Professionals can only see their own clients, sessions, and derived data.
-- Must run AFTER M1 auth is live (policies depend on auth.uid()).

-- ─── helpers ──────────────────────────────────────────────────────────────

-- Returns the headway_rehab.professionals.id for the current auth user.
create or replace function headway_rehab.current_professional_id()
returns uuid language sql stable security definer as $$
  select id from headway_rehab.professionals
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ─── professionals ────────────────────────────────────────────────────────

drop policy if exists "allow_all" on headway_rehab.professionals;

create policy "professionals_own_row" on headway_rehab.professionals
  for all
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Allow insert during sign-up (auth_user_id will equal the new user's id)
create policy "professionals_insert_self" on headway_rehab.professionals
  for insert
  with check (auth_user_id = auth.uid() or auth_user_id is null);

-- ─── clients ──────────────────────────────────────────────────────────────

drop policy if exists "allow_all" on headway_rehab.clients;

create policy "clients_own" on headway_rehab.clients
  for all
  using (professional_id = headway_rehab.current_professional_id())
  with check (professional_id = headway_rehab.current_professional_id());

-- ─── sessions ─────────────────────────────────────────────────────────────

drop policy if exists "allow_all" on headway_rehab.sessions;

create policy "sessions_own" on headway_rehab.sessions
  for all
  using (professional_id = headway_rehab.current_professional_id())
  with check (professional_id = headway_rehab.current_professional_id());

-- ─── session_exercises ────────────────────────────────────────────────────

drop policy if exists "allow_all" on headway_rehab.session_exercises;

create policy "session_exercises_own" on headway_rehab.session_exercises
  for all
  using (
    session_id in (
      select id from headway_rehab.sessions
      where professional_id = headway_rehab.current_professional_id()
    )
  )
  with check (
    session_id in (
      select id from headway_rehab.sessions
      where professional_id = headway_rehab.current_professional_id()
    )
  );

-- ─── exercise_telemetry ───────────────────────────────────────────────────

drop policy if exists "allow_all" on headway_rehab.exercise_telemetry;

create policy "exercise_telemetry_own" on headway_rehab.exercise_telemetry
  for all
  using (
    session_exercise_id in (
      select se.id from headway_rehab.session_exercises se
      join headway_rehab.sessions s on s.id = se.session_id
      where s.professional_id = headway_rehab.current_professional_id()
    )
  )
  with check (
    session_exercise_id in (
      select se.id from headway_rehab.session_exercises se
      join headway_rehab.sessions s on s.id = se.session_id
      where s.professional_id = headway_rehab.current_professional_id()
    )
  );

-- ─── ai_insights ──────────────────────────────────────────────────────────

drop policy if exists "allow_all" on headway_rehab.ai_insights;

create policy "ai_insights_own" on headway_rehab.ai_insights
  for all
  using (
    client_id in (
      select id from headway_rehab.clients
      where professional_id = headway_rehab.current_professional_id()
    )
  )
  with check (
    client_id in (
      select id from headway_rehab.clients
      where professional_id = headway_rehab.current_professional_id()
    )
  );
