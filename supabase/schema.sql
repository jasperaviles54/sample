-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists "uuid-ossp";

-- =========================================================
-- Tables
-- =========================================================
create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  address text,
  created_at timestamptz default now()
);

create table if not exists department_windows (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz default now(),
  unique (branch_id, code)
);

create table if not exists surveys (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  window_id uuid not null references department_windows(id) on delete cascade,
  rating text not null check (rating in ('happy','sad')),
  comments text,
  created_at timestamptz default now()
);

create index if not exists idx_surveys_branch on surveys(branch_id);
create index if not exists idx_surveys_window on surveys(window_id);
create index if not exists idx_surveys_created on surveys(created_at desc);
create index if not exists idx_windows_branch on department_windows(branch_id);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table branches enable row level security;
alter table department_windows enable row level security;
alter table surveys enable row level security;

-- Public (anonymous) can read branches and windows so the survey form works
-- without anyone signing in.
drop policy if exists "public_read_branches" on branches;
create policy "public_read_branches"
  on branches for select
  using (true);

drop policy if exists "public_read_windows" on department_windows;
create policy "public_read_windows"
  on department_windows for select
  using (true);

-- Public can submit a survey response.
drop policy if exists "public_insert_surveys" on surveys;
create policy "public_insert_surveys"
  on surveys for insert
  with check (true);

-- Only authenticated admins can read survey results.
drop policy if exists "auth_read_surveys" on surveys;
create policy "auth_read_surveys"
  on surveys for select
  to authenticated
  using (true);

-- Only authenticated admins can mutate branches and windows.
drop policy if exists "auth_manage_branches" on branches;
create policy "auth_manage_branches"
  on branches for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "auth_manage_windows" on department_windows;
create policy "auth_manage_windows"
  on department_windows for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- Optional convenience view
-- =========================================================
create or replace view survey_details as
select
  s.id,
  s.rating,
  s.comments,
  s.created_at,
  b.id   as branch_id,
  b.name as branch_name,
  w.id   as window_id,
  w.name as window_name
from surveys s
join branches b on b.id = s.branch_id
join department_windows w on w.id = s.window_id;
