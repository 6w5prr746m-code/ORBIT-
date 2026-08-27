-- Role-based access control: four fixed roles on top of the existing
-- owner/member memberships, and entity-scoped visibility of `people` (and
-- the tables that hang off a specific person) when an organization has
-- switched entity_isolation_mode to 'strict' (0008_entities.sql).
--
-- Design goals:
--   * 100% backward compatible: every existing membership is 'owner' or
--     'member', and both keep exactly the full-access behavior they have
--     today. Nothing changes for an organization that never touches roles.
--   * Only SELECT is scoped here. The write model stays the existing
--     "any org member can write anything in their org" (0002_rls.sql) —
--     narrowing writes per role is a larger change than what was asked for
--     ("donner une vue") and can follow once invitations exist and roles
--     are actually assigned to real accounts.
--   * 'filter' isolation mode (the default) never restricts visibility,
--     whatever the viewer's role — isolation only bites in 'strict' mode.

alter table memberships drop constraint if exists memberships_role_check;
alter table memberships add constraint memberships_role_check
  check (role in ('owner', 'member', 'hr_admin', 'director', 'manager', 'collaborator'));

-- Which entity a scoped member (director/manager/collaborator) belongs to.
-- Irrelevant for owner/member/hr_admin, who already see everything.
alter table memberships add column entity_id uuid references entities (id) on delete set null;

create or replace function is_org_admin(org_id uuid)
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
      and memberships.role in ('owner', 'hr_admin')
  );
$$;

-- Central visibility rule for a single person. Every person-scoped SELECT
-- policy below is just "can_view_person(the relevant person id)" — keeping
-- the actual logic in one place instead of re-deriving it per table.
create or replace function can_view_person(target_person_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  target record;
  viewer record;
  strict_mode boolean;
begin
  select p.id, p.organization_id, p.entity_id, p.manager_id
    into target
    from people p
    where p.id = target_person_id;

  if target.id is null then
    return false;
  end if;

  -- Shared demo org: readable by any signed-in user, same as today.
  if exists (select 1 from organizations o where o.id = target.organization_id and o.is_demo = true) then
    return true;
  end if;

  -- Everyone can always see their own profile.
  if exists (
    select 1 from people me
    where me.id = target.id and me.claimed_by_user_id = auth.uid()
  ) then
    return true;
  end if;

  select m.role, m.entity_id
    into viewer
    from memberships m
    where m.organization_id = target.organization_id and m.user_id = auth.uid();

  if viewer.role is null then
    return false;
  end if;

  -- Legacy roles: full access, unchanged from before RBAC existed.
  if viewer.role in ('owner', 'member') then
    return true;
  end if;

  -- HR admin: sees everyone in the org, isolation mode notwithstanding.
  if viewer.role = 'hr_admin' then
    return true;
  end if;

  select (o.entity_isolation_mode = 'strict') into strict_mode
    from organizations o where o.id = target.organization_id;

  -- 'filter' mode: entities are just a grouping, not a wall.
  if not strict_mode then
    return true;
  end if;

  if viewer.role = 'director' then
    return viewer.entity_id is not null and viewer.entity_id = target.entity_id;
  end if;

  if viewer.role = 'manager' then
    -- v1: direct reports only (no transitive chain).
    return exists (
      select 1 from people me
      where me.claimed_by_user_id = auth.uid()
        and me.organization_id = target.organization_id
        and me.id = target.manager_id
    );
  end if;

  -- collaborator (and any future default): same entity only.
  return viewer.entity_id is not null and viewer.entity_id = target.entity_id;
end;
$$;

drop policy if exists people_select on people;
create policy people_select on people for select using (can_view_person(id));

drop policy if exists person_skills_select on person_skills;
create policy person_skills_select on person_skills for select using (can_view_person(person_id));

drop policy if exists person_teams_select on person_teams;
create policy person_teams_select on person_teams for select using (can_view_person(person_id));

drop policy if exists connections_select on connections;
create policy connections_select on connections for select
  using (can_view_person(person_a_id) and can_view_person(person_b_id));

drop policy if exists skill_endorsements_select on skill_endorsements;
create policy skill_endorsements_select on skill_endorsements for select
  using (can_view_person(person_id) and can_view_person(endorsed_by_person_id));

-- memberships: owners/hr_admins can see and manage the whole roster (needed
-- for the "Team & access" admin screen); everyone else still only sees
-- their own row, same as before RBAC.
drop policy if exists memberships_select on memberships;
create policy memberships_select on memberships for select
  using (user_id = auth.uid() or is_org_admin(organization_id));

-- Admins may only assign the four new scoped roles through this policy —
-- granting 'owner' or resetting to legacy 'member' stays outside the UI's
-- reach, so this can't be used to escalate privilege.
create policy memberships_update on memberships for update
  using (is_org_admin(organization_id))
  with check (is_org_admin(organization_id) and role in ('hr_admin', 'director', 'manager', 'collaborator'));
