-- YojanaSaathi persistence schema.
-- Run this once in the Supabase SQL Editor before setting the Flask environment.

create extension if not exists pgcrypto;

create table if not exists public.citizen_sessions (
  client_session_id text primary key,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.eligibility_submissions (
  id uuid primary key default gen_random_uuid(),
  client_session_id text not null references public.citizen_sessions(client_session_id) on delete cascade,
  profile jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.eligibility_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.eligibility_submissions(id) on delete cascade,
  client_session_id text not null references public.citizen_sessions(client_session_id) on delete cascade,
  scheme_id text not null,
  scheme_name text not null,
  status text not null check (status in ('likely_eligible', 'needs_more_information', 'likely_ineligible')),
  summary text not null,
  matched_criteria jsonb not null default '[]'::jsonb,
  failed_criteria jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  benefit text not null,
  required_documents jsonb not null default '[]'::jsonb,
  official_sources jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tracked_applications (
  id text primary key,
  client_session_id text not null references public.citizen_sessions(client_session_id) on delete cascade,
  scheme_id text not null,
  scheme_name text not null,
  applied_date text not null,
  application_number text not null,
  status text not null check (status in ('DRAFT', 'SUBMITTED', 'UNDER_VERIFICATION', 'APPROVED', 'DISBURSED')),
  stage_description text not null,
  updated_at timestamptz not null default now(),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists eligibility_submissions_session_created_idx
  on public.eligibility_submissions (client_session_id, created_at desc);

create index if not exists eligibility_results_submission_idx
  on public.eligibility_results (submission_id);

create index if not exists tracked_applications_session_idx
  on public.tracked_applications (client_session_id, created_at asc);

alter table public.citizen_sessions enable row level security;
alter table public.eligibility_submissions enable row level security;
alter table public.eligibility_results enable row level security;
alter table public.tracked_applications enable row level security;

-- The Flask service role key bypasses RLS. No browser policy is created because
-- the browser talks only to Flask, keeping the service key off the client.
