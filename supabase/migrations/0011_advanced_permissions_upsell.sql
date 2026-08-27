-- Advanced permissions upsell: a vendor-controlled feature flag per
-- organization, plus a request/notify flow so a client's own admins can
-- ask for it — without being able to just flip it on themselves.
--
-- The flag deliberately lives in its own table rather than as a new
-- column on `organizations`: organizations_update (0002_rls.sql) lets any
-- owner update their own org row with no column restriction, which would
-- let them grant themselves the paid feature directly. This table has no
-- insert/update/delete policy at all, so the only way to flip it is via
-- the Supabase SQL editor (i.e. the vendor, with full DB access) — the
-- same "no client policy" pattern already used for `memberships`.

create table organization_features (
  organization_id uuid primary key references organizations (id) on delete cascade,
  advanced_permissions_enabled boolean not null default false
);

insert into organization_features (organization_id, advanced_permissions_enabled)
select id, false from organizations
on conflict (organization_id) do nothing;

alter table organization_features enable row level security;
create policy organization_features_select on organization_features for select
  using (is_org_readable(organization_id));

-- create_organization() needs to also seed a features row for every new
-- org from here on; redefining it (same signature) rather than editing
-- 0003_functions.sql, consistent with how 0009 evolved memberships_select.
create or replace function create_organization(org_name text, org_industry text, org_size integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into organizations (name, industry, size, is_demo)
  values (org_name, org_industry, org_size, false)
  returning id into new_org_id;

  insert into memberships (user_id, organization_id, role)
  values (auth.uid(), new_org_id, 'owner');

  insert into organization_features (organization_id, advanced_permissions_enabled)
  values (new_org_id, false);

  insert into sources (organization_id, type, name, status) values
    (new_org_id, 'core-hr', 'Core HR', 'coming-soon'),
    (new_org_id, 'microsoft-365', 'Microsoft 365', 'coming-soon'),
    (new_org_id, 'google-workspace', 'Google Workspace', 'coming-soon'),
    (new_org_id, 'slack', 'Slack', 'coming-soon'),
    (new_org_id, 'teams', 'Microsoft Teams', 'coming-soon'),
    (new_org_id, 'notion', 'Notion', 'coming-soon'),
    (new_org_id, 'jira', 'Jira', 'coming-soon');

  return new_org_id;
end;
$$;

-- upgrade_requests: one row per "please activate this" click, so the
-- vendor has a durable log even if an email gets lost, and so the UI can
-- show "request sent, we'll be in touch" instead of a dead-end button.
create table upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index upgrade_requests_org_idx on upgrade_requests (organization_id);

alter table upgrade_requests enable row level security;

-- Same loose "any org member" model as everywhere else (0002_rls.sql) —
-- an upgrade request doesn't grant anything by itself (only the vendor,
-- via organization_features, can actually enable the feature), so there's
-- no privilege-escalation risk in letting any member write one.
create policy upgrade_requests_select on upgrade_requests for select using (is_org_member(organization_id));
create policy upgrade_requests_write on upgrade_requests for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
