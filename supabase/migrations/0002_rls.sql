-- Row Level Security: every table is scoped to an organization, and every
-- organization is only visible/writable to its members (plus read-only
-- access to the shared demo organization for any signed-in user).

create or replace function is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships
    where memberships.organization_id = org_id
      and memberships.user_id = auth.uid()
  );
$$;

create or replace function is_org_readable(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organizations
    where organizations.id = org_id
      and (organizations.is_demo = true or is_org_member(org_id))
  );
$$;

-- organizations ─────────────────────────────────────────────────────────
alter table organizations enable row level security;

create policy organizations_select on organizations for select
  using (is_demo = true or is_org_member(id));

create policy organizations_update on organizations for update
  using (exists (
    select 1 from memberships
    where organization_id = id and user_id = auth.uid() and role = 'owner'
  ))
  with check (exists (
    select 1 from memberships
    where organization_id = id and user_id = auth.uid() and role = 'owner'
  ));

-- No insert/delete policy: organizations are only created via the
-- create_organization() function below, which runs with elevated
-- privileges so it can atomically create the org AND the owner membership
-- (a plain client-side insert policy can't express "and also give me a
-- membership row" safely).

-- memberships ───────────────────────────────────────────────────────────
alter table memberships enable row level security;

create policy memberships_select on memberships for select
  using (user_id = auth.uid());

-- No insert/update/delete policy: memberships are only ever created via
-- create_organization(). A direct insert policy here would let any
-- authenticated user grant themselves access to someone else's org by id.

-- Every remaining table follows the same shape: readable if the org is
-- readable (member or demo), writable only if the user is an actual member
-- (so the shared demo org can never be edited by anyone).

alter table people enable row level security;
create policy people_select on people for select using (is_org_readable(organization_id));
create policy people_write on people for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table skills enable row level security;
create policy skills_select on skills for select using (is_org_readable(organization_id));
create policy skills_write on skills for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table person_skills enable row level security;
create policy person_skills_select on person_skills for select using (is_org_readable(organization_id));
create policy person_skills_write on person_skills for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table teams enable row level security;
create policy teams_select on teams for select using (is_org_readable(organization_id));
create policy teams_write on teams for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table person_teams enable row level security;
create policy person_teams_select on person_teams for select using (is_org_readable(organization_id));
create policy person_teams_write on person_teams for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table connections enable row level security;
create policy connections_select on connections for select using (is_org_readable(organization_id));
create policy connections_write on connections for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table sources enable row level security;
create policy sources_select on sources for select using (is_org_readable(organization_id));
create policy sources_write on sources for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
