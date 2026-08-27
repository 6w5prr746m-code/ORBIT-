-- Multi-entity support: subsidiaries/business units within one
-- organization, with a per-organization choice of how strictly they're
-- isolated from each other — some clients want a hard wall between
-- entities, others just want a filter/grouping. This migration adds the
-- entity itself and assigns people to one; it deliberately does NOT yet
-- change who can see what (that's 0009_rbac.sql, which layers role- and
-- entity-scoped visibility on top once roles exist to scope by).

create table entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index entities_org_idx on entities (organization_id);

alter table organizations add column entity_isolation_mode text not null default 'filter'
  check (entity_isolation_mode in ('strict', 'filter'));

alter table people add column entity_id uuid references entities (id) on delete set null;
create index people_entity_idx on people (entity_id);

alter table entities enable row level security;

create policy entities_select on entities for select using (is_org_readable(organization_id));
create policy entities_write on entities for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
