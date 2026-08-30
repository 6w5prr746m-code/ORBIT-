-- Custom roles: the actual feature behind the advanced-permissions
-- upsell (0011). Once organization_features.advanced_permissions_enabled
-- is true, an org can define named roles with a fine-grained permission
-- set (which pages are visible, which admin actions are allowed) and
-- assign members to them.
--
-- This is additive on top of the existing 4-role RBAC, not a
-- replacement: a custom role still carries a `base_role` (director /
-- manager / collaborator) that continues to drive can_view_person()'s
-- entity-scoping (0009_rbac.sql) exactly as before. Custom roles only
-- add a second, independent layer — which pages/actions a member sees —
-- checked at the application layer, not RLS. The security-critical
-- who-sees-whom logic is unchanged and unaffected by this migration.

create table custom_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  base_role text not null check (base_role in ('director', 'manager', 'collaborator')),
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index custom_roles_org_idx on custom_roles (organization_id);

alter table custom_roles enable row level security;

-- Same loose "any org member" model as most other tables (0002_rls.sql).
-- The advanced_permissions_enabled gate itself (which orgs even get to
-- use this) is enforced at the application layer by checking
-- organization_features, same as every other feature-flagged screen.
create policy custom_roles_select on custom_roles for select using (is_org_readable(organization_id));
create policy custom_roles_write on custom_roles for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

-- A membership can optionally point at a custom role. When set, the app
-- reads custom_roles.permissions for page/action visibility instead of
-- the built-in default for that base role. memberships.role keeps
-- driving can_view_person() either way — assigning a custom role always
-- sets memberships.role to the custom role's base_role in the same
-- update, so the two never drift apart.
alter table memberships add column custom_role_id uuid references custom_roles (id) on delete set null;
