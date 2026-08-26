-- ORBIT multi-tenant schema.
-- Paste this whole file into the Supabase SQL editor and run it once.

create extension if not exists "pgcrypto";

-- ── Core tables ──────────────────────────────────────────────────────────

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  industry text not null default '',
  size integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Links auth.users to the organization(s) they belong to. This is the root
-- of multi-tenancy: every other table's RLS policy ultimately traces back
-- to a row here.
create table memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create table people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  avatar text,
  job_title text not null,
  department text not null,
  location text not null,
  country text not null,
  bio text not null default '',
  manager_id uuid references people (id) on delete set null,
  start_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  email text not null,
  created_at timestamptz not null default now()
);
create index people_org_idx on people (organization_id);

create table skills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  category text not null check (
    category in ('Technology', 'Business', 'Language', 'Design', 'Operations', 'Leadership')
  ),
  description text not null default '',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index skills_org_idx on skills (organization_id);

create table person_skills (
  organization_id uuid not null references organizations (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  level text not null check (level in ('familiar', 'proficient', 'expert')),
  years_experience integer not null default 0,
  source text not null check (source in ('self-reported', 'inferred', 'verified')),
  primary key (person_id, skill_id)
);
create index person_skills_org_idx on person_skills (organization_id);

create table teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  description text not null default '',
  manager_id uuid references people (id) on delete set null,
  created_at timestamptz not null default now()
);
create index teams_org_idx on teams (organization_id);

create table person_teams (
  organization_id uuid not null references organizations (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  team_id uuid not null references teams (id) on delete cascade,
  primary key (person_id, team_id)
);
create index person_teams_org_idx on person_teams (organization_id);

create table connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  person_a_id uuid not null references people (id) on delete cascade,
  person_b_id uuid not null references people (id) on delete cascade,
  type text not null check (type in ('collaborates-with', 'reports-to', 'peer')),
  strength numeric not null default 0,
  source text not null check (source in ('self-reported', 'inferred', 'verified'))
);
create index connections_org_idx on connections (organization_id);

create table sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  type text not null check (
    type in (
      'core-hr', 'microsoft-365', 'google-workspace', 'slack', 'teams', 'notion', 'jira', 'csv-import'
    )
  ),
  name text not null,
  last_sync_at timestamptz,
  status text not null check (status in ('connected', 'coming-soon', 'syncing', 'error'))
);
create index sources_org_idx on sources (organization_id);
